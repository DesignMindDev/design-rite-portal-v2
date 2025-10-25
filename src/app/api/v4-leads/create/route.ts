import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verify request is from V4 (simple API key check)
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.V4_API_KEY || 'design-rite-v4-to-portal-sync-key-2025';

    if (apiKey !== expectedKey) {
      console.error('[V4 Leads] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { source, email, full_name, company, phone, message, form_data } = body;

    // Validate required fields
    if (!source || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: source and email' },
        { status: 400 }
      );
    }

    // Insert lead into database
    const { data, error } = await supabase
      .from('v4_leads')
      .insert({
        source,
        email,
        full_name,
        company,
        phone,
        message,
        form_data,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('[V4 Leads] Error creating lead:', error);
      return NextResponse.json(
        { error: 'Failed to create lead', details: error.message },
        { status: 500 }
      );
    }

    console.log('[V4 Leads] New lead created:', { id: data.id, email, source });

    return NextResponse.json({
      success: true,
      lead: data
    });

  } catch (error) {
    console.error('[V4 Leads] Error in endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}