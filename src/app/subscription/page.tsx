'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import ProtectedLayout from '@/components/ProtectedLayout'
import {
  Check,
  CreditCard,
  Zap,
  TrendingUp,
  Crown,
  Loader2,
  AlertCircle,
  ExternalLink,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function SubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isEmployee } = useAuth()
  const { subscription, loading, daysRemainingInTrial, isOnTrial, refresh } = useSubscription()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  useEffect(() => {
    // Handle successful checkout
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated!', {
        description: 'Your payment was successful. Welcome to your new plan!'
      })
      refresh() // Reload subscription data
      router.replace('/subscription')
    }

    // Handle canceled checkout
    if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout canceled', {
        description: 'You can upgrade anytime from this page.'
      })
      router.replace('/subscription')
    }
  }, [searchParams, refresh, router])

  const handleUpgrade = async (tier: 'starter' | 'pro' | 'enterprise') => {
    if (!user) return

    setCheckoutLoading(true)
    setSelectedTier(tier)

    try {
      // Get price ID based on tier
      const priceIds = {
        starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!,
        pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL!,
        enterprise: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE!
      }

      const priceId = priceIds[tier]

      // Call checkout API
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId,
          tier,
          userId: user.id,
          email: user.email
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      const { error } = await stripe!.redirectToCheckout({ sessionId })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast.error('Failed to start checkout', {
        description: error.message || 'Please try again later'
      })
    } finally {
      setCheckoutLoading(false)
      setSelectedTier(null)
    }
  }

  const handleManageBilling = async () => {
    toast.info('Opening billing portal...', { duration: 1500 })
    // TODO: Implement Stripe Customer Portal
    window.open('https://billing.stripe.com/p/login/test_123', '_blank')
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </ProtectedLayout>
    )
  }

  const pricingTiers = [
    {
      id: 'starter',
      name: 'Starter',
      price: 49,
      description: 'Perfect for small teams getting started',
      icon: Zap,
      color: 'from-blue-500 to-blue-600',
      features: [
        '10 documents per month',
        'AI-powered proposals',
        'Basic analytics',
        'Email support',
        'Standard templates',
        'Cloud storage'
      ],
      cta: 'Start Starter Plan',
      popular: false
    },
    {
      id: 'pro',
      name: 'Professional',
      price: 199,
      description: 'Advanced features for growing businesses',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      features: [
        '50 documents per month',
        'Everything in Starter',
        'Voltage drop calculator',
        'AI Professional Proposals',
        'Advanced analytics',
        'Priority support',
        'Custom templates',
        'Team collaboration',
        'API access'
      ],
      cta: 'Upgrade to Pro',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 499,
      description: 'Unlimited power for large organizations',
      icon: Crown,
      color: 'from-amber-500 to-amber-600',
      features: [
        'Unlimited documents',
        'Everything in Professional',
        'Team user management',
        'Dedicated account manager',
        '24/7 phone support',
        'Custom integrations',
        'Advanced security',
        'SLA guarantee',
        'On-premise deployment'
      ],
      cta: 'Go Enterprise',
      popular: false
    }
  ]

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Subscription & Billing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your needs
          </p>
        </div>

        {/* Current Plan Status */}
        {subscription && (
          <div className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-8 text-white mb-12 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Current Plan</h2>
                </div>

                <div className="space-y-2">
                  <p className="text-3xl font-bold capitalize">
                    {subscription.tier} {isOnTrial && '(Trial)'}
                  </p>

                  {isOnTrial && daysRemainingInTrial !== null && (
                    <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">
                        {daysRemainingInTrial} days remaining in trial
                      </span>
                    </div>
                  )}

                  {subscription.status === 'active' && !isOnTrial && (
                    <p className="text-white/80">
                      Active subscription • {subscription.max_documents} documents/month
                    </p>
                  )}

                  {subscription.status === 'past_due' && (
                    <div className="flex items-center gap-2 text-yellow-200">
                      <AlertCircle className="w-5 h-5" />
                      <span>Payment past due - Please update your payment method</span>
                    </div>
                  )}
                </div>
              </div>

              {!isEmployee && subscription.source === 'stripe' && (
                <button
                  onClick={handleManageBilling}
                  className="px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  Manage Billing
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Employee Notice */}
        {isEmployee && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-12">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-purple-900 mb-1">
                  Employee Access
                </h3>
                <p className="text-purple-700">
                  As a Design-Rite employee, you have full access to all portal features for testing and consulting work. You don't need to purchase a subscription.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trial Ending Notice */}
        {isOnTrial && daysRemainingInTrial !== null && daysRemainingInTrial <= 3 && !isEmployee && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-12">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  Your trial is ending soon!
                </h3>
                <p className="text-amber-700 mb-3">
                  You have {daysRemainingInTrial} day{daysRemainingInTrial !== 1 ? 's' : ''} remaining in your free trial. After that, you'll be downgraded to the Free plan (2 documents/month).
                </p>
                <p className="text-amber-700 font-medium">
                  Upgrade now to keep your full access and continue creating professional proposals without limits.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {pricingTiers.map((tier) => {
            const isCurrentTier = subscription?.tier === tier.id && !isOnTrial
            const Icon = tier.icon

            return (
              <div
                key={tier.id}
                className={`relative bg-white rounded-2xl p-8 border-2 transition-all duration-300 ${
                  tier.popular
                    ? 'border-primary shadow-2xl scale-105'
                    : 'border-gray-200 shadow-lg hover:shadow-xl'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-bold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-6`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {tier.name}
                </h3>

                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">${tier.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>

                <p className="text-gray-600 mb-6">{tier.description}</p>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isEmployee ? (
                  <div className="text-center py-3 px-4 bg-purple-50 text-purple-700 rounded-lg font-medium">
                    Employee Access
                  </div>
                ) : isCurrentTier ? (
                  <div className="text-center py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(tier.id as 'starter' | 'pro' | 'enterprise')}
                    disabled={checkoutLoading}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                      tier.popular
                        ? 'bg-gradient-to-r from-primary to-purple-600 text-white hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {checkoutLoading && selectedTier === tier.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      tier.cta
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens when my trial ends?
              </h3>
              <p className="text-gray-600">
                Your account will be downgraded to the Free plan (2 documents/month). You'll keep access to all your existing documents, but won't be able to create new ones until you upgrade.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Absolutely. There are no long-term contracts. Cancel anytime from the billing portal and you'll retain access until the end of your billing period.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, contact support for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
