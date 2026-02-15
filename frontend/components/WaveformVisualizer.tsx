'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'

export function WaveformVisualizer() {
  const isRecording = useStore((s) => s.isRecording)
  const audioLevel = useStore((s) => s.audioLevel)
  const isPlaying = useStore((s) => s.isPlaying)
  const assistantIsThinking = useStore((s) => s.assistantIsThinking)

  const isActive = isRecording || isPlaying || assistantIsThinking

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        >
          <div className="relative flex items-center justify-center">
            {/* Outermost Halo */}
            <motion.div
              className="absolute w-[420px] h-[420px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(75,144,255,0.03) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.08 + audioLevel * 0.3, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Outer Glow Blob */}
            <motion.div 
              className="voice-blob"
              animate={{
                scale: [1, 1.15 + audioLevel, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            
            {/* Core Orb */}
            <motion.div 
              className="voice-blob-inner overflow-hidden flex items-center justify-center p-8"
              animate={{
                scale: [1, 1.05 + (audioLevel * 0.5), 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <img 
                src="/voxflow-logo.png" 
                alt="VoxFlow Logo"
                className="w-full h-full object-contain invert scale-125"
              />
              {/* Internal shimmer for thinking state */}
              {assistantIsThinking && (
                <div className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
              )}
            </motion.div>

            {/* Decorative Orbital Rings */}
            <motion.div
              className="absolute w-[240px] h-[240px] border border-gemini-blue/8 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute w-[320px] h-[320px] border border-gemini-violet/5 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute w-[400px] h-[400px] border border-gemini-pink/3 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
