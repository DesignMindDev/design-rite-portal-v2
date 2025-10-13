'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  Home,
  FileText,
  Wrench,
  Zap,
  BarChart3,
  Palette,
  CreditCard,
  User,
  Shield,
  ExternalLink,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, userRole, isEmployee, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      router.push('/auth')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out')
    }
  }

  // Navigation items - everyone sees these
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/documents', label: 'Documents', icon: FileText },
    { path: '/business-tools', label: 'Business Tools', icon: Wrench },
    { path: '/voltage', label: 'Voltage Calculator', icon: Zap, badge: 'Pro' },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/theme', label: 'Theme', icon: Palette },
    { path: '/subscription', label: 'Subscription', icon: CreditCard },
    { path: '/profile', label: 'Profile & Settings', icon: User },
  ]

  // Employee-only items
  const employeeItems = isEmployee
    ? [
        {
          type: 'button' as const,
          label: 'Admin Dashboard',
          icon: Shield,
          badge: 'Admin',
          action: () => router.push('/transfer-session')
        }
      ]
    : []

  const NavContent = () => (
    <>
      {/* Header */}
      <div className={`p-6 border-b border-gray-200 ${collapsed ? 'px-3' : ''}`}>
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Design-Rite
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Portal V2</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className={`p-4 border-b border-gray-200 ${collapsed ? 'px-2' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {profile?.company || user?.email}
              </p>
              {isEmployee && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  {userRole?.role?.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Back to Welcome Button */}
        <Link
          href="/welcome"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 text-purple-700 hover:from-purple-100 hover:to-blue-100 hover:border-purple-300 mb-3 ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          title={collapsed ? 'Back to Welcome' : undefined}
          onClick={() => setMobileOpen(false)}
        >
          <ArrowLeft className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="flex-1 font-medium text-sm">Back to Welcome</span>}
        </Link>

        {navItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 font-medium text-sm">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}

        {/* Employee Section */}
        {employeeItems.length > 0 && (
          <>
            <div className={`pt-4 pb-2 ${collapsed ? 'border-t border-gray-200' : ''}`}>
              {!collapsed && (
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Employee Access
                </p>
              )}
            </div>
            {employeeItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.action()
                  setMobileOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 hover:bg-purple-50 hover:text-purple-700 ${
                  collapsed ? 'justify-center px-2' : ''
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 font-medium text-sm">{item.label}</span>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                          {item.badge}
                        </span>
                      )}
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </>
                )}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Sign Out Button */}
      <div className={`p-4 border-t border-gray-200 ${collapsed ? 'px-2' : ''}`}>
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Sign Out</span>}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
      >
        {mobileOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
        style={{ height: '100vh', position: 'sticky', top: 0 }}
      >
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-40 w-64 h-screen bg-white border-r border-gray-200 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>
    </>
  )
}
