'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * SessionRestorer Component
 *
 * Handles session restoration when returning from the main platform (v4).
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
          console.log('[SessionRestorer] Active session already exists, no restoration needed', {
            userId: existingSession.user.id,
            email: existingSession.user.email
          })

          // Just clean up the hash and we're done
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
          )

          console.log('[SessionRestorer] Refreshing router with existing session...')
          router.refresh()
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

        const { data, error } = await supabase.auth.setSession({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token
        })

        if (error) {
          console.error('[SessionRestorer] Error setting session:', error)
          throw error
        }

        if (data.session) {
          console.log('[SessionRestorer] Session restored successfully!', {
            userId: data.session.user.id,
            email: data.session.user.email
          })

          // Clean up the hash from the URL
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
          )

          // Give the auth state change listener a moment to process
          await new Promise(resolve => setTimeout(resolve, 100))

          // Force a refresh to update auth state
          console.log('[SessionRestorer] Refreshing router...')
          router.refresh()
        } else {
          console.warn('[SessionRestorer] Session was set but data.session is null')
        }
      } catch (error) {
        console.error('[SessionRestorer] Failed to restore session:', error)
      } finally {
        setIsRestoring(false)
      }
    }

    restoreSessionFromHash()
  }, [router, pathname])

  // This component doesn't render anything
  return null
}
