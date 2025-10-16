'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ProtectedLayout from '@/components/ProtectedLayout'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  role: string
  description: string
  imagePath: string
  initials: string
  href?: string
}

export default function AboutTeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({})
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    try {
      const response = await fetch('/api/admin/team')
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data)
      }
    } catch (error) {
      console.error('Failed to load team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (file: File, memberId?: string) => {
    setUploadingPhoto(true)
    const formData = new FormData()
    formData.append('photo', file)
    if (memberId) formData.append('memberId', memberId)

    try {
      const response = await fetch('/api/admin/upload-photo', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (memberId) {
          setTeamMembers(prev => prev.map(member =>
            member.id === memberId
              ? { ...member, imagePath: data.imagePath }
              : member
          ))
        }
        return data.imagePath
      }
    } catch (error) {
      console.error('Failed to upload photo:', error)
      alert('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const saveTeamMember = async (member: TeamMember) => {
    try {
      const response = await fetch('/api/admin/team', {
        method: member.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Team member saved successfully:', result)
        loadTeamMembers()
        setEditingMember(null)
        setNewMember({})
        alert(`Team member ${member.id ? 'updated' : 'added'} successfully!`)
      } else {
        const errorData = await response.json()
        console.error('Failed to save team member:', errorData)
        alert(`Failed to save team member: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to save team member:', error)
      alert(`Failed to save team member: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const deleteTeamMember = async (id: string) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      try {
        const response = await fetch(`/api/admin/team?id=${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          loadTeamMembers()
          alert('Team member deleted successfully!')
        } else {
          const errorData = await response.json()
          console.error('Failed to delete team member:', errorData)
          alert(`Failed to delete team member: ${errorData.error || response.statusText}`)
        }
      } catch (error) {
        console.error('Failed to delete team member:', error)
        alert(`Failed to delete team member: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading team members...</div>
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
            <h1 className="text-4xl font-bold text-gray-900">About Us - Team Management</h1>
            <p className="text-gray-600 mt-2">Manage public-facing team profiles for the About Us page</p>
          </div>

          {/* Add New Member */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Team Member</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={newMember.name || ''}
                onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Role"
                value={newMember.role || ''}
                onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Initials (optional - auto-generated if empty)"
                value={newMember.initials || ''}
                onChange={(e) => setNewMember(prev => ({ ...prev, initials: e.target.value }))}
                className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="url"
                placeholder="Website URL (optional)"
                value={newMember.href || ''}
                onChange={(e) => setNewMember(prev => ({ ...prev, href: e.target.value }))}
                className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <textarea
                placeholder="Description"
                value={newMember.description || ''}
                onChange={(e) => {
                  setNewMember(prev => ({ ...prev, description: e.target.value }))
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.max(96, e.target.scrollHeight) + 'px'
                }}
                className="md:col-span-2 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[96px] resize-none overflow-hidden"
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const imagePath = await handlePhotoUpload(file)
                      if (imagePath) {
                        setNewMember(prev => ({ ...prev, imagePath }))
                      }
                    }
                  }}
                  disabled={uploadingPhoto}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 disabled:opacity-50"
                />
                {uploadingPhoto && <p className="text-indigo-600 text-sm mt-2">Uploading photo...</p>}
              </div>
              <button
                onClick={() => saveTeamMember({
                  ...newMember,
                  id: '',
                  imagePath: newMember.imagePath || `/team/placeholder.jpg`,
                  initials: newMember.initials || ''
                } as TeamMember)}
                disabled={!newMember.name || !newMember.role}
                className="md:col-span-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Team Member
              </button>
            </div>
          </div>

          {/* Existing Team Members */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Team Members</h2>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">👥</div>
                <p>No team members yet. Add your first team member above!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {teamMembers.map((member) => (
                  <div key={member.id} className="bg-gray-50 rounded-lg p-4">
                    {editingMember?.id === member.id ? (
                      /* Edit Mode */
                      <div className="grid md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Name"
                          value={editingMember.name || ''}
                          onChange={(e) => setEditingMember(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                          className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Role"
                          value={editingMember.role || ''}
                          onChange={(e) => setEditingMember(prev => prev ? ({ ...prev, role: e.target.value }) : null)}
                          className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Initials"
                          value={editingMember.initials || ''}
                          onChange={(e) => setEditingMember(prev => prev ? ({ ...prev, initials: e.target.value }) : null)}
                          className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="url"
                          placeholder="Website URL (optional)"
                          value={editingMember.href || ''}
                          onChange={(e) => setEditingMember(prev => prev ? ({ ...prev, href: e.target.value }) : null)}
                          className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <textarea
                          placeholder="Description"
                          value={editingMember.description || ''}
                          onChange={(e) => {
                            setEditingMember(prev => prev ? ({ ...prev, description: e.target.value }) : null)
                            e.target.style.height = 'auto'
                            e.target.style.height = Math.max(96, e.target.scrollHeight) + 'px'
                          }}
                          className="md:col-span-2 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[96px] resize-none overflow-hidden"
                        />
                        <div className="md:col-span-2 flex gap-2">
                          <button
                            onClick={() => {
                              saveTeamMember(editingMember)
                              setEditingMember(null)
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditingMember(null)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="flex items-start gap-4">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          {member.imagePath ? (
                            <Image
                              src={member.imagePath}
                              alt={member.name}
                              width={64}
                              height={64}
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold">
                              {member.initials}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                          <p className="text-indigo-600">{member.role}</p>
                          <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap break-words">{member.description}</p>
                          {member.href && (
                            <a
                              href={member.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm mt-1 inline-block"
                            >
                              🔗 Website
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                await handlePhotoUpload(file, member.id)
                              }
                            }}
                            className="hidden"
                            id={`photo-${member.id}`}
                          />
                          <label
                            htmlFor={`photo-${member.id}`}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors cursor-pointer"
                          >
                            Upload Photo
                          </label>
                          <button
                            onClick={() => setEditingMember(member)}
                            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteTeamMember(member.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
