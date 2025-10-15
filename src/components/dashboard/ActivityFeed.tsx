'use client'

import { Users, Calendar, Box, MessageSquare } from 'lucide-react'

interface Activity {
  id: string
  type: 'lead' | 'demo' | 'spatial' | 'ai_session'
  title: string
  description: string
  timestamp: string
}

interface ActivityFeedProps {
  activities: Activity[]
  loading?: boolean
}

export default function ActivityFeed({ activities, loading = false }: ActivityFeedProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <Users className="w-5 h-5 text-blue-600" />
      case 'demo':
        return <Calendar className="w-5 h-5 text-green-600" />
      case 'spatial':
        return <Box className="w-5 h-5 text-purple-600" />
      case 'ai_session':
        return <MessageSquare className="w-5 h-5 text-yellow-600" />
      default:
        return <MessageSquare className="w-5 h-5 text-gray-600" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-100 rounded-lg animate-pulse">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full">
            {getIcon(activity.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {activity.title}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {activity.description}
            </p>
          </div>

          {/* Timestamp */}
          <div className="flex-shrink-0 text-xs text-gray-400">
            {formatTimestamp(activity.timestamp)}
          </div>
        </div>
      ))}
    </div>
  )
}
