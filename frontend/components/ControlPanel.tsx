'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Square, Settings2, RefreshCw } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'

export function ControlPanel() {
  const {
    isRecording: storeIsRecording,
    setIsRecording: setStoreIsRecording,
    sendAudioChunk,
    sendInterrupt,
    wsStatus,
    initializeSession,
    isTranscribing,
    setIsTranscribing
  } = useStore()

  const [showSettings, setShowSettings] = useState(false)

  const {
    isRecording,
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
      setStoreIsRecording(false)
    }
  })

  // Synchronize store with local recorder state
  if (isRecording !== storeIsRecording) {
    setStoreIsRecording(isRecording)
  }

  const handleToggle = () => {
    const { wsConnection, wsStatus } = useStore.getState()
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
    <div className="border-t border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
      {/* Main Controls */}
      <div className="flex items-center justify-center gap-6 py-6">
        {/* Interrupt Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleInterrupt}
          disabled={!isConnected || !isRecording}
          className="p-4 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Interrupt (Barge-in)"
        >
          <Square className="w-5 h-5" />
        </motion.button>

        {/* Record Button */}
        {hasError ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRetry}
            className="p-6 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30 text-white"
            title="Retry Connection"
          >
            <RefreshCw className="w-8 h-8" />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            disabled={!isConnected}
            className={`relative p-6 rounded-full transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30'
            } disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed`}
          >
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div
                  key="recording"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <MicOff className="w-8 h-8 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Mic className="w-8 h-8 text-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recording Pulse */}
            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
                <span className="absolute -inset-2 rounded-full border-2 border-red-500/30 animate-pulse" />
              </>
            )}
          </motion.button>
        )}

        {/* Settings Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSettings(!showSettings)}
          className={`p-4 rounded-full border transition-all ${
            showSettings
              ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
              : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings2 className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-center gap-4 pb-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 
              isConnecting ? 'bg-yellow-400 animate-bounce' : 'bg-red-400'
            }`}
          />
          <span className="capitalize">
            {hasError ? 'Connection Error' : isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <span>|</span>
        <span>{isTranscribing ? 'Transcribing...' : isRecording ? 'Recording...' : 'Ready'}</span>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800/50 overflow-hidden"
          >
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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
