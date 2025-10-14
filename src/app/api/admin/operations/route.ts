import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Operations Dashboard API - Master metrics endpoint
 * Aggregates data from all Supabase tables for unified operations view
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h'; // 24h, 7d, 30d

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    if (timeRange === '24h') {
      startDate.setHours(startDate.getHours() - 24);
    } else if (timeRange === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    }

    // Run all queries in parallel for performance
    const [
      realtimeMetrics,
      systemHealth,
      userEngagement,
      revenueMetrics,
      aiPerformance,
      leadPipeline,
      recentActivity
    ] = await Promise.all([
      getRealtimeMetrics(startDate),
      getSystemHealth(startDate),
      getUserEngagement(startDate),
      getRevenueMetrics(startDate),
      getAIPerformance(startDate),
      getLeadPipeline(startDate),
      getRecentActivity(20)
    ]);

    return NextResponse.json({
      success: true,
      timeRange,
      generatedAt: now.toISOString(),
      realtime: realtimeMetrics,
      systemHealth,
      userEngagement,
      revenue: revenueMetrics,
      aiPerformance,
      leadPipeline,
      recentActivity
    });

  } catch (error) {
    console.error('Operations dashboard error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch operations metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Real-time Activity Metrics
 */
async function getRealtimeMetrics(startDate: Date) {
  const [
    activeSessions,
    todayLeads,
    todayDemos,
    todayProjects,
    aiApiCalls
  ] = await Promise.all([
    // Active AI sessions (last activity within 1 hour)
    supabase
      .from('ai_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('last_activity', new Date(Date.now() - 60 * 60 * 1000).toISOString()),

    // Leads created today
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString()),

    // Demo bookings today
    supabase
      .from('demo_bookings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString()),

    // Spatial Studio projects today
    supabase
      .from('spatial_projects')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString()),

    // AI API calls today
    supabase
      .from('ai_analysis_debug')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
  ]);

  return {
    activeSessions: activeSessions.count || 0,
    todayLeads: todayLeads.count || 0,
    todayDemos: todayDemos.count || 0,
    todayProjects: todayProjects.count || 0,
    aiApiCalls: aiApiCalls.count || 0
  };
}

/**
 * System Health Metrics
 */
async function getSystemHealth(startDate: Date) {
  // Get AI analysis debug data for error rates
  const { data: debugLogs } = await supabase
    .from('ai_analysis_debug')
    .select('operation, error_message, execution_time_ms')
    .gte('created_at', startDate.toISOString());

  const totalCalls = debugLogs?.length || 0;
  const errors = debugLogs?.filter(log => log.error_message)?.length || 0;
  const avgExecutionTime = debugLogs?.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0) / (totalCalls || 1);

  // Get Spatial Studio upload success rate
  const { data: projects } = await supabase
    .from('spatial_projects')
    .select('analysis_status')
    .gte('created_at', startDate.toISOString());

  const totalProjects = projects?.length || 0;
  const failedProjects = projects?.filter(p => p.analysis_status === 'failed')?.length || 0;
  const uploadSuccessRate = totalProjects > 0 ? ((totalProjects - failedProjects) / totalProjects) * 100 : 100;

  return {
    apiResponseTime: Math.round(avgExecutionTime),
    errorRate: totalCalls > 0 ? (errors / totalCalls) : 0,
    uploadSuccessRate: Math.round(uploadSuccessRate * 10) / 10,
    totalApiCalls: totalCalls,
    totalErrors: errors
  };
}

/**
 * User Engagement Metrics
 */
async function getUserEngagement(startDate: Date) {
  const [
    sessions,
    leads,
    webActivity
  ] = await Promise.all([
    // AI session engagement
    supabase
      .from('ai_sessions')
      .select('user_hash, message_count, created_at, last_activity')
      .gte('created_at', startDate.toISOString()),

    // Lead tool usage
    supabase
      .from('leads')
      .select('used_quick_estimate, used_ai_assessment, used_system_surveyor, quotes_generated')
      .gte('created_at', startDate.toISOString()),

    // Web activity events
    supabase
      .from('web_activity_events')
      .select('lead_id, event_type, tool_name')
      .gte('created_at', startDate.toISOString())
  ]);

  const uniqueUsers = new Set(sessions.data?.map(s => s.user_hash) || []).size;

  const avgSessionDuration = sessions.data?.reduce((sum, s) => {
    const duration = new Date(s.last_activity).getTime() - new Date(s.created_at).getTime();
    return sum + duration;
  }, 0) / (sessions.data?.length || 1) / 1000; // Convert to seconds

  const avgMessagesPerSession = sessions.data?.reduce((sum, s) => sum + s.message_count, 0) / (sessions.data?.length || 1);

  // Tool usage rate
  const leadsData = leads.data || [];
  const toolUsageCount = leadsData.filter(l =>
    l.used_quick_estimate || l.used_ai_assessment || l.used_system_surveyor
  ).length;
  const toolUsageRate = leadsData.length > 0 ? (toolUsageCount / leadsData.length) : 0;

  return {
    activeUsers: uniqueUsers,
    totalSessions: sessions.data?.length || 0,
    avgSessionDuration: Math.round(avgSessionDuration),
    avgMessagesPerSession: Math.round(avgMessagesPerSession * 10) / 10,
    toolUsageRate: Math.round(toolUsageRate * 100),
    totalWebEvents: webActivity.data?.length || 0
  };
}

/**
 * Revenue Metrics
 */
async function getRevenueMetrics(startDate: Date) {
  const { data: leads } = await supabase
    .from('leads')
    .select('trial_started, converted_to_customer, mrr, trial_started_at, converted_at')
    .gte('created_at', startDate.toISOString());

  const trialStarts = leads?.filter(l => l.trial_started)?.length || 0;
  const conversions = leads?.filter(l => l.converted_to_customer)?.length || 0;
  const totalMRR = leads?.reduce((sum, l) => sum + (l.mrr || 0), 0) || 0;

  // Calculate conversion rate (trials to customers)
  const conversionRate = trialStarts > 0 ? (conversions / trialStarts) * 100 : 0;

  return {
    mrr: Math.round(totalMRR * 100) / 100,
    trialStarts,
    conversions,
    conversionRate: Math.round(conversionRate * 10) / 10,
    averageRevenuePerCustomer: conversions > 0 ? Math.round((totalMRR / conversions) * 100) / 100 : 0
  };
}

/**
 * AI Performance Metrics
 */
async function getAIPerformance(startDate: Date) {
  const { data: debugLogs } = await supabase
    .from('ai_analysis_debug')
    .select('operation, error_message, execution_time_ms')
    .gte('created_at', startDate.toISOString());

  const { data: sessions } = await supabase
    .from('ai_sessions')
    .select('ai_provider')
    .gte('created_at', startDate.toISOString());

  // Group by operation
  const operationStats: Record<string, { total: number; success: number; avgTime: number }> = {};

  debugLogs?.forEach(log => {
    if (!operationStats[log.operation]) {
      operationStats[log.operation] = { total: 0, success: 0, avgTime: 0 };
    }
    operationStats[log.operation].total++;
    if (!log.error_message) {
      operationStats[log.operation].success++;
    }
  });

  // Calculate average execution times
  Object.keys(operationStats).forEach(op => {
    const logs = debugLogs?.filter(l => l.operation === op) || [];
    const avgTime = logs.reduce((sum, l) => sum + (l.execution_time_ms || 0), 0) / logs.length;
    operationStats[op].avgTime = Math.round(avgTime);
  });

  // Provider breakdown
  const providerBreakdown: Record<string, number> = {};
  sessions?.forEach(s => {
    providerBreakdown[s.ai_provider] = (providerBreakdown[s.ai_provider] || 0) + 1;
  });

  return {
    totalApiCalls: debugLogs?.length || 0,
    operationStats,
    providerBreakdown,
    estimatedCost: calculateEstimatedAICost(debugLogs?.length || 0)
  };
}

/**
 * Lead Pipeline Metrics
 */
async function getLeadPipeline(startDate: Date) {
  const { data: leads } = await supabase
    .from('leads')
    .select('lead_status, lead_grade, lead_score, demo_booked, trial_started, converted_to_customer')
    .gte('created_at', startDate.toISOString());

  // Group by status
  const statusBreakdown: Record<string, number> = {};
  leads?.forEach(l => {
    statusBreakdown[l.lead_status] = (statusBreakdown[l.lead_status] || 0) + 1;
  });

  // Grade distribution
  const gradeBreakdown: Record<string, number> = {};
  leads?.forEach(l => {
    gradeBreakdown[l.lead_grade] = (gradeBreakdown[l.lead_grade] || 0) + 1;
  });

  // Funnel metrics
  const totalLeads = leads?.length || 0;
  const demosBooked = leads?.filter(l => l.demo_booked)?.length || 0;
  const trialsStarted = leads?.filter(l => l.trial_started)?.length || 0;
  const customers = leads?.filter(l => l.converted_to_customer)?.length || 0;

  return {
    totalLeads,
    statusBreakdown,
    gradeBreakdown,
    funnel: {
      leads: totalLeads,
      demosBooked,
      demosBookedRate: totalLeads > 0 ? Math.round((demosBooked / totalLeads) * 1000) / 10 : 0,
      trialsStarted,
      trialsStartedRate: demosBooked > 0 ? Math.round((trialsStarted / demosBooked) * 1000) / 10 : 0,
      customers,
      customersRate: trialsStarted > 0 ? Math.round((customers / trialsStarted) * 1000) / 10 : 0
    }
  };
}

/**
 * Recent Activity Feed
 */
async function getRecentActivity(limit: number) {
  const [
    recentLeads,
    recentDemos,
    recentProjects,
    recentSessions
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('id, email, name, lead_status, created_at')
      .order('created_at', { ascending: false })
      .limit(limit / 4),

    supabase
      .from('demo_bookings')
      .select('id, name, email, event_start_time, created_at')
      .order('created_at', { ascending: false })
      .limit(limit / 4),

    supabase
      .from('spatial_projects')
      .select('id, project_name, analysis_status, created_at')
      .order('created_at', { ascending: false })
      .limit(limit / 4),

    supabase
      .from('ai_sessions')
      .select('id, session_name, ai_provider, created_at')
      .order('created_at', { ascending: false })
      .limit(limit / 4)
  ]);

  // Combine and sort all activities
  const activities = [
    ...(recentLeads.data || []).map(l => ({
      id: l.id,
      type: 'lead',
      title: `New Lead: ${l.name || l.email}`,
      description: `Status: ${l.lead_status}`,
      timestamp: l.created_at
    })),
    ...(recentDemos.data || []).map(d => ({
      id: d.id,
      type: 'demo',
      title: `Demo Booked: ${d.name}`,
      description: `Scheduled: ${new Date(d.event_start_time).toLocaleString()}`,
      timestamp: d.created_at
    })),
    ...(recentProjects.data || []).map(p => ({
      id: p.id,
      type: 'spatial',
      title: `Spatial Studio: ${p.project_name}`,
      description: `Status: ${p.analysis_status}`,
      timestamp: p.created_at
    })),
    ...(recentSessions.data || []).map(s => ({
      id: s.id,
      type: 'ai_session',
      title: `AI Session: ${s.session_name}`,
      description: `Provider: ${s.ai_provider}`,
      timestamp: s.created_at
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
   .slice(0, limit);

  return activities;
}

/**
 * Estimate AI cost (rough calculation)
 */
function calculateEstimatedAICost(apiCalls: number): number {
  // Rough estimate: $0.01 per API call (adjust based on actual usage)
  const costPerCall = 0.01;
  return Math.round(apiCalls * costPerCall * 100) / 100;
}

// Health check
export async function HEAD() {
  return new Response(null, { status: 200 });
}
