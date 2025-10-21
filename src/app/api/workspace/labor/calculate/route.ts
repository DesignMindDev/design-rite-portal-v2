import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface DeviceLineItem {
  device_type: string
  quantity: number
  category?: string
}

interface CalculateRequest {
  user_id: string
  devices: DeviceLineItem[]

  // Optional overrides
  project_distance_miles?: number
  project_duration_days?: number
  margin_target_percent?: number

  // Optional team composition overrides
  tech_count?: number
  lead_count?: number
  pm_count?: number
  engineer_count?: number

  // Optional rate overrides
  tech_rate?: number
  lead_rate?: number
  pm_rate?: number
  engineer_rate?: number

  // Optional: specify which rate table to use
  rate_table_id?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CalculateRequest = await request.json()

    if (!body.user_id || !body.devices || body.devices.length === 0) {
      return NextResponse.json(
        { error: 'user_id and devices array required' },
        { status: 400 }
      )
    }

    // Get user's active labor rate table (or use specified one)
    let rateTable
    if (body.rate_table_id) {
      const { data } = await supabase
        .from('labor_rate_tables')
        .select('*')
        .eq('id', body.rate_table_id)
        .eq('user_id', body.user_id)
        .single()
      rateTable = data
    } else {
      const { data } = await supabase
        .from('labor_rate_tables')
        .select('*')
        .eq('user_id', body.user_id)
        .eq('is_active', true)
        .single()
      rateTable = data
    }

    if (!rateTable) {
      return NextResponse.json(
        { error: 'No active labor rate table found. Please configure labor rates first.' },
        { status: 404 }
      )
    }

    // Get labor rates for this table
    const { data: laborRates } = await supabase
      .from('labor_rates')
      .select('*')
      .eq('rate_table_id', rateTable.id)

    if (!laborRates || laborRates.length === 0) {
      return NextResponse.json(
        { error: 'No labor rates configured for this rate table' },
        { status: 404 }
      )
    }

    // Convert to lookup object
    const rates: Record<string, any> = {}
    laborRates.forEach(rate => {
      rates[rate.role_name] = rate
    })

    // Get device labor standards
    const { data: deviceStandards } = await supabase
      .from('device_labor_standards')
      .select('*')
      .eq('user_id', body.user_id)

    if (!deviceStandards || deviceStandards.length === 0) {
      return NextResponse.json(
        { error: 'No device labor standards configured. Please set up labor hours per device type.' },
        { status: 404 }
      )
    }

    // Convert to lookup object
    const standards: Record<string, any> = {}
    deviceStandards.forEach(std => {
      standards[std.device_type.toLowerCase()] = std
    })

    // Calculation parameters (use provided values or defaults)
    const projectDistance = body.project_distance_miles || 25
    const projectDays = body.project_duration_days || 5
    const marginTarget = body.margin_target_percent || 30

    const techCount = body.tech_count !== undefined ? body.tech_count : 2
    const leadCount = body.lead_count !== undefined ? body.lead_count : 1
    const pmCount = body.pm_count || 0
    const engCount = body.engineer_count || 0

    // Get rates (use overrides if provided, otherwise from table)
    const techRate = body.tech_rate || rates.tech?.billed_rate || 90
    const leadRate = body.lead_rate || rates.lead?.billed_rate || 120
    const pmRate = body.pm_rate || rates.pm?.billed_rate || 140
    const engRate = body.engineer_rate || rates.engineer?.billed_rate || 150

    // Calculate blended hourly rate
    const teamHourlyRate =
      (techCount * techRate) +
      (leadCount * leadRate) +
      (pmCount * pmRate) +
      (engCount * engRate)

    // Process each device
    const lineItems = []
    let totalLaborHours = 0
    let totalLaborCost = 0
    let totalTravelCost = 0
    let totalOverheadCost = 0
    let totalTrueCost = 0
    let totalMarkupAmount = 0
    let totalSellPrice = 0

    for (const device of body.devices) {
      // Find labor standard for this device
      const deviceKey = device.device_type.toLowerCase()
      const standard = standards[deviceKey]

      if (!standard) {
        console.warn(`No labor standard found for device: ${device.device_type}`)
        continue
      }

      const hours = (standard.install_hours + standard.programming_hours) * device.quantity
      const laborCost = hours * teamHourlyRate * rateTable.rate_multiplier
      const travelCost = projectDistance * 0.67 * 2 // IRS mileage rate × round trip
      const overhead = laborCost * (rateTable.overhead_percent / 100)
      const trueCost = laborCost + travelCost + overhead

      const markupAmount = trueCost * (marginTarget / 100)
      const sellPrice = trueCost + markupAmount
      const actualMargin = (markupAmount / sellPrice * 100)

      // Accumulate totals
      totalLaborHours += hours
      totalLaborCost += laborCost
      totalTravelCost += travelCost
      totalOverheadCost += overhead
      totalTrueCost += trueCost
      totalMarkupAmount += markupAmount
      totalSellPrice += sellPrice

      lineItems.push({
        device_type: device.device_type,
        quantity: device.quantity,
        category: standard.category,
        hours_per_unit: standard.install_hours + standard.programming_hours,
        total_hours: hours,
        hourly_rate: teamHourlyRate,
        labor_cost: Math.round(laborCost * 100) / 100,
        travel_cost: Math.round(travelCost * 100) / 100,
        overhead_cost: Math.round(overhead * 100) / 100,
        true_cost: Math.round(trueCost * 100) / 100,
        markup_amount: Math.round(markupAmount * 100) / 100,
        sell_price: Math.round(sellPrice * 100) / 100,
        margin_percent: Math.round(actualMargin * 10) / 10
      })
    }

    const actualMarginPercent = totalSellPrice > 0
      ? (totalMarkupAmount / totalSellPrice * 100)
      : 0

    const calculation = {
      // Inputs
      rate_table: {
        id: rateTable.id,
        name: rateTable.vehicle_name,
        multiplier: rateTable.rate_multiplier,
        min_margin: rateTable.min_margin_percent,
        overhead: rateTable.overhead_percent
      },
      project_parameters: {
        distance_miles: projectDistance,
        duration_days: projectDays,
        margin_target_percent: marginTarget
      },
      team_composition: {
        tech_count: techCount,
        lead_count: leadCount,
        pm_count: pmCount,
        engineer_count: engCount,
        tech_rate: techRate,
        lead_rate: leadRate,
        pm_rate: pmRate,
        engineer_rate: engRate,
        blended_hourly_rate: teamHourlyRate
      },

      // Results
      line_items: lineItems,
      totals: {
        labor_hours: Math.round(totalLaborHours * 100) / 100,
        labor_cost: Math.round(totalLaborCost * 100) / 100,
        travel_cost: Math.round(totalTravelCost * 100) / 100,
        overhead_cost: Math.round(totalOverheadCost * 100) / 100,
        true_cost: Math.round(totalTrueCost * 100) / 100,
        markup_amount: Math.round(totalMarkupAmount * 100) / 100,
        sell_price: Math.round(totalSellPrice * 100) / 100,
        margin_percent: Math.round(actualMarginPercent * 10) / 10
      },

      calculated_at: new Date().toISOString()
    }

    return NextResponse.json(calculation)

  } catch (error) {
    console.error('[Labor Calculate] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to calculate labor costs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve user's labor rate configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id parameter required' },
        { status: 400 }
      )
    }

    // Get active rate table
    const { data: rateTable } = await supabase
      .from('labor_rate_tables')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!rateTable) {
      return NextResponse.json(
        { error: 'No active labor rate table found' },
        { status: 404 }
      )
    }

    // Get labor rates
    const { data: laborRates } = await supabase
      .from('labor_rates')
      .select('*')
      .eq('rate_table_id', rateTable.id)

    // Get device standards
    const { data: deviceStandards } = await supabase
      .from('device_labor_standards')
      .select('*')
      .eq('user_id', userId)

    return NextResponse.json({
      rate_table: rateTable,
      labor_rates: laborRates || [],
      device_standards: deviceStandards || []
    })

  } catch (error) {
    console.error('[Labor Get Config] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get labor configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
