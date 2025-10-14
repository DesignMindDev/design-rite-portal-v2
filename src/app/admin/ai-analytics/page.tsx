'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MessageSquare, Users, Clock, TrendingUp, Award,
  RefreshCw, ArrowLeft, AlertCircle, CheckCircle, Cpu
} from 'lucide-react'
import MetricCard from '../../components/dashboard/MetricCard'
import TimeSeriesChart from '../../components/dashboard/TimeSeriesChart'

interface AIAnalyticsData {
  sessionMetrics: {
    totalSessions: number
    totalMessages: number
    avgMessagesPerSession: number
    avgDurationSeconds: number
    completionRate: number
    completedSessions: number
  }
  providerPerformance: Record<string, {
    sessions: number
    messages: number
    avgMessagesPerSession: number
    avgResponseLength: number
    avgDuration: number
  }>
  userEngagement: {
    uniqueUsers: number
    returningUsers: number
    returningUserRate: number
    avgSessionsPerUser: number
    newUsers: number
  }
  assessmentMetrics: {
    totalAssessments: number
    completedAssessments: number
    completionRate: number
    abandonedAssessments: number
    scenarioBreakdown: Record<string, number>
  }
  timeSeriesData: Array<{
    date: string
    sessions: number
    messages: number
  }>
  topUsers: Array<{
    userHash: string
    sessions: number
    totalMessages: number
    lastActive: string
  }>
  conversationMetrics: {
    totalConversations: number
    avgUserMessageLength: number
    avgAiResponseLength: number
    questionsAsked: number
    questionRate: number
  }
}

export default function AIAnalyticsPage() {
  const [data, setData] = useState<AIAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/ai-analytics?timeRange=${timeRange}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('AI Analytics error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const timeRangeLabels = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days'
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
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
              <MessageSquare className="w-8 h-8 text-blue-600" />
              AI Sessions Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Deep dive into AI assistant usage and performance
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex gap-2 bg-white rounded-lg border border-gray-300 p-1">
              {(['24h', '7d', '30d', '90d'] as const).map((range) => (
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

            {/* Refresh */}
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
            <p className="font-medium text-red-900">Failed to load analytics</p>
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
          {/* Session Overview Metrics */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Session Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Sessions"
                value={data.sessionMetrics.totalSessions.toLocaleString()}
                icon={<MessageSquare className="w-6 h-6" />}
                color="blue"
                description={timeRangeLabels[timeRange]}
              />
              <MetricCard
                title="Total Messages"
                value={data.sessionMetrics.totalMessages.toLocaleString()}
                icon={<TrendingUp className="w-6 h-6" />}
                color="green"
                description={`${data.sessionMetrics.avgMessagesPerSession} avg per session`}
              />
              <MetricCard
                title="Avg Session Duration"
                value={formatDuration(data.sessionMetrics.avgDurationSeconds)}
                icon={<Clock className="w-6 h-6" />}
                color="purple"
                description="Time per session"
              />
              <MetricCard
                title="Completion Rate"
                value={`${data.sessionMetrics.completionRate}%`}
                icon={<CheckCircle className="w-6 h-6" />}
                color={data.sessionMetrics.completionRate > 70 ? 'green' : data.sessionMetrics.completionRate > 50 ? 'yellow' : 'red'}
                description={`${data.sessionMetrics.completedSessions} completed`}
              />
            </div>
          </section>

          {/* Time Series Chart */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Over Time</h2>
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
              <TimeSeriesChart
                data={data.timeSeriesData}
                xKey="date"
                yKeys={['sessions', 'messages']}
                colors={['#3B82F6', '#10B981']}
                height={300}
              />
            </div>
          </section>

          {/* Provider Performance & User Engagement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Performance */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Provider Performance</h2>
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 space-y-4">
                {Object.entries(data.providerPerformance).map(([provider, stats]) => (
                  <div key={provider} className="pb-4 border-b border-gray-200 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-blue-600" />
                        {provider}
                      </h3>
                      <span className="text-sm font-medium text-blue-600">
                        {stats.sessions} sessions
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Messages:</span>
                        <span className="ml-2 font-medium">{stats.messages}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg/Session:</span>
                        <span className="ml-2 font-medium">{stats.avgMessagesPerSession}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg Duration:</span>
                        <span className="ml-2 font-medium">{formatDuration(stats.avgDuration)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg Response:</span>
                        <span className="ml-2 font-medium">{stats.avgResponseLength} chars</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* User Engagement */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">User Engagement</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard
                    title="Unique Users"
                    value={data.userEngagement.uniqueUsers}
                    icon={<Users className="w-5 h-5" />}
                    color="blue"
                  />
                  <MetricCard
                    title="Returning Users"
                    value={data.userEngagement.returningUsers}
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="green"
                    description={`${data.userEngagement.returningUserRate}% return rate`}
                  />
                </div>
                <MetricCard
                  title="Avg Sessions Per User"
                  value={data.userEngagement.avgSessionsPerUser}
                  icon={<MessageSquare className="w-5 h-5" />}
                  color="purple"
                />
                <MetricCard
                  title="New Users"
                  value={data.userEngagement.newUsers}
                  icon={<Users className="w-5 h-5" />}
                  color="yellow"
                  description={timeRangeLabels[timeRange]}
                />
              </div>
            </section>
          </div>

          {/* Assessment Metrics & Conversation Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assessment Metrics */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Assessment Performance</h2>
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard
                    title="Total Assessments"
                    value={data.assessmentMetrics.totalAssessments}
                    color="blue"
                  />
                  <MetricCard
                    title="Completion Rate"
                    value={`${data.assessmentMetrics.completionRate}%`}
                    color={data.assessmentMetrics.completionRate > 70 ? 'green' : 'yellow'}
                  />
                </div>

                {/* Scenario Breakdown */}
                {Object.keys(data.assessmentMetrics.scenarioBreakdown).length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-700 mb-2">Common Scenarios</h3>
                    <div className="space-y-2">
                      {Object.entries(data.assessmentMetrics.scenarioBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([scenario, count]) => (
                          <div key={scenario} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{scenario}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Conversation Quality */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Conversation Quality</h2>
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 space-y-4">
                <MetricCard
                  title="Total Conversations"
                  value={data.conversationMetrics.totalConversations.toLocaleString()}
                  color="blue"
                />
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard
                    title="Avg User Message"
                    value={`${data.conversationMetrics.avgUserMessageLength} chars`}
                    color="green"
                  />
                  <MetricCard
                    title="Avg AI Response"
                    value={`${data.conversationMetrics.avgAiResponseLength} chars`}
                    color="purple"
                  />
                </div>
                <MetricCard
                  title="Question Rate"
                  value={`${data.conversationMetrics.questionRate}%`}
                  color="yellow"
                  description={`${data.conversationMetrics.questionsAsked} questions asked`}
                />
              </div>
            </section>
          </div>

          {/* Top Users */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Users by Activity</h2>
            <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Hash
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Messages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.topUsers.map((user, index) => (
                    <tr key={user.userHash} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {user.userHash.substring(0, 16)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.sessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.totalMessages}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.lastActive).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
