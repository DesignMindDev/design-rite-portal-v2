import { NextRequest, NextResponse } from 'next/server'
// Force dynamic rendering (do not pre-render at build time)
export const dynamic = 'force-dynamic';
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const AI_PROVIDERS_PATH = path.join(process.cwd(), 'data', 'ai-providers.json')

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
  use_case: 'general' | 'chatbot' | 'assessment' | 'search' | 'analysis' | 'creative-vision' | 'creative-writing' | 'creative-social'
  description?: string
  created_at: string
  updated_at: string
}

interface HealthCheck {
  id: string
  provider_id: string
  status: 'healthy' | 'degraded' | 'down'
  response_time_ms?: number
  error_message?: string
  checked_at: string
}

interface ChatbotConfig {
  assistant_id?: string
  thread_management: boolean
  auto_initialize: boolean
  fallback_enabled: boolean
  max_conversation_length: number
  response_timeout_ms: number
}

interface AIProvidersData {
  providers: AIProvider[]
  health_checks: HealthCheck[]
  settings: {
    health_check_interval_minutes: number
    auto_failover_enabled: boolean
    fallback_to_static_responses: boolean
  }
  chatbot_config?: ChatbotConfig
}

function loadProvidersData(): AIProvidersData {
  if (!fs.existsSync(AI_PROVIDERS_PATH)) {
    const defaultData: AIProvidersData = {
      providers: [],
      health_checks: [],
      settings: {
        health_check_interval_minutes: 5,
        auto_failover_enabled: true,
        fallback_to_static_responses: true
      },
      chatbot_config: {
        assistant_id: 'asst_bqlPjRKyztWpplupYhCimIzS',
        thread_management: true,
        auto_initialize: true,
        fallback_enabled: true,
        max_conversation_length: 50,
        response_timeout_ms: 30000
      }
    }
    fs.writeFileSync(AI_PROVIDERS_PATH, JSON.stringify(defaultData, null, 2))
    return defaultData
  }

  const data = fs.readFileSync(AI_PROVIDERS_PATH, 'utf8')
  return JSON.parse(data)
}

function saveProvidersData(data: AIProvidersData): void {
  fs.writeFileSync(AI_PROVIDERS_PATH, JSON.stringify(data, null, 2))
}

// Update .env file with new environment variables
function updateEnvFile(envUpdates: Record<string, string>) {
  const envPath = path.join(process.cwd(), '.env.local')
  let envContent = ''

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }

  for (const [key, value] of Object.entries(envUpdates)) {
    const envVar = `${key}=${value}`
    const regex = new RegExp(`^${key}=.*$`, 'm')

    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, envVar)
    } else {
      envContent += `\n${envVar}`
    }
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n')
}

// Verify Supabase connection
async function verifySupabaseConnection() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: 'Supabase credentials not configured' }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test connection by querying a simple table
    const { data, error } = await supabase
      .from('chatbot_conversations')
      .select('count(*)', { count: 'exact', head: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Supabase connection successful' }
  } catch (error) {
    return { success: false, error: error.message || 'Unknown error' }
  }
}

// Log provider creation/update to Supabase
async function logProviderChange(action: string, provider: AIProvider) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)

      await supabase
        .from('ai_sessions')
        .insert([{
          session_id: `admin_${Date.now()}`,
          user_hash: 'admin',
          session_name: `Provider ${action}: ${provider.name}`,
          ai_provider: provider.provider_type,
          assessment_data: { action, providerId: provider.id, timestamp: new Date().toISOString() }
        }])
    }
  } catch (error) {
    console.error('Failed to log provider change:', error)
  }
}

// GET - Retrieve AI providers configuration
export async function GET(request: NextRequest) {
  try {
    const data = loadProvidersData()

    // Don't expose API keys in the response
    const sanitizedProviders = data.providers.map(provider => ({
      ...provider,
      api_key: provider.api_key ? '***configured***' : ''
    }))

    return NextResponse.json({
      providers: sanitizedProviders,
      health_checks: data.health_checks.slice(-50), // Last 50 health checks
      settings: data.settings,
      chatbot_config: data.chatbot_config
    })

  } catch (error) {
    console.error('Error loading AI providers:', error)
    return NextResponse.json({ error: 'Failed to load AI providers' }, { status: 500 })
  }
}

// POST - Create or update AI provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, provider } = body

    const data = loadProvidersData()

    switch (action) {
      case 'create':
        const newProvider: AIProvider = {
          id: `${provider.provider_type}-${Date.now()}`,
          name: provider.name,
          provider_type: provider.provider_type,
          api_key: provider.api_key || '',
          endpoint: provider.endpoint,
          model: provider.model,
          priority: provider.priority || 999,
          enabled: provider.enabled !== undefined ? provider.enabled : true,
          max_tokens: provider.max_tokens || 1500,
          timeout_seconds: provider.timeout_seconds || 30,
          use_case: provider.use_case || 'general',
          description: provider.description || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        data.providers.push(newProvider)
        data.providers.sort((a, b) => a.priority - b.priority)
        saveProvidersData(data)

        // Update environment variables if it's an OpenAI provider with Assistant ID
        if (newProvider.provider_type === 'openai' && newProvider.api_key && newProvider.api_key.startsWith('asst_')) {
          const envKey = `${newProvider.use_case?.toUpperCase()}_ASSISTANT_ID`
          updateEnvFile({ [envKey]: newProvider.api_key })
        }

        // Log to Supabase
        await logProviderChange('created', newProvider)

        // Verify Supabase connection
        const supabaseVerification = await verifySupabaseConnection()

        return NextResponse.json({
          success: true,
          message: 'AI provider created successfully',
          provider: { ...newProvider, api_key: newProvider.api_key ? '***configured***' : '' },
          supabaseStatus: supabaseVerification
        })

      case 'update':
        const providerIndex = data.providers.findIndex(p => p.id === provider.id)
        if (providerIndex === -1) {
          return NextResponse.json({ error: 'AI provider not found' }, { status: 404 })
        }

        data.providers[providerIndex] = {
          ...data.providers[providerIndex],
          ...provider,
          updated_at: new Date().toISOString()
        }

        data.providers.sort((a, b) => a.priority - b.priority)
        saveProvidersData(data)

        // Update environment variables if it's an OpenAI provider with Assistant ID
        const updatedProvider = data.providers[providerIndex]
        if (updatedProvider.provider_type === 'openai' && updatedProvider.api_key && updatedProvider.api_key.startsWith('asst_')) {
          const envKey = `${updatedProvider.use_case?.toUpperCase()}_ASSISTANT_ID`
          updateEnvFile({ [envKey]: updatedProvider.api_key })
        }

        // Log to Supabase
        await logProviderChange('updated', updatedProvider)

        return NextResponse.json({
          success: true,
          message: 'AI provider updated successfully'
        })

      case 'delete':
        const deleteIndex = data.providers.findIndex(p => p.id === provider.id)
        if (deleteIndex === -1) {
          return NextResponse.json({ error: 'AI provider not found' }, { status: 404 })
        }

        data.providers.splice(deleteIndex, 1)
        saveProvidersData(data)

        return NextResponse.json({
          success: true,
          message: 'AI provider deleted successfully'
        })

      case 'test_connection':
        // Get the full provider details for testing
        const fullProvider = data.providers.find(p => p.id === provider.id)
        if (!fullProvider) {
          return NextResponse.json({ error: 'Provider not found for testing' }, { status: 404 })
        }

        // Test the API connection
        const testResult = await testProviderConnection(fullProvider)

        // Record health check
        const healthCheck: HealthCheck = {
          id: `test-${Date.now()}`,
          provider_id: provider.id,
          status: testResult.success ? 'healthy' : 'down',
          response_time_ms: testResult.response_time,
          error_message: testResult.error,
          checked_at: new Date().toISOString()
        }

        data.health_checks.push(healthCheck)
        data.health_checks = data.health_checks.slice(-100) // Keep last 100 checks
        saveProvidersData(data)

        return NextResponse.json({
          success: testResult.success,
          message: testResult.success ? 'Connection successful' : 'Connection failed',
          test_result: testResult,
          health_check: healthCheck
        })

      case 'update_settings':
        data.settings = { ...data.settings, ...provider }
        saveProvidersData(data)

        return NextResponse.json({
          success: true,
          message: 'Settings updated successfully'
        })

      case 'update_chatbot_config':
        data.chatbot_config = { ...data.chatbot_config, ...body.config }
        saveProvidersData(data)

        return NextResponse.json({
          success: true,
          message: 'Chatbot configuration updated successfully'
        })

      case 'verify_supabase':
        const supabaseResult = await verifySupabaseConnection()
        return NextResponse.json({
          success: supabaseResult.success,
          message: supabaseResult.success ? 'Supabase connection verified' : 'Supabase connection failed',
          details: supabaseResult
        })

      case 'update_env':
        const { envUpdates } = body
        if (envUpdates && typeof envUpdates === 'object') {
          updateEnvFile(envUpdates)
          return NextResponse.json({
            success: true,
            message: 'Environment variables updated successfully',
            note: 'Restart the application to apply changes'
          })
        } else {
          return NextResponse.json({ error: 'Invalid environment updates' }, { status: 400 })
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error managing AI providers:', error)
    return NextResponse.json({
      error: 'Failed to manage AI provider',
      details: error.message
    }, { status: 500 })
  }
}

async function testProviderConnection(provider: AIProvider): Promise<{
  success: boolean
  response_time?: number
  error?: string
  response?: string
}> {
  const startTime = Date.now()

  try {
    console.log('Testing provider:', provider.name, 'Type:', provider.provider_type)

    const testMessage = "Hello, this is a connection test."
    let response: Response

    switch (provider.provider_type) {
      case 'anthropic':
        response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': provider.api_key,
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
        // For OpenAI, use environment API key and provider's assistant_id
        const openaiApiKey = process.env.OPENAI_API_KEY
        if (!openaiApiKey) {
          throw new Error('OPENAI_API_KEY environment variable not set')
        }

        // If provider has assistant ID, test assistant API, otherwise test chat completions
        if (provider.api_key && provider.api_key.startsWith('asst_')) {
          // Test OpenAI Assistant API
          response = await fetch('https://api.openai.com/v1/threads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiApiKey}`,
              'OpenAI-Beta': 'assistants=v1'
            },
            body: JSON.stringify({}),
            signal: AbortSignal.timeout(provider.timeout_seconds * 1000)
          })
        } else {
          // Test regular chat completions
          response = await fetch(provider.endpoint || 'https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiApiKey}`
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

  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      response_time: responseTime,
      error: error?.message || error?.toString() || 'Unknown error'
    }
  }
}