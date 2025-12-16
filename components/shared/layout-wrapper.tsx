'use client'

import { usePathname } from 'next/navigation'
import { AppHeader } from '@/components/shared/app-header'
import { Footer } from '@/components/shared/footer'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  const isAuthPage = pathname?.startsWith('/login') || 
                     pathname?.startsWith('/signup') || 
                     pathname?.startsWith('/forgot-password') ||
                     pathname?.startsWith('/reset-password') ||
                     pathname?.startsWith('/onboarding') 
                     pathname?.startsWith('/account')

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      <AppHeader />
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
        {children}
      </div>
      <Footer />
    </>
  )
}