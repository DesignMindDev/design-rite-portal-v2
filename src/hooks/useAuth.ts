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
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[useAuth] Initial session check:', session ? 'Session found' : 'No session')
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadUserData(session.user.id)
      }
      setLoading(false)
      console.log('[useAuth] Initial loading complete')
    }).catch((error) => {
      console.error('[useAuth] Error getting initial session:', error)
      setLoading(false) // Always set loading=false even on error
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state change:', event, session ? 'Session present' : 'No session')
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadUserData(session.user.id)
        } else {
          setProfile(null)
          setUserRole(null)
        }
        setLoading(false)
        console.log('[useAuth] Auth state change complete')
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function loadUserData(userId: string) {
    try {
      console.log('[useAuth] Loading user data for:', userId)

      // Load profile with timeout
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.warn('[useAuth] Error loading profile:', profileError)
      } else if (profileData) {
        console.log('[useAuth] Profile loaded successfully')
        setProfile(profileData)
      }

      // Load user role with timeout
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, domain_override')
        .eq('user_id', userId)
        .single()

      if (roleError) {
        console.warn('[useAuth] Error loading role (might not exist):', roleError)
        // Default to 'user' role if no role found
        setUserRole({ role: 'user', domain_override: false })
      } else if (roleData) {
        console.log('[useAuth] Role loaded successfully:', roleData.role)
        setUserRole(roleData)
      } else {
        // Default to 'user' role if no role found
        setUserRole({ role: 'user', domain_override: false })
      }

      console.log('[useAuth] User data loading complete')
    } catch (error) {
      console.error('[useAuth] Error loading user data:', error)
      // Set defaults so the app can still function
      setUserRole({ role: 'user', domain_override: false })
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
    refresh: () => user && loadUserData(user.id)
  }
}
