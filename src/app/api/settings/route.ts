import { NextRequest, NextResponse } from 'next/server'
// Force dynamic rendering (do not pre-render at build time)
export const dynamic = 'force-dynamic';
import fs from 'fs'
import path from 'path'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json')

interface SiteSettings {
  logoPath: string
  footerLogoPath: string
  demoVideoUrl: string
}

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(SETTINGS_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load settings
function loadSettings(): SiteSettings {
  ensureDataDirectory()

  if (!fs.existsSync(SETTINGS_PATH)) {
    const defaultSettings: SiteSettings = {
      logoPath: '',
      footerLogoPath: '',
      demoVideoUrl: ''
    }
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaultSettings, null, 2))
    return defaultSettings
  }

  const data = fs.readFileSync(SETTINGS_PATH, 'utf8')
  return JSON.parse(data)
}

// Public GET endpoint - no authentication required for V4 to read logos
export async function GET(request: NextRequest) {
  try {
    const settings = loadSettings()

    // Convert relative paths to full URLs for cross-domain access
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3001'
      : 'https://portal.design-rite.com'

    const settingsWithFullUrls = {
      logoPath: settings.logoPath ? `${baseUrl}${settings.logoPath}` : '',
      footerLogoPath: settings.footerLogoPath ? `${baseUrl}${settings.footerLogoPath}` : '',
      demoVideoUrl: settings.demoVideoUrl || ''
    }

    console.log('[Portal Settings API] Returning logo settings:', settingsWithFullUrls)

    // Add CORS headers for cross-domain access
    return NextResponse.json(settingsWithFullUrls, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  } catch (error) {
    console.error('Error loading settings:', error)
    return NextResponse.json(
      { logoPath: '', footerLogoPath: '', demoVideoUrl: '' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
