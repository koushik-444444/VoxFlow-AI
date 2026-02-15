import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

// Track heartbeat interval outside the store to avoid serialization issues
let heartbeatInterval: ReturnType<typeof setInterval> | null = null

// Shared audio element for global playback control
let globalAudioElement: HTMLAudioElement | null = null

// Buffer for accumulating binary TTS audio chunks from WebSocket
let ttsAudioChunks: Uint8Array[] = []
let ttsIsStreaming = false

function clearHeartbeat() {
  if (heartbeatInterval !== null) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
}

function stopGlobalAudio() {
  if (globalAudioElement) {
    globalAudioElement.pause()
    globalAudioElement.src = ''
    globalAudioElement = null
  }
}

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

// ── WebSocket Protocol Types ──────────────────────────────────────────
// Incoming messages from the server
export type WSIncomingMessage =
  | { type: 'transcription'; text: string; is_partial: boolean }
  | { type: 'llm_chunk'; content: string; is_final: boolean; full_response?: string }
  | { type: 'tts_audio'; audio: string; format: string }
  | { type: 'tts_start'; format: string }
  | { type: 'tts_end' }
  | { type: 'error'; message: string }
  | { type: 'pong' }

// Outgoing messages to the server
export type WSOutgoingMessage =
  | { type: 'start_recording' }
  | { type: 'end_of_speech' }
  | { type: 'text_message'; text: string }
  | { type: 'interrupt' }
  | { type: 'ping' }

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
  currentlyPlayingId: string | null
  playbackStatus: 'playing' | 'paused' | 'stopped'
  audioLevel: number
  setIsRecording: (value: boolean) => void
  setIsPlaying: (value: boolean) => void
  setPlaybackStatus: (status: 'playing' | 'paused' | 'stopped', id?: string | null) => void
  setAudioLevel: (value: number) => void
  
  // Audio Control Methods
  playAudio: (id: string, url: string) => void
  pauseAudio: () => void
  stopAudio: () => void

  // WebSocket
  wsConnection: WebSocket | null
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  connectWebSocket: () => void
  disconnectWebSocket: () => void
  sendAudioChunk: (data: Blob) => void
  sendInterrupt: () => void
  sendTextMessage: (text: string) => void

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
  isVADEnabled: boolean
  vadStatus: 'loading' | 'active' | 'error' | 'idle'
  setVADEnabled: (value: boolean) => void
  setVADStatus: (status: 'loading' | 'active' | 'error' | 'idle') => void
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
        set((state) => {
          const remaining = state.conversations.filter((c) => c.id !== id)
          return {
            conversations: remaining,
            currentConversationId:
              state.currentConversationId === id
                ? remaining[0]?.id || null
                : state.currentConversationId,
          }
        })
      },

      clearConversations: () => {
        set({ conversations: [], currentConversationId: null })
      },

      // Audio
      isRecording: false,
      isPlaying: false,
      currentlyPlayingId: null,
      playbackStatus: 'stopped',
      audioLevel: 0,

      setIsRecording: (value) => set({ isRecording: value }),
      setIsPlaying: (value) => set({ isPlaying: value }),
      setPlaybackStatus: (status, id = null) => {
        set((state) => ({
          playbackStatus: status,
          currentlyPlayingId: id !== undefined ? id : state.currentlyPlayingId,
          isPlaying: status === 'playing',
        }))
      },
      setAudioLevel: (value) => set({ audioLevel: value }),

      playAudio: (id, url) => {
        const { playbackStatus, currentlyPlayingId } = get()
        
        // If resuming paused audio
        if (playbackStatus === 'paused' && currentlyPlayingId === id && globalAudioElement) {
          globalAudioElement.play().catch(err => console.warn('Audio resume failed:', err))
          set({ playbackStatus: 'playing', isPlaying: true })
          return
        }

        // Stop current audio if any
        stopGlobalAudio()

        // Create and play new audio
        const audio = new Audio(url)
        globalAudioElement = audio
        set({ playbackStatus: 'playing', currentlyPlayingId: id, isPlaying: true })

        audio.play().catch(err => {
          console.warn('Audio play failed:', err)
          set({ playbackStatus: 'stopped', currentlyPlayingId: null, isPlaying: false })
        })

        audio.onended = () => {
          set({ playbackStatus: 'stopped', currentlyPlayingId: null, isPlaying: false })
          globalAudioElement = null
        }
      },

      pauseAudio: () => {
        if (globalAudioElement) {
          globalAudioElement.pause()
          set({ playbackStatus: 'paused', isPlaying: false })
        }
      },

      stopAudio: () => {
        stopGlobalAudio()
        set({ playbackStatus: 'stopped', currentlyPlayingId: null, isPlaying: false })
      },

      // WebSocket
      wsConnection: null,
      wsStatus: 'disconnected',

      connectWebSocket: () => {
        const { sessionId, wsConnection } = get()
        if (!sessionId) return
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) return

        // Clear any stale heartbeat from a previous connection
        clearHeartbeat()

        console.log('Connecting to WebSocket:', WS_URL)
        
        try {
          const ws = new WebSocket(`${WS_URL}/ws/audio-stream?session_id=${sessionId}`)

          ws.onopen = () => {
            set({ wsStatus: 'connected' })
            console.log('WebSocket connected')
            
            // Start heartbeat (clear first to prevent duplicates)
            clearHeartbeat()
            heartbeatInterval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }))
              } else {
                clearHeartbeat()
              }
            }, 30000)
          }

          ws.onmessage = (event) => {
            // Binary frame: raw TTS audio chunk
            if (event.data instanceof Blob) {
              event.data.arrayBuffer().then((buf) => {
                ttsAudioChunks.push(new Uint8Array(buf))
              })
              return
            }

            try {
              const data = JSON.parse(event.data) as WSIncomingMessage
              if (data.type) {
                handleWebSocketMessage(data, get(), set)
              }
            } catch (err) {
              console.warn('Received non-JSON message:', event.data)
            }
          }

          ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason)
            clearHeartbeat()
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
        clearHeartbeat()
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

      sendTextMessage: (text: string) => {
        const { wsConnection, wsStatus } = get()
        if (wsConnection && wsStatus === 'connected') {
          const msg: WSOutgoingMessage = { type: 'text_message', text }
          wsConnection.send(JSON.stringify(msg))
          
          // Add user message to UI immediately
          get().addMessage({
            role: 'user',
            content: text,
          })
          set({ assistantIsThinking: true })
        } else {
          console.warn('Cannot send text message: WebSocket not connected', wsStatus)
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
      isVADEnabled: true,
      vadStatus: 'idle',

      setVADEnabled: (value) => set({ isVADEnabled: value }),
      setVADStatus: (status) => set({ vadStatus: status }),
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
  data: WSIncomingMessage,
  state: AppState,
  set: (fn: (state: AppState) => Partial<AppState>) => void
) {
  switch (data.type) {
    case 'transcription':
      // Final or partial transcription
      if (state.activeService === 'writer') {
        state.setWriterContent(data.text)
      }

      if (!data.is_partial) {
        state.setIsTranscribing(false)
        state.setAssistantIsThinking(true)
        
        if (state.activeService !== 'writer') {
          state.addMessage({
            role: 'user',
            content: data.text,
          })
        }
      }
      break

    case 'llm_chunk':
      // Handle streaming LLM response
      if (data.is_final && data.full_response) {
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
      // Handle TTS audio (base64 fallback path)
      if (data.audio) {
        try {
          const binaryString = atob(data.audio)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const audioBlob = new Blob([bytes], { type: 'audio/wav' })
          const audioUrl = URL.createObjectURL(audioBlob)
          
          // Find the latest assistant message to attach the audio to
          const currentConversation = state.conversations.find(c => c.id === state.currentConversationId)
          if (currentConversation) {
            const assistantMessages = currentConversation.messages.filter(m => m.role === 'assistant')
            const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]
            if (lastAssistantMessage) {
              state.updateMessage(lastAssistantMessage.id, { audioUrl })
              state.playAudio(lastAssistantMessage.id, audioUrl)
            } else {
              state.playAudio('auto-play', audioUrl)
            }
          } else {
            state.playAudio('auto-play', audioUrl)
          }
        } catch (err) {
          console.error('Error playing audio:', err)
        }
      }
      break

    case 'tts_start':
      // Server is about to stream binary audio frames
      ttsAudioChunks = []
      ttsIsStreaming = true
      break

    case 'tts_end':
      // Server finished streaming — concatenate chunks and play
      ttsIsStreaming = false
      if (ttsAudioChunks.length > 0) {
        try {
          const totalLength = ttsAudioChunks.reduce((sum, c) => sum + c.length, 0)
          const merged = new Uint8Array(totalLength)
          let offset = 0
          for (const chunk of ttsAudioChunks) {
            merged.set(chunk, offset)
            offset += chunk.length
          }
          ttsAudioChunks = []
          const audioBlob = new Blob([merged], { type: 'audio/mpeg' })
          const audioUrl = URL.createObjectURL(audioBlob)

          // Find the latest assistant message to attach the audio to
          const currentConversation = state.conversations.find(c => c.id === state.currentConversationId)
          if (currentConversation) {
            const assistantMessages = currentConversation.messages.filter(m => m.role === 'assistant')
            const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]
            if (lastAssistantMessage) {
              state.updateMessage(lastAssistantMessage.id, { audioUrl })
              state.playAudio(lastAssistantMessage.id, audioUrl)
            } else {
              state.playAudio('auto-play', audioUrl)
            }
          } else {
            state.playAudio('auto-play', audioUrl)
          }
        } catch (err) {
          console.error('Error playing streamed audio:', err)
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
