'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bot, Volume2, VolumeX, Copy, Check } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useState } from 'react'

export function ChatArea() {
  const { conversations, currentConversationId, isRecording } = useStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const currentConversation = conversations.find(
    (c) => c.id === currentConversationId
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [currentConversation?.messages])

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth"
    >
      <AnimatePresence mode="popLayout">
        {currentConversation?.messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            index={index}
          />
        ))}

        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-start gap-4"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-slate-400 ml-2">Listening...</span>
            </div>
          </motion.div>
        )}

        {!currentConversation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center py-20"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center mb-6">
              <Bot className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-200 mb-2">
              Welcome to Speech AI
            </h2>
            <p className="text-slate-400 max-w-md">
              Start a conversation by clicking the microphone button below or create a new chat.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-4 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`group relative max-w-[80%] px-5 py-4 rounded-2xl ${
          isUser
            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
            : 'bg-slate-800/80 border border-slate-700/50 text-slate-200'
        }`}
      >
        {/* Text */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}
        </p>

        {/* Actions */}
        <div
          className={`absolute ${
            isUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
          } top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 px-2`}
        >
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {!isUser && message.audioUrl && (
            <button
              onClick={handlePlay}
              className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-colors"
              title="Play"
            >
              {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Timestamp */}
        <span
          className={`text-xs mt-2 block ${
            isUser ? 'text-indigo-200' : 'text-slate-500'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </motion.div>
  )
}
