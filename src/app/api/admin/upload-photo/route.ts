import { NextRequest, NextResponse } from 'next/server'
// Force dynamic rendering (do not pre-render at build time)
export const dynamic = 'force-dynamic';
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const photo = formData.get('photo') as File
    const memberId = formData.get('memberId') as string

    if (!photo) {
      return NextResponse.json({ error: 'No photo file provided' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'team')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = photo.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}_${originalName}`
    const filepath = path.join(uploadsDir, filename)

    // Convert file to buffer and save
    const bytes = await photo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    fs.writeFileSync(filepath, buffer)

    const imagePath = `/uploads/team/${filename}`

    // If memberId is provided, update the team member's image path
    if (memberId) {
      const teamDataPath = path.join(process.cwd(), 'data', 'team.json')
      if (fs.existsSync(teamDataPath)) {
        const teamData = JSON.parse(fs.readFileSync(teamDataPath, 'utf8'))
        const memberIndex = teamData.findIndex((member: any) => member.id === memberId)

        if (memberIndex !== -1) {
          // Delete old image if it exists and is in uploads directory
          const oldImagePath = teamData[memberIndex].imagePath
          if (oldImagePath && oldImagePath.includes('/uploads/')) {
            const oldFilePath = path.join(process.cwd(), 'public', oldImagePath)
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath)
            }
          }

          teamData[memberIndex].imagePath = imagePath
          fs.writeFileSync(teamDataPath, JSON.stringify(teamData, null, 2))
        }
      }
    }

    return NextResponse.json({
      success: true,
      imagePath,
      message: 'Photo uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading photo:', error)
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 })
  }
}
