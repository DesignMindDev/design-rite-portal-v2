'use client'

import { useAuth } from '@/hooks/useAuth'
import ProtectedLayout from '@/components/ProtectedLayout'
import {
  Map,
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Activity,
  Zap,
  AlertTriangle,
  FileImage
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SpatialAnalytics {
  projectMetrics: {
    totalProjects: number
    completedProjects: number
    pendingProjects: number
    failedProjects: number
    avgAnalysisTime: number
    projectsByStatus: Record<string, number>
  }
  aiPerformance: {
    totalAnalyses: number
    successRate: number
    avgExecutionTime: number
    failureRate: number
    retryRate: number
    operationBreakdown: Record<string, {
      count: number
      avgDuration: number
      successRate: number
    }>
  }
  errorAnalysis: Array<{
    error_type: string
    count: number
    first_occurrence: string
    last_occurrence: string
  }>
  recentProjects: Array<{
    id: string
    created_at: string
    status: string
    analysis_duration_ms: number | null
  }>
  recentOperations: Array<{
    id: string
    operation_name: string
    created_at: string
    duration_ms: number
    status: string
  }>
}

export default function SpatialStudioPage() {
  const { isEmployee, loading, user, userRole } = useAuth()
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d')
  const [analytics, setAnalytics] = useState<SpatialAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  // Fetch spatial analytics
  useEffect(() => {
    if (!loading && isEmployee) {
      loadSpatialAnalytics()
    }
  }, [loading, isEmployee, timeRange])

  async function loadSpatialAnalytics() {
    try {
      setAnalyticsLoading(true)
      const response = await fetch(`/api/admin/spatial-analytics?timeRange=${timeRange}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setAnalytics(data)
      }
    } catch (error) {
      console.error('[Spatial Studio] Failed to load analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Redirect non-employees
  useEffect(() => {
    if (!loading && user && userRole && !isEmployee) {
      console.log('[Spatial Studio] User is not an employee, redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [isEmployee, loading, user, userRole, router])

  // Show loading while auth or role is loading
  if (loading || (user && !userRole)) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Spatial Studio analytics...</p>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  // Only show "return null" if we've confirmed they're not an employee
  if (userRole && !isEmployee) {
    return null
  }

  return (
    <ProtectedLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Spatial Studio Analytics</h1>
              <p className="text-gray-600">Floor plan analysis and camera placement metrics</p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2 mt-4">
            {(['24h', '7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeRange === range
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-teal-400'
                }`}
              >
                {range === '24h' && 'Last 24 Hours'}
                {range === '7d' && 'Last 7 Days'}
                {range === '30d' && 'Last 30 Days'}
                {range === '90d' && 'Last 90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Project Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileImage className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Projects</p>
                  {analyticsLoading ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded w-16 mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.projectMetrics?.totalProjects?.toLocaleString() || '0'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Completed</p>
                  {analyticsLoading ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded w-16 mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.projectMetrics?.completedProjects?.toLocaleString() || '0'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Pending</p>
                  {analyticsLoading ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded w-16 mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.projectMetrics?.pendingProjects?.toLocaleString() || '0'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Failed</p>
                  {analyticsLoading ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded w-16 mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.projectMetrics?.failedProjects?.toLocaleString() || '0'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Avg Analysis Time</p>
                  {analyticsLoading ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded w-16 mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.projectMetrics?.avgAnalysisTime
                        ? `${(analytics.projectMetrics.avgAnalysisTime / 1000).toFixed(1)}s`
                        : '0s'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Performance */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Analyses</p>
                  {analyticsLoading ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded w-16 mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.aiPerformance?.totalAnalyses?.toLocaleString() || '0'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Success Rate</p>
                  {analyticsLoading ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded w-16 mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.aiPerformance?.successRate
                        ? `${analytics.aiPerformance.successRate.toFixed(1)}%`
                        : '0%'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Avg Execution</p>
                  {analyticsLoading ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded w-16 mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.aiPerformance?.avgExecutionTime
                        ? `${(analytics.aiPerformance.avgExecutionTime / 1000).toFixed(1)}s`
                        : '0s'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Failure Rate</p>
                  {analyticsLoading ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded w-16 mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.aiPerformance?.failureRate
                        ? `${analytics.aiPerformance.failureRate.toFixed(1)}%`
                        : '0%'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Retry Rate</p>
                  {analyticsLoading ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded w-16 mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.aiPerformance?.retryRate
                        ? `${analytics.aiPerformance.retryRate.toFixed(1)}%`
                        : '0%'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operation Breakdown */}
        {analytics?.aiPerformance?.operationBreakdown && Object.keys(analytics.aiPerformance.operationBreakdown).length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Operation Breakdown</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Operation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Success Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(analytics.aiPerformance.operationBreakdown).map(([operation, stats]) => (
                      <tr key={operation} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {operation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {stats.count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {(stats.avgDuration / 1000).toFixed(2)}s
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            stats.successRate >= 90
                              ? 'bg-green-100 text-green-800'
                              : stats.successRate >= 70
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {stats.successRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Error Analysis */}
        {analytics?.errorAnalysis && analytics.errorAnalysis.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Analysis</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Error Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        First Seen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Seen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.errorAnalysis.map((error, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {error.error_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {error.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(error.first_occurrence).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(error.last_occurrence).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Recent Projects */}
        {analytics?.recentProjects && analytics.recentProjects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Projects</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.recentProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {project.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(project.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : project.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {project.analysis_duration_ms
                            ? `${(project.analysis_duration_ms / 1000).toFixed(2)}s`
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-8 text-white shadow-xl">
          <h3 className="text-2xl font-bold mb-2">Spatial Studio Performance Summary</h3>
          <p className="text-teal-100 mb-4">
            Comprehensive analytics for floor plan analysis and camera placement recommendations
          </p>
          {!analyticsLoading && analytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <p className="text-teal-100 text-sm">Total Projects</p>
                <p className="text-3xl font-bold">
                  {analytics.projectMetrics.totalProjects.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-teal-100 text-sm">Success Rate</p>
                <p className="text-3xl font-bold">
                  {analytics.aiPerformance.successRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-teal-100 text-sm">Avg Analysis Time</p>
                <p className="text-3xl font-bold">
                  {(analytics.projectMetrics.avgAnalysisTime / 1000).toFixed(1)}s
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}
