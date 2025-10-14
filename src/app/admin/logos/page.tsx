'use client'

import { useAuth } from '@/hooks/useAuth'
import ProtectedLayout from '@/components/ProtectedLayout'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Palette, Upload, Download, Image as ImageIcon, Droplets, CheckCircle } from 'lucide-react'

interface BrandColors {
  primary: string
  secondary: string
  accent: string
  background: string
}

interface LogoAsset {
  name: string
  size: string
  format: string
  dimensions: string
}

export default function LogosBrandingPage() {
  const { isEmployee, loading, user, userRole } = useAuth()
  const router = useRouter()
  const [brandColors, setBrandColors] = useState<BrandColors>({
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    background: '#f9fafb'
  })
  const [logoAssets, setLogoAssets] = useState<LogoAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Redirect non-employees
  useEffect(() => {
    if (!loading && user && userRole && !isEmployee) {
      console.log('[Logos & Branding] User is not an employee, redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [isEmployee, loading, user, userRole, router])

  // Load mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLogoAssets([
        {
          name: 'design-rite-logo-primary.svg',
          size: '24 KB',
          format: 'SVG',
          dimensions: 'Vector'
        },
        {
          name: 'design-rite-logo-white.svg',
          size: '22 KB',
          format: 'SVG',
          dimensions: 'Vector'
        },
        {
          name: 'design-rite-icon.svg',
          size: '8 KB',
          format: 'SVG',
          dimensions: 'Vector'
        },
        {
          name: 'design-rite-logo-primary.png',
          size: '156 KB',
          format: 'PNG',
          dimensions: '2400x800'
        },
        {
          name: 'design-rite-logo-white.png',
          size: '148 KB',
          format: 'PNG',
          dimensions: '2400x800'
        },
        {
          name: 'design-rite-icon.png',
          size: '64 KB',
          format: 'PNG',
          dimensions: '512x512'
        }
      ])
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // Show loading while auth or role is loading
  if (loading || (user && !userRole)) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Logos & Branding...</p>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  // Only show "return null" if we've confirmed they're not an employee
  if (userRole && !isEmployee) {
    return null
  }

  const handleColorChange = (colorKey: keyof BrandColors, value: string) => {
    setBrandColors(prev => ({
      ...prev,
      [colorKey]: value
    }))
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
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
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Logos & Branding</h1>
                <p className="text-gray-600 mt-1">Manage company branding assets and color schemes</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading branding assets...</p>
            </div>
          ) : (
            <>
              {/* Logo Upload Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Company Logo Upload</h2>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">Drop your logo here</p>
                  <p className="text-sm text-gray-600 mb-4">or click to browse files</p>
                  <p className="text-xs text-gray-500">Supports: PNG, JPG, SVG (Max 5MB)</p>
                </div>
              </div>

              {/* Brand Color Picker */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Brand Colors</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandColors.primary}
                        onChange={(e) => handleColorChange('primary', e.target.value)}
                        className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-200"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={brandColors.primary}
                          onChange={(e) => handleColorChange('primary', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandColors.secondary}
                        onChange={(e) => handleColorChange('secondary', e.target.value)}
                        className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-200"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={brandColors.secondary}
                          onChange={(e) => handleColorChange('secondary', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandColors.accent}
                        onChange={(e) => handleColorChange('accent', e.target.value)}
                        className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-200"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={brandColors.accent}
                          onChange={(e) => handleColorChange('accent', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Background
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandColors.background}
                        onChange={(e) => handleColorChange('background', e.target.value)}
                        className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-200"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={brandColors.background}
                          onChange={(e) => handleColorChange('background', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 shadow-lg">
                    <CheckCircle className="w-5 h-5" />
                    Save Color Scheme
                  </button>
                </div>
              </div>

              {/* Logo Preview Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Logo Preview</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Light Background Preview */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Light Background</p>
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-12 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-48 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-2">
                          LOGO
                        </div>
                        <p className="text-xs text-gray-500">Design-Rite Corp</p>
                      </div>
                    </div>
                  </div>

                  {/* Dark Background Preview */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Dark Background</p>
                    <div className="bg-gray-900 border-2 border-gray-700 rounded-xl p-12 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-48 h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-2">
                          LOGO
                        </div>
                        <p className="text-xs text-gray-400">Design-Rite Corp</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Branding Assets */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Download Branding Assets</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {logoAssets.map((asset, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{asset.name}</p>
                          <p className="text-xs text-gray-600">
                            {asset.format} • {asset.size} • {asset.dimensions}
                          </p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-center">
                  <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg">
                    <Download className="w-5 h-5" />
                    Download All Assets (ZIP)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}
