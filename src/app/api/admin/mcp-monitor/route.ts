import { NextRequest, NextResponse } from 'next/server';
import { requireEmployee } from '@/lib/api-auth';

interface MCPHealthResponse {
  status: string;
  message?: string;
  timestamp?: string;
  version?: string;
}

interface MCPStatsResponse {
  total_products?: number;
  manufacturers?: number;
  last_scrape?: string;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    // Require employee access - fixed the response check
    const authResult = await requireEmployee(request);
    if (authResult.error) {
      return authResult.error;
    }

    // Use MCP_HARVESTER_URL from env, fallback to production URL
    const mcpUrl = process.env.MCP_HARVESTER_URL || 'https://lowvolt-mcp-server.onrender.com';

    // Check MCP health
    const startTime = Date.now();
    let mcpStatus: 'online' | 'offline' | 'degraded' | 'error' = 'offline';
    let responseTime = 0;
    let errorMessage: string | null = null;
    let healthData: MCPHealthResponse | null = null;
    let stats: MCPStatsResponse | null = null;
    let version: string | null = null;

    try {
      // Create an AbortController with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const healthResponse = await fetch(`${mcpUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);
      responseTime = Date.now() - startTime;

      if (healthResponse.ok) {
        try {
          healthData = await healthResponse.json() as MCPHealthResponse;
          version = healthData.version || null;

          // Determine status based on response time
          if (responseTime > 5000) {
            mcpStatus = 'degraded';
          } else {
            mcpStatus = 'online';
          }
        } catch (jsonError) {
          // If response is not JSON, still consider it online if status is OK
          mcpStatus = responseTime > 5000 ? 'degraded' : 'online';
        }

        // Try to get stats if available
        try {
          const statsController = new AbortController();
          const statsTimeoutId = setTimeout(() => statsController.abort(), 5000);

          const statsResponse = await fetch(`${mcpUrl}/api/data/stats`, {
            method: 'GET',
            signal: statsController.signal,
            headers: {
              'Accept': 'application/json',
            }
          });

          clearTimeout(statsTimeoutId);

          if (statsResponse.ok) {
            stats = await statsResponse.json() as MCPStatsResponse;
          }
        } catch (statsError) {
          // Stats endpoint is optional, ignore errors
          console.log('[MCP Monitor] Stats endpoint not available:', statsError);
        }
      } else {
        mcpStatus = 'error';
        errorMessage = `HTTP ${healthResponse.status}: ${healthResponse.statusText}`;
      }
    } catch (error: any) {
      mcpStatus = 'offline';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout (10s)';
      } else if (error.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused - Service may be down';
      } else if (error.message?.includes('ETIMEDOUT')) {
        errorMessage = 'Connection timeout - Service not responding';
      } else {
        errorMessage = error.message || 'Connection failed';
      }
      responseTime = Date.now() - startTime;
    }

    // Store health check in memory for uptime calculation
    // In production, you'd want to store this in a database
    const healthCheck = {
      status: mcpStatus,
      timestamp: new Date().toISOString(),
      responseTime
    };

    return NextResponse.json({
      success: true,
      mcp: {
        url: mcpUrl,
        status: mcpStatus,
        responseTime,
        error: errorMessage,
        version,
        healthData,
        stats,
        checkedAt: new Date().toISOString(),
        // Calculate simple uptime based on current status
        uptime: mcpStatus === 'online' || mcpStatus === 'degraded' ? 100 : 0
      }
    });

  } catch (error) {
    console.error('[MCP Monitor API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check MCP health',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}