import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import { AppProvider } from '@/contexts/app-context'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { AppHeader } from '@/components/shared/app-header'  // ← Changed
import { Footer } from '@/components/shared/footer'

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} min-h-screen flex flex-col`}>
        <ThemeProvider>
          <AppProvider>
            <AppHeader />  {/* ← Changed */}
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
              {children}
            </div>
            <Footer />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}