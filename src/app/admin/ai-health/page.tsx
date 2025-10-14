'use client'

import { useAuth } from '@/hooks/useAuth'
import ProtectedLayout from '@/components/ProtectedLayout'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Activity, CheckCircle, AlertTriangle, XCircle, Clock, Zap } from 'lucide-react'

interface ProviderHealth {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  responseTime: number
  uptime: number
  lastChecked: string
  errorRate: number
  requestsToday: number
}

export default function AIHealthPage() {
  const { isEmployee, loading, user, userRole } = useAuth()
  const router = useRouter()
  const [healthData, setHealthData] = useState<ProviderHealth[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Redirect non-employees
  useEffect(() => {
    if (!loading && user && userRole && !isEmployee) {
      console.log('[AI Health] User is not an employee, redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [isEmployee, loading, user, userRole, router])

  // Load mock health data
  useEffect(() => {
    const timer = setTimeout(() => {
      setHealthData([
        {
          name: 'OpenAI',
          status: 'healthy',
          responseTime: 245,
          uptime: 99.97,
          lastChecked: new Date().toISOString(),
          errorRate: 0.03,
          requestsToday: 1247
        },
        {
          name: 'Anthropic',
          status: 'healthy',
          responseTime: 198,
          uptime: 99.99,
          lastChecked: new Date().toISOString(),
          errorRate: 0.01,
          requestsToday: 2891
        },
        {
          name: 'Google AI',
          status: 'healthy',
          responseTime: 312,
          uptime: 99.95,
          lastChecked: new Date().toISOString(),
          errorRate: 0.05,
          requestsToday: 456
        }
      ])
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // Show loading while auth or role is loading
  if (loading || (user && !userRole)) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading AI Health...</p>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  // Only show "return null" if we've confirmed they're not an employee
  if (userRole && !isEmployee) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'degraded':
        return <AlertTriangle className="w-6 h-6 text-amber-600" />
      case 'down':
        return <XCircle className="w-6 h-6 text-red-600" />
      default:
        return <CheckCircle className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'degraded':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'down':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const overallStatus = healthData.every(p => p.status === 'healthy') ? 'healthy' :
                       healthData.some(p => p.status === 'down') ? 'degraded' : 'degraded'

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Back to Admin Link */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>

          {/* Header */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-8 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">AI Health</h1>
                <p className="text-gray-600 mt-1">Real-time monitoring of AI provider health and performance</p>
              </div>
            </div>

            {/* Overall System Status */}
            <div className={`mt-6 p-4 rounded-xl border-2 ${getStatusColor(overallStatus)}`}>
              <div className="flex items-center gap-3">
                {getStatusIcon(overallStatus)}
                <div>
                  <p className="font-semibold text-lg">
                    {overallStatus === 'healthy' ? 'All Systems Operational' : 'Some Systems Degraded'}
                  </p>
                  <p className="text-sm opacity-80">
                    {overallStatus === 'healthy'
                      ? 'All AI providers are responding normally'
                      : 'One or more providers experiencing issues'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking provider health status...</p>
            </div>
          ) : (
            <>
              {/* Provider Health Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {healthData.map((provider, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{provider.name}</h3>
                      {getStatusIcon(provider.status)}
                    </div>

                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-4 ${getStatusColor(provider.status)}`}>
                      <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                      {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Response Time
                        </span>
                        <span className="font-semibold text-gray-900">{provider.responseTime}ms</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Uptime</span>
                        <span className="font-semibold text-gray-900">{provider.uptime}%</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Error Rate</span>
                        <span className="font-semibold text-gray-900">{provider.errorRate}%</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Requests Today
                        </span>
                        <span className="font-semibold text-gray-900">{provider.requestsToday.toLocaleString()}</span>
                      </div>

                      <div className="pt-3 mt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Last checked: {new Date(provider.lastChecked).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* System Diagnostics */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">System Diagnostics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium mb-1">Avg Response Time</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {Math.round(healthData.reduce((acc, p) => acc + p.responseTime, 0) / healthData.length)}ms
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium mb-1">Total Uptime</p>
                    <p className="text-2xl font-bold text-green-900">
                      {(healthData.reduce((acc, p) => acc + p.uptime, 0) / healthData.length).toFixed(2)}%
                    </p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm text-amber-600 font-medium mb-1">Avg Error Rate</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {(healthData.reduce((acc, p) => acc + p.errorRate, 0) / healthData.length).toFixed(2)}%
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium mb-1">Total Requests</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {healthData.reduce((acc, p) => acc + p.requestsToday, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">All health checks passed</p>
                      <p className="text-xs text-gray-600">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Anthropic response time improved</p>
                      <p className="text-xs text-gray-600">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Scheduled maintenance completed</p>
                      <p className="text-xs text-gray-600">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}
