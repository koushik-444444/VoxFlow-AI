'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/Sidebar'
import { ChatArea } from '@/components/ChatArea'
import { ControlPanel } from '@/components/ControlPanel'
import { WaveformVisualizer } from '@/components/WaveformVisualizer'
import { useStore } from '@/store/useStore'
import { Toaster } from '@/components/ui/Toaster'

export default function Home() {
  const { initializeSession, isInitialized } = useStore()

  useEffect(() => {
    if (!isInitialized) {
      initializeSession()
    }
  }, [initializeSession, isInitialized])

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50 glass"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold gradient-text">Speech AI</h1>
              <p className="text-xs text-slate-400">Real-time Voice Conversations</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LatencyIndicator />
            <ModelSelector />
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
