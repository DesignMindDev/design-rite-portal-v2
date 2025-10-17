'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Countdown timer for auto-redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to auth page
          window.location.href = '/auth?message=check_email';
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Success Icon */}
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          Welcome to Design-Rite! 🎉
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
          Your 7-day free trial has begun! Check your email for your login credentials.
        </p>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-2">📧</div>
            <h3 className="font-semibold mb-1">Check Your Email</h3>
            <p className="text-sm text-gray-600">
              We've sent you login instructions
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-2">⏰</div>
            <h3 className="font-semibold mb-1">7 Days Free</h3>
            <p className="text-sm text-gray-600">
              Full access, no charge for a week
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="font-semibold mb-1">All Features</h3>
            <p className="text-sm text-gray-600">
              Explore every tool and capability
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
          <h2 className="font-bold text-lg mb-4 text-blue-900">What's Next?</h2>
          <ol className="text-left space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 font-semibold text-sm">1</span>
              <span><strong>Check your email</strong> - We've sent a welcome email with your account details</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 font-semibold text-sm">2</span>
              <span><strong>Set your password</strong> - Click the link in the email to access your account</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 font-semibold text-sm">3</span>
              <span><strong>Start designing</strong> - Explore AI tools, create assessments, and streamline your workflow</span>
            </li>
          </ol>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4">
          <Link
            href="/auth"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Sign In to Your Account →
          </Link>

          <p className="text-sm text-gray-600">
            Redirecting to login in {countdown} seconds...
          </p>

          <p className="text-xs text-gray-500 mt-4">
            Didn't receive an email? Check your spam folder or{' '}
            <a href="mailto:support@design-rite.com" className="text-blue-600 hover:underline">
              contact support
            </a>
          </p>
        </div>

        {/* Session ID (for support) */}
        {sessionId && (
          <div className="mt-8 text-xs text-gray-400">
            Session: {sessionId}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
