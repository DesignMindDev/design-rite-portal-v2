import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireEmployee } from '@/lib/api-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface DashboardPreferences {
  widget_visibility: {
    realtimeActivity: boolean;
    systemHealth: boolean;
    userEngagement: boolean;
    revenueMetrics: boolean;
    leadFunnel: boolean;
    aiPerformance: boolean;
    activityFeed: boolean;
    operationsDashboard: boolean;
  };
  card_size: 'compact' | 'standard' | 'large';
  grid_density: 'dense' | 'comfortable';
  default_time_range: '24h' | '7d' | '30d';
  auto_refresh: boolean;
  accent_color: 'indigo' | 'blue' | 'purple' | 'green' | 'red' | 'amber';
  chart_style: 'modern' | 'classic';
}

/**
 * GET /api/admin/preferences
 * Fetch user's dashboard preferences
 */
export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    console.log('[Preferences API] Fetching preferences for user:', auth.user?.email);

    // Fetch user's preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('dashboard_preferences')
      .select('*')
      .eq('user_id', auth.user!.id)
      .single();

    if (preferencesError) {
      // If no preferences exist, return defaults
      if (preferencesError.code === 'PGRST116') {
        console.log('[Preferences API] No preferences found, returning defaults');
        return NextResponse.json({
          success: true,
          preferences: {
            widget_visibility: {
              realtimeActivity: true,
              systemHealth: true,
              userEngagement: true,
              revenueMetrics: true,
              leadFunnel: true,
              aiPerformance: true,
              activityFeed: true,
              operationsDashboard: true
            },
            card_size: 'compact',
            grid_density: 'dense',
            default_time_range: '24h',
            auto_refresh: true,
            accent_color: 'indigo',
            chart_style: 'modern'
          },
          isDefault: true
        });
      }

      console.error('[Preferences API] Error fetching preferences:', preferencesError);
      return NextResponse.json(
        { error: 'Failed to fetch preferences', details: preferencesError.message },
        { status: 500 }
      );
    }

    console.log('[Preferences API] Preferences fetched successfully');

    return NextResponse.json({
      success: true,
      preferences: {
        widget_visibility: preferences.widget_visibility,
        card_size: preferences.card_size,
        grid_density: preferences.grid_density,
        default_time_range: preferences.default_time_range,
        auto_refresh: preferences.auto_refresh,
        accent_color: preferences.accent_color,
        chart_style: preferences.chart_style
      },
      isDefault: false
    });

  } catch (error) {
    console.error('[Preferences API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/preferences
 * Save/update user's dashboard preferences
 */
export async function POST(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    // Parse request body
    const body = await request.json();
    const preferences: DashboardPreferences = body.preferences;

    console.log('[Preferences API] Saving preferences for user:', auth.user?.email);

    // Validate preferences structure
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences data' },
        { status: 400 }
      );
    }

    // Upsert preferences (insert or update)
    const { data, error: upsertError } = await supabase
      .from('dashboard_preferences')
      .upsert({
        user_id: auth.user!.id,
        widget_visibility: preferences.widget_visibility,
        card_size: preferences.card_size,
        grid_density: preferences.grid_density,
        default_time_range: preferences.default_time_range,
        auto_refresh: preferences.auto_refresh,
        accent_color: preferences.accent_color,
        chart_style: preferences.chart_style,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (upsertError) {
      console.error('[Preferences API] Error saving preferences:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save preferences', details: upsertError.message },
        { status: 500 }
      );
    }

    console.log('[Preferences API] Preferences saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Preferences saved successfully',
      preferences: data
    });

  } catch (error) {
    console.error('[Preferences API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
