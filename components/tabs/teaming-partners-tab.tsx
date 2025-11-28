'use client'

import { useState } from 'react'
import { useAppContext, TeamingPartner, TeamingPartnerCertifications } from '@/contexts/app-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Plus, 
  Trash2, 
  Building2, 
  Search,
  Pencil,
  X,
  CheckCircle2,
  HelpCircle,
  FileText,
  AlertTriangle,
  ExternalLink,
  Upload,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  Shield,
  Handshake,
  Clock,
  AlertCircle,
} from 'lucide-react'

// ==================== TYPES ====================

interface TeamingPartnersTabProps {
  onContinue?: () => void
}

type FilterType = 'all' | 'active' | 'expiring' | 'needs-attention'

// ==================== CAPABILITY OPTIONS (NAICS 541511/541512/541519) ====================

const capabilityOptions = [
  { id: 'ux-ui', label: 'UX/UI Design', category: 'Design' },
  { id: 'user-research', label: 'User Research', category: 'Design' },
  { id: 'product-management', label: 'Product Management', category: 'Management' },
  { id: 'accessibility', label: 'Accessibility (Section 508)', category: 'Compliance' },
  { id: 'software-dev', label: 'Software Development', category: 'Engineering' },
  { id: 'cloud-architecture', label: 'Cloud Architecture', category: 'Engineering' },
  { id: 'devsecops', label: 'DevSecOps', category: 'Engineering' },
  { id: 'data-analytics', label: 'Data Analytics', category: 'Data' },
  { id: 'ai-ml', label: 'AI/Machine Learning', category: 'Data' },
  { id: 'cybersecurity', label: 'Cybersecurity', category: 'Security' },
  { id: 'system-integration', label: 'System Integration', category: 'Engineering' },
  { id: 'agile-coaching', label: 'Agile Coaching', category: 'Management' },
  { id: 'change-management', label: 'Change Management', category: 'Management' },
  { id: 'technical-writing', label: 'Technical Writing', category: 'Support' },
  { id: 'training', label: 'Training & Enablement', category: 'Support' },
]

// ==================== HELPERS ====================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getDaysUntilExpiration = (dateString: string): number => {
  if (!dateString) return Infinity
  const expirationDate = new Date(dateString)
  const today = new Date()
  const diffTime = expirationDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const getExpirationStatus = (dateString: string): 'expired' | 'warning' | 'ok' => {
  const days = getDaysUntilExpiration(dateString)
  if (days < 0) return 'expired'
  if (days <= 60) return 'warning'
  return 'ok'
}

// Plain language agreement status labels
const agreementStatusLabels: Record<string, string> = {
  'none': 'No Agreement',
  'draft': 'Draft in Progress',
  'under-review': 'Under Review',
  'signed': 'Signed',
  'executed': 'Fully Executed',
}

const agreementStatusColors: Record<string, string> = {
  'none': 'bg-gray-100 text-gray-600 border-gray-200',
  'draft': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'under-review': 'bg-blue-50 text-blue-700 border-blue-200',
  'signed': 'bg-green-50 text-green-700 border-green-200',
  'executed': 'bg-green-50 text-green-700 border-green-200',
}

// Business size colors
const businessSizeColors: Record<string, string> = {
  'small': 'bg-purple-50 text-purple-700 border-purple-200',
  'other-than-small': 'bg-gray-100 text-gray-600 border-gray-200',
  '': 'bg-gray-50 text-gray-500 border-gray-200',
}

// Filter definitions with icons and colors (using orange to match subcontractors)
const filterOptions: { id: FilterType; label: string; icon: typeof Building2; color: string }[] = [
  { id: 'all', label: 'All Partners', icon: Building2, color: 'text-gray-600' },
  { id: 'active', label: 'Active Agreements', icon: CheckCircle2, color: 'text-green-600' },
  { id: 'expiring', label: 'Expiring Soon', icon: Clock, color: 'text-orange-600' },
  { id: 'needs-attention', label: 'Needs Attention', icon: AlertCircle, color: 'text-red-600' },
]

// Empty partner template
const emptyPartner: Omit<TeamingPartner, 'id' | 'createdAt' | 'updatedAt'> = {
  companyName: '',
  legalName: '',
  uei: '',
  cageCode: '',
  businessSize: '',
  certifications: {
    sb: false,
    wosb: false,
    sdvosb: false,
    hubzone: false,
    eightA: false,
  },
  teamingAgreementStatus: 'none',
  ndaStatus: 'none',
  rateSource: '',
  capabilities: [],
  pastPerformance: '',
  primaryContact: '',
  contactEmail: '',
  contactPhone: '',
  notes: '',
}

// ==================== FAR TOOLTIPS ====================

const farTooltips = {
  uei: {
    clause: 'FAR 52.204-7',
    title: 'SAM Registration',
    description: 'Contractors must be registered in SAM.gov and have a valid Unique Entity ID (UEI) to receive federal contracts.',
  },
  businessSize: {
    clause: 'FAR 19.704',
    title: 'Subcontracting Plan',
    description: 'Required for contracts over $750K ($1.5M for construction). Must include goals for SB, WOSB, SDVOSB, HUBZone, and 8(a).',
  },
  rateJustification: {
    clause: 'FAR 15.404-3',
    title: 'Subcontract Pricing',
    description: 'The contracting officer may require price analysis for subcontracts. Maintain documentation of rate reasonableness.',
  },
  limitations: {
    clause: 'FAR 52.219-14',
    title: 'Limitations on Subcontracting',
    description: 'Small business set-asides require the prime to perform at least 50% of contract work. Track partner allocations to ensure compliance.',
  },
  jointVenture: {
    clause: 'FAR 19.602-1',
    title: 'Joint Venture Agreements',
    description: 'Joint ventures allow small businesses to team for larger contracts while maintaining small business status under specific conditions.',
  },
}

// ==================== COMPONENT ====================

export function TeamingPartnersTab({ onContinue }: TeamingPartnersTabProps) {
  // Use AppContext for persistent state
  const { 
    teamingPartners: partners,
    addTeamingPartner,
    updateTeamingPartner,
    removeTeamingPartner,
    subcontractors,
  } = useAppContext()

  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  
  // Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyPartner)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // Local JV state (until we update the context type)
  const [formJV, setFormJV] = useState(false)
  
  // Selected capabilities for form
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([])
  
  // Accordion state for form sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    company: true,
    certifications: true,
    capabilities: false,
    agreements: false,
    rates: false,
    contact: false,
  })

  // ==================== CALCULATIONS ====================

  // Enrich partners with role data from subcontractors
  const partnersWithRoles = partners.map(partner => {
    const partnerSubs = subcontractors.filter(s => 
      s.partnerId === partner.id || 
      s.companyName.toLowerCase() === partner.companyName.toLowerCase()
    )
    const totalAnnualCost = partnerSubs.reduce((sum, s) => sum + (s.billedRate * s.fte * 1920), 0)
    
    // Determine if partner needs attention
    const hasNoAgreement = partner.teamingAgreementStatus === 'none'
    const hasExpiredAgreement = partner.teamingAgreementExpiration && getExpirationStatus(partner.teamingAgreementExpiration) === 'expired'
    const needsAttention = hasNoAgreement || hasExpiredAgreement
    
    return {
      ...partner,
      roles: partnerSubs,
      roleCount: partnerSubs.length,
      totalFte: partnerSubs.reduce((sum, s) => sum + s.fte, 0),
      totalAnnualCost,
      needsAttention,
    }
  })

  // Count partners by filter type
  const filterCounts = {
    all: partners.length,
    active: partners.filter(p => p.teamingAgreementStatus === 'signed' || p.teamingAgreementStatus === 'executed').length,
    expiring: partners.filter(p => p.teamingAgreementExpiration && getExpirationStatus(p.teamingAgreementExpiration) === 'warning').length,
    'needs-attention': partnersWithRoles.filter(p => p.needsAttention).length,
  }

  // Certification counts for sidebar
  const certificationCounts = {
    sb: partners.filter(p => p.certifications.sb).length,
    wosb: partners.filter(p => p.certifications.wosb).length,
    sdvosb: partners.filter(p => p.certifications.sdvosb).length,
    hubzone: partners.filter(p => p.certifications.hubzone).length,
    eightA: partners.filter(p => p.certifications.eightA).length,
    jv: 0, // Will track when we add JV to context
  }

  // Total subcontractor FTE and cost
  const totalSubFte = partnersWithRoles.reduce((sum, p) => sum + p.totalFte, 0)
  const totalSubCost = partnersWithRoles.reduce((sum, p) => sum + p.totalAnnualCost, 0)

  // ==================== FILTERING ====================

  const filteredPartners = partnersWithRoles
    .filter(partner => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          partner.companyName.toLowerCase().includes(query) ||
          (partner.legalName && partner.legalName.toLowerCase().includes(query)) ||
          (partner.uei && partner.uei.toLowerCase().includes(query))
        )
      }
      return true
    })
    .filter(partner => {
      switch (activeFilter) {
        case 'active':
          return partner.teamingAgreementStatus === 'signed' || partner.teamingAgreementStatus === 'executed'
        case 'expiring':
          return partner.teamingAgreementExpiration && getExpirationStatus(partner.teamingAgreementExpiration) === 'warning'
        case 'needs-attention':
          return partner.needsAttention
        default:
          return true
      }
    })

  // ==================== HANDLERS ====================

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleCapability = (capId: string) => {
    setSelectedCapabilities(prev => 
      prev.includes(capId) 
        ? prev.filter(c => c !== capId)
        : [...prev, capId]
    )
  }

  const openAddPanel = () => {
    setEditingId(null)
    setFormData(emptyPartner)
    setFormJV(false)
    setSelectedCapabilities([])
    setFormErrors({})
    setExpandedSections({ company: true, certifications: true, capabilities: false, agreements: false, rates: false, contact: false })
    setIsPanelOpen(true)
  }

  const openEditPanel = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId)
    if (!partner) return

    setEditingId(partnerId)
    setFormData({
      companyName: partner.companyName,
      legalName: partner.legalName || '',
      uei: partner.uei || '',
      cageCode: partner.cageCode || '',
      businessSize: partner.businessSize,
      certifications: { ...partner.certifications },
      teamingAgreementStatus: partner.teamingAgreementStatus,
      teamingAgreementExpiration: partner.teamingAgreementExpiration || '',
      ndaStatus: partner.ndaStatus,
      ndaExpiration: partner.ndaExpiration || '',
      defaultRate: partner.defaultRate,
      rateSource: partner.rateSource,
      quoteDate: partner.quoteDate || '',
      quoteReference: partner.quoteReference || '',
      capabilities: partner.capabilities || [],
      pastPerformance: partner.pastPerformance || '',
      primaryContact: partner.primaryContact || '',
      contactEmail: partner.contactEmail || '',
      contactPhone: partner.contactPhone || '',
      notes: partner.notes || '',
    })
    setSelectedCapabilities(partner.capabilities || [])
    setFormJV(false)
    setFormErrors({})
    setIsPanelOpen(true)
  }

  const closePanel = () => {
    setIsPanelOpen(false)
    setEditingId(null)
    setFormData(emptyPartner)
    setFormJV(false)
    setSelectedCapabilities([])
    setFormErrors({})
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.companyName.trim()) {
      errors.companyName = 'Company name is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) return

    const now = new Date().toISOString()
    const dataToSave = {
      ...formData,
      capabilities: selectedCapabilities,
    }

    if (editingId) {
      updateTeamingPartner(editingId, dataToSave)
    } else {
      const newPartner: TeamingPartner = {
        id: `partner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...dataToSave,
        createdAt: now,
        updatedAt: now,
      }
      addTeamingPartner(newPartner)
    }

    closePanel()
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this partner? This will also unlink any subcontractor roles.')) {
      removeTeamingPartner(id)
    }
  }

  // ==================== RENDER ====================

  return (
    <TooltipProvider>
      <div className="flex gap-6">
        {/* ==================== LEFT SIDEBAR ==================== */}
        <div className="w-56 flex-shrink-0">
          <div className="sticky top-6">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Teaming Partners</h2>
              <p className="text-xs text-gray-600">
                Manage partner compliance and agreements
              </p>
            </div>

            {/* Quick Filters - Navigation Style */}
            <nav className="space-y-1 mb-6" aria-label="Partner filters">
              {filterOptions.map((filter) => {
                const Icon = filter.icon
                const count = filterCounts[filter.id]
                const isActive = activeFilter === filter.id
                
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg 
                      text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isActive ? filter.color : 'text-gray-400'}`} />
                      <span>{filter.label}</span>
                    </div>
                    {count > 0 && (
                      <Badge 
                        variant="secondary" 
                        className={`text-[10px] px-1.5 py-0 h-5 ${
                          filter.id === 'needs-attention' && count > 0 
                            ? 'bg-red-100 text-red-700' 
                            : ''
                        }`}
                      >
                        {count}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Summary Stats */}
            <div className="space-y-3 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Total Partners</span>
                <span className="text-sm font-semibold text-gray-900">{partners.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Active Roles</span>
                <span className="text-sm font-semibold text-gray-900">{subcontractors.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Total Sub FTE</span>
                <span className="text-sm font-semibold text-gray-900">{totalSubFte.toFixed(2)}</span>
              </div>
              {totalSubCost > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-600">Annual Cost</span>
                  <span className="text-sm font-semibold text-green-700">{formatCurrency(totalSubCost)}</span>
                </div>
              )}
            </div>

            {/* Small Business Certifications */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">SB Certifications</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="Learn about small business certification tracking">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs font-medium mb-1">FAR 19.704 - Subcontracting Plan</p>
                    <p className="text-xs">Track teaming partners' small business certifications to meet subcontracting plan goals.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50">
                  <span className="text-gray-600">Small Business</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                    {certificationCounts.sb}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50">
                  <span className="text-gray-600">WOSB</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                    {certificationCounts.wosb}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50">
                  <span className="text-gray-600">SDVOSB</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                    {certificationCounts.sdvosb}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50">
                  <span className="text-gray-600">HUBZone</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                    {certificationCounts.hubzone}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50">
                  <span className="text-gray-600">8(a)</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                    {certificationCounts.eightA}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50 border-t border-gray-100 mt-1 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Handshake className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-600">Joint Venture</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                    {certificationCounts.jv}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== MAIN CONTENT ==================== */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Header with Actions */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-gray-900">Partner Directory</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="FAR compliance information">
                      <Shield className="w-4 h-4 text-gray-400 hover:text-blue-600 cursor-help" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs font-medium mb-1">{farTooltips.limitations.clause}: {farTooltips.limitations.title}</p>
                    <p className="text-xs">{farTooltips.limitations.description}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-gray-600">
                {filteredPartners.length} partner{filteredPartners.length !== 1 ? 's' : ''}
                {activeFilter !== 'all' && ` · Filtered: ${filterOptions.find(f => f.id === activeFilter)?.label}`}
              </p>
            </div>
            <Button onClick={openAddPanel}>
              <Plus className="w-4 h-4 mr-2" />
              Add Partner
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by company name, UEI, or legal name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  aria-label="Search partners"
                />
              </div>
            </div>
          </div>

          {/* Partner Cards Grid */}
          {filteredPartners.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-lg">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                {searchQuery 
                  ? 'No partners match your search' 
                  : activeFilter !== 'all'
                    ? `No partners in "${filterOptions.find(f => f.id === activeFilter)?.label}" category`
                    : 'No teaming partners added yet'
                }
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Add partner companies to track compliance and agreements'
                }
              </p>
              {!searchQuery && activeFilter === 'all' && (
                <Button variant="outline" size="sm" onClick={openAddPanel}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Partner
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPartners.map(partner => {
                const taExpStatus = partner.teamingAgreementExpiration 
                  ? getExpirationStatus(partner.teamingAgreementExpiration)
                  : null
                const daysUntilExp = partner.teamingAgreementExpiration 
                  ? getDaysUntilExpiration(partner.teamingAgreementExpiration)
                  : null

                // Determine card accent color based on status (using orange to match subcontractors)
                const getCardAccent = () => {
                  if (partner.needsAttention) return 'border-l-red-500'
                  if (taExpStatus === 'warning') return 'border-l-orange-500'
                  if (partner.teamingAgreementStatus === 'executed' || partner.teamingAgreementStatus === 'signed') return 'border-l-green-500'
                  return 'border-l-gray-300'
                }

                return (
                  <div
                    key={partner.id}
                    className={`
                      group border border-gray-200 border-l-4 rounded-lg p-4 
                      hover:border-orange-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] 
                      transition-all cursor-pointer bg-white
                      ${getCardAccent()}
                    `}
                    onClick={() => openEditPanel(partner.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openEditPanel(partner.id)}
                    aria-label={`Edit ${partner.companyName}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h4 className="font-medium text-sm text-gray-900">
                            {partner.companyName}
                          </h4>
                          {/* Business Size Badge */}
                          {partner.businessSize && (
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-1.5 py-0 h-5 ${businessSizeColors[partner.businessSize]}`}
                            >
                              {partner.businessSize === 'small' ? 'SB' : 'Large'}
                            </Badge>
                          )}
                          {/* Needs Attention Indicator */}
                          {partner.needsAttention && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center">
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">This partner needs attention - missing agreement or expired</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        {partner.uei && (
                          <p className="text-xs text-gray-500">UEI: {partner.uei}</p>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-1 ml-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); openEditPanel(partner.id); }}
                              aria-label={`Edit ${partner.companyName}`}
                              className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p className="text-xs">Edit partner details</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleDelete(partner.id); }}
                              aria-label={`Remove ${partner.companyName}`}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p className="text-xs">Remove this partner</p></TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Certifications Row */}
                    {(partner.certifications.sb || partner.certifications.wosb || partner.certifications.sdvosb || 
                      partner.certifications.hubzone || partner.certifications.eightA) && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {partner.certifications.sb && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-purple-50 text-purple-700 border-purple-200">SB</Badge>
                        )}
                        {partner.certifications.wosb && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-purple-50 text-purple-700 border-purple-200">WOSB</Badge>
                        )}
                        {partner.certifications.sdvosb && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-purple-50 text-purple-700 border-purple-200">SDVOSB</Badge>
                        )}
                        {partner.certifications.hubzone && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-purple-50 text-purple-700 border-purple-200">HUBZone</Badge>
                        )}
                        {partner.certifications.eightA && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-purple-50 text-purple-700 border-purple-200">8(a)</Badge>
                        )}
                      </div>
                    )}

                    {/* Capabilities Preview */}
                    {partner.capabilities && partner.capabilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {partner.capabilities.slice(0, 3).map(capId => {
                          const cap = capabilityOptions.find(c => c.id === capId)
                          return cap ? (
                            <Badge key={capId} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-orange-50 text-orange-700 border-0">
                              {cap.label}
                            </Badge>
                          ) : null
                        })}
                        {partner.capabilities.length > 3 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-gray-100 text-gray-600 border-0">
                            +{partner.capabilities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Agreement Status Row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0 h-5 ${agreementStatusColors[partner.teamingAgreementStatus]}`}
                        >
                          {agreementStatusLabels[partner.teamingAgreementStatus]}
                        </Badge>
                      </div>
                      {partner.ndaStatus !== 'none' && (
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0 h-5 ${
                            partner.ndaStatus === 'signed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          NDA {partner.ndaStatus === 'signed' ? 'Signed' : 'Draft'}
                        </Badge>
                      )}
                    </div>

                    {/* Expiration Warning */}
                    {taExpStatus && taExpStatus !== 'ok' && daysUntilExp !== null && (
                      <div className={`flex items-center gap-2 text-xs mb-3 px-2.5 py-2 rounded-md ${
                        taExpStatus === 'expired' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          {taExpStatus === 'expired' 
                            ? 'Teaming agreement has expired' 
                            : `Agreement expires in ${daysUntilExp} days`
                          }
                        </span>
                      </div>
                    )}

                    {/* Current Bid Roles */}
                    <div className="pt-3 border-t border-gray-100">
                      {partner.roles.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No roles assigned on this bid</p>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Current Bid Roles
                          </p>
                          {partner.roles.slice(0, 3).map((role) => (
                            <div key={role.id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-700 truncate flex-1">{role.role}</span>
                              <span className="text-gray-500 ml-2 whitespace-nowrap">
                                {role.fte} FTE · ${role.theirRate.toFixed(0)}/hr
                              </span>
                            </div>
                          ))}
                          {partner.roles.length > 3 && (
                            <p className="text-xs text-gray-400">
                              +{partner.roles.length - 3} more role{partner.roles.length - 3 !== 1 ? 's' : ''}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs pt-2 mt-2 border-t border-gray-100">
                            <span className="font-medium text-gray-600">{partner.totalFte.toFixed(2)} FTE Total</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(partner.totalAnnualCost)}/yr</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ==================== SLIDE-OUT PANEL ==================== */}
        {isPanelOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/20 z-40"
              onClick={closePanel}
              aria-hidden="true"
            />

            {/* Panel */}
            <div 
              className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-50 animate-in slide-in-from-right"
              role="dialog"
              aria-modal="true"
              aria-labelledby="panel-title"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h3 id="panel-title" className="text-lg font-semibold text-gray-900">
                    {editingId ? 'Edit Partner' : 'Add Partner'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {editingId ? 'Update partner information and agreements' : 'Enter partner company details'}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={closePanel}
                  aria-label="Close panel"
                  className="h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-4">
                
                {/* ===== Company Information Section ===== */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('company')}
                    aria-expanded={expandedSections.company}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-sm text-gray-900">Company Information</span>
                    </div>
                    {expandedSections.company ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  
                  {expandedSections.company && (
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">
                          Company Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="companyName"
                          placeholder="e.g., Acme Consulting LLC"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className={formErrors.companyName ? 'border-red-500' : ''}
                        />
                        {formErrors.companyName && (
                          <p className="text-xs text-red-500">{formErrors.companyName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="legalName">Legal Name (if different)</Label>
                        <Input
                          id="legalName"
                          placeholder="Full legal entity name"
                          value={formData.legalName}
                          onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="uei">UEI</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button" aria-label="Learn about UEI requirements">
                                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs font-medium mb-1">{farTooltips.uei.clause}: {farTooltips.uei.title}</p>
                                <p className="text-xs">{farTooltips.uei.description}</p>
                                <a href="https://sam.gov" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                  Verify on SAM.gov <ExternalLink className="w-3 h-3" />
                                </a>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="uei"
                            placeholder="12-character UEI"
                            value={formData.uei}
                            onChange={(e) => setFormData({ ...formData, uei: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cageCode">CAGE Code</Label>
                          <Input
                            id="cageCode"
                            placeholder="5-character code"
                            value={formData.cageCode}
                            onChange={(e) => setFormData({ ...formData, cageCode: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label>Business Size</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" aria-label="Learn about business size standards">
                                <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs font-medium mb-1">{farTooltips.businessSize.clause}: {farTooltips.businessSize.title}</p>
                              <p className="text-xs">{farTooltips.businessSize.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select 
                          value={formData.businessSize} 
                          onValueChange={(v: 'small' | 'other-than-small' | '') => setFormData({ ...formData, businessSize: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select size standard" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small Business</SelectItem>
                            <SelectItem value="other-than-small">Large Business (Other Than Small)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== Certifications Section ===== */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('certifications')}
                    aria-expanded={expandedSections.certifications}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-sm text-gray-900">Small Business Certifications</span>
                    </div>
                    {expandedSections.certifications ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  
                  {expandedSections.certifications && (
                    <div className="p-4 space-y-3">
                      <p className="text-xs text-gray-500 mb-2">
                        Select all certifications this partner holds. These count toward your subcontracting plan goals.
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="cert-sb"
                          checked={formData.certifications.sb}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, certifications: { ...formData.certifications, sb: checked as boolean } })
                          }
                        />
                        <Label htmlFor="cert-sb" className="text-sm font-normal cursor-pointer">
                          Small Business (SB)
                        </Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="cert-wosb"
                          checked={formData.certifications.wosb}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, certifications: { ...formData.certifications, wosb: checked as boolean } })
                          }
                        />
                        <Label htmlFor="cert-wosb" className="text-sm font-normal cursor-pointer">
                          Woman-Owned Small Business (WOSB)
                        </Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="cert-sdvosb"
                          checked={formData.certifications.sdvosb}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, certifications: { ...formData.certifications, sdvosb: checked as boolean } })
                          }
                        />
                        <Label htmlFor="cert-sdvosb" className="text-sm font-normal cursor-pointer">
                          Service-Disabled Veteran-Owned SB (SDVOSB)
                        </Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="cert-hubzone"
                          checked={formData.certifications.hubzone}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, certifications: { ...formData.certifications, hubzone: checked as boolean } })
                          }
                        />
                        <Label htmlFor="cert-hubzone" className="text-sm font-normal cursor-pointer">
                          HUBZone
                        </Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="cert-8a"
                          checked={formData.certifications.eightA}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, certifications: { ...formData.certifications, eightA: checked as boolean } })
                          }
                        />
                        <Label htmlFor="cert-8a" className="text-sm font-normal cursor-pointer">
                          8(a) Business Development Program
                        </Label>
                      </div>

                      {/* Joint Venture Option */}
                      <div className="pt-3 mt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="cert-jv"
                            checked={formJV}
                            onCheckedChange={(checked) => setFormJV(checked as boolean)}
                          />
                          <Label htmlFor="cert-jv" className="text-sm font-normal cursor-pointer flex items-center gap-1.5">
                            <Handshake className="w-3.5 h-3.5 text-gray-500" />
                            Joint Venture (JV) Partner
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" aria-label="Learn about joint ventures">
                                <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs font-medium mb-1">{farTooltips.jointVenture.clause}: {farTooltips.jointVenture.title}</p>
                              <p className="text-xs">{farTooltips.jointVenture.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== Capabilities Section ===== */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('capabilities')}
                    aria-expanded={expandedSections.capabilities}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-sm text-gray-900">Capabilities</span>
                      {selectedCapabilities.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                          {selectedCapabilities.length} selected
                        </Badge>
                      )}
                    </div>
                    {expandedSections.capabilities ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  
                  {expandedSections.capabilities && (
                    <div className="p-4 space-y-4">
                      <p className="text-xs text-gray-500">
                        Select capabilities relevant to NAICS 541511/541512/541519 (Custom Computer Programming & Design Services)
                      </p>
                      
                      {/* Group capabilities by category */}
                      {['Design', 'Engineering', 'Management', 'Data', 'Security', 'Compliance', 'Support'].map(category => {
                        const categoryCapabilities = capabilityOptions.filter(c => c.category === category)
                        if (categoryCapabilities.length === 0) return null
                        
                        return (
                          <div key={category} className="space-y-2">
                            <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">{category}</p>
                            <div className="grid grid-cols-2 gap-2">
                              {categoryCapabilities.map(cap => (
                                <div key={cap.id} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`cap-${cap.id}`}
                                    checked={selectedCapabilities.includes(cap.id)}
                                    onCheckedChange={() => toggleCapability(cap.id)}
                                  />
                                  <Label htmlFor={`cap-${cap.id}`} className="text-sm font-normal cursor-pointer">
                                    {cap.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ===== Agreements Section ===== */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('agreements')}
                    aria-expanded={expandedSections.agreements}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-sm text-gray-900">Agreements</span>
                    </div>
                    {expandedSections.agreements ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  
                  {expandedSections.agreements && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Teaming Agreement Status</Label>
                          <Select 
                            value={formData.teamingAgreementStatus} 
                            onValueChange={(v: TeamingPartner['teamingAgreementStatus']) => setFormData({ ...formData, teamingAgreementStatus: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Agreement</SelectItem>
                              <SelectItem value="draft">Draft in Progress</SelectItem>
                              <SelectItem value="under-review">Under Review</SelectItem>
                              <SelectItem value="signed">Signed</SelectItem>
                              <SelectItem value="executed">Fully Executed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="taExpiration">Agreement Expiration</Label>
                          <Input
                            id="taExpiration"
                            type="date"
                            value={formData.teamingAgreementExpiration || ''}
                            onChange={(e) => setFormData({ ...formData, teamingAgreementExpiration: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>NDA Status</Label>
                          <Select 
                            value={formData.ndaStatus} 
                            onValueChange={(v: TeamingPartner['ndaStatus']) => setFormData({ ...formData, ndaStatus: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No NDA</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="signed">Signed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ndaExpiration">NDA Expiration</Label>
                          <Input
                            id="ndaExpiration"
                            type="date"
                            value={formData.ndaExpiration || ''}
                            onChange={(e) => setFormData({ ...formData, ndaExpiration: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Document Upload Placeholder */}
                      <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Document upload coming soon</p>
                        <p className="text-xs text-gray-500">Upload teaming agreements, NDAs, and rate quotes</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== Rate Information Section ===== */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('rates')}
                    aria-expanded={expandedSections.rates}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-sm text-gray-900">Rate Documentation</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span onClick={(e) => e.stopPropagation()} className="cursor-help">
                            <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs font-medium mb-1">{farTooltips.rateJustification.clause}: {farTooltips.rateJustification.title}</p>
                          <p className="text-xs">{farTooltips.rateJustification.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {expandedSections.rates ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  
                  {expandedSections.rates && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="defaultRate">Default Hourly Rate ($)</Label>
                          <Input
                            id="defaultRate"
                            type="number"
                            placeholder="150.00"
                            value={formData.defaultRate || ''}
                            onChange={(e) => setFormData({ ...formData, defaultRate: parseFloat(e.target.value) || undefined })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rate Source</Label>
                          <Select 
                            value={formData.rateSource} 
                            onValueChange={(v: TeamingPartner['rateSource']) => setFormData({ ...formData, rateSource: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="quote">Direct Quote</SelectItem>
                              <SelectItem value="prior-agreement">Prior Agreement</SelectItem>
                              <SelectItem value="gsa-schedule">GSA Schedule</SelectItem>
                              <SelectItem value="market-research">Market Research</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quoteDate">Quote Date</Label>
                          <Input
                            id="quoteDate"
                            type="date"
                            value={formData.quoteDate || ''}
                            onChange={(e) => setFormData({ ...formData, quoteDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quoteReference">Quote Reference #</Label>
                          <Input
                            id="quoteReference"
                            placeholder="e.g., Q-2024-001"
                            value={formData.quoteReference || ''}
                            onChange={(e) => setFormData({ ...formData, quoteReference: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== Contact Information Section ===== */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('contact')}
                    aria-expanded={expandedSections.contact}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-sm text-gray-900">Contact & Notes</span>
                    </div>
                    {expandedSections.contact ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  
                  {expandedSections.contact && (
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryContact">Primary Contact</Label>
                        <Input
                          id="primaryContact"
                          placeholder="Contact name"
                          value={formData.primaryContact || ''}
                          onChange={(e) => setFormData({ ...formData, primaryContact: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contactEmail">Email</Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            placeholder="email@company.com"
                            value={formData.contactEmail || ''}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactPhone">Phone</Label>
                          <Input
                            id="contactPhone"
                            placeholder="(555) 123-4567"
                            value={formData.contactPhone || ''}
                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pastPerformance">Past Performance Notes</Label>
                        <Textarea
                          id="pastPerformance"
                          placeholder="Describe partner's relevant past performance and contract history..."
                          value={formData.pastPerformance || ''}
                          onChange={(e) => setFormData({ ...formData, pastPerformance: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Internal Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any additional notes about this partner..."
                          value={formData.notes || ''}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
                <Button variant="outline" onClick={closePanel} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  {editingId ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Partner
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

export default TeamingPartnersTab