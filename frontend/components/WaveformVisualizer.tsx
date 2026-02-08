'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'

export function WaveformVisualizer() {
  const { isRecording, audioLevel } = useStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!isRecording || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bars = 50
    const barWidth = canvas.width / bars
    let phase = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)')
      gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.2)')
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw wave bars
      for (let i = 0; i < bars; i++) {
        const x = i * barWidth
        const normalizedI = i / bars

        // Create wave pattern
        const wave1 = Math.sin(phase + normalizedI * Math.PI * 4)
        const wave2 = Math.sin(phase * 1.5 + normalizedI * Math.PI * 6)
        const combinedWave = (wave1 + wave2) / 2

        // Apply audio level
        const height = Math.abs(combinedWave) * audioLevel * canvas.height * 0.8 + 5
        const y = (canvas.height - height) / 2

        // Bar gradient
        const barGradient = ctx.createLinearGradient(0, y, 0, y + height)
        barGradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)')
        barGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.9)')
        barGradient.addColorStop(1, 'rgba(99, 102, 241, 0.8)')

        ctx.fillStyle = barGradient
        ctx.fillRect(x + 1, y, barWidth - 2, height)

        // Add glow effect
        ctx.shadowColor = 'rgba(99, 102, 241, 0.5)'
        ctx.shadowBlur = 10
      }

      phase += 0.1
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRecording, audioLevel])

  if (!isRecording) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-slate-800/50 bg-slate-900/50"
    >
      <div className="py-4 px-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-300">Recording</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-500">LIVE</span>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={80}
          className="w-full h-20 rounded-lg"
        />

        {/* Audio Level Indicator */}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs text-slate-500 w-12">Level</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              animate={{ width: `${audioLevel * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <span className="text-xs text-slate-500 w-12 text-right">
            {Math.round(audioLevel * 100)}%
          </span>
        </div>
      </div>
    </motion.div>
  )
}
