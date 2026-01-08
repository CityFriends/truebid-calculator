'use client'

import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // TODO: Add Sentry logging here
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-4">
              We encountered an unexpected error. Please try again.
            </p>
            <Button onClick={this.handleRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Simpler fallback for individual sections
interface ErrorFallbackProps {
  message?: string
  onRetry?: () => void
}

export function ErrorFallback({ message = 'Failed to load this section', onRetry }: ErrorFallbackProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
      <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">{message}</span>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      )}
    </div>
  )
}

// Dev-only test button - throws error to test ErrorBoundary
function BrokenComponent(): never {
  throw new Error('Test error from ErrorBoundary test button')
}

export function TestErrorButton() {
  const [shouldError, setShouldError] = React.useState(false)

  if (process.env.NODE_ENV !== 'development') return null

  if (shouldError) {
    return <BrokenComponent />
  }

  return (
    <button
      onClick={() => setShouldError(true)}
      className="fixed bottom-4 left-4 z-50 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded border border-red-300 hover:bg-red-200"
    >
      Test Error
    </button>
  )
}
