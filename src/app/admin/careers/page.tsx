'use client'

import { useState, useEffect } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import { Plus, Edit2, Trash2, Eye, EyeOff, Briefcase, MapPin, Clock, DollarSign } from 'lucide-react'

interface CareerPosting {
  id: string
  title: string
  department: string
  location: string
  type: string
  description: string
  responsibilities: string[]
  requirements: string[]
  niceToHave: string[]
  salary_range: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function CareerManagementPage() {
  const [postings, setPostings] = useState<CareerPosting[]>([])
  const [editingPosting, setEditingPosting] = useState<CareerPosting | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState<Partial<CareerPosting>>({
    title: '',
    department: '',
    location: 'Remote',
    type: 'Full-time',
    description: '',
    responsibilities: [''],
    requirements: [''],
    niceToHave: [''],
    salary_range: '',
    is_active: true
  })

  useEffect(() => {
    loadPostings()
  }, [])

  const loadPostings = async () => {
    try {
      const response = await fetch('/api/admin/careers')
      if (response.ok) {
        const data = await response.json()
        setPostings(data)
      }
    } catch (error) {
      console.error('Failed to load career postings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CareerPosting, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayFieldChange = (field: 'responsibilities' | 'requirements' | 'niceToHave', index: number, value: string) => {
    const newArray = [...(formData[field] || [])]
    newArray[index] = value
    setFormData(prev => ({ ...prev, [field]: newArray }))
  }

  const addArrayField = (field: 'responsibilities' | 'requirements' | 'niceToHave') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }))
  }

  const removeArrayField = (field: 'responsibilities' | 'requirements' | 'niceToHave', index: number) => {
    const newArray = [...(formData[field] || [])]
    newArray.splice(index, 1)
    setFormData(prev => ({ ...prev, [field]: newArray }))
  }

  const handleSave = async () => {
    try {
      // Filter out empty array items
      const cleanedData = {
        ...formData,
        responsibilities: formData.responsibilities?.filter(r => r.trim()) || [],
        requirements: formData.requirements?.filter(r => r.trim()) || [],
        niceToHave: formData.niceToHave?.filter(r => r.trim()) || []
      }

      const method = editingPosting ? 'PUT' : 'POST'
      const response = await fetch('/api/admin/careers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData)
      })

      if (response.ok) {
        await loadPostings()
        handleCancel()
      }
    } catch (error) {
      console.error('Failed to save career posting:', error)
    }
  }

  const handleEdit = (posting: CareerPosting) => {
    setEditingPosting(posting)
    setFormData(posting)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this career posting?')) return

    try {
      const response = await fetch(`/api/admin/careers?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadPostings()
      }
    } catch (error) {
      console.error('Failed to delete career posting:', error)
    }
  }

  const toggleActive = async (posting: CareerPosting) => {
    try {
      const response = await fetch('/api/admin/careers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...posting,
          is_active: !posting.is_active
        })
      })

      if (response.ok) {
        await loadPostings()
      }
    } catch (error) {
      console.error('Failed to toggle active status:', error)
    }
  }

  const handleCancel = () => {
    setEditingPosting(null)
    setShowForm(false)
    setFormData({
      title: '',
      department: '',
      location: 'Remote',
      type: 'Full-time',
      description: '',
      responsibilities: [''],
      requirements: [''],
      niceToHave: [''],
      salary_range: '',
      is_active: true
    })
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Career Postings</h1>
                <p className="text-gray-600">Manage job listings displayed on design-rite.com/careers</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add New Posting
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-gray-900">{postings.length}</div>
              <div className="text-gray-600 text-sm mt-1">Total Postings</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-green-600">
                {postings.filter(p => p.is_active).length}
              </div>
              <div className="text-gray-600 text-sm mt-1">Active</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-gray-400">
                {postings.filter(p => !p.is_active).length}
              </div>
              <div className="text-gray-600 text-sm mt-1">Inactive</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-purple-600">
                {[...new Set(postings.map(p => p.department))].length}
              </div>
              <div className="text-gray-600 text-sm mt-1">Departments</div>
            </div>
          </div>

          {/* Career Postings List */}
          {!showForm && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">All Career Postings</h2>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="text-gray-400">Loading postings...</div>
                </div>
              ) : postings.length === 0 ? (
                <div className="p-12 text-center">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <div className="text-gray-600 mb-2">No career postings yet</div>
                  <div className="text-gray-400 text-sm">Click "Add New Posting" to create your first job listing</div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {postings.map((posting) => (
                    <div key={posting.id} className="p-6 hover:bg-gray-50 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{posting.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              posting.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {posting.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {posting.department}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {posting.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {posting.type}
                            </div>
                            {posting.salary_range && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {posting.salary_range}
                              </div>
                            )}
                          </div>

                          <p className="text-gray-700 line-clamp-2">{posting.description}</p>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => toggleActive(posting)}
                            className={`p-2 rounded-lg transition-all ${
                              posting.is_active
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={posting.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {posting.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => handleEdit(posting)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(posting.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create/Edit Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingPosting ? 'Edit Career Posting' : 'Create New Career Posting'}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Engineering, Sales"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                    <select
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                    <input
                      type="text"
                      value={formData.salary_range}
                      onChange={(e) => handleInputChange('salary_range', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., $100,000 - $150,000"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label className="text-sm font-medium text-gray-700">Active (visible on careers page)</label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Brief overview of the role..."
                  />
                </div>

                {/* Responsibilities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Responsibilities</label>
                  <div className="space-y-2">
                    {formData.responsibilities?.map((resp, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={resp}
                          onChange={(e) => handleArrayFieldChange('responsibilities', index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., Design and implement new features"
                        />
                        <button
                          onClick={() => removeArrayField('responsibilities', index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addArrayField('responsibilities')}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      + Add Responsibility
                    </button>
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                  <div className="space-y-2">
                    {formData.requirements?.map((req, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={req}
                          onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., 5+ years of experience"
                        />
                        <button
                          onClick={() => removeArrayField('requirements', index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addArrayField('requirements')}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      + Add Requirement
                    </button>
                  </div>
                </div>

                {/* Nice to Have */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nice to Have</label>
                  <div className="space-y-2">
                    {formData.niceToHave?.map((nice, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={nice}
                          onChange={(e) => handleArrayFieldChange('niceToHave', index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., Experience with specific technologies"
                        />
                        <button
                          onClick={() => removeArrayField('niceToHave', index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addArrayField('niceToHave')}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      + Add Nice to Have
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all font-semibold"
                  >
                    {editingPosting ? 'Update Posting' : 'Create Posting'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}
