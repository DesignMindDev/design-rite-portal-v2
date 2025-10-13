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
        return
      }

      try {
        console.log('[SessionRestorer] Found auth hash, attempting to restore session...')
        setIsRestoring(true)

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

        // Import supabase client and set the session
        const { supabase } = await import('@/lib/supabase')

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

          // Clean up the hash from the URL
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
          )

          // Force a refresh to update auth state
          // Use router.refresh() instead of reload for better UX
          router.refresh()
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
