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
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadUserData(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadUserData(session.user.id)
        } else {
          setProfile(null)
          setUserRole(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function loadUserData(userId: string) {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Load user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, domain_override')
        .eq('user_id', userId)
        .single()

      if (roleData) {
        setUserRole(roleData)
      } else {
        // Default to 'user' role if no role found
        setUserRole({ role: 'user', domain_override: false })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
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
