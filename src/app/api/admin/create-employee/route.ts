import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimiters } from '@/lib/rate-limit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create Employee/User API Route
 * Allows ONLY super_admins to create new users with any role
 *
 * Security: Verifies requester is super_admin before allowing user creation
 * Audit: Logs all user creation attempts with full context
 */
export async function POST(request: NextRequest) {
  // Apply strict rate limiting for user creation - 5 requests per hour
  const rateLimitResponse = await rateLimiters.adminStrict(request);
  if (rateLimitResponse) return rateLimitResponse;

  // Track audit log data
  let adminId: string | null = null;
  let targetEmail: string | null = null;

  try {
    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // SECURITY: Verify the requester is authenticated and is a super_admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('[CreateEmployee] No authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - No authentication token provided' },
        { status: 401 }
      );
    }

    // Extract the token and get the requesting user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !requestingUser) {
      console.error('[CreateEmployee] Invalid token:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check if the requesting user is a super_admin
    const { data: requesterRole, error: requesterRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .single();

    if (requesterRoleError || requesterRole?.role !== 'super_admin') {
      console.error('[CreateEmployee] Insufficient permissions:', {
        userId: requestingUser.id,
        role: requesterRole?.role,
        error: requesterRoleError
      });
      return NextResponse.json(
        { error: 'Forbidden - Only super_admins can create users' },
        { status: 403 }
      );
    }

    console.log('[CreateEmployee] Request authorized by super_admin:', requestingUser.id);

    // Store admin ID for audit logging
    adminId = requestingUser.id;

    // Get request body
    const body = await request.json();
    const { email, password, full_name, company, role } = body;

    // Store target email for audit logging
    targetEmail = email;

    // Validation
    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, full_name, role' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const validRoles = ['super_admin', 'admin', 'manager', 'developer', 'contractor', 'user'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('[CreateEmployee] Creating user:', { email, full_name, role });

    // Step 1: Create Supabase Auth user
    const { data: authData, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        company: company || ''
      }
    });

    if (createUserError) {
      console.error('[CreateEmployee] Auth error:', createUserError);

      // AUDIT LOG: Record auth creation failure
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await supabase.from('admin_actions').insert({
        admin_id: adminId,
        action: 'create_user',
        target_id: null,
        target_email: targetEmail,
        details: { role, full_name, company },
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'failure',
        error_message: createUserError.message || 'Failed to create auth user'
      });

      return NextResponse.json(
        { error: createUserError.message || 'Failed to create auth user' },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user - no user data returned' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;
    console.log('[CreateEmployee] Auth user created:', userId);

    // Step 2: Wait for trigger to create profile with retry logic
    let profileCreated = false;
    let retryCount = 0;
    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (profileCheck) {
        profileCreated = true;
        retryCount = i + 1;
        console.log(`[CreateEmployee] Profile created after ${retryCount} attempt(s)`);
        break;
      }

      console.log(`[CreateEmployee] Profile not found, retry ${i + 1}/${maxRetries}...`);
    }

    if (!profileCreated) {
      console.error('[CreateEmployee] Profile creation failed after retries');

      // Clean up: Delete the auth user since trigger failed
      await supabase.auth.admin.deleteUser(userId);

      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await supabase.from('admin_actions').insert({
        admin_id: adminId,
        action: 'create_user',
        target_id: null,
        target_email: email,
        details: { role, full_name, company, note: 'Trigger failed to create profile' },
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'failure',
        error_message: 'Profile creation failed after 3 retries - auth user deleted'
      });

      return NextResponse.json(
        { error: 'Profile creation failed - database trigger may not be running correctly' },
        { status: 500 }
      );
    }

    // Step 3: Update the role (trigger creates default 'user' role)
    const { error: roleError } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId);

    if (roleError) {
      console.error('[CreateEmployee] Role update error:', roleError);

      // AUDIT LOG: Record partial success (user created but role not updated)
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await supabase.from('admin_actions').insert({
        admin_id: adminId,
        action: 'create_user',
        target_id: userId,
        target_email: email,
        details: {
          full_name,
          company: company || null,
          requested_role: role,
          actual_role: 'user',
          note: 'User created but role update failed'
        },
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'partial',
        error_message: roleError.message || 'Failed to update user role'
      });

      // Don't fail the whole operation if role update fails
      // The user exists, just with wrong role
    }

    // Step 4: Update profile if company was provided
    if (company) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company })
        .eq('id', userId);

      if (profileError) {
        console.error('[CreateEmployee] Profile update error:', profileError);
      }
    }

    // Step 5: Verify the user was created correctly
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('[CreateEmployee] User created successfully:', {
      userId,
      email,
      role: userRole?.role,
      hasProfile: !!profile,
      hasSubscription: !!subscription
    });

    // AUDIT LOG: Record successful user creation
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await supabase.from('admin_actions').insert({
      admin_id: adminId,
      action: 'create_user',
      target_id: userId,
      target_email: email,
      details: {
        full_name,
        company: company || null,
        role,
        profile_created: !!profile,
        role_created: !!userRole,
        subscription_created: !!subscription
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      status: 'success'
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: userId,
        email,
        full_name,
        company: company || null,
        role: userRole?.role || role
      }
    });

  } catch (error) {
    console.error('[CreateEmployee] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // AUDIT LOG: Record failure if we have admin ID
    if (adminId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });

        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await supabase.from('admin_actions').insert({
          admin_id: adminId,
          action: 'create_user',
          target_id: null,
          target_email: targetEmail,
          details: {
            error_context: 'Unexpected error during user creation'
          },
          ip_address: ipAddress,
          user_agent: userAgent,
          status: 'failure',
          error_message: errorMessage
        });
      } catch (auditError) {
        console.error('[CreateEmployee] Failed to log audit entry:', auditError);
      }
    }

    return NextResponse.json(
      { error: 'Failed to create user', details: errorMessage },
      { status: 500 }
    );
  }
}
