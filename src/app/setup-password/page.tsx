'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Eye, EyeOff, Check, Lock, Shield } from 'lucide-react'

export default function SetupPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false
  })

  useEffect(() => {
    // Check if there's a session in the URL hash
    const hash = window.location.hash
    if (hash && hash.includes('session=')) {
      console.log('[Setup Password] Found session in URL hash, setting session...')
      try {
        const sessionParam = hash.split('session=')[1]
        const sessionData = JSON.parse(decodeURIComponent(sessionParam))

        // Set the session client-side
        supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token
        }).then(({ error }) => {
          if (error) {
            console.error('[Setup Password] Error setting session from URL:', error)
          } else {
            console.log('[Setup Password] ✅ Session set from URL hash for:', sessionData.user.email)
            // Clean up the URL hash
            window.history.replaceState(null, '', window.location.pathname)
          }
          // Check user after setting session
          checkUser()
        })
      } catch (error) {
        console.error('[Setup Password] Error parsing session from URL:', error)
        checkUser()
      }
    } else {
      console.log('[Setup Password] No session in URL, checking existing session')
      checkUser()
    }
  }, [])

  useEffect(() => {
    // Update password strength indicators
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    })
  }, [password])

  const checkUser = async (retryCount = 0) => {
    try {
      console.log('[Setup Password] Checking for user session... (attempt', retryCount + 1, ')')

      // Get session first to check if cookies are available
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[Setup Password] Session check:', session ? 'Session found' : 'No session')

      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        console.error('[Setup Password] Error getting user:', error)

        // Retry up to 3 times with delays (cookies might not be ready yet)
        if (retryCount < 3) {
          console.log('[Setup Password] Retrying in', (retryCount + 1) * 500, 'ms...')
          setTimeout(() => checkUser(retryCount + 1), (retryCount + 1) * 500)
          return
        }

        toast.error('Auth session missing! Please use the invite link from your email.')
        setTimeout(() => router.push('/auth'), 2000)
        return
      }

      if (!user) {
        console.error('[Setup Password] No user found in session')

        // Retry up to 3 times with delays (cookies might not be ready yet)
        if (retryCount < 3) {
          console.log('[Setup Password] Retrying in', (retryCount + 1) * 500, 'ms...')
          setTimeout(() => checkUser(retryCount + 1), (retryCount + 1) * 500)
          return
        }

        toast.error('Auth session missing! Please use the invite link from your email.')
        setTimeout(() => router.push('/auth'), 2000)
        return
      }

      console.log('[Setup Password] ✅ User session found:', user.email)
      setUser(user)
      setLoading(false)
    } catch (error) {
      console.error('[Setup Password] Exception checking user:', error)

      // Retry up to 3 times with delays
      if (retryCount < 3) {
        console.log('[Setup Password] Retrying in', (retryCount + 1) * 500, 'ms...')
        setTimeout(() => checkUser(retryCount + 1), (retryCount + 1) * 500)
        return
      }

      toast.error('Auth session missing! Please use the invite link from your email.')
      setTimeout(() => router.push('/auth'), 2000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('[Setup Password] Form submitted')

    if (password !== confirmPassword) {
      console.log('[Setup Password] Passwords do not match')
      toast.error('Passwords do not match')
      return
    }

    if (!passwordStrength.hasMinLength || !passwordStrength.hasUppercase ||
        !passwordStrength.hasLowercase || !passwordStrength.hasNumber ||
        !passwordStrength.hasSpecialChar) {
      console.log('[Setup Password] Password requirements not met')
      toast.error('Please meet all password requirements')
      return
    }

    setSubmitting(true)
    console.log('[Setup Password] Updating user password...')

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
        data: {
          password_set: true
        }
      })

      if (error) {
        console.error('[Setup Password] Error updating password:', error)
        toast.error(error.message)
        setSubmitting(false)
        return
      }

      console.log('[Setup Password] ✅ Password updated successfully!')
      toast.success('Password created successfully!')

      // Redirect to welcome page
      console.log('[Setup Password] Redirecting to /welcome...')
      setTimeout(() => {
        router.push('/welcome')
      }, 500)

    } catch (error: any) {
      console.error('[Setup Password] Exception updating password:', error)
      toast.error(error.message || 'Failed to create password')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    )
  }

  const isPasswordValid = Object.values(passwordStrength).every(v => v) && password === confirmPassword

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Create Your Password
            </h1>
            <p className="text-gray-600">
              Secure your account with a strong password
            </p>
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Setting up account for:</p>
                  <p className="text-sm text-blue-600">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
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
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-600 mt-2">Passwords do not match</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-3">Password Requirements:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordStrength.hasMinLength ? 'bg-green-100' : 'bg-gray-200'}`}>
                    {passwordStrength.hasMinLength && <Check className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className={`text-sm ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-600'}`}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordStrength.hasUppercase ? 'bg-green-100' : 'bg-gray-200'}`}>
                    {passwordStrength.hasUppercase && <Check className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className={`text-sm ${passwordStrength.hasUppercase ? 'text-green-600' : 'text-gray-600'}`}>
                    One uppercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordStrength.hasLowercase ? 'bg-green-100' : 'bg-gray-200'}`}>
                    {passwordStrength.hasLowercase && <Check className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className={`text-sm ${passwordStrength.hasLowercase ? 'text-green-600' : 'text-gray-600'}`}>
                    One lowercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordStrength.hasNumber ? 'bg-green-100' : 'bg-gray-200'}`}>
                    {passwordStrength.hasNumber && <Check className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className={`text-sm ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-600'}`}>
                    One number
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordStrength.hasSpecialChar ? 'bg-green-100' : 'bg-gray-200'}`}>
                    {passwordStrength.hasSpecialChar && <Check className="w-3 h-3 text-green-600" />}
                  </div>
                  <span className={`text-sm ${passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-gray-600'}`}>
                    One special character (!@#$%^&*)
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div>
              <button
                type="submit"
                disabled={submitting || !isPasswordValid}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Password...
                  </span>
                ) : (
                  'Create Password & Continue to Portal'
                )}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>🔐 Secure Access:</strong> Your password allows you to sign in quickly without waiting for email verification links. You can always change it later in your account settings.
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>
            Need help? <a href="/contact" className="text-purple-600 hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  )
}
