import { NextRequest, NextResponse } from 'next/server'
// Force dynamic rendering (do not pre-render at build time)
export const dynamic = 'force-dynamic';
import fs from 'fs'
import path from 'path'
import { requireEmployee } from '@/lib/api-auth'

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

export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    const settings = loadSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error loading settings:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    const updatedSettings: SiteSettings = await request.json()
    ensureDataDirectory()
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updatedSettings, null, 2))
    return NextResponse.json({ success: true, settings: updatedSettings })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
