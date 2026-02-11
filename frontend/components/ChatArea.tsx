'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bot, Volume2, VolumeX, Copy, Check } from 'lucide-react'
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
      className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scroll-smooth relative z-10"
    >
      <AnimatePresence mode="popLayout">
        {!currentConversation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto pt-10 pb-20"
          >
            <h2 className="text-5xl font-black tracking-tighter text-white mb-4 leading-tight">
              Create, explore,<br />be inspired
            </h2>
            
            {/* Search Mockup from Image 1 */}
            <div className="relative mt-8 group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-500 group-focus-within:text-vox-purple transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-vox-gray/50 border-2 border-vox-light hover:border-vox-gray focus:border-vox-purple focus:outline-none rounded-[24px] py-5 pl-14 pr-6 text-white font-medium transition-all"
              />
            </div>

            {/* Quick Actions from Image 1 */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div 
                onClick={() => setService('writer')}
                className="p-6 rounded-[32px] bg-vox-gray border border-vox-light hover:bg-vox-light transition-all cursor-pointer group shadow-xl active:scale-95"
              >
                <p className="font-black text-xl text-white mb-10 leading-tight">AI text<br />writer</p>
                <div className="flex justify-end">
                  <div className="w-10 h-10 rounded-full bg-vox-light flex items-center justify-center group-hover:bg-vox-purple transition-all">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-[32px] bg-vox-gray border border-vox-light hover:bg-vox-light transition-all cursor-pointer group shadow-xl">
                <p className="font-black text-xl text-white mb-10 leading-tight">AI image<br />generator</p>
                <div className="flex justify-end">
                  <div className="w-10 h-10 rounded-full bg-vox-light flex items-center justify-center group-hover:bg-vox-purple transition-all">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </div>
                </div>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-vox-gradient flex items-center justify-center flex-shrink-0 shadow-lg shadow-vox-purple/20">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-vox-gray border border-vox-light shadow-xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-vox-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-vox-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-vox-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-slate-300 font-medium">
                {isRecording ? 'Listening...' : 'Transcribing...'}
              </span>
            </div>
          </motion.div>
        )}

        {assistantIsThinking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-row-reverse items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-vox-light border border-vox-gray flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-vox-rose" />
            </div>
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-vox-gray border border-vox-light shadow-xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-vox-rose rounded-full animate-pulse" />
              </div>
              <span className="text-sm text-slate-300 font-medium">VoxFlow is thinking...</span>
            </div>
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
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
          isUser
            ? 'bg-vox-gradient shadow-vox-purple/20'
            : 'bg-vox-light border border-vox-gray shadow-black/40'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className={`w-5 h-5 ${isUser ? 'text-white' : 'text-vox-rose'}`} />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`group relative max-w-[80%] px-6 py-4 rounded-3xl shadow-xl ${
          isUser
            ? 'bg-vox-gradient text-white'
            : 'bg-vox-gray border border-vox-light text-slate-200'
        }`}
      >
        {/* Text */}
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}
        </p>

        {/* Actions */}
        <div
          className={`absolute ${
            isUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
          } top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 px-3`}
        >
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-vox-gray border border-vox-light text-slate-400 hover:text-vox-purple transition-all"
            title="Copy"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {!isUser && message.audioUrl && (
            <button
              onClick={handlePlay}
              className="p-2 rounded-xl bg-vox-gray border border-vox-light text-slate-400 hover:text-vox-rose transition-all"
              title="Play"
            >
              {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Timestamp */}
        <span
          className={`text-[10px] mt-2 block font-bold uppercase tracking-wider ${
            isUser ? 'text-white/60' : 'text-slate-500'
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
