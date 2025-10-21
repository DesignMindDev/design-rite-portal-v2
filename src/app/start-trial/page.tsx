'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export default function StartTrialPage() {
  console.log('[StartTrial] Component rendering')

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

  const plans = {
    starter: {
      name: 'Starter',
      monthly: {
        regularPrice: 98,
        price: 49,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || '',
        period: 'month',
        savings: 'Save $49/mo'
      },
      annual: {
        regularPrice: 1176,
        price: 470.40,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL || '',
        period: 'year',
        savings: 'Save $705.60/year'
      },
      features: [
        'AI-powered proposals',
        '3,000+ product database',
        'Professional templates',
        'Email support'
      ]
    },
    pro: {
      name: 'Professional',
      monthly: {
        regularPrice: 399,
        price: 199,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL || '',
        period: 'month',
        savings: 'Save $199/mo'
      },
      annual: {
        regularPrice: 4788,
        price: 1915.20,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_ANNUAL || '',
        period: 'year',
        savings: 'Save $2,872/year'
      },
      features: [
        'Everything in Starter',
        'Unlimited quotes',
        'Priority support',
        'Advanced analytics',
        'Custom branding'
      ]
    }
  }

  const handleStartTrial = async () => {
    if (!selectedPlan || !email) return

    setLoading(true)

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      setLoading(false)
      return
    }

    // Business email validation (warn but allow)
    const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com']
    const domain = email.split('@')[1]
    if (freeEmailDomains.includes(domain)) {
      toast.warning('Consider using a business email for better tracking', { duration: 3000 })
    }

    try {
      // Get plan data
      const planData = plans[selectedPlan][billingPeriod]

      // Determine tier
      const tier = selectedPlan === 'starter' ? 'starter' : 'professional'

      // Create checkout session via API
      const response = await fetch('/api/stripe/create-public-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          priceId: planData.priceId,
          tier: tier
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error: any) {
      console.error('Error starting trial:', error)
      toast.error(error.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const canProceed = selectedPlan && isEmailValid && !loading

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Progress Steps */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Choose Plan</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 ${selectedPlan ? 'bg-blue-600' : 'bg-gray-300'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
                2
              </div>
              <span className={`ml-2 text-sm ${selectedPlan ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                Enter Email
              </span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 ${canProceed ? 'bg-blue-600' : 'bg-gray-300'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
                3
              </div>
              <span className={`ml-2 text-sm ${canProceed ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                Start Trial
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            7-Day Free Trial • No charge for 7 days
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Start Your Free Trial
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your security design workflow in minutes. Card required for verification, no charge for 7 days.
          </p>
        </div>

        {/* Step 1: Plan Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
              1
            </span>
            Select Your Plan
          </h2>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-lg inline-flex">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === 'annual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Annual (Save 20%)
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Starter Plan */}
            <div
              onClick={() => setSelectedPlan('starter')}
              className={`relative cursor-pointer border-2 rounded-xl p-6 transition-all ${
                selectedPlan === 'starter'
                  ? 'border-blue-600 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-blue-500'
              }`}
            >
              <div className="absolute -top-3 left-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                🎉 50% OFF - Limited Time!
              </div>
              {selectedPlan === 'starter' && (
                <div className="absolute -top-3 right-4 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Selected
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2 mt-2">Starter</h3>
              <div className="mb-4">
                <span className="text-gray-400 line-through text-sm">
                  ${plans.starter[billingPeriod].regularPrice}/{billingPeriod === 'annual' ? 'yr' : 'mo'}
                </span>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">
                    ${billingPeriod === 'annual' ? plans.starter[billingPeriod].price.toFixed(2) : plans.starter[billingPeriod].price}
                  </span>
                  <span className="text-gray-600 ml-1">
                    /{plans.starter[billingPeriod].period}
                  </span>
                </div>
                <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mt-2">
                  {plans.starter[billingPeriod].savings}
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                {plans.starter.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Professional Plan */}
            <div
              onClick={() => setSelectedPlan('pro')}
              className={`relative cursor-pointer border-2 rounded-xl p-6 transition-all ${
                selectedPlan === 'pro'
                  ? 'border-blue-600 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-blue-500'
              }`}
            >
              <div className="absolute -top-3 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                Most Popular
              </div>
              {selectedPlan === 'pro' && (
                <div className="absolute -top-3 right-4 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Selected
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2 mt-2">Professional</h3>
              <div className="mb-4">
                <span className="text-gray-400 line-through text-sm">
                  ${plans.pro[billingPeriod].regularPrice}/{billingPeriod === 'annual' ? 'yr' : 'mo'}
                </span>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">
                    ${billingPeriod === 'annual' ? plans.pro[billingPeriod].price.toFixed(2) : plans.pro[billingPeriod].price}
                  </span>
                  <span className="text-gray-600 ml-1">
                    /{plans.pro[billingPeriod].period}
                  </span>
                </div>
                <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mt-2">
                  {plans.pro[billingPeriod].savings}
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                {plans.pro.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Enterprise Notice */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-700">
              Need Enterprise features like white-label, custom AI training, or API access?{' '}
              <a
                href="mailto:subscriptions@design-rite.com?subject=Enterprise Plan Inquiry"
                className="text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                Contact Sales
              </a>
            </p>
          </div>
        </div>

        {/* Step 2: Email Entry */}
        <div className={`mb-8 transition-all ${!selectedPlan ? 'opacity-50 pointer-events-none' : ''}`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className={`w-6 h-6 ${selectedPlan ? 'bg-blue-600' : 'bg-gray-300'} text-white rounded-full flex items-center justify-center text-xs font-bold mr-2`}>
              2
            </span>
            Enter Your Email
          </h2>

          <div className="bg-gray-50 rounded-lg p-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && canProceed && handleStartTrial()}
              placeholder="you@company.com"
              disabled={!selectedPlan}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">We'll send your account details to this email</p>
          </div>
        </div>

        {/* Step 3: Start Trial Button */}
        <div className={`transition-all ${!canProceed ? 'opacity-50 pointer-events-none' : ''}`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className={`w-6 h-6 ${canProceed ? 'bg-blue-600' : 'bg-gray-300'} text-white rounded-full flex items-center justify-center text-xs font-bold mr-2`}>
              3
            </span>
            Complete Your Trial Setup
          </h2>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 text-center">
            <button
              onClick={handleStartTrial}
              disabled={!canProceed}
              className="w-full max-w-md mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  <span>Start Your Free Trial</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-center text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                7-day free trial
              </div>
              <div className="flex items-center justify-center text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Cancel anytime
              </div>
              <div className="flex items-center justify-center text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Full platform access
              </div>
              <p className="text-xs text-gray-500 mt-2">Secure payment via Stripe. Card for verification only.</p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Secure payment processing powered by Stripe</p>
          <div className="flex items-center justify-center mt-2 space-x-2">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0 1 10 0v2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2zm8-2v2H7V7a3 3 0 0 1 6 0z" clipRule="evenodd" />
            </svg>
            <span>SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  )
}
