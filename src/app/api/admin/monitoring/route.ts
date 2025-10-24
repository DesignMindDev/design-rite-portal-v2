import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireEmployee } from '@/lib/api-auth';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Production Monitoring API
 * Returns service health, database metrics, and error logs
 */
export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    console.log('[Monitoring] Fetching production monitoring data...');

    // Run all health checks in parallel
    const [
      services,
      databaseMetrics,
      errors,
      alerts
    ] = await Promise.all([
      checkServiceHealth(),
      getDatabaseMetrics(),
      getRecentErrors(),
      getAlertStats()
    ]);

    const response = {
      success: true,
      generatedAt: new Date().toISOString(),
      services,
      database: databaseMetrics,
      errors,
      alerts
    };

    console.log('[Monitoring] Successfully fetched monitoring data');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[Monitoring] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch monitoring data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Check health status of all services
 */
async function checkServiceHealth() {
  const services = [
    {
      name: 'Main Platform (V4)',
      url: process.env.NEXT_PUBLIC_MAIN_PLATFORM_URL || 'http://localhost:3000',
      healthEndpoint: '/api/health'
    },
    {
      name: 'Portal (V2)',
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
      healthEndpoint: '/api/health'
    },
    {
      name: 'MCP Harvester',
      url: 'http://localhost:8000',
      healthEndpoint: '/health'
    },
    {
      name: 'Supabase',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      healthEndpoint: '/rest/v1/'
    }
  ];

  const results = await Promise.all(
    services.map(async (service) => {
      try {
        const startTime = Date.now();
        const response = await fetch(`${service.url}${service.healthEndpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        const responseTime = Date.now() - startTime;

        // Determine status based on response
        let status: 'healthy' | 'degraded' | 'down';
        if (response.ok) {
          if (responseTime < 1000) {
            status = 'healthy';
          } else {
            status = 'degraded';
          }
        } else {
          status = 'down';
        }

        // Calculate uptime (mocked for now - would come from real monitoring service)
        const uptime = status === 'healthy' ? 99.9 : status === 'degraded' ? 97.5 : 85.0;

        return {
          name: service.name,
          status,
          responseTime,
          uptime,
          lastChecked: new Date().toISOString(),
          url: service.url
        };
      } catch (error) {
        console.error(`[Monitoring] Health check failed for ${service.name}:`, error);
        return {
          name: service.name,
          status: 'down' as const,
          responseTime: 0,
          uptime: 0,
          lastChecked: new Date().toISOString(),
          url: service.url
        };
      }
    })
  );

  return results;
}

/**
 * Get database performance metrics
 */
async function getDatabaseMetrics() {
  try {
    // Query Supabase for database stats
    // Note: Some of these queries might need Supabase admin API or pg_stat_database access

    // Get active sessions (approximate with recent activity)
    const { count: activeConnections } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes

    // Get slow queries from debug logs
    const { data: slowQueries } = await supabase
      .from('ai_analysis_debug')
      .select('execution_time_ms')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .gte('execution_time_ms', 3000); // Queries taking more than 3 seconds

    // Calculate average query time
    const { data: recentQueries } = await supabase
      .from('ai_analysis_debug')
      .select('execution_time_ms')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .limit(1000);

    const avgQueryTime = recentQueries && recentQueries.length > 0
      ? Math.round(recentQueries.reduce((sum, q) => sum + (q.execution_time_ms || 0), 0) / recentQueries.length)
      : 0;

    return {
      connections: 50, // Mock value - would need Supabase admin API
      activeConnections: activeConnections || 0,
      slowQueries: slowQueries?.length || 0,
      avgQueryTime
    };
  } catch (error) {
    console.error('[Monitoring] Database metrics error:', error);
    return {
      connections: 0,
      activeConnections: 0,
      slowQueries: 0,
      avgQueryTime: 0
    };
  }
}

/**
 * Get recent error logs
 */
async function getRecentErrors() {
  try {
    // Query ai_analysis_debug for errors
    const { data: aiErrors } = await supabase
      .from('ai_analysis_debug')
      .select('*')
      .not('error_message', 'is', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    // Query spatial_projects for failed analyses
    const { data: spatialErrors } = await supabase
      .from('spatial_projects')
      .select('*')
      .eq('analysis_status', 'failed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // Format errors
    const errors = [
      ...(aiErrors || []).map(err => ({
        id: err.id,
        severity: determineSeverity(err.error_message),
        message: err.error_message || 'Unknown AI error',
        service: 'AI Analysis',
        timestamp: err.created_at,
        count: 1
      })),
      ...(spatialErrors || []).map(err => ({
        id: err.id,
        severity: 'medium' as const,
        message: `Spatial Studio analysis failed: ${err.project_name}`,
        service: 'Spatial Studio',
        timestamp: err.created_at,
        count: 1
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 15);

    return errors;
  } catch (error) {
    console.error('[Monitoring] Error logs fetch error:', error);
    return [];
  }
}

/**
 * Get alert statistics
 */
async function getAlertStats() {
  try {
    // Count recent errors as "unread alerts"
    const { count: totalErrors } = await supabase
      .from('ai_analysis_debug')
      .select('*', { count: 'exact', head: true })
      .not('error_message', 'is', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { count: criticalErrors } = await supabase
      .from('ai_analysis_debug')
      .select('*', { count: 'exact', head: true })
      .not('error_message', 'is', null)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

    return {
      unread: criticalErrors || 0,
      total: totalErrors || 0
    };
  } catch (error) {
    console.error('[Monitoring] Alert stats error:', error);
    return {
      unread: 0,
      total: 0
    };
  }
}

/**
 * Determine error severity based on error message
 */
function determineSeverity(errorMessage: string | null): 'low' | 'medium' | 'high' | 'critical' {
  if (!errorMessage) return 'low';

  const errorLower = errorMessage.toLowerCase();

  // Critical errors
  if (
    errorLower.includes('database') ||
    errorLower.includes('connection') ||
    errorLower.includes('timeout') ||
    errorLower.includes('crash') ||
    errorLower.includes('fatal')
  ) {
    return 'critical';
  }

  // High severity
  if (
    errorLower.includes('failed') ||
    errorLower.includes('error') ||
    errorLower.includes('exception') ||
    errorLower.includes('rejected')
  ) {
    return 'high';
  }

  // Medium severity
  if (
    errorLower.includes('warning') ||
    errorLower.includes('deprecated') ||
    errorLower.includes('slow')
  ) {
    return 'medium';
  }

  return 'low';
}

// Health check endpoint
export async function HEAD() {
  return new Response(null, { status: 200 });
}
