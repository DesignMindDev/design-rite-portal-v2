'use client'

import { useAuth } from '@/hooks/useAuth'
import ProtectedLayout from '@/components/ProtectedLayout'
import {
  Settings,
  BarChart3,
  Users,
  Zap,
  Database,
  MessageSquare,
  FileText,
  Activity,
  Map,
  Calendar,
  Briefcase,
  TrendingUp,
  Shield,
  AlertCircle,
  UsersRound,
  Palette
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminDashboardPage() {
  const { isEmployee, loading, user, userRole } = useAuth()
  const router = useRouter()

  // Redirect non-employees (but wait for role to load)
  useEffect(() => {
    // Wait for both loading to complete AND role to be loaded
    if (!loading && user && userRole && !isEmployee) {
      console.log('[Admin] User is not an employee, redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [isEmployee, loading, user, userRole, router])

  // Show loading while auth or role is loading
  if (loading || (user && !userRole)) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  // Only show "return null" if we've confirmed they're not an employee
  if (userRole && !isEmployee) {
    return null
  }

  const adminSections = [
    {
      title: 'Platform Dashboard',
      description: 'Real-time metrics, user activity, and system statistics',
      icon: Database,
      href: '/admin/dashboard',
      color: 'from-cyan-500 to-cyan-600',
      status: 'active'
    },
    {
      title: 'AI Providers',
      description: 'Manage AI models, API keys, and provider configurations',
      icon: Zap,
      href: '/admin/ai-providers',
      color: 'from-blue-500 to-blue-600',
      status: 'active'
    },
    {
      title: 'AI Analytics',
      description: 'Monitor AI usage, costs, and performance metrics',
      icon: BarChart3,
      href: '/admin/ai-analytics',
      color: 'from-purple-500 to-purple-600',
      status: 'active'
    },
    {
      title: 'AI Health',
      description: 'Check AI provider health and system diagnostics',
      icon: Activity,
      href: '/admin/ai-health',
      color: 'from-green-500 to-green-600',
      status: 'active'
    },
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      href: '/admin/super',
      color: 'from-indigo-500 to-indigo-600',
      status: 'active'
    },
    {
      title: 'Demo Dashboard',
      description: 'Track demo bookings and lead conversions',
      icon: Calendar,
      href: '/admin/demo-dashboard',
      color: 'from-amber-500 to-amber-600',
      status: 'active'
    },
    {
      title: 'Spatial Studio',
      description: 'Manage floor plans and camera placements',
      icon: Map,
      href: '/admin/spatial-studio',
      color: 'from-teal-500 to-teal-600',
      status: 'pending'
    },
    {
      title: 'Operations',
      description: 'System operations and maintenance tools',
      icon: Settings,
      href: '/admin/operations',
      color: 'from-gray-500 to-gray-600',
      status: 'active'
    },
    {
      title: 'Subscriptions',
      description: 'Manage subscription tiers and billing',
      icon: TrendingUp,
      href: '/admin/subscriptions',
      color: 'from-pink-500 to-pink-600',
      status: 'active'
    },
    {
      title: 'Team Management (Internal)',
      description: 'Manage internal team members and roles',
      icon: UsersRound,
      href: '/admin/team',
      color: 'from-blue-500 to-blue-600',
      status: 'active'
    },
    {
      title: 'About Us Team (Public)',
      description: 'Manage public-facing About Us team profiles',
      icon: Users,
      href: '/admin/about-team',
      color: 'from-emerald-500 to-emerald-600',
      status: 'active'
    },
    {
      title: 'Site Logos',
      description: 'Manage header and footer logos',
      icon: Palette,
      href: '/admin/site-logos',
      color: 'from-rose-500 to-rose-600',
      status: 'active'
    },
    {
      title: 'Blog Management',
      description: 'Create and manage blog posts with featured images',
      icon: FileText,
      href: '/admin/blog',
      color: 'from-violet-500 to-violet-600',
      status: 'active'
    }
  ]

  return (
    <ProtectedLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Portal V2 - Consolidated Admin Control</p>
            </div>
          </div>
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-900 font-medium">Marketing & Content Migration Complete!</p>
                <p className="text-sm text-green-700 mt-1">
                  11 of 12 admin sections fully active. Only Spatial Studio remaining!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Pages</p>
                <p className="text-2xl font-bold text-gray-900">11 / 12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">System Health</p>
                <p className="text-2xl font-bold text-gray-900">100%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">AI Usage</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Sections Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminSections.map((section, index) => {
              const isActive = section.status === 'active'

              return (
                <Link
                  key={index}
                  href={isActive ? section.href : '#'}
                  className={`group bg-white rounded-xl p-6 border border-gray-200 shadow-sm transition-all duration-300 ${
                    isActive
                      ? 'hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                  onClick={(e) => {
                    if (!isActive) {
                      e.preventDefault()
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center ${
                      isActive ? 'transform group-hover:scale-110 transition-transform' : ''
                    }`}>
                      <section.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isActive ? 'Active' : 'Pending'}
                    </span>
                  </div>
                  <h3 className={`text-xl font-bold text-gray-900 mb-2 ${
                    isActive ? 'group-hover:text-primary transition-colors' : ''
                  }`}>
                    {section.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {section.description}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Migration Progress */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-8 text-white shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">🎉 Marketing & Content Migration Complete!</h3>
              <p className="text-blue-100 mb-4">
                Team profiles, site logos, and blog management successfully migrated. 11 of 12 pages fully active!
              </p>
              <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: '92%' }}></div>
              </div>
              <p className="text-sm text-blue-100 mt-2">11 of 12 pages active (92% complete)</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
