'use client'

import { useAuth } from '@/hooks/useAuth'
import ProtectedLayout from '@/components/ProtectedLayout'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Settings, Database, HardDrive, RefreshCw, Server, FileText, Activity, AlertCircle } from 'lucide-react'

interface SystemStats {
  database: {
    size: string
    tables: number
    connections: number
    queries24h: number
  }
  cache: {
    hitRate: number
    size: string
    entries: number
  }
  jobs: {
    pending: number
    running: number
    completed24h: number
    failed24h: number
  }
}

interface LogEntry {
  level: 'info' | 'warning' | 'error'
  message: string
  timestamp: string
}

export default function OperationsPage() {
  const { isEmployee, loading, user, userRole } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Redirect non-employees
  useEffect(() => {
    if (!loading && user && userRole && !isEmployee) {
      console.log('[Operations] User is not an employee, redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [isEmployee, loading, user, userRole, router])

  // Load mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        database: {
          size: '2.3 GB',
          tables: 24,
          connections: 12,
          queries24h: 45892
        },
        cache: {
          hitRate: 94.5,
          size: '512 MB',
          entries: 3421
        },
        jobs: {
          pending: 3,
          running: 2,
          completed24h: 287,
          failed24h: 1
        }
      })

      setLogs([
        {
          level: 'info',
          message: 'Database backup completed successfully',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString()
        },
        {
          level: 'info',
          message: 'Cache cleared and rebuilt',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString()
        },
        {
          level: 'warning',
          message: 'High database connection count detected',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString()
        },
        {
          level: 'error',
          message: 'Background job failed: email-notification-batch',
          timestamp: new Date(Date.now() - 45 * 60000).toISOString()
        },
        {
          level: 'info',
          message: 'System maintenance completed',
          timestamp: new Date(Date.now() - 60 * 60000).toISOString()
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
            <p className="text-gray-600">Loading Operations...</p>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  // Only show "return null" if we've confirmed they're not an employee
  if (userRole && !isEmployee) {
    return null
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-700'
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-700'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Activity className="w-4 h-4" />
      case 'warning':
        return <AlertCircle className="w-4 h-4" />
      case 'error':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
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
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Operations</h1>
                <p className="text-gray-600 mt-1">System maintenance tools and monitoring</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading system statistics...</p>
            </div>
          ) : (
            <>
              {/* Database Statistics */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Database Statistics</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium mb-1">Database Size</p>
                    <p className="text-2xl font-bold text-blue-900">{stats?.database.size}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium mb-1">Tables</p>
                    <p className="text-2xl font-bold text-purple-900">{stats?.database.tables}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium mb-1">Active Connections</p>
                    <p className="text-2xl font-bold text-green-900">{stats?.database.connections}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm text-amber-600 font-medium mb-1">Queries (24h)</p>
                    <p className="text-2xl font-bold text-amber-900">{stats?.database.queries24h.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Cache Management */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <HardDrive className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Cache Management</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium mb-1">Hit Rate</p>
                    <p className="text-2xl font-bold text-green-900">{stats?.cache.hitRate}%</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium mb-1">Cache Size</p>
                    <p className="text-2xl font-bold text-blue-900">{stats?.cache.size}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium mb-1">Entries</p>
                    <p className="text-2xl font-bold text-purple-900">{stats?.cache.entries.toLocaleString()}</p>
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Clear Cache
                </button>
              </div>

              {/* Background Jobs */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Server className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Background Job Monitoring</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm text-amber-600 font-medium mb-1">Pending</p>
                    <p className="text-2xl font-bold text-amber-900">{stats?.jobs.pending}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium mb-1">Running</p>
                    <p className="text-2xl font-bold text-blue-900">{stats?.jobs.running}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium mb-1">Completed (24h)</p>
                    <p className="text-2xl font-bold text-green-900">{stats?.jobs.completed24h}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-600 font-medium mb-1">Failed (24h)</p>
                    <p className="text-2xl font-bold text-red-900">{stats?.jobs.failed24h}</p>
                  </div>
                </div>
              </div>

              {/* System Logs */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">System Logs</h2>
                </div>
                <div className="space-y-3">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-4 rounded-lg border ${getLevelColor(log.level)}`}
                    >
                      {getLevelIcon(log.level)}
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{log.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs font-semibold uppercase px-2 py-1 rounded">
                        {log.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Maintenance Tools */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Maintenance Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                    <Database className="w-5 h-5" />
                    Run Backup
                  </button>
                  <button className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                    <Server className="w-5 h-5" />
                    Restart Services
                  </button>
                  <button className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5" />
                    Export Logs
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}
