'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProtectedLayout from '@/components/ProtectedLayout'
import Link from 'next/link'
import {
  ArrowLeft,
  BarChart3,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
  AlertCircle,
  Zap,
  Target
} from 'lucide-react'

interface AIAnalyticsData {
  sessionAnalytics: {
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
  conversationMetrics: {
    totalConversations: number
    avgUserMessageLength: number
    avgAiResponseLength: number
    questionsAsked: number
    questionRate: number
  }
  topUsers: Array<{
    userHash: string
    sessions: number
    totalMessages: number
    lastActive: string
  }>
  timeSeriesData: Array<{
    date: string
    sessions: number
    messages: number
  }>
  conversationQuality: {
    avgUserMessageLength: number
    avgAiMessageLength: number
    avgResponseTimeSeconds: number
    engagementRate: number
    sessionsAnalyzed: number
  }
  timeRange: string
  startDate: string
}

export default function AIAnalyticsPage() {
  const { isEmployee, loading: authLoading } = useAuth()
  const [data, setData] = useState<AIAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    if (!authLoading && isEmployee) {
      loadAnalytics()
    }
  }, [authLoading, isEmployee, timeRange])

  async function loadAnalytics() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/ai-analytics?timeRange=${timeRange}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load analytics')
      }

      setData(result)
    } catch (err) {
      console.error('[AIAnalytics] Load error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
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
            <p className="text-gray-600">Loading AI analytics...</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Analytics</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadAnalytics}
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

  const {
    sessionAnalytics,
    providerPerformance,
    userEngagement,
    assessmentMetrics,
    conversationMetrics,
    topUsers,
    conversationQuality
  } = data

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
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">AI Analytics</h1>
                <p className="text-gray-600">Comprehensive AI usage and performance metrics</p>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex gap-2">
              {[
                { value: '24h', label: '24h' },
                { value: '7d', label: '7d' },
                { value: '30d', label: '30d' },
                { value: '90d', label: '90d' }
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    timeRange === range.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Session Analytics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Sessions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{sessionAnalytics.totalSessions.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Messages</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{sessionAnalytics.totalMessages.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Avg Messages/Session</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{sessionAnalytics.avgMessagesPerSession}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Avg Duration</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{Math.floor(sessionAnalytics.avgDurationSeconds / 60)}m</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{sessionAnalytics.completionRate}%</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Completed Sessions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{sessionAnalytics.completedSessions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Engagement */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User Engagement</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Unique Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{userEngagement.uniqueUsers}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Returning Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{userEngagement.returningUsers}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Return Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{userEngagement.returningUserRate}%</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">New Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{userEngagement.newUsers}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Avg Sessions/User</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{userEngagement.avgSessionsPerUser}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Provider Performance */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI Provider Performance</h2>
            <div className="space-y-4">
              {Object.entries(providerPerformance).map(([provider, stats]) => (
                <div key={provider} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                      {provider}
                    </h3>
                    <span className="text-sm text-gray-500">{stats.sessions} sessions</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Messages</p>
                      <p className="font-semibold text-gray-900">{stats.messages}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Avg/Session</p>
                      <p className="font-semibold text-gray-900">{stats.avgMessagesPerSession}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Avg Duration</p>
                      <p className="font-semibold text-gray-900">{Math.floor(stats.avgDuration / 60)}m</p>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(providerPerformance).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No provider data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Assessment Metrics */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Assessment Performance</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-900">{assessmentMetrics.totalAssessments}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{assessmentMetrics.completedAssessments}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Completion Rate</p>
                  <p className="text-2xl font-bold text-purple-900">{assessmentMetrics.completionRate}%</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-600 font-medium">Abandoned</p>
                  <p className="text-2xl font-bold text-amber-900">{assessmentMetrics.abandonedAssessments}</p>
                </div>
              </div>

              {Object.keys(assessmentMetrics.scenarioBreakdown).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Scenario Breakdown</p>
                  <div className="space-y-2">
                    {Object.entries(assessmentMetrics.scenarioBreakdown).map(([scenario, count]) => (
                      <div key={scenario} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{scenario}</span>
                        <span className="font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Metrics */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Conversation Quality</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Conversations</p>
                  <p className="text-2xl font-bold text-blue-900">{conversationMetrics.totalConversations}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Questions Asked</p>
                  <p className="text-2xl font-bold text-purple-900">{conversationMetrics.questionsAsked}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Avg User Message</p>
                  <p className="text-2xl font-bold text-green-900">{conversationMetrics.avgUserMessageLength} chars</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-600 font-medium">Avg AI Response</p>
                  <p className="text-2xl font-bold text-amber-900">{conversationMetrics.avgAiResponseLength} chars</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">Question Rate</p>
                <p className="text-2xl font-bold text-gray-900">{conversationMetrics.questionRate}%</p>
              </div>
            </div>
          </div>

          {/* Top Users */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Active Users</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {topUsers.map((user, index) => (
                <div key={user.userHash} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">User {user.userHash.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">{user.sessions} sessions • {user.totalMessages} messages</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(user.lastActive).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {topUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No user data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Metrics */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-4">Advanced Quality Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-sm text-purple-100">Avg Response Time</p>
              <p className="text-3xl font-bold mt-1">{conversationQuality.avgResponseTimeSeconds}s</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-sm text-purple-100">Engagement Rate</p>
              <p className="text-3xl font-bold mt-1">{conversationQuality.engagementRate}%</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-sm text-purple-100">Sessions Analyzed</p>
              <p className="text-3xl font-bold mt-1">{conversationQuality.sessionsAnalyzed}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-sm text-purple-100">Avg AI Message</p>
              <p className="text-3xl font-bold mt-1">{conversationQuality.avgAiMessageLength}</p>
              <p className="text-xs text-purple-100 mt-1">characters</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
