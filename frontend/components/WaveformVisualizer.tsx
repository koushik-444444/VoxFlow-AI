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
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        >
          <div className="relative flex items-center justify-center">
            {/* Outer Glow */}
            <motion.div 
              className="voice-blob"
              animate={{
                scale: [1, 1.2 + audioLevel, 1],
                opacity: [0.6, 0.8, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Core Orb */}
            <motion.div 
              className="voice-blob-inner"
              animate={{
                scale: [1, 1.05 + (audioLevel * 0.5), 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Internal pulse for thinking state */}
              {assistantIsThinking && (
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
              )}
            </motion.div>

            {/* Static decorative rings (Image 2 style) */}
            <div className="absolute w-[320px] h-[320px] border border-vox-purple/10 rounded-full" />
            <div className="absolute w-[400px] h-[400px] border border-vox-rose/5 rounded-full" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
