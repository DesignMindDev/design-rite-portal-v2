'use client'

import { useState } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import {
  FileText,
  Sparkles,
  Download,
  Save,
  Copy,
  Trash2,
  Edit3,
  CheckCircle,
  Shield,
  Building,
  FileCheck,
  Award,
  Lock,
  Send,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'

interface Template {
  id: string
  name: string
  category: string
  icon: any
  description: string
  fields: string[]
}

interface Document {
  id: string
  templateId: string
  templateName: string
  title: string
  content: string
  status: 'draft' | 'review' | 'final'
  createdAt: string
  updatedAt: string
}

export default function DocumentTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiAssistant, setShowAiAssistant] = useState(false)

  const templates: Template[] = [
    {
      id: 'iso-compliance',
      name: 'ISO 27001 Compliance Response',
      category: 'Security Compliance',
      icon: Shield,
      description: 'Comprehensive ISO 27001 information security compliance documentation',
      fields: ['Organization Overview', 'Security Controls', 'Risk Management', 'Audit Trail', 'Certification Status']
    },
    {
      id: 'soc2-response',
      name: 'SOC 2 Type II Response',
      category: 'Security Compliance',
      icon: Lock,
      description: 'SOC 2 Type II compliance response template with security controls matrix',
      fields: ['Trust Services Criteria', 'Control Environment', 'Monitoring Activities', 'System Description', 'Report Period']
    },
    {
      id: 'rfp-response',
      name: 'RFP/RFQ Response Template',
      category: 'Proposals',
      icon: FileText,
      description: 'Professional RFP response with technical specifications and pricing',
      fields: ['Executive Summary', 'Technical Approach', 'Qualifications', 'Pricing', 'References', 'Timeline']
    },
    {
      id: 'security-submittal',
      name: 'Security System Submittal',
      category: 'Technical Submittals',
      icon: FileCheck,
      description: 'Detailed security system submittal package with equipment specifications',
      fields: ['Project Overview', 'Equipment List', 'Technical Specifications', 'Installation Details', 'Testing Procedures']
    },
    {
      id: 'compliance-matrix',
      name: 'Compliance Requirements Matrix',
      category: 'Compliance',
      icon: CheckCircle,
      description: 'Comprehensive compliance requirements tracking and verification matrix',
      fields: ['Requirement ID', 'Description', 'Compliance Status', 'Evidence', 'Notes', 'Responsible Party']
    },
    {
      id: 'vendor-questionnaire',
      name: 'Vendor Security Questionnaire',
      category: 'Due Diligence',
      icon: Building,
      description: 'Security assessment questionnaire for vendor evaluation',
      fields: ['Company Information', 'Security Practices', 'Data Protection', 'Incident Response', 'Certifications']
    },
    {
      id: 'certification-statement',
      name: 'Certification & Accreditation Statement',
      category: 'Certifications',
      icon: Award,
      description: 'Professional certification and accreditation documentation',
      fields: ['Certifications Held', 'Accreditation Bodies', 'Validity Periods', 'Supporting Documentation']
    }
  ]

  const handleCreateDocument = (template: Template) => {
    const newDoc: Document = {
      id: Date.now().toString(),
      templateId: template.id,
      templateName: template.name,
      title: `New ${template.name}`,
      content: generateTemplateContent(template),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setDocuments([newDoc, ...documents])
    setCurrentDocument(newDoc)
    setSelectedTemplate(null)
    toast.success('Document created from template!')
  }

  const generateTemplateContent = (template: Template): string => {
    return `# ${template.name}\n\n` +
      template.fields.map(field => `## ${field}\n\n[Enter ${field.toLowerCase()} here]\n\n`).join('')
  }

  const handleAiEnhance = async () => {
    if (!currentDocument || !aiPrompt.trim()) {
      toast.error('Please enter an AI instruction')
      return
    }

    setIsGenerating(true)

    try {
      // Simulate AI enhancement
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock AI enhancement
      const enhancedContent = currentDocument.content + `\n\n[AI Enhanced Section based on: "${aiPrompt}"]\n\nThis section has been enhanced with professional language, compliance terminology, and industry best practices to meet ${currentDocument.templateName} requirements.\n`

      setCurrentDocument({
        ...currentDocument,
        content: enhancedContent,
        updatedAt: new Date().toISOString()
      })

      const updatedDocs = documents.map(doc =>
        doc.id === currentDocument.id ? { ...currentDocument, content: enhancedContent, updatedAt: new Date().toISOString() } : doc
      )
      setDocuments(updatedDocs)

      setAiPrompt('')
      toast.success('Document enhanced with AI!')
    } catch (error) {
      toast.error('AI enhancement failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDocument = () => {
    if (!currentDocument) return

    const updatedDocs = documents.map(doc =>
      doc.id === currentDocument.id ? currentDocument : doc
    )
    setDocuments(updatedDocs)
    toast.success('Document saved!')
  }

  const handleExportPDF = () => {
    if (!currentDocument) return
    toast.success('Exporting to PDF... (Feature coming soon)')
  }

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id))
    if (currentDocument?.id === id) {
      setCurrentDocument(null)
    }
    toast.success('Document deleted')
  }

  const handleStatusChange = (status: 'draft' | 'review' | 'final') => {
    if (!currentDocument) return

    const updated = { ...currentDocument, status, updatedAt: new Date().toISOString() }
    setCurrentDocument(updated)

    const updatedDocs = documents.map(doc =>
      doc.id === currentDocument.id ? updated : doc
    )
    setDocuments(updatedDocs)
    toast.success(`Status changed to ${status}`)
  }

  return (
    <ProtectedLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Document Template Builder</h1>
          <p className="text-gray-600 text-lg">
            Create professional compliance documents with AI-powered assistance
          </p>
          <span className="inline-block mt-3 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
            PRO Feature
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Templates & Documents */}
          <div className="lg:col-span-1 space-y-6">
            {/* Template Library */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Template Library
                </h3>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {templates.map((template) => {
                  const Icon = template.icon
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                          <Icon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">{template.name}</h4>
                          <p className="text-xs text-gray-500">{template.category}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Recent Documents */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Your Documents ({documents.length})</h3>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No documents yet. Create one from a template!</p>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all group ${
                        currentDocument?.id === doc.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setCurrentDocument(doc)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm truncate flex-1">{doc.title}</h4>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id) }}
                          className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          doc.status === 'final' ? 'bg-green-100 text-green-700' :
                          doc.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {doc.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Editor */}
          <div className="lg:col-span-2">
            {selectedTemplate ? (
              // Template Preview
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    {(() => {
                      const Icon = selectedTemplate.icon
                      return (
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-indigo-600" />
                        </div>
                      )
                    })()}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedTemplate.name}</h2>
                      <p className="text-gray-600">{selectedTemplate.category}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-6">{selectedTemplate.description}</p>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-indigo-900 mb-3">Included Sections:</h3>
                    <ul className="space-y-2">
                      {selectedTemplate.fields.map((field, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-indigo-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">{field}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleCreateDocument(selectedTemplate)}
                      className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Create Document
                    </button>
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : currentDocument ? (
              // Document Editor
              <div className="space-y-6">
                {/* Editor Toolbar */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <input
                      type="text"
                      value={currentDocument.title}
                      onChange={(e) => setCurrentDocument({ ...currentDocument, title: e.target.value })}
                      className="text-2xl font-bold text-gray-900 border-none outline-none bg-transparent flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveDocument}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export PDF
                    </button>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-sm text-gray-600">Status:</span>
                      <select
                        value={currentDocument.status}
                        onChange={(e) => handleStatusChange(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                      >
                        <option value="draft">Draft</option>
                        <option value="review">Review</option>
                        <option value="final">Final</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Content Editor */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Document Content</h3>
                    <button
                      onClick={() => setShowAiAssistant(!showAiAssistant)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      AI Assistant
                    </button>
                  </div>
                  <div className="p-6">
                    <textarea
                      value={currentDocument.content}
                      onChange={(e) => setCurrentDocument({ ...currentDocument, content: e.target.value })}
                      className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Start writing your document..."
                    />
                  </div>
                </div>

                {/* AI Assistant Panel */}
                {showAiAssistant && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">AI Document Assistant</h3>
                        <p className="text-sm text-gray-600">Ask AI to enhance, rewrite, or add content</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Example: 'Add ISO 27001 security controls section' or 'Make this more professional' or 'Add SOC 2 compliance details'"
                        className="w-full h-24 p-4 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      />
                      <button
                        onClick={handleAiEnhance}
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Enhancing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Enhance with AI
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Quick Actions:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setAiPrompt('Add ISO 27001 security controls section with compliance details')}
                          className="px-3 py-2 bg-white border border-purple-300 rounded-lg text-sm hover:bg-purple-50 transition-colors"
                        >
                          Add ISO Controls
                        </button>
                        <button
                          onClick={() => setAiPrompt('Add SOC 2 Type II compliance requirements and evidence')}
                          className="px-3 py-2 bg-white border border-purple-300 rounded-lg text-sm hover:bg-purple-50 transition-colors"
                        >
                          Add SOC 2 Details
                        </button>
                        <button
                          onClick={() => setAiPrompt('Make the language more professional and formal')}
                          className="px-3 py-2 bg-white border border-purple-300 rounded-lg text-sm hover:bg-purple-50 transition-colors"
                        >
                          Professional Tone
                        </button>
                        <button
                          onClick={() => setAiPrompt('Add technical specifications and compliance evidence')}
                          className="px-3 py-2 bg-white border border-purple-300 rounded-lg text-sm hover:bg-purple-50 transition-colors"
                        >
                          Add Tech Specs
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Empty State
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Document Selected</h3>
                <p className="text-gray-600 mb-6">
                  Select a template from the library to create a new document, or click on an existing document to edit it.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setSelectedTemplate(templates[0])}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Document
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
