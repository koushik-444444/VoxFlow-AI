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
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-vox-gradient flex items-center justify-center shadow-lg shadow-vox-purple/20">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-xl tracking-tight text-white">VoxFlow</span>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl bg-vox-light border border-vox-gray text-slate-400 hover:text-white transition-all shadow-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* New Conversation Button */}
          <div className="px-6 pb-4">
            <button
              onClick={createConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-vox-gradient hover:opacity-90 text-white font-bold transition-all shadow-xl shadow-vox-purple/20"
            >
              <Plus className="w-6 h-6" />
              New Session
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {conversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`group relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${
                  currentConversationId === conversation.id
                    ? 'bg-vox-gray border-vox-purple/50 shadow-lg'
                    : 'bg-vox-light/40 border-transparent hover:bg-vox-light/80 hover:border-vox-gray'
                }`}
                onClick={() => setCurrentConversation(conversation.id)}
              >
                <div
                  className={`w-1.5 h-8 rounded-full ${
                    currentConversationId === conversation.id
                      ? 'bg-vox-purple shadow-[0_0_10px_#ac1ed6]'
                      : 'bg-vox-gray'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-slate-100 truncate">
                    {conversation.title}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
                    {format(new Date(conversation.updatedAt), 'MMM d • HH:mm')}
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
