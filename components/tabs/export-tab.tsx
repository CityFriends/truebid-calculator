'use client'

import { useState, useMemo } from 'react'
import { useAppContext } from '@/contexts/app-context'
import { generateExport, downloadBlob } from '@/lib/export-utils'
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
  Info,
  FileDown,
  Building2,
  Calculator,
  Users,
  Shield,
  Clock
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
  
  rateCardType: 'tm' | 'ffp' | 'gsa'
  includeEscalation: boolean
  yearsToInclude: number
  
  format: 'xlsx' | 'pdf' | 'docx'
}

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

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
    companyRoles
  } = useAppContext()

  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('rateCard')
  
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
    
    rateCardType: 'tm',
    includeEscalation: true,
    yearsToInclude: 3,
    
    format: 'docx'
  })

  const updateConfig = (updates: Partial<ExportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  // Calculate totals
  const totals = useMemo(() => {
    let baseYear = 0
    let option1 = 0
    let option2 = 0

    selectedRoles.forEach(role => {
      const rate = calculateFullyBurdenedRate(role.baseSalary, true)
      const annual = rate * companyPolicy.standardHours * role.quantity
      
      if (role.years.base) baseYear += annual
      if (role.years.option1) option1 += annual * (1 + escalationRates.laborDefault)
      if (role.years.option2) option2 += annual * Math.pow(1 + escalationRates.laborDefault, 2)
    })

    return {
      baseYear,
      option1,
      option2,
      laborTotal: baseYear + option1 + option2,
    }
  }, [selectedRoles, calculateFullyBurdenedRate, companyPolicy.standardHours, escalationRates.laborDefault])

  // Readiness checks
  const checks = useMemo(() => {
    const hasRoles = selectedRoles.length > 0
    const hasRates = indirectRates.fringe > 0
    const hasCompany = !!companyProfile.name
    const hasSolicitation = !!config.solicitation
    
    return {
      hasRoles,
      hasRates,
      hasCompany,
      hasSolicitation,
      passCount: [hasRoles, hasRates, hasCompany, hasSolicitation].filter(Boolean).length,
      totalChecks: 4
    }
  }, [selectedRoles.length, indirectRates.fringe, companyProfile.name, config.solicitation])

  const isReady = checks.passCount >= 2

  // Handle export
  const handleExport = async () => {
    setIsGenerating(true)

    try {
      const exportData = {
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
        calculateRate: (salary: number, includeProfit: boolean) => 
          calculateFullyBurdenedRate(salary, includeProfit),
        calculateEscalatedRate: (rate: number, year: number) => 
          calculateEscalatedRate(rate, year),
        rateCardType: config.rateCardType,
        yearsToInclude: config.yearsToInclude,
        includeEscalation: config.includeEscalation
      }

      const options = {
        includeRateCard: config.includeRateCard,
        includeBOE: config.includeBOE,
        includeLCATs: config.includeLCATs,
        includeAuditPackage: config.includeAuditPackage
      }

      const blob = await generateExport(exportData, options, config.format)
      const filename = `TrueBid_${config.solicitation || 'Export'}_${new Date().toISOString().split('T')[0]}.${config.format === 'xlsx' ? 'csv' : config.format}`
      
      downloadBlob(blob, filename)
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Count selected documents
  const selectedCount = [
    config.includeRateCard,
    config.includeBOE,
    config.includeLCATs,
    config.includeAuditPackage
  ].filter(Boolean).length

  return (
    <div className="flex gap-6 h-full">
      {/* ================================================================== */}
      {/* LEFT SIDEBAR - Configuration */}
      {/* ================================================================== */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Export</h2>
            <p className="text-xs text-gray-600">
              Generate proposal documents
            </p>
          </div>

          {/* Document Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Document Info
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Solicitation #</Label>
                <Input
                  placeholder="e.g., 47QTCA24R0001"
                  value={config.solicitation}
                  onChange={(e) => updateConfig({ solicitation: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Client / Agency</Label>
                <Input
                  placeholder="e.g., Department of Commerce"
                  value={config.client}
                  onChange={(e) => updateConfig({ client: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Proposal Title</Label>
                <Input
                  placeholder="e.g., IT Modernization Support"
                  value={config.proposalTitle}
                  onChange={(e) => updateConfig({ proposalTitle: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Format
            </h3>
            
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => updateConfig({ format: 'docx' })}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  config.format === 'docx'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Word
              </button>
              <button
                onClick={() => updateConfig({ format: 'xlsx' })}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  config.format === 'xlsx'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          {/* Readiness */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Readiness
            </h3>
            
            <div className="space-y-2">
              <ReadinessCheck 
                label="Roles selected" 
                passed={checks.hasRoles} 
                detail={`${selectedRoles.length} roles`}
              />
              <ReadinessCheck 
                label="Indirect rates" 
                passed={checks.hasRates} 
                detail={`FY${indirectRates.fiscalYear}`}
              />
              <ReadinessCheck 
                label="Company profile" 
                passed={checks.hasCompany} 
                detail={companyProfile.name || 'Not set'}
              />
              <ReadinessCheck 
                label="Solicitation #" 
                passed={checks.hasSolicitation} 
                detail={config.solicitation || 'Not set'}
              />
            </div>
          </div>

          {/* Export Button */}
          <Button 
            className="w-full h-11"
            disabled={!isReady || isGenerating || selectedCount === 0}
            onClick={handleExport}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {selectedCount} Document{selectedCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>

          {!isReady && (
            <p className="text-xs text-amber-600 text-center">
              Complete at least 2 readiness checks to export
            </p>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* MAIN CONTENT - Document Selection & Preview */}
      {/* ================================================================== */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Documents Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Documents</h3>
            <p className="text-sm text-gray-600">Select documents to include in export</p>
          </div>
          <Badge variant="outline" className="text-sm">
            {selectedCount} selected
          </Badge>
        </div>

        {/* Document Cards */}
        <div className="space-y-3">
          {/* Rate Card */}
          <DocumentCard
            icon={Calculator}
            title="Rate Card"
            description="Fully burdened rates by labor category with BLS mapping"
            checked={config.includeRateCard}
            onCheckedChange={(checked) => updateConfig({ includeRateCard: checked })}
            expanded={expandedSection === 'rateCard'}
            onToggleExpand={() => setExpandedSection(expandedSection === 'rateCard' ? null : 'rateCard')}
            hasOptions
          >
            <div className="space-y-4 pt-3 border-t border-gray-100">
              {/* Rate Type */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Rate Type</Label>
                <div className="flex gap-1 p-1 bg-gray-50 rounded-lg">
                  {[
                    { value: 'tm', label: 'T&M' },
                    { value: 'ffp', label: 'FFP' },
                    { value: 'gsa', label: 'GSA' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateConfig({ rateCardType: opt.value as any })}
                      className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-all ${
                        config.rateCardType === opt.value
                          ? 'bg-white shadow-sm text-gray-900'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Years */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Contract Years</Label>
                <div className="flex gap-1 p-1 bg-gray-50 rounded-lg">
                  {[1, 2, 3, 4, 5].map(y => (
                    <button
                      key={y}
                      onClick={() => updateConfig({ yearsToInclude: y })}
                      className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all ${
                        config.yearsToInclude === y
                          ? 'bg-white shadow-sm text-gray-900'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              {/* Escalation */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="escalation"
                  checked={config.includeEscalation}
                  onCheckedChange={(checked) => updateConfig({ includeEscalation: checked as boolean })}
                />
                <Label htmlFor="escalation" className="text-sm text-gray-700 cursor-pointer">
                  Apply {(escalationRates.laborDefault * 100).toFixed(1)}% annual escalation
                </Label>
              </div>
            </div>
          </DocumentCard>

          {/* BOE */}
          <DocumentCard
            icon={FileDown}
            title="Basis of Estimate"
            description="Cost summary and detail by CLIN with hours breakdown"
            checked={config.includeBOE}
            onCheckedChange={(checked) => updateConfig({ includeBOE: checked })}
            expanded={expandedSection === 'boe'}
            onToggleExpand={() => setExpandedSection(expandedSection === 'boe' ? null : 'boe')}
          >
            <div className="pt-3 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(totals.baseYear)}</p>
                  <p className="text-xs text-gray-500">Base Year</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(totals.option1)}</p>
                  <p className="text-xs text-gray-500">Option 1</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(totals.option2)}</p>
                  <p className="text-xs text-gray-500">Option 2</p>
                </div>
              </div>
            </div>
          </DocumentCard>

          {/* LCATs */}
          <DocumentCard
            icon={Users}
            title="Labor Category Descriptions"
            description="Role definitions, education requirements, and experience levels"
            checked={config.includeLCATs}
            onCheckedChange={(checked) => updateConfig({ includeLCATs: checked })}
            expanded={expandedSection === 'lcats'}
            onToggleExpand={() => setExpandedSection(expandedSection === 'lcats' ? null : 'lcats')}
          >
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                {selectedRoles.length} labor categories will be documented with qualifications, 
                education requirements, and BLS occupation codes.
              </p>
            </div>
          </DocumentCard>

          {/* Audit Package */}
          <DocumentCard
            icon={Shield}
            title="Audit Defense Package"
            description="Rate breakdown calculations, BLS comparisons, source documentation"
            checked={config.includeAuditPackage}
            onCheckedChange={(checked) => updateConfig({ includeAuditPackage: checked })}
            badge="Advanced"
            expanded={expandedSection === 'audit'}
            onToggleExpand={() => setExpandedSection(expandedSection === 'audit' ? null : 'audit')}
          >
            <div className="pt-3 border-t border-gray-100 space-y-2">
              {[
                'Step-by-step rate calculation worksheet',
                `Indirect rates from ${indirectRates.source} FY${indirectRates.fiscalYear}`,
                'BLS salary comparison by occupation code',
                `${(escalationRates.laborDefault * 100).toFixed(1)}% escalation justification`,
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </DocumentCard>
        </div>

        {/* Preview Section */}
        {config.includeRateCard && selectedRoles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Rate Card Preview</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Labor Category</th>
                    <th className="text-center p-3 text-xs font-medium text-gray-500">Level</th>
                    <th className="text-right p-3 text-xs font-medium text-gray-500">Base Year</th>
                    {config.yearsToInclude >= 2 && (
                      <th className="text-right p-3 text-xs font-medium text-gray-500">Opt 1</th>
                    )}
                    {config.yearsToInclude >= 3 && (
                      <th className="text-right p-3 text-xs font-medium text-gray-500">Opt 2</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {selectedRoles.slice(0, 5).map((role, idx) => {
                    const baseRate = calculateFullyBurdenedRate(
                      role.baseSalary, 
                      config.rateCardType !== 'ffp'
                    )
                    const opt1Rate = config.includeEscalation 
                      ? calculateEscalatedRate(baseRate, 2)
                      : baseRate
                    const opt2Rate = config.includeEscalation
                      ? calculateEscalatedRate(baseRate, 3)
                      : baseRate

                    return (
                      <tr key={role.id} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className="p-3 text-gray-900">{role.title || role.name}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="text-xs">
                            {role.icLevel}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-mono text-gray-900">
                          ${baseRate.toFixed(2)}
                        </td>
                        {config.yearsToInclude >= 2 && (
                          <td className="p-3 text-right font-mono text-gray-900">
                            ${opt1Rate.toFixed(2)}
                          </td>
                        )}
                        {config.yearsToInclude >= 3 && (
                          <td className="p-3 text-right font-mono text-gray-900">
                            ${opt2Rate.toFixed(2)}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {selectedRoles.length > 5 && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
                  + {selectedRoles.length - 5} more roles
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Fringe {(indirectRates.fringe * 100).toFixed(1)}% · 
              OH {(indirectRates.overhead * 100).toFixed(1)}% · 
              G&A {(indirectRates.ga * 100).toFixed(1)}%
              {config.rateCardType !== 'ffp' && ` · Profit ${(profitTargets.tmDefault * 100).toFixed(1)}%`}
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Export formats</p>
              <p className="text-xs text-blue-800">
                <strong>Word (.docx)</strong> — Professional formatted document with headers, tables, and styling. 
                Best for proposal submission.<br />
                <strong>CSV</strong> — Raw data for Excel. Best for analysis and custom formatting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ReadinessCheck({ label, passed, detail }: { label: string; passed: boolean; detail: string }) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${passed ? 'bg-green-50' : 'bg-amber-50'}`}>
      {passed ? (
        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-medium ${passed ? 'text-green-900' : 'text-amber-900'}`}>
          {label}
        </p>
        <p className={`text-xs truncate ${passed ? 'text-green-600' : 'text-amber-600'}`}>
          {detail}
        </p>
      </div>
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
  hasOptions?: boolean
  expanded?: boolean
  onToggleExpand?: () => void
  children?: React.ReactNode
}

function DocumentCard({ 
  icon: Icon, 
  title, 
  description, 
  checked, 
  onCheckedChange, 
  badge,
  hasOptions,
  expanded,
  onToggleExpand,
  children 
}: DocumentCardProps) {
  return (
    <div className={`border rounded-lg transition-all ${
      checked ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 bg-white'
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={checked}
            onCheckedChange={onCheckedChange}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${checked ? 'text-blue-600' : 'text-gray-400'}`} />
              <h4 className="font-medium text-sm text-gray-900">{title}</h4>
              {badge && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
          {(hasOptions || children) && (
            <button
              onClick={onToggleExpand}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
          )}
        </div>
        
        {expanded && children && (
          <div className="mt-3 ml-7">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}