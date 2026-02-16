'use client'

import { useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Copy, Check, Sparkles, ArrowRight, Pause, Play, Square } from 'lucide-react'
import { useStore, Message } from '@/store/useStore'
import { useState, useCallback } from 'react'
import { toast } from '@/components/ui/Toaster'

export function ChatArea() {
  const conversations = useStore((s) => s.conversations)
  const currentConversationId = useStore((s) => s.currentConversationId)
  const isRecording = useStore((s) => s.isRecording)
  const isTranscribing = useStore((s) => s.isTranscribing)
  const assistantIsThinking = useStore((s) => s.assistantIsThinking)
  const setService = useStore((s) => s.setService)
  const scrollRef = useRef<HTMLDivElement>(null)

  const currentConversation = conversations.find(
    (c) => c.id === currentConversationId
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [currentConversation?.messages, isRecording, isTranscribing, assistantIsThinking])

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
      className="flex-1 overflow-y-auto min-h-0 px-4 py-6 md:px-0 scroll-smooth relative z-10 custom-scrollbar"
    >
      <div className="max-w-3xl mx-auto w-full space-y-6">
        <AnimatePresence mode="popLayout">
          {!currentConversation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="py-16 flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="w-full max-w-2xl px-6 text-left">
                <h2 className="text-5xl md:text-7xl font-medium tracking-tight mb-8 leading-tight">
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">Hi Koushik</span>
                  <br />
                  <span className="text-[#c4c7c5]">Where should we start?</span>
                </h2>
                
                <div className="flex flex-wrap gap-3 mt-12">
                  <SuggestedPill icon="🎨" text="Create image" />
                  <SuggestedPill icon="🏏" text="Explore cricket" />
                  <SuggestedPill icon="✨" text="Boost my day" />
                  <SuggestedPill icon="🎬" text="Create video" />
                  <SuggestedPill icon="🎓" text="Help me learn" />
                  <SuggestedPill icon="✍️" text="Write anything" />
                </div>
              </div>
            </motion.div>
          )}


          {currentConversation?.messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              index={index}
            />
          ))}

          {(isRecording || isTranscribing) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 px-4 md:px-0"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gemini-blue via-gemini-violet to-gemini-pink flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-md shadow-gemini-blue/20">
                U
              </div>
              <div className="flex-1 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gemini-blue animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gemini-violet animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gemini-pink animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-gemini-text-secondary text-sm">
                    {isRecording ? 'Listening...' : 'Transcribing...'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {assistantIsThinking && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 px-4 md:px-0"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gemini-blue/20 to-gemini-violet/20 flex items-center justify-center flex-shrink-0 overflow-hidden p-1.5">
                <img src="/voxflow-logo.png" alt="VoxFlow Logo" className="w-full h-full object-contain invert" />
              </div>
              <div className="flex-1 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 rounded-md shimmer bg-gemini-hover" />
                  <div className="h-4 w-16 rounded-md shimmer bg-gemini-hover" style={{ animationDelay: '0.3s' }} />
                </div>
                <div className="h-4 w-40 rounded-md shimmer bg-gemini-hover mt-2" style={{ animationDelay: '0.6s' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  index: number
}

const MessageBubble = memo(function MessageBubble({ message, index }: MessageBubbleProps) {
  const playbackStatus = useStore((s) => s.playbackStatus)
  const currentlyPlayingId = useStore((s) => s.currentlyPlayingId)
  const playAudio = useStore((s) => s.playAudio)
  const pauseAudio = useStore((s) => s.pauseAudio)
  const stopAudio = useStore((s) => s.stopAudio)
  const [copied, setCopied] = useState(false)

  const isUser = message.role === 'user'
  const isStreaming = message.isStreaming
  const isCurrentPlaying = currentlyPlayingId === message.id
  const isPlaying = isCurrentPlaying && playbackStatus === 'playing'
  const isPaused = isCurrentPlaying && playbackStatus === 'paused'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handlePlay = () => {
    if (message.audioUrl) {
      playAudio(message.id, message.audioUrl)
    }
  }

  const handlePause = () => {
    pauseAudio()
  }

  const handleStop = () => {
    stopAudio()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start gap-3 px-4 md:px-0 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${
        isUser
          ? 'bg-gradient-to-br from-gemini-blue via-gemini-violet to-gemini-pink text-white text-xs font-bold shadow-md shadow-gemini-blue/20'
          : 'bg-gradient-to-br from-gemini-blue/20 to-gemini-violet/20 p-1.5'
      }`}>
        {isUser ? (
          'U'
        ) : (
          <img src="/voxflow-logo.png" alt="VoxFlow Logo" className="w-full h-full object-contain invert" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 min-w-0 py-1 ${isUser ? 'text-right' : 'text-left'}`}>
        <h3 className="text-lg font-bold text-gemini-blue mb-1">
          {isUser ? 'You' : 'VoxFlow'}
        </h3>
        <div className={`rounded-2xl px-4 py-3 inline-block max-w-full ${
          isUser
            ? 'glass-card text-left'
            : 'bg-transparent'
        }`}>
          <p className="text-[15px] leading-relaxed text-gemini-text whitespace-pre-wrap">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-0.5 h-5 ml-1 bg-gemini-blue cursor-blink align-middle rounded-full" />
            )}
          </p>
        </div>

        {/* Actions */}
        <div className={`flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isUser ? 'justify-end' : 'justify-start'} ml-1`}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy message'}
            className="p-1.5 rounded-lg text-gemini-muted hover:text-gemini-text hover:bg-gemini-hover transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </motion.button>

          {!isUser && message.audioUrl && (
            <div className="flex items-center gap-0.5">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={isPlaying ? handlePause : handlePlay}
                aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                className="p-1.5 rounded-lg text-gemini-muted hover:text-gemini-text hover:bg-gemini-hover transition-all"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </motion.button>

              {(isPlaying || isPaused) && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleStop}
                  aria-label="Stop audio"
                  className="p-1.5 rounded-lg text-gemini-muted hover:text-gemini-text hover:bg-gemini-hover transition-all"
                >
                  <Square className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
})

function SuggestedPill({ icon, text }: { icon: string, text: string }) {
  const setService = useStore((s) => s.setService)
 
  return (
    <motion.button 
      whileHover={{ y: -4, scale: 1.05, backgroundColor: '#28292a' }}
      whileTap={{ scale: 0.95 }}
      onClick={() => text === 'Write anything' && setService('writer')}
      className="flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-[#1e1f20] border border-[#444746] hover:border-[#8e918f]/30 transition-all text-sm font-medium text-[#e3e3e3] shadow-lg shadow-black/20"
    >
      <span className="text-lg">{icon}</span>
      <span>{text}</span>
    </motion.button>
  )
}
