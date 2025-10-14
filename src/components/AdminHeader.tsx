'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Shield, UserCog } from 'lucide-react'

export default function AdminHeader() {
  const router = useRouter()
  const { userRole, isEmployee } = useAuth()

  // Check if user is super_admin
  const isSuperAdmin = userRole?.role === 'super_admin'

  // Don't show header if not an employee
  if (!isEmployee) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 border-b border-purple-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white/80" />
            <span className="text-white/90 text-sm font-medium">
              Admin Access
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin Dashboard Button - All Employees */}
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm border border-white/20 hover:border-white/30 text-sm font-medium"
            >
              <Shield className="w-4 h-4" />
              <span>Mission Control</span>
            </button>

            {/* User Management Button - Super Admin Only */}
            {isSuperAdmin && (
              <button
                onClick={() => router.push('/admin/super')}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white rounded-lg transition-all shadow-lg hover:shadow-xl border border-red-400 hover:border-red-300 text-sm font-medium"
              >
                <UserCog className="w-4 h-4" />
                <span>User Management</span>
                <span className="px-2 py-0.5 bg-red-700/50 text-white text-xs font-semibold rounded">
                  Super Admin
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
