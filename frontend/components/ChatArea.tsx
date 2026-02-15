'use client'

import { useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Copy, Check, Sparkles, ArrowRight } from 'lucide-react'
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
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="py-16 flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="w-full max-w-2xl px-6 text-center">
                {/* Animated Logo Orb */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, type: 'spring', stiffness: 200 }}
                  className="mx-auto mb-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-gemini-blue via-gemini-violet to-gemini-pink flex items-center justify-center shadow-lg shadow-gemini-blue/20 animate-float"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-gemini-text"
                >
                  Good to see you
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="text-gemini-muted text-lg mb-12 italic"
                >
                  How can I help you today?
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-2.5"
                >
                  <SuggestedPill icon="create" text="Create image" />
                  <SuggestedPill icon="explore" text="Explore ideas" />
                  <SuggestedPill icon="boost" text="Boost my day" />
                  <SuggestedPill icon="code" text="Write code" />
                  <SuggestedPill icon="learn" text="Help me learn" />
                  <SuggestedPill icon="write" text="Write anything" />
                </motion.div>
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gemini-blue/20 to-gemini-violet/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-gemini-blue animate-pulse" />
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
  const isPlaying = useStore((s) => s.isPlaying)
  const setIsPlaying = useStore((s) => s.setIsPlaying)
  const [copied, setCopied] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const isUser = message.role === 'user'
  const isStreaming = message.isStreaming

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

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
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(message.audioUrl)
      audioRef.current = audio
      setIsPlaying(true)
      audio.play().catch(() => toast.error('Audio playback failed'))
      audio.onended = () => {
        setIsPlaying(false)
        audioRef.current = null
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start gap-3 px-4 md:px-0 group ${isUser ? '' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-gradient-to-br from-gemini-blue via-gemini-violet to-gemini-pink text-white text-xs font-bold shadow-md shadow-gemini-blue/20'
          : 'bg-gradient-to-br from-gemini-blue/20 to-gemini-violet/20'
      }`}>
        {isUser ? (
          'U'
        ) : (
          <Sparkles className="w-4 h-4 text-gemini-blue" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 py-1">
        <h3 className="text-lg font-bold text-gemini-blue mb-1">
          {isUser ? 'You' : 'VoxFlow'}
        </h3>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'glass-card'
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
        <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1">
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
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlay}
              aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
              className="p-1.5 rounded-lg text-gemini-muted hover:text-gemini-text hover:bg-gemini-hover transition-all"
            >
              {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
})

function SuggestedPill({ icon, text }: { icon: string, text: string }) {
  const setService = useStore((s) => s.setService)

  const iconMap: Record<string, string> = {
    create: '🎨',
    explore: '🔮',
    boost: '⚡',
    code: '💻',
    learn: '📚',
    write: '✍️',
  }

  return (
    <motion.button 
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => text === 'Write anything' && setService('writer')}
      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-card hover:bg-gemini-hover transition-all text-sm text-gemini-text-secondary hover:text-gemini-text group"
    >
      <span className="text-base">{iconMap[icon] || '✨'}</span>
      <span className="flex-1 text-left">{text}</span>
      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-gemini-muted" />
    </motion.button>
  )
}
