'use client'

import { useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Copy, Check } from 'lucide-react'
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
      className="flex-1 overflow-y-auto px-4 py-8 md:px-0 scroll-smooth relative z-10 custom-scrollbar"
    >
      <div className="max-w-3xl mx-auto w-full space-y-8">
        <AnimatePresence mode="popLayout">
          {!currentConversation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-20 flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="w-full max-w-2xl px-6 text-left">
                <h2 className="text-5xl font-medium tracking-tight mb-8">
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">Hello there</span>
                  <br />
                  <span className="text-[#c4c7c5]">Where should we start?</span>
                </h2>
                
                <div className="flex flex-wrap gap-2 mt-12">
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-4 px-6 md:px-0"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold border border-white/10">
                U
              </div>
              <div className="flex-1 py-2">
                <p className="text-[#e3e3e3] italic animate-pulse">
                  {isRecording ? 'Listening...' : 'Transcribing...'}
                </p>
              </div>
            </motion.div>
          )}

          {assistantIsThinking && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-4 px-6 md:px-0"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-6 h-6 bg-gemini-gradient rounded-full animate-spin-slow blur-[1px] opacity-80" />
              </div>
              <div className="flex-1 py-2">
                <span className="text-[#8e918f]">VoxFlow is thinking...</span>
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
      // Stop previous playback if any
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`flex items-start gap-4 px-6 md:px-0 group ${isUser ? 'flex-row' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-rose-500 text-white text-xs font-bold border border-white/10'
            : ''
        }`}
      >
        {isUser ? (
          'U'
        ) : (
          <div className="w-6 h-6 bg-gemini-gradient rounded-full animate-pulse blur-[1px]" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 py-2">
        <p className="text-[16px] leading-[1.6] text-[#e3e3e3] whitespace-pre-wrap font-medium">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-5 ml-1 bg-blue-400 animate-pulse align-middle" />
          )}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ backgroundColor: '#333537', scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy message'}
            className="p-2 rounded-full text-[#c4c7c5] hover:text-white transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </motion.button>

          {!isUser && message.audioUrl && (
            <motion.button
              whileHover={{ backgroundColor: '#333537', scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlay}
              aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
              className="p-2 rounded-full text-[#c4c7c5] hover:text-white transition-all"
            >
              {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </motion.button>
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
      whileHover={{ backgroundColor: '#333537', scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => text === 'Write anything' && setService('writer')}
      className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1e1f20] border border-[#444746] transition-all text-sm font-medium text-[#e3e3e3]"
    >
      <span>{icon}</span>
      <span>{text}</span>
    </motion.button>
  )
}
