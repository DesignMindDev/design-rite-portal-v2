'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProtectedLayout from '@/components/ProtectedLayout'
import Link from 'next/link'
import {
  Users,
  Activity,
  FileText,
  MessageSquare,
  ArrowLeft,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  activeNow: number
  quotesToday: number
  aiSessionsToday: number
}

interface User {
  id: string
  email: string
  full_name: string
  role: string
  company: string
  status: string
  last_login: string | null
  login_count: number
  created_at: string
}

interface ActivityLog {
  id: string
  action: string
  resource_type: string | null
  timestamp: string
  success: boolean
  user_name: string
  user_email: string
  ip_address: string | null
}

interface DashboardData {
  success: boolean
  stats: DashboardStats
  users: User[]
  recentActivity: ActivityLog[]
}

export default function AdminDashboardPage() {
  const { isEmployee, loading: authLoading } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && isEmployee) {
      loadDashboardData()
    }
  }, [authLoading, isEmployee])

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/dashboard')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load dashboard data')
      }

      setData(result)
    } catch (err) {
      console.error('[Dashboard] Load error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
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

  const { stats, users, recentActivity } = data

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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Platform Dashboard</h1>
              <p className="text-gray-600">Real-time metrics and user activity</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Now (24h)</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeNow}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Quotes Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.quotesToday}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">AI Sessions Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.aiSessionsToday}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Users</h2>
              <Link href="/admin/super" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.slice(0, 10).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user.full_name}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {user.role}
                      </span>
                      <span className="text-xs text-gray-500">{user.company}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.status}
                    </span>
                    {user.last_login && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(user.last_login).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              <button
                onClick={loadDashboardData}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                Refresh
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.slice(0, 15).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {log.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {log.action.replace(/_/g, ' ')}
                      {log.resource_type && (
                        <span className="text-gray-500"> • {log.resource_type}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">
                      {log.user_name} ({log.user_email})
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      {log.ip_address && (
                        <span className="text-xs text-gray-400">• {log.ip_address}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
