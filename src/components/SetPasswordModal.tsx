'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, CheckCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface SetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function SetPasswordModal({ isOpen, onClose, onSuccess }: SetPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Password strength validation
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean)
  const passwordsMatch = password === confirmPassword && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPasswordValid) {
      toast.error('Please meet all password requirements')
      return
    }

    if (!passwordsMatch) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Update user password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('[Set Password] Error:', error)
        toast.error(error.message || 'Failed to set password')
        return
      }

      toast.success('Password set successfully! You can now sign in with your email and password.')
      onSuccess()
    } catch (error: any) {
      console.error('[Set Password] Unexpected error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    toast.info('You can set a password later from your account settings')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Set Your Password</h2>
              <p className="text-sm text-gray-500">Complete your account setup</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Skip for now"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Welcome!</strong> Set a password to sign in easily next time. You won't need to check your email for magic links anymore.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
            <div className="space-y-1 text-xs">
              <RequirementItem met={passwordRequirements.minLength} text="At least 8 characters" />
              <RequirementItem met={passwordRequirements.hasUppercase} text="One uppercase letter" />
              <RequirementItem met={passwordRequirements.hasLowercase} text="One lowercase letter" />
              <RequirementItem met={passwordRequirements.hasNumber} text="One number" />
              <RequirementItem met={passwordRequirements.hasSpecial} text="One special character (!@#$%^&*)" />
              <RequirementItem met={passwordsMatch} text="Passwords match" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={!isPasswordValid || !passwordsMatch || loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Setting Password...' : 'Set Password'}
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          You can change this password later in your account settings
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
      )}
      <span className={met ? 'text-green-700' : 'text-gray-600'}>{text}</span>
    </div>
  )
}
