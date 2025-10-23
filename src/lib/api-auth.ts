/**
 * API Route Authentication Helper
 * Provides Supabase auth checking for API routes
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create Supabase client for server-side API routes
 */
function createServerClient(request?: NextRequest) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'design-rite-portal-v2-api',
      },
    },
  });
}

/**
 * Extract session token from Authorization header or cookies
 */
function getSessionToken(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie
  const cookieName = 'design-rite-portal-auth';
  const cookies = request.headers.get('cookie');
  if (cookies) {
    const match = cookies.match(new RegExp(`${cookieName}=([^;]+)`));
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Require authentication for an API route
 * Returns the session if authenticated, or an error response if not
 */
export async function requireAuth(request: NextRequest) {
  const supabase = createServerClient(request);
  const token = getSessionToken(request);

  if (!token) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      ),
      session: null,
      user: null,
    };
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired session' },
        { status: 401 }
      ),
      session: null,
      user: null,
    };
  }

  return {
    error: null,
    session: { access_token: token },
    user,
  };
}

/**
 * Require specific role for an API route
 * Returns the session if authenticated with correct role, or an error response if not
 */
export async function requireRole(allowedRoles: string[], request: NextRequest) {
  const authResult = await requireAuth(request);

  if (authResult.error) {
    return authResult;
  }

  // Create Supabase client WITH the user's auth token for RLS
  const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'design-rite-portal-v2-api',
        'Authorization': `Bearer ${authResult.session!.access_token}`,
      },
    },
  });

  const { data: roleData, error: roleError } = await supabaseWithAuth
    .from('user_roles')
    .select('role')
    .eq('user_id', authResult.user!.id)
    .single();

  const userRole = roleData?.role || 'guest';

  console.log('[Portal API Auth] Role check:', {
    userId: authResult.user!.id,
    userEmail: authResult.user!.email,
    roleData,
    roleError,
    userRole,
    allowedRoles,
    isAllowed: allowedRoles.includes(userRole)
  });

  if (!allowedRoles.includes(userRole)) {
    console.log('[Portal API Auth] Access denied - User role:', userRole, 'Required:', allowedRoles);
    return {
      error: NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      ),
      session: authResult.session,
      user: authResult.user,
    };
  }

  return {
    ...authResult,
    role: userRole,
  };
}

/**
 * Require admin or employee role
 * Employees include: super_admin, admin, manager, developer, contractor
 */
export async function requireEmployee(request: NextRequest) {
  return requireRole(
    ['super_admin', 'admin', 'manager', 'developer', 'contractor'],
    request
  );
}

/**
 * Require admin role (super_admin or admin only)
 */
export async function requireAdmin(request: NextRequest) {
  return requireRole(['super_admin', 'admin'], request);
}

/**
 * Get optional auth (don't fail if not authenticated)
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
export async function getOptionalAuth(request: NextRequest) {
  const supabase = createServerClient(request);
  const token = getSessionToken(request);

  if (!token) {
    return {
      session: null,
      user: null,
    };
  }

  const { data: { user } } = await supabase.auth.getUser(token);

  return {
    session: user ? { access_token: token } : null,
    user: user || null,
  };
}
