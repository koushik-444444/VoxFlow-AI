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
  activeService: 'chat' | 'writer'
  sidebarOpen: boolean
  isTranscribing: boolean
  assistantIsThinking: boolean
  writerContent: string
  setService: (service: 'chat' | 'writer') => void
  setWriterContent: (content: string) => void
  toggleSidebar: () => void
  setIsTranscribing: (value: boolean) => void
  setAssistantIsThinking: (value: boolean) => void
}


function formatUrls(url: string) {
  if (!url) return ''
  // Remove trailing slash
  let clean = url.replace(/\/$/, '')
  // If it's a HF spaces URL (ui version), convert to direct app version
  if (clean.includes('huggingface.co/spaces/')) {
    const parts = clean.split('huggingface.co/spaces/')[1].split('/')
    const user = parts[0]
    const space = parts[1]
    clean = `https://${user}-${space}.hf.space`
    console.warn('Converting HF UI URL to direct app URL:', clean)
  }
  return clean
}

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_URL = formatUrls(rawApiUrl)

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
  (API_URL.startsWith('https') ? API_URL.replace('https', 'wss') : API_URL.replace('http', 'ws'))

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Session
      sessionId: null,
      isInitialized: false,

      initializeSession: async () => {
        try {
          console.log('Initializing session with API:', API_URL)
          const response = await fetch(`${API_URL}/api/v1/session/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })

          if (response.ok) {
            const data = await response.json()
            console.log('Session initialized:', data.id)
            set({ sessionId: data.id, isInitialized: true })
            get().connectWebSocket()
          } else {
            console.error('Failed to initialize session:', response.status, response.statusText)
            set({ wsStatus: 'error' })
          }
        } catch (error) {
          console.error('Failed to initialize session:', error)
          set({ wsStatus: 'error' })
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
        const { sessionId, wsConnection } = get()
        if (!sessionId) return
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) return

        console.log('Connecting to WebSocket:', WS_URL)
        
        try {
          const ws = new WebSocket(`${WS_URL}/ws/audio-stream?session_id=${sessionId}`)

          ws.onopen = () => {
            set({ wsStatus: 'connected' })
            console.log('WebSocket connected')
            
            // Start heartbeat
            const interval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }))
              } else {
                clearInterval(interval)
              }
            }, 30000)
          }

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data)
              handleWebSocketMessage(data, get(), set)
            } catch (err) {
              console.warn('Received non-JSON message:', event.data)
            }
          }

          ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason)
            set({ wsStatus: 'disconnected', wsConnection: null })
            
            // Attempt to reconnect after 3 seconds if not intentionally closed
            if (event.code !== 1000) {
              setTimeout(() => {
                const currentSessionId = get().sessionId
                if (currentSessionId) {
                  get().connectWebSocket()
                }
              }, 3000)
            }
          }

          ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            set({ wsStatus: 'error' })
          }

          set({ wsConnection: ws, wsStatus: 'connecting' })
        } catch (err) {
          console.error('Failed to create WebSocket:', err)
          set({ wsStatus: 'error' })
        }
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
          // console.log('Sending audio chunk:', data.size)
          wsConnection.send(data)
        } else {
          console.warn('Cannot send audio chunk: WebSocket not connected', wsStatus)
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
      activeService: 'chat',
      sidebarOpen: true,
      isTranscribing: false,
      assistantIsThinking: false,
      writerContent: '',

      setService: (service) => set({ activeService: service }),
      setWriterContent: (content) => set({ writerContent: content }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setIsTranscribing: (value) => set({ isTranscribing: value }),
      setAssistantIsThinking: (value) => set({ assistantIsThinking: value }),
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
      // Final transcription - add to messages
      if (!data.is_partial) {
        state.setIsTranscribing(false)
        state.setAssistantIsThinking(true)
        
        if (state.activeService === 'writer') {
          state.setWriterContent(data.text)
        } else {
          state.addMessage({
            role: 'user',
            content: data.text,
          })
        }
      }
      break

    case 'llm_chunk':
      // Handle streaming LLM response
      if (data.is_final) {
        state.setAssistantIsThinking(false)
        if (state.activeService === 'writer') {
          state.setWriterContent(data.full_response)
        } else {
          state.addMessage({
            role: 'assistant',
            content: data.full_response,
          })
        }
      }
      break

    case 'tts_audio':
      // Handle TTS audio
      if (data.audio) {
        try {
          const binaryString = atob(data.audio)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const audioBlob = new Blob([bytes], { type: 'audio/wav' })
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          audio.play().catch(err => console.warn('Audio playback blocked:', err))
          state.setIsPlaying(true)
          audio.onended = () => {
            state.setIsPlaying(false)
            URL.revokeObjectURL(audioUrl)
          }
        } catch (err) {
          console.error('Error playing audio:', err)
        }
      }
      break

    case 'error':
      console.error('WebSocket message error:', data.message)
      state.setIsTranscribing(false)
      state.setAssistantIsThinking(false)
      break
  }
}
