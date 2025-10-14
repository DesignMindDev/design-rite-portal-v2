/**
 * Design-Rite Professional - Demo Dashboard API
 * Manages demo bookings data and statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/demo-dashboard
 * Fetch demo bookings with statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get all demo bookings
    const { data: bookings, error } = await supabase
      .from('demo_bookings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching demo bookings:', error)
      throw error
    }

    // Calculate statistics
    const stats = calculateStats(bookings || [])

    // Get upcoming demos (next 30 days)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const upcoming = (bookings || []).filter(b =>
      b.event_status === 'scheduled' &&
      new Date(b.start_time) > now &&
      new Date(b.start_time) <= thirtyDaysFromNow
    )

    // Get high-value leads (score >= 70)
    const highValueLeads = (bookings || []).filter(b =>
      b.lead_score >= 70 &&
      b.event_status === 'scheduled'
    )

    // Get recent activity (last 10 bookings)
    const recentActivity = (bookings || []).slice(0, 10)

    return NextResponse.json({
      success: true,
      stats,
      upcoming_demos: upcoming,
      high_value_leads: highValueLeads,
      recent_activity: recentActivity,
      total_bookings: bookings?.length || 0
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/demo-dashboard
 * Update demo booking status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { booking_id, updates } = body

    if (!booking_id) {
      return NextResponse.json(
        { success: false, error: 'booking_id is required' },
        { status: 400 }
      )
    }

    // Update the booking
    const { data, error } = await supabase
      .from('demo_bookings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)
      .select()

    if (error) {
      console.error('Error updating booking:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    console.log('✅ Booking updated:', {
      id: booking_id,
      updates: Object.keys(updates)
    })

    return NextResponse.json({
      success: true,
      booking: data[0]
    })

  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update booking',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate dashboard statistics
 */
function calculateStats(bookings: any[]) {
  const total = bookings.length

  if (total === 0) {
    return {
      total_bookings: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      conversion_to_trial: 0,
      conversion_to_customer: 0,
      average_lead_score: 0,
      conversion_rate: 0,
      high_value_leads: 0
    }
  }

  const scheduled = bookings.filter(b => b.event_status === 'scheduled').length
  const completed = bookings.filter(b => b.demo_conducted).length
  const cancelled = bookings.filter(b => b.event_status === 'cancelled').length
  const trials = bookings.filter(b => b.conversion_status === 'trial').length
  const customers = bookings.filter(b => b.conversion_status === 'customer').length
  const highValueLeads = bookings.filter(b => b.lead_score >= 70).length

  const totalLeadScore = bookings.reduce((sum, b) => sum + (b.lead_score || 0), 0)
  const averageLeadScore = Math.round(totalLeadScore / total)

  const conversionRate = completed > 0
    ? Math.round(((trials + customers) / completed) * 100)
    : 0

  return {
    total_bookings: total,
    scheduled,
    completed,
    cancelled,
    conversion_to_trial: trials,
    conversion_to_customer: customers,
    average_lead_score: averageLeadScore,
    conversion_rate: conversionRate,
    high_value_leads: highValueLeads
  }
}
