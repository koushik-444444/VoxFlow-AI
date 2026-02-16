'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import dynamic from 'next/dynamic'

const AudioSphere = dynamic(() => import('./AudioSphere').then(mod => mod.AudioSphere), {
  ssr: false,
})

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
          <div className="relative flex items-center justify-center w-0 h-0">
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
              className="absolute voice-blob"
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
            
            {/* Core Artistic Orb */}
            <motion.div 
              className="absolute w-[220px] h-[220px] z-10"
              animate={{
                scale: isActive ? [1, 1.1 + (audioLevel * 0.4), 1] : 1,
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="voice-blob-inner w-full h-full" />
              
              {/* Radial Artistic Wave lines */}
              {isActive && [...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-[1px] bg-gradient-to-t from-gemini-blue to-transparent origin-bottom"
                  style={{ 
                    height: 100,
                    rotate: i * 30,
                    x: '-50%',
                    y: '-100%',
                  }}
                  animate={{
                    height: [100, 100 + (audioLevel * 150), 100],
                    opacity: [0.2, 0.8, 0.2]
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    delay: i * 0.05
                  }}
                />
              ))}
            </motion.div>

            {/* Decorative Static Rings */}
            <div className="absolute w-[240px] h-[240px] border border-gemini-blue/8 rounded-full" />
            <div className="absolute w-[320px] h-[320px] border border-gemini-violet/5 rounded-full" />
            <div className="absolute w-[400px] h-[400px] border border-gemini-pink/3 rounded-full" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
