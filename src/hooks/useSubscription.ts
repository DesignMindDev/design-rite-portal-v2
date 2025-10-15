import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Subscription {
  id: string
  user_id: string
  tier: 'free' | 'starter' | 'pro' | 'enterprise'
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
  max_documents: number
  source: 'free' | 'trial' | 'stripe' | 'admin_grant'

  // Stripe fields
  stripe_customer_id?: string
  stripe_subscription_id?: string
  stripe_price_id?: string

  // Trial fields
  is_trial: boolean
  trial_start?: string
  trial_end?: string

  // Timestamps
  created_at: string
  updated_at: string
}

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [daysRemainingInTrial, setDaysRemainingInTrial] = useState<number | null>(null)

  useEffect(() => {
    if (user) {
      loadSubscription()
    }
  }, [user])

  async function loadSubscription() {
    if (!user) return

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Subscription fetch error:', error)
        setSubscription(null)
      } else if (data) {
        setSubscription(data)

        // Calculate days remaining in trial
        if (data.is_trial && data.trial_end) {
          const trialEnd = new Date(data.trial_end)
          const now = new Date()
          const diffTime = trialEnd.getTime() - now.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          setDaysRemainingInTrial(Math.max(0, diffDays))

          // Check if trial has expired and auto-downgrade
          if (diffDays <= 0 && data.status === 'trialing') {
            await downgradeAfterTrial(data.id)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load subscription:', error)
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }

  // Auto-downgrade subscription when trial expires
  async function downgradeAfterTrial(subscriptionId: string) {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          is_trial: false,
          max_documents: 2, // Downgrade to free tier limits
          source: 'free',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      if (!error) {
        await loadSubscription() // Reload subscription
      }
    } catch (error) {
      console.error('Failed to downgrade after trial:', error)
    }
  }

  // Check if user has access to a specific feature
  function hasFeatureAccess(feature: string): boolean {
    if (!subscription) return false

    // Feature access matrix (simplified - will be replaced with feature_flags table)
    const featureAccess: Record<string, string[]> = {
      documents: ['free', 'starter', 'pro', 'enterprise'],
      business_tools: ['free', 'starter', 'pro', 'enterprise'],
      voltage_calculator: ['pro', 'enterprise'],
      analytics: ['starter', 'pro', 'enterprise'],
      theme: ['starter', 'pro', 'enterprise'],
      ai_assistant: ['pro', 'enterprise'],
      unlimited_documents: ['enterprise']
    }

    const allowedTiers = featureAccess[feature] || []

    // If on trial, give full starter access
    if (subscription.is_trial && subscription.status === 'trialing') {
      return allowedTiers.includes('starter')
    }

    return allowedTiers.includes(subscription.tier)
  }

  // Get document usage count
  async function getDocumentCount(): Promise<number> {
    if (!user) return 0

    try {
      const { count, error } = await supabase
        .from('user_documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Failed to get document count:', error)
      return 0
    }
  }

  // Check if user can upload more documents
  function canUploadDocument(currentCount: number): boolean {
    if (!subscription) return false
    return currentCount < subscription.max_documents
  }

  // Get assessment usage statistics
  async function getAssessmentUsage(): Promise<{
    used: number
    limit: number
    isAtLimit: boolean
    isNearLimit: boolean
  }> {
    if (!user) return { used: 0, limit: 10, isAtLimit: false, isNearLimit: false }

    try {
      const { data, error } = await supabase
        .rpc('get_current_usage', {
          p_user_id: user.id,
          p_feature_type: 'assessment'
        })

      if (error) {
        // If RPC function doesn't exist yet (SQL not run), silently return defaults
        if (error.message?.includes('function') || error.message?.includes('does not exist')) {
          return { used: 0, limit: 10, isAtLimit: false, isNearLimit: false }
        }
        throw error
      }

      if (!data || data.length === 0) {
        // No usage record yet - return default based on tier
        const defaultLimit = subscription?.tier === 'enterprise' || subscription?.tier === 'pro' ? -1 :
                           subscription?.tier === 'starter' ? 40 : 10
        return { used: 0, limit: defaultLimit, isAtLimit: false, isNearLimit: false }
      }

      const usage = data[0]
      return {
        used: usage.usage_count,
        limit: usage.limit_amount,
        isAtLimit: usage.is_at_limit,
        isNearLimit: usage.is_near_limit
      }
    } catch (error) {
      console.error('Failed to get assessment usage:', error)
      return { used: 0, limit: 10, isAtLimit: false, isNearLimit: false }
    }
  }

  // Check if user can create assessment
  async function canCreateAssessment(): Promise<boolean> {
    if (!user) return false

    try {
      const { data, error } = await supabase
        .rpc('can_use_feature', {
          p_user_id: user.id,
          p_feature_type: 'assessment'
        })

      if (error) {
        // If RPC function doesn't exist yet (SQL not run), allow by default
        if (error.message?.includes('function') || error.message?.includes('does not exist')) {
          return true
        }
        throw error
      }
      return data === true
    } catch (error) {
      console.error('Failed to check assessment permission:', error)
      return true // Allow by default if check fails
    }
  }

  // Increment assessment usage counter
  async function incrementAssessmentUsage(): Promise<boolean> {
    if (!user) return false

    try {
      const { data, error } = await supabase
        .rpc('increment_usage', {
          p_user_id: user.id,
          p_feature_type: 'assessment'
        })

      if (error) {
        // If RPC function doesn't exist yet (SQL not run), silently succeed
        if (error.message?.includes('function') || error.message?.includes('does not exist')) {
          return true
        }
        throw error
      }
      return data === true
    } catch (error) {
      console.error('Failed to increment assessment usage:', error)
      return false
    }
  }

  return {
    subscription,
    loading,
    daysRemainingInTrial,
    refresh: loadSubscription,
    hasFeatureAccess,
    getDocumentCount,
    canUploadDocument,

    // Assessment usage tracking
    getAssessmentUsage,
    canCreateAssessment,
    incrementAssessmentUsage,

    // Helper booleans
    isOnTrial: subscription?.is_trial && subscription?.status === 'trialing',
    isFree: subscription?.tier === 'free' && !subscription?.is_trial,
    isStarter: subscription?.tier === 'starter',
    isPro: subscription?.tier === 'pro',
    isEnterprise: subscription?.tier === 'enterprise',
    isActive: subscription?.status === 'active' || subscription?.status === 'trialing'
  }
}
