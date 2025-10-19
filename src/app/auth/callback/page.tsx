'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, CheckCircle, Loader2 } from 'lucide-react'
import { Suspense } from 'react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processInviteToken = async () => {
      console.log('[Auth Callback] Processing invite token...')
      console.log('[Auth Callback] Full URL:', window.location.href)

      // Check for error in URL (expired token, etc.)
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (errorParam) {
        console.error('[Auth Callback] Error in URL:', errorParam, errorDescription)
        setError(errorDescription || 'Invalid or expired invitation link')
        setLoading(false)
        return
      }

      // Check URL hash for tokens (invite links use hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const tokenType = hashParams.get('type')

      console.log('[Auth Callback] Token type:', tokenType)
      console.log('[Auth Callback] Has access token:', !!accessToken)
      console.log('[Auth Callback] Has refresh token:', !!refreshToken)

      // Also check query params (some Supabase versions use query instead of hash)
      const queryAccessToken = searchParams.get('access_token')
      const queryRefreshToken = searchParams.get('refresh_token')
      const queryTokenType = searchParams.get('type')

      const finalAccessToken = accessToken || queryAccessToken
      const finalRefreshToken = refreshToken || queryRefreshToken
      const finalTokenType = tokenType || queryTokenType

      if (!finalAccessToken || !finalRefreshToken) {
        console.error('[Auth Callback] Missing tokens in URL')
        setError('Invalid invitation link - missing authentication tokens')
        setLoading(false)
        return
      }

      // Verify this is an invite token
      if (finalTokenType !== 'invite' && finalTokenType !== 'recovery') {
        console.warn('[Auth Callback] Unexpected token type:', finalTokenType)
      }

      try {
        // Set the session using the tokens from the URL
        console.log('[Auth Callback] Setting session with tokens...')
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: finalAccessToken,
          refresh_token: finalRefreshToken
        })

        if (sessionError) {
          console.error('[Auth Callback] Session error:', sessionError)
          setError('Failed to verify invitation: ' + sessionError.message)
          setLoading(false)
          return
        }

        if (!sessionData.session) {
          console.error('[Auth Callback] No session created')
          setError('Failed to establish session')
          setLoading(false)
          return
        }

        console.log('[Auth Callback] ✅ Session established for:', sessionData.session.user.email)
        setLoading(false)
      } catch (err: any) {
        console.error('[Auth Callback] Error processing token:', err)
        setError('Failed to process invitation link')
        setLoading(false)
      }
    }

    processInviteToken()
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setSubmitting(true)

    try {
      console.log('[Auth Callback] Updating user password...')

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error('[Auth Callback] Password update error:', updateError)
        toast.error(updateError.message)
        setSubmitting(false)
        return
      }

      console.log('[Auth Callback] ✅ Password set successfully')
      setSuccess(true)
      toast.success('Password created successfully!')

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      console.error('[Auth Callback] Error setting password:', err)
      toast.error(err.message || 'An error occurred')
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Verifying your invitation...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6 text-center">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/auth')}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-semibold hover:from-primary/90 hover:to-purple-600/90 transition-all shadow-lg"
              >
                Go to Sign In
              </button>
              <button
                onClick={() => router.push('/forgot-password')}
                className="w-full py-3 px-4 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Request New Invitation
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Design-Rite!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been created successfully. Redirecting to your dashboard...
            </p>
            <div className="animate-pulse text-primary">Please wait...</div>
          </div>
        </div>
      </div>
    )
  }

  // Password creation form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Password</h2>
            <p className="text-gray-600 text-sm">
              Welcome to Design-Rite! Choose a secure password to complete your account setup.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-12 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                  placeholder="••••••••"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-12 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                  placeholder="••••••••"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-semibold hover:from-primary/90 hover:to-purple-600/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Password...
                </span>
              ) : (
                'Create Password'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By creating your password, you agree to our{' '}
              <a href="https://design-rite.com/terms" className="text-primary hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="https://design-rite.com/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
