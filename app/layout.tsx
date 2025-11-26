import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/contexts/app-context'
import { Header } from '@/components/shared/header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TrueBid - Government Contracting Calculator',
  description: 'AI-powered bid analysis and pricing tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>
          <Header />
          {children}
        </AppProvider>
      </body>
    </html>
  )
}