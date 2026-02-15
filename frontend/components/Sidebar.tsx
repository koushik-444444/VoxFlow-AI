'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Plus,
  Trash2,
  Settings,
  History,
  HelpCircle,
  Gem,
  Bookmark
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
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="border-r border-[#444746] bg-[#1e1f20] flex flex-col z-20"
        >
          {/* Menu Button */}
          <div className="p-4">
            <motion.button
              whileHover={{ backgroundColor: 'rgba(51, 53, 55, 1)' }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleSidebar}
              aria-label="Close sidebar"
              className="p-2 rounded-full text-[#c4c7c5] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
          </div>

          {/* New Chat Button */}
          <div className="px-4 pb-6 mt-2">
            <motion.button
              whileHover={{ backgroundColor: 'rgba(51, 53, 55, 1)', scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={createConversation}
              className="flex items-center gap-3 px-4 py-3 rounded-full bg-[#131314] text-[#e3e3e3] font-medium transition-all group border border-[#444746] shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm">New chat</span>
            </motion.button>
          </div>

          {/* Fixed Categories */}
          <div className="px-2 space-y-1">
             <SidebarItem icon={<Bookmark className="w-4 h-4" />} text="My stuff" />
             <SidebarItem icon={<Gem className="w-4 h-4" />} text="Gems" />
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 mt-6 space-y-1 custom-scrollbar">
            <p className="px-4 py-2 text-[12px] font-medium text-[#c4c7c5]">Recent</p>
            {conversations.map((conversation) => (
              <motion.button
                key={conversation.id}
                whileHover={{ backgroundColor: 'rgba(51, 53, 55, 1)' }}
                whileTap={{ scale: 0.98 }}
                className={`group relative flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer transition-all w-full text-left ${
                  currentConversationId === conversation.id
                    ? 'bg-[#004a77] text-[#c2e7ff]'
                    : 'text-[#e3e3e3]'
                }`}
                onClick={() => setCurrentConversation(conversation.id)}
                aria-label={`Switch to conversation: ${conversation.title}`}
                aria-current={currentConversationId === conversation.id ? 'true' : undefined}
              >
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentConversationId === conversation.id ? 'text-[#c2e7ff]' : 'text-[#c4c7c5]'}`} />
                <p className="text-sm font-medium truncate flex-1">
                  {conversation.title}
                </p>
                <motion.button
                  whileHover={{ scale: 1.2, color: '#f87171' }}
                  whileTap={{ scale: 0.8 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conversation.id)
                  }}
                  aria-label={`Delete conversation: ${conversation.title}`}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-black/10 transition-all`}
                >
                  <Trash2 className="w-3 h-3" />
                </motion.button>
              </motion.button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#444746]">
            <SidebarItem icon={<Settings className="w-4 h-4" />} text="Settings & help" />
          </div>
        </motion.aside>
      )}

      {/* Toggle button when collapsed */}
      {!sidebarOpen && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ backgroundColor: 'rgba(51, 53, 55, 1)', scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleSidebar}
          aria-label="Open sidebar"
          className="absolute left-4 top-4 z-50 p-2 rounded-full text-[#c4c7c5] transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

function SidebarItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <motion.button 
      whileHover={{ backgroundColor: 'rgba(51, 53, 55, 1)' }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full text-[#e3e3e3] transition-colors"
    >
      <span className="text-[#c4c7c5]">{icon}</span>
      <span className="text-sm font-medium">{text}</span>
    </motion.button>
  )
}
