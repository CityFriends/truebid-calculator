'use client'

import { useState } from 'react'
import { useAppContext } from '@/contexts/app-context'
import { generateExport, downloadBlob } from '@/lib/export-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  FileSpreadsheet, 
  FileText, 
  FileDown, 
  Download, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Calculator,
  Users,
  DollarSign,
  Calendar,
  Shield,
  ChevronRight,
  Loader2
} from 'lucide-react'

// Currency formatter
const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface ExportConfig {
  // Document Info
  solicitation: string
  client: string
  proposalTitle: string
  preparedBy: string
  preparedDate: string
  
  // Export Options
  includeRateCard: boolean
  includeBOE: boolean
  includeLCATs: boolean
  includeAuditPackage: boolean
  
  // Rate Card Options
  rateCardType: 'tm' | 'ffp' | 'gsa' | 'all'
  includeEscalation: boolean
  yearsToInclude: number
  
  // Format
  format: 'xlsx' | 'pdf' | 'docx'
}

export function ExportTab() {
  const {
    companyProfile,
    indirectRates,
    profitTargets,
    escalationRates,
    companyPolicy,
    selectedRoles,
    subcontractors,
    odcs,
    perDiem,
    calculateFullyBurdenedRate,
    calculateEscalatedRate,
    getRateBreakdown,
    companyRoles
  } = useAppContext()

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedFile, setGeneratedFile] = useState<string | null>(null)
  
  const [config, setConfig] = useState<ExportConfig>({
    solicitation: '',
    client: '',
    proposalTitle: '',
    preparedBy: companyProfile.name,
    preparedDate: new Date().toISOString().split('T')[0],
    
    includeRateCard: true,
    includeBOE: true,
    includeLCATs: true,
    includeAuditPackage: false,
    
    rateCardType: 'tm',
    includeEscalation: true,
    yearsToInclude: 3,
    
    format: 'xlsx'
  })

  const updateConfig = (updates: Partial<ExportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  // Calculate totals for preview
  const calculateTotals = () => {
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

    const subTotal = subcontractors.reduce((sum, sub) => {
      return sum + (sub.billedRate * companyPolicy.standardHours * sub.fte * 3)
    }, 0)

    const odcTotal = odcs.reduce((sum, o) => sum + o.totalCost, 0)
    const perDiemTotal = perDiem.reduce((sum, p) => sum + p.totalCost, 0)

    return {
      baseYear,
      option1,
      option2,
      laborTotal: baseYear + option1 + option2,
      subTotal,
      odcTotal,
      perDiemTotal,
      grandTotal: baseYear + option1 + option2 + subTotal + odcTotal + perDiemTotal
    }
  }

  const totals = calculateTotals()

  // Check readiness
  const readinessChecks = [
    { label: 'Roles selected', passed: selectedRoles.length > 0, count: selectedRoles.length },
    { label: 'Indirect rates configured', passed: indirectRates.fringe > 0, detail: `FY${indirectRates.fiscalYear}` },
    { label: 'Company profile set', passed: !!companyProfile.name, detail: companyProfile.name },
    { label: 'Solicitation info', passed: !!config.solicitation, detail: config.solicitation || 'Not set' },
  ]

  const isReady = readinessChecks.filter(c => c.passed).length >= 2

  // Handle export generation
  const handleGenerateExport = async () => {
    setIsGenerating(true)
    setGeneratedFile(null)

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
      const filename = `TrueBid_${config.solicitation || 'Export'}_${new Date().toISOString().split('T')[0]}.${config.format}`
      
      downloadBlob(blob, filename)
      setGeneratedFile(filename)
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Export</h2>
          <p className="text-gray-600">Generate proposal documentation and rate cards</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm py-1 px-3">
            {selectedRoles.length} roles • {formatCurrency(totals.grandTotal)} total
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Configuration (40%) */}
        <div className="col-span-5 space-y-6">
          {/* Document Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document Information
              </CardTitle>
              <CardDescription>Basic proposal details for export headers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="solicitation" className="text-sm font-medium">Solicitation #</Label>
                  <Input
                    id="solicitation"
                    placeholder="e.g., 47QTCA24R0001"
                    value={config.solicitation}
                    onChange={(e) => updateConfig({ solicitation: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client" className="text-sm font-medium">Client / Agency</Label>
                  <Input
                    id="client"
                    placeholder="e.g., Department of Commerce"
                    value={config.client}
                    onChange={(e) => updateConfig({ client: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proposalTitle" className="text-sm font-medium">Proposal Title</Label>
                <Input
                  id="proposalTitle"
                  placeholder="e.g., IT Modernization Support Services"
                  value={config.proposalTitle}
                  onChange={(e) => updateConfig({ proposalTitle: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preparedBy" className="text-sm font-medium">Prepared By</Label>
                  <Input
                    id="preparedBy"
                    value={config.preparedBy}
                    onChange={(e) => updateConfig({ preparedBy: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preparedDate" className="text-sm font-medium">Date</Label>
                  <Input
                    id="preparedDate"
                    type="date"
                    value={config.preparedDate}
                    onChange={(e) => updateConfig({ preparedDate: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Contents */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileDown className="w-5 h-5" />
                Export Contents
              </CardTitle>
              <CardDescription>Select documents to include in export</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <Checkbox
                    id="includeRateCard"
                    checked={config.includeRateCard}
                    onCheckedChange={(checked) => updateConfig({ includeRateCard: checked as boolean })}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="includeRateCard" className="font-medium cursor-pointer">
                      Rate Card
                    </Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Fully burdened rates by labor category with BLS mapping
                    </p>
                    {config.includeRateCard && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <div className="flex items-center gap-4">
                          <Label className="text-sm w-24">Rate Type:</Label>
                          <Select 
                            value={config.rateCardType} 
                            onValueChange={(v: any) => updateConfig({ rateCardType: v })}
                          >
                            <SelectTrigger className="w-40 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tm">T&M (with profit)</SelectItem>
                              <SelectItem value="ffp">FFP (cost only)</SelectItem>
                              <SelectItem value="gsa">GSA Ceiling</SelectItem>
                              <SelectItem value="all">All Variants</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-4">
                          <Label className="text-sm w-24">Years:</Label>
                          <Select 
                            value={config.yearsToInclude.toString()} 
                            onValueChange={(v) => updateConfig({ yearsToInclude: parseInt(v) })}
                          >
                            <SelectTrigger className="w-40 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Base Year Only</SelectItem>
                              <SelectItem value="2">Base + 1 Option</SelectItem>
                              <SelectItem value="3">Base + 2 Options</SelectItem>
                              <SelectItem value="4">Base + 3 Options</SelectItem>
                              <SelectItem value="5">Base + 4 Options</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="includeEscalation"
                            checked={config.includeEscalation}
                            onCheckedChange={(checked) => updateConfig({ includeEscalation: checked as boolean })}
                          />
                          <Label htmlFor="includeEscalation" className="text-sm cursor-pointer">
                            Apply {(escalationRates.laborDefault * 100).toFixed(1)}% annual escalation
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <Checkbox
                    id="includeBOE"
                    checked={config.includeBOE}
                    onCheckedChange={(checked) => updateConfig({ includeBOE: checked as boolean })}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="includeBOE" className="font-medium cursor-pointer">
                      Basis of Estimate (BoE)
                    </Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Cost summary and detail by CLIN with hours breakdown
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <Checkbox
                    id="includeLCATs"
                    checked={config.includeLCATs}
                    onCheckedChange={(checked) => updateConfig({ includeLCATs: checked as boolean })}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="includeLCATs" className="font-medium cursor-pointer">
                      Labor Category Descriptions (LCATs)
                    </Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Role definitions, education requirements, and experience levels
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <Checkbox
                    id="includeAuditPackage"
                    checked={config.includeAuditPackage}
                    onCheckedChange={(checked) => updateConfig({ includeAuditPackage: checked as boolean })}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="includeAuditPackage" className="font-medium cursor-pointer">
                      Audit Defense Package
                    </Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Rate breakdown calculations, BLS comparisons, source documentation
                    </p>
                    <Badge variant="secondary" className="mt-2 text-xs">Advanced</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Format & Generate */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="w-5 h-5" />
                Output Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => updateConfig({ format: 'xlsx' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    config.format === 'xlsx' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileSpreadsheet className={`w-8 h-8 mx-auto mb-2 ${
                    config.format === 'xlsx' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <p className="text-sm font-medium">Excel</p>
                  <p className="text-xs text-gray-500">.xlsx</p>
                </button>

                <button
                  onClick={() => updateConfig({ format: 'pdf' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    config.format === 'pdf' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className={`w-8 h-8 mx-auto mb-2 ${
                    config.format === 'pdf' ? 'text-red-600' : 'text-gray-400'
                  }`} />
                  <p className="text-sm font-medium">PDF</p>
                  <p className="text-xs text-gray-500">.pdf</p>
                </button>

                <button
                  onClick={() => updateConfig({ format: 'docx' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    config.format === 'docx' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className={`w-8 h-8 mx-auto mb-2 ${
                    config.format === 'docx' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <p className="text-sm font-medium">Word</p>
                  <p className="text-xs text-gray-500">.docx</p>
                </button>
              </div>

              <Button 
                className="w-full h-12 text-base"
                disabled={!isReady || isGenerating}
                onClick={handleGenerateExport}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Generate Export
                  </>
                )}
              </Button>

              {generatedFile && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Export Ready!</span>
                  </div>
                  <p className="text-sm text-green-600 mb-3">{generatedFile}</p>
                  <Button size="sm" variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Preview (60%) */}
        <div className="col-span-7 space-y-6">
          {/* Readiness Check */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Export Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {readinessChecks.map((check, i) => (
                  <div 
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      check.passed ? 'bg-green-50' : 'bg-amber-50'
                    }`}
                  >
                    {check.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${check.passed ? 'text-green-900' : 'text-amber-900'}`}>
                        {check.label}
                      </p>
                      <p className={`text-xs truncate ${check.passed ? 'text-green-600' : 'text-amber-600'}`}>
                        {check.count !== undefined ? `${check.count} items` : check.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview Tabs */}
          <Card className="flex-1">
            <Tabs defaultValue="ratecard">
              <CardHeader className="pb-0">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="ratecard" disabled={!config.includeRateCard}>
                    Rate Card
                  </TabsTrigger>
                  <TabsTrigger value="boe" disabled={!config.includeBOE}>
                    BoE
                  </TabsTrigger>
                  <TabsTrigger value="lcats" disabled={!config.includeLCATs}>
                    LCATs
                  </TabsTrigger>
                  <TabsTrigger value="audit" disabled={!config.includeAuditPackage}>
                    Audit
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Rate Card Preview */}
                <TabsContent value="ratecard" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {config.rateCardType === 'tm' ? 'T&M Rates (with profit)' : 
                         config.rateCardType === 'ffp' ? 'FFP Cost Rates (no profit)' :
                         config.rateCardType === 'gsa' ? 'GSA Ceiling Rates' : 'All Rate Types'}
                      </span>
                      <Badge variant="outline">
                        {config.yearsToInclude} year{config.yearsToInclude > 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {/* Rate Card Table Preview */}
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 font-medium">Labor Category</th>
                            <th className="text-left p-3 font-medium">Level</th>
                            <th className="text-right p-3 font-medium">Base Year</th>
                            {config.yearsToInclude >= 2 && (
                              <th className="text-right p-3 font-medium">Opt 1</th>
                            )}
                            {config.yearsToInclude >= 3 && (
                              <th className="text-right p-3 font-medium">Opt 2</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedRoles.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-gray-500">
                                No roles selected. Add roles in Roles & Pricing tab.
                              </td>
                            </tr>
                          ) : (
                            selectedRoles.slice(0, 5).map(role => {
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
                                <tr key={role.id} className="hover:bg-gray-50">
                                  <td className="p-3">{role.title || role.name}</td>
                                  <td className="p-3">
                                    <Badge variant="outline" className="text-xs">
                                      {role.icLevel}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-right font-mono">
                                    {formatCurrency(baseRate)}/hr
                                  </td>
                                  {config.yearsToInclude >= 2 && (
                                    <td className="p-3 text-right font-mono">
                                      {formatCurrency(opt1Rate)}/hr
                                    </td>
                                  )}
                                  {config.yearsToInclude >= 3 && (
                                    <td className="p-3 text-right font-mono">
                                      {formatCurrency(opt2Rate)}/hr
                                    </td>
                                  )}
                                </tr>
                              )
                            })
                          )}
                          {selectedRoles.length > 5 && (
                            <tr>
                              <td colSpan={5} className="p-3 text-center text-gray-500 text-sm">
                                + {selectedRoles.length - 5} more roles...
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-xs text-gray-500">
                      Rates calculated using {indirectRates.source} • 
                      Fringe: {(indirectRates.fringe * 100).toFixed(2)}% • 
                      OH: {(indirectRates.overhead * 100).toFixed(2)}% • 
                      G&A: {(indirectRates.ga * 100).toFixed(2)}%
                      {config.rateCardType !== 'ffp' && ` • Profit: ${(profitTargets.tmDefault * 100).toFixed(1)}%`}
                    </p>
                  </div>
                </TabsContent>

                {/* BoE Preview */}
                <TabsContent value="boe" className="mt-0">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Solicitation</p>
                        <p className="font-medium">{config.solicitation || 'Not specified'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Client</p>
                        <p className="font-medium">{config.client || 'Not specified'}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Cost Summary */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        Cost Summary
                      </h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm p-2 bg-blue-50 rounded">
                          <span>Direct Labor - Base Year</span>
                          <span className="font-mono font-medium">{formatCurrency(totals.baseYear)}</span>
                        </div>
                        <div className="flex justify-between text-sm p-2 bg-blue-50 rounded">
                          <span>Direct Labor - Option Year 1</span>
                          <span className="font-mono font-medium">{formatCurrency(totals.option1)}</span>
                        </div>
                        <div className="flex justify-between text-sm p-2 bg-blue-50 rounded">
                          <span>Direct Labor - Option Year 2</span>
                          <span className="font-mono font-medium">{formatCurrency(totals.option2)}</span>
                        </div>
                        <div className="flex justify-between text-sm p-2 rounded border">
                          <span>Subcontractor Labor</span>
                          <span className="font-mono">{formatCurrency(totals.subTotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm p-2 rounded border">
                          <span>Other Direct Costs</span>
                          <span className="font-mono">{formatCurrency(totals.odcTotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm p-2 rounded border">
                          <span>Travel / Per Diem</span>
                          <span className="font-mono">{formatCurrency(totals.perDiemTotal)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-base p-3 bg-green-50 rounded-lg">
                          <span className="font-semibold">Total Proposed Price</span>
                          <span className="font-mono font-bold text-green-700">
                            {formatCurrency(totals.grandTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* LCATs Preview */}
                <TabsContent value="lcats" className="mt-0">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Labor category descriptions for {selectedRoles.length} roles
                    </p>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {selectedRoles.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          No roles selected. Add roles in Roles & Pricing tab.
                        </div>
                      ) : (
                        selectedRoles.map(role => {
                          // Find matching company role for additional details
                          const companyRole = companyRoles.find(cr => 
                            cr.title.toLowerCase().includes(role.name.toLowerCase()) ||
                            role.name.toLowerCase().includes(cr.title.toLowerCase())
                          )
                          
                          const levelInfo = companyRole?.levels.find(l => l.level === role.icLevel)

                          return (
                            <div key={role.id} className="p-4 border rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{role.title || role.name}</h4>
                                <Badge variant="outline">{role.icLevel}</Badge>
                              </div>
                              <p className="text-sm text-gray-600">{role.description}</p>
                              <div className="grid grid-cols-3 gap-4 pt-2 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500 uppercase">Education</p>
                                  <p className="font-medium">Bachelor's Degree</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase">Experience</p>
                                  <p className="font-medium">{levelInfo?.yearsExperience || '4-7'} years</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase">BLS Code</p>
                                  <p className="font-medium">{companyRole?.blsOccCode || '15-1252'}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Audit Package Preview */}
                <TabsContent value="audit" className="mt-0">
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-900">Audit Defense Package</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Includes detailed rate calculations matching accountant's model,
                            BLS salary comparisons for market positioning, and source documentation
                            for all indirect rates.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Package Contents</h4>
                      <div className="space-y-2">
                        {[
                          { label: 'Rate Calculation Worksheet', desc: 'Step-by-step burden calculation for each LCAT' },
                          { label: 'Indirect Rate Documentation', desc: `Source: ${indirectRates.source}` },
                          { label: 'BLS Salary Comparison', desc: 'Market positioning analysis by occupation code' },
                          { label: 'Escalation Justification', desc: `${(escalationRates.laborDefault * 100)}% based on ${escalationRates.source}` },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-gray-500">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sample Rate Breakdown */}
                    {selectedRoles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Sample Rate Breakdown</h4>
                        <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm">
                          {(() => {
                            const sampleRole = selectedRoles[0]
                            const breakdown = getRateBreakdown(sampleRole.baseSalary, true)
                            return (
                              <div className="space-y-1">
                                <p className="text-gray-600 mb-2 font-sans">{sampleRole.title || sampleRole.name} ({sampleRole.icLevel})</p>
                                <div className="flex justify-between">
                                  <span>Base: ${sampleRole.baseSalary.toLocaleString()} ÷ 2080</span>
                                  <span>${breakdown.baseRate.toFixed(2)}/hr</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>+ Fringe ({(indirectRates.fringe * 100).toFixed(2)}%)</span>
                                  <span>${breakdown.afterFringe.toFixed(2)}/hr</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>+ Overhead ({(indirectRates.overhead * 100).toFixed(2)}%)</span>
                                  <span>${breakdown.afterOverhead.toFixed(2)}/hr</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>+ G&A ({(indirectRates.ga * 100).toFixed(2)}%)</span>
                                  <span>${breakdown.afterGA.toFixed(2)}/hr</span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-gray-300">
                                  <span>+ Profit ({(profitTargets.tmDefault * 100).toFixed(1)}%)</span>
                                  <span className="font-bold">${breakdown.fullyBurdenedRate.toFixed(2)}/hr</span>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}