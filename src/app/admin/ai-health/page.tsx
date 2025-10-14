'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Activity,
  Zap,
  AlertCircle
} from 'lucide-react'

interface ProviderHealth {
  provider: string
  status: 'online' | 'offline' | 'degraded' | 'testing'
  responseTime?: number
  error?: string
  lastChecked: string
  quotaRemaining?: string
}

interface HealthResponse {
  systemStatus: 'healthy' | 'degraded' | 'critical'
  providers: ProviderHealth[]
  summary: {
    total: number
    online: number
    offline: number
    degraded: number
  }
  failover: {
    chain: string[]
    activeProvider: string
    fallbacksAvailable: number
    allDown: boolean
  }
  lastChecked: string
}

export default function AIHealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchHealth = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai-providers/health')

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      const data = await response.json()
      setHealth(data)
      setLastRefresh(new Date())
    } catch (err: any) {
      console.error('Error fetching AI health:', err)
      setError(err.message || 'Failed to fetch provider health')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Online
          </Badge>
        )
      case 'degraded':
        return (
          <Badge className="bg-yellow-600 hover:bg-yellow-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Degraded
          </Badge>
        )
      case 'offline':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getSystemStatusAlert = () => {
    if (!health) return null

    switch (health.systemStatus) {
      case 'healthy':
        return (
          <Alert className="border-green-600 bg-green-600/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>All Systems Operational</AlertTitle>
            <AlertDescription>
              All AI providers are responding normally. Failover chain is fully functional.
            </AlertDescription>
          </Alert>
        )
      case 'degraded':
        return (
          <Alert className="border-yellow-600 bg-yellow-600/10">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle>System Degraded</AlertTitle>
            <AlertDescription>
              Some AI providers are experiencing issues. Failover is active. Active provider: <strong>{health.failover.activeProvider}</strong>
            </AlertDescription>
          </Alert>
        )
      case 'critical':
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Critical - Multiple Providers Down</AlertTitle>
            <AlertDescription>
              {health.failover.allDown
                ? 'All AI providers are offline. Users will receive error messages.'
                : `Limited functionality. Only ${health.summary.online} provider(s) available.`
              }
            </AlertDescription>
          </Alert>
        )
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            AI Provider Health
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time monitoring of AI API providers
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHealth}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        Last checked: {lastRefresh.toLocaleTimeString()} • Auto-refresh every 30s
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {getSystemStatusAlert()}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : health?.summary.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Configured AI APIs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : health?.summary.online || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Responding normally
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Degraded</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {loading ? '...' : health?.summary.degraded || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Slow or errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? '...' : health?.summary.offline || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Not responding
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Failover Chain Status */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Failover Chain
            </CardTitle>
            <CardDescription>
              Priority order for AI provider selection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">Active Provider:</div>
                <Badge className="text-base">
                  {health.failover.activeProvider}
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">Fallbacks Available:</div>
                <Badge variant="outline" className="text-base">
                  {health.failover.fallbacksAvailable}
                </Badge>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {health.failover.chain.map((provider, index) => {
                  const providerHealth = health.providers.find(p => p.provider === provider)
                  return (
                    <div key={provider} className="flex items-center gap-2">
                      {index > 0 && <span className="text-muted-foreground">→</span>}
                      <Badge
                        variant={providerHealth?.status === 'online' ? 'default' : 'secondary'}
                        className={
                          providerHealth?.status === 'online'
                            ? 'bg-green-600'
                            : providerHealth?.status === 'offline'
                            ? 'bg-red-600'
                            : 'bg-yellow-600'
                        }
                      >
                        {provider}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Provider Status</h2>

        {loading && !health ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Checking provider health...</p>
          </div>
        ) : health?.providers.map((provider) => (
          <Card key={provider.provider}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 mt-1" />
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {provider.provider}
                      {getStatusBadge(provider.status)}
                    </CardTitle>
                    {provider.error && (
                      <CardDescription className="mt-2 text-red-600">
                        Error: {provider.error}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Response Time</div>
                  <div className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {provider.responseTime ? `${provider.responseTime}ms` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Quota Remaining</div>
                  <div className="font-medium">
                    {provider.quotaRemaining || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Last Checked</div>
                  <div className="font-medium">
                    {new Date(provider.lastChecked).toLocaleTimeString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Health</div>
                  <div className="font-medium flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {provider.status === 'online' && provider.responseTime && provider.responseTime < 1000
                      ? 'Excellent'
                      : provider.status === 'online' && provider.responseTime && provider.responseTime < 3000
                      ? 'Good'
                      : provider.status === 'online'
                      ? 'Slow'
                      : 'Down'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
