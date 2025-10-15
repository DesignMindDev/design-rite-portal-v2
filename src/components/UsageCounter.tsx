import React from 'react'
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface UsageCounterProps {
  used: number
  limit: number
  featureName: string
  tier: 'free' | 'starter' | 'professional' | 'pro' | 'enterprise'
  showUpgradeButton?: boolean
}

export function UsageCounter({
  used,
  limit,
  featureName,
  tier,
  showUpgradeButton = true
}: UsageCounterProps) {
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100)
  const isNearLimit = percentage >= 80 && !isUnlimited
  const isAtLimit = used >= limit && !isUnlimited

  // Determine upgrade path
  const upgradeTarget = tier === 'starter' || tier === 'free' ? 'Professional' : 'Enterprise'
  const newLimit = tier === 'starter' || tier === 'free' ? 40 : 'Unlimited'

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{featureName} Usage</h3>
        {isAtLimit && (
          <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            Limit Reached
          </span>
        )}
        {isNearLimit && !isAtLimit && (
          <span className="flex items-center gap-1 text-orange-600 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            Near Limit
          </span>
        )}
        {!isNearLimit && !isAtLimit && !isUnlimited && (
          <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Available
          </span>
        )}
      </div>

      {isUnlimited ? (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Unlimited {featureName}s</span>
          </div>
          <p className="text-gray-500 text-sm mt-3">
            You're on the {tier === 'enterprise' ? 'Enterprise' : 'Pro'} plan with unlimited access
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-4xl font-bold text-gray-900">{used}</span>
            <span className="text-gray-500 text-lg">of {limit} used this month</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                isAtLimit ? 'bg-red-500' :
                isNearLimit ? 'bg-orange-500' :
                'bg-gradient-to-r from-green-500 to-green-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Status Messages */}
          {isAtLimit && showUpgradeButton && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 mb-3 font-medium">
                You've reached your monthly {featureName.toLowerCase()} limit.
              </p>
              <Link
                href="/subscription"
                className="inline-flex items-center gap-2 w-full justify-center bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                Upgrade to {upgradeTarget} ({newLimit} {featureName}s)
              </Link>
            </div>
          )}

          {isNearLimit && !isAtLimit && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <strong>Heads up!</strong> You're at {Math.round(percentage)}% of your monthly limit.
              </p>
              {showUpgradeButton && (
                <Link
                  href="/subscription"
                  className="inline-flex items-center gap-1 text-orange-700 hover:text-orange-800 text-sm font-medium mt-2 hover:underline"
                >
                  <TrendingUp className="w-3 h-3" />
                  Upgrade for {newLimit} {featureName}s/month
                </Link>
              )}
            </div>
          )}

          {!isNearLimit && !isAtLimit && (
            <p className="text-sm text-gray-600">
              {limit - used} {featureName.toLowerCase()}s remaining this month
            </p>
          )}
        </>
      )}
    </div>
  )
}

// Compact version for navigation/header
export function UsageBadge({ used, limit }: { used: number; limit: number }) {
  if (limit === -1) {
    return (
      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
        ∞
      </span>
    )
  }

  const isAtLimit = used >= limit
  const isNearLimit = used >= limit * 0.8

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
      isAtLimit ? 'bg-red-100 text-red-700' :
      isNearLimit ? 'bg-orange-100 text-orange-700' :
      'bg-green-100 text-green-700'
    }`}>
      {used}/{limit}
    </span>
  )
}
