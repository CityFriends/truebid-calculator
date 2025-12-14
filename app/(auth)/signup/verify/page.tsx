'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'your email'
  
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleResend = async () => {
    if (cooldown > 0) return
    
    setIsResending(true)
    setResendSuccess(false)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setResendSuccess(true)
      setCooldown(60)
    } finally {
      setIsResending(false)
    }
  }

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@')
    if (!domain) return email
    const maskedLocal = local.length > 3 
      ? `${local.slice(0, 2)}${'•'.repeat(Math.min(local.length - 3, 4))}${local.slice(-1)}`
      : local
    return `${maskedLocal}@${domain}`
  }

  // For demo: allow continuing without real verification
  const handleContinueDemo = () => {
    router.push('/onboarding')
  }

  return (
    <AuthLayout title="Check your email" showSignIn>
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-gray-600" />
        </div>

        <div className="space-y-2">
          <p className="text-gray-600">
            We sent a verification link to
          </p>
          <p className="font-medium text-gray-900">
            {maskEmail(email)}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3">
          <p className="text-sm font-medium text-gray-900">
            What to do next:
          </p>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Open your email inbox</li>
            <li>Find the email from TrueBid</li>
            <li>Click the verification link</li>
          </ol>
          <p className="text-xs text-gray-500">
            The link will expire in 24 hours.
          </p>
        </div>

        {/* Demo: Continue without verification */}
        <div className="pt-2">
          <Button
            onClick={handleContinueDemo}
            className="w-full h-12 bg-black hover:bg-gray-800"
          >
            Continue to setup
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-xs text-gray-400 mt-2">
            Demo mode: Click to continue without email verification
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {resendSuccess && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              Verification email sent!
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              'Resend verification email'
            )}
          </Button>

          <p className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700">
              try a different email
            </Link>
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}