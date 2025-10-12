'use client'

import { useAuth } from '@/hooks/useAuth'
import ProtectedLayout from '@/components/ProtectedLayout'
import {
  FileText,
  Wrench,
  Zap,
  BarChart3,
  Palette,
  CreditCard,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
  Sparkles,
  BookOpen,
  User,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, profile, userRole, isEmployee } = useAuth()

  const mainPlatformUrl = process.env.NEXT_PUBLIC_MAIN_PLATFORM_URL || 'http://localhost:3000'

  const features = [
    {
      title: 'AI Security Platform',
      description: 'Access AI-powered security design tools',
      subtitle: 'Launch the main Design-Rite platform to create security estimates, AI assessments, and professional proposals.',
      icon: Sparkles,
      href: `${mainPlatformUrl}/dashboard`,
      external: true,
      color: 'from-blue-500 to-blue-600',
      badge: 'Launch Platform'
    },
    {
      title: 'Document Manager',
      description: 'Upload and manage your files',
      subtitle: 'Upload documents, images, and files for AI analysis and processing.',
      icon: FileText,
      href: '/documents',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Business Tools',
      description: 'Generate invoices and reports',
      subtitle: 'Create professional invoices, reports, and other business documents.',
      icon: Wrench,
      href: '/business-tools',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Analytics',
      description: 'Monitor your application usage',
      subtitle: 'Track performance metrics and user analytics for your business.',
      icon: BarChart3,
      href: '/analytics',
      color: 'from-amber-500 to-amber-600'
    },
    {
      title: 'Helpful Documents',
      description: 'Access guides and resources',
      subtitle: 'View, download, and print helpful PDFs and guides provided by admins.',
      icon: BookOpen,
      href: '/documents?tab=resources',
      color: 'from-teal-500 to-teal-600'
    },
    {
      title: 'Profile',
      description: 'Manage your account settings',
      subtitle: 'Update your company information, logo, and account preferences.',
      icon: User,
      href: '/profile',
      color: 'from-pink-500 to-pink-600'
    },
    {
      title: 'Subscription Tiers',
      description: 'Manage access levels',
      subtitle: 'Control Guest, Pro, and Enterprise access to features.',
      icon: CreditCard,
      href: '/subscription',
      color: 'from-indigo-500 to-indigo-600'
    }
  ]

  const quickStats = [
    {
      label: 'Documents',
      value: '0 / 2',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Account Status',
      value: 'Free Tier',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Member Since',
      value: new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  return (
    <ProtectedLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || 'there'}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            {isEmployee
              ? `You're signed in as ${userRole?.role?.replace('_', ' ')} - You have access to admin features.`
              : 'Your security proposal hub is ready. What would you like to do today?'}
          </p>
        </div>

        {/* Employee Notice */}
        {isEmployee && (
          <div className="mb-8 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Design-Rite Employee Access</h3>
                <p className="text-purple-100 mb-4">
                  You have elevated permissions. Access the admin dashboard to manage the platform,
                  view analytics, and configure system settings.
                </p>
                <Link
                  href="/transfer-session"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Open Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const CardWrapper = feature.external ? 'a' : Link
              const linkProps = feature.external
                ? { href: feature.href, target: '_blank', rel: 'noopener noreferrer' }
                : { href: feature.href }

              return (
                <CardWrapper
                  key={index}
                  {...linkProps}
                  className="group bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center transform group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    {feature.badge && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
                        {feature.external && <ExternalLink className="w-3 h-3" />}
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm font-medium text-gray-500 mb-3">
                    {feature.description}
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {feature.subtitle}
                  </p>
                  <div className="flex items-center text-primary font-semibold text-sm group-hover:gap-2 transition-all">
                    <span>{feature.external ? 'Launch' : 'Open'}</span>
                    <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </CardWrapper>
              )
            })}
          </div>
        </div>

        {/* Upgrade CTA (non-employees only) */}
        {!isEmployee && (
          <div className="mt-8 bg-gradient-to-r from-primary to-purple-600 rounded-xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Ready to do more?</h3>
                <p className="text-purple-100 mb-4">
                  Upgrade to Pro or Enterprise for unlimited documents, advanced features, and priority support.
                </p>
                <Link
                  href="/subscription"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                >
                  <TrendingUp className="w-5 h-5" />
                  View Plans & Pricing
                </Link>
              </div>
              <div className="hidden lg:block">
                <div className="text-6xl">🚀</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}
