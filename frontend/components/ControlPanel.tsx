'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, RefreshCw, ChevronDown, Wrench, ArrowUp } from 'lucide-react'
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
    <div className="flex-shrink-0 pb-8 pt-2 px-4 md:px-0 w-full max-w-3xl mx-auto z-20">
      {/* Settings Bar */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-4 p-6 bg-[#1e1f20] border border-[#444746] rounded-[28px] shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VoiceSelector />
              <ModelInfo />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Pill (Gemini Style) */}
      <div className="relative flex items-center gap-2 bg-[#1e1f20] hover:bg-[#28292a] border border-transparent focus-within:border-[#444746] rounded-[32px] pl-4 pr-2 py-2 shadow-lg transition-all group text-[#e3e3e3]">
        {/* Reset/Interrupt */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180, backgroundColor: 'rgba(51, 53, 55, 1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={handleInterrupt}
          disabled={!isConnected}
          className="p-2.5 text-[#c4c7c5] hover:text-white rounded-full transition-all disabled:opacity-20"
          aria-label="Reset conversation"
        >
          <RefreshCw className={`w-5 h-5 ${isConnecting ? 'animate-spin' : ''}`} />
        </motion.button>

        <motion.button 
          whileHover={{ backgroundColor: 'rgba(51, 53, 55, 1)' }}
          whileTap={{ scale: 0.95 }}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-[#c4c7c5] hover:text-white rounded-full transition-colors text-sm font-medium"
        >
          <Wrench className="w-4 h-4" />
          <span>Tools</span>
        </motion.button>

        {/* Text Input / Status */}
        <div className="flex-1 px-2 overflow-hidden flex items-center">
          {isRecording ? (
             <p className="text-[#8e918f] truncate text-[16px]">
               <span className="text-white animate-pulse font-medium">Listening...</span>
             </p>
          ) : assistantIsThinking ? (
            <p className="text-[#8e918f] truncate text-[16px]">
               <span className="bg-gemini-gradient bg-clip-text text-transparent font-medium">VoxFlow is thinking...</span>
            </p>
          ) : (
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Gemini 3"
              className="w-full bg-transparent border-none outline-none text-[#e3e3e3] placeholder-[#8e918f] text-[16px] py-1"
            />
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {inputText.trim() ? (
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(51, 53, 55, 1)' }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSendText}
              aria-label="Send message"
              className="p-3 text-blue-400 rounded-full transition-all"
            >
              <ArrowUp className="w-6 h-6" />
            </motion.button>
          ) : (
            <>
              <motion.button 
                whileHover={{ backgroundColor: 'rgba(51, 53, 55, 1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className="hidden md:flex items-center gap-1 px-3 py-1.5 text-[#c4c7c5] hover:text-white rounded-full transition-colors text-sm font-medium"
              >
                <span>Pro</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleToggle}
                disabled={!isConnected}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                className={`p-3 rounded-full transition-all ${
                  isRecording
                    ? 'bg-gemini-gradient text-white shadow-lg'
                    : 'text-blue-400 hover:bg-[#333537]'
                } disabled:opacity-30`}
              >
                {isRecording ? (
                  <Square className="w-5 h-5 fill-white" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <p className="mt-4 text-center text-[11px] text-[#8e918f]">
        VoxFlow may display inaccurate info, including about people, so double-check its responses. 
        <span className="underline ml-1 cursor-pointer">Your privacy & Gemini Apps</span>
      </p>
    </div>
  )
}

function VoiceSelector() {
  const selectedVoice = useStore((s) => s.selectedVoice)
  const setSelectedVoice = useStore((s) => s.setSelectedVoice)
  const voices = [
    { id: 'default', name: 'Default' },
    { id: 'en-US-AndrewNeural', name: 'Andrew' },
    { id: 'en-US-EmmaNeural', name: 'Emma' },
  ]
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wider text-[#8e918f] mb-3 block">Voice Profile</label>
      <div className="space-y-2">
        {voices.map((v) => (
          <motion.button
            key={v.id}
            whileHover={{ backgroundColor: 'rgba(51, 53, 55, 1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedVoice(v.id)}
            className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all ${
              selectedVoice === v.id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-[#e3e3e3] border border-transparent'
            }`}
          >
            {v.name}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function ModelInfo() {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wider text-[#8e918f] mb-3 block">Powered By</label>
      <div className="p-4 rounded-2xl bg-[#131314] border border-[#444746]">
        <p className="text-sm text-blue-400 font-bold mb-1">Groq LPU™ Engine</p>
        <p className="text-[10px] text-[#8e918f] leading-relaxed">Real-time inference using Llama 3 & Whisper v3</p>
      </div>
    </div>
  )
}
