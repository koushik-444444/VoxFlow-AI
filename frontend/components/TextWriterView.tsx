'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  MoreVertical, 
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
import { useState, useEffect } from 'react'
import { WaveformVisualizer } from './WaveformVisualizer'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'

export function TextWriterView() {
  const { 
    setService, 
    writerContent, 
    setWriterContent,
    isRecording: storeIsRecording,
    setIsRecording: setStoreIsRecording,
    setIsTranscribing,
    sendAudioChunk,
    wsStatus,
    wsConnection,
  } = useStore()

  const [copied, setCopied] = useState(false)

  const {
    isRecording,
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
      setStoreIsRecording(false)
    }
  })

  // Sync state
  if (isRecording !== storeIsRecording) {
    setStoreIsRecording(isRecording)
  }

  const handleToggleMic = () => {
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
      className="fixed inset-0 bg-vox-black z-50 flex flex-col"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vox-gradient flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white leading-tight">Text writer</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Marketing in 2025</p>
            </div>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-white">
          <MoreVertical className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content (Orb area) */}
      <div className="flex-1 relative flex flex-col items-center justify-center px-10">
        {/* Background Visualizer (Reusable) */}
        <WaveformVisualizer />

        {/* Text Area */}
        <div className="mt-20 max-w-lg w-full text-center">
          <AnimatePresence mode="wait">
            {writerContent ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <p className="text-2xl font-bold text-white leading-snug">
                  {writerContent}
                </p>
                
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-vox-gray border border-vox-light text-slate-300 hover:text-white transition-all shadow-lg"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span className="text-xs font-bold uppercase tracking-widest">Copy</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-vox-gray border border-vox-light text-slate-300 hover:text-white transition-all shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Download</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-bold text-slate-600 leading-snug"
              >
                {isRecording ? 'Listening to your ideas...' : 'Speak to start writing...'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Controls (Mimicking Image 1) */}
      <div className="pb-12 pt-6 px-10">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <button 
            onClick={handleReset}
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-vox-light border border-vox-gray text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <RefreshCw className="w-6 h-6" />
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleMic}
            className={`relative w-24 h-24 flex items-center justify-center rounded-[36px] transition-all shadow-2xl ${
              isRecording
                ? 'bg-vox-rose shadow-vox-rose/40'
                : 'bg-vox-gradient shadow-vox-purple/40'
            }`}
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
            
            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-[36px] bg-vox-rose animate-ping opacity-25" />
                <span className="absolute -inset-4 rounded-[40px] border-2 border-vox-rose/20 animate-pulse" />
              </>
            )}
          </motion.button>

          <button 
            onClick={handleClose}
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-vox-light border border-vox-gray text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
