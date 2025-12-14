'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, AlertCircle, Check, X, CheckCircle2, ArrowLeft } from 'lucide-react'

// Password requirements (same as signup)
interface PasswordRequirement {
  id: string
  label: string
  validator: (password: string) => boolean
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: 'length', label: 'At least 8 characters', validator: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', validator: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', validator: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', validator: (p) => /[0-9]/.test(p) },
]

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    const passed = PASSWORD_REQUIREMENTS.filter(req => req.validator(password))
    return {
      score: passed.length,
      total: PASSWORD_REQUIREMENTS.length,
      percentage: (passed.length / PASSWORD_REQUIREMENTS.length) * 100,
    }
  }, [password])

  const getStrengthColor = () => {
    if (strength.score === 0) return 'bg-gray-200'
    if (strength.score === 1) return 'bg-red-500'
    if (strength.score === 2) return 'bg-yellow-500'
    if (strength.score === 3) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getStrengthLabel = () => {
    if (strength.score === 0) return ''
    if (strength.score === 1) return 'Weak'
    if (strength.score === 2) return 'Fair'
    if (strength.score === 3) return 'Good'
    return 'Strong'
  }

  if (!password) return null

  return (
    <div className="space-y-3 mt-3">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Password strength</span>
          <span className={`font-medium ${
            strength.score <= 1 ? 'text-red-600' :
            strength.score === 2 ? 'text-yellow-600' :
            strength.score === 3 ? 'text-blue-600' :
            'text-green-600'
          }`}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-1">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const passed = req.validator(password)
          return (
            <div
              key={req.id}
              className={`flex items-center gap-1.5 text-xs ${
                passed ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {passed ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
              {req.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  // Form state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ 
    password?: string
    confirmPassword?: string 
  }>({})
  const [isValidToken, setIsValidToken] = useState(true)

  // Check if password meets all requirements
  const passwordIsValid = useMemo(() => {
    return PASSWORD_REQUIREMENTS.every(req => req.validator(password))
  }, [password])

  // Check token validity on mount
  useEffect(() => {
    if (!token) {
      setIsValidToken(false)
    }
    // TODO: Validate token with backend
  }, [token])

  // Validate form
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {}
    
    if (!password) {
      errors.password = 'Password is required'
    } else if (!passwordIsValid) {
      errors.password = 'Password does not meet requirements'
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      // TODO: Replace with actual Supabase password update
      // const { error } = await supabase.auth.updateUser({
      //   password: password
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setIsSuccess(true)
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Password reset error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <AuthLayout 
        title="Invalid reset link" 
        subtitle="This password reset link is invalid or has expired"
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Password reset links expire after 24 hours. Please request a new one.
          </p>

          <Button
            onClick={() => router.push('/forgot-password')}
            className="w-full"
          >
            Request new reset link
          </Button>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <AuthLayout 
        title="Password updated" 
        subtitle="Your password has been successfully reset"
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Your password has been changed. You'll be redirected to your dashboard shortly.
          </p>

          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>
      </AuthLayout>
    )
  }

  // Form state
  return (
    <AuthLayout 
      title="Create new password" 
      subtitle="Enter a new password for your account"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Global error message */}
        {error && (
          <div 
            className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* New password field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            New password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }))
              }}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              className={`h-11 pr-10 ${fieldErrors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className="text-sm text-red-600 dark:text-red-400">
              {fieldErrors.password}
            </p>
          )}
          <PasswordStrength password={password} />
        </div>

        {/* Confirm password field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm new password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }))
              }}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
              className={`h-11 pr-10 ${fieldErrors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p id="confirmPassword-error" className="text-sm text-red-600 dark:text-red-400">
              {fieldErrors.confirmPassword}
            </p>
          )}
          {password && confirmPassword && password === confirmPassword && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Passwords match
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button 
          type="submit" 
          className="w-full h-11 font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating password...
            </>
          ) : (
            'Reset password'
          )}
        </Button>

        {/* Back to login */}
        <div className="text-center pt-2">
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}