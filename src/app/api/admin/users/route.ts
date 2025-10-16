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

    // Fetch all users from auth.users using admin API (bypasses RLS completely)
    const { data: authUsersData, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();

    if (authUsersError) {
      console.error('[Admin Users API] Error fetching auth users:', authUsersError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: authUsersError.message },
        { status: 500 }
      );
    }

    const authUsers = authUsersData?.users || [];
    console.log('[Admin Users API] Fetched auth users:', authUsers.length);

    // Also fetch profiles table to get additional info (full_name, company)
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, company');

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

    // Combine auth users with profiles and roles
    const users = authUsers.map((authUser: any) => {
      const profile = profiles?.find(p => p.id === authUser.id);
      const role = userRoles?.find(r => r.user_id === authUser.id);
      const lastLogin = lastLoginMap.get(authUser.id);

      return {
        id: authUser.id,
        email: authUser.email,
        full_name: profile?.full_name || authUser.user_metadata?.full_name || 'N/A',
        role: role?.role || 'user',
        company: profile?.company || authUser.user_metadata?.company || 'N/A',
        created_at: authUser.created_at,
        last_login: lastLogin || authUser.last_sign_in_at || null,
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
