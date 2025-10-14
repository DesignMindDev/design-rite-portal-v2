'use client'

import Link from 'next/link'
import { XCircle, ArrowLeft } from 'lucide-react'
import ProtectedLayout from '@/components/ProtectedLayout'

export default function SubscriptionCancelPage() {
  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            {/* Cancel Icon */}
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-gray-600" />
            </div>

            {/* Cancel Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Payment Canceled
            </h1>
            
            <p className="text-gray-600 mb-8">
              Your payment was canceled. No charges were made to your account. You can try again anytime you're ready.
            </p>

            {/* Info Box */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold text-blue-900 mb-2">Need Help?</h2>
              <p className="text-sm text-blue-700">
                If you experienced any issues during checkout or have questions about our plans, please contact our support team.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              <Link
                href="/subscription"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Subscription
              </Link>
              
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
