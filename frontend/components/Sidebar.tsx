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
  const {
    conversations,
    currentConversationId,
    sidebarOpen,
    toggleSidebar,
    setCurrentConversation,
    createConversation,
    deleteConversation,
  } = useStore()

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
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-[#333537] text-[#c4c7c5] transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* New Chat Button */}
          <div className="px-4 pb-6 mt-2">
            <button
              onClick={createConversation}
              className="flex items-center gap-3 px-4 py-3 rounded-full bg-[#131314] hover:bg-[#333537] text-[#e3e3e3] font-medium transition-all group border border-[#444746]"
            >
              <Plus className="w-5 h-5 text-blue-400" />
              <span className="text-sm">New chat</span>
            </button>
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
              <motion.div
                key={conversation.id}
                className={`group relative flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer transition-all ${
                  currentConversationId === conversation.id
                    ? 'bg-[#004a77] text-[#c2e7ff]'
                    : 'hover:bg-[#333537] text-[#e3e3e3]'
                }`}
                onClick={() => setCurrentConversation(conversation.id)}
              >
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentConversationId === conversation.id ? 'text-[#c2e7ff]' : 'text-[#c4c7c5]'}`} />
                <p className="text-sm font-medium truncate flex-1">
                  {conversation.title}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conversation.id)
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-black/10 transition-opacity`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={toggleSidebar}
          className="absolute left-4 top-4 z-50 p-2 rounded-full hover:bg-[#333537] text-[#c4c7c5] transition-all"
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
    <button className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full hover:bg-[#333537] text-[#e3e3e3] transition-all">
      <span className="text-[#c4c7c5]">{icon}</span>
      <span className="text-sm font-medium">{text}</span>
    </button>
  )
}
