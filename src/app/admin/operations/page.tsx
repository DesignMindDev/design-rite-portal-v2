'use client'

import Link from 'next/link'
import { ArrowLeft, Settings, AlertCircle } from 'lucide-react'

export default function OperationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Settings className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Operations Dashboard
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Real-time platform metrics, system health, and analytics
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Coming Soon - UI Components Required
                </h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  This page is currently disabled pending migration of dashboard components:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-blue-700">
                  <li>• MetricCard component</li>
                  <li>• ActivityFeed component</li>
                  <li>• FunnelChart component</li>
                </ul>
                <p className="text-sm text-blue-700 mt-3">
                  Once these components are created, this page will provide comprehensive operations monitoring including:
                  real-time activity, system health metrics, user engagement stats, revenue metrics, lead conversion funnel, AI performance tracking, and recent activity feed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
