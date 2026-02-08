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
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="border-r border-slate-800/50 bg-slate-900/50 backdrop-blur-xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-200">Conversations</span>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* New Conversation Button */}
          <div className="p-4">
            <button
              onClick={createConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
            >
              <Plus className="w-5 h-5" />
              New Conversation
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
            {conversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  currentConversationId === conversation.id
                    ? 'bg-indigo-500/20 border border-indigo-500/30'
                    : 'hover:bg-slate-800/50 border border-transparent'
                }`}
                onClick={() => setCurrentConversation(conversation.id)}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    currentConversationId === conversation.id
                      ? 'bg-indigo-400'
                      : 'bg-slate-600'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {conversation.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(conversation.updatedAt), 'MMM d, h:mm a')}
                  </p>
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
          <div className="p-4 border-t border-slate-800/50">
            <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors">
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
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
