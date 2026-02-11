'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Square, Settings2, RefreshCw } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'

export function ControlPanel() {
  const {
    isRecording,
    sendAudioChunk,
    sendInterrupt,
    wsStatus,
    initializeSession,
    setIsTranscribing,
    wsConnection
  } = useStore()

  const [showSettings, setShowSettings] = useState(false)

  const {
    startRecording,
    stopRecording,
  } = useAudioRecorder({
    onDataAvailable: (data) => {
      // Send data regardless of state during the short window of stopping
      if (data.size > 0) {
        // console.log('Audio data available:', data.size)
        sendAudioChunk(data)
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
      
      // Wait a tiny bit for the last data chunk to be emitted and sent
      setTimeout(() => {
        if (isWsConnected) {
          wsConnection.send(JSON.stringify({ type: 'end_of_speech' }))
        }
      }, 200)
    } else {
      // Signal start of a new recording to clear backend buffer
      if (isWsConnected) {
        wsConnection.send(JSON.stringify({ type: 'start_recording' }))
      }
      startRecording()
    }
  }

  const handleInterrupt = () => {
    sendInterrupt()
  }

  const handleRetry = () => {
    initializeSession()
  }

  const isConnected = wsStatus === 'connected'
  const isConnecting = wsStatus === 'connecting'
  const hasError = wsStatus === 'error'

  return (
    <div className="px-6 py-10 w-full max-w-4xl mx-auto">
      {/* Main Input Pill */}
      <div className="relative flex items-center gap-4 bg-gemini-sidebar border border-gemini-border rounded-[32px] px-6 py-4 shadow-xl focus-within:ring-1 focus-within:ring-gemini-border transition-all">
        {/* Reset/Interrupt */}
        <button
          onClick={handleInterrupt}
          disabled={!isConnected}
          className="p-2 text-gemini-muted hover:text-white transition-all disabled:opacity-20"
          title="Reset"
        >
          <RefreshCw className={`w-5 h-5 ${isConnecting ? 'animate-spin' : ''}`} />
        </button>

        {/* Dynamic Status Text */}
        <div className="flex-1 min-w-0">
          <p className="text-gemini-muted truncate text-sm">
            {isRecording ? (
              <span className="text-gemini-text font-medium animate-pulse">Listening...</span>
            ) : isTranscribing ? (
              <span className="text-gemini-blue">Processing voice...</span>
            ) : assistantIsThinking ? (
              <span className="text-gemini-purple">Thinking...</span>
            ) : (
              'Enter a prompt here or tap the mic'
            )}
          </p>
        </div>

        {/* Controls Group */}
        <div className="flex items-center gap-2">
          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full transition-all ${showSettings ? 'text-gemini-blue bg-gemini-hover' : 'text-gemini-muted hover:text-white'}`}
          >
            <Settings2 className="w-5 h-5" />
          </button>

          {/* Voice Record Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggle}
            disabled={!isConnected}
            className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all ${
              isRecording
                ? 'bg-gemini-gradient shadow-lg shadow-gemini-blue/20'
                : 'hover:bg-gemini-hover text-gemini-blue'
            } disabled:opacity-50 disabled:grayscale`}
          >
            {isRecording ? (
              <Square className="w-5 h-5 text-white fill-white" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            
            {isRecording && (
              <span className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Settings Panel Popover (Simplified Gemini Style) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-6 bg-gemini-sidebar border border-gemini-border rounded-[24px] shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <VoiceSelector />
              <SpeedControl />
              <ModelInfo />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function VoiceSelector() {
  const { selectedVoice, setSelectedVoice } = useStore()

  const voices = [
    { id: 'default', name: 'Default', description: 'Natural voice' },
    { id: 'female-1', name: 'Sarah', description: 'Female voice' },
    { id: 'male-1', name: 'Michael', description: 'Male voice' },
    { id: 'neutral-1', name: 'Alex', description: 'Gender neutral' },
  ]

  return (
    <div>
      <label className="text-sm font-medium text-slate-300 mb-2 block">Voice</label>
      <select
        value={selectedVoice}
        onChange={(e) => setSelectedVoice(e.target.value)}
        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        {voices.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name} - {voice.description}
          </option>
        ))}
      </select>
    </div>
  )
}

function SpeedControl() {
  const [speed, setSpeed] = useState(1.0)

  return (
    <div>
      <label className="text-sm font-medium text-slate-300 mb-2 block">
        Speech Speed: {speed.toFixed(1)}x
      </label>
      <input
        type="range"
        min="0.5"
        max="2.0"
        step="0.1"
        value={speed}
        onChange={(e) => setSpeed(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>0.5x</span>
        <span>1.0x</span>
        <span>2.0x</span>
      </div>
    </div>
  )
}

function ModelInfo() {
  const { selectedModel } = useStore()

  const models: Record<string, { name: string; description: string }> = {
    'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', description: 'Fast & efficient' },
    'gpt-4': { name: 'GPT-4', description: 'Most capable' },
    'claude-instant': { name: 'Claude Instant', description: 'Quick responses' },
  }

  const model = models[selectedModel] || models['gpt-3.5-turbo']

  return (
    <div>
      <label className="text-sm font-medium text-slate-300 mb-2 block">Model</label>
      <div className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
        <p className="text-sm text-slate-200">{model.name}</p>
        <p className="text-xs text-slate-500">{model.description}</p>
      </div>
    </div>
  )
}
