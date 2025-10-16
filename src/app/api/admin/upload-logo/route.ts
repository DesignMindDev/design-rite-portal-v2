import { NextRequest, NextResponse } from 'next/server'
// Force dynamic rendering (do not pre-render at build time)
export const dynamic = 'force-dynamic';
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const logo = formData.get('logo') as File
    const type = formData.get('type') as string // 'header' or 'footer'

    if (!logo) {
      return NextResponse.json({ error: 'No logo file provided' }, { status: 400 })
    }

    if (!type || !['header', 'footer'].includes(type)) {
      return NextResponse.json({ error: 'Invalid logo type. Must be "header" or "footer"' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'logos')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Generate filename based on type
    const extension = path.extname(logo.name)
    const filename = `${type}-logo${extension}`
    const filepath = path.join(uploadsDir, filename)

    // Delete existing logo if it exists
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }

    // Convert file to buffer and save
    const bytes = await logo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    fs.writeFileSync(filepath, buffer)

    const logoPath = `/uploads/logos/${filename}`

    // Update site settings
    const settingsPath = path.join(process.cwd(), 'data', 'settings.json')
    const settingsDir = path.dirname(settingsPath)

    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true })
    }

    let settings = { logoPath: '', footerLogoPath: '', demoVideoUrl: '' }
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    }

    if (type === 'header') {
      settings.logoPath = logoPath
    } else {
      settings.footerLogoPath = logoPath
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))

    return NextResponse.json({
      success: true,
      logoPath,
      message: `${type} logo uploaded successfully`
    })
  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
  }
}
