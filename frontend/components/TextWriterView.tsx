'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  Mic, 
  MoreVertical,
  RefreshCw, 
  X, 
  Copy, 
  Download, 
  Check,
  FileText,
  Square,
  Sparkles
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useState } from 'react'
import { toast } from '@/components/ui/Toaster'
import { WaveformVisualizer } from './WaveformVisualizer'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'

export function TextWriterView() {
  const setService = useStore((s) => s.setService)
  const writerContent = useStore((s) => s.writerContent)
  const setWriterContent = useStore((s) => s.setWriterContent)
  const isRecording = useStore((s) => s.isRecording)
  const isTranscribing = useStore((s) => s.isTranscribing)
  const setIsTranscribing = useStore((s) => s.setIsTranscribing)
  const assistantIsThinking = useStore((s) => s.assistantIsThinking)
  const sendAudioChunk = useStore((s) => s.sendAudioChunk)
  const wsStatus = useStore((s) => s.wsStatus)
  const wsConnection = useStore((s) => s.wsConnection)

  const [copied, setCopied] = useState(false)

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

  const handleToggleMic = () => {
    if (wsStatus !== 'connected') {
      toast.error('Connection lost. Please wait a moment or refresh.')
      return
    }

    if (isRecording) {
      stopRecording()
      setIsTranscribing(true)
    } else {
      const isWsConnected = wsConnection && wsStatus === 'connected'
      if (isWsConnected) {
        wsConnection.send(JSON.stringify({ type: 'start_recording' }))
      }
      startRecording()
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(writerContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleDownload = () => {
    const file = new Blob([writerContent], {type: 'text/plain'})
    const url = URL.createObjectURL(file)
    const element = document.createElement("a")
    element.href = url
    element.download = "voxflow-writing.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    setService('chat')
  }

  const handleReset = () => {
    setWriterContent('')
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gemini-bg z-50 flex flex-col"
    >
      {/* Ambient Background */}
      <div className="ambient-mesh" />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 relative z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            aria-label="Go back to chat"
            className="p-2 rounded-xl text-gemini-muted hover:text-white hover:bg-gemini-hover transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gemini-blue/20 to-gemini-violet/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-gemini-blue" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-gemini-text">Text Writer</h3>
              <p className="text-[11px] text-gemini-muted italic">*Voice-to-text mode*</p>
            </div>
          </div>
        </div>
        <motion.button 
          whileHover={{ rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          aria-label="More options"
          className="p-2 rounded-xl text-gemini-muted hover:text-white hover:bg-gemini-hover transition-all"
        >
          <MoreVertical className="w-5 h-5" />
        </motion.button>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-10 min-h-0">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
          <WaveformVisualizer />
        </div>

        <div className="z-10 w-full text-center">
          <AnimatePresence mode="wait">
            {writerContent ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                <div className="relative group">
                  <h3 className="text-3xl md:text-4xl font-bold text-gemini-text leading-tight px-4 tracking-tight">
                    {writerContent}
                    {assistantIsThinking && (
                      <span className="inline-block w-0.5 h-8 bg-gemini-blue ml-2 cursor-blink align-middle rounded-full" />
                    )}
                  </h3>
                </div>
                
                <div className="flex items-center justify-center gap-2.5">
                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-card hover:bg-gemini-hover text-gemini-muted hover:text-white transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span className="text-xs font-semibold uppercase tracking-wider">Copy</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-card hover:bg-gemini-hover text-gemini-muted hover:text-white transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Save</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-gemini-blue/20 to-gemini-violet/20 flex items-center justify-center mb-6"
                >
                  <Sparkles className="w-7 h-7 text-gemini-blue animate-pulse" />
                </motion.div>
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {isRecording ? (
                    <span className="bg-gradient-to-r from-gemini-blue via-gemini-violet to-gemini-pink bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
                      Listening...
                    </span>
                  ) : isTranscribing ? (
                    <span className="text-gemini-blue animate-pulse">Processing...</span>
                  ) : (
                    <span className="text-gemini-text-secondary">What&apos;s on your mind?</span>
                  )}
                </h3>
                <p className="text-gemini-muted text-base italic">
                  *Tap the mic to start your creative flow*
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="pb-12 pt-4 flex justify-center gap-4 relative z-10 flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleMic}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          className={`relative w-16 h-16 flex items-center justify-center rounded-2xl transition-all ${
            isRecording
              ? 'bg-gemini-gradient shadow-lg shadow-gemini-blue/30'
              : 'glass-card text-gemini-blue hover:bg-gemini-hover'
          }`}
        >
          {isRecording ? <Square className="w-6 h-6 text-white fill-white" /> : <Mic className="w-7 h-7" />}
          {isRecording && (
            <>
              <span className="absolute inset-0 rounded-2xl bg-gemini-blue/20 mic-pulse-ring" />
              <span className="absolute inset-0 rounded-2xl bg-gemini-blue/10 mic-pulse-ring" style={{ animationDelay: '0.5s' }} />
            </>
          )}
        </motion.button>
        
        {writerContent && (
          <div className="flex gap-2">
            <motion.button 
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleReset}
              aria-label="Reset writer content"
              className="w-12 h-12 flex items-center justify-center rounded-2xl glass-card text-gemini-muted hover:text-white hover:bg-gemini-hover transition-all self-center"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              aria-label="Close text writer"
              className="w-12 h-12 flex items-center justify-center rounded-2xl glass-card text-gemini-muted hover:text-white hover:bg-gemini-hover transition-all self-center"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
