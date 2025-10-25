import { NextRequest, NextResponse } from 'next/server';
import { requireEmployee } from '@/lib/api-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Require RENDER_API_KEY from environment variable
const RENDER_API_KEY = process.env.RENDER_API_KEY;

// Service IDs mapping for the Design-Rite ecosystem
const SERVICES = [
  { id: 'srv-d3hvbnjuibrs73b8hvs0', name: 'Design-Rite V4 Main', displayName: 'V4 Main Platform', plan: 'Standard' },
  { id: 'srv-d3i1gmruibrs73b8i0lg', name: 'design-rite-portal-v2', displayName: 'Portal V2', plan: 'Starter' },
  { id: 'srv-d3hvqgjuibrs73b8i070', name: 'design-rite-v4-staging', displayName: 'V4 Staging', plan: 'Starter' },
  { id: 'srv-d3i1h8juibrs73b8i0ng', name: 'lowvolt-mcp-server', displayName: 'MCP Harvester', plan: 'Free' },
  { id: 'srv-d3i1hsjuibrs73b8i0og', name: 'design-rite-spatial-studio', displayName: 'Spatial Studio', plan: 'Free' },
  { id: 'srv-d3i1i8juibrs73b8i0pg', name: 'design-rite-backend', displayName: 'Backend', plan: 'Free' },
  { id: 'srv-d3i1iojuibrs73b8i0qg', name: 'design-rite-super-agent', displayName: 'Super Agent', plan: 'Free' },
  { id: 'srv-d3i1j8juibrs73b8i0rg', name: 'design-rite-creative-studio', displayName: 'Creative Studio', plan: 'Free' },
  { id: 'srv-d3i1jojuibrs73b8i0sg', name: 'design-rite-testing-service', displayName: 'Testing Service', plan: 'Free' },
  { id: 'srv-d3i1k8juibrs73b8i0tg', name: 'design-rite-intelligence-platform', displayName: 'Legacy Intelligence', plan: 'Suspended' }
];

interface RenderService {
  id: string;
  name: string;
  type: string;
  region: string;
  serviceDetails?: {
    url?: string;
    autoDeploy: string;
    branch: string;
    buildCommand?: string;
    startCommand?: string;
    pullRequestPreviewsEnabled: string;
    notifyOnFail: string;
    numInstances: number;
    healthCheckPath?: string;
  };
  suspended: string;
  suspendedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceHealth {
  id: string;
  name: string;
  displayName: string;
  status: 'online' | 'offline' | 'degraded' | 'suspended' | 'unknown';
  url?: string;
  plan: string;
  lastDeploy?: string;
  responseTime?: number;
  lastChecked: string;
  region?: string;
  autoDeploy?: boolean;
  branch?: string;
  error?: string;
}

/**
 * Validates RENDER_API_KEY is set
 */
function validateRenderApiKey() {
  if (!RENDER_API_KEY) {
    throw new Error('RENDER_API_KEY environment variable is required');
  }
}

/**
 * Check if a service URL is accessible
 */
async function checkServiceHealth(url: string): Promise<{ status: 'online' | 'offline' | 'degraded'; responseTime?: number }> {
  if (!url) {
    return { status: 'unknown' as any };
  }

  const startTime = Date.now();
  const timeout = 10000; // 10 second timeout

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Design-Rite-Health-Check/1.0'
      }
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok || response.status === 401 || response.status === 403) {
      // Service is responding (even auth errors mean it's online)
      return {
        status: responseTime > 5000 ? 'degraded' : 'online',
        responseTime
      };
    } else {
      return { status: 'degraded', responseTime };
    }
  } catch (error) {
    console.error(`Health check failed for ${url}:`, error);
    return { status: 'offline' };
  }
}

/**
 * Fetch service details from Render API
 */
async function fetchServiceDetails(serviceId: string): Promise<RenderService | null> {
  try {
    const response = await fetch(`https://api.render.com/v1/services/${serviceId}`, {
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Service not found: ${serviceId}`);
        return null;
      }
      throw new Error(`Render API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch service ${serviceId}:`, error);
    return null;
  }
}

/**
 * Platform Admin Services Health API
 * Returns health status for all Render services
 */
export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    validateRenderApiKey();

    // Fetch all service details in parallel
    const serviceDetailsPromises = SERVICES.map(service =>
      fetchServiceDetails(service.id).then(details => ({
        ...service,
        details
      }))
    );

    const servicesWithDetails = await Promise.all(serviceDetailsPromises);

    // Process each service and check health
    const healthChecks = servicesWithDetails.map(async (service) => {
      const { id, name, displayName, plan, details } = service;

      if (!details) {
        return {
          id,
          name,
          displayName,
          status: 'unknown' as const,
          plan,
          lastChecked: new Date().toISOString(),
          error: 'Service not found in Render'
        };
      }

      // Determine base status
      let status: ServiceHealth['status'] = 'unknown';
      let responseTime: number | undefined;

      if (details.suspended === 'suspended') {
        status = 'suspended';
      } else if (details.serviceDetails?.url) {
        // Check if service is actually accessible
        const healthCheck = await checkServiceHealth(details.serviceDetails.url);
        status = healthCheck.status;
        responseTime = healthCheck.responseTime;
      } else {
        // Service without URL (background workers)
        status = details.suspended === 'not_suspended' ? 'online' : 'offline';
      }

      // Get last deployment info
      let lastDeploy: string | undefined;
      try {
        const deploysResponse = await fetch(
          `https://api.render.com/v1/services/${id}/deploys?limit=1`,
          {
            headers: {
              'Authorization': `Bearer ${RENDER_API_KEY}`,
              'Accept': 'application/json'
            }
          }
        );

        if (deploysResponse.ok) {
          const deploysData = await deploysResponse.json();
          if (deploysData.length > 0) {
            lastDeploy = deploysData[0].finishedAt || deploysData[0].createdAt;
          }
        }
      } catch (error) {
        console.error(`Failed to fetch deploys for ${id}:`, error);
      }

      return {
        id,
        name,
        displayName,
        status,
        url: details.serviceDetails?.url,
        plan,
        lastDeploy,
        responseTime,
        lastChecked: new Date().toISOString(),
        region: details.region,
        autoDeploy: details.serviceDetails?.autoDeploy === 'yes',
        branch: details.serviceDetails?.branch
      } as ServiceHealth;
    });

    const services = await Promise.all(healthChecks);

    console.log('[ServicesAPI] Health check complete:', {
      total: services.length,
      online: services.filter(s => s.status === 'online').length,
      offline: services.filter(s => s.status === 'offline').length,
      degraded: services.filter(s => s.status === 'degraded').length,
      suspended: services.filter(s => s.status === 'suspended').length,
      unknown: services.filter(s => s.status === 'unknown').length
    });

    return NextResponse.json({
      success: true,
      services,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ServicesAPI] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch services health', details: errorMessage },
      { status: 500 }
    );
  }
}