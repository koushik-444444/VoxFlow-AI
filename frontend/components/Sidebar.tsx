'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Plus,
  Trash2,
  Settings,
  Bookmark,
  Gem,
  Sparkles
} from 'lucide-react'
import { useStore } from '@/store/useStore'

export function Sidebar() {
  const conversations = useStore((s) => s.conversations)
  const currentConversationId = useStore((s) => s.currentConversationId)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const setCurrentConversation = useStore((s) => s.setCurrentConversation)
  const createConversation = useStore((s) => s.createConversation)
  const deleteConversation = useStore((s) => s.deleteConversation)

  return (
    <AnimatePresence mode="wait">
      {sidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="glass-panel flex flex-col z-20 overflow-hidden"
        >
          {/* Top: Menu + New Chat */}
          <div className="p-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-4 px-1">
              <motion.button
                whileHover={{ backgroundColor: 'rgba(42, 43, 46, 1)' }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleSidebar}
                aria-label="Close sidebar"
                className="p-2 rounded-xl text-gemini-muted hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={createConversation}
                aria-label="New chat"
                className="p-2 rounded-xl text-gemini-blue hover:bg-gemini-hover transition-all"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>

            {/* New Chat Button */}
            <motion.button
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={createConversation}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl glass-card hover:bg-gemini-hover text-gemini-text font-medium transition-all group glow-blue"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gemini-blue/20 to-gemini-violet/20 flex items-center justify-center overflow-hidden">
                <img src="/voxflow-bot.png" alt="VoxFlow Bot" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm">New conversation</span>
            </motion.button>
          </div>

          {/* Categories */}
          <div className="px-2 py-1 flex-shrink-0">
            <SidebarItem icon={<Bookmark className="w-4 h-4" />} text="Saved" />
            <SidebarItem icon={<Gem className="w-4 h-4" />} text="Gems" />
          </div>

          {/* Divider */}
          <div className="mx-4 my-2 h-px bg-gradient-to-r from-transparent via-gemini-border to-transparent" />

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar min-h-0">
            <h3 className="px-3 py-3 text-lg font-bold tracking-tight text-gemini-text-secondary">Recent</h3>
            {conversations.map((conversation, index) => (
              <motion.button
                key={conversation.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all w-full text-left ${
                  currentConversationId === conversation.id
                    ? 'bg-gemini-blue/10 text-gemini-blue'
                    : 'text-gemini-text-secondary hover:bg-gemini-hover hover:text-gemini-text'
                }`}
                onClick={() => setCurrentConversation(conversation.id)}
                aria-label={`Switch to conversation: ${conversation.title}`}
                aria-current={currentConversationId === conversation.id ? 'true' : undefined}
              >
                {/* Active indicator bar */}
                {currentConversationId === conversation.id && (
                  <motion.div
                    layoutId="activeConversation"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gemini-blue"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                  currentConversationId === conversation.id ? 'text-gemini-blue' : 'text-gemini-muted'
                }`} />
                <p className="text-sm truncate flex-1">{conversation.title}</p>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conversation.id)
                  }}
                  aria-label={`Delete conversation: ${conversation.title}`}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </motion.button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-2 flex-shrink-0">
            <div className="mx-2 mb-2 h-px bg-gradient-to-r from-transparent via-gemini-border to-transparent" />
            <SidebarItem icon={<Settings className="w-4 h-4" />} text="Settings" />
          </div>
        </motion.aside>
      )}

      {/* Toggle button when collapsed */}
      {!sidebarOpen && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ backgroundColor: 'rgba(42, 43, 46, 1)', scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleSidebar}
          aria-label="Open sidebar"
          className="absolute left-4 top-4 z-50 p-2 rounded-xl text-gemini-muted hover:text-white transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

function SidebarItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <motion.button 
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gemini-text-secondary hover:text-gemini-text hover:bg-gemini-hover transition-all"
    >
      <span className="text-gemini-muted">{icon}</span>
      <h3 className="text-sm font-bold tracking-tight">{text}</h3>
    </motion.button>
  )
}
