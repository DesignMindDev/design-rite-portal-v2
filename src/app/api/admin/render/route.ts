import { NextRequest, NextResponse } from 'next/server';
import { requireEmployee } from '@/lib/api-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const RENDER_API_KEY = process.env.RENDER_API_KEY || 'rnd_6o7BYWraBuvow4iZbDpJov4y7gJQ';
const RENDER_API_BASE = 'https://api.render.com/v1';

/**
 * Render.com Integration API
 * Provides service status, deployments, and metrics from Render
 */
export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'services';

  try {
    console.log(`[Render API] Fetching ${action}...`);

    switch (action) {
      case 'services':
        return await getServices();
      case 'deployments':
        return await getDeployments();
      case 'service-details':
        const serviceId = searchParams.get('serviceId');
        if (!serviceId) {
          return NextResponse.json({ error: 'Service ID required' }, { status: 400 });
        }
        return await getServiceDetails(serviceId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Render API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Render data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get all services from Render
 */
async function getServices() {
  try {
    const response = await fetch(`${RENDER_API_BASE}/services`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Render API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform the data for easier consumption
    const services = data.map((service: any) => ({
      id: service.service.id,
      name: service.service.name,
      type: service.service.type, // web, worker, private, cron, etc.
      env: service.service.serviceDetails?.env || 'unknown',
      region: service.service.serviceDetails?.region || 'unknown',
      repo: service.service.serviceDetails?.autoDeploy?.repo || null,
      branch: service.service.serviceDetails?.autoDeploy?.branch || null,
      suspended: service.service.suspended,
      updatedAt: service.service.updatedAt,
      createdAt: service.service.createdAt,
      url: service.service.serviceDetails?.url || null
    }));

    return NextResponse.json({
      success: true,
      services,
      count: services.length
    });
  } catch (error) {
    console.error('[Render API] Get services error:', error);
    throw error;
  }
}

/**
 * Get recent deployments
 */
async function getDeployments() {
  try {
    // First get all services
    const servicesResponse = await fetch(`${RENDER_API_BASE}/services`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!servicesResponse.ok) {
      throw new Error(`Render API error: ${servicesResponse.status}`);
    }

    const services = await servicesResponse.json();

    // Get deployments for each service
    const deploymentPromises = services.slice(0, 5).map(async (service: any) => {
      try {
        const deployResponse = await fetch(
          `${RENDER_API_BASE}/services/${service.service.id}/deploys?limit=1`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${RENDER_API_KEY}`,
              'Accept': 'application/json'
            }
          }
        );

        if (!deployResponse.ok) return null;

        const deploys = await deployResponse.json();
        if (!deploys || deploys.length === 0) return null;

        const latestDeploy = deploys[0].deploy;

        return {
          serviceId: service.service.id,
          serviceName: service.service.name,
          deployId: latestDeploy.id,
          status: latestDeploy.status,
          commit: {
            id: latestDeploy.commit?.id,
            message: latestDeploy.commit?.message,
            createdAt: latestDeploy.commit?.createdAt
          },
          createdAt: latestDeploy.createdAt,
          updatedAt: latestDeploy.updatedAt,
          finishedAt: latestDeploy.finishedAt
        };
      } catch (error) {
        console.error(`[Render API] Deploy fetch error for ${service.service.name}:`, error);
        return null;
      }
    });

    const deployments = (await Promise.all(deploymentPromises)).filter(d => d !== null);

    return NextResponse.json({
      success: true,
      deployments,
      count: deployments.length
    });
  } catch (error) {
    console.error('[Render API] Get deployments error:', error);
    throw error;
  }
}

/**
 * Get detailed information about a specific service
 */
async function getServiceDetails(serviceId: string) {
  try {
    const [serviceResponse, deploysResponse] = await Promise.all([
      fetch(`${RENDER_API_BASE}/services/${serviceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${RENDER_API_KEY}`,
          'Accept': 'application/json'
        }
      }),
      fetch(`${RENDER_API_BASE}/services/${serviceId}/deploys?limit=5`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${RENDER_API_KEY}`,
          'Accept': 'application/json'
        }
      })
    ]);

    if (!serviceResponse.ok || !deploysResponse.ok) {
      throw new Error('Failed to fetch service details');
    }

    const service = await serviceResponse.json();
    const deploys = await deploysResponse.json();

    return NextResponse.json({
      success: true,
      service: {
        id: service.service.id,
        name: service.service.name,
        type: service.service.type,
        env: service.service.serviceDetails?.env,
        region: service.service.serviceDetails?.region,
        url: service.service.serviceDetails?.url,
        repo: service.service.serviceDetails?.autoDeploy?.repo,
        branch: service.service.serviceDetails?.autoDeploy?.branch,
        suspended: service.service.suspended,
        createdAt: service.service.createdAt,
        updatedAt: service.service.updatedAt
      },
      recentDeploys: deploys.map((d: any) => ({
        id: d.deploy.id,
        status: d.deploy.status,
        commit: d.deploy.commit,
        createdAt: d.deploy.createdAt,
        finishedAt: d.deploy.finishedAt
      }))
    });
  } catch (error) {
    console.error('[Render API] Get service details error:', error);
    throw error;
  }
}

/**
 * Trigger a manual deployment
 */
export async function POST(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { serviceId, clearCache } = body;

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID required' }, { status: 400 });
    }

    console.log(`[Render API] Triggering deployment for ${serviceId}...`);

    const response = await fetch(`${RENDER_API_BASE}/services/${serviceId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clearCache: clearCache === 'clear' ? 'clear' : 'do_not_clear'
      })
    });

    if (!response.ok) {
      throw new Error(`Render API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      deploy: {
        id: data.deploy.id,
        status: data.deploy.status,
        createdAt: data.deploy.createdAt
      }
    });
  } catch (error) {
    console.error('[Render API] Deploy trigger error:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger deployment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
