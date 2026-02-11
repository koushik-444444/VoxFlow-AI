'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bot, Volume2, VolumeX, Copy, Check, FileText } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useState } from 'react'

export function ChatArea() {
  const { conversations, currentConversationId, isRecording, isTranscribing, assistantIsThinking, setService } = useStore()
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
              <div className="w-full max-w-2xl px-6">
                <h2 className="text-5xl font-medium tracking-tight mb-8">
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">Hi Koushik</span>
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
            <div className="w-10 h-10 rounded-full bg-gemini-hover flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-gemini-blue" />
            </div>
            <div className="flex-1 py-2">
              <p className="text-gemini-text italic animate-pulse">
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
              <div className="w-6 h-6 bg-gemini-gradient rounded-full animate-spin-slow blur-[2px] opacity-80" />
            </div>
            <div className="flex-1 py-2">
              <span className="text-gemini-muted">VoxFlow is thinking...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: any
  index: number
}

function MessageBubble({ message, index }: MessageBubbleProps) {
  const { isPlaying, setIsPlaying } = useStore()
  const [copied, setCopied] = useState(false)

  const isUser = message.role === 'user'
  const isStreaming = message.isStreaming

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePlay = () => {
    if (message.audioUrl) {
      const audio = new Audio(message.audioUrl)
      setIsPlaying(true)
      audio.play()
      audio.onended = () => setIsPlaying(false)
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
          'K'
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
          <button
            onClick={handleCopy}
            className="p-2 rounded-full hover:bg-[#333537] text-[#c4c7c5] hover:text-white transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {!isUser && message.audioUrl && (
            <button
              onClick={handlePlay}
              className="p-2 rounded-full hover:bg-[#333537] text-[#c4c7c5] hover:text-white transition-all"
            >
              {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function SuggestedPill({ icon, text }: { icon: string, text: string }) {
  const { setService } = useStore()
  return (
    <button 
      onClick={() => text === 'Write anything' && setService('writer')}
      className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1e1f20] border border-[#444746] hover:bg-[#333537] transition-all text-sm font-medium text-[#e3e3e3]"
    >
      <span>{icon}</span>
      <span>{text}</span>
    </button>
  )
}
