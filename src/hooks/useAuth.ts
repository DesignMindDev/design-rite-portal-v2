import { useState, useEffect } from 'react'
import { supabase, authHelpers } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface UserRole {
  role: 'super_admin' | 'admin' | 'manager' | 'developer' | 'contractor' | 'user' | 'guest'
  domain_override: boolean
}

export interface Profile {
  id: string
  email: string
  full_name: string
  company: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user is an employee (Design-Rite employee)
  const isEmployee = userRole && ['super_admin', 'admin', 'manager', 'developer', 'contractor'].includes(userRole.role)

  // Check if user has domain override (non @design-rite.com email with admin access)
  const hasDomainOverride = userRole?.domain_override === true

  useEffect(() => {
    let mounted = true // Track if component is still mounted

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return // Exit if unmounted

      console.log('[useAuth] Initial session check:', session ? 'Session found' : 'No session')
      setUser(session?.user ?? null)

      if (session?.user) {
        // Load user data with timeout protection
        await loadUserDataWithTimeout(session.user.id, 5000) // 5 second timeout
      }

      setLoading(false) // Always set loading to false after initial check
      console.log('[useAuth] Initial loading complete')
    }).catch((error) => {
      console.error('[useAuth] Error getting initial session:', error)
      if (mounted) {
        setLoading(false) // Always set loading=false even on error
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return // Exit if unmounted

        console.log('[useAuth] Auth state change:', event, session ? 'Session present' : 'No session')
        setUser(session?.user ?? null)

        if (session?.user) {
          // Load user data with timeout protection
          await loadUserDataWithTimeout(session.user.id, 5000) // 5 second timeout
        } else {
          setProfile(null)
          setUserRole(null)
        }

        // CRITICAL: Always set loading to false after auth state change
        setLoading(false)
        console.log('[useAuth] Auth state change complete, loading set to false')
      }
    )

    return () => {
      mounted = false // Mark as unmounted
      subscription.unsubscribe()
    }
  }, [])

  // Wrapper function with timeout protection
  async function loadUserDataWithTimeout(userId: string, timeoutMs: number = 5000) {
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn(`[useAuth] User data loading timed out after ${timeoutMs}ms`)
        resolve('timeout')
      }, timeoutMs)
    })

    const loadPromise = loadUserData(userId)

    // Race between loading data and timeout
    const result = await Promise.race([loadPromise, timeoutPromise])

    if (result === 'timeout') {
      console.warn('[useAuth] Using defaults due to timeout')
      // Set sensible defaults if loading times out
      setUserRole({ role: 'user', domain_override: false })
    }
  }

  async function loadUserData(userId: string) {
    try {
      console.log('[useAuth] Loading user data for:', userId)

      // Load profile and role in parallel for better performance
      const [profileResult, roleResult] = await Promise.allSettled([
        // Load profile
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),

        // Load user role
        supabase
          .from('user_roles')
          .select('role, domain_override')
          .eq('user_id', userId)
          .single()
      ])

      // Handle profile result
      if (profileResult.status === 'fulfilled' && profileResult.value.data) {
        console.log('[useAuth] Profile loaded successfully')
        setProfile(profileResult.value.data)
      } else if (profileResult.status === 'rejected' || profileResult.value.error) {
        console.warn('[useAuth] Error loading profile:',
          profileResult.status === 'rejected' ? profileResult.reason : profileResult.value.error)
      }

      // Handle role result
      if (roleResult.status === 'fulfilled' && roleResult.value.data) {
        console.log('[useAuth] Role loaded successfully:', roleResult.value.data.role)
        setUserRole(roleResult.value.data)
      } else {
        // Default to 'user' role if no role found or error
        console.warn('[useAuth] No role found or error, using default role')
        setUserRole({ role: 'user', domain_override: false })
      }

      console.log('[useAuth] User data loading complete')
      return 'success'
    } catch (error) {
      console.error('[useAuth] Unexpected error loading user data:', error)
      // Set defaults so the app can still function
      setUserRole({ role: 'user', domain_override: false })
      return 'error'
    }
  }

  // Force refresh function with proper error handling
  const refresh = async () => {
    if (!user) return

    setLoading(true)
    try {
      await loadUserDataWithTimeout(user.id, 5000)
    } finally {
      setLoading(false) // Always set loading to false
    }
  }

  return {
    user,
    profile,
    userRole,
    isEmployee,
    hasDomainOverride,
    loading,
    signUp: authHelpers.signUp,
    signIn: authHelpers.signIn,
    signOut: authHelpers.signOut,
    refresh
  }
}
