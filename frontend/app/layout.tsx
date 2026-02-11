import type { Metadata } from 'next'
import { Epilogue } from 'next/font/google'
import './globals.css'

const epilogue = Epilogue({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VoxFlow - Real-time Voice Conversations',
  description: 'AI-powered speech-to-speech conversations with natural language processing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${epilogue.className} bg-gemini-bg text-slate-100`}>
        {children}
      </body>
    </html>
  )
}
