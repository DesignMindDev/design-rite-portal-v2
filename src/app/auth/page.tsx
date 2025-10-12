'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { Eye, EyeOff, Shield, Zap, Users, Check } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const { user, loading, signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user && !loading) {
      router.push('/welcome')
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (isSignUp) {
        if (!fullName || !company) {
          toast.error('Please fill in all fields')
          setSubmitting(false)
          return
        }

        const { data, error } = await signUp(email, password, fullName, company)

        if (error) {
          toast.error(error.message)
        } else {
          toast.success('Account created successfully! Please check your email to verify your account.')
        }
      } else {
        const { data, error } = await signIn(email, password)

        if (error) {
          toast.error(error.message)
        } else {
          toast.success('Signed in successfully!')
          router.push('/welcome')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block">
          <div className="text-left space-y-6">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold text-sm">
              Welcome to Design-Rite Portal
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
              {isSignUp ? 'Start Your Journey' : 'Welcome Back'}
            </h1>
            <p className="text-xl text-gray-600">
              {isSignUp
                ? 'Join thousands of security professionals streamlining their proposal process'
                : 'Continue building professional proposals in minutes'}
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI-Powered Proposals</h3>
                  <p className="text-gray-600 text-sm">Generate professional security proposals in minutes, not hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Lightning Fast</h3>
                  <p className="text-gray-600 text-sm">Save 40+ hours per month on proposal creation and follow-ups</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Enterprise Security</h3>
                  <p className="text-gray-600 text-sm">Bank-level encryption and compliance-ready documentation</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Trusted by Experts</h3>
                  <p className="text-gray-600 text-sm">Join 1,000+ security professionals who trust Design-Rite</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isSignUp ? 'Create Your Account' : 'Sign In to Your Account'}
              </h2>
              <p className="text-gray-600 text-sm">
                {isSignUp
                  ? 'Get started with your free account today'
                  : 'Welcome back! Please enter your credentials'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required={isSignUp}
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Company *
                    </label>
                    <input
                      id="company"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required={isSignUp}
                      placeholder="Acme Security Inc"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  {!isSignUp && (
                    <a
                      href="/forgot-password"
                      className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                    placeholder="••••••••"
                    minLength={6}
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
                {isSignUp && (
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 6 characters long
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-semibold hover:from-primary/90 hover:to-purple-600/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Please wait...
                  </span>
                ) : isSignUp ? (
                  'Create My Free Account'
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {isSignUp ? (
                  <>
                    Already have an account?{' '}
                    <span className="text-primary font-semibold hover:underline">Sign In</span>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <span className="text-primary font-semibold hover:underline">Sign Up Free</span>
                  </>
                )}
              </button>
            </div>

            {isSignUp && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  By creating an account, you agree to our{' '}
                  <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                </p>
              </div>
            )}
          </div>

          <div className="lg:hidden mt-8 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">AI-Powered Proposals in Minutes</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">Save 40+ Hours Per Month</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">Enterprise-Grade Security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
