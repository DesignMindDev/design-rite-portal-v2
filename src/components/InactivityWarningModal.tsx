'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Activity } from 'lucide-react'

interface InactivityWarningModalProps {
  isOpen: boolean
  onStillHere: () => void
  onLogout: () => void
  /** Seconds until auto logout (default 30 minutes = 1800 seconds) */
  timeUntilLogout?: number
}

/**
 * Modal shown when user has been inactive for the warning threshold
 * Shows countdown until auto logout
 */
export default function InactivityWarningModal({
  isOpen,
  onStillHere,
  onLogout,
  timeUntilLogout = 1800 // 30 minutes in seconds
}: InactivityWarningModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(timeUntilLogout)

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(timeUntilLogout)
      return
    }

    // Countdown timer
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, onLogout, timeUntilLogout])

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in fade-in zoom-in duration-300">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Still there?
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-center mb-6">
          You've been inactive for a while. For your security, you'll be automatically signed out in:
        </p>

        {/* Countdown */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 mb-6 border border-amber-200">
          <div className="text-center">
            <div className="text-5xl font-bold text-amber-600 mb-2 font-mono">
              {formatTime(secondsRemaining)}
            </div>
            <div className="text-sm text-amber-700 font-medium">
              minutes remaining
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onStillHere}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-semibold hover:from-primary/90 hover:to-purple-600/90 transition-all shadow-lg hover:shadow-xl"
          >
            <Activity className="w-5 h-5" />
            I'm Still Here
          </button>
          <button
            onClick={onLogout}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Sign Out Now
          </button>
        </div>

        {/* Help text */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Click "I'm Still Here" to continue your session or any key to stay active.
        </p>
      </div>
    </div>
  )
}
