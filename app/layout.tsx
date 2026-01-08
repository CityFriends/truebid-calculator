import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import { AppProvider } from '@/contexts/app-context'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { LayoutWrapper } from '@/components/shared/layout-wrapper'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/error-boundary'

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
        <ErrorBoundary>
          <ThemeProvider>
            <AppProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </AppProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}