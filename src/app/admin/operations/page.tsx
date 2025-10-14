'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Activity, Users, Calendar, DollarSign, Cpu, TrendingUp,
  Clock, AlertCircle, CheckCircle, Box, MessageSquare,
  RefreshCw, ArrowLeft
} from 'lucide-react'
import MetricCard from '../../components/dashboard/MetricCard'
import ActivityFeed from '../../components/dashboard/ActivityFeed'
import FunnelChart from '../../components/dashboard/FunnelChart'

interface OperationsData {
  realtime: {
    activeSessions: number
    todayLeads: number
    todayDemos: number
    todayProjects: number
    aiApiCalls: number
  }
  systemHealth: {
    apiResponseTime: number
    errorRate: number
    uploadSuccessRate: number
    totalApiCalls: number
    totalErrors: number
  }
  userEngagement: {
    activeUsers: number
    totalSessions: number
    avgSessionDuration: number
    avgMessagesPerSession: number
    toolUsageRate: number
    totalWebEvents: number
  }
  revenue: {
    mrr: number
    trialStarts: number
    conversions: number
    conversionRate: number
    averageRevenuePerCustomer: number
  }
  aiPerformance: {
    totalApiCalls: number
    operationStats: Record<string, { total: number; success: number; avgTime: number }>
    providerBreakdown: Record<string, number>
    estimatedCost: number
  }
  leadPipeline: {
    totalLeads: number
    statusBreakdown: Record<string, number>
    gradeBreakdown: Record<string, number>
    funnel: {
      leads: number
      demosBooked: number
      demosBookedRate: number
      trialsStarted: number
      trialsStartedRate: number
      customers: number
      customersRate: number
    }
  }
  recentActivity: Array<{
    id: string
    type: string
    title: string
    description: string
    timestamp: string
  }>
}

export default function OperationsPage() {
  const [data, setData] = useState<OperationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/operations?timeRange=${timeRange}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Operations dashboard error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeRange])

  // Auto-refresh every 60 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchData()
    }, 60000)

    return () => clearInterval(interval)
  }, [autoRefresh, timeRange])

  const timeRangeLabels = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              Operations Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time platform metrics and analytics
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex gap-2 bg-white rounded-lg border border-gray-300 p-1">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {timeRangeLabels[range]}
                </button>
              ))}
            </div>

            {/* Auto-refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                autoRefresh
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
              }`}
            >
              <RefreshCw className={`w-4 h-4 inline mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>

            {/* Manual Refresh */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 inline mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-red-900">Failed to load dashboard</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading or Content */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Real-time Activity Metrics */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Real-time Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Active Sessions"
                value={data.realtime.activeSessions}
                icon={<MessageSquare className="w-6 h-6" />}
                color="blue"
                description="Last 60 minutes"
              />
              <MetricCard
                title="New Leads"
                value={data.realtime.todayLeads}
                icon={<Users className="w-6 h-6" />}
                color="green"
                description={timeRangeLabels[timeRange]}
              />
              <MetricCard
                title="Demo Bookings"
                value={data.realtime.todayDemos}
                icon={<Calendar className="w-6 h-6" />}
                color="purple"
                description={timeRangeLabels[timeRange]}
              />
              <MetricCard
                title="Spatial Projects"
                value={data.realtime.todayProjects}
                icon={<Box className="w-6 h-6" />}
                color="yellow"
                description={timeRangeLabels[timeRange]}
              />
              <MetricCard
                title="AI API Calls"
                value={data.realtime.aiApiCalls}
                icon={<Cpu className="w-6 h-6" />}
                color="red"
                description={timeRangeLabels[timeRange]}
              />
            </div>
          </section>

          {/* System Health */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">System Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Avg API Response"
                value={`${data.systemHealth.apiResponseTime}ms`}
                icon={<Clock className="w-6 h-6" />}
                color={data.systemHealth.apiResponseTime < 1000 ? 'green' : data.systemHealth.apiResponseTime < 3000 ? 'yellow' : 'red'}
                description="Average execution time"
              />
              <MetricCard
                title="Error Rate"
                value={`${(data.systemHealth.errorRate * 100).toFixed(2)}%`}
                icon={<AlertCircle className="w-6 h-6" />}
                color={data.systemHealth.errorRate < 0.05 ? 'green' : data.systemHealth.errorRate < 0.1 ? 'yellow' : 'red'}
                description={`${data.systemHealth.totalErrors} of ${data.systemHealth.totalApiCalls} calls`}
              />
              <MetricCard
                title="Upload Success Rate"
                value={`${data.systemHealth.uploadSuccessRate}%`}
                icon={<CheckCircle className="w-6 h-6" />}
                color={data.systemHealth.uploadSuccessRate > 95 ? 'green' : data.systemHealth.uploadSuccessRate > 85 ? 'yellow' : 'red'}
                description="Spatial Studio uploads"
              />
              <MetricCard
                title="Total API Calls"
                value={data.systemHealth.totalApiCalls}
                icon={<Activity className="w-6 h-6" />}
                color="blue"
                description={timeRangeLabels[timeRange]}
              />
            </div>
          </section>

          {/* User Engagement & Revenue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Engagement */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">User Engagement</h2>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  title="Active Users"
                  value={data.userEngagement.activeUsers}
                  icon={<Users className="w-5 h-5" />}
                  color="blue"
                />
                <MetricCard
                  title="Total Sessions"
                  value={data.userEngagement.totalSessions}
                  icon={<MessageSquare className="w-5 h-5" />}
                  color="purple"
                />
                <MetricCard
                  title="Avg Session Duration"
                  value={`${Math.round(data.userEngagement.avgSessionDuration / 60)}m`}
                  icon={<Clock className="w-5 h-5" />}
                  color="green"
                  description="Minutes per session"
                />
                <MetricCard
                  title="Tool Usage Rate"
                  value={`${data.userEngagement.toolUsageRate}%`}
                  icon={<Box className="w-5 h-5" />}
                  color="yellow"
                  description="Leads using tools"
                />
              </div>
            </section>

            {/* Revenue Metrics */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  title="Monthly Recurring Revenue"
                  value={`$${data.revenue.mrr.toLocaleString()}`}
                  icon={<DollarSign className="w-5 h-5" />}
                  color="green"
                />
                <MetricCard
                  title="Trial Starts"
                  value={data.revenue.trialStarts}
                  icon={<Users className="w-5 h-5" />}
                  color="blue"
                  description={timeRangeLabels[timeRange]}
                />
                <MetricCard
                  title="Conversions"
                  value={data.revenue.conversions}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="purple"
                  description={timeRangeLabels[timeRange]}
                />
                <MetricCard
                  title="Conversion Rate"
                  value={`${data.revenue.conversionRate}%`}
                  icon={<CheckCircle className="w-5 h-5" />}
                  color="green"
                  description="Trial to customer"
                />
              </div>
            </section>
          </div>

          {/* Lead Pipeline Funnel */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lead Conversion Funnel</h2>
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
              <FunnelChart
                stages={[
                  { name: 'Leads', count: data.leadPipeline.funnel.leads },
                  { name: 'Demos Booked', count: data.leadPipeline.funnel.demosBooked, rate: data.leadPipeline.funnel.demosBookedRate },
                  { name: 'Trials Started', count: data.leadPipeline.funnel.trialsStarted, rate: data.leadPipeline.funnel.trialsStartedRate },
                  { name: 'Customers', count: data.leadPipeline.funnel.customers, rate: data.leadPipeline.funnel.customersRate }
                ]}
              />
            </div>
          </section>

          {/* AI Performance & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Performance */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">AI Performance</h2>
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <MetricCard
                    title="Total API Calls"
                    value={data.aiPerformance.totalApiCalls}
                    color="blue"
                  />
                  <MetricCard
                    title="Estimated Cost"
                    value={`$${data.aiPerformance.estimatedCost}`}
                    color="yellow"
                  />
                </div>

                {/* Provider Breakdown */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Provider Usage</h3>
                  <div className="space-y-2">
                    {Object.entries(data.aiPerformance.providerBreakdown).map(([provider, count]) => (
                      <div key={provider} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{provider}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Activity Feed */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 max-h-[600px] overflow-y-auto">
                <ActivityFeed activities={data.recentActivity.map(a => ({ ...a, type: a.type as 'lead' | 'demo' | 'spatial' | 'ai_session' }))} />
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  )
}
