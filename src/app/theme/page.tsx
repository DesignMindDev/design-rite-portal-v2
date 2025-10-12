'use client'

import { useState } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import {
  Upload,
  RotateCcw,
  Save,
  Palette,
  Check
} from 'lucide-react'
import { toast } from 'sonner'

export default function ThemePage() {
  const [logo, setLogo] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#5f7df7')
  const [secondaryColor, setSecondaryColor] = useState('#f75585')
  const [accentColor, setAccentColor] = useState('#ffffff')

  const presetThemes = [
    {
      name: 'Purple Gradient',
      primary: '#5f7df7',
      secondary: '#f75585',
      accent: '#ffffff'
    },
    {
      name: 'Ocean Blue',
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      accent: '#ffffff'
    },
    {
      name: 'Forest Green',
      primary: '#10b981',
      secondary: '#059669',
      accent: '#ffffff'
    },
    {
      name: 'Sunset Orange',
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#ffffff'
    },
    {
      name: 'Dark Mode',
      primary: '#1f2937',
      secondary: '#374151',
      accent: '#f3f4f6'
    }
  ]

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setLogo(reader.result as string)
        toast.success('Logo uploaded successfully')
      }
      reader.readAsDataURL(file)
    }
  }

  const applyPreset = (theme: typeof presetThemes[0]) => {
    setPrimaryColor(theme.primary)
    setSecondaryColor(theme.secondary)
    setAccentColor(theme.accent)
    toast.success(`Applied "${theme.name}" theme`)
  }

  const resetTheme = () => {
    setPrimaryColor('#5f7df7')
    setSecondaryColor('#f75585')
    setAccentColor('#ffffff')
    setLogo(null)
    toast.info('Theme reset to defaults')
  }

  const saveTheme = () => {
    // TODO: Save theme to database/profile
    toast.success('Theme saved successfully!')
    toast.info('Theme customization coming soon!')
  }

  return (
    <ProtectedLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Theme Customization</h1>
          <p className="text-gray-600 text-lg">
            Personalize your platform experience with custom colors and logo
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={resetTheme}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={saveTheme}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity ml-auto"
          >
            <Save className="w-4 h-4" />
            Save Theme
          </button>
        </div>

        {/* Logo Upload */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Logo</h2>
              <p className="text-sm text-gray-500">Upload your personal or company logo</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {logo && (
              <div className="w-32 h-32 border-2 border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 p-4">
                <img src={logo} alt="Logo preview" className="max-w-full max-h-full object-contain" />
              </div>
            )}

            <div className="flex-1">
              <input
                type="file"
                id="logo-upload"
                accept="image/png, image/jpeg, image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Upload className="w-5 h-5" />
                Upload New Logo
              </label>
              <p className="text-sm text-gray-500 mt-2">
                PNG, JPG, SVG up to 2MB. Recommended: 200x200px
              </p>
            </div>
          </div>
        </div>

        {/* Color Customization */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Colors</h2>
              <p className="text-sm text-gray-500">Customize your theme colors</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Primary Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div
                  className="w-12 h-12 rounded-lg border border-gray-300"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Secondary Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-20 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div
                  className="w-12 h-12 rounded-lg border border-gray-300"
                  style={{ backgroundColor: secondaryColor }}
                />
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Accent Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-20 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div
                  className="w-12 h-12 rounded-lg border border-gray-300"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preset Themes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Preset Themes</h3>
          <p className="text-sm text-gray-500 mb-6">Quick start with pre-designed color schemes</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presetThemes.map((theme, index) => (
              <button
                key={index}
                onClick={() => applyPreset(theme)}
                className="group relative bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-primary transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 rounded-md border border-gray-300"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded-md border border-gray-300"
                      style={{ backgroundColor: theme.secondary }}
                    />
                    <div
                      className="w-6 h-6 rounded-md border border-gray-300"
                      style={{ backgroundColor: theme.accent }}
                    />
                  </div>
                  {primaryColor === theme.primary &&
                   secondaryColor === theme.secondary &&
                   accentColor === theme.accent && (
                    <div className="ml-auto w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                </div>
                <p className="font-semibold text-gray-900 text-left group-hover:text-primary transition-colors">
                  {theme.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Preview Section (Optional - Coming Soon) */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Theme Preview Coming Soon
          </h3>
          <p className="text-blue-700 text-sm">
            We're working on a live preview feature so you can see your theme changes in real-time before saving.
          </p>
        </div>
      </div>
    </ProtectedLayout>
  )
}
