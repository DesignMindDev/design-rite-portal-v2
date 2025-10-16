'use client'

import { useState } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import {
  Lightbulb,
  Search,
  ChevronRight,
  BookOpen,
  AlertCircle,
  Home,
  ExternalLink,
  Clock,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface LearningTopic {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  readTime: string
  content: string
  relatedTopics: string[]
}

export default function LearningCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<LearningTopic | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const topics: LearningTopic[] = [
    {
      id: 'iso-controls',
      title: 'What are ISO 27001 Annex A controls?',
      description: 'Learn about the 114 security controls in ISO 27001:2022 and how to implement them effectively.',
      category: 'ISO 27001',
      difficulty: 'intermediate',
      readTime: '15 min',
      relatedTopics: ['gap-analysis', 'policy-writing', 'evidence-collection'],
      content: `# ISO 27001 Annex A Controls

ISO 27001:2022 includes 93 controls organized into 4 themes and 14 control categories. Here's a comprehensive breakdown:

## Control Themes

### 1. Organizational Controls (A.5)
- **A.5.1** Information security policies
- **A.5.2** Information security roles and responsibilities
- **A.5.3** Segregation of duties
- **A.5.4** Management responsibilities
- **A.5.5** Contact with authorities
- **A.5.6** Contact with special interest groups
- **A.5.7** Threat intelligence

### 2. People Controls (A.6)
- **A.6.1** Screening - Background checks for employees and contractors
- **A.6.2** Terms and conditions of employment
- **A.6.3** Information security awareness, education and training
- **A.6.4** Disciplinary process
- **A.6.5** Responsibilities after termination or change of employment
- **A.6.6** Confidentiality or non-disclosure agreements
- **A.6.7** Remote working
- **A.6.8** Information security event reporting

### 3. Physical Controls (A.7)
- **A.7.1** Physical security perimeters
- **A.7.2** Physical entry
- **A.7.3** Securing offices, rooms and facilities
- **A.7.4** Physical security monitoring
- **A.7.5** Protecting against physical and environmental threats
- **A.7.6** Working in secure areas
- **A.7.7** Clear desk and clear screen
- **A.7.8** Equipment siting and protection
- **A.7.9** Security of assets off-premises
- **A.7.10** Storage media
- **A.7.11** Supporting utilities
- **A.7.12** Cabling security
- **A.7.13** Equipment maintenance
- **A.7.14** Secure disposal or re-use of equipment

### 4. Technological Controls (A.8)
- **A.8.1** User endpoint devices
- **A.8.2** Privileged access rights
- **A.8.3** Information access restriction
- **A.8.4** Access to source code
- **A.8.5** Secure authentication
- **A.8.6** Capacity management
- **A.8.7** Protection against malware
- **A.8.8** Management of technical vulnerabilities
- **A.8.9** Configuration management
- **A.8.10** Information deletion
- **A.8.11** Data masking
- **A.8.12** Data leakage prevention
- **A.8.13** Information backup
- **A.8.14** Redundancy of information processing facilities
- **A.8.15** Logging
- **A.8.16** Monitoring activities
- **A.8.17** Clock synchronization
- **A.8.18** Use of privileged utility programs
- **A.8.19** Installation of software on operational systems
- **A.8.20** Networks security
- **A.8.21** Security of network services
- **A.8.22** Segregation of networks
- **A.8.23** Web filtering
- **A.8.24** Use of cryptography
- **A.8.25** Secure development life cycle
- **A.8.26** Application security requirements
- **A.8.27** Secure system architecture and engineering principles
- **A.8.28** Secure coding
- **A.8.29** Security testing in development and acceptance
- **A.8.30** Outsourced development
- **A.8.31** Separation of development, test and production environments
- **A.8.32** Change management
- **A.8.33** Test information
- **A.8.34** Protection of information systems during audit testing

## Implementation Best Practices

1. **Start with a gap analysis** to identify which controls are not yet implemented
2. **Prioritize critical controls** based on your risk assessment
3. **Document policies and procedures** for each applicable control
4. **Collect evidence** of implementation (screenshots, logs, sign-offs)
5. **Review annually** and update based on changes to your business

## Evidence Documentation

For each control, you should maintain:
- **Policy statements** defining the requirement
- **Procedures** explaining how it's implemented
- **Evidence** proving it's working (logs, screenshots, attestations)
- **Review records** showing periodic assessment`
    },
    {
      id: 'soc2-criteria',
      title: 'Understanding SOC 2 Trust Service Criteria',
      description: 'Deep dive into the 5 Trust Service Criteria: Security, Availability, Processing Integrity, Confidentiality, Privacy.',
      category: 'SOC 2',
      difficulty: 'intermediate',
      readTime: '12 min',
      relatedTopics: ['evidence-collection', 'vendor-assessment'],
      content: `# SOC 2 Trust Service Criteria

SOC 2 reports are based on the AICPA's Trust Service Criteria (TSC). Here's what you need to know:

## 1. Security (Common to all SOC 2 reports)

**Definition**: The system is protected against unauthorized access (both physical and logical).

**Key Control Areas**:
- **CC6.1** - Logical and physical access controls
- **CC6.2** - Prior to issuing system credentials and granting system access
- **CC6.3** - Removes access when appropriate
- **CC6.6** - Implements logical access security measures
- **CC6.7** - Restricts access to system components
- **CC6.8** - Manages system accounts

**Example Controls**:
- Multi-factor authentication (MFA) for all user accounts
- Annual user access reviews
- Automatic deprovisioning when employees leave
- Role-based access control (RBAC)
- Password complexity requirements
- Session timeout after 15 minutes of inactivity

**Evidence Examples**:
- Screenshots of MFA configuration
- User access review spreadsheets (quarterly)
- Termination checklist showing access revocation
- Password policy document
- Access control matrix

## 2. Availability

**Definition**: The system is available for operation and use as committed or agreed.

**Key Control Areas**:
- System monitoring and performance management
- Business continuity and disaster recovery
- Incident management
- Change management

**Example Controls**:
- 99.9% uptime SLA
- 24/7 system monitoring with automated alerts
- Disaster recovery plan tested annually
- Redundant infrastructure (multi-region deployment)
- Incident response plan with defined escalation procedures

**Evidence Examples**:
- Uptime reports from monitoring tools
- DR test results and sign-off
- Incident response logs
- System performance dashboards

## 3. Processing Integrity

**Definition**: System processing is complete, valid, accurate, timely, and authorized.

**Key Control Areas**:
- Data quality and accuracy controls
- Transaction processing controls
- Error handling and logging
- Reconciliation procedures

**Example Controls**:
- Input validation on all data entry forms
- Automated data quality checks
- Transaction logs with timestamps
- Daily reconciliation of processed transactions
- Error alerts sent to operations team

**Evidence Examples**:
- Data validation rules documentation
- Transaction logs showing validation
- Reconciliation reports
- Error rate metrics

## 4. Confidentiality

**Definition**: Information designated as confidential is protected as committed or agreed.

**Key Control Areas**:
- Data classification and handling
- Encryption (at rest and in transit)
- Secure data disposal
- Confidentiality agreements

**Example Controls**:
- Data classification policy (Public, Internal, Confidential, Restricted)
- AES-256 encryption for data at rest
- TLS 1.3 for data in transit
- Secure wipe procedures for decommissioned hardware
- NDAs signed by all employees and contractors

**Evidence Examples**:
- Data classification policy
- Encryption configuration screenshots
- Certificate of destruction for disposed hardware
- Signed NDA copies

## 5. Privacy

**Definition**: Personal information is collected, used, retained, disclosed, and disposed of in conformity with commitments in the privacy notice.

**Key Control Areas**:
- Privacy notice and consent
- Collection, use, retention, and disposal
- Access and correction rights
- Disclosure to third parties
- Privacy by design

**Example Controls**:
- Privacy policy published on website
- Consent checkboxes for data collection
- Data retention schedule (e.g., delete after 7 years)
- Data subject access request (DSAR) procedure
- Privacy impact assessments for new features
- Vendor contracts with data processing agreements

**Evidence Examples**:
- Privacy policy (version-controlled)
- Consent logs
- Data retention schedule
- DSAR response logs
- Privacy impact assessment reports
- Vendor DPAs

## Choosing Your SOC 2 Type

**Type I**: Controls are appropriately designed at a point in time
**Type II**: Controls operated effectively over a period (typically 6-12 months)

Most customers require **Type II** as it demonstrates sustained compliance.

## Preparing for SOC 2 Audit

1. **Gap analysis** (3-6 months before audit)
2. **Remediation** of identified gaps
3. **Evidence collection** over audit period
4. **Readiness assessment** with auditor
5. **Audit fieldwork** (2-4 weeks)
6. **Report issuance** (2-3 weeks after fieldwork)`
    },
    {
      id: 'evidence-collection',
      title: 'How to collect audit evidence effectively',
      description: 'Best practices for gathering, organizing, and presenting compliance evidence to auditors.',
      category: 'Auditing',
      difficulty: 'beginner',
      readTime: '10 min',
      relatedTopics: ['iso-controls', 'soc2-criteria'],
      content: `# Audit Evidence Collection Best Practices

Effective evidence collection is critical for successful compliance audits. Here's how to do it right:

## Types of Evidence

### 1. Policies and Procedures
- **What**: Written documentation of your controls
- **Examples**: Information Security Policy, Access Control Policy, Incident Response Plan
- **Best Practice**: Version control, annual review dates, executive approval signatures

### 2. Screenshots
- **What**: Visual proof of system configurations and controls
- **Examples**: MFA settings, firewall rules, access control lists, monitoring dashboards
- **Best Practice**: Include timestamp, URL, and annotation explaining what's shown

### 3. Logs and Reports
- **What**: System-generated records of activities
- **Examples**: Access logs, change logs, security event logs, vulnerability scan reports
- **Best Practice**: Include date range, ensure logs are from audit period

### 4. Attestations
- **What**: Written statements confirming control execution
- **Examples**: Management sign-offs, vendor security questionnaires, employee training acknowledgments
- **Best Practice**: Get signatures and dates, use official letterhead

### 5. Test Results
- **What**: Evidence of control testing
- **Examples**: Penetration test reports, disaster recovery test results, phishing simulation results
- **Best Practice**: Include test date, methodology, findings, and remediation

## Evidence Organization

### File Naming Convention
Use a consistent naming structure:
\`\`\`
{Control Number}-{Control Name}-{Evidence Type}-{Date}.pdf

Examples:
A.9.1.1-Access-Control-Policy-2024-01-15.pdf
CC6.1-MFA-Configuration-Screenshot-2024-03-20.png
A.18.1.1-Penetration-Test-Report-2024-02-28.pdf
\`\`\`

### Folder Structure
\`\`\`
Evidence/
├── Policies/
│   ├── Information-Security-Policy.pdf
│   ├── Access-Control-Policy.pdf
│   └── Incident-Response-Policy.pdf
├── Procedures/
│   ├── User-Provisioning-Procedure.pdf
│   └── Backup-Procedure.pdf
├── Screenshots/
│   ├── Q1-2024/
│   ├── Q2-2024/
│   └── Q3-2024/
├── Logs/
│   ├── Access-Logs/
│   ├── Change-Logs/
│   └── Security-Event-Logs/
├── Attestations/
│   ├── Training-Acknowledgments/
│   └── Vendor-Questionnaires/
└── Test-Results/
    ├── Penetration-Tests/
    ├── DR-Tests/
    └── Vulnerability-Scans/
\`\`\`

## Common Evidence Requests

### Access Control Evidence
- User access review (quarterly screenshots showing who has access to what)
- New hire provisioning checklist
- Termination checklist showing access revoked within 24 hours
- MFA configuration and enforcement
- Password policy settings

### Change Management Evidence
- Change request tickets (last 12 months)
- Change approval records (manager/CAB approval)
- Change implementation evidence (before/after screenshots)
- Rollback procedures

### Security Monitoring Evidence
- SIEM/IDS alert logs
- Security event investigation records
- Monthly security review meeting notes
- Incident response logs

### Training Evidence
- Security awareness training records (who completed, when, score)
- Training materials (slides, videos)
- Phishing simulation results
- Role-specific training for privileged users

### Vendor Management Evidence
- Vendor risk assessments
- SOC 2 Type II reports from critical vendors (within last 12 months)
- Vendor contracts with security requirements
- Annual vendor review documentation

### Business Continuity Evidence
- Disaster recovery plan (current version)
- DR test results (annual test with sign-off)
- Backup logs (daily/weekly backups)
- Backup restoration test results

## Red Flags to Avoid

❌ **Backdated documents** - Auditors can detect when files were created
❌ **Generic policies** - Policies must be tailored to your organization
❌ **Missing evidence for critical controls** - Gaps in high-risk areas are serious findings
❌ **Inconsistent narratives** - Your evidence should tell a coherent story
❌ **Incomplete date ranges** - Evidence must cover entire audit period
❌ **Unsigned policies** - Policies need executive approval
❌ **Outdated evidence** - Screenshots from 2 years ago don't prove current controls

## Evidence Management Tools

Consider using:
- **SharePoint/Google Drive** - Version control, access permissions
- **Compliance.ai / Vanta / Drata** - Automated evidence collection
- **Jira/ServiceNow** - Ticketing for change management evidence
- **SIEM tools** - Automated log collection and retention

## Retention Schedule

- **Policies/Procedures**: 7 years
- **Audit reports**: 7 years
- **Access logs**: 1 year minimum (longer for financial/healthcare)
- **Training records**: 3 years
- **Incident records**: 7 years
- **Contracts**: Life of contract + 7 years

## Pro Tips

1. **Collect evidence continuously**, not just before audits
2. **Automate where possible** (scheduled screenshot jobs, automated reports)
3. **Index your evidence** with a tracking spreadsheet
4. **Redact sensitive information** (SSNs, passwords, PII)
5. **Test your evidence** by doing a dry run with internal audit
6. **Get ahead of requests** by providing evidence proactively
7. **Document exceptions** - if a control failed, document why and remediation`
    },
    {
      id: 'risk-assessment',
      title: 'Conducting security risk assessments',
      description: 'Complete framework for identifying, analyzing, and treating information security risks.',
      category: 'Risk Management',
      difficulty: 'advanced',
      readTime: '20 min',
      relatedTopics: ['gap-analysis', 'iso-controls'],
      content: `# Security Risk Assessment Framework

A comprehensive guide to conducting information security risk assessments.

## Risk Assessment Process

### Step 1: Asset Identification

Identify all assets that need protection:

**Information Assets**:
- Customer databases (PII, payment data)
- Intellectual property (source code, trade secrets)
- Employee data (HR records, performance reviews)
- Financial records (invoices, contracts)
- Business documents (proposals, strategic plans)

**Technology Assets**:
- Servers (production, development, testing)
- Workstations and laptops
- Mobile devices
- Network equipment (routers, switches, firewalls)
- Applications (web apps, mobile apps, SaaS tools)
- Cloud infrastructure

**People Assets**:
- Employees (by role and access level)
- Contractors and temporary staff
- Third-party vendors
- Executives and board members

**Physical Assets**:
- Data centers
- Office buildings
- Equipment rooms
- Backup media storage

### Step 2: Threat Identification

Identify potential threats to each asset:

**Cyber Threats**:
- Ransomware attacks
- Phishing and business email compromise (BEC)
- DDoS attacks
- SQL injection and other web application attacks
- Insider threats (malicious or negligent)
- Supply chain attacks
- Zero-day exploits

**Physical Threats**:
- Theft of equipment or data
- Fire and smoke damage
- Flood and water damage
- Power outages
- Natural disasters (earthquake, hurricane, tornado)

**Human Threats**:
- Social engineering
- Insider threats (disgruntled employees)
- Espionage
- Sabotage
- Human error (accidental deletion, misconfiguration)

**Operational Threats**:
- System failures (hardware, software)
- Vendor/supplier outages
- Loss of key personnel
- Process failures

### Step 3: Vulnerability Assessment

Identify weaknesses that could be exploited:

**Technical Vulnerabilities**:
- Unpatched systems and applications
- Misconfigured firewalls or cloud storage
- Weak or default passwords
- Missing encryption
- Lack of network segmentation
- Outdated software (unsupported versions)

**Process Vulnerabilities**:
- Weak access controls (no RBAC, no segregation of duties)
- No background checks for employees
- Lack of security awareness training
- No incident response plan
- Inadequate change management
- Missing vendor risk assessments

**Physical Vulnerabilities**:
- Unsecured server rooms
- No visitor logs or badges
- Unencrypted backup tapes stored off-site
- Lack of CCTV monitoring
- Tailgating (unauthorized entry)

### Step 4: Risk Analysis

Calculate risk scores using likelihood and impact:

**Likelihood Scale (1-5)**:
- **1 - Rare**: < 5% chance in next year
- **2 - Unlikely**: 5-25% chance
- **3 - Possible**: 25-50% chance
- **4 - Likely**: 50-75% chance
- **5 - Almost Certain**: > 75% chance

**Impact Scale (1-5)**:
- **1 - Insignificant**: < $10K loss, no reputation damage
- **2 - Minor**: $10K-$100K loss, minor reputation damage
- **3 - Moderate**: $100K-$500K loss, moderate reputation damage
- **4 - Major**: $500K-$5M loss, significant reputation damage
- **5 - Catastrophic**: > $5M loss, business-threatening reputation damage

**Risk Score Formula**:
\`\`\`
Risk Score = Likelihood × Impact

Example:
Ransomware attack on production database:
Likelihood: 4 (Likely - ransomware is common)
Impact: 5 (Catastrophic - would halt business operations)
Risk Score: 4 × 5 = 20 (Critical Risk)
\`\`\`

**Risk Matrix**:
\`\`\`
Impact →     1    2    3    4    5
Likelihood ↓
    5        5   10   15   20   25  (Critical)
    4        4    8   12   16   20  (High)
    3        3    6    9   12   15  (Medium)
    2        2    4    6    8   10  (Low)
    1        1    2    3    4    5  (Very Low)

Risk Levels:
- 1-5: Very Low (accept)
- 6-10: Low (monitor)
- 11-15: Medium (mitigate within 90 days)
- 16-20: High (mitigate within 30 days)
- 21-25: Critical (mitigate immediately)
\`\`\`

### Step 5: Risk Treatment

Choose a treatment strategy for each risk:

**1. Accept**
- Risk score is within acceptable threshold
- Cost of mitigation exceeds potential impact
- **Document**: Why accepting the risk is justified
- **Example**: Risk of laptop theft in low-crime area (score: 6)

**2. Mitigate**
- Implement controls to reduce likelihood or impact
- Most common treatment option
- **Example**:
  - Risk: Ransomware attack (score: 20)
  - Mitigation: Deploy EDR, implement MFA, conduct security training
  - Residual Risk Score: 8 (likelihood reduced from 4 to 2)

**3. Transfer**
- Shift risk to a third party
- **Methods**: Cyber insurance, outsourcing, contractual clauses
- **Example**: Purchase cyber insurance with $5M coverage for data breach

**4. Avoid**
- Eliminate the activity creating the risk
- **Example**: Discontinue storing credit card data, use payment processor instead

### Step 6: Documentation

Create comprehensive risk assessment documentation:

**Risk Register Template**:
\`\`\`
| Risk ID | Asset | Threat | Vulnerability | L | I | Score | Treatment | Owner | Status |
|---------|-------|--------|---------------|---|---|-------|-----------|-------|--------|
| R-001   | Customer DB | Ransomware | No EDR | 4 | 5 | 20 | Mitigate | CISO | In Progress |
| R-002   | Laptop | Theft | No encryption | 3 | 3 | 9 | Mitigate | IT Dir | Planned |
| R-003   | Email | Phishing | No training | 4 | 4 | 16 | Mitigate | HR | Complete |
\`\`\`

**Risk Treatment Plan**:
For each mitigated risk:
- **Control to implement**: What will be done
- **Owner**: Who is responsible
- **Target date**: When it will be completed
- **Budget**: Cost of implementation
- **Residual risk**: Expected risk score after mitigation

**Executive Summary**:
- Total risks identified
- Risk distribution by level (critical/high/medium/low)
- Top 10 risks requiring immediate attention
- Budget needed for risk mitigation
- Residual risk after treatment

## Annual Risk Assessment

Conduct a full risk assessment at least annually:
- Review all previously identified risks
- Identify new risks (new systems, new threats)
- Update likelihood and impact scores
- Verify mitigation controls are still effective
- Get executive sign-off on residual risks

## Continuous Risk Monitoring

Between annual assessments:
- Monitor threat intelligence sources
- Track new vulnerabilities (CVEs)
- Conduct quarterly risk reviews
- Update risk register as business changes
- Report to board/leadership quarterly`
    },
    {
      id: 'gap-analysis',
      title: 'Performing compliance gap analysis',
      description: 'Systematic approach to identifying and remediating compliance gaps against frameworks like ISO 27001 or SOC 2.',
      category: 'Compliance',
      difficulty: 'intermediate',
      readTime: '18 min',
      relatedTopics: ['iso-controls', 'soc2-criteria', 'risk-assessment'],
      content: `# Compliance Gap Analysis Methodology

A structured approach to identifying and closing compliance gaps.

## What is a Gap Analysis?

A gap analysis compares your current state against a target state (compliance framework requirements) to identify gaps that need remediation.

## Gap Analysis Process

### Phase 1: Baseline Assessment

**Step 1: Select Framework**
- ISO 27001:2022 (93 controls)
- SOC 2 (Trust Service Criteria)
- NIST CSF
- PCI DSS
- HIPAA
- GDPR

**Step 2: Document Current State**

For each control/requirement, assess:
- **Is it implemented?** Yes/No/Partial
- **Is it documented?** (policy, procedure)
- **Is there evidence?** (logs, screenshots, attestations)
- **Is it tested?** (how often, by whom)

**Maturity Rating Scale**:
- **0 - Not Implemented**: Control doesn't exist
- **1 - Planned**: Control is being designed/approved
- **2 - Partially Implemented**: Control exists but has gaps
- **3 - Implemented**: Control is fully operational
- **4 - Optimized**: Control is monitored and continuously improved

**Example Assessment**:
\`\`\`
Control: A.9.2.1 - User registration and de-registration

Current State:
- Implemented: Partial
- Documentation: User provisioning procedure exists but not updated
- Evidence: HR tickets for onboarding, but no formal checklist
- Testing: No periodic user access reviews
- Maturity Rating: 2 (Partially Implemented)

Gap: No user access reviews, outdated procedure, missing checklist
\`\`\`

### Phase 2: Gap Identification

Categorize gaps by type:

**1. Policy Gaps**
- Missing policies
- Incomplete policies
- Outdated policies (> 1 year old)
- Policies not aligned with actual practices

**2. Process Gaps**
- Procedures not documented
- Procedures not followed consistently
- No ownership/accountability
- Manual processes that should be automated

**3. Technology Gaps**
- Controls not automated
- No monitoring/alerting
- Tools not configured correctly
- Missing security tools (SIEM, EDR, DLP)

**4. Evidence Gaps**
- Controls implemented but not documented
- No logs or records
- Evidence not collected regularly
- Evidence retention issues

### Phase 3: Gap Prioritization

Use a prioritization matrix to focus on highest-value remediation:

**Prioritization Criteria**:

**1. Risk Level**
- What's the risk if this gap isn't closed?
- Use your risk assessment to inform prioritization

**2. Audit Likelihood**
- Will auditors definitely check this? (Critical)
- Commonly audited control? (High)
- Rarely audited? (Medium)

**3. Remediation Effort**
- How hard/expensive is it to fix?
- Quick win (< 1 week)
- Medium effort (1-4 weeks)
- Major project (> 1 month)

**Gap Priority Matrix**:
\`\`\`
Priority Levels:

P1 - Critical (Fix immediately):
- High risk + High audit likelihood + Any effort
- Example: No MFA on production systems

P2 - High (Fix within 30 days):
- High risk + Medium audit likelihood + Quick/medium effort
- Medium risk + High audit likelihood + Quick effort
- Example: Missing incident response plan

P3 - Medium (Fix within 90 days):
- Medium risk + Medium audit likelihood + Medium effort
- Low risk + High audit likelihood + Quick effort
- Example: Outdated access control policy

P4 - Low (Roadmap item):
- Low risk + Low audit likelihood + Any effort
- Any risk + Any likelihood + Major effort (multi-month project)
- Example: Implementing automated vulnerability scanning
\`\`\`

### Phase 4: Remediation Planning

Create a detailed plan for each gap:

**Remediation Action Template**:
\`\`\`
Gap ID: GAP-001
Control: A.9.2.1 - User registration and de-registration
Gap Description: No quarterly user access reviews

Remediation Plan:
1. Create user access review procedure (1 week)
   - Owner: IT Manager
   - Due: 2024-02-15

2. Conduct initial access review (2 weeks)
   - Owner: IT Manager + Department Heads
   - Due: 2024-03-01
   - Deliverable: Spreadsheet of all users and access, signed by managers

3. Schedule quarterly reviews (ongoing)
   - Owner: IT Manager
   - Frequency: Q1, Q2, Q3, Q4
   - Deliverable: Quarterly review sign-off

Resources Required:
- IT Manager time: 8 hours initial, 4 hours per quarter
- Department Head time: 2 hours per quarter
- Tools: Excel/SharePoint for tracking

Success Criteria:
- Procedure documented and approved
- Initial review completed with sign-offs
- Calendar invites sent for next 4 quarters
- Evidence folder created for audit
\`\`\`

### Phase 5: Tracking and Reporting

**Gap Tracking Spreadsheet**:
\`\`\`
| Gap ID | Control | Gap Type | Priority | Owner | Due Date | Status | % Complete |
|--------|---------|----------|----------|-------|----------|--------|------------|
| GAP-001| A.9.2.1 | Process  | P2       | IT Mgr| 03/01/24 | In Prog| 60%        |
| GAP-002| A.12.1.1| Policy   | P1       | CISO  | 02/15/24 | Done   | 100%       |
| GAP-003| CC6.1   | Tech     | P3       | IT Dir| 04/30/24 | Planned| 0%         |
\`\`\`

**Executive Dashboard**:
- **Total gaps identified**: 47
- **Critical (P1)**: 5 (4 complete, 1 in progress)
- **High (P2)**: 12 (7 complete, 5 in progress)
- **Medium (P3)**: 18 (3 complete, 8 in progress, 7 planned)
- **Low (P4)**: 12 (0 complete, 2 in progress, 10 planned)
- **Overall completion**: 32% (15 of 47 gaps closed)
- **On track for audit**: Yes (all P1/P2 gaps on schedule)

**Progress Visualization**:
\`\`\`
Gap Remediation Progress by Domain:

Access Control:     ████████░░ 80% (8/10 complete)
Cryptography:       ██████░░░░ 60% (3/5 complete)
Physical Security:  ████░░░░░░ 40% (2/5 complete)
Operations:         ██████████ 100% (12/12 complete)
\`\`\`

### Phase 6: Validation and Closure

Before closing a gap:

**1. Verify Implementation**
- Control is functioning as intended
- Documentation is complete and accurate
- Evidence is available

**2. Test the Control**
- Run a test to confirm it works
- Example: Try to access system without MFA (should fail)

**3. Collect Evidence**
- Screenshot, policy, procedure, log, attestation
- File in evidence repository with proper naming

**4. Update Gap Register**
- Mark as "Complete"
- Document date closed
- Attach evidence file path

**5. Sign-off**
- Get control owner sign-off
- Get compliance lead approval

### Phase 7: Re-Assessment

After remediation, re-assess maturity:

**Before**:
- A.9.2.1 User registration: Maturity = 2 (Partially Implemented)

**After**:
- A.9.2.1 User registration: Maturity = 3 (Implemented)
  - Procedure documented ✓
  - Quarterly reviews scheduled ✓
  - Evidence available ✓
  - Process tested ✓

## Common Pitfalls

❌ **Trying to fix everything at once** - Prioritize!
❌ **Underestimating effort** - Add 50% buffer to estimates
❌ **No ownership** - Every gap needs a named owner
❌ **Missing dependencies** - Some gaps must be fixed before others
❌ **Poor documentation** - Write down what you did
❌ **Skipping validation** - Always test before closing
❌ **No follow-through** - Weekly status meetings are critical

## Tools for Gap Analysis

- **Spreadsheets** (Excel, Google Sheets) - Simple, flexible
- **Vanta / Drata / Compliance.ai** - Automated continuous monitoring
- **Jira / Asana / Monday** - Project management for remediation
- **SharePoint / Confluence** - Documentation and evidence storage

## Timeline Example

**Pre-Audit Gap Analysis Timeline**:
\`\`\`
Month 1-2: Assessment
- Week 1-2: Document current state
- Week 3-4: Identify and categorize gaps
- Week 5-6: Prioritize and create remediation plan
- Week 7-8: Get executive approval and budget

Month 3-6: Remediation
- Month 3: Close all P1 (critical) gaps
- Month 4-5: Close all P2 (high) gaps
- Month 6: Close high-value P3 (medium) gaps

Month 7: Validation
- Week 1-2: Test all controls
- Week 3-4: Collect final evidence
- Final re-assessment and sign-off

Month 8: Audit
- Auditor fieldwork and review
\`\`\``
    },
    {
      id: 'policy-writing',
      title: 'Writing effective security policies',
      description: 'Complete guide to writing clear, enforceable security policies that satisfy compliance requirements.',
      category: 'Governance',
      difficulty: 'intermediate',
      readTime: '15 min',
      relatedTopics: ['iso-controls', 'gap-analysis'],
      content: `# Writing Effective Security Policies

A comprehensive guide to creating clear, enforceable policies.

## Policy vs. Procedure vs. Standard vs. Guideline

**Policy**: High-level statement of what must be done
- Uses "must" or "shall"
- Approved by executive leadership
- Example: "All users must use MFA for system access"

**Procedure**: Step-by-step instructions for how to implement the policy
- More detailed than policy
- May be owned by department managers
- Example: "How to enable MFA in Okta"

**Standard**: Specific technical requirements
- Detailed configurations
- Example: "Passwords must be minimum 12 characters, include uppercase, lowercase, number, and symbol"

**Guideline**: Recommended best practices (optional)
- Uses "should" instead of "must"
- Example: "Users should change passwords every 90 days"

## Policy Structure Template

### 1. Header Section
\`\`\`
Policy Name:     Information Security Policy
Policy Number:   ISP-001
Version:         2.0
Effective Date:  January 15, 2024
Review Date:     January 15, 2025
Owner:           Chief Information Security Officer
Approver:        Chief Executive Officer
Classification:  Internal
\`\`\`

### 2. Purpose
Why does this policy exist?
\`\`\`
Purpose:
This policy establishes the requirements for protecting [Company Name]'s
information assets from unauthorized access, disclosure, modification,
or destruction. This policy supports compliance with ISO 27001, SOC 2,
and applicable regulatory requirements.
\`\`\`

### 3. Scope
Who and what does this apply to?
\`\`\`
Scope:
This policy applies to:
- All employees, contractors, and third parties
- All information assets owned or managed by [Company Name]
- All systems, networks, and devices used to access company data
- All locations (office, remote, customer sites)

Exclusions:
- Public information on company website
- Guest Wi-Fi network (covered under Guest Network Policy)
\`\`\`

### 4. Policy Statements
Clear, enforceable requirements:
\`\`\`
Policy Requirements:

1. Access Control
   1.1 Users must authenticate using multi-factor authentication (MFA)
       for all system access.
   1.2 Users must only access information necessary for their job role.
   1.3 User access must be reviewed quarterly by department managers.

2. Data Protection
   2.1 Confidential data must be encrypted at rest using AES-256.
   2.2 Confidential data must be encrypted in transit using TLS 1.2 or higher.
   2.3 Confidential data must not be stored on unapproved cloud services.

3. Asset Management
   3.1 All IT assets must be inventoried and tagged.
   3.2 Assets must be returned upon termination of employment.
   3.3 Lost or stolen assets must be reported within 24 hours.
\`\`\`

### 5. Roles and Responsibilities
Who does what:
\`\`\`
Roles and Responsibilities:

CISO:
- Overall policy ownership and maintenance
- Annual policy review and update
- Exception approval for non-standard access

IT Security Team:
- Implement technical controls to enforce policy
- Monitor for policy violations
- Investigate security incidents

Department Managers:
- Ensure team members complete security training
- Conduct quarterly access reviews
- Approve access requests for their teams

All Users:
- Comply with all policy requirements
- Complete annual security awareness training
- Report suspected security incidents
\`\`\`

### 6. Compliance and Enforcement
How is this enforced:
\`\`\`
Compliance and Enforcement:

Monitoring:
- Automated monitoring of MFA compliance
- Quarterly access reviews
- Annual policy attestation by all employees

Violations:
- First violation: Written warning and mandatory retraining
- Second violation: Performance improvement plan
- Third violation: Termination of employment
- Intentional malicious activity: Immediate termination

Exceptions:
- All exceptions require CISO approval
- Exception must document business justification
- Exception must include compensating controls
- Exceptions reviewed quarterly
\`\`\`

### 7. Related Documents
What else should readers reference:
\`\`\`
Related Documents:

Procedures:
- User Provisioning and De-provisioning Procedure
- Access Review Procedure
- Incident Response Procedure

Standards:
- Password Standard
- Encryption Standard
- Mobile Device Standard

Other Policies:
- Acceptable Use Policy
- Data Classification and Handling Policy
- Remote Work Policy
\`\`\`

### 8. Definitions
Key terms explained:
\`\`\`
Definitions:

Confidential Data: Information that would cause material harm to the
company if disclosed, including customer data, financial records, and
intellectual property.

Information Asset: Any data, system, network, or device that has value
to the organization.

Multi-Factor Authentication (MFA): Authentication requiring two or more
verification factors (something you know, something you have, something you are).

User: Any individual with authorized access to company systems, including
employees, contractors, and third parties.
\`\`\`

### 9. Revision History
Version tracking:
\`\`\`
Revision History:

| Version | Date       | Author      | Changes                          |
|---------|------------|-------------|----------------------------------|
| 1.0     | 01/15/2023 | J. Smith    | Initial policy creation          |
| 1.1     | 06/20/2023 | J. Smith    | Added MFA requirement            |
| 2.0     | 01/15/2024 | M. Johnson  | Updated for ISO 27001:2022       |
\`\`\`

## Best Practices

### Writing Style
✅ **Use clear, simple language**
- "Users must use MFA" (good)
- "Users shall leverage multi-factor authentication methodologies" (bad - too complex)

✅ **Use "must" or "shall" for requirements**
- Not "should" or "may" (these are not enforceable)

✅ **Be specific**
- "within 24 hours" (good)
- "as soon as possible" (bad - too vague)

✅ **Keep it concise**
- Policies should be 1-3 pages
- Details go in procedures, not policies

✅ **Avoid technical jargon**
- Write for all employees, not just IT

### Policy Development Process
\`\`\`
1. Draft (1-2 weeks)
   - CISO or policy owner writes initial draft
   - Based on framework requirements (ISO 27001, SOC 2)

2. Review (1-2 weeks)
   - IT Security review for technical accuracy
   - Legal review for regulatory compliance
   - HR review for employment implications
   - Department heads review for feasibility

3. Approval (1 week)
   - CISO approval
   - Executive approval (CEO, COO, or Board)
   - Document signatures and dates

4. Publishing (1 week)
   - Publish to company intranet
   - Email notification to all employees
   - Add to new hire onboarding checklist

5. Training (2-4 weeks)
   - Create training materials
   - Conduct awareness sessions
   - Quiz to confirm understanding

6. Acknowledgment (ongoing)
   - All employees sign acknowledgment
   - Track completion in HR system
   - Re-acknowledge annually
\`\`\`

### Annual Review
Every policy should be reviewed annually:
- Is it still accurate?
- Are there new requirements to add?
- Are there outdated requirements to remove?
- Update version number and effective date
- Get executive re-approval

## Common Policies Needed

**Required for ISO 27001 / SOC 2**:
1. Information Security Policy (master policy)
2. Access Control Policy
3. Acceptable Use Policy
4. Data Classification and Handling Policy
5. Cryptography Policy
6. Asset Management Policy
7. Physical Security Policy
8. Change Management Policy
9. Incident Response Policy
10. Business Continuity Policy
11. Vendor Management Policy
12. Remote Work / BYOD Policy

## Red Flags

❌ **Generic policies** - Must be tailored to your organization
❌ **Copy/paste from internet** - Auditors can tell
❌ **No approval signatures** - Not official without executive sign-off
❌ **Policies older than 1 year** - Must review annually
❌ **Policies don't match actual practice** - Major audit finding
❌ **No training or acknowledgment** - Policies don't work if no one knows about them

## Tools
- **Google Docs / Microsoft Word** - Drafting and collaboration
- **SharePoint / Confluence** - Policy repository
- **DocuSign** - Electronic signatures for approval
- **LMS (Learning Management System)** - Training and acknowledgment tracking`
    },
    {
      id: 'incident-response',
      title: 'Incident Response Plan template',
      description: 'Complete IR plan structure with phases, playbooks, and communication templates.',
      category: 'Incident Response',
      difficulty: 'advanced',
      readTime: '25 min',
      relatedTopics: ['risk-assessment', 'policy-writing'],
      content: `# Incident Response Plan

A comprehensive incident response plan for security events.

## Executive Summary

This Incident Response Plan establishes procedures for detecting, responding to, and recovering from information security incidents.

**Objectives**:
- Minimize damage and recovery time
- Preserve evidence for forensics
- Communicate effectively with stakeholders
- Learn from incidents to prevent recurrence

## 1. Incident Response Team

### Core Team Members

**Incident Response Manager** (Primary contact)
- Name: [Name]
- Role: CISO or IT Security Manager
- Phone: [Number]
- Email: [Email]
- Responsibilities: Overall incident coordination, decision authority

**Security Analyst**
- Responsibilities: Initial triage, investigation, containment

**IT Operations**
- Responsibilities: System isolation, backup restoration, technical support

**Legal Counsel**
- Responsibilities: Regulatory compliance, law enforcement liaison

**Communications / PR**
- Responsibilities: Internal and external communications, media response

**HR Representative**
- Responsibilities: Insider threat investigations, employee notifications

**Executive Sponsor**
- Role: CEO or COO
- Responsibilities: Final authority for business impact decisions

### External Contacts

**Forensics Firm**
- Company: [Name]
- Contact: [Name, Phone, Email]
- Contract: On retainer / As-needed

**Cyber Insurance**
- Provider: [Name]
- Policy Number: [Number]
- Claims Phone: [Number]

**Law Enforcement**
- FBI Cyber Division: [Regional office number]
- Local Police: [Number]

**Regulatory Bodies**
- [Industry-specific regulators]
- Notification requirements: [Timeline]

## 2. Incident Classification

### Severity Levels

**P1 - Critical (Respond Immediately)**
- Active data breach with confirmed exfiltration
- Ransomware encryption of production systems
- Complete system outage affecting customers
- Successful unauthorized access to production databases
- **Response SLA**: 15 minutes to acknowledge, immediate action

**P2 - High (Respond within 1 hour)**
- Malware detected on multiple systems
- Suspected but unconfirmed data breach
- Unauthorized access attempt to critical systems
- DDoS attack causing service degradation
- **Response SLA**: 1 hour to acknowledge and begin triage

**P3 - Medium (Respond within 4 hours)**
- Policy violation (e.g., unauthorized software installation)
- Suspicious activity flagged by monitoring tools
- Phishing email received but not clicked
- Lost laptop with encrypted data
- **Response SLA**: 4 hours to acknowledge and assess

**P4 - Low (Respond within 24 hours)**
- Minor security events (e.g., failed login attempts)
- Routine vulnerability scan findings
- Security awareness test failures
- **Response SLA**: 24 hours to review and document

### Incident Categories

- **Malware**: Virus, ransomware, trojan, worm
- **Phishing**: Email-based social engineering attack
- **Unauthorized Access**: Compromised credentials, privilege escalation
- **Data Breach**: Confirmed exfiltration of sensitive data
- **DDoS**: Denial of service attack
- **Insider Threat**: Malicious or negligent employee action
- **Physical Security**: Theft, unauthorized entry
- **Supply Chain**: Vendor/partner compromise

## 3. Incident Response Phases

### Phase 1: Preparation

**Before an incident occurs**:

✅ **Maintain Incident Response Toolkit**:
- Forensic software (FTK, EnCase, Velociraptor)
- Clean USB drives and external hard drives
- Network packet capture tools (Wireshark)
- Password recovery tools
- Bootable forensic Linux distributions

✅ **Training and Exercises**:
- Quarterly tabletop exercises
- Annual full IR simulation
- Team member IR certification (GCIH, ECIH)

✅ **Communication Channels**:
- IR team Slack channel or Teams group
- Conference bridge number (always available)
- After-hours contact list

✅ **Documentation**:
- Incident response runbooks
- Vendor contact lists
- System diagrams and asset inventory
- Escalation paths

### Phase 2: Detection and Analysis

**How do we know an incident occurred?**

**Detection Sources**:
- SIEM alerts (Splunk, LogRhythm, Sentinel)
- EDR alerts (CrowdStrike, Carbon Black, SentinelOne)
- IDS/IPS alerts
- Antivirus alerts
- User reports (suspicious email, unusual activity)
- Third-party notification (vendor, customer, FBI)

**Initial Triage Questions**:
1. What happened? (Brief description)
2. When was it detected?
3. What systems/data are affected?
4. Is this still ongoing?
5. What is the business impact?
6. What is the severity level?

**Evidence Collection (Immediate)**:
- Take screenshots of alerts and errors
- Capture memory dumps of affected systems
- Preserve logs (copy to secure location)
- Document timeline of events
- Note all actions taken (who, what, when)

**Analysis**:
- Determine scope: How many systems/users affected?
- Identify attack vector: How did attacker get in?
- Assess impact: What data/systems compromised?
- Estimate damage: What's the worst case scenario?

### Phase 3: Containment

**Goal**: Stop the bleeding without destroying evidence

**Short-Term Containment (Immediate)**:
- Isolate affected systems (disconnect from network, not power off)
- Block malicious IP addresses at firewall
- Disable compromised user accounts
- Change passwords for privileged accounts
- Enable additional monitoring/logging

**Long-Term Containment (Within hours/days)**:
- Apply emergency patches to close exploited vulnerabilities
- Implement temporary compensating controls
- Segment network to prevent lateral movement
- Deploy additional security monitoring

**Evidence Preservation**:
❗ **Critical: Do NOT power off systems**
- Powering off destroys volatile memory (RAM)
- Instead: Isolate from network, capture memory, then image disk

**Forensic Imaging**:
- Create bit-for-bit copy of affected system drives
- Maintain chain of custody documentation
- Store forensic images in secure location
- Use write-blockers to preserve evidence integrity

### Phase 4: Eradication

**Goal**: Remove the threat completely

**Steps**:
1. **Identify Root Cause**
   - What vulnerability was exploited?
   - How did malware spread?
   - Are there backdoors or persistence mechanisms?

2. **Remove Malicious Code**
   - Delete malware files
   - Remove registry entries
   - Clear scheduled tasks created by attacker
   - Remove unauthorized user accounts

3. **Close Vulnerabilities**
   - Patch exploited software
   - Fix misconfigurations
   - Update firewall rules
   - Strengthen access controls

4. **Verify Eradication**
   - Run full antivirus/EDR scans
   - Check for indicators of compromise (IOCs)
   - Review logs for suspicious activity
   - Confirm attacker access is revoked

### Phase 5: Recovery

**Goal**: Restore normal operations safely

**Recovery Steps**:
1. **Rebuild Compromised Systems**
   - Reimage from known-good backups
   - Or rebuild from scratch (preferred for severe compromise)
   - Apply all security patches before reconnecting to network

2. **Restore Data**
   - Restore from clean backups (taken before incident)
   - Verify backup integrity before restoration
   - Test restored systems before production use

3. **Gradual Return to Production**
   - Restore least critical systems first
   - Monitor closely for re-infection
   - Restore critical systems last (under heavy monitoring)

4. **Enhanced Monitoring**
   - Increase logging verbosity for 30 days
   - Daily review of security logs
   - Deploy honeypot or canary tokens to detect attacker return

**Recovery Validation**:
- Run vulnerability scans
- Verify all security controls are functioning
- Confirm backups are working
- Test incident detection capability

### Phase 6: Post-Incident Activity

**Goal**: Learn and improve

**Lessons Learned Meeting** (Within 7 days of incident closure):

**Attendees**: All IR team members, affected department heads

**Agenda**:
1. What happened? (Timeline of events)
2. What went well?
3. What went poorly?
4. How can we improve?
5. Action items with owners and due dates

**Post-Incident Report Contents**:
- Executive summary (1 page)
- Incident timeline (detailed)
- Root cause analysis
- Business impact assessment
- Remediation actions taken
- Lessons learned
- Recommendations for prevention

**Follow-Up Actions**:
- Update incident response plan based on lessons learned
- Implement preventive measures
- Conduct additional training if needed
- Update risk register
- Regulatory notifications if required (GDPR, state breach laws)

## 4. Communication Plan

### Internal Communication

**During Incident**:
- Hourly updates to IR team
- Every 4 hours update to executives
- Daily update to affected departments
- Status page updates if customer-facing outage

**Escalation Path**:
\`\`\`
Security Analyst → IR Manager → CISO → CTO → CEO → Board

Escalate if:
- Severity increases (P2 → P1)
- Media involvement
- Regulatory notification required
- Customer data compromised
\`\`\`

### External Communication

**Customers**:
- Notify if their data compromised
- Provide timeline, impact, remediation
- Offer credit monitoring if PII exposed

**Regulators**:
- GDPR: 72 hours to notify supervisory authority
- State breach laws: Varies by state (typically 30-60 days)
- Industry-specific: HIPAA (60 days), PCI DSS (immediately)

**Law Enforcement**:
- FBI: Ransomware, nation-state attacks
- Secret Service: Financial fraud
- Local police: Physical theft

**Media**:
- Only designated spokesperson talks to media
- Prepared statement approved by Legal and PR
- No speculation about attribution or impact

**Vendors/Partners**:
- Notify if their data or systems affected
- Coordinate remediation if joint responsibility

### Communication Templates

**Internal Update Template**:
\`\`\`
Subject: [P1 INCIDENT] Security Incident Update #3

Status: Containment in progress
Last Updated: 2024-01-15 14:30 EST
Next Update: 2024-01-15 16:00 EST

Summary:
Ransomware attack detected on 15 workstations. No servers affected.
Network segments isolated. Restoring from backups in progress.

Impact:
- 15 employees unable to access workstations
- No customer-facing systems affected
- No data exfiltration detected

Actions Taken:
- Isolated affected network segment
- Disabled compromised user accounts
- Initiated backup restoration
- Engaged forensics firm

Next Steps:
- Complete forensic imaging (ETA: 16:00)
- Restore remaining workstations (ETA: 18:00)
- Root cause analysis (ETA: 24 hours)

Contact: [IR Manager Name] - [Phone] - [Email]
\`\`\`

## 5. Incident Playbooks

Create specific playbooks for common incident types:

### Ransomware Playbook
1. Isolate affected systems (disconnect from network)
2. Identify ransomware variant (submit sample to malware analysis)
3. Check for decryption tools (No More Ransom project)
4. Assess backup availability (clean backups before infection?)
5. **DO NOT** pay ransom (no guarantee of decryption, funds criminals)
6. Notify FBI IC3 (Internet Crime Complaint Center)
7. Restore from backups
8. Identify patient zero (how did it get in?)
9. Patch vulnerability or block attack vector

### Phishing/BEC Playbook
1. Identify all recipients of phishing email
2. Block sender email and domain
3. Remove email from all mailboxes
4. Check for clicks on malicious links (proxy logs, EDR)
5. Check for credential entry (did users enter passwords?)
6. If credentials compromised: Reset passwords, review account activity
7. Report to email provider (Gmail, Microsoft)
8. Security awareness training for affected users

### Data Breach Playbook
1. Confirm exfiltration (network logs, SIEM alerts)
2. Identify what data was accessed
3. Determine number of records/individuals affected
4. Assess regulatory notification requirements
5. Engage legal counsel and forensics firm
6. Preserve evidence (logs, system images)
7. Notify affected individuals (timeline per regulations)
8. Offer credit monitoring if PII exposed
9. Notify regulators (GDPR, state AG, OCR for HIPAA)
10. PR response and customer communication

## 6. Testing Requirements

**Tabletop Exercises** (Quarterly):
- 2-hour facilitated discussion
- Scenario-based (e.g., "Ransomware hits production database")
- All IR team members participate
- Document lessons learned

**Full IR Simulation** (Annually):
- Red team engagement or realistic simulation
- Test detection, response, and recovery
- Include after-hours response
- Test backup restoration
- Measure time to detect and respond

**Metrics to Track**:
- Mean Time to Detect (MTTD)
- Mean Time to Respond (MTTR)
- Mean Time to Recover (MTTR)
- Number of incidents by severity
- Cost per incident

## 7. Legal and Regulatory Considerations

**Evidence Handling**:
- Maintain chain of custody
- Document all evidence collection
- Use forensic tools to preserve integrity
- Don't alter original evidence

**Attorney-Client Privilege**:
- Engage forensics firm through legal counsel
- Mark IR communications as "Attorney-Client Privileged"

**Notification Requirements**:
- GDPR: 72 hours to notify supervisory authority
- California CCPA: Without unreasonable delay
- HIPAA: 60 days to notify HHS and affected individuals
- State breach laws: Varies (check all applicable states)

## 8. Continuous Improvement

After each incident:
- Update playbooks based on lessons learned
- Add new IOCs to threat intelligence
- Implement preventive controls
- Update SIEM rules and alerts
- Enhance monitoring and detection

Annual IR Plan Review:
- Update contact information
- Review and update playbooks
- Incorporate new threats and attack techniques
- Update based on business changes (new systems, new vendors)
- Get executive re-approval`
    },
    {
      id: 'vendor-assessment',
      title: 'Third-party vendor security assessment',
      description: 'Complete vendor risk management framework including assessment, monitoring, and offboarding.',
      category: 'Vendor Management',
      difficulty: 'advanced',
      readTime: '22 min',
      relatedTopics: ['risk-assessment', 'soc2-criteria'],
      content: `# Third-Party Vendor Security Assessment Framework

Comprehensive guidance for assessing and managing vendor security risks.

## Why Vendor Risk Management Matters

**Statistics**:
- 60% of data breaches involve third parties
- Average cost of third-party breach: $4.29M
- Regulatory requirements: SOC 2, ISO 27001, GDPR, HIPAA all require vendor management

**Your responsibility**:
Even when you outsource to vendors, you remain responsible for security and compliance.

## Vendor Risk Assessment Process

### Step 1: Vendor Inventory

Maintain a complete inventory of all third-party vendors:

**Vendor Inventory Template**:
\`\`\`
| Vendor | Service | Data Access | System Access | Risk Tier | Owner | Contract End |
|--------|---------|-------------|---------------|-----------|-------|--------------|
| AWS    | Cloud hosting | Customer PII | Production systems | Tier 1 | CTO | 2026-12-31 |
| Slack  | Team chat | Employee data | No systems | Tier 2 | IT | 2025-06-30 |
| Office supply | Office supplies | None | None | Tier 4 | Admin | 2024-12-31 |
\`\`\`

**Information to Track**:
- Vendor name and primary contact
- Service provided
- What data they access or store
- What systems they access
- Contract start and end dates
- Business owner (who manages relationship)
- Last assessment date
- Risk tier classification

### Step 2: Vendor Classification

Classify vendors by risk level to prioritize assessment efforts:

**Tier 1 - Critical Risk**:
- Access to production systems
- Store or process customer PII or payment data
- Critical to business operations (outage would halt business)
- **Examples**: Cloud hosting (AWS, Azure), payment processors (Stripe), CRM (Salesforce)
- **Assessment frequency**: Annual + continuous monitoring
- **Required**: SOC 2 Type II report

**Tier 2 - High Risk**:
- Limited system access (read-only, non-production)
- Handle non-sensitive company data
- Important but not critical to operations
- **Examples**: Email provider (Gmail), productivity tools (Slack), analytics (Google Analytics)
- **Assessment frequency**: Annual
- **Required**: Security questionnaire + evidence

**Tier 3 - Medium Risk**:
- No system access
- No access to sensitive data
- Minor business impact if compromised
- **Examples**: Marketing tools, survey platforms, project management
- **Assessment frequency**: Biennial (every 2 years)
- **Required**: Security questionnaire only

**Tier 4 - Low Risk**:
- Minimal or no risk
- **Examples**: Office supplies, catering, facilities
- **Assessment frequency**: No formal assessment
- **Required**: Standard contract only

### Step 3: Initial Assessment

#### Security Questionnaire

Send vendors a comprehensive security questionnaire:

**Sample Questions** (50-100 questions total):

**Company Information**:
1. Company name, address, primary contact
2. How long have you been in business?
3. How many employees?
4. Primary business location and data center locations
5. Do you use subcontractors? (If yes, list them)

**Certifications and Compliance**:
6. Do you have ISO 27001 certification? (Provide certificate)
7. Do you have SOC 2 Type II report? (Provide report from last 12 months)
8. Are you PCI DSS compliant? (If handling payment data)
9. Are you HIPAA compliant? (If handling PHI)
10. Are you GDPR compliant? (If handling EU data)

**Security Policies and Procedures**:
11. Do you have an Information Security Policy? (Provide copy)
12. When was it last updated?
13. Do you have an Incident Response Plan?
14. When was it last tested?
15. Do you have a Business Continuity/Disaster Recovery Plan?

**Access Controls**:
16. Do you enforce multi-factor authentication (MFA)? (For all users or just admins?)
17. Do you conduct user access reviews? (How often?)
18. How quickly do you revoke access when employees leave?
19. Do you use role-based access control (RBAC)?
20. Do you enforce password complexity requirements? (Describe)

**Data Protection**:
21. Do you encrypt data at rest? (What encryption standard?)
22. Do you encrypt data in transit? (TLS version?)
23. Where is data stored geographically?
24. Do you commingle customer data or is it logically separated?
25. How do you handle data disposal when a customer churns?

**Network Security**:
26. Do you use firewalls? (Describe architecture)
27. Do you have intrusion detection/prevention systems (IDS/IPS)?
28. Is your network segmented?
29. Do you perform vulnerability scans? (How often?)
30. Do you perform penetration testing? (How often? Provide recent report)

**Monitoring and Logging**:
31. Do you have a SIEM or centralized logging?
32. How long do you retain logs?
33. Do you have 24/7 security monitoring?
34. How quickly do you detect and respond to security events?

**Backup and Recovery**:
35. How frequently do you backup data?
36. Where are backups stored?
37. Are backups encrypted?
38. How often do you test backup restoration?
39. What is your Recovery Time Objective (RTO)?
40. What is your Recovery Point Objective (RPO)?

**Incident Response**:
41. Do you have an Incident Response team?
42. Have you had any security incidents in the last 12 months? (Describe)
43. How quickly do you notify customers of a breach?
44. Do you have cyber liability insurance? (Coverage amount?)

**Security Training**:
45. Do you provide security awareness training to employees? (How often?)
46. Do you conduct phishing simulations?
47. Do employees undergo background checks?

**Vendor Management**:
48. Do you use sub-processors/subcontractors?
49. Do you assess security of your sub-processors?
50. Will you notify us if you add new sub-processors?

#### Evidence Collection

For Tier 1 vendors, request supporting documentation:

**Required Documents**:
✅ **SOC 2 Type II Report** (within last 12 months)
- Review audit opinion (qualified or unqualified?)
- Review test of controls results (any failures?)
- Check audit period (covers at least 6 months?)

✅ **ISO 27001 Certificate** (if applicable)
- Verify certificate is current (not expired)
- Check scope (does it cover services you use?)
- Verify with certification body if authenticity is questionable

✅ **Penetration Test Results** (within last 12 months)
- Review findings (any critical or high severity issues?)
- Check remediation status (are findings closed?)
- Verify test scope (covers your environment?)

✅ **Disaster Recovery Test Results**
- When was last test?
- Did it succeed?
- RTO/RPO met?

✅ **Cyber Insurance Certificate**
- Coverage amount (minimum $2M recommended)
- Expiration date
- Does it cover data breach notification costs?

✅ **Data Processing Agreement (DPA)** - Required for GDPR
- Defines roles (controller vs processor)
- Specifies data protection obligations
- Includes standard contractual clauses (SCCs) if EU data

✅ **Business Associate Agreement (BAA)** - Required for HIPAA
- If vendor will access Protected Health Information (PHI)

### Step 4: Risk Scoring

Score vendors on a 0-100 scale:

**Scoring Rubric**:

**Security Posture (0-25 points)**:
- Has current SOC 2 Type II: +15 points
- Has ISO 27001: +10 points
- No certifications: 0 points
- MFA enforced: +5 points
- Annual penetration tests: +5 points

**Compliance Certifications (0-25 points)**:
- SOC 2 Type II: +10 points
- ISO 27001: +10 points
- PCI DSS (if applicable): +5 points
- HIPAA (if applicable): +5 points
- GDPR compliant: +5 points

**Data Protection Practices (0-25 points)**:
- Encryption at rest (AES-256): +10 points
- Encryption in transit (TLS 1.2+): +10 points
- Data residency controls: +5 points
- Secure data disposal: +5 points

**Incident Response Capability (0-25 points)**:
- Written IR plan: +5 points
- IR plan tested annually: +5 points
- 24-hour breach notification: +10 points
- Cyber insurance: +5 points

**Total Score Interpretation**:
- **85-100**: Low risk (approve without conditions)
- **70-84**: Medium risk (approve with annual re-assessment)
- **50-69**: High risk (require remediation plan before approval)
- **< 50**: Critical risk (do not approve, find alternative vendor)

### Step 5: Contract Requirements

Include security provisions in all vendor contracts:

**Essential Clauses**:

**1. Security Requirements**
\`\`\`
Vendor shall maintain security controls consistent with industry standards
including but not limited to:
- Multi-factor authentication for all user accounts
- Encryption of data at rest (AES-256 or equivalent)
- Encryption of data in transit (TLS 1.2 or higher)
- Annual penetration testing by independent third party
- Security awareness training for all employees
\`\`\`

**2. Audit Rights**
\`\`\`
Customer reserves the right to audit Vendor's security controls upon
30 days written notice, no more than once per year. Vendor shall provide
current SOC 2 Type II report within 30 days of request.
\`\`\`

**3. Breach Notification**
\`\`\`
Vendor shall notify Customer within 24 hours of discovering any security
incident that affects Customer data. Notification shall include:
- Description of incident
- Data affected
- Number of individuals impacted
- Remediation steps taken
\`\`\`

**4. Data Handling**
\`\`\`
Vendor shall:
- Process Customer data only as instructed
- Not use Customer data for any purpose other than providing services
- Not disclose Customer data to third parties without written consent
- Delete or return all Customer data within 30 days of contract termination
\`\`\`

**5. Subcontractors**
\`\`\`
Vendor shall not engage subcontractors to process Customer data without
prior written approval. Vendor shall ensure subcontractors meet same
security requirements as Vendor.
\`\`\`

**6. Indemnification**
\`\`\`
Vendor shall indemnify Customer for losses resulting from Vendor's
security breach or failure to meet contractual security obligations.
\`\`\`

**7. Insurance**
\`\`\`
Vendor shall maintain cyber liability insurance with minimum coverage of
$2,000,000 and provide certificate of insurance upon request.
\`\`\`

**8. Termination**
\`\`\`
Customer may terminate agreement immediately upon material breach of
security obligations, including failure to notify Customer of breach
within required timeframe.
\`\`\`

### Step 6: Ongoing Monitoring

Don't just assess once - continuous monitoring is critical:

**Annual Re-Assessment**:
- Request updated SOC 2 report (for Tier 1)
- Request updated questionnaire (for Tier 2/3)
- Review any security incidents from past year
- Check for changes in service (new features, new subcontractors)

**Continuous Monitoring**:
- **Security news monitoring**: Set Google Alerts for "[Vendor Name] breach" or "[Vendor Name] security"
- **Dark web monitoring**: Check if vendor appears in breach databases (Have I Been Pwned, etc.)
- **SOC 2 report review**: When vendor publishes new report, review immediately
- **Quarterly business reviews**: For Tier 1 vendors, include security discussion

**Triggers for Re-Assessment**:
- Vendor has a security breach
- Vendor changes ownership (acquisition)
- Vendor changes subcontractors
- Your use of vendor changes (now accessing more sensitive data)
- Contract renewal (always re-assess before renewing)

### Step 7: Vendor Offboarding

When vendor relationship ends:

**Offboarding Checklist**:

✅ **Access Revocation** (within 24 hours):
- Revoke all vendor access to your systems
- Remove vendor from VPN
- Remove vendor from email distribution lists
- Revoke API keys and service accounts

✅ **Data Deletion**:
- Request vendor delete all customer data
- Specify deletion method (secure wipe, not just "delete")
- Request certificate of destruction or attestation

✅ **Confirmation**:
- Get written confirmation of data deletion
- Verify backups are also deleted
- Check if vendor has legal retention requirements (may need to retain some data)

✅ **Documentation**:
- Update vendor inventory (mark as "offboarded")
- Archive vendor assessment and contract
- Document lessons learned (why did relationship end?)

## Vendor Risk Dashboard

Track vendor risk with executive dashboard:

**Metrics to Track**:
- Total number of vendors: 47
- Tier 1 (Critical): 8 vendors
- Tier 2 (High): 15 vendors
- Tier 3 (Medium): 18 vendors
- Tier 4 (Low): 6 vendors

**Assessment Status**:
- Fully assessed: 38 vendors (81%)
- Assessment in progress: 5 vendors (11%)
- Assessment overdue: 4 vendors (8%)

**Risk Distribution**:
- Low risk (85-100): 30 vendors (64%)
- Medium risk (70-84): 10 vendors (21%)
- High risk (50-69): 5 vendors (11%)
- Critical risk (<50): 2 vendors (4%) ⚠️ ACTION REQUIRED

**Compliance**:
- SOC 2 reports received: 7 of 8 Tier 1 vendors (88%)
- Contracts include security clauses: 40 of 47 vendors (85%)
- Annual re-assessments on schedule: 92%

## Tools for Vendor Risk Management

**Vendor Risk Platforms**:
- **Whistic / OneTrust / SecurityScorecard** - Automated vendor assessments, questionnaire management, continuous monitoring
- **BitSight / UpGuard** - Security ratings based on external scans (like credit scores for security)

**Manual Options**:
- **Spreadsheet** (Excel, Google Sheets) - Simple vendor inventory and tracking
- **SharePoint / Google Drive** - Store questionnaires and evidence
- **Jira / Asana** - Track assessment tasks and remediation

## Common Pitfalls

❌ **Not maintaining vendor inventory** - You can't assess vendors you don't know about
❌ **Accepting outdated SOC 2 reports** - Report must be < 12 months old
❌ **Not reading the SOC 2 report** - Check for qualified opinions and test failures
❌ **One-time assessment** - Vendor security changes over time, re-assess annually
❌ **No contract security clauses** - You have no recourse if vendor has breach
❌ **Ignoring subcontractors** - Your vendor's vendors are also your risk
❌ **No offboarding process** - Vendors retain your data indefinitely

## Red Flags

🚩 Vendor refuses to complete security questionnaire
🚩 Vendor has no SOC 2 or ISO 27001 despite being Tier 1
🚩 Vendor had recent breach and downplays it
🚩 Vendor won't agree to breach notification terms
🚩 Vendor won't commit to data deletion upon termination
🚩 Vendor uses subcontractors they won't disclose
🚩 Vendor's SOC 2 report has qualified opinion or many exceptions

When you see red flags: Find an alternative vendor or accept the risk with executive sign-off and compensating controls.`
    }
  ]

  const categories = ['all', ...Array.from(new Set(topics.map(t => t.category)))]

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = searchQuery === '' ||
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700'
      case 'advanced': return 'bg-red-100 text-red-700'
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
                <Lightbulb className="w-10 h-10 text-yellow-500" />
                Learning Center
              </h1>
              <p className="text-gray-600 text-lg">
                Educational resources and deep-dive guides for security compliance professionals
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                Learn While You Work
              </h3>
              <p className="text-yellow-700 text-sm leading-relaxed">
                Our learning center provides in-depth educational content on compliance frameworks,
                security practices, and implementation guidance. Each topic includes practical examples
                and real-world applications.
              </p>
            </div>
          </div>
        </div>

        {selectedTopic ? (
          // Topic Detail View
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => setSelectedTopic(null)}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to all topics
            </button>

            {/* Topic Header */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-3xl font-bold text-gray-900">{selectedTopic.title}</h2>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedTopic.difficulty)}`}>
                    {selectedTopic.difficulty}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedTopic.readTime}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{selectedTopic.description}</p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">
                  {selectedTopic.category}
                </span>
              </div>
            </div>

            {/* Topic Content */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <div className="prose prose-indigo max-w-none">
                <div className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-6 rounded-lg border border-gray-200 overflow-auto">
                  {selectedTopic.content}
                </div>
              </div>
            </div>

            {/* Related Topics */}
            {selectedTopic.relatedTopics.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Related Topics
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {selectedTopic.relatedTopics.map(relatedId => {
                    const relatedTopic = topics.find(t => t.id === relatedId)
                    if (!relatedTopic) return null
                    return (
                      <button
                        key={relatedId}
                        onClick={() => setSelectedTopic(relatedTopic)}
                        className="text-left p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                      >
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{relatedTopic.title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2">{relatedTopic.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Topic List View
          <>
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
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
                Showing {filteredTopics.length} of {topics.length} topics
              </div>
            </div>

            {/* Topics Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {filteredTopics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6 cursor-pointer group"
                >
                  {/* Title and Badges */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex-1">
                      {topic.title}
                    </h3>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0 ml-2" />
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {topic.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      {topic.category}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(topic.difficulty)}`}>
                      {topic.difficulty}
                    </span>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {topic.readTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredTopics.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No topics found</h3>
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
          </>
        )}
      </div>
    </ProtectedLayout>
  )
}
