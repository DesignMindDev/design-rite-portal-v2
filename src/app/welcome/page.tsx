'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  Sparkles,
  FileText,
  TrendingUp,
  Zap,
  ExternalLink,
  Loader2,
  Bell,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'

export default function WelcomePage() {
  const router = useRouter()
  const { user, profile, loading, isEmployee } = useAuth()
  const [logoClicks, setLogoClicks] = useState(0)
  const [showEasterEgg, setShowEasterEgg] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // Handle logo clicks (easter egg)
  const handleLogoClick = () => {
    const newCount = logoClicks + 1
    setLogoClicks(newCount)

    if (newCount === 5) {
      setShowEasterEgg(true)
      toast.success('🎉 Portal access unlocked!', {
        description: 'Redirecting to your dashboard...',
        duration: 2000
      })
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else if (newCount >= 3) {
      toast(`${5 - newCount} more clicks...`, {
        duration: 1000,
        icon: '👀'
      })
    }
  }

  // Handle session transfer to main platform workspace
  const handleWorkspace = async () => {
    try {
      console.log('[Portal] Starting workspace redirect...')
      toast.info('Launching Workspace...', { duration: 1500 })

      // Use existing auth hook session instead of creating new client
      if (!user) {
        console.error('[Portal] No user session found')
        toast.error('Session not found. Please sign in again.')
        router.push('/auth')
        return
      }

      // Get session using existing supabase client from lib/supabase.ts
      // This fixes the "Multiple GoTrueClient instances" warning
      const { authHelpers } = await import('@/lib/supabase')
      const session = await authHelpers.getCurrentSession()

      if (!session) {
        console.error('[Portal] No session found')
        toast.error('Session not found. Please sign in again.')
        router.push('/auth')
        return
      }

      console.log('[Portal] Session found, encoding tokens...')

      // Encode session tokens in URL hash
      const authData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token
      }
      const encodedAuth = encodeURIComponent(JSON.stringify(authData))

      // Redirect to main platform workspace
      const mainPlatformUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://design-rite.com'

      const workspaceUrl = `${mainPlatformUrl}/workspace#auth=${encodedAuth}`

      console.log('[Portal] Redirecting to:', workspaceUrl)

      // Use window.location.href for full redirect
      window.location.href = workspaceUrl
    } catch (error) {
      console.error('[Portal] Error transferring session:', error)
      toast.error('Failed to launch workspace. Please try again.')
    }
  }

  // Handle session transfer to V4 admin page
  const handleAdminPage = async () => {
    try {
      console.log('[Portal] Starting V4 admin redirect...')
      toast.info('Launching Admin Dashboard...', { duration: 1500 })

      if (!user) {
        console.error('[Portal] No user session found')
        toast.error('Session not found. Please sign in again.')
        router.push('/auth')
        return
      }

      const { authHelpers } = await import('@/lib/supabase')
      const session = await authHelpers.getCurrentSession()

      if (!session) {
        console.error('[Portal] No session found')
        toast.error('Session not found. Please sign in again.')
        router.push('/auth')
        return
      }

      console.log('[Portal] Session found, encoding tokens for admin...')

      // Encode session tokens in URL hash
      const authData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token
      }
      const encodedAuth = encodeURIComponent(JSON.stringify(authData))

      // Redirect to V4 admin page
      const mainPlatformUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://design-rite.com'

      // CRITICAL: Add ?transfer=true so V4 middleware skips auth check
      const adminUrl = `${mainPlatformUrl}/admin?transfer=true#auth=${encodedAuth}`

      console.log('[Portal] Redirecting to:', adminUrl)
      window.location.href = adminUrl
    } catch (error) {
      console.error('[Portal] Error transferring session to admin:', error)
      toast.error('Failed to launch admin dashboard. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading...</h2>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Handle test page redirect
  const handleTestPage = () => {
    const testPageUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/authtest'
      : 'https://design-rite.com/authtest'
    window.location.href = testPageUrl
  }

  const actionCards = [
    {
      title: 'Go to Workspace',
      description: 'Access AI Assistant, AI Discovery, and Quick Estimate tools',
      icon: Sparkles,
      color: 'from-blue-500 to-blue-600',
      action: handleWorkspace,
      badge: 'Popular'
    },
    ...(isEmployee ? [{
      title: 'Admin Dashboard',
      description: 'Manage users, AI providers, analytics, and platform settings',
      icon: Sparkles,
      color: 'from-purple-500 to-purple-600',
      action: () => router.push('/admin'),
      badge: 'Admin'
    }] : []),
    {
      title: 'My Portal',
      description: 'Access your documents, tools, and account settings',
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      action: () => router.push('/dashboard')
    },
    {
      title: 'Upgrade Plan',
      description: 'Unlock advanced features and unlimited access',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      action: () => router.push('/dashboard?tab=subscription'),
      badge: 'Save 20%'
    },
    {
      title: 'Back to Test Page',
      description: 'Return to the auth test page on the main platform',
      icon: ExternalLink,
      color: 'from-orange-500 to-orange-600',
      action: handleTestPage,
      badge: 'Testing'
    }
  ]

  const announcements = [
    {
      title: '🎉 New Feature: Voltage Drop Calculator',
      date: 'Jan 10, 2025',
      description: 'Calculate cable voltage drop for your security installations with our new Pro tool.',
      badge: 'New'
    },
    {
      title: '📊 AI-Powered Analytics Now Available',
      date: 'Jan 8, 2025',
      description: 'Track your usage, performance metrics, and get AI-powered insights.',
      badge: 'Update'
    },
    {
      title: '💼 Business Tools Enhanced',
      date: 'Jan 5, 2025',
      description: 'Generate invoices, proposals, and professional documents faster than ever.',
      badge: 'Improved'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo with Easter Egg */}
          <div
            onClick={handleLogoClick}
            className="cursor-pointer select-none transition-transform hover:scale-105 active:scale-95"
            title={logoClicks > 0 ? `${logoClicks} of 5 clicks` : ''}
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Design-Rite
            </h1>
            <p className="text-xs text-gray-500">Portal V2</p>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            {isEmployee && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                Employee
              </span>
            )}
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{profile?.full_name || user.email}</p>
              <p className="text-xs text-gray-500">{profile?.company || 'Welcome!'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold">
              {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            {isEmployee
              ? "You're signed in as a Design-Rite employee. Access your tools and admin features below."
              : "Your security proposal platform is ready. What would you like to do today?"}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <Zap className="w-4 h-4" />
            7-Day Free Trial Active (3 Assessments)
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {actionCards.map((card, index) => (
            <button
              key={index}
              onClick={card.action}
              className="group relative bg-white rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-left"
            >
              {card.badge && (
                <span className="absolute top-4 right-4 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                  {card.badge}
                </span>
              )}
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform`}>
                <card.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                {card.title}
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                {card.description}
              </p>
              <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all">
                <span>Get started</span>
                <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* Current Work Section */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Recent Activity</h2>
            <button className="text-primary font-medium hover:underline">View All</button>
          </div>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity yet. Start by creating your first estimate!</p>
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">What's New</h2>
          </div>
          <div className="space-y-4">
            {announcements.map((announcement, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0">
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                    announcement.badge === 'New' ? 'bg-green-100 text-green-700' :
                    announcement.badge === 'Update' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {announcement.badge}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{announcement.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{announcement.description}</p>
                  <p className="text-xs text-gray-400">{announcement.date}</p>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Easter Egg Animation */}
      {showEasterEgg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-12 text-center max-w-md animate-scale-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Portal Unlocked!</h2>
            <p className="text-gray-600 mb-6">
              Redirecting to your dashboard with full access...
            </p>
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
