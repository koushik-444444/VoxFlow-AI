'use client'

import { useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Copy, Check, User, Bot } from 'lucide-react'
import { useStore, Message } from '@/store/useStore'
import { useState } from 'react'
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
      className="flex-1 overflow-y-auto px-6 py-10 scroll-smooth relative z-10 custom-scrollbar"
    >
      <div className="max-w-4xl mx-auto w-full space-y-12">
        <AnimatePresence mode="popLayout">
          {!currentConversation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="py-20 flex flex-col items-start min-h-[50vh]"
            >
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-7xl font-black text-editorial tracking-tighter mb-12"
              >
                <span className="text-white">HI KOUSHIK.</span><br />
                <span className="text-transparent bg-clip-text bg-gemini-gradient">WHERE TO?</span>
              </motion.h2>
              
              <div className="flex flex-wrap gap-3">
                <SuggestedPill icon="🎨" text="Create image" />
                <SuggestedPill icon="🏏" text="Explore cricket" />
                <SuggestedPill icon="✨" text="Boost my day" />
                <SuggestedPill icon="✍️" text="Write anything" />
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-6 max-w-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center flex-shrink-0 shadow-2xl">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1 py-3">
                <p className="text-2xl font-light italic text-white/40 animate-pulse">
                  {isRecording ? "I'm listening..." : "Synthesizing thought..."}
                </p>
              </div>
            </motion.div>
          )}

          {assistantIsThinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-6 max-w-2xl"
            >
              <div className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center flex-shrink-0">
                <div className="w-4 h-4 bg-gemini-gradient rounded-full animate-spin-slow blur-[1px]" />
              </div>
              <div className="flex-1 py-3">
                <div className="flex gap-1.5 h-8 items-center">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-gemini-blue"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const MessageBubble = memo(function MessageBubble({ message }: { message: Message, index: number }) {
  const isPlaying = useStore((s) => s.isPlaying)
  const setIsPlaying = useStore((s) => s.setIsPlaying)
  const [copied, setCopied] = useState(false)

  const isUser = message.role === 'user'
  const isStreaming = message.isStreaming

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-6 ${isUser ? 'flex-row' : 'flex-row'}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl transition-transform hover:scale-105 ${
        isUser ? 'bg-white text-black' : 'border border-white/10 text-white'
      }`}>
        {isUser ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6 text-gemini-blue" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`relative px-8 py-6 rounded-[2rem] message-surface ${isUser ? 'user-message-gradient' : ''}`}>
          <p className={`text-xl leading-relaxed font-light ${isUser ? 'text-white' : 'text-white/80'}`}>
            {message.content}
            {isStreaming && (
              <span className="inline-block w-1 h-6 ml-2 bg-gemini-blue animate-pulse align-middle" />
            )}
          </p>

          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={handleCopy} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
             </button>
          </div>
        </div>
        
        {!isUser && message.audioUrl && (
           <div className="mt-4 flex items-center gap-3 px-4">
              <div className="flex gap-1 h-4 items-center">
                 {[...Array(12)].map((_, i) => (
                    <motion.div 
                       key={i}
                       animate={isPlaying ? { height: [4, 16, 4] } : { height: 4 }}
                       transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                       className="w-[2px] bg-gemini-blue/40"
                    />
                 ))}
              </div>
              <span className="text-[10px] font-black text-mono-technical opacity-20 uppercase tracking-[0.2em]">
                 {isPlaying ? 'Sonic stream active' : 'Audio data available'}
              </span>
           </div>
        )}
      </div>
    </motion.div>
  )
})

function SuggestedPill({ icon, text }: { icon: string, text: string }) {
  const setService = useStore((s) => s.setService)
  return (
    <motion.button 
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => text === 'Write anything' && setService('writer')}
      className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.05] transition-all text-sm font-black uppercase tracking-widest text-white/60 hover:text-white"
    >
      <span className="mr-3">{icon}</span>
      {text}
    </motion.button>
  )
}
