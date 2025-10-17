'use client';

import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Cancel Icon */}
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full">
          <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Message */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          Checkout Canceled
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
          No worries! Your trial signup was canceled. You haven't been charged anything.
        </p>

        {/* Info Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8 max-w-md mx-auto">
          <h2 className="font-bold text-lg mb-4">What happened?</h2>
          <p className="text-gray-600 mb-4">
            You exited the checkout process before completing your trial signup.
            No payment information was collected.
          </p>
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold mb-2">Still interested?</h3>
            <p className="text-sm text-gray-600 mb-4">
              We'd love to have you try Design-Rite! Our 7-day free trial gives you full access
              to all features with no commitment.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/start-trial"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Try Again - Start Free Trial
          </Link>

          <Link
            href="/"
            className="inline-block bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold border-2 border-gray-300 hover:border-gray-400 transition-all"
          >
            Go to Homepage
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-12 text-sm text-gray-600">
          <p className="mb-2">Questions about our trial or pricing?</p>
          <a href="mailto:support@design-rite.com" className="text-blue-600 hover:underline font-medium">
            Contact our support team
          </a>
        </div>

        {/* Benefits Reminder */}
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-2xl mb-2">🚀</div>
            <p className="text-xs text-gray-600">7-Day Free Trial</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">💳</div>
            <p className="text-xs text-gray-600">No Charge for 7 Days</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">✨</div>
            <p className="text-xs text-gray-600">Full Feature Access</p>
          </div>
        </div>
      </div>
    </div>
  );
}
