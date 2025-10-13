import { useEffect, useCallback, useRef, useState } from 'react'

interface UseInactivityTimeoutOptions {
  /**
   * Time in milliseconds before showing warning
   * @default 1800000 (30 minutes)
   */
  warningTime?: number

  /**
   * Time in milliseconds before auto logout
   * @default 3600000 (60 minutes)
   */
  logoutTime?: number

  /**
   * Callback when warning should be shown
   */
  onWarning?: () => void

  /**
   * Callback when user should be logged out
   */
  onLogout: () => void
}

/**
 * Hook to track user inactivity and trigger warnings/logout
 *
 * Tracks: mousemove, keydown, click, scroll, touchstart
 *
 * @example
 * ```tsx
 * const { resetTimer } = useInactivityTimeout({
 *   warningTime: 30 * 60 * 1000, // 30 minutes
 *   logoutTime: 60 * 60 * 1000,  // 60 minutes
 *   onWarning: () => setShowWarning(true),
 *   onLogout: async () => {
 *     await authHelpers.signOut()
 *     router.push('/auth')
 *   }
 * })
 * ```
 */
export function useInactivityTimeout({
  warningTime = 30 * 60 * 1000, // 30 minutes
  logoutTime = 60 * 60 * 1000,  // 60 minutes
  onWarning,
  onLogout
}: UseInactivityTimeoutOptions) {
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isWarningShown, setIsWarningShown] = useState(false)

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current)
    }
  }, [])

  // Reset the inactivity timer
  const resetTimer = useCallback(() => {
    clearTimers()
    setIsWarningShown(false)

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      console.log('[InactivityTimeout] Warning threshold reached')
      setIsWarningShown(true)
      if (onWarning) {
        onWarning()
      }
    }, warningTime)

    // Set logout timer
    logoutTimerRef.current = setTimeout(() => {
      console.log('[InactivityTimeout] Logout threshold reached - signing out')
      onLogout()
    }, logoutTime)
  }, [warningTime, logoutTime, onWarning, onLogout, clearTimers])

  // Track user activity
  useEffect(() => {
    // Events that indicate user activity
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

    // Throttle activity tracking to avoid excessive resets
    let throttleTimeout: NodeJS.Timeout | null = null
    const throttleDelay = 1000 // Only reset timer once per second max

    const handleActivity = () => {
      if (throttleTimeout) return

      throttleTimeout = setTimeout(() => {
        throttleTimeout = null
      }, throttleDelay)

      resetTimer()
    }

    // Initial timer setup
    resetTimer()

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Cleanup
    return () => {
      clearTimers()
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      if (throttleTimeout) {
        clearTimeout(throttleTimeout)
      }
    }
  }, [resetTimer, clearTimers])

  return {
    resetTimer,
    isWarningShown
  }
}
