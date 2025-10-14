'use client'

import { useAuth } from '@/hooks/useAuth'
import ProtectedLayout from '@/components/ProtectedLayout'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, UsersRound, Mail, Shield, UserPlus, Trash2, Activity, Clock } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  lastActive: string
  joinedDate: string
}

interface ActivityItem {
  user: string
  action: string
  timestamp: string
}

export default function TeamManagementPage() {
  const { isEmployee, loading, user, userRole } = useAuth()
  const router = useRouter()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Redirect non-employees
  useEffect(() => {
    if (!loading && user && userRole && !isEmployee) {
      console.log('[Team Management] User is not an employee, redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [isEmployee, loading, user, userRole, router])

  // Load mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setTeamMembers([
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah@designrite.com',
          role: 'Admin',
          status: 'active',
          lastActive: new Date(Date.now() - 10 * 60000).toISOString(),
          joinedDate: '2024-01-15'
        },
        {
          id: '2',
          name: 'Michael Chen',
          email: 'michael@designrite.com',
          role: 'Developer',
          status: 'active',
          lastActive: new Date(Date.now() - 30 * 60000).toISOString(),
          joinedDate: '2024-02-20'
        },
        {
          id: '3',
          name: 'Emily Rodriguez',
          email: 'emily@designrite.com',
          role: 'Manager',
          status: 'active',
          lastActive: new Date(Date.now() - 120 * 60000).toISOString(),
          joinedDate: '2024-03-10'
        },
        {
          id: '4',
          name: 'David Kim',
          email: 'david@designrite.com',
          role: 'Contractor',
          status: 'active',
          lastActive: new Date(Date.now() - 240 * 60000).toISOString(),
          joinedDate: '2024-04-05'
        },
        {
          id: '5',
          name: 'Lisa Thompson',
          email: 'lisa@designrite.com',
          role: 'Developer',
          status: 'inactive',
          lastActive: new Date(Date.now() - 86400000 * 5).toISOString(),
          joinedDate: '2023-11-12'
        }
      ])

      setActivities([
        {
          user: 'Sarah Johnson',
          action: 'Updated team member role',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString()
        },
        {
          user: 'Michael Chen',
          action: 'Added new team member',
          timestamp: new Date(Date.now() - 45 * 60000).toISOString()
        },
        {
          user: 'Emily Rodriguez',
          action: 'Modified team permissions',
          timestamp: new Date(Date.now() - 90 * 60000).toISOString()
        },
        {
          user: 'Sarah Johnson',
          action: 'Removed inactive member',
          timestamp: new Date(Date.now() - 180 * 60000).toISOString()
        }
      ])

      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // Show loading while auth or role is loading
  if (loading || (user && !userRole)) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Team Management...</p>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  // Only show "return null" if we've confirmed they're not an employee
  if (userRole && !isEmployee) {
    return null
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'developer':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'manager':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'contractor':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Back to Admin Link */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>

          {/* Header */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <UsersRound className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Team Management</h1>
                  <p className="text-gray-600 mt-1">Manage team members, roles, and permissions</p>
                </div>
              </div>
              <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg">
                <UserPlus className="w-5 h-5" />
                Add Member
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading team members...</p>
            </div>
          ) : (
            <>
              {/* Team Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UsersRound className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Total Members</p>
                      <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Active Members</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {teamMembers.filter(m => m.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Admins</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {teamMembers.filter(m => m.role.toLowerCase() === 'admin').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Inactive</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {teamMembers.filter(m => m.status === 'inactive').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Members List */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Members</h2>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">{member.name}</h3>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getRoleBadgeColor(member.role)}`}>
                              {member.role}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusBadgeColor(member.status)}`}>
                              {member.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5" />
                              {member.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Last active: {formatLastActive(member.lastActive)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Activity Feed */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Activity</h2>
                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg"
                    >
                      <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-semibold">{activity.user}</span> {activity.action}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatLastActive(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}
