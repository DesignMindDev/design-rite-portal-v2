'use client'

import { useState } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import {
  MessageSquare,
  FileText,
  TrendingUp,
  Calendar,
  BarChart3,
  Activity,
  Lightbulb
} from 'lucide-react'

export default function AnalyticsPage() {
  const [stats] = useState({
    conversations: 0,
    conversationsThisMonth: 0,
    messages: 0,
    messagesThisMonth: 0,
    documents: 3,
    documentsThisMonth: 3,
    monthlyActivityPercent: 100
  })

  const metricCards = [
    {
      title: 'Total Conversations',
      value: stats.conversations,
      subtitle: `${stats.conversationsThisMonth} this month`,
      icon: MessageSquare,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Messages',
      value: stats.messages,
      subtitle: `${stats.messagesThisMonth} this month`,
      icon: Activity,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Documents Uploaded',
      value: stats.documents,
      subtitle: `${stats.documentsThisMonth} this month`,
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Monthly Activity',
      value: `${stats.monthlyActivityPercent}%`,
      subtitle: 'of total activity',
      icon: TrendingUp,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600'
    }
  ]

  return (
    <ProtectedLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 text-lg">
            Track your platform usage and performance metrics
          </p>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${metric.textColor}`} />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {metric.title}
                </h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {metric.value}
                </p>
                <p className="text-sm text-gray-500">
                  {metric.subtitle}
                </p>
              </div>
            )
          })}
        </div>

        {/* Detailed Analytics */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Chat Analytics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Chat Analytics</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Total Conversations</p>
                  <p className="text-sm text-gray-500">All-time conversations</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.conversations}</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Total Messages</p>
                  <p className="text-sm text-gray-500">All-time messages sent</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.messages}</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Average Messages per Conversation</p>
                  <p className="text-sm text-gray-500">Engagement metric</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.conversations > 0 ? Math.round(stats.messages / stats.conversations) : 0}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="font-medium text-blue-900">This Month's Activity</p>
                  <p className="text-sm text-blue-600">Current billing cycle</p>
                </div>
                <p className="text-sm text-blue-700">
                  {stats.conversationsThisMonth} conversations, {stats.messagesThisMonth} messages
                </p>
              </div>
            </div>
          </div>

          {/* Document Analytics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Document Analytics</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Total Documents</p>
                  <p className="text-sm text-gray-500">All-time uploads</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.documents}</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Uploaded This Month</p>
                  <p className="text-sm text-gray-500">Current billing cycle</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.documentsThisMonth}</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Monthly Upload Rate</p>
                  <p className="text-sm text-gray-500">Percentage of activity</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.monthlyActivityPercent}%</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div>
                  <p className="font-medium text-purple-900">Storage Efficiency</p>
                  <p className="text-sm text-purple-600">Document organization</p>
                </div>
                <p className="text-sm font-semibold text-purple-700">Optimized</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <p className="text-gray-600">You have {stats.conversations} active conversations</p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <p className="text-gray-600">{stats.documents} documents uploaded and processed</p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Activity className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <p className="text-gray-600">{stats.messages} total messages exchanged with AI</p>
            </div>
          </div>
        </div>

        {/* Usage Insights */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-8 text-white shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Usage Insights</h3>
              <h4 className="font-semibold mb-2">Recommendations to optimize your platform usage</h4>
              <div className="space-y-2 text-blue-100">
                <p>• <strong className="text-white">Start Your First Conversation:</strong> Try the AI assistant to get help with business tasks and document analysis.</p>
                <p>• <strong className="text-white">Upload More Documents:</strong> Add pricing lists and proposal templates to unlock AI-powered invoice generation.</p>
                <p>• <strong className="text-white">Explore Business Tools:</strong> Check out the Invoice Generator to create professional invoices quickly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
