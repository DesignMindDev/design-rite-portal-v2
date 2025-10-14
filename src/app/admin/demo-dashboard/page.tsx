'use client'

import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, Users, Award, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface DemoBooking {
  id: string
  calendly_event_id: string
  event_name: string
  event_status: string
  start_time: string
  end_time: string
  invitee_name: string
  invitee_email: string
  invitee_company: string | null
  invitee_phone: string | null
  biggest_challenge: string | null
  monthly_proposal_volume: number | null
  company_size: string | null
  urgency_level: string | null
  lead_score: number
  follow_up_status: string
  demo_conducted: boolean
  conversion_status: string
  created_at: string
  notes: string | null
}

interface DashboardStats {
  total_bookings: number
  scheduled: number
  completed: number
  cancelled: number
  conversion_to_trial: number
  conversion_to_customer: number
  average_lead_score: number
  conversion_rate: number
  high_value_leads: number
}

interface DashboardData {
  stats: DashboardStats
  upcoming_demos: DemoBooking[]
  high_value_leads: DemoBooking[]
  recent_activity: DemoBooking[]
  total_bookings: number
}

export default function DemoDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<DemoBooking | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/demo-dashboard')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch dashboard data')
      }

      setDashboardData(data)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId: string, updates: Record<string, any>) => {
    try {
      const response = await fetch('/api/demo-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, updates })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to update booking')
      }

      // Refresh dashboard data
      await fetchDashboardData()

      // Show success message
      alert('Booking updated successfully!')
    } catch (error) {
      console.error('Failed to update booking:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen dr-bg-charcoal dr-text-pearl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading demo dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen dr-bg-charcoal dr-text-pearl flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 dr-bg-violet hover:bg-purple-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  const { stats, upcoming_demos, high_value_leads, recent_activity } = dashboardData

  return (
    <div className="min-h-screen dr-bg-charcoal dr-text-pearl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-2">📅 Demo Dashboard</h1>
          <p className="text-purple-100">Calendly integration for demo booking management</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            title="Total Bookings"
            value={stats.total_bookings}
            color="purple"
          />
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            title="Scheduled"
            value={stats.scheduled}
            color="blue"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            title="Completed"
            value={stats.completed}
            color="green"
          />
          <StatCard
            icon={<Award className="w-6 h-6" />}
            title="Avg Lead Score"
            value={stats.average_lead_score}
            suffix="/100"
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="High Value Leads"
            value={stats.high_value_leads}
            subtitle="Score ≥ 70"
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Trials Started"
            value={stats.conversion_to_trial}
            color="green"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            title="Customers"
            value={stats.conversion_to_customer}
            color="green"
          />
          <StatCard
            icon={<XCircle className="w-6 h-6" />}
            title="Cancelled"
            value={stats.cancelled}
            color="red"
          />
        </div>

        {/* Upcoming Demos */}
        <div className="bg-gray-800/60 backdrop-blur-xl dr-border-violet rounded-2xl border p-6 mb-8">
          <h2 className="text-xl font-bold dr-text-violet mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Demos (Next 30 Days)
          </h2>
          {upcoming_demos.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No upcoming demos scheduled</p>
          ) : (
            <div className="space-y-3">
              {upcoming_demos.map(demo => (
                <DemoCard
                  key={demo.id}
                  demo={demo}
                  onUpdate={updateBookingStatus}
                  onSelect={() => setSelectedBooking(demo)}
                />
              ))}
            </div>
          )}
        </div>

        {/* High Value Leads */}
        {high_value_leads.length > 0 && (
          <div className="bg-gray-800/60 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              High Value Leads (Score ≥ 70)
            </h2>
            <div className="space-y-3">
              {high_value_leads.map(demo => (
                <DemoCard
                  key={demo.id}
                  demo={demo}
                  onUpdate={updateBookingStatus}
                  onSelect={() => setSelectedBooking(demo)}
                  highlight
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-gray-800/60 backdrop-blur-xl dr-border-violet rounded-2xl border p-6">
          <h2 className="text-xl font-bold dr-text-violet mb-4">Recent Activity</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-400">Name</th>
                  <th className="text-left p-3 text-gray-400">Company</th>
                  <th className="text-left p-3 text-gray-400">Email</th>
                  <th className="text-left p-3 text-gray-400">Demo Time</th>
                  <th className="text-left p-3 text-gray-400">Lead Score</th>
                  <th className="text-left p-3 text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent_activity.map(booking => (
                  <tr
                    key={booking.id}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <td className="p-3">{booking.invitee_name}</td>
                    <td className="p-3">{booking.invitee_company || '-'}</td>
                    <td className="p-3 text-purple-300">{booking.invitee_email}</td>
                    <td className="p-3">
                      {new Date(booking.start_time).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-3">
                      <LeadScoreBadge score={booking.lead_score} />
                    </td>
                    <td className="p-3">
                      <StatusBadge status={booking.event_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdate={updateBookingStatus}
        />
      )}
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  suffix = '',
  subtitle = '',
  color = 'purple'
}: {
  icon: React.ReactNode
  title: string
  value: number
  suffix?: string
  subtitle?: string
  color?: string
}) {
  const colorClasses = {
    purple: 'text-purple-400 bg-purple-900/20 border-purple-500/30',
    blue: 'text-blue-400 bg-blue-900/20 border-blue-500/30',
    green: 'text-green-400 bg-green-900/20 border-green-500/30',
    yellow: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
    red: 'text-red-400 bg-red-900/20 border-red-500/30'
  }

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} border rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm text-gray-400">{title}</h3>
      </div>
      <p className="text-2xl font-bold">
        {value}
        {suffix && <span className="text-sm text-gray-400">{suffix}</span>}
      </p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

function DemoCard({
  demo,
  onUpdate,
  onSelect,
  highlight = false
}: {
  demo: DemoBooking
  onUpdate: (id: string, updates: Record<string, any>) => void
  onSelect: () => void
  highlight?: boolean
}) {
  return (
    <div
      className={`border rounded-lg p-4 ${
        highlight
          ? 'bg-yellow-900/10 border-yellow-500/30'
          : 'bg-gray-700/50 border-gray-600/50'
      } hover:border-purple-500/50 transition-colors cursor-pointer`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{demo.invitee_name}</h3>
          <p className="text-sm text-gray-400">{demo.invitee_company || 'Company not specified'}</p>
          <p className="text-sm text-purple-300">{demo.invitee_email}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            {new Date(demo.start_time).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          <p className="text-sm text-gray-400">
            {new Date(demo.start_time).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })}
          </p>
          <LeadScoreBadge score={demo.lead_score} />
        </div>
      </div>

      {demo.biggest_challenge && (
        <div className="mb-3 p-2 bg-gray-800/50 rounded">
          <p className="text-xs text-gray-400 mb-1">Challenge:</p>
          <p className="text-sm">{demo.biggest_challenge}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onUpdate(demo.id, { demo_conducted: true, follow_up_status: 'demo_completed' })
          }}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
        >
          ✓ Mark Complete
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onUpdate(demo.id, { conversion_status: 'trial', follow_up_status: 'trial_started' })
          }}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
        >
          🚀 Started Trial
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onUpdate(demo.id, { conversion_status: 'customer' })
          }}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
        >
          💰 Converted
        </button>
      </div>
    </div>
  )
}

function LeadScoreBadge({ score }: { score: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-600 text-white'
    if (score >= 60) return 'bg-yellow-600 text-white'
    return 'bg-gray-600 text-white'
  }

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getScoreColor(score)}`}>
      Score: {score}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-600 text-white'
      case 'completed':
        return 'bg-green-600 text-white'
      case 'cancelled':
        return 'bg-red-600 text-white'
      default:
        return 'bg-gray-600 text-white'
    }
  }

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
      {status}
    </span>
  )
}

function BookingDetailModal({
  booking,
  onClose,
  onUpdate
}: {
  booking: DemoBooking
  onClose: () => void
  onUpdate: (id: string, updates: Record<string, any>) => void
}) {
  const [notes, setNotes] = useState(booking.notes || '')

  const handleSaveNotes = () => {
    onUpdate(booking.id, { notes })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold dr-text-violet">{booking.invitee_name}</h2>
              <p className="text-gray-400">{booking.invitee_email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <DetailRow label="Company" value={booking.invitee_company || 'Not specified'} />
            <DetailRow label="Phone" value={booking.invitee_phone || 'Not specified'} />
            <DetailRow
              label="Demo Time"
              value={new Date(booking.start_time).toLocaleString()}
            />
            <DetailRow label="Lead Score" value={`${booking.lead_score}/100`} />
            <DetailRow label="Event Status" value={booking.event_status} />
            <DetailRow label="Conversion Status" value={booking.conversion_status} />
            <DetailRow
              label="Monthly Proposals"
              value={booking.monthly_proposal_volume?.toString() || 'Not specified'}
            />
            <DetailRow label="Company Size" value={booking.company_size || 'Not specified'} />
            <DetailRow label="Urgency Level" value={booking.urgency_level || 'Not specified'} />

            {booking.biggest_challenge && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Biggest Challenge:</p>
                <p className="text-sm bg-gray-700/50 p-3 rounded">{booking.biggest_challenge}</p>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Notes:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded p-3 text-sm min-h-[100px] focus:border-purple-500 outline-none"
                placeholder="Add notes about this demo..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveNotes}
                className="flex-1 px-4 py-2 dr-bg-violet hover:bg-purple-700 rounded-lg transition-colors"
              >
                Save Notes
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-700">
      <span className="text-sm text-gray-400">{label}:</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
