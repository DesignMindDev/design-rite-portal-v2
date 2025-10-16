'use client'

import { useState } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import {
  BookOpen,
  FileDown,
  Search,
  Filter,
  ExternalLink,
  Download,
  FileText,
  Shield,
  CheckCircle,
  Award,
  AlertCircle,
  Home
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ComplianceResource {
  id: string
  title: string
  description: string
  icon: string
  category: string
  type: 'pdf' | 'docx' | 'xlsx' | 'checklist'
  downloadUrl?: string
  tags: string[]
}

export default function ComplianceResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const resources: ComplianceResource[] = [
    {
      id: 'iso27001-guide',
      title: 'ISO 27001 Implementation Guide',
      description: 'Comprehensive step-by-step guide to implementing ISO 27001:2022 controls with practical examples and evidence requirements.',
      icon: '📖',
      category: 'Security Standards',
      type: 'pdf',
      tags: ['ISO 27001', 'Implementation', 'Security Controls', 'Compliance'],
      downloadUrl: '#'
    },
    {
      id: 'soc2-checklist',
      title: 'SOC 2 Readiness Checklist',
      description: 'Complete readiness checklist for SOC 2 Type II preparation covering all Trust Service Criteria with actionable items.',
      icon: '✅',
      category: 'Compliance',
      type: 'checklist',
      tags: ['SOC 2', 'Audit', 'Trust Service Criteria', 'Readiness'],
      downloadUrl: '#'
    },
    {
      id: 'rfp-best-practices',
      title: 'RFP Response Best Practices',
      description: 'Winning strategies and templates for responding to RFPs and RFQs with professional formatting and persuasive writing.',
      icon: '🎯',
      category: 'Proposals',
      type: 'docx',
      tags: ['RFP', 'Proposals', 'Sales', 'Best Practices'],
      downloadUrl: '#'
    },
    {
      id: 'compliance-comparison',
      title: 'Compliance Framework Comparison Matrix',
      description: 'Side-by-side comparison of ISO 27001, SOC 2, NIST CSF, PCI DSS, HIPAA, and GDPR with control mapping.',
      icon: '📊',
      category: 'Reference',
      type: 'xlsx',
      tags: ['Comparison', 'Frameworks', 'ISO 27001', 'SOC 2', 'NIST'],
      downloadUrl: '#'
    },
    {
      id: 'controls-library',
      title: 'Security Controls Library',
      description: 'Comprehensive library of 200+ security controls with implementation guidance, testing procedures, and evidence examples.',
      icon: '🔒',
      category: 'Security',
      type: 'pdf',
      tags: ['Security Controls', 'Implementation', 'Testing', 'Evidence'],
      downloadUrl: '#'
    },
    {
      id: 'audit-prep',
      title: 'Audit Preparation Guide',
      description: 'Complete guide to preparing for compliance audits and assessments with timeline, evidence collection, and interview prep.',
      icon: '📝',
      category: 'Auditing',
      type: 'pdf',
      tags: ['Audit', 'Preparation', 'Evidence', 'Compliance'],
      downloadUrl: '#'
    },
    {
      id: 'risk-assessment-template',
      title: 'Risk Assessment Template',
      description: 'Ready-to-use risk assessment template with risk matrix, treatment plans, and executive summary format.',
      icon: '⚠️',
      category: 'Risk Management',
      type: 'xlsx',
      tags: ['Risk Assessment', 'Risk Matrix', 'Risk Management', 'Template'],
      downloadUrl: '#'
    },
    {
      id: 'policy-templates',
      title: 'Security Policy Template Pack',
      description: '15 pre-written security policy templates including Information Security, Access Control, Incident Response, and more.',
      icon: '📋',
      category: 'Policies',
      type: 'docx',
      tags: ['Policies', 'Templates', 'Security', 'Governance'],
      downloadUrl: '#'
    },
    {
      id: 'incident-response-playbook',
      title: 'Incident Response Playbook',
      description: 'Complete IR playbook with phase-by-phase procedures, communication templates, and tabletop exercise scenarios.',
      icon: '🚨',
      category: 'Incident Response',
      type: 'pdf',
      tags: ['Incident Response', 'Playbook', 'Security', 'Procedures'],
      downloadUrl: '#'
    },
    {
      id: 'vendor-assessment-kit',
      title: 'Vendor Security Assessment Kit',
      description: 'Complete vendor assessment toolkit with questionnaire, scoring rubric, contract clauses, and monitoring procedures.',
      icon: '🤝',
      category: 'Vendor Management',
      type: 'xlsx',
      tags: ['Vendor Management', 'Third Party Risk', 'Assessment', 'Due Diligence'],
      downloadUrl: '#'
    },
    {
      id: 'gap-analysis-template',
      title: 'Compliance Gap Analysis Template',
      description: 'Structured gap analysis template with maturity ratings, prioritization matrix, and remediation planning.',
      icon: '📈',
      category: 'Compliance',
      type: 'xlsx',
      tags: ['Gap Analysis', 'Compliance', 'Assessment', 'Remediation'],
      downloadUrl: '#'
    },
    {
      id: 'evidence-collection-guide',
      title: 'Audit Evidence Collection Guide',
      description: 'Best practices for collecting and organizing audit evidence with file naming conventions and retention schedules.',
      icon: '📁',
      category: 'Auditing',
      type: 'pdf',
      tags: ['Evidence', 'Audit', 'Documentation', 'Best Practices'],
      downloadUrl: '#'
    }
  ]

  const categories = ['all', ...Array.from(new Set(resources.map(r => r.category)))]

  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchQuery === '' ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleDownload = (resource: ComplianceResource) => {
    toast.info(`Downloading ${resource.title}... (Feature coming soon)`)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4" />
      case 'docx': return <FileText className="w-4 h-4" />
      case 'xlsx': return <FileText className="w-4 h-4" />
      case 'checklist': return <CheckCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-100 text-red-700'
      case 'docx': return 'bg-blue-100 text-blue-700'
      case 'xlsx': return 'bg-green-100 text-green-700'
      case 'checklist': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <ProtectedLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 font-medium"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <BookOpen className="w-10 h-10 text-indigo-600" />
                Compliance Resources
              </h1>
              <p className="text-gray-600 text-lg">
                Downloadable guides, templates, and checklists for security compliance
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-indigo-900 mb-1">
                Professional Resources Library
              </h3>
              <p className="text-indigo-700 text-sm leading-relaxed">
                Access our curated collection of compliance resources including implementation guides,
                policy templates, assessment checklists, and more. All resources are based on current
                frameworks and industry best practices.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources, tags, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredResources.length} of {resources.length} resources
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6 group"
            >
              {/* Icon and Type Badge */}
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{resource.icon}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getTypeColor(resource.type)}`}>
                  {getTypeIcon(resource.type)}
                  {resource.type.toUpperCase()}
                </span>
              </div>

              {/* Title and Description */}
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                {resource.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {resource.description}
              </p>

              {/* Category */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                  {resource.category}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {resource.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
                {resource.tags.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded">
                    +{resource.tags.length - 3} more
                  </span>
                )}
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownload(resource)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Resource
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredResources.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}
