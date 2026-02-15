'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Zap } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { ChatArea } from '@/components/ChatArea'
import { ControlPanel } from '@/components/ControlPanel'
import { WaveformVisualizer } from '@/components/WaveformVisualizer'
import { TextWriterView } from '@/components/TextWriterView'
import { useStore } from '@/store/useStore'
import { Toaster } from '@/components/ui/Toaster'

export default function Home() {
  const initializeSession = useStore((s) => s.initializeSession)
  const isInitialized = useStore((s) => s.isInitialized)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const activeService = useStore((s) => s.activeService)
  const wsStatus = useStore((s) => s.wsStatus)

  useEffect(() => {
    if (!isInitialized) {
      initializeSession()
    }
  }, [initializeSession, isInitialized])

  return (
    <div className="flex h-screen bg-gemini-bg overflow-hidden relative">
      {/* Ambient Background */}
      <div className="ambient-mesh" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 relative z-10">
        <AnimatePresence mode="wait">
          {activeService === 'writer' ? (
            <TextWriterView key="writer" />
          ) : (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0 h-full"
            >
              {/* Header */}
              <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between px-6 py-3 z-10 flex-shrink-0"
              >
                <div className="flex items-center gap-3">
                  {!sidebarOpen && (
                    <button 
                      onClick={toggleSidebar}
                      aria-label="Open sidebar"
                      className="p-2.5 rounded-xl hover:bg-gemini-hover text-gemini-muted hover:text-white transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gemini-blue via-gemini-violet to-gemini-pink animate-gradient bg-[length:200%_200%] drop-shadow-[0_0_15px_rgba(75,144,255,0.3)]">
                      VoxFlow
                    </h1>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gemini-blue/10 text-[12px] font-bold text-gemini-blue border border-gemini-blue/20 uppercase tracking-widest">
                      AI
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Connection Status */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium">
                    <div className={`w-1.5 h-1.5 rounded-full status-dot ${
                      wsStatus === 'connected' ? 'bg-emerald-400' :
                      wsStatus === 'connecting' ? 'bg-amber-400' :
                      'bg-red-400'
                    }`} />
                    <span className="text-gemini-muted hidden sm:inline">
                      {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting' : 'Offline'}
                    </span>
                  </div>

                  <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card text-xs font-bold cursor-pointer hover:bg-gemini-hover transition-all">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="bg-gradient-to-r from-gemini-blue via-gemini-purple to-gemini-pink bg-clip-text text-transparent">PRO</span>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gemini-blue via-gemini-violet to-gemini-pink flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-gemini-blue/20">
                    U
                  </div>
                </div>
              </motion.header>

              {/* Chat Area */}
              <ChatArea />

              {/* Waveform Visualizer */}
              <WaveformVisualizer />

              {/* Control Panel */}
              <ControlPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Toaster />
    </div>
  )
}
