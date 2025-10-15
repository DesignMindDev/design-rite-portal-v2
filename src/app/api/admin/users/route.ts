import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Create Supabase admin client with service key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * GET /api/admin/users
 * Fetch all users with their roles and profiles
 * Only accessible to super_admin and admin roles
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No authorization header' },
        { status: 401 }
      );
    }

    // Verify the user's session and role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Check user's role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole) {
      return NextResponse.json(
        { error: 'Unauthorized - No role found' },
        { status: 403 }
      );
    }

    // Only super_admin and admin can access this endpoint
    if (!['super_admin', 'admin'].includes(userRole.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    console.log('[Admin Users API] Fetching all users for:', user.email, '(', userRole.role, ')');

    // Fetch all profiles using service key (bypasses RLS)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, company, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('[Admin Users API] Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: profilesError.message },
        { status: 500 }
      );
    }

    console.log('[Admin Users API] Fetched profiles:', profiles?.length || 0);

    // Fetch all user roles
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('[Admin Users API] Error fetching roles:', rolesError);
      // Continue even if roles fail - we'll use 'user' as default
    }

    console.log('[Admin Users API] Fetched roles:', userRoles?.length || 0);

    // Fetch last login times from activity_logs
    const { data: lastLogins } = await supabaseAdmin
      .from('activity_logs')
      .select('user_id, timestamp')
      .eq('action', 'login')
      .order('timestamp', { ascending: false });

    // Create a map of user_id to last login
    const lastLoginMap = new Map<string, string>();
    lastLogins?.forEach(log => {
      if (!lastLoginMap.has(log.user_id)) {
        lastLoginMap.set(log.user_id, log.timestamp);
      }
    });

    // Combine profiles with their roles
    const users = (profiles || []).map((profile: any) => {
      const role = userRoles?.find(r => r.user_id === profile.id);
      const lastLogin = lastLoginMap.get(profile.id);

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || 'N/A',
        role: role?.role || 'user',
        company: profile.company || 'N/A',
        created_at: profile.created_at,
        last_login: lastLogin || null,
        status: 'active' // TODO: Add actual status tracking
      };
    });

    console.log('[Admin Users API] Processed users:', users.length);

    // Calculate stats
    const employeeRoles = ['super_admin', 'admin', 'manager', 'developer', 'contractor'];
    const employeeCount = users.filter(u => employeeRoles.includes(u.role)).length;
    const activeToday = users.filter(u => {
      if (!u.last_login) return false;
      const lastLogin = new Date(u.last_login);
      const today = new Date();
      return lastLogin.toDateString() === today.toDateString();
    }).length;

    const stats = {
      totalUsers: users.length,
      employees: employeeCount,
      customers: users.length - employeeCount,
      activeToday
    };

    return NextResponse.json({
      success: true,
      users,
      stats
    });

  } catch (error) {
    console.error('[Admin Users API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
