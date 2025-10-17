import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireEmployee } from '@/lib/api-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Platform Admin Dashboard API
 * Returns stats, users, and recent activity for the /admin/super page
 */
export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Calculate date ranges
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Run queries in parallel for performance
    const [
      totalUsersResult,
      activeUsersResult,
      quotesTodayResult,
      aiSessionsTodayResult,
      usersListResult,
      activityLogsResult
    ] = await Promise.all([
      // Total users count
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),

      // Active users in last 24h (users with activity_logs in last 24h)
      supabase
        .from('activity_logs')
        .select('user_id', { count: 'exact', head: true })
        .gte('timestamp', last24h.toISOString()),

      // Quotes today (from leads or quotes table - adjust based on your schema)
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),

      // AI sessions today
      supabase
        .from('ai_sessions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),

      // All users with their profiles and roles (using JOIN for performance)
      supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          company,
          created_at,
          user_roles!inner(role)
        `)
        .order('created_at', { ascending: false })
        .limit(100),

      // Recent activity logs
      supabase
        .from('activity_logs')
        .select(`
          id,
          user_id,
          action,
          resource_type,
          timestamp,
          success,
          ip_address,
          profiles!inner(
            full_name,
            email
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(50)
    ]);

    // Process users data - roles are already joined, fetch activity separately
    // Group activity logs by user_id for efficient lookup
    const activityByUser = new Map<string, any[]>();
    activityLogsResult.data?.forEach((log: any) => {
      if (!activityByUser.has(log.user_id)) {
        activityByUser.set(log.user_id, []);
      }
      activityByUser.get(log.user_id)!.push(log);
    });

    const users = (usersListResult.data || []).map((user: any) => {
      // Role is already joined
      const role = user.user_roles?.role || 'user';

      // Get activity logs for this user from our grouped data
      const userLogs = activityByUser.get(user.id) || [];

      // Get last login from activity logs
      const loginLogs = userLogs.filter((log: any) =>
        log.action === 'user_login' || log.action === 'login'
      );

      const lastLogin = loginLogs.length > 0
        ? loginLogs[0].timestamp
        : null;

      const loginCount = loginLogs.length;

      // Determine status - assume active if they've logged in recently
      const status = lastLogin && new Date(lastLogin) > last24h
        ? 'active'
        : 'pending';

      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name || 'N/A',
        role,
        company: user.company || 'N/A',
        status,
        last_login: lastLogin,
        login_count: loginCount,
        created_at: user.created_at
      };
    });

    // Process activity logs
    const recentActivity = (activityLogsResult.data || []).map((log: any) => ({
      id: log.id,
      action: log.action,
      resource_type: log.resource_type || null,
      timestamp: log.timestamp,
      success: log.success !== false, // Default to true if not specified
      user_name: log.profiles?.full_name || 'Unknown User',
      user_email: log.profiles?.email || 'unknown@example.com',
      ip_address: log.ip_address || null
    }));

    // Build response
    const stats = {
      totalUsers: totalUsersResult.count || 0,
      activeNow: activeUsersResult.count || 0,
      quotesToday: quotesTodayResult.count || 0,
      aiSessionsToday: aiSessionsTodayResult.count || 0
    };

    console.log('[DashboardAPI] Stats:', stats);
    console.log('[DashboardAPI] Users count:', users.length);
    console.log('[DashboardAPI] Activity logs count:', recentActivity.length);

    return NextResponse.json({
      success: true,
      stats,
      users,
      recentActivity
    });

  } catch (error) {
    console.error('[DashboardAPI] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: errorMessage },
      { status: 500 }
    );
  }
}
