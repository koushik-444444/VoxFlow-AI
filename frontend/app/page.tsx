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
      <AnimatePresence mode="wait">
        {activeService === 'writer' && <TextWriterView key="writer" />}
      </AnimatePresence>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-8 py-6 z-10"
        >
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button 
                onClick={toggleSidebar}
                className="p-3 rounded-2xl bg-vox-light border border-vox-gray text-white shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white">VoxFlow</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-vox-rose opacity-80">Intelligence v1.0</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="px-5 py-2 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest shadow-xl cursor-pointer"
            >
              Try Premium
            </motion.div>
          </div>
        </motion.header>

        {/* Chat Area */}
        <ChatArea />

        {/* Waveform Visualizer */}
        <WaveformVisualizer />

        {/* Control Panel */}
        <ControlPanel />
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
