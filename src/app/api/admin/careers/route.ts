import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CAREERS_FILE = path.join(process.cwd(), 'data', 'career-postings.json')

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  if (!fs.existsSync(CAREERS_FILE)) {
    fs.writeFileSync(CAREERS_FILE, JSON.stringify([], null, 2))
  }
}

// GET - Get all career postings
export async function GET(request: NextRequest) {
  try {
    ensureDataDirectory()
    const fileContents = fs.readFileSync(CAREERS_FILE, 'utf8')
    const careers = JSON.parse(fileContents)

    // Filter by active status if requested
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const filteredCareers = activeOnly
      ? careers.filter((c: any) => c.is_active)
      : careers

    return NextResponse.json(filteredCareers)
  } catch (error) {
    console.error('Error reading careers:', error)
    return NextResponse.json({ error: 'Failed to load career postings' }, { status: 500 })
  }
}

// POST - Create new career posting
export async function POST(request: NextRequest) {
  try {
    ensureDataDirectory()
    const body = await request.json()

    // Generate ID from title
    const id = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const newCareer = {
      id,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const fileContents = fs.readFileSync(CAREERS_FILE, 'utf8')
    const careers = JSON.parse(fileContents)

    careers.push(newCareer)

    fs.writeFileSync(CAREERS_FILE, JSON.stringify(careers, null, 2))

    return NextResponse.json(newCareer, { status: 201 })
  } catch (error) {
    console.error('Error creating career:', error)
    return NextResponse.json({ error: 'Failed to create career posting' }, { status: 500 })
  }
}

// PUT - Update career posting
export async function PUT(request: NextRequest) {
  try {
    ensureDataDirectory()
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Career ID is required' }, { status: 400 })
    }

    const fileContents = fs.readFileSync(CAREERS_FILE, 'utf8')
    let careers = JSON.parse(fileContents)

    const index = careers.findIndex((c: any) => c.id === id)
    if (index === -1) {
      return NextResponse.json({ error: 'Career posting not found' }, { status: 404 })
    }

    careers[index] = {
      ...careers[index],
      ...body,
      updated_at: new Date().toISOString()
    }

    fs.writeFileSync(CAREERS_FILE, JSON.stringify(careers, null, 2))

    return NextResponse.json(careers[index])
  } catch (error) {
    console.error('Error updating career:', error)
    return NextResponse.json({ error: 'Failed to update career posting' }, { status: 500 })
  }
}

// DELETE - Delete career posting
export async function DELETE(request: NextRequest) {
  try {
    ensureDataDirectory()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Career ID is required' }, { status: 400 })
    }

    const fileContents = fs.readFileSync(CAREERS_FILE, 'utf8')
    let careers = JSON.parse(fileContents)

    const index = careers.findIndex((c: any) => c.id === id)
    if (index === -1) {
      return NextResponse.json({ error: 'Career posting not found' }, { status: 404 })
    }

    careers.splice(index, 1)

    fs.writeFileSync(CAREERS_FILE, JSON.stringify(careers, null, 2))

    return NextResponse.json({ message: 'Career posting deleted successfully' })
  } catch (error) {
    console.error('Error deleting career:', error)
    return NextResponse.json({ error: 'Failed to delete career posting' }, { status: 500 })
  }
}
