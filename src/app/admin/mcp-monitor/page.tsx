'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProtectedLayout from '@/components/ProtectedLayout'
import Link from 'next/link'
import {
  Zap,
  Activity,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Globe,
  Database,
  TrendingUp,
  Server,
  Cpu,
  ExternalLink,
  AlertTriangle
} from 'lucide-react'

interface MCPHealth {
  url: string
  status: 'online' | 'offline' | 'degraded' | 'error'
  responseTime: number
  error: string | null
  version: string | null
  healthData: any
  stats: {
    total_products?: number
    manufacturers?: number
    last_scrape?: string
    [key: string]: any
  } | null
  checkedAt: string
  uptime: number
}

interface MCPMonitorData {
  success: boolean
  mcp: MCPHealth
}

// Store health history for charts
interface HealthHistory {
  timestamp: string
  status: string
  responseTime: number
}

export default function MCPMonitorPage() {
  const { isEmployee, loading: authLoading } = useAuth()
  const [data, setData] = useState<MCPMonitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [healthHistory, setHealthHistory] = useState<HealthHistory[]>([])
  const [consecutiveOffline, setConsecutiveOffline] = useState(0)
  const lastAlertRef = useRef<Date | null>(null)

  useEffect(() => {
    if (!authLoading && isEmployee) {
      loadMCPHealth()
    }
  }, [authLoading, isEmployee])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!authLoading && isEmployee && autoRefreshEnabled) {
      const interval = setInterval(() => {
        loadMCPHealth(true)
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [authLoading, isEmployee, autoRefreshEnabled])

  // Check for alerts
  useEffect(() => {
    if (data?.mcp.status === 'offline') {
      const newCount = consecutiveOffline + 1
      setConsecutiveOffline(newCount)

      // Alert if offline for more than 5 minutes (10 checks at 30s intervals)
      if (newCount >= 10) {
        const now = new Date()
        if (!lastAlertRef.current || (now.getTime() - lastAlertRef.current.getTime()) > 300000) {
          console.warn('[MCP Monitor] MCP Harvester has been offline for more than 5 minutes!')
          lastAlertRef.current = now
        }
      }
    } else {
      setConsecutiveOffline(0)
    }
  }, [data, consecutiveOffline])

  async function loadMCPHealth(isAutoRefresh = false) {
    try {
      if (isAutoRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetch('/api/admin/mcp-monitor')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load MCP health')
      }

      setData(result)

      // Add to history (keep last 20 data points)
      if (result.success && result.mcp) {
        setHealthHistory(prev => {
          const newHistory = [
            ...prev,
            {
              timestamp: result.mcp.checkedAt,
              status: result.mcp.status,
              responseTime: result.mcp.responseTime
            }
          ].slice(-20)
          return newHistory
        })
      }
    } catch (err) {
      console.error('[MCP Monitor] Load error:', err)
      setError(err instanceof Error ? err.message : 'Failed to check MCP health')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusIcon = (status: MCPHealth['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'offline':
        return <XCircle className="w-6 h-6 text-red-500" />
      case 'degraded':
        return <AlertCircle className="w-6 h-6 text-amber-500" />
      case 'error':
        return <AlertTriangle className="w-6 h-6 text-red-500" />
      default:
        return <AlertCircle className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusBadge = (status: MCPHealth['status']) => {
    const baseClasses = 'px-3 py-1.5 text-sm font-semibold rounded-lg'
    switch (status) {
      case 'online':
        return `${baseClasses} bg-green-100 text-green-700`
      case 'offline':
        return `${baseClasses} bg-red-100 text-red-700`
      case 'degraded':
        return `${baseClasses} bg-amber-100 text-amber-700`
      case 'error':
        return `${baseClasses} bg-red-100 text-red-700`
      default:
        return `${baseClasses} bg-gray-100 text-gray-500`
    }
  }

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99.9) return 'text-green-600'
    if (uptime >= 95) return 'text-amber-600'
    return 'text-red-600'
  }

  // Calculate average response time
  const avgResponseTime = healthHistory.length > 0
    ? Math.round(healthHistory.reduce((acc, h) => acc + h.responseTime, 0) / healthHistory.length)
    : 0

  // Calculate uptime from history
  const uptimePercentage = healthHistory.length > 0
    ? Math.round((healthHistory.filter(h => h.status === 'online' || h.status === 'degraded').length / healthHistory.length) * 100)
    : 0

  if (authLoading || loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting to MCP Harvester...</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading MCP Status</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => loadMCPHealth()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Retry
            </button>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  if (!data || !data.mcp) {
    return null
  }

  const { mcp } = data

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
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">MCP Harvester Monitor</h1>
                <p className="text-gray-600">Intelligence engine monitoring - $50K/year value</p>
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
                <span className="text-sm text-gray-600">Auto-refresh (30s)</span>
              </label>
              <button
                onClick={() => loadMCPHealth()}
                disabled={refreshing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Check Health Now
              </button>
            </div>
          </div>
        </div>

        {/* Alert Banner if offline for too long */}
        {consecutiveOffline >= 10 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-900 font-medium">MCP Harvester Offline Alert</p>
                <p className="text-sm text-red-700 mt-1">
                  The MCP Harvester has been offline for more than 5 minutes. This may impact product intelligence features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Status Card */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {getStatusIcon(mcp.status)}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">MCP Harvester Status</h2>
                <p className="text-gray-500 font-mono text-sm">{mcp.url}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={getStatusBadge(mcp.status)}>
                {mcp.status.toUpperCase()}
              </span>
              {mcp.version && (
                <span className="text-xs text-gray-500">v{mcp.version}</span>
              )}
            </div>
          </div>

          {/* Status Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500 font-medium">Response Time</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatResponseTime(mcp.responseTime)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {formatResponseTime(avgResponseTime)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500 font-medium">Uptime (Session)</span>
              </div>
              <p className={`text-2xl font-bold ${getUptimeColor(uptimePercentage)}`}>
                {uptimePercentage}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Last {healthHistory.length} checks
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500 font-medium">Last Successful Check</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {mcp.status === 'online' || mcp.status === 'degraded'
                  ? 'Just now'
                  : consecutiveOffline > 0
                    ? `${Math.floor(consecutiveOffline * 0.5)} min ago`
                    : 'Unknown'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatTimestamp(mcp.checkedAt)}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {mcp.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Connection Error</p>
                  <p className="text-sm text-red-600 mt-0.5">{mcp.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* MCP Statistics */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                Intelligence Database
              </h3>
              {mcp.stats && (
                <span className="text-xs text-gray-500">
                  {mcp.stats.last_scrape && `Updated: ${new Date(mcp.stats.last_scrape).toLocaleDateString()}`}
                </span>
              )}
            </div>

            {mcp.stats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-700">Total Products</span>
                  <span className="text-lg font-bold text-purple-600">
                    {mcp.stats.total_products?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">Manufacturers</span>
                  <span className="text-lg font-bold text-blue-600">
                    {mcp.stats.manufacturers || 'N/A'}
                  </span>
                </div>
                {Object.entries(mcp.stats).map(([key, value]) => {
                  if (!['total_products', 'manufacturers', 'last_scrape'].includes(key)) {
                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        <span className="text-sm font-semibold text-gray-900">{value}</span>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Server className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No statistics available</p>
                <p className="text-xs text-gray-400 mt-1">Stats will appear when the service is online</p>
              </div>
            )}
          </div>

          {/* Response Time History */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Response Time History
              </h3>
              <span className="text-xs text-gray-500">Last {healthHistory.length} checks</span>
            </div>

            {healthHistory.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {healthHistory.slice().reverse().map((check, index) => (
                  <div
                    key={`${check.timestamp}-${index}`}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {check.status === 'online' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : check.status === 'degraded' ? (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(check.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-mono text-gray-600">
                      {formatResponseTime(check.responseTime)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No history yet</p>
                <p className="text-xs text-gray-400 mt-1">History will build as checks are performed</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">MCP Harvester Intelligence Engine</h3>
              <p className="text-yellow-100 text-sm">
                Proprietary web intelligence system saving $50,000+ annually in SaaS subscriptions
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href={mcp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View MCP Dashboard
              </a>
              <a
                href={`${mcp.url}/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                API Documentation
              </a>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Last checked: {formatTimestamp(mcp.checkedAt)}
          {refreshing && <span className="ml-2">(Refreshing...)</span>}
        </div>
      </div>
    </ProtectedLayout>
  )
}