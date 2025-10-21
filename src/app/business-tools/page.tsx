'use client'

import ProtectedLayout from '@/components/ProtectedLayout'
import {
  FileText,
  Calculator,
  TrendingUp,
  FileCheck,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default function BusinessToolsPage() {
  const tools = [
    {
      title: 'Invoice Generator',
      description: 'Create professional invoices for your business',
      subtitle: 'Generate branded invoices with your company information, itemized services, tax calculations, and PDF export.',
      icon: FileText,
      href: '/business-tools/invoice-generator',
      color: 'from-green-500 to-green-600',
      badge: 'Popular'
    },
    {
      title: 'Proposal Generator',
      description: 'Build custom proposals quickly',
      subtitle: 'Create professional proposals using your uploaded templates and AI-powered content generation.',
      icon: FileCheck,
      href: '/business-tools/proposal-generator',
      color: 'from-blue-500 to-blue-600',
      badge: 'Coming Soon'
    },
    {
      title: 'Labor Calculator',
      description: 'Calculate labor costs with procurement vehicle rates',
      subtitle: 'Calculate labor costs using your procurement vehicle rates, team composition, and device-specific hours. AI-accessible for proposal generation.',
      icon: Calculator,
      href: '/business-tools/labor-calculator',
      color: 'from-purple-500 to-purple-600',
      badge: 'NEW'
    },
    {
      title: 'Performance Tracker',
      description: 'Monitor business performance metrics',
      subtitle: 'Track revenue, expenses, project completion rates, and key performance indicators over time.',
      icon: TrendingUp,
      href: '/business-tools/performance',
      color: 'from-amber-500 to-amber-600',
      badge: 'Coming Soon'
    }
  ]

  return (
    <ProtectedLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Business Tools</h1>
          <p className="text-gray-600 text-lg">
            Essential tools to streamline your business operations
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool, index) => {
            const Icon = tool.icon
            const isComingSoon = tool.badge === 'Coming Soon'

            return (
              <Link
                key={index}
                href={isComingSoon ? '#' : tool.href}
                className={`group bg-white rounded-xl p-8 border-2 border-gray-200 shadow-sm transition-all duration-300 ${
                  isComingSoon
                    ? 'cursor-not-allowed opacity-75'
                    : 'hover:shadow-xl hover:border-primary/50 transform hover:-translate-y-1'
                }`}
                onClick={(e) => isComingSoon && e.preventDefault()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center transform ${
                    !isComingSoon && 'group-hover:scale-110'
                  } transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  {tool.badge && (
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      tool.badge === 'Popular'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tool.badge}
                    </span>
                  )}
                </div>

                <h3 className={`text-2xl font-bold text-gray-900 mb-2 ${
                  !isComingSoon && 'group-hover:text-primary'
                } transition-colors`}>
                  {tool.title}
                </h3>

                <p className="text-gray-500 font-medium mb-3">
                  {tool.description}
                </p>

                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {tool.subtitle}
                </p>

                {!isComingSoon && (
                  <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all">
                    <span>Open Tool</span>
                    <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            More Tools Coming Soon
          </h3>
          <p className="text-blue-700 text-sm">
            We're actively building new business tools based on user feedback. Have a suggestion?{' '}
            <a href="mailto:support@design-rite.com" className="underline font-medium">
              Let us know
            </a>
            !
          </p>
        </div>
      </div>
    </ProtectedLayout>
  )
}
