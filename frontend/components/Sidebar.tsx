'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Plus,
  Trash2,
  Download,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { format } from 'date-fns'

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
          className="border-r border-gemini-border bg-gemini-sidebar flex flex-col z-20"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-gemini-hover text-gemini-muted hover:text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* New Chat Button */}
          <div className="px-4 pb-6 mt-4">
            <button
              onClick={createConversation}
              className="flex items-center gap-3 px-4 py-3 rounded-full bg-gemini-hover hover:bg-[#37393b] text-gemini-text font-medium transition-all group"
            >
              <Plus className="w-5 h-5 text-gemini-blue group-hover:scale-110 transition-transform" />
              <span className="text-sm">New chat</span>
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
            <p className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gemini-muted">Recent</p>
            {conversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-full cursor-pointer transition-all ${
                  currentConversationId === conversation.id
                    ? 'bg-[#d3e3fd] text-[#041e49]'
                    : 'hover:bg-gemini-hover text-gemini-text'
                }`}
                onClick={() => setCurrentConversation(conversation.id)}
              >
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentConversationId === conversation.id ? 'text-[#041e49]' : 'text-gemini-muted'}`} />
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

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      exportConversation(conversation)
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conversation.id)
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}

            {conversations.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new conversation to begin</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6">
            <button className="flex items-center gap-4 w-full p-4 rounded-2xl bg-vox-light/30 hover:bg-vox-light text-slate-400 hover:text-white transition-all border border-transparent hover:border-vox-gray">
              <div className="w-10 h-10 rounded-xl bg-vox-gray flex items-center justify-center">
                <Settings className="w-5 h-5 text-slate-300" />
              </div>
              <span className="text-sm font-bold">Settings</span>
            </button>
          </div>
        </motion.aside>
      )}

      {/* Toggle button when collapsed */}
      {!sidebarOpen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={toggleSidebar}
          className="absolute left-4 top-4 z-50 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

function exportConversation(conversation: any) {
  const dataStr = JSON.stringify(conversation, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `conversation-${conversation.id}.json`
  link.click()
  URL.revokeObjectURL(url)
}
