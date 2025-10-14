'use client'

import Link from 'next/link'
import { ArrowLeft, Map, AlertCircle } from 'lucide-react'

export default function SpatialStudioPage() {
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
          <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Map className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Spatial Studio Analytics
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Floor plan uploads, camera placement analytics, and project metrics
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
                  <li>• TimeSeriesChart component</li>
                </ul>
                <p className="text-sm text-blue-700 mt-3">
                  Once these components are created, this page will provide comprehensive Spatial Studio analytics including:
                  total uploads, success rates, camera placement metrics, floor plan analysis performance, recent projects, and upload trends over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
