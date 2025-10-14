'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Optimized SessionRestorer for faster loading when returning from V4
 *
 * Key Optimizations:
 * 1. Immediate localStorage caching for instant UI updates
 * 2. URL cleaning happens immediately to prevent re-processing
 * 3. 3-second timeout protection on session restoration
 * 4. router.refresh() instead of window.location.reload() (much faster)
 * 5. Dynamic Supabase import only when needed
 */
export default function SessionRestorer() {
  const router = useRouter()
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
        console.log('[SessionRestorer] Found auth hash, starting optimized restoration...')
        setIsRestoring(true)

        // Extract auth data immediately
        const authMatch = hash.match(/auth=([^&]+)/)
        if (!authMatch) {
          console.error('[SessionRestorer] Invalid auth hash format')
          return
        }

        const encodedAuth = authMatch[1]
        const authDataString = decodeURIComponent(encodedAuth)
        const authData = JSON.parse(authDataString)

        // OPTIMIZATION 1: Store session in localStorage immediately
        // This allows useAuth to detect it instantly while Supabase validates
        const tempSession = {
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
          timestamp: Date.now()
        }

        localStorage.setItem('portal-temp-session', JSON.stringify(tempSession))
        console.log('[SessionRestorer] Temporary session cached for instant access')

        // OPTIMIZATION 2: Clean URL immediately to prevent re-processing
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        )
        console.log('[SessionRestorer] URL cleaned')

        // OPTIMIZATION 3: Import Supabase dynamically only when needed
        const { supabase } = await import('@/lib/supabase')

        // Check if we already have an active session
        const { data: { session: existingSession } } = await supabase.auth.getSession()

        if (existingSession) {
          console.log('[SessionRestorer] Active session already exists, using it')
          localStorage.removeItem('portal-temp-session')
          router.refresh()
          return
        }

        // OPTIMIZATION 4: Use Promise.race with 3-second timeout
        const setSessionPromise = supabase.auth.setSession({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token
        })

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session restoration timeout')), 3000)
        )

        try {
          const { data, error } = await Promise.race([
            setSessionPromise,
            timeoutPromise
          ]) as any

          if (error) {
            console.error('[SessionRestorer] Error setting session:', error)
            // Continue with temp session
          } else if (data?.session) {
            console.log('[SessionRestorer] Session restored successfully in Supabase!')
            localStorage.removeItem('portal-temp-session')
          }
        } catch (timeoutError) {
          console.warn('[SessionRestorer] Session restoration timed out after 3s, proceeding with temp session')
          // Temp session will be used until Supabase finishes in background
        }

        // OPTIMIZATION 5: Use router.refresh() instead of window.location.reload()
        // This is MUCH faster as it doesn't reload JavaScript/CSS
        console.log('[SessionRestorer] Refreshing router...')
        router.refresh()

      } catch (error: any) {
        console.error('[SessionRestorer] Failed to restore session:', error)

        // Clean up on error
        localStorage.removeItem('portal-temp-session')
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        )

        // Try router refresh anyway
        router.refresh()
      } finally {
        setIsRestoring(false)
      }
    }

    // Run immediately and only once
    restoreSessionFromHash()
  }, []) // Empty deps, run once on mount

  // Return nothing - this is a background process
  return null
}
