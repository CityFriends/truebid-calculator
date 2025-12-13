'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAppContext } from '@/contexts/app-context'
import { 
  generateExport, 
  downloadBlob, 
  uploadToGoogleDrive,
  type ExportData,
  type ExportOptions,
  type WBSElement
} from '@/lib/export-utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Calculator,
  Users,
  Shield,
  ArrowRight,
  CloudUpload,
  ExternalLink,
  FileType,
  ListTree,
  HelpCircle
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface ExportConfig {
  solicitation: string
  client: string
  proposalTitle: string
  preparedBy: string
  preparedDate: string
  
  includeRateCard: boolean
  includeBOE: boolean
  includeLCATs: boolean
  includeAuditPackage: boolean
  
  includeEscalation: boolean
  
  format: 'xlsx' | 'pdf' | 'docx'
  saveDestination: 'local' | 'gdrive'
  gdriveFolderId?: string
}

type ExportStatus = 'idle' | 'generating' | 'uploading' | 'success' | 'error'

interface GoogleAuthState {
  isAuthenticated: boolean
  accessToken: string | null
  error: string | null
}

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ============================================================================
// MOCK WBS DATA
// ============================================================================

const MOCK_WBS_ELEMENTS: WBSElement[] = [
  {
    id: 'wbs-1',
    wbsNumber: '1.0',
    title: 'Program Management',
    description: 'Overall program management including sprint ceremonies, stakeholder coordination, and status reporting.',
    hours: 1920,
    laborBreakdown: [
      { roleId: 'dm', roleName: 'Delivery Manager', hours: 1200, rationale: 'Full-time PM across base + options' },
      { roleId: 'pm', roleName: 'Product Manager', hours: 720, rationale: 'Part-time coordination' }
    ],
    estimateMethod: 'historical',
    confidenceLevel: 'high',
    assumptions: ['26 two-week sprints per year', 'Weekly stakeholder meetings'],
    sooReference: 'Section 2.1'
  },
  {
    id: 'wbs-2',
    wbsNumber: '2.0',
    title: 'User Research & Design',
    description: 'User research, UX design, and accessibility compliance.',
    hours: 3840,
    laborBreakdown: [
      { roleId: 'dl', roleName: 'Design Lead', hours: 1920, rationale: 'Full-time design leadership' },
      { roleId: 'uxr', roleName: 'UX Researcher', hours: 1200, rationale: 'Usability testing' },
      { roleId: 'pd', roleName: 'Product Designer', hours: 720, rationale: 'Design support' }
    ],
    estimateMethod: 'expert',
    confidenceLevel: 'high',
    assumptions: ['Section 508 compliance required'],
    sooReference: 'Section 1.1'
  },
  {
    id: 'wbs-3',
    wbsNumber: '3.0',
    title: 'Development',
    description: 'Frontend and backend development.',
    hours: 7680,
    laborBreakdown: [
      { roleId: 'fe', roleName: 'Frontend Engineer', hours: 3840, rationale: 'UI development' },
      { roleId: 'be', roleName: 'Backend Engineer', hours: 3840, rationale: 'API development' }
    ],
    estimateMethod: 'engineering',
    confidenceLevel: 'medium',
    assumptions: ['React with TypeScript', 'Cloud-native architecture'],
    sooReference: 'Section 1.2'
  }
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ExportTab() {
  const {
    companyProfile,
    indirectRates,
    profitTargets,
    escalationRates,
    companyPolicy,
    selectedRoles,
    calculateFullyBurdenedRate,
    calculateEscalatedRate,
    companyRoles,
    solicitation,
    setActiveTab,
    wbsElements: contextWbsElements,
  } = useAppContext()

  const wbsElements = contextWbsElements?.length > 0 ? contextWbsElements : MOCK_WBS_ELEMENTS

  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')
  const [exportResult, setExportResult] = useState<{ url?: string; fileName?: string } | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>('rateCard')
  const [previewMode, setPreviewMode] = useState<'rates' | 'wbs'>('rates')
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthState>({
    isAuthenticated: false,
    accessToken: null,
    error: null
  })
  
  const [config, setConfig] = useState<ExportConfig>({
    solicitation: '',
    client: '',
    proposalTitle: '',
    preparedBy: companyProfile.name,
    preparedDate: new Date().toISOString().split('T')[0],
    
    includeRateCard: true,
    includeBOE: true,
    includeLCATs: false,
    includeAuditPackage: false,
    
    includeEscalation: true,
    
    format: 'docx',
    saveDestination: 'local'
  })

  // Auto-populate from solicitation
  useEffect(() => {
    if (solicitation) {
      setConfig(prev => ({
        ...prev,
        solicitation: solicitation.solicitationNumber || prev.solicitation,
        client: solicitation.agency || prev.client,
        proposalTitle: solicitation.title || prev.proposalTitle,
      }))
    }
  }, [solicitation?.solicitationNumber, solicitation?.agency, solicitation?.title])

  const updateConfig = (updates: Partial<ExportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const contractType = solicitation?.contractType || 'tm'
  const contractYears = solicitation?.contractYears || 1

  // WBS Summary
  const wbsSummary = useMemo(() => {
    const totalHours = wbsElements.reduce((sum, el) => sum + el.hours, 0)
    const confidenceCounts = wbsElements.reduce((acc, el) => {
      acc[el.confidenceLevel] = (acc[el.confidenceLevel] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalElements: wbsElements.length,
      totalHours,
      highConfidencePercent: ((confidenceCounts.high || 0) / wbsElements.length) * 100
    }
  }, [wbsElements])

  // Readiness checks
  const checks = useMemo(() => {
    const hasRoles = selectedRoles.length > 0
    const hasRates = indirectRates.fringe > 0
    const hasCompany = !!companyProfile.name
    const hasSolicitation = !!config.solicitation
    const hasWBS = wbsElements.length > 0
    
    return {
      hasRoles,
      hasRates,
      hasCompany,
      hasSolicitation,
      hasWBS,
      passCount: [hasRoles, hasRates, hasCompany, hasSolicitation].filter(Boolean).length,
    }
  }, [selectedRoles.length, indirectRates.fringe, companyProfile.name, config.solicitation, wbsElements.length])

  const isReady = checks.passCount >= 2

  const handleGoogleAuth = useCallback(async () => {
    setGoogleAuth({
      isAuthenticated: false,
      accessToken: null,
      error: 'Google Drive requires OAuth setup. Download locally for now.'
    })
  }, [])

  // Handle export
  const handleExport = async () => {
    setExportStatus('generating')
    setExportResult(null)

    try {
      const exportData: ExportData = {
        solicitation: config.solicitation,
        client: config.client,
        proposalTitle: config.proposalTitle,
        preparedBy: config.preparedBy,
        preparedDate: config.preparedDate,
        companyName: companyProfile.name,
        samUei: companyProfile.samUei,
        gsaContract: companyProfile.gsaContractNumber,
        indirectRates: {
          fringe: indirectRates.fringe,
          overhead: indirectRates.overhead,
          ga: indirectRates.ga,
          source: indirectRates.source,
          fiscalYear: indirectRates.fiscalYear
        },
        profitMargin: profitTargets.tmDefault,
        escalationRate: escalationRates.laborDefault,
        productiveHours: companyPolicy.standardHours,
        roles: selectedRoles.map(role => {
          const companyRole = companyRoles.find(cr => 
            cr.title.toLowerCase().includes(role.name.toLowerCase()) ||
            role.name.toLowerCase().includes(cr.title.toLowerCase())
          )
          const levelInfo = companyRole?.levels.find(l => l.level === role.icLevel)
          
          return {
            id: role.id,
            title: role.title || role.name,
            icLevel: role.icLevel,
            baseSalary: role.baseSalary,
            quantity: role.quantity,
            description: role.description,
            blsCode: companyRole?.blsOccCode,
            yearsExperience: levelInfo?.yearsExperience
          }
        }),
        wbsElements: config.includeBOE ? wbsElements : undefined,
        calculateRate: (salary: number, includeProfit: boolean) => 
          calculateFullyBurdenedRate(salary, includeProfit),
        calculateEscalatedRate: (rate: number, year: number) => 
          calculateEscalatedRate(rate, year),
        rateCardType: contractType,
        yearsToInclude: contractYears,
        includeEscalation: config.includeEscalation
      }

      const options: ExportOptions = {
        includeRateCard: config.includeRateCard,
        includeBOE: config.includeBOE,
        includeLCATs: config.includeLCATs,
        includeAuditPackage: config.includeAuditPackage
      }

      const blob = await generateExport(exportData, options, config.format)
      const extension = config.format === 'xlsx' ? 'csv' : config.format
      const filename = `TrueBid_${config.solicitation || 'Export'}_${new Date().toISOString().split('T')[0]}.${extension}`
      
      if (config.saveDestination === 'gdrive' && googleAuth.isAuthenticated && googleAuth.accessToken) {
        setExportStatus('uploading')
        const result = await uploadToGoogleDrive(blob, filename, googleAuth.accessToken, config.gdriveFolderId)
        setExportResult({ url: result.webViewLink, fileName: result.fileName })
        setExportStatus('success')
      } else {
        downloadBlob(blob, filename)
        setExportResult({ fileName: filename })
        setExportStatus('success')
      }
    } catch (error) {
      console.error('Export failed:', error)
      setExportStatus('error')
    }
  }

  const selectedCount = [config.includeRateCard, config.includeBOE, config.includeLCATs, config.includeAuditPackage].filter(Boolean).length

  return (
    <div className="flex gap-6 h-full">
      {/* LEFT SIDEBAR */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Export</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">Generate cost proposal documents</p>
          </div>

          {/* Document Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Document Info</h3>
              {solicitation?.solicitationNumber && <Badge variant="secondary" className="text-[10px]">Auto-filled</Badge>}
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Solicitation #</Label>
                <Input
                  placeholder="e.g., 47QTCA24R0001"
                  value={config.solicitation}
                  onChange={(e) => updateConfig({ solicitation: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Client / Agency</Label>
                <Input
                  placeholder="e.g., Department of Commerce"
                  value={config.client}
                  onChange={(e) => updateConfig({ client: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Proposal Title</Label>
                <Input
                  placeholder="e.g., IT Modernization Support"
                  value={config.proposalTitle}
                  onChange={(e) => updateConfig({ proposalTitle: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Output</h3>
              <div className="group relative">
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <p className="mb-1"><strong>Word</strong> — Editable format</p>
                  <p className="mb-1"><strong>PDF</strong> — Fixed format for submission</p>
                  <p><strong>CSV</strong> — Raw data for Excel</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <button
                  onClick={() => updateConfig({ format: 'docx' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                    config.format === 'docx' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Word
                </button>
                <button
                  onClick={() => updateConfig({ format: 'pdf' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                    config.format === 'pdf' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <FileType className="w-3.5 h-3.5" />
                  PDF
                </button>
                <button
                  onClick={() => updateConfig({ format: 'xlsx' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                    config.format === 'xlsx' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>

              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <button
                  onClick={() => updateConfig({ saveDestination: 'local' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                    config.saveDestination === 'local' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  onClick={() => { updateConfig({ saveDestination: 'gdrive' }); if (!googleAuth.isAuthenticated) handleGoogleAuth() }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                    config.saveDestination === 'gdrive' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  Drive
                </button>
              </div>
              {config.saveDestination === 'gdrive' && googleAuth.error && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400">{googleAuth.error}</p>
              )}
            </div>
          </div>

          {/* Readiness */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Readiness</h3>
            <div className="space-y-2">
              <ReadinessCheck 
                label="Roles selected" 
                passed={checks.hasRoles} 
                detail={checks.hasRoles ? `${selectedRoles.length} roles` : '0 roles'}
                actionLabel={!checks.hasRoles ? 'Add' : undefined}
                onAction={!checks.hasRoles ? () => setActiveTab('roles-pricing') : undefined}
              />
              <ReadinessCheck label="Indirect rates" passed={checks.hasRates} detail={checks.hasRates ? `FY${indirectRates.fiscalYear}` : 'Not set'} />
              <ReadinessCheck 
                label="WBS elements" 
                passed={checks.hasWBS} 
                detail={checks.hasWBS ? `${wbsElements.length} elements` : 'None'}
                actionLabel={!checks.hasWBS ? 'Add' : undefined}
                onAction={!checks.hasWBS ? () => setActiveTab('estimate') : undefined}
              />
              <ReadinessCheck label="Solicitation #" passed={checks.hasSolicitation} detail={config.solicitation || 'Not set'} />
            </div>
          </div>

          {/* Export Button - Changed to singular "Export Document" */}
          <Button 
            className="w-full h-11"
            disabled={!isReady || exportStatus === 'generating' || exportStatus === 'uploading' || selectedCount === 0}
            onClick={handleExport}
          >
            {exportStatus === 'generating' ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
            ) : exportStatus === 'uploading' ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" />Export Document</>
            )}
          </Button>

          {/* Export Result */}
          {exportStatus === 'success' && exportResult && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-green-900 dark:text-green-100">Export successful!</p>
                  <p className="text-xs text-green-700 dark:text-green-300 truncate">{exportResult.fileName}</p>
                  {exportResult.url && (
                    <a href={exportResult.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 mt-1">
                      Open in Drive <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {exportStatus === 'error' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-red-900 dark:text-red-100">Export failed</p>
                  <p className="text-xs text-red-700 dark:text-red-300">Please try again.</p>
                </div>
              </div>
            </div>
          )}

          {!isReady && <p className="text-xs text-amber-600 dark:text-amber-400 text-center">Complete at least 2 checks to export</p>}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Sections</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Select sections to include in your document</p>
          </div>
          <Badge variant="outline" className="text-sm">{selectedCount} selected</Badge>
        </div>

        {/* Document Cards */}
        <div className="space-y-3">
          <DocumentCard
            icon={Calculator}
            title="Rate Card"
            description={`${contractType.toUpperCase()} rates for ${contractYears} year${contractYears !== 1 ? 's' : ''}`}
            checked={config.includeRateCard}
            onCheckedChange={(checked) => updateConfig({ includeRateCard: checked })}
            expanded={expandedSection === 'rateCard'}
            onToggleExpand={() => setExpandedSection(expandedSection === 'rateCard' ? null : 'rateCard')}
            hasOptions
          >
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Checkbox id="escalation" checked={config.includeEscalation} onCheckedChange={(checked) => updateConfig({ includeEscalation: checked as boolean })} />
                <Label htmlFor="escalation" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Apply {(escalationRates.laborDefault * 100).toFixed(1)}% annual escalation
                </Label>
              </div>
            </div>
          </DocumentCard>

          <DocumentCard
            icon={ListTree}
            title="Basis of Estimate (BOE)"
            description={`${wbsElements.length} WBS elements, ${wbsSummary.totalHours.toLocaleString()} hours`}
            checked={config.includeBOE}
            onCheckedChange={(checked) => updateConfig({ includeBOE: checked })}
            expanded={expandedSection === 'boe'}
            onToggleExpand={() => setExpandedSection(expandedSection === 'boe' ? null : 'boe')}
            badge={wbsSummary.highConfidencePercent >= 70 ? 'Strong' : 'Review'}
            badgeVariant={wbsSummary.highConfidencePercent >= 70 ? 'default' : 'secondary'}
          >
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{wbsElements.length}</p>
                  <p className="text-[10px] text-gray-500">Elements</p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{wbsSummary.totalHours.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">Hours</p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{Math.round(wbsSummary.highConfidencePercent)}%</p>
                  <p className="text-[10px] text-gray-500">High Conf.</p>
                </div>
              </div>
            </div>
          </DocumentCard>

          <DocumentCard
            icon={Users}
            title="Labor Category Descriptions"
            description="Role definitions and experience requirements"
            checked={config.includeLCATs}
            onCheckedChange={(checked) => updateConfig({ includeLCATs: checked })}
            expanded={expandedSection === 'lcats'}
            onToggleExpand={() => setExpandedSection(expandedSection === 'lcats' ? null : 'lcats')}
          >
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedRoles.length} labor categories with qualifications and BLS codes.
              </p>
            </div>
          </DocumentCard>

          <DocumentCard
            icon={Shield}
            title="Audit Defense Package"
            description="Rate calculations and compliance documentation"
            checked={config.includeAuditPackage}
            onCheckedChange={(checked) => updateConfig({ includeAuditPackage: checked })}
            badge="Advanced"
            expanded={expandedSection === 'audit'}
            onToggleExpand={() => setExpandedSection(expandedSection === 'audit' ? null : 'audit')}
          >
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
              {['Step-by-step rate calculation', `FY${indirectRates.fiscalYear} indirect rates`, 'FAR 31.2 compliance'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {item}
                </div>
              ))}
            </div>
          </DocumentCard>
        </div>

        {/* UNIFIED PREVIEW SECTION */}
        {selectedRoles.length > 0 ? (
          <div className="mt-6">
            {/* Preview Toggle */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Preview</h4>
              <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                <button
                  onClick={() => setPreviewMode('rates')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                    previewMode === 'rates' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Rate Card
                </button>
                <button
                  onClick={() => setPreviewMode('wbs')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                    previewMode === 'wbs' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  WBS Elements
                </button>
              </div>
            </div>

            {/* Rate Card Preview */}
            {previewMode === 'rates' && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <th className="text-left p-3 text-xs font-medium text-gray-500">Labor Category</th>
                      <th className="text-center p-3 text-xs font-medium text-gray-500">Level</th>
                      <th className="text-right p-3 text-xs font-medium text-gray-500">Base Year</th>
                      {contractYears >= 2 && <th className="text-right p-3 text-xs font-medium text-gray-500">Opt 1</th>}
                      {contractYears >= 3 && <th className="text-right p-3 text-xs font-medium text-gray-500">Opt 2</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRoles.slice(0, 6).map((role, idx) => {
                      const baseRate = calculateFullyBurdenedRate(role.baseSalary, contractType !== 'ffp')
                      return (
                        <tr key={role.id} className={idx % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
                          <td className="p-3 text-gray-900 dark:text-white">{role.title || role.name}</td>
                          <td className="p-3 text-center"><Badge variant="outline" className="text-xs">{role.icLevel}</Badge></td>
                          <td className="p-3 text-right font-mono text-gray-900 dark:text-white">{formatCurrency(baseRate)}</td>
                          {contractYears >= 2 && <td className="p-3 text-right font-mono text-gray-900 dark:text-white">{formatCurrency(config.includeEscalation ? calculateEscalatedRate(baseRate, 2) : baseRate)}</td>}
                          {contractYears >= 3 && <td className="p-3 text-right font-mono text-gray-900 dark:text-white">{formatCurrency(config.includeEscalation ? calculateEscalatedRate(baseRate, 3) : baseRate)}</td>}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {selectedRoles.length > 6 && (
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 text-center">
                    + {selectedRoles.length - 6} more roles
                  </div>
                )}
              </div>
            )}

            {/* WBS Preview - with hours by period */}
            {previewMode === 'wbs' && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                  {wbsElements.map((element) => (
                    <div key={element.id} className="p-4 bg-white dark:bg-gray-900">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{element.wbsNumber}</span>
                            <h5 className="font-medium text-gray-900 dark:text-white">{element.title}</h5>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{element.estimateMethod}</Badge>
                            <Badge variant={element.confidenceLevel === 'high' ? 'default' : element.confidenceLevel === 'medium' ? 'secondary' : 'outline'} className="text-[10px]">
                              {element.confidenceLevel}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{element.description}</p>
                        
                        {/* Total Hours - inline */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm">
                            <strong className="text-gray-900 dark:text-white">{element.hours.toLocaleString()}</strong>
                            <span className="text-gray-500 ml-1">total hours</span>
                          </span>
                          {element.sooReference && (
                            <span className="text-xs text-gray-500 border-l border-gray-300 pl-3">
                              SOO: {element.sooReference}
                            </span>
                          )}
                        </div>

                        {/* Labor Breakdown with hours by period */}
                        {element.laborBreakdown && element.laborBreakdown.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Labor Allocation</p>
                            
                            {/* Table header */}
                            <div className="grid grid-cols-12 gap-2 text-[10px] font-medium text-gray-500 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">
                              <div className="col-span-4">Role</div>
                              <div className="col-span-2 text-right">Total</div>
                              <div className="col-span-1 text-right">Base</div>
                              {contractYears >= 2 && <div className="col-span-1 text-right">OY1</div>}
                              {contractYears >= 3 && <div className="col-span-1 text-right">OY2</div>}
                              <div className={`${contractYears === 1 ? 'col-span-5' : contractYears === 2 ? 'col-span-4' : 'col-span-3'} text-left pl-2`}>Rationale</div>
                            </div>
                            
                            {/* Labor rows */}
                            <div className="space-y-2">
                              {element.laborBreakdown.map((labor, idx) => {
                                const hoursPerYear = Math.round(labor.hours / contractYears)
                                return (
                                  <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                                    <div className="col-span-4">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">{labor.roleName}</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{labor.hours.toLocaleString()}</span>
                                    </div>
                                    <div className="col-span-1 text-right">
                                      <span className="text-xs text-gray-600 dark:text-gray-300">{hoursPerYear.toLocaleString()}</span>
                                    </div>
                                    {contractYears >= 2 && (
                                      <div className="col-span-1 text-right">
                                        <span className="text-xs text-gray-600 dark:text-gray-300">{hoursPerYear.toLocaleString()}</span>
                                      </div>
                                    )}
                                    {contractYears >= 3 && (
                                      <div className="col-span-1 text-right">
                                        <span className="text-xs text-gray-600 dark:text-gray-300">{hoursPerYear.toLocaleString()}</span>
                                      </div>
                                    )}
                                    <div className={`${contractYears === 1 ? 'col-span-5' : contractYears === 2 ? 'col-span-4' : 'col-span-3'} pl-2`}>
                                      {labor.rationale && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">{labor.rationale}</p>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Assumptions */}
                        {element.assumptions && element.assumptions.length > 0 && (
                          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Assumptions</p>
                            <div className="flex flex-wrap gap-1">
                              {element.assumptions.map((assumption, idx) => (
                                <span key={idx} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                  {assumption}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Fringe {(indirectRates.fringe * 100).toFixed(1)}% · OH {(indirectRates.overhead * 100).toFixed(1)}% · G&A {(indirectRates.ga * 100).toFixed(1)}%
              {contractType !== 'ffp' && ` · Profit ${(profitTargets.tmDefault * 100).toFixed(1)}%`}
            </p>
          </div>
        ) : (
          /* No Roles Warning */
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">No roles selected</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                  Add roles in Roles & Pricing to generate rate cards and cost estimates.
                </p>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('roles-pricing')} className="text-amber-700 border-amber-300 hover:bg-amber-100">
                  Go to Roles & Pricing <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ReadinessCheckProps {
  label: string
  passed: boolean
  detail: string
  actionLabel?: string
  onAction?: () => void
}

function ReadinessCheck({ label, passed, detail, actionLabel, onAction }: ReadinessCheckProps) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
      {passed ? <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" /> : <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-medium ${passed ? 'text-green-900 dark:text-green-100' : 'text-amber-900 dark:text-amber-100'}`}>{label}</p>
        <p className={`text-xs truncate ${passed ? 'text-green-600 dark:text-green-300' : 'text-amber-600 dark:text-amber-300'}`}>{detail}</p>
      </div>
      {actionLabel && onAction && (
        <button onClick={onAction} className="text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 flex items-center gap-1">
          {actionLabel} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

interface DocumentCardProps {
  icon: React.ElementType
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'outline'
  hasOptions?: boolean
  expanded?: boolean
  onToggleExpand?: () => void
  children?: React.ReactNode
}

function DocumentCard({ icon: Icon, title, description, checked, onCheckedChange, badge, badgeVariant = 'secondary', hasOptions, expanded, onToggleExpand, children }: DocumentCardProps) {
  return (
    <div className={`border rounded-lg transition-all ${checked ? 'border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox checked={checked} onCheckedChange={onCheckedChange} className="mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${checked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
              <h4 className="font-medium text-sm text-gray-900 dark:text-white">{title}</h4>
              {badge && <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0">{badge}</Badge>}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
          </div>
          {(hasOptions || children) && (
            <button onClick={onToggleExpand} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>
          )}
        </div>
        {expanded && children && <div className="mt-3 ml-7">{children}</div>}
      </div>
    </div>
  )
}