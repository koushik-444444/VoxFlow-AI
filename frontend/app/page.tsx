'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
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

  useEffect(() => {
    if (!isInitialized) {
      initializeSession()
    }
  }, [initializeSession, isInitialized])

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar - Always available but can be toggled */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 relative">
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
                className="flex items-center justify-between px-6 py-4 z-10"
              >
                <div className="flex items-center gap-2">
                  {!sidebarOpen && (
                    <button 
                      onClick={toggleSidebar}
                      aria-label="Open sidebar"
                      className="p-3 rounded-full hover:bg-gemini-hover text-gemini-muted hover:text-white transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  )}
                  <h1 className="text-xl font-medium text-[#e3e3e3] px-2 flex items-center gap-2">
                    VoxFlow
                    <ChevronDown className="w-4 h-4 text-gemini-muted" />
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#444746] text-xs font-bold text-gemini-text cursor-pointer hover:bg-gemini-hover">
                    <span className="bg-gemini-gradient bg-clip-text text-transparent">PRO</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold border border-white/20">
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
