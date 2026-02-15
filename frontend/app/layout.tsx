import type { Metadata } from 'next'
import { Inter, Epilogue } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const epilogue = Epilogue({ subsets: ['latin'], variable: '--font-epilogue' })

export const metadata: Metadata = {
  title: 'VoxFlow - Real-time Voice Conversations',
  description: 'AI-powered speech-to-speech conversations with natural language processing',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${epilogue.variable} font-sans bg-gemini-bg text-slate-100 antialiased`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
