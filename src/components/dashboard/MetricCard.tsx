'use client'

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: ReactNode
  description?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  loading?: boolean
}

export default function MetricCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  description,
  color = 'blue',
  loading = false
}: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900'
  }

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600'
  }

  const trendIcon = {
    up: <TrendingUp className="w-4 h-4 text-green-600" />,
    down: <TrendingDown className="w-4 h-4 text-red-600" />,
    neutral: <Minus className="w-4 h-4 text-gray-400" />
  }

  if (loading) {
    return (
      <div className={`p-6 rounded-lg border-2 ${colorClasses[color]} animate-pulse`}>
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/3"></div>
      </div>
    )
  }

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]} transition-all hover:shadow-lg`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium opacity-75">{title}</h3>
        {icon && (
          <div className={`${iconColorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold">{value}</span>
        {change !== undefined && (
          <span className="flex items-center gap-1 text-sm font-medium">
            {trendIcon[trend]}
            <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}>
              {change > 0 ? '+' : ''}{change}%
            </span>
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs opacity-60">{description}</p>
      )}
    </div>
  )
}
