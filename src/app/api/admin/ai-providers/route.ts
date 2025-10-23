import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEmployee } from '@/lib/api-auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface AIProvider {
  id: string
  name: string
  provider_type: 'anthropic' | 'openai' | 'google' | 'xai'
  api_key: string
  endpoint: string
  model: string
  priority: number
  enabled: boolean
  max_tokens: number
  timeout_seconds: number
  use_case: 'general' | 'chatbot' | 'assessment' | 'search' | 'analysis' | 'creative-vision' | 'creative-writing' | 'creative-social' | 'general-chat'
  description?: string
  created_at: string
  updated_at: string
  user_id?: string
  is_global: boolean
}

interface HealthCheck {
  id: string
  provider_id: string
  status: 'healthy' | 'degraded' | 'down'
  response_time_ms?: number
  error_message?: string
  checked_at: string
}

interface AISettings {
  health_check_interval_minutes: number
  auto_failover_enabled: boolean
  fallback_to_static_responses: boolean
  chatbot_assistant_id?: string
  chatbot_thread_management: boolean
  chatbot_auto_initialize: boolean
  chatbot_fallback_enabled: boolean
  chatbot_max_conversation_length: number
  chatbot_response_timeout_ms: number
}

interface AIProvidersData {
  providers: AIProvider[]
  health_checks: HealthCheck[]
  settings: AISettings
  chatbot_config?: {
    assistant_id?: string
    thread_management: boolean
    auto_initialize: boolean
    fallback_enabled: boolean
    max_conversation_length: number
    response_timeout_ms: number
  }
}

// Helper: Get Supabase client
function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Helper: Resolve API key (env variable or literal)
function resolveApiKey(apiKey: string | null): string {
  if (!apiKey) return ''
  if (apiKey.startsWith('env:')) {
    const envVarName = apiKey.substring(4)
    return process.env[envVarName] || apiKey
  }
  return apiKey
}

// GET - Retrieve AI providers configuration
export async function GET(request: NextRequest) {
  // Require employee authentication
  const auth = await requireEmployee(request)

  // Debug logging for authentication issues
  console.log('[Portal API] GET /api/admin/ai-providers - Auth result:', {
    hasError: !!auth.error,
    hasUser: !!auth.user,
    userId: auth.user?.id,
    userEmail: auth.user?.email,
    role: (auth as any).role
  })

  if (auth.error) return auth.error

  try {
    const supabase = getSupabaseClient()

    // Fetch all providers
    const { data: providers, error: providersError } = await supabase
      .from('ai_providers')
      .select('*')
      .order('priority', { ascending: true })

    if (providersError) {
      console.error('[Portal API] Error fetching providers:', providersError)
      return NextResponse.json({ error: 'Failed to load AI providers' }, { status: 500 })
    }

    // Fetch recent health checks (last 50)
    const { data: healthChecks, error: healthError } = await supabase
      .from('ai_provider_health_checks')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(50)

    if (healthError) {
      console.error('[Portal API] Error fetching health checks:', healthError)
    }

    // Fetch settings
    const { data: settings, error: settingsError } = await supabase
      .from('ai_provider_settings')
      .select('*')
      .eq('id', 'global')
      .single()

    if (settingsError) {
      console.error('[Portal API] Error fetching settings:', settingsError)
    }

    // Sanitize API keys for client response
    const sanitizedProviders = (providers || []).map(provider => ({
      ...provider,
      api_key: provider.api_key ? '***configured***' : ''
    }))

    // Build response
    const response: AIProvidersData = {
      providers: sanitizedProviders,
      health_checks: healthChecks || [],
      settings: settings ? {
        health_check_interval_minutes: settings.health_check_interval_minutes,
        auto_failover_enabled: settings.auto_failover_enabled,
        fallback_to_static_responses: settings.fallback_to_static_responses,
        chatbot_assistant_id: settings.chatbot_assistant_id,
        chatbot_thread_management: settings.chatbot_thread_management,
        chatbot_auto_initialize: settings.chatbot_auto_initialize,
        chatbot_fallback_enabled: settings.chatbot_fallback_enabled,
        chatbot_max_conversation_length: settings.chatbot_max_conversation_length,
        chatbot_response_timeout_ms: settings.chatbot_response_timeout_ms
      } : {
        health_check_interval_minutes: 5,
        auto_failover_enabled: true,
        fallback_to_static_responses: true,
        chatbot_thread_management: true,
        chatbot_auto_initialize: true,
        chatbot_fallback_enabled: true,
        chatbot_max_conversation_length: 50,
        chatbot_response_timeout_ms: 30000
      },
      chatbot_config: settings ? {
        assistant_id: settings.chatbot_assistant_id,
        thread_management: settings.chatbot_thread_management,
        auto_initialize: settings.chatbot_auto_initialize,
        fallback_enabled: settings.chatbot_fallback_enabled,
        max_conversation_length: settings.chatbot_max_conversation_length,
        response_timeout_ms: settings.chatbot_response_timeout_ms
      } : undefined
    }

    console.log('[Portal API] Successfully loaded AI providers:', providers?.length || 0, 'providers')

    return NextResponse.json(response)

  } catch (error) {
    console.error('[Portal API] Error in GET /api/admin/ai-providers:', error)
    return NextResponse.json({ error: 'Failed to load AI providers' }, { status: 500 })
  }
}

// POST - Create or update AI provider
export async function POST(request: NextRequest) {
  // Require employee authentication
  const auth = await requireEmployee(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { action, provider, config } = body

    const supabase = getSupabaseClient()

    switch (action) {
      case 'create': {
        const newProvider: Partial<AIProvider> = {
          id: `${provider.provider_type}-${Date.now()}`,
          name: provider.name,
          provider_type: provider.provider_type,
          api_key: provider.api_key || null,
          endpoint: provider.endpoint,
          model: provider.model,
          priority: provider.priority || 999,
          enabled: provider.enabled !== undefined ? provider.enabled : true,
          max_tokens: provider.max_tokens || 1500,
          timeout_seconds: provider.timeout_seconds || 30,
          use_case: provider.use_case || 'general',
          description: provider.description || '',
          is_global: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('ai_providers')
          .insert([newProvider])
          .select()
          .single()

        if (error) {
          console.error('[Portal API] Error creating provider:', error)
          return NextResponse.json({ error: 'Failed to create AI provider' }, { status: 500 })
        }

        // Log to activity (optional)
        try {
          await supabase.from('ai_sessions').insert([{
            session_id: `portal_admin_${Date.now()}`,
            user_hash: 'portal_admin',
            session_name: `Provider created: ${newProvider.name}`,
            ai_provider: newProvider.provider_type,
            assessment_data: { action: 'created', providerId: newProvider.id }
          }])
        } catch (logError) {
          console.warn('[Portal API] Failed to log provider creation:', logError)
        }

        console.log('[Portal API] Provider created successfully:', data.id)

        return NextResponse.json({
          success: true,
          message: 'AI provider created successfully',
          provider: { ...data, api_key: data.api_key ? '***configured***' : '' }
        })
      }

      case 'update': {
        const { error } = await supabase
          .from('ai_providers')
          .update({
            ...provider,
            updated_at: new Date().toISOString()
          })
          .eq('id', provider.id)

        if (error) {
          console.error('[Portal API] Error updating provider:', error)
          return NextResponse.json({ error: 'Failed to update AI provider' }, { status: 500 })
        }

        console.log('[Portal API] Provider updated successfully:', provider.id)

        return NextResponse.json({
          success: true,
          message: 'AI provider updated successfully'
        })
      }

      case 'delete': {
        const { error } = await supabase
          .from('ai_providers')
          .delete()
          .eq('id', provider.id)

        if (error) {
          console.error('[Portal API] Error deleting provider:', error)
          return NextResponse.json({ error: 'Failed to delete AI provider' }, { status: 500 })
        }

        console.log('[Portal API] Provider deleted successfully:', provider.id)

        return NextResponse.json({
          success: true,
          message: 'AI provider deleted successfully'
        })
      }

      case 'test_connection': {
        // Get full provider details
        const { data: fullProvider, error: fetchError } = await supabase
          .from('ai_providers')
          .select('*')
          .eq('id', provider.id)
          .single()

        if (fetchError || !fullProvider) {
          return NextResponse.json({ error: 'Provider not found for testing' }, { status: 404 })
        }

        console.log('[Portal API] Testing connection for provider:', fullProvider.name)

        // Test the connection
        const testResult = await testProviderConnection(fullProvider)

        // Record health check
        const healthCheckId = `hc_${provider.id}_${Date.now()}`
        await supabase.from('ai_provider_health_checks').insert([{
          id: healthCheckId,
          provider_id: provider.id,
          status: testResult.success ? 'healthy' : 'down',
          response_time_ms: testResult.response_time,
          error_message: testResult.error || null,
          checked_at: new Date().toISOString()
        }])

        // Clean up old health checks (keep last 100 per provider)
        const { data: oldChecks } = await supabase
          .from('ai_provider_health_checks')
          .select('id')
          .eq('provider_id', provider.id)
          .order('checked_at', { ascending: false })
          .range(100, 999)

        if (oldChecks && oldChecks.length > 0) {
          await supabase
            .from('ai_provider_health_checks')
            .delete()
            .in('id', oldChecks.map(c => c.id))
        }

        console.log('[Portal API] Connection test result:', testResult.success ? 'success' : 'failed')

        return NextResponse.json({
          success: testResult.success,
          message: testResult.success ? 'Connection successful' : 'Connection failed',
          test_result: testResult
        })
      }

      case 'update_settings': {
        const { error } = await supabase
          .from('ai_provider_settings')
          .update({
            ...provider,
            updated_at: new Date().toISOString()
          })
          .eq('id', 'global')

        if (error) {
          console.error('[Portal API] Error updating settings:', error)
          return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
        }

        console.log('[Portal API] Settings updated successfully')

        return NextResponse.json({
          success: true,
          message: 'Settings updated successfully'
        })
      }

      case 'update_chatbot_config': {
        const { error } = await supabase
          .from('ai_provider_settings')
          .update({
            chatbot_assistant_id: config.assistant_id,
            chatbot_thread_management: config.thread_management,
            chatbot_auto_initialize: config.auto_initialize,
            chatbot_fallback_enabled: config.fallback_enabled,
            chatbot_max_conversation_length: config.max_conversation_length,
            chatbot_response_timeout_ms: config.response_timeout_ms,
            updated_at: new Date().toISOString()
          })
          .eq('id', 'global')

        if (error) {
          console.error('[Portal API] Error updating chatbot config:', error)
          return NextResponse.json({ error: 'Failed to update chatbot configuration' }, { status: 500 })
        }

        console.log('[Portal API] Chatbot configuration updated successfully')

        return NextResponse.json({
          success: true,
          message: 'Chatbot configuration updated successfully'
        })
      }

      case 'verify_supabase': {
        try {
          const { error } = await supabase
            .from('ai_providers')
            .select('count(*)', { count: 'exact', head: true })

          if (error) {
            return NextResponse.json({
              success: false,
              message: 'Supabase connection failed',
              details: { error: error.message }
            })
          }

          return NextResponse.json({
            success: true,
            message: 'Supabase connection verified'
          })
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            message: 'Supabase connection failed',
            details: { error: error.message }
          })
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('[Portal API] Error in POST /api/admin/ai-providers:', error)
    return NextResponse.json({
      error: 'Failed to manage AI provider',
      details: error.message
    }, { status: 500 })
  }
}

// Test provider connection
async function testProviderConnection(provider: AIProvider): Promise<{
  success: boolean
  response_time?: number
  error?: string
  response?: string
}> {
  const startTime = Date.now()

  try {
    console.log('[Portal API] Testing provider:', provider.name, 'Type:', provider.provider_type)

    // Resolve API key (handle env: prefix)
    const apiKey = resolveApiKey(provider.api_key)
    if (!apiKey || apiKey.startsWith('env:')) {
      return {
        success: false,
        response_time: Date.now() - startTime,
        error: `API key not configured for ${provider.provider_type}`
      }
    }

    const testMessage = "Hello, this is a connection test."
    let response: Response

    switch (provider.provider_type) {
      case 'anthropic':
        response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: provider.model,
            max_tokens: 50,
            messages: [{ role: 'user', content: testMessage }]
          }),
          signal: AbortSignal.timeout(provider.timeout_seconds * 1000)
        })
        break

      case 'openai':
        // Test OpenAI connection
        if (provider.api_key && provider.api_key.startsWith('asst_')) {
          // Test Assistant API
          response = await fetch('https://api.openai.com/v1/threads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({}),
            signal: AbortSignal.timeout(provider.timeout_seconds * 1000)
          })
        } else {
          // Test Chat Completions
          response = await fetch(provider.endpoint || 'https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: provider.model,
              max_tokens: 50,
              messages: [{ role: 'user', content: testMessage }]
            }),
            signal: AbortSignal.timeout(provider.timeout_seconds * 1000)
          })
        }
        break

      default:
        throw new Error(`Unsupported provider type: ${provider.provider_type}`)
    }

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        response_time: responseTime,
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    return {
      success: true,
      response_time: responseTime,
      response: 'Connection successful'
    }

  } catch (error: any) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      response_time: responseTime,
      error: error?.message || error?.toString() || 'Unknown error'
    }
  }
}
