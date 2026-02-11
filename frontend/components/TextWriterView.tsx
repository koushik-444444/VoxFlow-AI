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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <WaveformVisualizer />
        </div>

        {/* Text Area */}
        <div className="z-10 w-full max-w-2xl text-center">
          <AnimatePresence mode="wait">
            {writerContent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight px-4">
                  {writerContent}
                  {assistantIsThinking && (
                    <motion.span 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="inline-block w-1.5 h-10 bg-vox-purple ml-2 translate-y-1"
                    />
                  )}
                </h2>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center gap-3 pt-6"
                >
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-vox-gray border border-vox-light text-slate-300 hover:text-white hover:border-vox-gray transition-all shadow-xl active:scale-95"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    <span className="text-sm font-black uppercase tracking-widest">Copy</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-vox-gray border border-vox-light text-slate-300 hover:text-white hover:border-vox-gray transition-all shadow-xl active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                    <span className="text-sm font-black uppercase tracking-widest">Download</span>
                  </button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <p className="text-3xl md:text-4xl font-black text-slate-700 leading-tight">
                  {isRecording ? (
                    <span className="text-white">Listening to your voice...</span>
                  ) : isTranscribing ? (
                    <span className="text-vox-purple">Converting speech to text...</span>
                  ) : (
                    <>
                      Tell me about this year's <span className="text-slate-800">top 5 trends | for Instagram marketers</span>
                    </>
                  )}
                </p>
                {!isRecording && !isTranscribing && (
                  <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs pt-4">
                    Tap the microphone to start writing
                  </p>
                )}
              </motion.div>
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
