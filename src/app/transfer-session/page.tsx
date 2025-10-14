'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { authHelpers } from '@/lib/supabase'
import { Loader2, ExternalLink } from 'lucide-react'

export default function TransferSessionPage() {
  const { user, loading } = useAuth()
  const [transferring, setTransferring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('[TransferSession] useEffect triggered', { loading, user: !!user })

    // Only wait for user to be present, don't wait for loading to finish
    // because loading might stay true while fetching profile/role data
    if (user) {
      console.log('[TransferSession] User found - calling handleTransfer()')
      handleTransfer()
    } else if (!loading && !user) {
      console.log('[TransferSession] Loading complete but no user found')
    }
  }, [user, loading])

  async function handleTransfer() {
    console.log('[TransferSession] handleTransfer() started')
    setTransferring(true)
    setError(null)

    try {
      console.log('[TransferSession] Getting current session...')
      const session = await authHelpers.getCurrentSession()

      if (!session) {
        console.error('[TransferSession] No session found')
        setError('No active session found. Please sign in again.')
        setTransferring(false)
        return
      }

      console.log('[TransferSession] Session found, encoding tokens...')

      // Encode session data
      const authData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user_email: user?.email
      }

      const authDataString = encodeURIComponent(JSON.stringify(authData))

      // Determine target URL based on environment
      const mainPlatformUrl = process.env.NEXT_PUBLIC_MAIN_PLATFORM_URL || 'https://design-rite.com'

      // Add transfer=true query param to bypass middleware auth check
      const targetUrl = `${mainPlatformUrl}/admin?transfer=true#auth=${authDataString}`

      console.log('[TransferSession] Redirecting to:', targetUrl)

      // Transfer to main platform admin using URL hash for security
      window.location.href = targetUrl
    } catch (err: any) {
      console.error('[TransferSession] Error:', err)
      setError(err.message || 'Failed to transfer session')
      setTransferring(false)
    }
  }

  // Show loading state while waiting for user (but not if we already have user)
  if (loading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-gray-600">Loading your session...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Signed In</h2>
          <p className="text-gray-600 mb-6">You need to sign in before accessing the admin dashboard.</p>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </a>
            <button
              onClick={handleTransfer}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Transferring to Main Platform</h2>
        <p className="text-gray-600 mb-4">
          Securely transferring your session to the admin dashboard...
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <ExternalLink className="w-4 h-4" />
          <span>Redirecting to design-rite.com/admin</span>
        </div>
      </div>
    </div>
  )
}
