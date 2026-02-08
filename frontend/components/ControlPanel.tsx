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
    <div className="border-t border-vox-gray bg-vox-black/90 backdrop-blur-2xl px-6 py-8">
      {/* Main Controls */}
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        {/* Reset/Interrupt Button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: -15 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleInterrupt}
          disabled={!isConnected}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-vox-light border border-vox-gray text-slate-400 hover:text-white transition-all disabled:opacity-20 shadow-lg shadow-black/20"
          title="Interrupt"
        >
          <RefreshCw className="w-5 h-5" />
        </motion.button>

        {/* Record Button */}
        {hasError ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRetry}
            className="w-20 h-20 flex items-center justify-center rounded-[32px] bg-orange-500 shadow-2xl shadow-orange-500/30 text-white"
          >
            <RefreshCw className="w-8 h-8 animate-spin-slow" />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            disabled={!isConnected}
            className={`relative w-24 h-24 flex items-center justify-center rounded-[36px] transition-all shadow-2xl ${
              isRecording
                ? 'bg-vox-rose shadow-vox-rose/40'
                : 'bg-vox-gradient shadow-vox-purple/40'
            } disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed`}
          >
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div
                  key="recording"
                  initial={{ scale: 0, rotate: 90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -90 }}
                >
                  <Square className="w-10 h-10 text-white fill-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Mic className="w-10 h-10 text-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recording Pulse */}
            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-[36px] bg-vox-rose animate-ping opacity-25" />
                <span className="absolute -inset-4 rounded-[40px] border-2 border-vox-rose/20 animate-pulse" />
              </>
            )}
          </motion.button>
        )}

        {/* Settings Button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSettings(!showSettings)}
          className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all shadow-lg ${
            showSettings
              ? 'bg-vox-purple/20 border-vox-purple text-vox-purple'
              : 'bg-vox-light border-vox-gray text-slate-400 hover:text-white'
          }`}
        >
          <Settings2 className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Status Bar */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-vox-light border border-vox-gray shadow-inner">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 
              isConnecting ? 'bg-amber-400 animate-bounce' : 'bg-rose-500'
            }`}
          />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {hasError ? 'Connection Error' : isConnecting ? 'Syncing...' : isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
        
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence>
            {isRecording && (
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm font-bold text-vox-rose animate-pulse"
              >
                VoxFlow is listening...
              </motion.span>
            )}
          </AnimatePresence>
        </div>
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
