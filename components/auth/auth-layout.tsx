'use client'

import Link from 'next/link'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  showSignUp?: boolean
  showSignIn?: boolean
}

export function AuthLayout({ 
  children, 
  title, 
  subtitle,
  showSignUp = false,
  showSignIn = false,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center">
            <span className="text-white dark:text-black font-bold text-sm">T</span>
          </div>
        </Link>
        
        {showSignUp && (
          <Link 
            href="/signup"
            className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Sign Up
          </Link>
        )}
        
        {showSignIn && (
          <Link 
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Log In
          </Link>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[400px]">
          {/* Title section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form content - no card wrapper for cleaner look */}
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  )
}