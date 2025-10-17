import { NextRequest, NextResponse } from 'next/server'
// Force dynamic rendering (do not pre-render at build time)
export const dynamic = 'force-dynamic';
import fs from 'fs'
import path from 'path'
import { requireEmployee } from '@/lib/api-auth'

const BLOG_PATH = path.join(process.cwd(), 'data', 'blog-posts.json')

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  publishedDate: string
  featuredImage: string
  videoUrl: string
  tags: string[]
  published: boolean
}

function ensureDataDirectory() {
  const dataDir = path.dirname(BLOG_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

function loadBlogPosts(): BlogPost[] {
  ensureDataDirectory()

  if (!fs.existsSync(BLOG_PATH)) {
    fs.writeFileSync(BLOG_PATH, JSON.stringify([], null, 2))
    return []
  }

  const data = fs.readFileSync(BLOG_PATH, 'utf8')
  return JSON.parse(data)
}

function saveBlogPosts(posts: BlogPost[]) {
  ensureDataDirectory()
  fs.writeFileSync(BLOG_PATH, JSON.stringify(posts, null, 2))
}

export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request)
  if (auth.error) return auth.error

  try {
    const posts = loadBlogPosts()
    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error loading blog posts:', error)
    return NextResponse.json({ error: 'Failed to load blog posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireEmployee(request)
  if (auth.error) return auth.error

  try {
    const newPost: BlogPost = await request.json()
    const posts = loadBlogPosts()

    newPost.id = Date.now().toString()
    posts.push(newPost)

    saveBlogPosts(posts)
    return NextResponse.json({ success: true, post: newPost })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireEmployee(request)
  if (auth.error) return auth.error

  try {
    const updatedPost: BlogPost = await request.json()
    const posts = loadBlogPosts()

    const index = posts.findIndex(post => post.id === updatedPost.id)
    if (index === -1) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    posts[index] = updatedPost
    saveBlogPosts(posts)

    return NextResponse.json({ success: true, post: updatedPost })
  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEmployee(request)
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    const posts = loadBlogPosts()
    const filteredPosts = posts.filter(post => post.id !== id)

    if (posts.length === filteredPosts.length) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    saveBlogPosts(filteredPosts)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 })
  }
}
