'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ProtectedLayout from '@/components/ProtectedLayout'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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

export default function BlogManagementPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [newPost, setNewPost] = useState<Partial<BlogPost>>({})
  const [uploadingBlogImage, setUploadingBlogImage] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBlogPosts()
  }, [])

  const loadBlogPosts = async () => {
    try {
      const response = await fetch('/api/admin/blog')
      if (response.ok) {
        const data = await response.json()
        setBlogPosts(data)
      }
    } catch (error) {
      console.error('Failed to load blog posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBlogImageUpload = async (file: File): Promise<string | null> => {
    setUploadingBlogImage(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/admin/upload-blog-image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        return data.imagePath
      }
    } catch (error) {
      console.error('Failed to upload blog image:', error)
    } finally {
      setUploadingBlogImage(false)
    }
    return null
  }

  const saveBlogPost = async () => {
    if (!newPost.title || !newPost.content || !newPost.excerpt) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const postData = {
        ...newPost,
        publishedDate: newPost.publishedDate || new Date().toISOString(),
        tags: newPost.tags || [],
        published: newPost.published || false
      }

      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })

      if (response.ok) {
        await loadBlogPosts()
        setNewPost({})
        alert('Blog post created successfully!')
      }
    } catch (error) {
      console.error('Failed to save blog post:', error)
      alert('Failed to save blog post')
    }
  }

  const updateBlogPost = async () => {
    if (!editingPost) return

    try {
      const response = await fetch('/api/admin/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPost)
      })

      if (response.ok) {
        await loadBlogPosts()
        setEditingPost(null)
        alert('Blog post updated successfully!')
      }
    } catch (error) {
      console.error('Failed to update blog post:', error)
      alert('Failed to update blog post')
    }
  }

  const deleteBlogPost = async (id: string) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      try {
        const response = await fetch(`/api/admin/blog?id=${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          await loadBlogPosts()
          alert('Blog post deleted successfully!')
        }
      } catch (error) {
        console.error('Failed to delete blog post:', error)
        alert('Failed to delete blog post')
      }
    }
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading blog posts...</div>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Back to Admin Link */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>

          {/* Header */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-8 mb-6">
            <h1 className="text-4xl font-bold text-gray-900">Blog Management</h1>
            <p className="text-gray-600 mt-2">Create and manage blog posts for Design-Rite</p>
          </div>

          {/* Blog Topic Ideas */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 Blog Content Ideas</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { category: "Problem-Focused", color: "red", ideas: [
                  "The 3 AM Email: When Clients Change Everything",
                  "Death by a Thousand Assumptions",
                  "The Compliance Nightmare: FERPA, HIPAA & You",
                  "When Your BOM Becomes Your Enemy"
                ]},
                { category: "Solution-Focused", color: "green", ideas: [
                  "5 Signs Your Security Estimate is Dead Wrong",
                  "The AI Advantage: From Days to Minutes",
                  "Compliance Made Simple: Templates That Actually Work",
                  "Virtual Site Walks: The Future is Here"
                ]},
                { category: "Industry-Specific", color: "blue", ideas: [
                  "School Security: Beyond the Buzzwords",
                  "Healthcare Security: Patient Privacy First",
                  "Enterprise vs. SMB: Two Different Worlds"
                ]},
                { category: "Behind-the-Scenes", color: "purple", ideas: [
                  "Building Design-Rite: A Sales Engineer's Perspective",
                  "Real Talk: 3,000+ Products Later",
                  "Customer Spotlight: From Chaos to Calm"
                ]},
                { category: "Actionable Tips", color: "yellow", ideas: [
                  "The Ultimate RFP Response Checklist",
                  "Pricing Intelligence: Reading Between the Lines",
                  "10 Questions Every Security Assessment Must Ask"
                ]}
              ].map((section) => (
                <div key={section.category} className={`bg-${section.color}-50 border border-${section.color}-200 rounded-lg p-4`}>
                  <h3 className={`text-${section.color}-700 font-bold mb-3 text-sm uppercase tracking-wider`}>{section.category}</h3>
                  <ul className="space-y-2">
                    {section.ideas.map((idea, index) => (
                      <li key={index} className="text-gray-700 text-sm leading-relaxed hover:text-indigo-600 transition-colors cursor-pointer"
                          onClick={() => setNewPost({...newPost, title: idea})}>
                        • {idea}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-gray-900 font-semibold mb-2">💡 Pro Tips:</h3>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• <strong>Frequency:</strong> 2-3 posts/month for consistent engagement</li>
                <li>• <strong>Length:</strong> 800-1200 words for SEO optimization</li>
                <li>• <strong>Style:</strong> Keep the emotional, relatable tone from "Tuesday Morning Storm"</li>
                <li>• <strong>CTAs:</strong> Always include links to Security Estimate and AI Assessment</li>
              </ul>
            </div>
          </div>

          {/* Create New Blog Post */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Blog Post</h2>
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Post Title"
                  value={newPost.title || ''}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600"
                />
                <input
                  type="text"
                  placeholder="Author"
                  value={newPost.author || ''}
                  onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                  className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600"
                />
              </div>
              <textarea
                placeholder="Post Excerpt/Summary"
                value={newPost.excerpt || ''}
                onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                rows={3}
                className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600 resize-none"
              />
              <textarea
                placeholder="Post Content (HTML/Markdown supported)"
                value={newPost.content || ''}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={8}
                className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600 resize-none"
              />
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="url"
                  placeholder="Video URL (YouTube, etc.)"
                  value={newPost.videoUrl || ''}
                  onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value })}
                  className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600"
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={newPost.tags?.join(', ') || ''}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}
                  className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPost.published || false}
                    onChange={(e) => setNewPost({ ...newPost, published: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 bg-gray-50 border-gray-300 rounded focus:ring-indigo-600"
                  />
                  <span className="text-gray-900">Publish immediately</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const imagePath = await handleBlogImageUpload(file)
                      if (imagePath) {
                        setNewPost({ ...newPost, featuredImage: imagePath })
                      }
                    }
                  }}
                  className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
                {uploadingBlogImage && <span className="text-indigo-600">Uploading...</span>}
              </div>
              {newPost.featuredImage && (
                <div className="flex items-center gap-4">
                  <Image
                    src={newPost.featuredImage}
                    alt="Featured Image"
                    width={100}
                    height={60}
                    className="rounded-lg object-cover"
                  />
                  <button
                    onClick={() => setNewPost({ ...newPost, featuredImage: '' })}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove Image
                  </button>
                </div>
              )}
              <button
                onClick={saveBlogPost}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Create Blog Post
              </button>
            </div>
          </div>

          {/* Existing Blog Posts */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Existing Blog Posts ({blogPosts.length})</h2>
            {blogPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <p>No blog posts yet. Create your first post above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {blogPosts.map((post) => (
                  <div key={post.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                        <p className="text-gray-600 text-sm">
                          By {post.author} • {new Date(post.publishedDate).toLocaleDateString()}
                          {post.published ? (
                            <span className="ml-2 inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Published</span>
                          ) : (
                            <span className="ml-2 inline-block bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">Draft</span>
                          )}
                        </p>
                        <p className="text-gray-700 text-sm mt-2">{post.excerpt}</p>
                        {post.tags.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {post.tags.map((tag, index) => (
                              <span key={index} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {post.featuredImage && (
                        <Image
                          src={post.featuredImage}
                          alt={post.title}
                          width={80}
                          height={50}
                          className="rounded-lg object-cover ml-4"
                        />
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setEditingPost(post)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteBlogPost(post.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Blog Post Modal */}
          {editingPost && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Blog Post</h2>
                <div className="grid gap-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Post Title"
                      value={editingPost.title}
                      onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                      className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600"
                    />
                    <input
                      type="text"
                      placeholder="Author"
                      value={editingPost.author}
                      onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                      className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <textarea
                    placeholder="Post Excerpt/Summary"
                    value={editingPost.excerpt}
                    onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                    rows={3}
                    className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600 resize-none"
                  />
                  <textarea
                    placeholder="Post Content"
                    value={editingPost.content}
                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                    rows={8}
                    className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600 resize-none"
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="url"
                      placeholder="Video URL"
                      value={editingPost.videoUrl}
                      onChange={(e) => setEditingPost({ ...editingPost, videoUrl: e.target.value })}
                      className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600"
                    />
                    <input
                      type="text"
                      placeholder="Tags (comma separated)"
                      value={editingPost.tags.join(', ')}
                      onChange={(e) => setEditingPost({ ...editingPost, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}
                      className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingPost.published}
                        onChange={(e) => setEditingPost({ ...editingPost, published: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 bg-gray-50 border-gray-300 rounded focus:ring-indigo-600"
                      />
                      <span className="text-gray-900">Published</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={updateBlogPost}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Update Post
                    </button>
                    <button
                      onClick={() => setEditingPost(null)}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}
