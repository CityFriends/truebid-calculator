'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Target, 
  AlertTriangle, 
  Wrench, 
  FileText, 
  Plus, 
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  GitBranch,
  Database,
  Shield,
  Network,
  FileQuestion,
  Search,
  Grid3x3,
  List,
  HelpCircle,
  Info,
  X,
  User,
  TrendingUp,
  LayoutGrid,
  Edit2
} from 'lucide-react'

interface Epic {
  id: string
  title: string
  description: string
  storyPoints: number
  requiredRoles: string[]
  priority: 'high' | 'medium' | 'low'
  assumptions: string[]
  dependencies: string[]
  timeline: {
    estimatedStart: string
    estimatedEnd: string
    milestones: string[]
  }
  acceptanceCriteria: string[]
  successMetrics: string[]
  technicalDetails: {
    stack: string[]
    constraints: string[]
    integrations: string[]
    compliance: string[]
  }
  testingStrategy: string[]
  documentationNeeds: string[]
  dataRequirements: string[]
  openQuestions: string[]
}

type SectionType = 'epics' | 'risks' | 'technical' | 'assumptions'

// Risk interface
interface Risk {
  id: string
  title: string
  description: string
  probability: number // 1-3 (Low, Medium, High)
  impact: number // 1-3 (Low, Medium, High)
  category: string
  mitigation: string
  owner: string
  relatedEpics: string[] // epic IDs
}

// Form data interface for adding/editing risks
interface RiskFormData {
  title: string
  description: string
  probability: number
  impact: number
  category: string
  mitigation: string
  owner: string
  relatedEpics: string
}

// Form data interface for adding new epics
interface EpicFormData {
  title: string
  description: string
  storyPoints: string
  priority: 'high' | 'medium' | 'low'
  timelineStart: string
  timelineEnd: string
  requiredRoles: string
  assumptions: string
  dependencies: string
}

// Enhanced mock data for epics
const mockEpics: Epic[] = [
  {
    id: '1',
    title: 'User Authentication & Authorization',
    description: 'Implement secure authentication system with role-based access control, SSO integration, and MFA',
    storyPoints: 45,
    requiredRoles: ['Technical Lead', 'Senior Software Engineer'],
    priority: 'high',
    assumptions: [
      'OAuth 2.0 integration required',
      'NIST 800-63 compliance needed',
      'Government will provide SSO integration details',
      'MFA required for all admin users'
    ],
    dependencies: ['Database schema design', 'Security framework selection'],
    timeline: {
      estimatedStart: 'Sprint 1',
      estimatedEnd: 'Sprint 3',
      milestones: ['SSO integration complete', 'MFA enabled', 'RBAC implemented']
    },
    acceptanceCriteria: [
      'Users can login via SSO',
      'MFA is enforced for admin roles',
      'Role-based permissions control access',
      'Session management meets NIST standards'
    ],
    successMetrics: [
      'Login success rate > 99%',
      'Authentication latency < 500ms',
      'Zero security vulnerabilities in penetration test'
    ],
    technicalDetails: {
      stack: ['OAuth 2.0', 'JWT tokens', 'Redis for session storage'],
      constraints: ['Must work with PIV cards', 'FedRAMP Moderate compliant'],
      integrations: ['Government SSO provider', 'Active Directory', 'PKI infrastructure'],
      compliance: ['NIST 800-63B', 'FedRAMP', 'FISMA Moderate']
    },
    testingStrategy: [
      'Unit tests for all auth flows',
      'Integration tests with SSO provider',
      'Penetration testing by approved vendor',
      'Load testing for 10,000 concurrent users'
    ],
    documentationNeeds: [
      'User authentication guide',
      'Admin role management guide',
      'SSO integration documentation',
      'Security audit trail documentation'
    ],
    dataRequirements: [
      'User profile data from existing system',
      'Role definitions and permissions matrix',
      'Audit log retention policy'
    ],
    openQuestions: [
      'What is the exact SSO endpoint URL?',
      'Do we need to support CAC cards?',
      'Session timeout requirements?',
      'Password complexity requirements?'
    ]
  },
  {
    id: '2',
    title: 'Data Migration & Integration',
    description: 'Migrate legacy system data and integrate with existing government databases',
    storyPoints: 60,
    requiredRoles: ['Technical Lead', 'Senior Software Engineer', 'DevOps Engineer'],
    priority: 'high',
    assumptions: [
      'API access to legacy systems provided',
      'Data quality issues expected',
      'Government provides data dictionary',
      'Migration can happen over 2 weeks'
    ],
    dependencies: ['Database design approved', 'API access granted'],
    timeline: {
      estimatedStart: 'Sprint 2',
      estimatedEnd: 'Sprint 5',
      milestones: ['Data mapping complete', 'Test migration successful', 'Production migration complete']
    },
    acceptanceCriteria: [
      'All historical data migrated',
      'Data validation passes 100%',
      'No data loss during migration',
      'Real-time sync established'
    ],
    successMetrics: [
      'Migration completes within 48-hour window',
      'Data accuracy > 99.9%',
      'Zero downtime for end users'
    ],
    technicalDetails: {
      stack: ['ETL pipeline', 'Apache Kafka', 'PostgreSQL'],
      constraints: ['Must preserve all audit trails', 'Cannot modify source systems'],
      integrations: ['Legacy Oracle database', 'SharePoint', 'SAP'],
      compliance: ['Data classification handling', 'PII protection', 'FISMA Moderate']
    },
    testingStrategy: [
      'Test migration with subset of data',
      'Data validation scripts',
      'Rollback procedures tested',
      'Load testing with production volumes'
    ],
    documentationNeeds: [
      'Data migration runbook',
      'Data mapping documentation',
      'Rollback procedures',
      'Data validation reports'
    ],
    dataRequirements: [
      'Complete data dictionary from legacy system',
      'Sample datasets for testing',
      'Data volume estimates',
      'Data retention requirements'
    ],
    openQuestions: [
      'What is acceptable downtime window?',
      'Do we have database snapshots?',
      'Who validates data accuracy?',
      'Rollback SLA requirements?'
    ]
  },
  {
    id: '3',
    title: 'Reporting Dashboard',
    description: 'Build comprehensive analytics dashboard with real-time metrics and export capabilities',
    storyPoints: 35,
    requiredRoles: ['Senior Software Engineer'],
    priority: 'medium',
    assumptions: [
      'Real-time data requirements TBD',
      'Chart.js or D3.js acceptable',
      'Export to PDF and Excel required'
    ],
    dependencies: ['Data pipeline established'],
    timeline: {
      estimatedStart: 'Sprint 4',
      estimatedEnd: 'Sprint 6',
      milestones: ['Dashboard UI complete', 'Real-time updates working', 'Export functionality complete']
    },
    acceptanceCriteria: [
      'Dashboard loads in < 2 seconds',
      'Data updates in real-time',
      'Export generates valid reports',
      'Mobile responsive design'
    ],
    successMetrics: [
      'User satisfaction score > 4.5/5',
      'Dashboard usage > 80% of users',
      'Export success rate > 99%'
    ],
    technicalDetails: {
      stack: ['React', 'Chart.js', 'WebSockets'],
      constraints: ['Must work on IE11', 'Section 508 compliant'],
      integrations: ['Data warehouse', 'Export service'],
      compliance: ['Section 508', 'WCAG 2.1 AA']
    },
    testingStrategy: [
      'Accessibility testing',
      'Cross-browser testing',
      'Load testing with large datasets',
      'Usability testing with end users'
    ],
    documentationNeeds: [
      'Dashboard user guide',
      'Report export guide',
      'Metrics definitions'
    ],
    dataRequirements: [
      'Historical data for trending',
      'Real-time data feed specifications'
    ],
    openQuestions: [
      'Which metrics are priority?',
      'Refresh frequency requirements?',
      'Data retention for reports?'
    ]
  },
  {
    id: '4',
    title: 'Mobile Application',
    description: 'Develop iOS and Android mobile apps with offline capabilities',
    storyPoints: 80,
    requiredRoles: ['Technical Lead', 'Senior Software Engineer'],
    priority: 'low',
    assumptions: [
      'React Native acceptable',
      'App store approval process handled by government',
      'Offline-first architecture required'
    ],
    dependencies: ['API development complete', 'Authentication system ready'],
    timeline: {
      estimatedStart: 'Sprint 7',
      estimatedEnd: 'Sprint 12',
      milestones: ['MVP features complete', 'Beta testing', 'App store submission']
    },
    acceptanceCriteria: [
      'Works offline with sync',
      'Native performance',
      'Passes security review',
      'App store approved'
    ],
    successMetrics: [
      'App store rating > 4.0',
      'Crash rate < 0.1%',
      'Daily active users > 1000'
    ],
    technicalDetails: {
      stack: ['React Native', 'SQLite', 'Redux'],
      constraints: ['Must support iOS 13+', 'Android 8+', 'Offline mode required'],
      integrations: ['REST API', 'Push notifications'],
      compliance: ['Mobile security guidelines', 'ATO for mobile devices']
    },
    testingStrategy: [
      'Device testing (iOS/Android)',
      'Offline scenario testing',
      'Security penetration testing',
      'Beta user testing'
    ],
    documentationNeeds: [
      'Mobile app user guide',
      'Installation guide',
      'Troubleshooting guide'
    ],
    dataRequirements: [
      'Sync strategy definition',
      'Offline data storage limits'
    ],
    openQuestions: [
      'Which devices to support?',
      'MDM integration required?',
      'Push notification requirements?'
    ]
  },
  {
    id: '5',
    title: 'API Gateway & Microservices',
    description: 'Design and implement API gateway with microservices architecture',
    storyPoints: 55,
    requiredRoles: ['Technical Lead', 'Senior Software Engineer', 'DevOps Engineer'],
    priority: 'high',
    assumptions: ['Kubernetes deployment', 'Kong or AWS API Gateway acceptable'],
    dependencies: ['Infrastructure provisioned'],
    timeline: {
      estimatedStart: 'Sprint 2',
      estimatedEnd: 'Sprint 5',
      milestones: ['API gateway deployed', 'Service mesh configured', 'Load balancing active']
    },
    acceptanceCriteria: [
      'API response time < 200ms',
      'Auto-scaling configured',
      'Rate limiting implemented',
      'API documentation complete'
    ],
    successMetrics: [
      '99.9% uptime',
      'Handle 10,000 requests/second',
      'Zero data breaches'
    ],
    technicalDetails: {
      stack: ['Kong API Gateway', 'Kubernetes', 'Docker', 'Istio'],
      constraints: ['FedRAMP compliant', 'Must support legacy SOAP services'],
      integrations: ['All backend services', 'Authentication service', 'Logging service'],
      compliance: ['FedRAMP Moderate', 'API security best practices']
    },
    testingStrategy: [
      'Load testing',
      'Security testing',
      'Chaos engineering tests',
      'Integration tests'
    ],
    documentationNeeds: [
      'API documentation',
      'Architecture diagrams',
      'Deployment runbooks'
    ],
    dataRequirements: [
      'API traffic patterns',
      'Rate limit definitions'
    ],
    openQuestions: [
      'Which API gateway platform?',
      'Service mesh required?',
      'Traffic volume estimates?'
    ]
  },
  {
    id: '6',
    title: 'Search Functionality',
    description: 'Implement full-text search with filters and faceted navigation',
    storyPoints: 40,
    requiredRoles: ['Senior Software Engineer'],
    priority: 'medium',
    assumptions: ['Elasticsearch or Solr acceptable', 'Search index can be rebuilt nightly'],
    dependencies: ['Data pipeline complete'],
    timeline: {
      estimatedStart: 'Sprint 5',
      estimatedEnd: 'Sprint 7',
      milestones: ['Search index built', 'UI implemented', 'Performance tuned']
    },
    acceptanceCriteria: [
      'Search results in < 500ms',
      'Supports filtering and facets',
      'Handles typos and synonyms',
      'Mobile responsive'
    ],
    successMetrics: [
      'Search usage > 60% of users',
      'Result relevance score > 4.0/5',
      'Click-through rate > 40%'
    ],
    technicalDetails: {
      stack: ['Elasticsearch', 'React', 'Node.js'],
      constraints: ['Must work with existing data model', '508 compliant'],
      integrations: ['Database', 'Content management system'],
      compliance: ['Section 508', 'PII handling']
    },
    testingStrategy: [
      'Relevance testing',
      'Load testing',
      'Accessibility testing',
      'User acceptance testing'
    ],
    documentationNeeds: [
      'Search user guide',
      'Admin guide for index management'
    ],
    dataRequirements: [
      'Search query volume estimates',
      'Content to be indexed'
    ],
    openQuestions: [
      'Real-time indexing required?',
      'Search analytics requirements?',
      'Synonym dictionary provided?'
    ]
  },
  {
    id: '7',
    title: 'Notification System',
    description: 'Build email and in-app notification system with preferences',
    storyPoints: 30,
    requiredRoles: ['Senior Software Engineer'],
    priority: 'medium',
    assumptions: ['Email service provided by government', 'Push notifications for mobile'],
    dependencies: ['User preferences system', 'Mobile app'],
    timeline: {
      estimatedStart: 'Sprint 6',
      estimatedEnd: 'Sprint 8',
      milestones: ['Email notifications working', 'In-app notifications', 'Preferences UI complete']
    },
    acceptanceCriteria: [
      'Notifications delivered reliably',
      'Users can manage preferences',
      'Email templates professional',
      'Mobile push works'
    ],
    successMetrics: [
      'Delivery rate > 99%',
      'Open rate > 30%',
      'Opt-out rate < 5%'
    ],
    technicalDetails: {
      stack: ['SendGrid/SES', 'WebSockets', 'React'],
      constraints: ['Government email system integration', 'CAN-SPAM compliance'],
      integrations: ['Email service', 'Mobile app', 'User service'],
      compliance: ['CAN-SPAM', 'Privacy requirements']
    },
    testingStrategy: [
      'Delivery testing',
      'Template rendering tests',
      'Load testing',
      'User testing'
    ],
    documentationNeeds: [
      'Notification preferences guide',
      'Email template library'
    ],
    dataRequirements: [
      'User email addresses',
      'Notification preferences'
    ],
    openQuestions: [
      'Email sending limits?',
      'SMS notifications required?',
      'Notification frequency limits?'
    ]
  },
  {
    id: '8',
    title: 'Audit Logging & Compliance',
    description: 'Comprehensive audit logging system for compliance and security',
    storyPoints: 35,
    requiredRoles: ['Technical Lead', 'Senior Software Engineer'],
    priority: 'high',
    assumptions: ['7-year retention required', 'SIEM integration needed'],
    dependencies: ['Infrastructure setup'],
    timeline: {
      estimatedStart: 'Sprint 1',
      estimatedEnd: 'Sprint 3',
      milestones: ['Logging framework deployed', 'SIEM integrated', 'Retention policies configured']
    },
    acceptanceCriteria: [
      'All user actions logged',
      'Tamper-proof logs',
      'Searchable audit trail',
      'SIEM integration working'
    ],
    successMetrics: [
      'Log retention meets requirements',
      'Audit queries < 5 seconds',
      'Zero log loss'
    ],
    technicalDetails: {
      stack: ['ELK Stack', 'Splunk', 'S3 for retention'],
      constraints: ['7-year retention', 'Tamper-proof storage'],
      integrations: ['SIEM', 'All application services'],
      compliance: ['NIST 800-53', 'FISMA', 'SOC 2']
    },
    testingStrategy: [
      'Log integrity testing',
      'Retention testing',
      'Query performance testing',
      'Security testing'
    ],
    documentationNeeds: [
      'Audit log guide',
      'Compliance documentation',
      'Query examples'
    ],
    dataRequirements: [
      'Log volume estimates',
      'Retention policies'
    ],
    openQuestions: [
      'Which SIEM system?',
      'Log format requirements?',
      'Backup procedures?'
    ]
  }
]

// Mock risks data
const mockRisks: Risk[] = [
  {
    id: 'r1',
    title: 'SSO Integration Delays',
    description: 'Government SSO provider may not provide integration details on time, delaying authentication epic',
    probability: 2, // Medium
    impact: 3, // High
    category: 'technical',
    mitigation: 'Request SSO documentation early, identify alternative authentication methods as backup, allocate buffer time in schedule',
    owner: 'Technical Lead',
    relatedEpics: ['1']
  },
  {
    id: 'r2',
    title: 'Data Quality Issues',
    description: 'Legacy system data may contain inconsistencies, duplicates, or missing values requiring extensive cleanup',
    probability: 3, // High
    impact: 3, // High
    category: 'technical',
    mitigation: 'Conduct data quality assessment early, build robust validation scripts, allocate 30% extra time for data cleansing',
    owner: 'Senior Software Engineer',
    relatedEpics: ['2']
  },
  {
    id: 'r3',
    title: 'Mobile App Store Approval',
    description: 'Government app store approval process may take longer than expected or require security modifications',
    probability: 2, // Medium
    impact: 2, // Medium
    category: 'compliance',
    mitigation: 'Start approval process early, maintain checklist of government security requirements, engage security team proactively',
    owner: 'Technical Lead',
    relatedEpics: ['4']
  },
  {
    id: 'r4',
    title: 'Third-Party API Rate Limits',
    description: 'External integrations may have undocumented rate limits that affect system performance under load',
    probability: 1, // Low
    impact: 2, // Medium
    category: 'technical',
    mitigation: 'Implement caching layer, design retry logic with exponential backoff, negotiate higher rate limits with vendors',
    owner: 'DevOps Engineer',
    relatedEpics: ['5', '6']
  },
  {
    id: 'r5',
    title: 'Compliance Audit Findings',
    description: 'FedRAMP or FISMA audit may identify security gaps requiring rework of authentication or logging systems',
    probability: 2, // Medium
    impact: 3, // High
    category: 'compliance',
    mitigation: 'Conduct internal security review before audit, maintain audit trail documentation, budget contingency for compliance fixes',
    owner: 'Technical Lead',
    relatedEpics: ['1', '8']
  },
  {
    id: 'r6',
    title: 'Resource Availability',
    description: 'Key technical resources may be pulled to other priority projects or leave during critical phases',
    probability: 1, // Low
    impact: 3, // High
    category: 'resource',
    mitigation: 'Cross-train team members, document architectural decisions thoroughly, maintain strong relationship with resource managers',
    owner: '',
    relatedEpics: []
  },
  {
    id: 'r7',
    title: 'Browser Compatibility',
    description: 'IE11 support requirement may significantly increase development and testing effort for dashboard',
    probability: 3, // High
    impact: 1, // Low
    category: 'technical',
    mitigation: 'Use polyfills from project start, test in IE11 continuously, negotiate sunset date for IE11 support',
    owner: 'Senior Software Engineer',
    relatedEpics: ['3']
  },
  {
    id: 'r8',
    title: 'Performance Under Load',
    description: 'System may not meet performance requirements when scaled to production user volumes',
    probability: 2, // Medium
    impact: 2, // Medium
    category: 'technical',
    mitigation: 'Conduct load testing early and often, implement performance monitoring, architect for horizontal scaling',
    owner: 'DevOps Engineer',
    relatedEpics: ['5', '6']
  }
]

type ViewMode = 'matrix' | 'grid' | 'list'

export function ScopingTab() {
  const [activeSection, setActiveSection] = useState<SectionType>('epics')
  const [epics, setEpics] = useState<Epic[]>(mockEpics)
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null)
  const [showAllEpics, setShowAllEpics] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'priority' | 'story-points' | 'timeline'>('priority')
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Add Epic Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null)
  const [formData, setFormData] = useState<EpicFormData>({
    title: '',
    description: '',
    storyPoints: '',
    priority: 'medium',
    timelineStart: '',
    timelineEnd: '',
    requiredRoles: '',
    assumptions: '',
    dependencies: ''
  })
  const [formErrors, setFormErrors] = useState<Partial<EpicFormData>>({})

  // Risk State
  const [risks, setRisks] = useState<Risk[]>(mockRisks)
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null)
  const [showAllRisks, setShowAllRisks] = useState(false)
  const [riskSearchQuery, setRiskSearchQuery] = useState('')
  const [riskViewMode, setRiskViewMode] = useState<ViewMode>('matrix')
  
  // Risk Dialog State
  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false)
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null)
  const [riskFormData, setRiskFormData] = useState<RiskFormData>({
    title: '',
    description: '',
    probability: 2,
    impact: 2,
    category: 'technical',
    mitigation: '',
    owner: '',
    relatedEpics: ''
  })
  const [riskFormErrors, setRiskFormErrors] = useState<Partial<RiskFormData>>({})
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false)
  const [detailsRisk, setDetailsRisk] = useState<Risk | null>(null)

  const totalStoryPoints = epics.reduce((sum, epic) => sum + epic.storyPoints, 0)

  // Filter and sort epics
  const filteredAndSortedEpics = epics
    .filter(epic => {
      const matchesSearch = epic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           epic.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPriority = filterPriority === 'all' || epic.priority === filterPriority
      return matchesSearch && matchesPriority
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      } else if (sortBy === 'story-points') {
        return b.storyPoints - a.storyPoints
      } else {
        return a.timeline.estimatedStart.localeCompare(b.timeline.estimatedStart)
      }
    })

  const visibleEpics = showAllEpics ? filteredAndSortedEpics : filteredAndSortedEpics.slice(0, 6)

  // Validate epic form
  const validateForm = (): boolean => {
    const errors: Partial<EpicFormData> = {}
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    }
    
    if (!formData.storyPoints || isNaN(Number(formData.storyPoints)) || Number(formData.storyPoints) <= 0) {
      errors.storyPoints = 'Valid story points required (positive number)'
    }
    
    if (!formData.timelineStart.trim()) {
      errors.timelineStart = 'Start timeline is required (e.g., "Sprint 1")'
    }
    
    if (!formData.timelineEnd.trim()) {
      errors.timelineEnd = 'End timeline is required (e.g., "Sprint 3")'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Reset epic form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      storyPoints: '',
      priority: 'medium',
      timelineStart: '',
      timelineEnd: '',
      requiredRoles: '',
      assumptions: '',
      dependencies: ''
    })
    setFormErrors({})
    setShowAdvanced(false)
    setEditingEpic(null)
  }

  // Handle add/edit epic
  const handleSaveEpic = () => {
    if (!validateForm()) {
      return
    }

    // Parse text fields into arrays
    const parseTextToArray = (text: string): string[] => {
      return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[•\-\*]\s*/, '')) // Remove bullet points if present
    }

    const parseRoles = (text: string): string[] => {
      return text
        .split(',')
        .map(role => role.trim())
        .filter(role => role.length > 0)
    }

    if (editingEpic) {
      // Update existing epic
      const updatedEpic: Epic = {
        ...editingEpic,
        title: formData.title.trim(),
        description: formData.description.trim(),
        storyPoints: Number(formData.storyPoints),
        priority: formData.priority,
        requiredRoles: formData.requiredRoles ? parseRoles(formData.requiredRoles) : [],
        assumptions: formData.assumptions ? parseTextToArray(formData.assumptions) : [],
        dependencies: formData.dependencies ? parseTextToArray(formData.dependencies) : [],
        timeline: {
          ...editingEpic.timeline,
          estimatedStart: formData.timelineStart.trim(),
          estimatedEnd: formData.timelineEnd.trim(),
        }
      }

      setEpics(epics.map(epic => epic.id === editingEpic.id ? updatedEpic : epic))
      
      // Update selectedEpic if it's the one being edited
      if (selectedEpic?.id === editingEpic.id) {
        setSelectedEpic(updatedEpic)
      }
    } else {
      // Create new epic
      const newEpic: Epic = {
        id: Date.now().toString(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        storyPoints: Number(formData.storyPoints),
        priority: formData.priority,
        requiredRoles: formData.requiredRoles ? parseRoles(formData.requiredRoles) : [],
        assumptions: formData.assumptions ? parseTextToArray(formData.assumptions) : [],
        dependencies: formData.dependencies ? parseTextToArray(formData.dependencies) : [],
        timeline: {
          estimatedStart: formData.timelineStart.trim(),
          estimatedEnd: formData.timelineEnd.trim(),
          milestones: []
        },
        acceptanceCriteria: [],
        successMetrics: [],
        technicalDetails: {
          stack: [],
          constraints: [],
          integrations: [],
          compliance: []
        },
        testingStrategy: [],
        documentationNeeds: [],
        dataRequirements: [],
        openQuestions: []
      }

      setEpics([...epics, newEpic])
    }

    setIsAddDialogOpen(false)
    resetForm()
  }

  // Open edit dialog with pre-filled form
  const openEditDialog = (epic: Epic) => {
    setEditingEpic(epic)
    setFormData({
      title: epic.title,
      description: epic.description,
      storyPoints: epic.storyPoints.toString(),
      priority: epic.priority,
      timelineStart: epic.timeline.estimatedStart,
      timelineEnd: epic.timeline.estimatedEnd,
      requiredRoles: epic.requiredRoles.join(', '),
      assumptions: epic.assumptions.join('\n'),
      dependencies: epic.dependencies.join('\n')
    })
    // Show advanced if there's data in those fields
    if (epic.requiredRoles.length > 0 || epic.assumptions.length > 0 || epic.dependencies.length > 0) {
      setShowAdvanced(true)
    }
    setIsAddDialogOpen(true)
  }

  const handleDeleteEpic = (id: string) => {
    setEpics(epics.filter(epic => epic.id !== id))
    if (selectedEpic?.id === id) {
      setSelectedEpic(null)
    }
  }

  // ========== RISK MANAGEMENT FUNCTIONS ==========

  // Get risk score (probability × impact)
  const getRiskScore = (probability: number, impact: number) => probability * impact

  // Get risk color based on score
  const getRiskColor = (score: number) => {
    if (score >= 9) return 'bg-red-100 text-red-800 border-red-300'
    if (score >= 6) return 'bg-orange-100 text-orange-800 border-orange-300'
    if (score >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  // Get probability label
  const getProbabilityLabel = (prob: number) => {
    if (prob === 3) return 'High'
    if (prob === 2) return 'Medium'
    return 'Low'
  }

  // Get impact label
  const getImpactLabel = (impact: number) => {
    if (impact === 3) return 'High'
    if (impact === 2) return 'Medium'
    return 'Low'
  }

  // Group risks by matrix cell
  const matrixRisks = risks.reduce((matrix: { [key: string]: Risk[] }, risk) => {
    const key = `${risk.probability}-${risk.impact}`
    if (!matrix[key]) matrix[key] = []
    matrix[key].push(risk)
    return matrix
  }, {})

  // Validate risk form
  const validateRiskForm = (): boolean => {
    const errors: Partial<RiskFormData> = {}
    
    if (!riskFormData.title.trim()) {
      errors.title = 'Title is required'
    }
    
    if (!riskFormData.description.trim()) {
      errors.description = 'Description is required'
    }
    
    if (!riskFormData.mitigation.trim()) {
      errors.mitigation = 'Mitigation strategy is required'
    }
    
    setRiskFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Reset risk form
  const resetRiskForm = () => {
    setRiskFormData({
      title: '',
      description: '',
      probability: 2,
      impact: 2,
      category: 'technical',
      mitigation: '',
      owner: '',
      relatedEpics: ''
    })
    setRiskFormErrors({})
    setEditingRisk(null)
  }

  // Handle save risk (add or edit)
  const handleSaveRisk = () => {
    if (!validateRiskForm()) {
      return
    }

    // Parse related epics
    const parseRelatedEpics = (text: string): string[] => {
      return text
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0)
    }

    if (editingRisk) {
      // Update existing risk
      const updatedRisk: Risk = {
        ...editingRisk,
        title: riskFormData.title.trim(),
        description: riskFormData.description.trim(),
        probability: riskFormData.probability,
        impact: riskFormData.impact,
        category: riskFormData.category,
        mitigation: riskFormData.mitigation.trim(),
        owner: riskFormData.owner.trim(),
        relatedEpics: riskFormData.relatedEpics ? parseRelatedEpics(riskFormData.relatedEpics) : []
      }

      setRisks(risks.map(risk => risk.id === editingRisk.id ? updatedRisk : risk))
      
      if (selectedRisk?.id === editingRisk.id) {
        setSelectedRisk(updatedRisk)
      }
    } else {
      // Create new risk
      const newRisk: Risk = {
        id: 'r' + Date.now().toString(),
        title: riskFormData.title.trim(),
        description: riskFormData.description.trim(),
        probability: riskFormData.probability,
        impact: riskFormData.impact,
        category: riskFormData.category,
        mitigation: riskFormData.mitigation.trim(),
        owner: riskFormData.owner.trim(),
        relatedEpics: riskFormData.relatedEpics ? parseRelatedEpics(riskFormData.relatedEpics) : []
      }

      setRisks([...risks, newRisk])
    }

    setIsRiskDialogOpen(false)
    resetRiskForm()
  }

  // Open edit dialog for risk
  const openEditRiskDialog = (risk: Risk) => {
    setEditingRisk(risk)
    setRiskFormData({
      title: risk.title,
      description: risk.description,
      probability: risk.probability,
      impact: risk.impact,
      category: risk.category,
      mitigation: risk.mitigation,
      owner: risk.owner,
      relatedEpics: risk.relatedEpics.join(', ')
    })
    setIsRiskDialogOpen(true)
  }

  // Delete risk
  const handleDeleteRisk = (id: string) => {
    setRisks(risks.filter(risk => risk.id !== id))
    if (selectedRisk?.id === id) {
      setSelectedRisk(null)
    }
  }

  const openDetailsPanel = (risk: Risk) => {
    setDetailsRisk(risk)
    setIsDetailsPanelOpen(true)
  }

  // Filter and sort risks
  const filteredRisks = risks
    .filter(risk => {
      const matchesSearch = risk.title.toLowerCase().includes(riskSearchQuery.toLowerCase()) ||
                           risk.description.toLowerCase().includes(riskSearchQuery.toLowerCase())
      return matchesSearch
    })
    .sort((a, b) => getRiskScore(b.probability, b.impact) - getRiskScore(a.probability, a.impact))

  const visibleRisks = showAllRisks ? filteredRisks : filteredRisks.slice(0, 6)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const sidebarItems = [
    {
      id: 'epics' as SectionType,
      label: 'Epic Breakdown',
      icon: Target,
      count: epics.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'risks' as SectionType,
      label: 'Risk Assessment',
      icon: AlertTriangle,
      count: risks.length,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      id: 'technical' as SectionType,
      label: 'Technical Assessment',
      icon: Wrench,
      count: 0,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'assumptions' as SectionType,
      label: 'BD Assumptions',
      icon: FileText,
      count: 0,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ]

  return (
    <TooltipProvider>
      <div className="flex gap-6 min-h-screen">
        {/* Left Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="sticky top-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Scoping</h2>
              <p className="text-xs text-gray-600">
                Intelligence Layer
              </p>
            </div>

            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isActive ? item.color : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.count > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                        {item.count}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* EPIC BREAKDOWN SECTION */}
          {activeSection === 'epics' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-gray-900">Epic Breakdown</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="text-sm">
                          <strong>Story points</strong> measure relative complexity, not hours. They help compare effort across epics.
                          AI analyzes the RFP to suggest points, which you can adjust based on your team's experience.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-gray-600">
                    {filteredAndSortedEpics.length} epics • {totalStoryPoints} story points total
                  </p>
                </div>
                <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Epic
                </Button>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search epics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                </div>

                <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Sort by Priority</SelectItem>
                    <SelectItem value="story-points">Sort by Story Points</SelectItem>
                    <SelectItem value="timeline">Sort by Timeline</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-1 border border-gray-200 rounded-md p-0.5">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-2 h-8"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="px-2 h-8"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Epic Cards */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {visibleEpics.map((epic) => (
                    <div
                      key={epic.id}
                      className="group border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all cursor-pointer bg-white"
                      onClick={() => setSelectedEpic(epic)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-gray-900 mb-1.5 leading-tight line-clamp-2">{epic.title}</h3>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Badge variant="outline" className={`${getPriorityColor(epic.priority)} text-[10px] px-1.5 py-0 h-5`}>
                              {epic.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditDialog(epic)
                            }}
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteEpic(epic.id)
                            }}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-2 leading-snug mb-3">
                        {epic.description}
                      </p>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Story Points:</span>
                          <span className="font-semibold text-gray-900">{epic.storyPoints} SP</span>
                        </div>

                        <div className="flex items-center justify-between text-gray-500">
                          <span>Timeline:</span>
                          <span className="text-gray-900 text-[11px]">{epic.timeline.estimatedStart} - {epic.timeline.estimatedEnd}</span>
                        </div>

                        {epic.requiredRoles.length > 0 && (
                          <div className="pt-1 border-t border-gray-100">
                            <div className="flex flex-wrap gap-1 mt-1">
                              {epic.requiredRoles.slice(0, 2).map((role, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-gray-100">
                                  {role}
                                </Badge>
                              ))}
                              {epic.requiredRoles.length > 2 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-gray-100">
                                  +{epic.requiredRoles.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleEpics.map((epic) => (
                    <div
                      key={epic.id}
                      className="group border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all cursor-pointer bg-white"
                      onClick={() => setSelectedEpic(epic)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Badge variant="outline" className={`${getPriorityColor(epic.priority)} text-[10px] px-1.5 py-0 h-5 flex-shrink-0`}>
                            {epic.priority}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 truncate">{epic.title}</h4>
                            <p className="text-xs text-gray-600 truncate">{epic.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600 flex-shrink-0">
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{epic.storyPoints} SP</div>
                          </div>
                          <div className="text-right min-w-[100px]">
                            <div className="text-[11px]">{epic.timeline.estimatedStart} - {epic.timeline.estimatedEnd}</div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditDialog(epic)
                              }}
                              className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteEpic(epic.id)
                              }}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredAndSortedEpics.length > 6 && (
                <div className="text-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowAllEpics(!showAllEpics)}
                    className="text-gray-600 hover:text-gray-900 h-8 text-xs"
                  >
                    {showAllEpics ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5 mr-1.5" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5 mr-1.5" />
                        View all {filteredAndSortedEpics.length} epics
                      </>
                    )}
                  </Button>
                </div>
              )}

              {filteredAndSortedEpics.length === 0 && (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No epics match your filters</p>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setSearchQuery('')
                      setFilterPriority('all')
                    }}
                    className="mt-2 h-8 text-xs"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* RISK ASSESSMENT SECTION */}
          {activeSection === 'risks' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Risk Matrix</h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Identify and assess risks that could impact bid success
                  </p>
                </div>
                <Button
                  onClick={() => {
                    resetRiskForm()
                    setIsRiskDialogOpen(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Risk
                </Button>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search risks..."
                    value={riskSearchQuery}
                    onChange={(e) => setRiskSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* View Mode Toggles */}
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setRiskViewMode('matrix')}
                    className={`p-2 rounded transition-colors ${
                      riskViewMode === 'matrix'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Matrix View"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRiskViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      riskViewMode === 'grid'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRiskViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      riskViewMode === 'list'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Matrix View */}
              {riskViewMode === 'matrix' && (
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="grid grid-cols-4 gap-0">
                    {/* Top-left corner label */}
                    <div className="border-b border-r border-gray-200 p-3 bg-gray-50">
                      <div className="text-xs font-medium text-gray-600">Probability →</div>
                      <div className="text-xs font-medium text-gray-600 mt-1">Impact ↓</div>
                    </div>

                    {/* Column headers */}
                    <div className="border-b border-r border-gray-200 p-3 bg-gray-50 text-center">
                      <div className="text-xs font-medium text-gray-900">Low</div>
                      <div className="text-xs text-gray-600">(1)</div>
                    </div>
                    <div className="border-b border-r border-gray-200 p-3 bg-gray-50 text-center">
                      <div className="text-xs font-medium text-gray-900">Medium</div>
                      <div className="text-xs text-gray-600">(2)</div>
                    </div>
                    <div className="border-b border-gray-200 p-3 bg-gray-50 text-center">
                      <div className="text-xs font-medium text-gray-900">High</div>
                      <div className="text-xs text-gray-600">(3)</div>
                    </div>

                    {/* High Impact Row */}
                    <div className="border-b border-r border-gray-200 p-3 bg-gray-50">
                      <div className="text-xs font-medium text-gray-900">High</div>
                      <div className="text-xs text-gray-600">(3)</div>
                    </div>
                    {[1, 2, 3].map((prob) => {
                      const cellRisks = matrixRisks[`${prob}-3`] || []
                      const score = prob * 3
                      return (
                        <div
                          key={`${prob}-3`}
                          className={`border-b ${prob < 3 ? 'border-r' : ''} border-gray-200 p-3 min-h-[120px] ${
                            score >= 9 ? 'bg-red-50' : score >= 6 ? 'bg-orange-50' : 'bg-yellow-50'
                          }`}
                        >
                          {cellRisks.map((risk) => (
                            <button
                              key={risk.id}
                              onClick={() => openDetailsPanel(risk)}
                              className="w-full mb-2 last:mb-0"
                            >
                              <div className={`p-2 rounded border text-left hover:shadow-sm transition-shadow ${getRiskColor(score)}`}>
                                <div className="text-xs font-medium line-clamp-2">{risk.title}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs px-1.5 py-0.5 bg-white/50 rounded">
                                    P:{prob}
                                  </span>
                                  <span className="text-xs px-1.5 py-0.5 bg-white/50 rounded">
                                    I:3
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )
                    })}

                    {/* Medium Impact Row */}
                    <div className="border-b border-r border-gray-200 p-3 bg-gray-50">
                      <div className="text-xs font-medium text-gray-900">Medium</div>
                      <div className="text-xs text-gray-600">(2)</div>
                    </div>
                    {[1, 2, 3].map((prob) => {
                      const cellRisks = matrixRisks[`${prob}-2`] || []
                      const score = prob * 2
                      return (
                        <div
                          key={`${prob}-2`}
                          className={`border-b ${prob < 3 ? 'border-r' : ''} border-gray-200 p-3 min-h-[120px] ${
                            score >= 6 ? 'bg-orange-50' : score >= 4 ? 'bg-yellow-50' : 'bg-green-50'
                          }`}
                        >
                          {cellRisks.map((risk) => (
                            <button
                              key={risk.id}
                              onClick={() => openDetailsPanel(risk)}
                              className="w-full mb-2 last:mb-0"
                            >
                              <div className={`p-2 rounded border text-left hover:shadow-sm transition-shadow ${getRiskColor(score)}`}>
                                <div className="text-xs font-medium line-clamp-2">{risk.title}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs px-1.5 py-0.5 bg-white/50 rounded">
                                    P:{prob}
                                  </span>
                                  <span className="text-xs px-1.5 py-0.5 bg-white/50 rounded">
                                    I:2
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )
                    })}

                    {/* Low Impact Row */}
                    <div className="border-r border-gray-200 p-3 bg-gray-50">
                      <div className="text-xs font-medium text-gray-900">Low</div>
                      <div className="text-xs text-gray-600">(1)</div>
                    </div>
                    {[1, 2, 3].map((prob) => {
                      const cellRisks = matrixRisks[`${prob}-1`] || []
                      const score = prob * 1
                      return (
                        <div
                          key={`${prob}-1`}
                          className={`${prob < 3 ? 'border-r' : ''} border-gray-200 p-3 min-h-[120px] ${
                            score >= 4 ? 'bg-yellow-50' : 'bg-green-50'
                          }`}
                        >
                          {cellRisks.map((risk) => (
                            <button
                              key={risk.id}
                              onClick={() => openDetailsPanel(risk)}
                              className="w-full mb-2 last:mb-0"
                            >
                              <div className={`p-2 rounded border text-left hover:shadow-sm transition-shadow ${getRiskColor(score)}`}>
                                <div className="text-xs font-medium line-clamp-2">{risk.title}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs px-1.5 py-0.5 bg-white/50 rounded">
                                    P:{prob}
                                  </span>
                                  <span className="text-xs px-1.5 py-0.5 bg-white/50 rounded">
                                    I:1
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Grid View */}
              {riskViewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRisks.map((risk) => {
                    const score = getRiskScore(risk.probability, risk.impact)
                    return (
                      <div
                        key={risk.id}
                        className={`border rounded-lg p-4 ${getRiskColor(score)} hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-sm font-semibold flex-1">{risk.title}</h3>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => openEditRiskDialog(risk)}
                              className="p-1 hover:bg-white/50 rounded transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRisk(risk.id)}
                              className="p-1 hover:bg-white/50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs mb-3 line-clamp-2">{risk.description}</p>

                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs px-2 py-1 bg-white/50 rounded font-medium">
                            P: {getProbabilityLabel(risk.probability)}
                          </span>
                          <span className="text-xs px-2 py-1 bg-white/50 rounded font-medium">
                            I: {getImpactLabel(risk.impact)}
                          </span>
                          <span className="text-xs px-2 py-1 bg-white/50 rounded font-medium">
                            Score: {score}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 capitalize">{risk.category}</span>
                          <button
                            onClick={() => openDetailsPanel(risk)}
                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            View Details
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* List View */}
              {riskViewMode === 'list' && (
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Risk</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Probability</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Impact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Score</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Owner</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredRisks.map((risk) => {
                        const score = getRiskScore(risk.probability, risk.impact)
                        return (
                          <tr key={risk.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <button
                                onClick={() => openDetailsPanel(risk)}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left"
                              >
                                {risk.title}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
                                {risk.category}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium text-gray-900">
                                {getProbabilityLabel(risk.probability)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium text-gray-900">
                                {getImpactLabel(risk.impact)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded font-medium ${getRiskColor(score)}`}>
                                {score}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-700">{risk.owner}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditRiskDialog(risk)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRisk(risk.id)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-gray-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Empty State */}
              {filteredRisks.length === 0 && (
                <div className="border border-gray-200 rounded-lg p-12 text-center bg-white">
                  <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    {riskSearchQuery ? 'No risks match your search' : 'No risks identified yet'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeSection === 'technical' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Technical Assessment</h3>
              <div className="border border-gray-200 rounded-lg p-12 text-center bg-white">
                <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  Coming soon: Technology stack, architecture decisions, and compliance requirements.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'assumptions' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">BD Assumptions & Delivery Handoff</h3>
              <div className="border border-gray-200 rounded-lg p-12 text-center bg-white">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  Coming soon: Capture BD assumptions, constraints, and key decisions for delivery validation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Epic Dialog - KEEPING YOUR EXISTING CODE */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEpic ? 'Edit Epic' : 'Add New Epic'}</DialogTitle>
            <DialogDescription>
              {editingEpic 
                ? 'Update the epic details. Required fields are marked with *.'
                : 'Create a new epic to break down project work. Required fields are marked with *.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., User Authentication System"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={formErrors.title ? 'border-red-500' : ''}
                />
                {formErrors.title && (
                  <p className="text-xs text-red-500">{formErrors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this epic accomplishes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={formErrors.description ? 'border-red-500' : ''}
                  rows={3}
                />
                {formErrors.description && (
                  <p className="text-xs text-red-500">{formErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storyPoints">
                    Story Points <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="storyPoints"
                    type="number"
                    placeholder="e.g., 35"
                    min="1"
                    value={formData.storyPoints}
                    onChange={(e) => setFormData({ ...formData, storyPoints: e.target.value })}
                    className={formErrors.storyPoints ? 'border-red-500' : ''}
                  />
                  {formErrors.storyPoints && (
                    <p className="text-xs text-red-500">{formErrors.storyPoints}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Relative complexity estimate (1-100+)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: 'high' | 'medium' | 'low') => 
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timelineStart">
                    Timeline Start <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="timelineStart"
                    placeholder="e.g., Sprint 1"
                    value={formData.timelineStart}
                    onChange={(e) => setFormData({ ...formData, timelineStart: e.target.value })}
                    className={formErrors.timelineStart ? 'border-red-500' : ''}
                  />
                  {formErrors.timelineStart && (
                    <p className="text-xs text-red-500">{formErrors.timelineStart}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timelineEnd">
                    Timeline End <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="timelineEnd"
                    placeholder="e.g., Sprint 3"
                    value={formData.timelineEnd}
                    onChange={(e) => setFormData({ ...formData, timelineEnd: e.target.value })}
                    className={formErrors.timelineEnd ? 'border-red-500' : ''}
                  />
                  {formErrors.timelineEnd && (
                    <p className="text-xs text-red-500">{formErrors.timelineEnd}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Section Toggle */}
            <div className="pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full justify-between"
              >
                <span className="text-sm font-medium">Advanced Fields (Optional)</span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Advanced Fields */}
            {showAdvanced && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="requiredRoles">Required Roles</Label>
                  <Input
                    id="requiredRoles"
                    placeholder="e.g., Technical Lead, Senior Engineer"
                    value={formData.requiredRoles}
                    onChange={(e) => setFormData({ ...formData, requiredRoles: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    Comma-separated list of roles needed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assumptions">Assumptions</Label>
                  <Textarea
                    id="assumptions"
                    placeholder="One assumption per line:&#10;• Government provides API access&#10;• Data migration window is 2 weeks&#10;• Team has cloud infrastructure experience"
                    value={formData.assumptions}
                    onChange={(e) => setFormData({ ...formData, assumptions: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">
                    One assumption per line (bullet points optional)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dependencies">Dependencies</Label>
                  <Textarea
                    id="dependencies"
                    placeholder="One dependency per line:&#10;• Database schema approved&#10;• Authentication system complete&#10;• API access granted"
                    value={formData.dependencies}
                    onChange={(e) => setFormData({ ...formData, dependencies: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">
                    One dependency per line (bullet points optional)
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEpic}>
              {editingEpic ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Epic
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Risk Dialog */}
      <Dialog open={isRiskDialogOpen} onOpenChange={setIsRiskDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRisk ? 'Edit Risk' : 'Add New Risk'}</DialogTitle>
            <DialogDescription>
              Identify a potential risk that could impact bid success
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="risk-title">Risk Title *</Label>
              <Input
                id="risk-title"
                placeholder="e.g., Technical Stack Mismatch"
                value={riskFormData.title}
                onChange={(e) => setRiskFormData({ ...riskFormData, title: e.target.value })}
                className={riskFormErrors.title ? 'border-red-500' : ''}
              />
              {riskFormErrors.title && (
                <p className="text-xs text-red-500">{riskFormErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk-description">Description *</Label>
              <Textarea
                id="risk-description"
                placeholder="Describe the risk in detail..."
                value={riskFormData.description}
                onChange={(e) => setRiskFormData({ ...riskFormData, description: e.target.value })}
                className={riskFormErrors.description ? 'border-red-500' : ''}
                rows={3}
              />
              {riskFormErrors.description && (
                <p className="text-xs text-red-500">{riskFormErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="risk-probability">Probability *</Label>
                <Select
                  value={riskFormData.probability.toString()}
                  onValueChange={(value) => setRiskFormData({ ...riskFormData, probability: parseInt(value) })}
                >
                  <SelectTrigger id="risk-probability">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low (1)</SelectItem>
                    <SelectItem value="2">Medium (2)</SelectItem>
                    <SelectItem value="3">High (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk-impact">Impact *</Label>
                <Select
                  value={riskFormData.impact.toString()}
                  onValueChange={(value) => setRiskFormData({ ...riskFormData, impact: parseInt(value) })}
                >
                  <SelectTrigger id="risk-impact">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low (1)</SelectItem>
                    <SelectItem value="2">Medium (2)</SelectItem>
                    <SelectItem value="3">High (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk-category">Category *</Label>
              <Select
                value={riskFormData.category}
                onValueChange={(value) => setRiskFormData({ ...riskFormData, category: value })}
              >
                <SelectTrigger id="risk-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                  <SelectItem value="requirements">Requirements</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk-mitigation">Mitigation Strategy *</Label>
              <Textarea
                id="risk-mitigation"
                placeholder="Describe how you plan to address this risk..."
                value={riskFormData.mitigation}
                onChange={(e) => setRiskFormData({ ...riskFormData, mitigation: e.target.value })}
                className={riskFormErrors.mitigation ? 'border-red-500' : ''}
                rows={3}
              />
              {riskFormErrors.mitigation && (
                <p className="text-xs text-red-500">{riskFormErrors.mitigation}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk-owner">Risk Owner</Label>
              <Input
                id="risk-owner"
                placeholder="e.g., Technical Lead"
                value={riskFormData.owner}
                onChange={(e) => setRiskFormData({ ...riskFormData, owner: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk-epics">Related Epics (Optional)</Label>
              <Input
                id="risk-epics"
                placeholder="e.g., 1, 2, 3"
                value={riskFormData.relatedEpics}
                onChange={(e) => setRiskFormData({ ...riskFormData, relatedEpics: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Comma-separated epic IDs this risk relates to
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRiskDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveRisk}
              disabled={!riskFormData.title || !riskFormData.description}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingRisk ? 'Save Changes' : 'Add Risk'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Risk Details Slideout */}
      {isDetailsPanelOpen && detailsRisk && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setIsDetailsPanelOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    getRiskColor(getRiskScore(detailsRisk.probability, detailsRisk.impact))
                  }`}>
                    Score: {getRiskScore(detailsRisk.probability, detailsRisk.impact)}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
                    {detailsRisk.category}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{detailsRisk.title}</h2>
              </div>
              <button
                onClick={() => setIsDetailsPanelOpen(false)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-700">{detailsRisk.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Probability</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{detailsRisk.probability}</span>
                    <span className="text-sm text-gray-600">
                      {getProbabilityLabel(detailsRisk.probability)}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Impact</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{detailsRisk.impact}</span>
                    <span className="text-sm text-gray-600">
                      {getImpactLabel(detailsRisk.impact)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Mitigation Strategy</h3>
                <p className="text-sm text-gray-700">{detailsRisk.mitigation}</p>
              </div>

              {detailsRisk.owner && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Risk Owner</h3>
                  <p className="text-sm text-gray-700">{detailsRisk.owner}</p>
                </div>
              )}

              {detailsRisk.relatedEpics && detailsRisk.relatedEpics.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Related Epics</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailsRisk.relatedEpics.map((epicId) => {
                      const epic = epics.find(e => e.id === epicId)
                      return (
                        <span key={epicId} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {epic ? epic.title : `Epic ${epicId}`}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
              <Button
                onClick={() => {
                  setIsDetailsPanelOpen(false)
                  openEditRiskDialog(detailsRisk)
                }}
                variant="outline"
                className="flex-1"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Risk
              </Button>
              <Button
                onClick={() => {
                  handleDeleteRisk(detailsRisk.id)
                  setIsDetailsPanelOpen(false)
                }}
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Risk
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Epic Slide-out Panel - KEEPING YOUR EXISTING CODE */}
      {selectedEpic && (
        <>
          <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-50 animate-in slide-in-from-right">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedEpic.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-600">{selectedEpic.storyPoints} story points</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-xs">
                        AI-generated estimate based on RFP requirements. Adjust based on your team's velocity and technical complexity.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openEditDialog(selectedEpic)}
                  className="h-8"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedEpic(null)}
                  className="text-2xl leading-none h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="p-6">
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="technical" className="text-xs">Technical</TabsTrigger>
                  <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
                  <TabsTrigger value="questions" className="text-xs">Questions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Story Points Explanation */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">About Story Points</h4>
                        <p className="text-xs text-blue-800 mb-2">
                          Story points measure <strong>relative complexity</strong>, not hours. Think of them as a way to compare effort between epics.
                        </p>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• <strong>1-2 SP:</strong> Simple task (few hours)</li>
                          <li>• <strong>3-5 SP:</strong> Moderate feature (1-2 days)</li>
                          <li>• <strong>8-13 SP:</strong> Complex feature (3-5 days)</li>
                          <li>• <strong>20+ SP:</strong> Large epic (1-2 weeks, consider splitting)</li>
                        </ul>
                        <p className="text-xs text-blue-700 mt-2 italic">
                          These estimates come from AI analysis but should be validated by your technical team.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-700">{selectedEpic.description}</p>
                  </div>

                  {selectedEpic.acceptanceCriteria.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Acceptance Criteria
                      </h4>
                      <ul className="space-y-2">
                        {selectedEpic.acceptanceCriteria.map((criteria, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{criteria}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedEpic.successMetrics.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Success Metrics</h4>
                      <ul className="space-y-2">
                        {selectedEpic.successMetrics.map((metric, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-green-600 mt-1">📊</span>
                            <span>{metric}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedEpic.assumptions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Assumptions</h4>
                      <ul className="space-y-2">
                        {selectedEpic.assumptions.map((assumption, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-yellow-600 mt-1">⚠️</span>
                            <span>{assumption}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="technical" className="space-y-6">
                  {selectedEpic.technicalDetails.stack.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Technology Stack
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEpic.technicalDetails.stack.map((tech, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{tech}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEpic.technicalDetails.compliance.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Compliance Requirements
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEpic.technicalDetails.compliance.map((comp, idx) => (
                          <Badge key={idx} variant="outline" className="border-red-200 text-red-700 text-xs">{comp}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEpic.technicalDetails.integrations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Network className="w-4 h-4" />
                        Integration Points
                      </h4>
                      <ul className="space-y-2">
                        {selectedEpic.technicalDetails.integrations.map((integration, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-purple-600 mt-1">🔌</span>
                            <span>{integration}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedEpic.technicalDetails.constraints.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Technical Constraints</h4>
                      <ul className="space-y-2">
                        {selectedEpic.technicalDetails.constraints.map((constraint, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-orange-600 mt-1">⚡</span>
                            <span>{constraint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedEpic.testingStrategy.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Testing Strategy</h4>
                      <ul className="space-y-2">
                        {selectedEpic.testingStrategy.map((test, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-blue-600 mt-1">✓</span>
                            <span>{test}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedEpic.dataRequirements.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Data Requirements
                      </h4>
                      <ul className="space-y-2">
                        {selectedEpic.dataRequirements.map((req, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-indigo-600 mt-1">💾</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="timeline" className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Estimated Timeline
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Start:</span>
                        <span className="font-medium">{selectedEpic.timeline.estimatedStart}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">End:</span>
                        <span className="font-medium">{selectedEpic.timeline.estimatedEnd}</span>
                      </div>
                    </div>
                  </div>

                  {selectedEpic.timeline.milestones.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Milestones</h4>
                      <ul className="space-y-3">
                        {selectedEpic.timeline.milestones.map((milestone, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                              {idx + 1}
                            </div>
                            <span className="text-sm text-gray-700 pt-0.5">{milestone}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedEpic.dependencies.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <GitBranch className="w-4 h-4" />
                        Dependencies
                      </h4>
                      <ul className="space-y-2">
                        {selectedEpic.dependencies.map((dep, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-orange-600 mt-1">→</span>
                            <span>{dep}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedEpic.documentationNeeds.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Documentation Needs</h4>
                      <ul className="space-y-2">
                        {selectedEpic.documentationNeeds.map((doc, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-gray-600 mt-1">📄</span>
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="questions" className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <FileQuestion className="w-4 h-4" />
                      Open Questions
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      These questions need to be answered before delivery can commit to this epic.
                    </p>
                    {selectedEpic.openQuestions.length > 0 ? (
                      <ul className="space-y-3">
                        {selectedEpic.openQuestions.map((question, idx) => (
                          <li key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <span className="text-yellow-600 font-semibold text-sm">Q{idx + 1}</span>
                              <span className="text-sm text-gray-900">{question}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No open questions yet.</p>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button className="w-full" variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Overlay when epic slide-out is open */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedEpic(null)}
          />
        </>
      )}
    </TooltipProvider>
  )
}