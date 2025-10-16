'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ProtectedLayout from '@/components/ProtectedLayout'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface SiteSettings {
  logoPath: string
  footerLogoPath: string
  demoVideoUrl: string
}

export default function SiteLogoManagementPage() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    logoPath: '',
    footerLogoPath: '',
    demoVideoUrl: ''
  })
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSiteSettings()
  }, [])

  const loadSiteSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSiteSettings(data)
      }
    } catch (error) {
      console.error('Failed to load site settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (file: File, type: 'header' | 'footer') => {
    setUploadingLogo(true)
    const formData = new FormData()
    formData.append('logo', file)
    formData.append('type', type)

    try {
      const response = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSiteSettings(prev => ({
          ...prev,
          [type === 'header' ? 'logoPath' : 'footerLogoPath']: data.logoPath
        }))
        alert(`${type === 'header' ? 'Header' : 'Footer'} logo uploaded successfully!`)
      } else {
        const errorData = await response.json()
        alert(`Failed to upload logo: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Failed to upload logo:', error)
      alert('Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading logos...</div>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
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
            <h1 className="text-4xl font-bold text-gray-900">Site Logo Management</h1>
            <p className="text-gray-600 mt-2">Manage header and footer logos for the website</p>
          </div>

          {/* Header Logo */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Header Logo</h2>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                {siteSettings.logoPath ? (
                  <Image
                    src={siteSettings.logoPath}
                    alt="Header Logo"
                    width={128}
                    height={128}
                    className="rounded-lg object-contain"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">No Logo</span>
                )}
              </div>
              <div className="flex-1">
                <label className="block">
                  <span className="sr-only">Choose header logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleLogoUpload(file, 'header')
                    }}
                    disabled={uploadingLogo}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 disabled:opacity-50"
                  />
                </label>
                <p className="text-gray-500 text-sm mt-2">Recommended: 200x50px, PNG format</p>
                {uploadingLogo && <p className="text-indigo-600 text-sm mt-2">Uploading...</p>}
              </div>
            </div>
          </div>

          {/* Footer Logo */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Footer Logo</h2>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                {siteSettings.footerLogoPath ? (
                  <Image
                    src={siteSettings.footerLogoPath}
                    alt="Footer Logo"
                    width={128}
                    height={128}
                    className="rounded-lg object-contain"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">No Logo</span>
                )}
              </div>
              <div className="flex-1">
                <label className="block">
                  <span className="sr-only">Choose footer logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleLogoUpload(file, 'footer')
                    }}
                    disabled={uploadingLogo}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 disabled:opacity-50"
                  />
                </label>
                <p className="text-gray-500 text-sm mt-2">Recommended: 100x25px, PNG format</p>
                {uploadingLogo && <p className="text-indigo-600 text-sm mt-2">Uploading...</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
