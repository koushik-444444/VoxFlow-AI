import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { VADManager } from '@/components/VADManager'

const outfit = Outfit({ 
  subsets: ['latin'], 
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'VoxFlow - Real-time Voice Conversations',
  description: 'AI-powered speech-to-speech conversations with natural language processing',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} font-sans bg-gemini-bg text-slate-100 antialiased`}>
        <ErrorBoundary>
          <VADManager />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
