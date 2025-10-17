import { NextRequest, NextResponse } from 'next/server'
// Force dynamic rendering (do not pre-render at build time)
export const dynamic = 'force-dynamic';
import fs from 'fs'
import path from 'path'
import { requireEmployee } from '@/lib/api-auth'

const TEAM_DATA_PATH = path.join(process.cwd(), 'data', 'team.json')

interface TeamMember {
  id: string
  name: string
  role: string
  description: string
  imagePath: string
  initials: string
  href?: string
}

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(TEAM_DATA_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load team data
function loadTeamData(): TeamMember[] {
  ensureDataDirectory()

  if (!fs.existsSync(TEAM_DATA_PATH)) {
    // Initialize with default team members
    const defaultTeam: TeamMember[] = [
      {
        id: "1",
        name: "Dan Kozich",
        role: "Founder & Principal Designer",
        description: "Over two decades of expertise in low-voltage design, security systems, and technology integration. Trusted advisor to Fortune 500 companies, school districts, hospitals, and critical infrastructure facilities. Subject matter expert automating compliance checks and design optimization.",
        imagePath: "/team/dan-kozich.jpg",
        initials: "DK"
      },
      {
        id: "2",
        name: "Philip Lisk",
        role: "Managing Director",
        description: "Strategic leadership driving Design-Rite's growth and market expansion. Expertise in business development, operations, and scaling technology solutions in the security industry.",
        imagePath: "/team/philip-lisk.jpg",
        initials: "PL"
      },
      {
        id: "3",
        name: "Munnyman Communications",
        role: "Development Team",
        description: "Expert development team bringing Design-Rite's vision to life. Specializing in AI platforms, modern web technologies, and scalable solutions that deliver powerful word-of-mouth results.",
        imagePath: "/team/munnyman-communications.jpg",
        initials: "MC",
        href: "https://mmcommunications-newsletter-elitemembers.beehiiv.com/p/powerful-word-of-mouth-real-results"
      },
      {
        id: "4",
        name: "AI Research Team",
        role: "Core Intelligence",
        description: "Advanced AI models trained on thousands of security designs, compliance standards, and industry best practices.",
        imagePath: "/team/ai-research.jpg",
        initials: "🧠"
      }
    ]

    fs.writeFileSync(TEAM_DATA_PATH, JSON.stringify(defaultTeam, null, 2))
    return defaultTeam
  }

  const data = fs.readFileSync(TEAM_DATA_PATH, 'utf8')
  return JSON.parse(data)
}

// Save team data
function saveTeamData(teamMembers: TeamMember[]) {
  ensureDataDirectory()
  fs.writeFileSync(TEAM_DATA_PATH, JSON.stringify(teamMembers, null, 2))
}

export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    const teamMembers = loadTeamData()
    return NextResponse.json(teamMembers)
  } catch (error) {
    console.error('Error loading team data:', error)
    return NextResponse.json({ error: 'Failed to load team data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json()

    // Validation
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!body.role || body.role.trim().length === 0) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }

    const teamMembers = loadTeamData()

    // Generate initials from name if not provided
    const generateInitials = (name: string): string => {
      return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2)
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: body.name.trim(),
      role: body.role.trim(),
      description: body.description?.trim() || '',
      imagePath: body.imagePath || `/team/placeholder.jpg`,
      initials: body.initials || generateInitials(body.name.trim()),
      ...(body.href && { href: body.href.trim() })
    }

    teamMembers.push(newMember)
    saveTeamData(teamMembers)

    console.log('Team member added successfully:', newMember)
    return NextResponse.json({ success: true, member: newMember })
  } catch (error) {
    console.error('Error adding team member:', error)
    return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    const updatedMember: TeamMember = await request.json()
    const teamMembers = loadTeamData()

    const index = teamMembers.findIndex(member => member.id === updatedMember.id)
    if (index === -1) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    teamMembers[index] = updatedMember
    saveTeamData(teamMembers)

    return NextResponse.json({ success: true, member: updatedMember })
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEmployee(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Team member ID is required' }, { status: 400 })
    }

    const teamMembers = loadTeamData()
    const index = teamMembers.findIndex(member => member.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    teamMembers.splice(index, 1)
    saveTeamData(teamMembers)

    return NextResponse.json({ success: true, message: 'Team member deleted successfully' })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 })
  }
}
