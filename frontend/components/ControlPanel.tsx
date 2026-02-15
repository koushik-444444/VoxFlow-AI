'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, RefreshCw, ChevronDown, Wrench, ArrowUp, Settings2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'

export function ControlPanel() {
  const isRecording = useStore((s) => s.isRecording)
  const sendAudioChunk = useStore((s) => s.sendAudioChunk)
  const sendInterrupt = useStore((s) => s.sendInterrupt)
  const wsStatus = useStore((s) => s.wsStatus)
  const setIsTranscribing = useStore((s) => s.setIsTranscribing)
  const wsConnection = useStore((s) => s.wsConnection)
  const assistantIsThinking = useStore((s) => s.assistantIsThinking)
  const sendTextMessage = useStore((s) => s.sendTextMessage)

  const [showSettings, setShowSettings] = useState(false)
  const [inputText, setInputText] = useState('')

  const {
    startRecording,
    stopRecording,
  } = useAudioRecorder({
    onDataAvailable: (data) => {
      if (data.size > 0) {
        sendAudioChunk(data)
      }
    },
    onStop: () => {
      const { wsConnection: ws, wsStatus: status } = useStore.getState()
      if (ws && status === 'connected') {
        ws.send(JSON.stringify({ type: 'end_of_speech' }))
      }
    },
    onError: (error) => {
      console.error('Recorder error:', error)
    }
  })

  const handleToggle = () => {
    const isWsConnected = wsConnection && wsStatus === 'connected'

    if (isRecording) {
      stopRecording()
      setIsTranscribing(true)
    } else {
      if (isWsConnected) {
        wsConnection.send(JSON.stringify({ type: 'start_recording' }))
      }
      startRecording()
    }
  }

  const handleSendText = () => {
    if (inputText.trim()) {
      sendTextMessage(inputText.trim())
      setInputText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  const handleInterrupt = () => {
    sendInterrupt()
  }

  const isConnected = wsStatus === 'connected'
  const isConnecting = wsStatus === 'connecting'

  return (
    <div className="flex-shrink-0 pb-6 pt-2 px-4 md:px-0 w-full max-w-3xl mx-auto z-20">
      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-3 p-5 glass-panel rounded-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <VoiceSelector />
              <ModelInfo />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Bar */}
      <div className="relative flex items-center gap-2 glass-input rounded-2xl pl-3 pr-2 py-1.5 group">
        {/* Reset/Interrupt */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleInterrupt}
          disabled={!isConnected}
          className="p-2 text-gemini-muted hover:text-white rounded-xl hover:bg-gemini-hover transition-all disabled:opacity-20"
          aria-label="Reset conversation"
        >
          <RefreshCw className={`w-4.5 h-4.5 ${isConnecting ? 'animate-spin' : ''}`} />
        </motion.button>

        {/* Text Input / Status */}
        <div className="flex-1 px-1 overflow-hidden flex items-center">
          {isRecording ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 items-center">
                {[...Array(4)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="w-0.5 rounded-full bg-gemini-blue"
                    animate={{ height: [8, 16, 8] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
                  />
                ))}
              </div>
              <span className="text-gemini-text text-sm font-medium">Listening...</span>
            </div>
          ) : assistantIsThinking ? (
            <div className="flex items-center gap-2">
              <motion.div
                className="w-4 h-4 rounded-full bg-gradient-to-r from-gemini-blue to-gemini-violet"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-sm font-medium bg-gradient-to-r from-gemini-blue via-gemini-violet to-gemini-pink bg-clip-text text-transparent">
                Thinking...
              </span>
            </div>
          ) : (
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message VoxFlow..."
              className="w-full bg-transparent border-none outline-none text-gemini-text placeholder-gemini-muted text-[15px] py-2"
            />
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {inputText.trim() ? (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSendText}
              aria-label="Send message"
              className="p-2.5 bg-gemini-blue text-white rounded-xl transition-all shadow-md shadow-gemini-blue/20 hover:shadow-lg hover:shadow-gemini-blue/30"
            >
              <ArrowUp className="w-4 h-4" />
            </motion.button>
          ) : (
            <>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                aria-label="Toggle settings"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-gemini-muted hover:text-gemini-text rounded-xl hover:bg-gemini-hover transition-all text-xs font-medium"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showSettings ? 'rotate-180' : ''}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleToggle}
                disabled={!isConnected}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                className={`relative p-2.5 rounded-xl transition-all ${
                  isRecording
                    ? 'bg-gemini-gradient text-white shadow-lg shadow-gemini-blue/30'
                    : 'text-gemini-blue hover:bg-gemini-blue/10'
                } disabled:opacity-30`}
              >
                {isRecording ? (
                  <Square className="w-4 h-4 fill-white" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}

                {/* Pulse rings when recording */}
                {isRecording && (
                  <>
                    <span className="absolute inset-0 rounded-xl bg-gemini-blue/20 mic-pulse-ring" />
                    <span className="absolute inset-0 rounded-xl bg-gemini-blue/10 mic-pulse-ring" style={{ animationDelay: '0.5s' }} />
                  </>
                )}
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-3 text-center text-[10px] text-gemini-muted/60">
        VoxFlow may produce inaccurate information. Verify important facts independently.
      </p>
    </div>
  )
}

function VoiceSelector() {
  const selectedVoice = useStore((s) => s.selectedVoice)
  const setSelectedVoice = useStore((s) => s.setSelectedVoice)
  const voices = [
    { id: 'default', name: 'Default', desc: 'Balanced' },
    { id: 'en-US-AndrewNeural', name: 'Andrew', desc: 'Deep tone' },
    { id: 'en-US-EmmaNeural', name: 'Emma', desc: 'Clear tone' },
  ]
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-gemini-muted mb-3 block">Voice</label>
      <div className="space-y-1.5">
        {voices.map((v) => (
          <motion.button
            key={v.id}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedVoice(v.id)}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between ${
              selectedVoice === v.id
                ? 'bg-gemini-blue/10 text-gemini-blue border border-gemini-blue/20'
                : 'text-gemini-text-secondary hover:bg-gemini-hover border border-transparent'
            }`}
          >
            <span className="font-medium">{v.name}</span>
            <span className="text-[10px] text-gemini-muted">{v.desc}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function ModelInfo() {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-gemini-muted mb-3 block">Engine</label>
      <div className="p-4 rounded-xl glass-card">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 status-dot" />
          <p className="text-sm text-gemini-blue font-semibold">Groq LPU</p>
        </div>
        <p className="text-[11px] text-gemini-muted leading-relaxed">
          Llama 3.1 + Whisper v3 with real-time inference
        </p>
      </div>
    </div>
  )
}
