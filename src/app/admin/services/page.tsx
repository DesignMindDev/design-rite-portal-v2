'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProtectedLayout from '@/components/ProtectedLayout'
import Link from 'next/link'
import {
  Server,
  Activity,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  PauseCircle,
  Clock,
  Globe,
  GitBranch,
  Zap
} from 'lucide-react'

interface ServiceHealth {
  id: string
  name: string
  displayName: string
  status: 'online' | 'offline' | 'degraded' | 'suspended' | 'unknown'
  url?: string
  plan: string
  lastDeploy?: string
  responseTime?: number
  lastChecked: string
  region?: string
  autoDeploy?: boolean
  branch?: string
  error?: string
}

interface ServicesData {
  success: boolean
  services: ServiceHealth[]
  timestamp: string
}

export default function AdminServicesPage() {
  const { isEmployee, loading: authLoading } = useAuth()
  const [data, setData] = useState<ServicesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)

  useEffect(() => {
    if (!authLoading && isEmployee) {
      loadServicesHealth()
    }
  }, [authLoading, isEmployee])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!authLoading && isEmployee && autoRefreshEnabled) {
      const interval = setInterval(() => {
        loadServicesHealth(true)
      }, 60000)

      return () => clearInterval(interval)
    }
  }, [authLoading, isEmployee, autoRefreshEnabled])

  async function loadServicesHealth(isAutoRefresh = false) {
    try {
      if (isAutoRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetch('/api/admin/services')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load services health')
      }

      setData(result)
    } catch (err) {
      console.error('[Services] Load error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load services')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusIcon = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-amber-500" />
      case 'suspended':
        return <PauseCircle className="w-5 h-5 text-gray-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: ServiceHealth['status']) => {
    const baseClasses = 'px-2 py-1 text-xs font-semibold rounded'
    switch (status) {
      case 'online':
        return `${baseClasses} bg-green-100 text-green-700`
      case 'offline':
        return `${baseClasses} bg-red-100 text-red-700`
      case 'degraded':
        return `${baseClasses} bg-amber-100 text-amber-700`
      case 'suspended':
        return `${baseClasses} bg-gray-100 text-gray-600`
      default:
        return `${baseClasses} bg-gray-100 text-gray-500`
    }
  }

  const getPlanBadge = (plan: string) => {
    const baseClasses = 'px-2 py-0.5 text-xs rounded'
    switch (plan.toLowerCase()) {
      case 'standard':
        return `${baseClasses} bg-purple-100 text-purple-700`
      case 'starter':
        return `${baseClasses} bg-blue-100 text-blue-700`
      case 'free':
        return `${baseClasses} bg-gray-100 text-gray-600`
      case 'suspended':
        return `${baseClasses} bg-red-100 text-red-600`
      default:
        return `${baseClasses} bg-gray-100 text-gray-500`
    }
  }

  const formatResponseTime = (ms?: number) => {
    if (!ms) return null
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatLastDeploy = (dateStr?: string) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    }
  }

  if (authLoading || loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading services health...</p>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  if (error) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Services</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => loadServicesHealth()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Retry
            </button>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  if (!data) {
    return null
  }

  const { services } = data

  // Calculate summary stats
  const stats = {
    total: services.length,
    online: services.filter(s => s.status === 'online').length,
    offline: services.filter(s => s.status === 'offline').length,
    degraded: services.filter(s => s.status === 'degraded').length,
    suspended: services.filter(s => s.status === 'suspended').length
  }

  return (
    <ProtectedLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Service Health</h1>
                <p className="text-gray-600">Monitor all Render services status</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefreshEnabled}
                  onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600">Auto-refresh (60s)</span>
              </label>
              <button
                onClick={() => loadServicesHealth()}
                disabled={refreshing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Server className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Online</p>
                <p className="text-2xl font-bold text-green-600">{stats.online}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Offline</p>
                <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Degraded</p>
                <p className="text-2xl font-bold text-amber-600">{stats.degraded}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Suspended</p>
                <p className="text-2xl font-bold text-gray-600">{stats.suspended}</p>
              </div>
              <PauseCircle className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(service.status)}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{service.displayName}</h3>
                    <p className="text-sm text-gray-500 font-mono">{service.name}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={getStatusBadge(service.status)}>
                    {service.status.toUpperCase()}
                  </span>
                  <span className={getPlanBadge(service.plan)}>
                    {service.plan}
                  </span>
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-2 text-sm">
                {service.url && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 truncate"
                    >
                      {service.url}
                    </a>
                  </div>
                )}

                {service.branch && (
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Branch: <span className="font-mono">{service.branch}</span>
                      {service.autoDeploy && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Auto-deploy
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {service.responseTime && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Response time: <span className="font-semibold">{formatResponseTime(service.responseTime)}</span>
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Last deploy: <span className="font-semibold">{formatLastDeploy(service.lastDeploy)}</span>
                  </span>
                </div>

                {service.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs text-red-600">{service.error}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Last Updated */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Last updated: {new Date(data.timestamp).toLocaleString()}
          {refreshing && <span className="ml-2">(Refreshing...)</span>}
        </div>
      </div>
    </ProtectedLayout>
  )
}