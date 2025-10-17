'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function StartTrialPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<'starter' | 'pro' | 'enterprise'>('starter');

  const plans = {
    starter: {
      name: 'Starter',
      price: 49,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!,
      features: [
        '10 documents storage',
        'Basic AI assistant',
        'Business tools',
        'Email support'
      ]
    },
    pro: {
      name: 'Professional',
      price: 199,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL!,
      features: [
        '50 documents storage',
        'Advanced AI assistant',
        'Voltage calculator',
        'Analytics dashboard',
        'Priority support'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: 499,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE!,
      features: [
        'Unlimited documents',
        'Full AI capabilities',
        'Custom integrations',
        'Dedicated support',
        'Team collaboration'
      ]
    }
  };

  const handleStartTrial = async () => {
    setLoading(true);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Business email validation (optional - warn but allow)
    const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const domain = email.split('@')[1];
    if (freeEmailDomains.includes(domain)) {
      toast.warning('Consider using a business email for better tracking', { duration: 3000 });
    }

    try {
      // Note: For new users (no account yet), we'll use customer_email in checkout
      // The webhook will create the account when checkout completes
      const response = await fetch('/api/stripe/create-public-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          priceId: plans[plan].priceId,
          tier: plan
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Error starting trial:', error);
      toast.error(error.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Start Your 7-Day Free Trial
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose a plan and start transforming your security design workflow today.
            No credit card charged for 7 days.
          </p>
        </div>

        {/* Plan Selection */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {Object.entries(plans).map(([key, planData]) => (
            <div
              key={key}
              onClick={() => setPlan(key as typeof plan)}
              className={`relative cursor-pointer p-6 rounded-xl border-2 transition-all ${
                plan === key
                  ? 'border-blue-600 bg-blue-50 shadow-xl scale-105'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
              }`}
            >
              {plan === key && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Selected
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold mb-2">{planData.name}</h3>
                <div className="text-4xl font-bold text-blue-600 mb-1">
                  ${planData.price}
                </div>
                <div className="text-gray-600 text-sm">per month</div>
              </div>

              <ul className="space-y-3">
                {planData.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Email & CTA */}
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleStartTrial()}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleStartTrial}
            disabled={loading || !email}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Start Free Trial →'
            )}
          </button>

          <div className="mt-6 text-center space-y-2">
            <div className="flex items-center justify-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              7-day free trial, cancel anytime
            </div>
            <div className="flex items-center justify-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Card required for verification, no charge for 7 days
            </div>
            <div className="flex items-center justify-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Full access to all features during trial
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
  );
}
