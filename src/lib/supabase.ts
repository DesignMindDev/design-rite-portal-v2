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

    // Create profile entry
    if (data.user && !error) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          company
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
      }

      // Create 14-day trial subscription
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14) // 14 days from now

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: data.user.id,
          tier: 'starter',
          status: 'trialing',
          max_documents: 10, // Full starter access during trial
          source: 'trial',
          is_trial: true,
          trial_start: new Date().toISOString(),
          trial_end: trialEnd.toISOString()
        })

      if (subError) {
        console.error('Subscription creation error:', subError)
      }
    }

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
