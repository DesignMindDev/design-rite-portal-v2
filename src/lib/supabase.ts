import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Portal-specific Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'design-rite-portal-auth', // Different from main platform
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'design-rite-portal-v2'
    }
  }
})

// Auth helper functions
export const authHelpers = {
  // Sign up with email/password
  async signUp(email: string, password: string, fullName: string, company: string) {
    // Supabase trigger (handle_new_user) will automatically create:
    // - Profile in profiles table
    // - Default user role in user_roles table
    // - Free tier subscription in subscriptions table
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company
        }
      }
    })

    return { data, error }
  },

  // Sign in with email/password
  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password
    })
  },

  // Sign out
  async signOut() {
    return await supabase.auth.signOut()
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  // Set session from tokens (for cross-domain transfer)
  async setSession(accessToken: string, refreshToken: string) {
    return await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })
  }
}
