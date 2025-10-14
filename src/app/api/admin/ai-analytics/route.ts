import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * AI Sessions Analytics API
 * Deep dive into AI assistant usage, provider performance, and user engagement
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    const startDate = calculateStartDate(timeRange);

    // Run all queries in parallel
    const [
      sessionMetrics,
      providerPerformance,
      userEngagement,
      assessmentMetrics,
      timeSeriesData,
      topUsers,
      conversationMetrics
    ] = await Promise.all([
      getSessionMetrics(startDate),
      getProviderPerformance(startDate),
      getUserEngagement(startDate),
      getAssessmentMetrics(startDate),
      getTimeSeriesData(startDate, timeRange),
      getTopUsers(startDate),
      getConversationMetrics(startDate)
    ]);

    return NextResponse.json({
      success: true,
      timeRange,
      generatedAt: new Date().toISOString(),
      sessionMetrics,
      providerPerformance,
      userEngagement,
      assessmentMetrics,
      timeSeriesData,
      topUsers,
      conversationMetrics
    });

  } catch (error) {
    console.error('AI Analytics error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch AI analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Session Metrics
 */
async function getSessionMetrics(startDate: Date) {
  const { data: sessions } = await supabase
    .from('ai_sessions')
    .select('id, message_count, created_at, last_activity, ai_provider')
    .gte('created_at', startDate.toISOString());

  const totalSessions = sessions?.length || 0;
  const totalMessages = sessions?.reduce((sum, s) => sum + s.message_count, 0) || 0;
  const avgMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0;

  // Calculate average session duration
  const durations = sessions?.map(s => {
    const start = new Date(s.created_at).getTime();
    const end = new Date(s.last_activity).getTime();
    return (end - start) / 1000; // Convert to seconds
  }) || [];

  const avgDuration = durations.length > 0
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length
    : 0;

  // Session completion rate (sessions with > 3 messages considered "completed")
  const completedSessions = sessions?.filter(s => s.message_count >= 3)?.length || 0;
  const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  return {
    totalSessions,
    totalMessages,
    avgMessagesPerSession: Math.round(avgMessagesPerSession * 10) / 10,
    avgDurationSeconds: Math.round(avgDuration),
    completionRate: Math.round(completionRate * 10) / 10,
    completedSessions
  };
}

/**
 * Provider Performance Analysis
 */
async function getProviderPerformance(startDate: Date) {
  const { data: sessions } = await supabase
    .from('ai_sessions')
    .select('ai_provider, message_count, created_at, last_activity')
    .gte('created_at', startDate.toISOString());

  const { data: conversations } = await supabase
    .from('ai_conversations')
    .select('ai_provider, user_message, ai_response, timestamp')
    .gte('timestamp', startDate.toISOString());

  // Group by provider
  const providerStats: Record<string, {
    sessions: number;
    messages: number;
    avgMessagesPerSession: number;
    avgResponseLength: number;
    avgDuration: number;
  }> = {};

  sessions?.forEach(session => {
    const provider = session.ai_provider;
    if (!providerStats[provider]) {
      providerStats[provider] = {
        sessions: 0,
        messages: 0,
        avgMessagesPerSession: 0,
        avgResponseLength: 0,
        avgDuration: 0
      };
    }

    providerStats[provider].sessions++;
    providerStats[provider].messages += session.message_count;

    const duration = (new Date(session.last_activity).getTime() - new Date(session.created_at).getTime()) / 1000;
    providerStats[provider].avgDuration += duration;
  });

  // Calculate averages and response lengths
  conversations?.forEach(conv => {
    const provider = conv.ai_provider;
    if (providerStats[provider]) {
      providerStats[provider].avgResponseLength += conv.ai_response.length;
    }
  });

  // Finalize calculations
  Object.keys(providerStats).forEach(provider => {
    const stats = providerStats[provider];
    stats.avgMessagesPerSession = stats.sessions > 0 ? stats.messages / stats.sessions : 0;
    stats.avgDuration = stats.sessions > 0 ? stats.avgDuration / stats.sessions : 0;

    const providerConvs = conversations?.filter(c => c.ai_provider === provider) || [];
    stats.avgResponseLength = providerConvs.length > 0
      ? providerConvs.reduce((sum, c) => sum + c.ai_response.length, 0) / providerConvs.length
      : 0;

    // Round values
    stats.avgMessagesPerSession = Math.round(stats.avgMessagesPerSession * 10) / 10;
    stats.avgDuration = Math.round(stats.avgDuration);
    stats.avgResponseLength = Math.round(stats.avgResponseLength);
  });

  return providerStats;
}

/**
 * User Engagement Metrics
 */
async function getUserEngagement(startDate: Date) {
  const { data: sessions } = await supabase
    .from('ai_sessions')
    .select('user_hash, created_at')
    .gte('created_at', startDate.toISOString());

  const uniqueUsers = new Set(sessions?.map(s => s.user_hash) || []).size;

  // Calculate returning users (users with > 1 session)
  const userSessionCounts: Record<string, number> = {};
  sessions?.forEach(s => {
    userSessionCounts[s.user_hash] = (userSessionCounts[s.user_hash] || 0) + 1;
  });

  const returningUsers = Object.values(userSessionCounts).filter(count => count > 1).length;
  const returningUserRate = uniqueUsers > 0 ? (returningUsers / uniqueUsers) * 100 : 0;

  // Calculate average sessions per user
  const avgSessionsPerUser = uniqueUsers > 0 ? (sessions?.length || 0) / uniqueUsers : 0;

  return {
    uniqueUsers,
    returningUsers,
    returningUserRate: Math.round(returningUserRate * 10) / 10,
    avgSessionsPerUser: Math.round(avgSessionsPerUser * 10) / 10,
    newUsers: uniqueUsers - returningUsers
  };
}

/**
 * Assessment-specific Metrics
 */
async function getAssessmentMetrics(startDate: Date) {
  const { data: sessions } = await supabase
    .from('ai_sessions')
    .select('assessment_data, message_count')
    .gte('created_at', startDate.toISOString())
    .not('assessment_data', 'is', null);

  const totalAssessments = sessions?.length || 0;

  // Parse assessment data to find completion rates
  const completedAssessments = sessions?.filter(s => {
    const data = s.assessment_data as any;
    return data && (data.completed === true || s.message_count >= 5);
  })?.length || 0;

  const completionRate = totalAssessments > 0 ? (completedAssessments / totalAssessments) * 100 : 0;

  // Extract common assessment types/scenarios
  const scenarioCounts: Record<string, number> = {};
  sessions?.forEach(s => {
    const data = s.assessment_data as any;
    if (data && data.scenario) {
      scenarioCounts[data.scenario] = (scenarioCounts[data.scenario] || 0) + 1;
    }
  });

  return {
    totalAssessments,
    completedAssessments,
    completionRate: Math.round(completionRate * 10) / 10,
    abandonedAssessments: totalAssessments - completedAssessments,
    scenarioBreakdown: scenarioCounts
  };
}

/**
 * Time Series Data for Charts
 */
async function getTimeSeriesData(startDate: Date, timeRange: string) {
  const { data: sessions } = await supabase
    .from('ai_sessions')
    .select('created_at, ai_provider')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  const { data: conversations } = await supabase
    .from('ai_conversations')
    .select('timestamp')
    .gte('timestamp', startDate.toISOString())
    .order('timestamp', { ascending: true });

  // Group by date
  const dailyStats: Record<string, { sessions: number; messages: number; date: string }> = {};

  sessions?.forEach(session => {
    const date = new Date(session.created_at).toISOString().split('T')[0];
    if (!dailyStats[date]) {
      dailyStats[date] = { date, sessions: 0, messages: 0 };
    }
    dailyStats[date].sessions++;
  });

  conversations?.forEach(conv => {
    const date = new Date(conv.timestamp).toISOString().split('T')[0];
    if (dailyStats[date]) {
      dailyStats[date].messages++;
    }
  });

  return Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Top Users by Activity
 */
async function getTopUsers(startDate: Date, limit: number = 10) {
  const { data: sessions } = await supabase
    .from('ai_sessions')
    .select('user_hash, message_count, created_at')
    .gte('created_at', startDate.toISOString());

  const userStats: Record<string, { userHash: string; sessions: number; totalMessages: number; lastActive: string }> = {};

  sessions?.forEach(session => {
    if (!userStats[session.user_hash]) {
      userStats[session.user_hash] = {
        userHash: session.user_hash,
        sessions: 0,
        totalMessages: 0,
        lastActive: session.created_at
      };
    }

    userStats[session.user_hash].sessions++;
    userStats[session.user_hash].totalMessages += session.message_count;

    if (new Date(session.created_at) > new Date(userStats[session.user_hash].lastActive)) {
      userStats[session.user_hash].lastActive = session.created_at;
    }
  });

  return Object.values(userStats)
    .sort((a, b) => b.totalMessages - a.totalMessages)
    .slice(0, limit);
}

/**
 * Conversation Quality Metrics
 */
async function getConversationMetrics(startDate: Date) {
  const { data: conversations } = await supabase
    .from('ai_conversations')
    .select('user_message, ai_response, timestamp')
    .gte('timestamp', startDate.toISOString());

  const totalConversations = conversations?.length || 0;

  const avgUserMessageLength = conversations?.reduce((sum, c) => sum + c.user_message.length, 0) / (totalConversations || 1);
  const avgAiResponseLength = conversations?.reduce((sum, c) => sum + c.ai_response.length, 0) / (totalConversations || 1);

  // Detect question patterns
  const questionsAsked = conversations?.filter(c =>
    c.user_message.includes('?') ||
    c.user_message.toLowerCase().startsWith('what') ||
    c.user_message.toLowerCase().startsWith('how') ||
    c.user_message.toLowerCase().startsWith('why')
  )?.length || 0;

  const questionRate = totalConversations > 0 ? (questionsAsked / totalConversations) * 100 : 0;

  return {
    totalConversations,
    avgUserMessageLength: Math.round(avgUserMessageLength),
    avgAiResponseLength: Math.round(avgAiResponseLength),
    questionsAsked,
    questionRate: Math.round(questionRate * 10) / 10
  };
}

/**
 * Helper: Calculate start date based on time range
 */
function calculateStartDate(timeRange: string): Date {
  const now = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case '24h':
      startDate.setHours(startDate.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  return startDate;
}
