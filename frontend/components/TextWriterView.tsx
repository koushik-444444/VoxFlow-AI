'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  Mic, 
  RefreshCw, 
  X, 
  Copy, 
  Download, 
  Check,
  FileText,
  Square
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useState } from 'react'
import { WaveformVisualizer } from './WaveformVisualizer'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'

export function TextWriterView() {
  const { 
    setService, 
    writerContent, 
    setWriterContent,
    isRecording,
    isTranscribing,
    setIsTranscribing,
    assistantIsThinking,
    sendAudioChunk,
    wsStatus,
    wsConnection,
  } = useStore()

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
    onError: (error) => {
      console.error('Recorder error:', error)
    }
  })

  const handleToggleMic = () => {
    if (wsStatus !== 'connected') {
      alert('Connection lost. Please wait a moment or refresh.')
      return
    }

    const isWsConnected = wsConnection && wsStatus === 'connected'

    if (isRecording) {
      stopRecording()
      setIsTranscribing(true)
      setTimeout(() => {
        if (isWsConnected) {
          wsConnection.send(JSON.stringify({ type: 'end_of_speech' }))
        }
      }, 200)
    } else {
      if (isWsConnected) {
        wsConnection.send(JSON.stringify({ type: 'start_recording' }))
      }
      startRecording()
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(writerContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob([writerContent], {type: 'text/plain'})
    element.href = URL.createObjectURL(file)
    element.download = "voxflow-writing.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
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
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ backgroundColor: 'rgba(51, 53, 55, 1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="p-2 rounded-full text-gemini-muted hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gemini-sidebar border border-gemini-border flex items-center justify-center">
              <FileText className="w-4 h-4 text-gemini-blue" />
            </div>
            <h2 className="text-sm font-medium text-gemini-text">Text writer</h2>
          </div>
        </div>
        <motion.button 
          whileHover={{ backgroundColor: 'rgba(51, 53, 55, 1)' }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-full text-gemini-muted hover:text-white transition-colors"
        >
          <MoreVertical className="w-6 h-6" />
        </motion.button>
      </header>

      {/* Main Content (Focused) */}
      <div className="flex-1 relative flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-10">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <WaveformVisualizer />
        </div>

        <div className="z-10 w-full text-center">
          <AnimatePresence mode="wait">
            {writerContent ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <div className="relative group">
                  <h2 className="text-3xl md:text-5xl font-medium text-gemini-text leading-tight px-4">
                    {writerContent}
                    {assistantIsThinking && (
                      <span className="inline-block w-1 h-8 bg-gemini-blue ml-2 animate-pulse align-middle" />
                    )}
                  </h2>
                </div>
                
                <div className="flex items-center justify-center gap-3">
                  <motion.button
                    whileHover={{ backgroundColor: '#28292a', scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-gemini-sidebar border border-gemini-border text-gemini-muted hover:text-white transition-all shadow-md"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span className="text-sm font-medium uppercase tracking-wider">Copy</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ backgroundColor: '#28292a', scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-gemini-sidebar border border-gemini-border text-gemini-muted hover:text-white transition-all shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium uppercase tracking-wider">Download</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <p className="text-4xl md:text-6xl font-medium text-gemini-muted leading-tight">
                  {isRecording ? (
                    <span className="text-gemini-text">Listening...</span>
                  ) : isTranscribing ? (
                    <span className="text-gemini-blue animate-pulse">Processing...</span>
                  ) : (
                    <>What's on your mind?</>
                  )}
                </p>
                <p className="text-gemini-muted text-lg">
                  Tap the mic to start your creative flow
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Simplified Controls */}
      <div className="pb-16 pt-6 flex justify-center gap-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleMic}
          className={`relative w-20 h-20 flex items-center justify-center rounded-full transition-all shadow-2xl ${
            isRecording
              ? 'bg-gemini-gradient shadow-gemini-blue/40'
              : 'bg-gemini-sidebar border border-gemini-border text-gemini-blue hover:bg-gemini-hover'
          }`}
        >
          {isRecording ? <Square className="w-8 h-8 text-white fill-white" /> : <Mic className="w-8 h-8" />}
          {isRecording && (
            <span className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" />
          )}
        </motion.button>
        
        {writerContent && (
          <div className="flex gap-4">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 180, backgroundColor: '#28292a' }}
              whileTap={{ scale: 0.9 }}
              onClick={handleReset}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-gemini-sidebar border border-gemini-border text-gemini-muted hover:text-white transition-all self-center"
            >
              <RefreshCw className="w-6 h-6" />
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90, backgroundColor: '#28292a' }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-gemini-sidebar border border-gemini-border text-gemini-muted hover:text-white transition-all self-center"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
