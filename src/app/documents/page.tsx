'use client'

import { useState } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import {
  Upload,
  FileText,
  File,
  Image,
  Download,
  Eye,
  Trash2,
  DollarSign,
  FileCheck,
  Folder,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface Document {
  id: string
  name: string
  type: 'pricing' | 'proposal' | 'general'
  file_type: string
  size: number
  uploaded_at: string
  url: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFileUpload = async (files: FileList | null, type: 'pricing' | 'proposal' | 'general') => {
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      // TODO: Implement actual file upload to Supabase storage
      // For now, simulate upload
      await new Promise(resolve => setTimeout(resolve, 1500))

      const newDocs: Document[] = Array.from(files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type,
        file_type: file.type,
        size: file.size,
        uploaded_at: new Date().toISOString(),
        url: URL.createObjectURL(file)
      }))

      setDocuments([...documents, ...newDocs])
      toast.success(`${files.length} file(s) uploaded successfully!`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent, type: 'pricing' | 'proposal' | 'general') => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files, type)
    }
  }

  const handleDelete = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id))
    toast.success('Document deleted')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const uploadSections = [
    {
      type: 'pricing' as const,
      icon: DollarSign,
      title: 'Pricing/Services Document',
      description: 'Upload your pricing list or services catalog',
      acceptedFormats: '.pdf, .doc, .docx, .txt, .csv, .xlsx',
      color: 'from-green-500 to-green-600',
      borderColor: 'border-green-200'
    },
    {
      type: 'proposal' as const,
      icon: FileCheck,
      title: 'Proposal Templates',
      description: 'Upload example proposals for AI generation',
      acceptedFormats: '.pdf, .doc, .docx',
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      type: 'general' as const,
      icon: Folder,
      title: 'General Documents',
      description: 'Upload documents for AI analysis',
      acceptedFormats: '.pdf, .doc, .docx, .txt, .jpg, .jpeg, .png',
      color: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-200'
    }
  ]

  return (
    <ProtectedLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Document Manager</h1>
          <p className="text-gray-600 text-lg">
            Upload and manage your documents for AI-powered analysis and processing
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                How Document Manager Works
              </h3>
              <p className="text-blue-700 text-sm leading-relaxed">
                Upload your pricing documents, proposal templates, and other files to enable AI-powered features throughout the platform.
                Your <strong>pricing documents</strong> help generate accurate invoices, <strong>proposal templates</strong> maintain your brand consistency,
                and <strong>general documents</strong> can be analyzed by AI for insights and automation.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Sections - All 3 Displayed */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {uploadSections.map((section) => {
            const Icon = section.icon
            const docCount = documents.filter(d => d.type === section.type).length

            return (
              <div key={section.type} className={`bg-white rounded-xl border-2 ${section.borderColor} p-6 shadow-sm flex flex-col`}>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Drag & Drop Upload Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={(e) => handleDrop(e, section.type)}
                  className={`flex-1 border-2 border-dashed rounded-xl p-6 transition-all ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-3">
                      Drag & drop or click
                    </p>
                    <input
                      type="file"
                      id={`file-upload-${section.type}`}
                      multiple
                      accept={section.acceptedFormats}
                      onChange={(e) => handleFileUpload(e.target.files, section.type)}
                      className="hidden"
                      disabled={uploading}
                    />
                    <label
                      htmlFor={`file-upload-${section.type}`}
                      className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${section.color} text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer ${
                        uploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Browse'}
                    </label>
                    <p className="text-xs text-gray-500 mt-3">
                      {section.acceptedFormats}
                    </p>
                  </div>
                </div>

                {/* Document count for this type */}
                <div className="mt-4 text-center">
                  <span className="text-sm font-medium text-gray-600">
                    {docCount} uploaded
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Documents List - Show All */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">
              All Uploaded Documents ({documents.length})
            </h3>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                No documents uploaded yet
              </h4>
              <p className="text-gray-500">
                Upload your first document using the form above
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-6 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* File Icon */}
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {doc.file_type.includes('image') ? (
                          <Image className="w-6 h-6 text-gray-600" />
                        ) : (
                          <File className="w-6 h-6 text-gray-600" />
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {doc.name}
                          </h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            doc.type === 'pricing' ? 'bg-green-100 text-green-700' :
                            doc.type === 'proposal' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {doc.type === 'pricing' ? 'Pricing' : doc.type === 'proposal' ? 'Proposal' : 'General'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>•</span>
                          <span>
                            {new Date(doc.uploaded_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => window.open(doc.url, '_blank')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="View document"
                      >
                        <Eye className="w-5 h-5 text-gray-600" />
                      </button>
                      <a
                        href={doc.url}
                        download={doc.name}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Download document"
                      >
                        <Download className="w-5 h-5 text-gray-600" />
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}
