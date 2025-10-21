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
  Plus,
  BookOpen,
  ExternalLink,
  Lightbulb,
  FileDown
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

interface QuickResource {
  id: string
  title: string
  description: string
  icon: string
  category: string
  downloadUrl?: string
}

interface QuickTopic {
  id: string
  title: string
  description: string
  action: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function DocumentTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiAssistant, setShowAiAssistant] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')

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

  const quickResources: QuickResource[] = [
    {
      id: 'iso27001-guide',
      title: 'ISO 27001 Implementation Guide',
      description: 'Step-by-step guide to implementing ISO 27001 controls',
      icon: '📖',
      category: 'Security Standards',
      downloadUrl: '#'
    },
    {
      id: 'soc2-checklist',
      title: 'SOC 2 Readiness Checklist',
      description: 'Complete checklist for SOC 2 Type II preparation',
      icon: '✅',
      category: 'Compliance',
      downloadUrl: '#'
    },
    {
      id: 'rfp-best-practices',
      title: 'RFP Response Best Practices',
      description: 'Winning strategies for RFP/RFQ responses',
      icon: '🎯',
      category: 'Proposals',
      downloadUrl: '#'
    },
    {
      id: 'compliance-comparison',
      title: 'Compliance Framework Comparison',
      description: 'Compare ISO 27001, SOC 2, NIST, and other frameworks',
      icon: '📊',
      category: 'Reference',
      downloadUrl: '#'
    },
    {
      id: 'controls-library',
      title: 'Security Controls Library',
      description: 'Comprehensive library of security controls and implementations',
      icon: '🔒',
      category: 'Security',
      downloadUrl: '#'
    },
    {
      id: 'audit-prep',
      title: 'Audit Preparation Guide',
      description: 'How to prepare for compliance audits and assessments',
      icon: '📝',
      category: 'Auditing',
      downloadUrl: '#'
    }
  ]

  const quickTopics: QuickTopic[] = [
    {
      id: 'iso-controls',
      title: 'What are ISO 27001 Annex A controls?',
      description: 'Learn about the 114 security controls in ISO 27001:2022',
      action: 'Add comprehensive explanation of ISO 27001 Annex A controls including:\n\n- **A.5 Organizational Controls**: Information security policies, roles and responsibilities, segregation of duties\n- **A.6 People Controls**: Screening, terms and conditions of employment, information security awareness\n- **A.7 Physical Controls**: Physical security perimeters, secure areas, equipment security\n- **A.8 Technological Controls**: User endpoint devices, privileged access rights, information access restriction\n- **A.9 Access Control**: Business requirements, user access management, system and application access\n- **A.10 Cryptography**: Cryptographic controls, key management\n- **A.11 Physical and Environmental Security**: Secure areas, equipment protection, environmental controls\n- **A.12 Operations Security**: Operational procedures, malware protection, backup, logging\n- **A.13 Communications Security**: Network security management, information transfer\n- **A.14 System Acquisition, Development and Maintenance**: Security requirements analysis and specification\n\nInclude practical implementation examples and evidence documentation requirements for each control domain.'
    },
    {
      id: 'soc2-criteria',
      title: 'Understanding SOC 2 Trust Service Criteria',
      description: 'Security, Availability, Processing Integrity, Confidentiality, Privacy',
      action: 'Explain the 5 Trust Service Criteria (TSC) in SOC 2:\n\n**1. Security (Common to all SOC 2 reports)**:\n- Access controls (logical and physical)\n- System operations and change management\n- Risk mitigation\n\n**2. Availability**:\n- System monitoring and performance\n- Business continuity and disaster recovery\n- Incident management\n\n**3. Processing Integrity**:\n- Data quality and accuracy\n- Timely processing\n- Authorized processing\n\n**4. Confidentiality**:\n- Data classification and handling\n- Encryption and data protection\n- Secure disposal\n\n**5. Privacy**:\n- Notice and communication\n- Choice and consent\n- Collection, use, retention, and disposal\n\nFor each criterion, provide:\n- Example controls that auditors look for\n- Types of evidence needed (policies, logs, screenshots, attestations)\n- Common audit findings and how to address them\n- Mapping to other frameworks (ISO 27001, NIST)'
    },
    {
      id: 'evidence-collection',
      title: 'How to collect audit evidence effectively',
      description: 'Best practices for gathering compliance evidence',
      action: 'Create a comprehensive guide to collecting audit evidence:\n\n**Types of Evidence**:\n1. **Policies and Procedures**: Written documentation of controls\n2. **Screenshots**: System configurations, access controls, monitoring dashboards\n3. **Logs and Reports**: Access logs, change logs, security event logs\n4. **Attestations**: Management sign-offs, vendor attestations\n5. **Test Results**: Penetration tests, vulnerability scans, DR tests\n\n**Best Practices**:\n- Organize evidence by control number (e.g., A.9.1.1-Access-Control-Policy.pdf)\n- Include timestamps and version control\n- Redact sensitive information appropriately\n- Maintain evidence retention schedule\n- Use evidence management tools (SharePoint, Compliance.ai, Vanta)\n\n**Common Evidence Requests**:\n- User access reviews (quarterly screenshots)\n- Change management logs (last 12 months)\n- Security awareness training records\n- Vendor security assessments\n- Incident response plan and test results\n- Business continuity plan and test results\n\n**Red Flags to Avoid**:\n- Backdated documents\n- Generic policies not tailored to your organization\n- Missing evidence for critical controls\n- Inconsistent narratives across evidence'
    },
    {
      id: 'risk-assessment',
      title: 'Conducting security risk assessments',
      description: 'Framework-agnostic risk assessment methodology',
      action: 'Provide a complete risk assessment framework:\n\n**Step 1: Asset Identification**\n- Information assets (databases, files, PII)\n- Technology assets (servers, applications, networks)\n- People assets (employees, contractors, third parties)\n\n**Step 2: Threat Identification**\n- Cyber threats (ransomware, phishing, DDoS)\n- Physical threats (theft, fire, natural disasters)\n- Human threats (insider threats, social engineering)\n- Operational threats (system failures, vendor outages)\n\n**Step 3: Vulnerability Assessment**\n- Technical vulnerabilities (unpatched systems, misconfigurations)\n- Process vulnerabilities (weak access controls, no segregation of duties)\n- Physical vulnerabilities (unsecured facilities, no visitor logs)\n\n**Step 4: Risk Analysis**\n- **Likelihood**: Rare (1) | Unlikely (2) | Possible (3) | Likely (4) | Almost Certain (5)\n- **Impact**: Insignificant (1) | Minor (2) | Moderate (3) | Major (4) | Catastrophic (5)\n- **Risk Score**: Likelihood × Impact\n- **Risk Matrix**: Plot risks on 5x5 heat map\n\n**Step 5: Risk Treatment**\n- **Accept**: Document why risk is acceptable\n- **Mitigate**: Implement controls to reduce likelihood or impact\n- **Transfer**: Insurance, outsourcing, contracts\n- **Avoid**: Eliminate the activity that creates the risk\n\n**Step 6: Documentation**\n- Risk register with all identified risks\n- Risk treatment plan with owners and timelines\n- Residual risk acceptance sign-off\n- Annual risk assessment review schedule'
    },
    {
      id: 'gap-analysis',
      title: 'Performing compliance gap analysis',
      description: 'Identify and remediate compliance gaps',
      action: 'Create a structured gap analysis methodology:\n\n**Gap Analysis Process**:\n\n**1. Baseline Assessment**\n- List all required controls from framework (ISO 27001, SOC 2, etc.)\n- Document current state of each control\n- Rate maturity: Not Implemented (0) | Planned (1) | Partially Implemented (2) | Implemented (3) | Optimized (4)\n\n**2. Gap Identification**\nFor each control, identify:\n- **Policy gaps**: Missing or incomplete policies\n- **Process gaps**: Procedures not documented or followed\n- **Technology gaps**: Controls not automated or monitored\n- **Evidence gaps**: Controls implemented but not documented\n\n**3. Prioritization Matrix**\n- **Critical gaps**: High-risk controls with no implementation (fix immediately)\n- **High priority**: Partially implemented critical controls (fix within 30 days)\n- **Medium priority**: Implemented but poorly documented (fix within 90 days)\n- **Low priority**: Optimization opportunities (roadmap item)\n\n**4. Remediation Planning**\nFor each gap:\n- Remediation action (what needs to be done)\n- Owner (who is responsible)\n- Target completion date\n- Dependencies (what else needs to happen first)\n- Resources required (budget, tools, people)\n\n**5. Tracking and Reporting**\n- Weekly gap remediation status meetings\n- Executive dashboard with % complete by domain\n- Risk-adjusted timeline (focus on critical gaps first)\n- Re-assessment after remediation to confirm closure\n\n**Example Gap Analysis Template**:\n| Control | Requirement | Current State | Gap | Priority | Remediation | Owner | Due Date | Status |\n|---------|-------------|---------------|-----|----------|-------------|-------|----------|--------|'
    },
    {
      id: 'policy-writing',
      title: 'Writing effective security policies',
      description: 'Policy structure and best practices',
      action: 'Provide a comprehensive policy writing guide:\n\n**Policy Structure Template**:\n\n**1. Header Section**\n- Policy Name\n- Policy Number\n- Version and Date\n- Owner (role, not person)\n- Review Frequency\n- Approval Sign-off\n\n**2. Purpose**\n- Why this policy exists\n- What problem it solves\n- Regulatory/compliance drivers\n\n**3. Scope**\n- Who it applies to (employees, contractors, third parties)\n- What systems/data it covers\n- Any exclusions or exceptions\n\n**4. Policy Statements**\n- Clear, prescriptive statements using "must" or "shall"\n- Avoid "should" (not enforceable)\n- One requirement per statement\n- Example: "Users must use MFA for all system access"\n\n**5. Roles and Responsibilities**\n- Who is responsible for implementation\n- Who enforces the policy\n- Who reviews and approves exceptions\n\n**6. Compliance and Enforcement**\n- How compliance is measured\n- Consequences of non-compliance\n- Exception process\n\n**7. Related Documents**\n- Procedures that implement this policy\n- Standards and guidelines\n- Other related policies\n\n**8. Definitions**\n- Key terms used in the policy\n- Acronyms\n\n**9. Revision History**\n- Version tracking table\n\n**Best Practices**:\n- Keep policies high-level (1-3 pages)\n- Put details in procedures, not policies\n- Use plain language, avoid jargon\n- Get legal and HR review for HR-related policies\n- Publish in accessible location (intranet)\n- Require annual acknowledgment\n- Review annually or when business changes\n\n**Common Policies Needed**:\n- Information Security Policy (master policy)\n- Acceptable Use Policy\n- Access Control Policy\n- Data Classification and Handling Policy\n- Incident Response Policy\n- Business Continuity Policy\n- Change Management Policy\n- Vendor Management Policy\n- Asset Management Policy\n- Cryptography Policy'
    },
    {
      id: 'incident-response',
      title: 'Incident Response Plan template',
      description: 'Complete IR plan with playbooks',
      action: 'Create a complete Incident Response Plan structure:\n\n**Incident Response Plan Outline**:\n\n**1. Incident Response Team**\n- Incident Response Manager\n- Security Analyst\n- IT Operations\n- Legal/Compliance\n- Communications/PR\n- Executive Sponsor\n- External contacts (forensics, law enforcement)\n\n**2. Incident Classification**\n\n**Severity Levels**:\n- **P1 (Critical)**: Active breach, ransomware, data exfiltration - respond immediately\n- **P2 (High)**: Malware detected, unauthorized access attempt - respond within 1 hour\n- **P3 (Medium)**: Policy violation, suspicious activity - respond within 4 hours\n- **P4 (Low)**: Minor security event - respond within 24 hours\n\n**3. Incident Response Phases**\n\n**Phase 1: Preparation**\n- Maintain incident response toolkit\n- Training and tabletop exercises\n- Establish communication channels\n- Document escalation paths\n\n**Phase 2: Detection and Analysis**\n- Monitor security alerts (SIEM, EDR, IDS)\n- Initial triage and severity classification\n- Determine scope and impact\n- Document timeline of events\n\n**Phase 3: Containment**\n- Short-term containment (isolate affected systems)\n- Long-term containment (patch, block IPs, revoke access)\n- Preserve evidence (disk images, memory dumps, logs)\n\n**Phase 4: Eradication**\n- Remove malware and attacker access\n- Close vulnerability that was exploited\n- Verify attacker has been removed\n\n**Phase 5: Recovery**\n- Restore systems from clean backups\n- Rebuild compromised systems\n- Monitor for re-infection\n- Gradual return to normal operations\n\n**Phase 6: Post-Incident**\n- Lessons learned meeting within 7 days\n- Update incident response plan\n- Implement preventive measures\n- Notify affected parties if required (GDPR, state laws)\n\n**4. Communication Plan**\n- Internal notification (leadership, affected teams)\n- External notification (customers, regulators, law enforcement)\n- Media response (who can speak to press)\n- Status update cadence\n\n**5. Incident Playbooks**\nCreate specific playbooks for:\n- Ransomware\n- Phishing/BEC\n- Data breach\n- DDoS attack\n- Insider threat\n- Supply chain compromise\n\n**6. Testing Requirements**\n- Tabletop exercises quarterly\n- Full IR simulation annually\n- Update plan based on lessons learned'
    },
    {
      id: 'vendor-assessment',
      title: 'Third-party vendor security assessment',
      description: 'Vendor risk management framework',
      action: 'Provide a complete vendor security assessment framework:\n\n**Vendor Risk Assessment Process**:\n\n**Step 1: Vendor Classification**\n\n**Risk Tiers**:\n- **Tier 1 (Critical)**: Access to production systems, stores customer data, critical business function\n- **Tier 2 (High)**: Limited system access, handles non-sensitive data\n- **Tier 3 (Medium)**: No system access, no data access\n- **Tier 4 (Low)**: Minimal risk (office supplies, etc.)\n\n**Step 2: Initial Assessment**\n\nSend **Vendor Security Questionnaire**:\n- Company information and certifications (ISO 27001, SOC 2)\n- Security policies and procedures\n- Access controls and authentication\n- Data encryption (at rest and in transit)\n- Backup and disaster recovery\n- Incident response capabilities\n- Security awareness training\n- Penetration testing and vulnerability management\n- Subcontractor management\n- Insurance coverage (cyber liability)\n\n**Step 3: Evidence Collection**\n\nRequest from vendor:\n- SOC 2 Type II report (within last 12 months)\n- ISO 27001 certificate (if applicable)\n- Penetration test results (within last 12 months)\n- Disaster recovery test results\n- Cyber insurance certificate\n- Data Processing Agreement (DPA)\n- Business Associate Agreement (BAA) if HIPAA-applicable\n\n**Step 4: Risk Scoring**\n\n**Scoring Methodology**:\n- Security posture (0-25 points)\n- Compliance certifications (0-25 points)\n- Data protection practices (0-25 points)\n- Incident response capability (0-25 points)\n\n**Risk Categories**:\n- 85-100: Low risk (approve)\n- 70-84: Medium risk (approve with conditions)\n- 50-69: High risk (remediation plan required)\n- <50: Critical risk (do not approve)\n\n**Step 5: Contract Requirements**\n\nInclude in vendor contracts:\n- Right to audit vendor security\n- Breach notification requirements (within 24-48 hours)\n- Data deletion upon termination\n- Indemnification clauses\n- Security requirements and SLAs\n- Subcontractor approval requirements\n\n**Step 6: Ongoing Monitoring**\n\n- Annual reassessment (or more frequent for Tier 1)\n- Monitor for security incidents or breaches\n- Review updated SOC 2 reports when available\n- Quarterly business reviews for critical vendors\n- Security news monitoring (vendor breaches, vulnerabilities)\n\n**Step 7: Offboarding**\n\nWhen vendor relationship ends:\n- Revoke all access within 24 hours\n- Confirm data deletion (get attestation)\n- Update vendor inventory\n- Archive vendor assessment records'
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

  const handleSendChat = async () => {
    if (!currentDocument || !chatInput.trim()) {
      toast.error('Please enter a message')
      return
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    }

    // Add user message to chat
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsGenerating(true)

    try {
      const response = await fetch('/api/document-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          documentContext: {
            title: currentDocument.title,
            content: currentDocument.content,
            templateName: currentDocument.templateName
          },
          conversationHistory: chatMessages
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, assistantMessage])
      toast.success('AI responded!')
    } catch (error) {
      toast.error('AI chat failed. Please try again.')
      console.error('Chat error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApplyAISuggestion = () => {
    if (!currentDocument || chatMessages.length === 0) return

    // Get the last assistant message
    const lastAssistantMessage = [...chatMessages].reverse().find(msg => msg.role === 'assistant')

    if (lastAssistantMessage) {
      const enhancedContent = currentDocument.content + `\n\n${lastAssistantMessage.content}\n`

      setCurrentDocument({
        ...currentDocument,
        content: enhancedContent,
        updatedAt: new Date().toISOString()
      })

      const updatedDocs = documents.map(doc =>
        doc.id === currentDocument.id ? { ...currentDocument, content: enhancedContent, updatedAt: new Date().toISOString() } : doc
      )
      setDocuments(updatedDocs)

      toast.success('AI suggestion applied to document!')
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

  const handleQuickTopicClick = (topic: QuickTopic) => {
    if (!currentDocument) {
      toast.error('Please create or select a document first')
      return
    }
    setAiPrompt(topic.action)
    setShowAiAssistant(true)
    toast.success(`Educational topic loaded: "${topic.title}"`)
  }

  const handleResourceDownload = (resource: QuickResource) => {
    toast.info(`Downloading ${resource.title}... (Feature coming soon)`)
  }

  return (
    <ProtectedLayout>
      <div className="flex h-screen overflow-hidden">
        {/* Educational Resources Sidebar */}
        <div className="w-80 bg-gradient-to-b from-slate-800 to-slate-900 text-white overflow-y-auto flex-shrink-0">
          <div className="p-6">
            {/* Usage Counter */}
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4 mb-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-purple-200">Documents Created</span>
              </div>
              <div className="text-3xl font-bold text-white">{documents.length}</div>
              <div className="text-xs text-purple-300 mt-1">Total this session</div>
            </div>

            {/* Quick Resources */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold">Quick Resources</h3>
              </div>
              <div className="space-y-2">
                {quickResources.map((resource) => (
                  <button
                    key={resource.id}
                    onClick={() => handleResourceDownload(resource)}
                    className="w-full bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{resource.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                            {resource.title}
                          </h4>
                          <FileDown className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                        <p className="text-xs text-gray-300 mb-1">{resource.description}</p>
                        <span className="inline-block px-2 py-0.5 bg-purple-900/50 text-purple-300 text-xs rounded">
                          {resource.category}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Educational Quick Topics */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-bold">Educational Quick Topics</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Click any topic to load educational content into the AI Assistant
              </p>
              <div className="space-y-2">
                {quickTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleQuickTopicClick(topic)}
                    className="w-full bg-purple-900/20 border border-purple-500/30 hover:bg-purple-900/40 hover:border-purple-400/50 rounded-lg p-3 transition-all text-left"
                  >
                    <h4 className="text-sm font-semibold text-white mb-1">{topic.title}</h4>
                    <p className="text-xs text-gray-400">{topic.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Pro Tips */}
            <div className="mt-6 bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <h4 className="text-sm font-bold text-blue-200">Pro Tips</h4>
              </div>
              <ul className="text-xs text-blue-100 space-y-1.5">
                <li>• Use quick topics to learn while you work</li>
                <li>• Download resources for offline reference</li>
                <li>• Combine templates with AI for best results</li>
                <li>• Update content regularly with new topics</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
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

                    {/* AI Chat Assistant */}
                    {showAiAssistant && (
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 shadow-lg overflow-hidden">
                        <div className="p-6 border-b border-purple-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">AI Document Assistant</h3>
                                <p className="text-sm text-gray-600">Chat with AI to improve your document</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setChatMessages([])}
                              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                              Clear Chat
                            </button>
                          </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="h-96 overflow-y-auto p-6 space-y-4 bg-white">
                          {chatMessages.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                              <p className="mb-4">Start a conversation about your document!</p>
                              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                                <button
                                  onClick={() => setChatInput('Help me improve this document')}
                                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors"
                                >
                                  Improve Document
                                </button>
                                <button
                                  onClick={() => setChatInput('Add ISO 27001 controls')}
                                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors"
                                >
                                  Add ISO Controls
                                </button>
                                <button
                                  onClick={() => setChatInput('Make it more professional')}
                                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors"
                                >
                                  Professional Tone
                                </button>
                                <button
                                  onClick={() => setChatInput('Add SOC 2 compliance details')}
                                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors"
                                >
                                  SOC 2 Details
                                </button>
                              </div>
                            </div>
                          )}

                          {chatMessages.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              {msg.role === 'assistant' && (
                                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Sparkles className="w-4 h-4 text-white" />
                                </div>
                              )}
                              <div
                                className={`max-w-[80%] rounded-lg p-4 ${
                                  msg.role === 'user'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <p className="text-xs mt-2 opacity-70">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                              {msg.role === 'user' && (
                                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-bold">You</span>
                                </div>
                              )}
                            </div>
                          ))}

                          {isGenerating && (
                            <div className="flex gap-3">
                              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-4 h-4 text-white" />
                              </div>
                              <div className="bg-gray-100 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                  <span className="text-sm text-gray-600">AI is thinking...</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Chat Input */}
                        <div className="p-4 border-t border-purple-200 bg-white">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSendChat()
                                }
                              }}
                              placeholder="Ask AI about your document..."
                              className="flex-1 px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              disabled={isGenerating}
                            />
                            <button
                              onClick={handleSendChat}
                              disabled={isGenerating || !chatInput.trim()}
                              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              <Send className="w-5 h-5" />
                              Send
                            </button>
                          </div>

                          {chatMessages.length > 0 && (
                            <button
                              onClick={handleApplyAISuggestion}
                              className="mt-2 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                            >
                              Apply Last AI Suggestion to Document
                            </button>
                          )}
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
        </div>
      </div>
    </ProtectedLayout>
  )
}
