'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/Sidebar'
import { ChatArea } from '@/components/ChatArea'
import { ControlPanel } from '@/components/ControlPanel'
import { WaveformVisualizer } from '@/components/WaveformVisualizer'
import { TextWriterView } from '@/components/TextWriterView'
import { useStore } from '@/store/useStore'
import { Toaster } from '@/components/ui/Toaster'

export default function Home() {
  const { initializeSession, isInitialized, sidebarOpen, toggleSidebar, activeService } = useStore()

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
      <main className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
          {activeService === 'writer' ? (
            <TextWriterView key="writer" />
          ) : (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col relative"
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
                      className="p-3 rounded-full hover:bg-gemini-hover text-gemini-muted hover:text-white transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  )}
                  <h1 className="text-xl font-medium text-gemini-muted px-2">VoxFlow</h1>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gemini-gradient animate-pulse opacity-20 blur-sm absolute" />
                  <User className="w-6 h-6 text-gemini-muted hover:text-white cursor-pointer transition-colors relative" />
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

function LatencyIndicator() {
  const { latency } = useStore()

  const getColor = (ms: number) => {
    if (ms < 1000) return 'text-green-400'
    if (ms < 3000) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
      <div className={`w-2 h-2 rounded-full animate-pulse ${getColor(latency)} bg-current`} />
      <span className="text-xs text-slate-400">Latency:</span>
      <span className={`text-xs font-mono font-medium ${getColor(latency)}`}>
        {latency}ms
      </span>
    </div>
  )
}

function ModelSelector() {
  const { selectedModel, setSelectedModel } = useStore()

  const models = [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast & efficient' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable' },
    { id: 'claude-instant', name: 'Claude Instant', description: 'Quick responses' },
  ]

  return (
    <select
      value={selectedModel}
      onChange={(e) => setSelectedModel(e.target.value)}
      className="px-3 py-1.5 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
    >
      {models.map((model) => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      ))}
    </select>
  )
}
