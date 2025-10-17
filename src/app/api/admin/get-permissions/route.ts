import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireEmployee } from '@/lib/api-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Permission =
  | 'can_manage_team'
  | 'can_manage_blog'
  | 'can_manage_videos'
  | 'can_manage_settings'
  | 'can_create_users'
  | 'can_edit_users'
  | 'can_delete_users'
  | 'can_assign_permissions'
  | 'can_view_activity'
  | 'can_export_data'
  | 'can_view_analytics'
  | 'can_access_admin_panel'
  | 'can_manage_integrations'
  | 'can_view_revenue'
  | 'can_view_quick_stats'
  | 'can_view_user_list'
  | 'can_view_recent_activity';

/**
 * Get User Permissions API
 * Returns permissions based on user role
 */
export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams} = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError || !roleData) {
      console.error('[GetPermissions] Role fetch error:', roleError);
      return NextResponse.json(
        { error: 'Failed to fetch user role' },
        { status: 500 }
      );
    }

    const role = roleData.role;

    // Define permissions based on role
    const permissions: Record<Permission, boolean> = getPermissionsForRole(role);

    console.log('[GetPermissions] Permissions for', userId, '(', role, '):', permissions);

    return NextResponse.json({
      success: true,
      role,
      permissions
    });

  } catch (error) {
    console.error('[GetPermissions] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch permissions', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Get permissions based on role
 */
function getPermissionsForRole(role: string): Record<Permission, boolean> {
  // Super admin gets all permissions
  if (role === 'super_admin') {
    return {
      can_manage_team: true,
      can_manage_blog: true,
      can_manage_videos: true,
      can_manage_settings: true,
      can_create_users: true,
      can_edit_users: true,
      can_delete_users: true,
      can_assign_permissions: true,
      can_view_activity: true,
      can_export_data: true,
      can_view_analytics: true,
      can_access_admin_panel: true,
      can_manage_integrations: true,
      can_view_revenue: true,
      can_view_quick_stats: true,
      can_view_user_list: true,
      can_view_recent_activity: true
    };
  }

  // Admin gets most permissions except deleting users and managing super admins
  if (role === 'admin') {
    return {
      can_manage_team: true,
      can_manage_blog: true,
      can_manage_videos: true,
      can_manage_settings: true,
      can_create_users: true,
      can_edit_users: true,
      can_delete_users: false,
      can_assign_permissions: false,
      can_view_activity: true,
      can_export_data: true,
      can_view_analytics: true,
      can_access_admin_panel: true,
      can_manage_integrations: true,
      can_view_revenue: true,
      can_view_quick_stats: true,
      can_view_user_list: true,
      can_view_recent_activity: true
    };
  }

  // Manager gets view and some management permissions
  if (role === 'manager') {
    return {
      can_manage_team: true,
      can_manage_blog: false,
      can_manage_videos: false,
      can_manage_settings: false,
      can_create_users: false,
      can_edit_users: true,
      can_delete_users: false,
      can_assign_permissions: false,
      can_view_activity: true,
      can_export_data: true,
      can_view_analytics: true,
      can_access_admin_panel: true,
      can_manage_integrations: false,
      can_view_revenue: false,
      can_view_quick_stats: true,
      can_view_user_list: true,
      can_view_recent_activity: true
    };
  }

  // Developer gets technical permissions
  if (role === 'developer') {
    return {
      can_manage_team: false,
      can_manage_blog: false,
      can_manage_videos: false,
      can_manage_settings: true,
      can_create_users: false,
      can_edit_users: false,
      can_delete_users: false,
      can_assign_permissions: false,
      can_view_activity: true,
      can_export_data: true,
      can_view_analytics: true,
      can_access_admin_panel: true,
      can_manage_integrations: true,
      can_view_revenue: false,
      can_view_quick_stats: true,
      can_view_user_list: false,
      can_view_recent_activity: true
    };
  }

  // Contractor gets limited view permissions
  if (role === 'contractor') {
    return {
      can_manage_team: false,
      can_manage_blog: false,
      can_manage_videos: false,
      can_manage_settings: false,
      can_create_users: false,
      can_edit_users: false,
      can_delete_users: false,
      can_assign_permissions: false,
      can_view_activity: false,
      can_export_data: false,
      can_view_analytics: true,
      can_access_admin_panel: true,
      can_manage_integrations: false,
      can_view_revenue: false,
      can_view_quick_stats: true,
      can_view_user_list: false,
      can_view_recent_activity: false
    };
  }

  // Default (user, guest, etc.) - no admin permissions
  return {
    can_manage_team: false,
    can_manage_blog: false,
    can_manage_videos: false,
    can_manage_settings: false,
    can_create_users: false,
    can_edit_users: false,
    can_delete_users: false,
    can_assign_permissions: false,
    can_view_activity: false,
    can_export_data: false,
    can_view_analytics: false,
    can_access_admin_panel: false,
    can_manage_integrations: false,
    can_view_revenue: false,
    can_view_quick_stats: false,
    can_view_user_list: false,
    can_view_recent_activity: false
  };
}
