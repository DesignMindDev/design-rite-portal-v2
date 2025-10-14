'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * SessionRestorer handles incoming auth tokens from cross-platform navigation.
 * When design-rite.com redirects back to portal, it includes auth tokens in the URL hash.
 * This component extracts those tokens and establishes the session in the portal.
 *
 * URL Format: https://portal.design-rite.com/dashboard#auth={encodedTokens}
 */
export default function SessionRestorer() {
  const router = useRouter()
  const pathname = usePathname()
  const [isRestoring, setIsRestoring] = useState(false)

  useEffect(() => {
    const restoreSessionFromHash = async () => {
      // Only run on client side
      if (typeof window === 'undefined') return

      // Check if there's an auth hash in the URL
      const hash = window.location.hash
      if (!hash || !hash.includes('auth=')) {
        console.log('[SessionRestorer] No auth hash in URL, skipping restoration')
        return
      }

      try {
        console.log('[SessionRestorer] Found auth hash in URL')
        setIsRestoring(true)

        // Import supabase client first
        const { supabase } = await import('@/lib/supabase')

        // IMPORTANT: Check if we already have an active session
        // This prevents trying to restore tokens that are already in use
        const { data: { session: existingSession } } = await supabase.auth.getSession()

        if (existingSession) {
          console.log('[SessionRestorer] Active session already exists, cleaning URL and refreshing', {
            userId: existingSession.user.id,
            email: existingSession.user.email
          })

          // Clean up the hash from URL
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
          )

          // Force a hard refresh to ensure all components pick up the session
          // This helps avoid the infinite loading issue
          console.log('[SessionRestorer] Performing hard refresh to sync session state...')
          window.location.reload()
          return
        }

        console.log('[SessionRestorer] No existing session, attempting to restore from hash...')

        // Extract and decode the auth data from the hash
        const authMatch = hash.match(/auth=([^&]+)/)
        if (!authMatch) {
          console.error('[SessionRestorer] Invalid auth hash format')
          return
        }

        const encodedAuth = authMatch[1]
        const authDataString = decodeURIComponent(encodedAuth)
        const authData = JSON.parse(authDataString)

        console.log('[SessionRestorer] Decoded auth data, setting session...')

        // Set session with timeout protection
        const { data, error } = await supabase.auth.setSession({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token
        })

        if (error) {
          console.error('[SessionRestorer] Error setting session:', error)
          throw error
        }

        if (data.session) {
          console.log('[SessionRestorer] Session restored successfully!')

          // Clean up the hash from URL
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
          )

          // Force a hard refresh to ensure all components pick up the new session
          console.log('[SessionRestorer] Performing hard refresh after session restoration...')
          window.location.reload()
        } else {
          console.error('[SessionRestorer] No session returned after setSession')
        }
      } catch (error: any) {
        console.error('[SessionRestorer] Failed to restore session:', error)

        // Clean up the hash even on error
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        )

        // If session restoration fails, try a hard refresh in case there's a valid session
        if (error.message !== 'Session restoration timeout') {
          console.log('[SessionRestorer] Attempting recovery with page reload...')
          window.location.reload()
        }
      } finally {
        setIsRestoring(false)
      }
    }

    // Run restoration immediately
    restoreSessionFromHash()
  }, []) // Only run once on mount

  // This component doesn't render anything visible
  return null
}
