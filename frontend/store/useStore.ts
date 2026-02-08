import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  audioUrl?: string
  isStreaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface AppState {
  // Session
  sessionId: string | null
  isInitialized: boolean
  initializeSession: () => Promise<void>

  // Conversations
  conversations: Conversation[]
  currentConversationId: string | null
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  setCurrentConversation: (id: string) => void
  createConversation: () => string
  deleteConversation: (id: string) => void
  clearConversations: () => void

  // Audio
  isRecording: boolean
  isPlaying: boolean
  audioLevel: number
  setIsRecording: (value: boolean) => void
  setIsPlaying: (value: boolean) => void
  setAudioLevel: (value: number) => void

  // WebSocket
  wsConnection: WebSocket | null
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  connectWebSocket: () => void
  disconnectWebSocket: () => void
  sendAudioChunk: (data: Blob) => void
  sendInterrupt: () => void

  // Settings
  selectedModel: string
  selectedVoice: string
  setSelectedModel: (model: string) => void
  setSelectedVoice: (voice: string) => void

  // Performance
  latency: number
  setLatency: (value: number) => void

  // UI
  sidebarOpen: boolean
  toggleSidebar: () => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Session
      sessionId: null,
      isInitialized: false,

      initializeSession: async () => {
        try {
          const response = await fetch(`${API_URL}/api/v1/session/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })

          if (response.ok) {
            const data = await response.json()
            set({ sessionId: data.id, isInitialized: true })
            get().connectWebSocket()
          }
        } catch (error) {
          console.error('Failed to initialize session:', error)
        }
      },

      // Conversations
      conversations: [],
      currentConversationId: null,

      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: uuidv4(),
          timestamp: new Date(),
        }

        set((state) => {
          const conversationId = state.currentConversationId
          if (!conversationId) {
            const newId = uuidv4()
            const newConversation: Conversation = {
              id: newId,
              title: message.content.slice(0, 50) + '...',
              messages: [newMessage],
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            return {
              conversations: [newConversation, ...state.conversations],
              currentConversationId: newId,
            }
          }

          return {
            conversations: state.conversations.map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    messages: [...conv.messages, newMessage],
                    updatedAt: new Date(),
                  }
                : conv
            ),
          }
        })
      },

      updateMessage: (id, updates) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === state.currentConversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === id ? { ...msg, ...updates } : msg
                  ),
                }
              : conv
          ),
        }))
      },

      setCurrentConversation: (id) => {
        set({ currentConversationId: id })
      },

      createConversation: () => {
        const id = uuidv4()
        const newConversation: Conversation = {
          id,
          title: 'New Conversation',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
        }))
        return id
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          currentConversationId:
            state.currentConversationId === id
              ? state.conversations[0]?.id || null
              : state.currentConversationId,
        }))
      },

      clearConversations: () => {
        set({ conversations: [], currentConversationId: null })
      },

      // Audio
      isRecording: false,
      isPlaying: false,
      audioLevel: 0,

      setIsRecording: (value) => set({ isRecording: value }),
      setIsPlaying: (value) => set({ isPlaying: value }),
      setAudioLevel: (value) => set({ audioLevel: value }),

      // WebSocket
      wsConnection: null,
      wsStatus: 'disconnected',

      connectWebSocket: () => {
        const { sessionId } = get()
        if (!sessionId) return

        const ws = new WebSocket(`${WS_URL}/ws/audio-stream?session_id=${sessionId}`)

        ws.onopen = () => {
          set({ wsStatus: 'connected' })
          console.log('WebSocket connected')
        }

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data)
          handleWebSocketMessage(data, get(), set)
        }

        ws.onclose = () => {
          set({ wsStatus: 'disconnected', wsConnection: null })
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          set({ wsStatus: 'error' })
        }

        set({ wsConnection: ws, wsStatus: 'connecting' })
      },

      disconnectWebSocket: () => {
        const { wsConnection } = get()
        if (wsConnection) {
          wsConnection.close()
          set({ wsConnection: null, wsStatus: 'disconnected' })
        }
      },

      sendAudioChunk: (data) => {
        const { wsConnection, wsStatus } = get()
        if (wsConnection && wsStatus === 'connected') {
          wsConnection.send(data)
        }
      },

      sendInterrupt: () => {
        const { wsConnection, wsStatus } = get()
        if (wsConnection && wsStatus === 'connected') {
          wsConnection.send(JSON.stringify({ type: 'interrupt' }))
        }
      },

      // Settings
      selectedModel: 'gpt-3.5-turbo',
      selectedVoice: 'default',

      setSelectedModel: (model) => set({ selectedModel: model }),
      setSelectedVoice: (voice) => set({ selectedVoice: voice }),

      // Performance
      latency: 0,
      setLatency: (value) => set({ latency: value }),

      // UI
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'speech-ai-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        selectedModel: state.selectedModel,
        selectedVoice: state.selectedVoice,
      }),
    }
  )
)

function handleWebSocketMessage(
  data: any,
  state: AppState,
  set: (fn: (state: AppState) => Partial<AppState>) => void
) {
  switch (data.type) {
    case 'transcription':
      // Handle partial transcription
      if (data.is_partial) {
        // Update UI with partial transcript
      } else {
        // Final transcription - add to messages
        state.addMessage({
          role: 'user',
          content: data.text,
        })
      }
      break

    case 'llm_chunk':
      // Handle streaming LLM response
      if (data.is_final) {
        state.addMessage({
          role: 'assistant',
          content: data.full_response,
        })
      }
      break

    case 'tts_audio':
      // Handle TTS audio
      if (data.audio) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))],
          { type: 'audio/wav' }
        )
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audio.play()
        state.setIsPlaying(true)
        audio.onended = () => state.setIsPlaying(false)
      }
      break

    case 'error':
      console.error('WebSocket error:', data.message)
      break

    case 'pong':
      // Heartbeat response
      break
  }
}
