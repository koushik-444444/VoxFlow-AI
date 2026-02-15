import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStore } from '@/store/useStore'
import type { Conversation } from '@/store/useStore'

// Reset store between tests
beforeEach(() => {
  useStore.setState({
    conversations: [],
    currentConversationId: null,
    sessionId: null,
    isInitialized: false,
    isRecording: false,
    isPlaying: false,
    audioLevel: 0,
    wsConnection: null,
    wsStatus: 'disconnected',
    selectedModel: 'gpt-3.5-turbo',
    selectedVoice: 'default',
    latency: 0,
    activeService: 'chat',
    sidebarOpen: true,
    isTranscribing: false,
    assistantIsThinking: false,
    writerContent: '',
  })
})

describe('useStore - Conversations', () => {
  it('creates a new conversation and sets it as current', () => {
    const id = useStore.getState().createConversation()
    const state = useStore.getState()

    expect(state.conversations).toHaveLength(1)
    expect(state.currentConversationId).toBe(id)
    expect(state.conversations[0].title).toBe('New Conversation')
    expect(state.conversations[0].messages).toEqual([])
  })

  it('adds a message to the current conversation', () => {
    const id = useStore.getState().createConversation()
    useStore.getState().addMessage({ role: 'user', content: 'Hello' })

    const state = useStore.getState()
    const conv = state.conversations.find((c) => c.id === id)!

    expect(conv.messages).toHaveLength(1)
    expect(conv.messages[0].role).toBe('user')
    expect(conv.messages[0].content).toBe('Hello')
    expect(conv.messages[0].id).toBeDefined()
    expect(conv.messages[0].timestamp).toBeInstanceOf(Date)
  })

  it('creates a new conversation if addMessage is called with no current', () => {
    useStore.getState().addMessage({ role: 'user', content: 'Test message' })

    const state = useStore.getState()
    expect(state.conversations).toHaveLength(1)
    expect(state.currentConversationId).toBe(state.conversations[0].id)
    expect(state.conversations[0].messages).toHaveLength(1)
  })

  it('updates a message by id', () => {
    useStore.getState().createConversation()
    useStore.getState().addMessage({ role: 'assistant', content: 'Original' })

    const msgId = useStore.getState().conversations[0].messages[0].id
    useStore.getState().updateMessage(msgId, { content: 'Updated' })

    const msg = useStore.getState().conversations[0].messages[0]
    expect(msg.content).toBe('Updated')
  })

  it('deletes a conversation and selects the next one', () => {
    const id1 = useStore.getState().createConversation()
    const id2 = useStore.getState().createConversation()

    // id2 is now current (prepended)
    expect(useStore.getState().currentConversationId).toBe(id2)

    useStore.getState().deleteConversation(id2)
    const state = useStore.getState()

    expect(state.conversations).toHaveLength(1)
    expect(state.currentConversationId).toBe(id1)
  })

  it('deletes last conversation and sets current to null', () => {
    const id = useStore.getState().createConversation()
    useStore.getState().deleteConversation(id)

    const state = useStore.getState()
    expect(state.conversations).toHaveLength(0)
    expect(state.currentConversationId).toBeNull()
  })

  it('deleteConversation does NOT fall back to the deleted conversation', () => {
    // This was a bug: deleteConversation used state.conversations[0] before filtering
    const id1 = useStore.getState().createConversation()
    const id2 = useStore.getState().createConversation()

    // conversations order: [id2, id1] (newest first)
    // current = id2
    useStore.getState().deleteConversation(id2)

    // After deleting id2, current should be id1 (from filtered list), NOT id2
    const state = useStore.getState()
    expect(state.currentConversationId).toBe(id1)
    expect(state.conversations.find((c) => c.id === id2)).toBeUndefined()
  })

  it('clears all conversations', () => {
    useStore.getState().createConversation()
    useStore.getState().createConversation()
    useStore.getState().clearConversations()

    const state = useStore.getState()
    expect(state.conversations).toHaveLength(0)
    expect(state.currentConversationId).toBeNull()
  })

  it('sets current conversation', () => {
    const id1 = useStore.getState().createConversation()
    const id2 = useStore.getState().createConversation()

    useStore.getState().setCurrentConversation(id1)
    expect(useStore.getState().currentConversationId).toBe(id1)
  })
})

describe('useStore - UI State', () => {
  it('toggles sidebar', () => {
    expect(useStore.getState().sidebarOpen).toBe(true)
    useStore.getState().toggleSidebar()
    expect(useStore.getState().sidebarOpen).toBe(false)
    useStore.getState().toggleSidebar()
    expect(useStore.getState().sidebarOpen).toBe(true)
  })

  it('sets active service', () => {
    useStore.getState().setService('writer')
    expect(useStore.getState().activeService).toBe('writer')
    useStore.getState().setService('chat')
    expect(useStore.getState().activeService).toBe('chat')
  })

  it('sets writer content', () => {
    useStore.getState().setWriterContent('Hello world')
    expect(useStore.getState().writerContent).toBe('Hello world')
  })

  it('sets transcribing state', () => {
    useStore.getState().setIsTranscribing(true)
    expect(useStore.getState().isTranscribing).toBe(true)
    useStore.getState().setIsTranscribing(false)
    expect(useStore.getState().isTranscribing).toBe(false)
  })

  it('sets assistant thinking state', () => {
    useStore.getState().setAssistantIsThinking(true)
    expect(useStore.getState().assistantIsThinking).toBe(true)
  })
})

describe('useStore - Audio State', () => {
  it('sets recording state', () => {
    useStore.getState().setIsRecording(true)
    expect(useStore.getState().isRecording).toBe(true)
  })

  it('sets playing state', () => {
    useStore.getState().setIsPlaying(true)
    expect(useStore.getState().isPlaying).toBe(true)
  })

  it('sets audio level', () => {
    useStore.getState().setAudioLevel(0.75)
    expect(useStore.getState().audioLevel).toBe(0.75)
  })
})

describe('useStore - Settings', () => {
  it('sets selected model', () => {
    useStore.getState().setSelectedModel('gpt-4')
    expect(useStore.getState().selectedModel).toBe('gpt-4')
  })

  it('sets selected voice', () => {
    useStore.getState().setSelectedVoice('en-US-EmmaNeural')
    expect(useStore.getState().selectedVoice).toBe('en-US-EmmaNeural')
  })

  it('sets latency', () => {
    useStore.getState().setLatency(150)
    expect(useStore.getState().latency).toBe(150)
  })
})
