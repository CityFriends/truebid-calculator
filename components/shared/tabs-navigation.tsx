'use client'

import { useState } from 'react'
import { Upload, Target, Users, TrendingUp, Building2, FileDown, Calculator, FileSpreadsheet, FileText, Clock, ChevronUp, ChevronDown, X, Pencil, Calendar, MapPin, Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppContext } from '@/contexts/app-context'
import { UploadTab } from '@/components/tabs/upload-tab'
import { ScopingTab } from '@/components/tabs/scoping-tab'
import { RolesAndPricingTab } from '@/components/tabs/roles-and-pricing-tab'
import { RateJustificationTab } from '@/components/tabs/rate-justification-tab'
import { SubcontractorsTab } from '@/components/tabs/subcontractors-tab'
import { SubRatesTab } from '@/components/tabs/sub-rates-tab'
import { ExportTab } from '@/components/tabs/export-tab'
import GSABidTab from '@/components/tabs/gsa-bid-tab'

// Label mappings for display
const contractTypeLabels: Record<string, string> = {
  'FFP': 'Firm Fixed Price',
  'T&M': 'Time & Materials',
  'CPFF': 'Cost Plus Fixed Fee',
  'CPAF': 'Cost Plus Award Fee',
  'IDIQ': 'IDIQ',
  'BPA': 'BPA',
  'hybrid': 'Hybrid'
}

const setAsideLabels: Record<string, string> = {
  'full-open': 'Full & Open',
  'small-business': 'Small Business',
  '8a': '8(a)',
  'hubzone': 'HUBZone',
  'sdvosb': 'SDVOSB',
  'wosb': 'WOSB',
  'edwosb': 'EDWOSB'
}

const clearanceLevelLabels: Record<string, string> = {
  'public-trust': 'Public Trust',
  'secret': 'Secret',
  'top-secret': 'Top Secret',
  'ts-sci': 'TS/SCI'
}

const evaluationMethodLabels: Record<string, string> = {
  'LPTA': 'LPTA',
  'best-value': 'Best Value',
  'tradeoff': 'Tradeoff'
}

type TabType = 'upload' | 'scoping' | 'roles' | 'rate-justification' | 'subcontractors' | 'export' | 'gsa-bid' | 'sub-rates'

export function TabsNavigation() {
  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [showSolicitationExpanded, setShowSolicitationExpanded] = useState(false)
  const [isEditingSolicitation, setIsEditingSolicitation] = useState(false)
  const { solicitation, updateSolicitation } = useAppContext()

  // Main bid flow tabs
  const bidFlowTabs = [
    { id: 'upload' as TabType, label: 'Upload', icon: Upload },
    { id: 'scoping' as TabType, label: 'Scoping', icon: Target },
    { id: 'roles' as TabType, label: 'Roles & Pricing', icon: Users },
    { id: 'rate-justification' as TabType, label: 'Rate Justification', icon: TrendingUp },
    { id: 'subcontractors' as TabType, label: 'Subcontractors', icon: Building2 },
    { id: 'export' as TabType, label: 'Export', icon: FileDown },
  ]

  // Utility tools (standalone features)
  const utilityTabs = [
    { id: 'gsa-bid' as TabType, label: 'GSA Bid', icon: FileSpreadsheet },
    { id: 'sub-rates' as TabType, label: 'Sub Rates', icon: Calculator },
  ]

  // Check if we're on a utility tab
  const isUtilityTab = ['gsa-bid', 'sub-rates'].includes(activeTab)

  // Calculate days until due
  const getDaysUntilDue = () => {
    if (!solicitation?.proposalDueDate) return null
    const due = new Date(solicitation.proposalDueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilDue = getDaysUntilDue()
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 14
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'TBD'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Show solicitation bar on main bid flow tabs (not upload, not utility)
  const showSolicitationBar = !isUtilityTab && activeTab !== 'upload' && solicitation?.solicitationNumber

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {/* Main Bid Flow Tabs */}
            {bidFlowTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                    ${isActive 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}

            {/* Divider between main tabs and utility tabs */}
            <div className="h-6 w-px bg-gray-300 mx-3 flex-shrink-0" />

            {/* Utility Tools */}
            {utilityTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 my-1 text-sm font-medium whitespace-nowrap rounded-md transition-colors
                    ${isActive 
                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Solicitation Bar - Own row below tabs */}
      {showSolicitationBar && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-6">
            {/* Collapsed view */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {solicitation.solicitationNumber}
                  </span>
                  {solicitation.title && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-600 truncate max-w-md">
                        {solicitation.title}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Badges */}
                <div className="flex items-center gap-2">
                  {solicitation.contractType && (
                    <Badge variant="secondary" className="text-xs">
                      {solicitation.contractType}
                    </Badge>
                  )}
                  {solicitation.setAside && solicitation.setAside !== 'full-open' && (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      {setAsideLabels[solicitation.setAside] || solicitation.setAside}
                    </Badge>
                  )}
                  {solicitation.clearanceLevel && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-full">
                      <Shield className="w-3 h-3" />
                      {clearanceLevelLabels[solicitation.clearanceLevel] || solicitation.clearanceLevel}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Due date */}
                {daysUntilDue !== null && (
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                    isOverdue 
                      ? 'bg-red-100 text-red-700' 
                      : isUrgent 
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>{isOverdue ? 'Overdue' : `${daysUntilDue} days left`}</span>
                  </div>
                )}

                {/* Edit button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingSolicitation(true)}
                  className="h-7 px-2 text-gray-500 hover:text-gray-700"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  Edit
                </Button>

                {/* Expand/Collapse */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSolicitationExpanded(!showSolicitationExpanded)}
                  className="h-7 w-7 p-0 text-gray-400"
                >
                  {showSolicitationExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Expanded view */}
            {showSolicitationExpanded && (
              <div className="pb-4 pt-3 border-t border-gray-100">
                {/* Title row */}
                {solicitation.title && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {solicitation.title}
                    </h3>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-6">
                  {/* Column 1: Solicitation Details */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Solicitation Details</h4>
                    <div className="space-y-1.5">
                      <p className="text-sm">
                        <span className="text-gray-500">Number:</span>{' '}
                        <span className="font-medium text-gray-900">{solicitation.solicitationNumber}</span>
                      </p>
                      {solicitation.clientAgency && (
                        <p className="text-sm">
                          <span className="text-gray-500">Agency:</span>{' '}
                          <span className="text-gray-900">{solicitation.clientAgency}</span>
                        </p>
                      )}
                      {solicitation.subAgency && (
                        <p className="text-sm">
                          <span className="text-gray-500">Sub-Agency:</span>{' '}
                          <span className="text-gray-900">{solicitation.subAgency}</span>
                        </p>
                      )}
                      {solicitation.naicsCode && (
                        <p className="text-sm">
                          <span className="text-gray-500">NAICS:</span>{' '}
                          <span className="text-gray-900">{solicitation.naicsCode}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Contract Structure */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Contract Structure</h4>
                    <div className="space-y-1.5">
                      {solicitation.contractType && (
                        <p className="text-sm">
                          <span className="text-gray-500">Type:</span>{' '}
                          <span className="text-gray-900">{contractTypeLabels[solicitation.contractType] || solicitation.contractType}</span>
                        </p>
                      )}
                      {solicitation.periodOfPerformance && (
                        <p className="text-sm">
                          <span className="text-gray-500">Period:</span>{' '}
                          <span className="text-gray-900">
                            {solicitation.periodOfPerformance.baseYear ? '1 Base' : ''}
                            {solicitation.periodOfPerformance.optionYears 
                              ? ` + ${solicitation.periodOfPerformance.optionYears} Option Years`
                              : ''
                            }
                          </span>
                        </p>
                      )}
                      {solicitation.budgetRange?.ceiling && (
                        <p className="text-sm">
                          <span className="text-gray-500">Budget Ceiling:</span>{' '}
                          <span className="text-gray-900">${solicitation.budgetRange.ceiling.toLocaleString()}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Key Dates */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Key Dates</h4>
                    <div className="space-y-1.5">
                      <p className="text-sm">
                        <span className="text-gray-500">Proposal Due:</span>{' '}
                        <span className={`font-medium ${isOverdue ? 'text-red-600' : isUrgent ? 'text-yellow-600' : 'text-gray-900'}`}>
                          {formatDate(solicitation.proposalDueDate)}
                        </span>
                      </p>
                      {solicitation.questionsDeadline && (
                        <p className="text-sm">
                          <span className="text-gray-500">Questions Due:</span>{' '}
                          <span className="text-gray-900">{formatDate(solicitation.questionsDeadline)}</span>
                        </p>
                      )}
                      {solicitation.anticipatedAwardDate && (
                        <p className="text-sm">
                          <span className="text-gray-500">Expected Award:</span>{' '}
                          <span className="text-gray-900">{formatDate(solicitation.anticipatedAwardDate)}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Column 4: Requirements */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Requirements</h4>
                    <div className="space-y-1.5">
                      {solicitation.setAside && (
                        <p className="text-sm">
                          <span className="text-gray-500">Set-Aside:</span>{' '}
                          <span className="text-gray-900">{setAsideLabels[solicitation.setAside] || solicitation.setAside}</span>
                        </p>
                      )}
                      {solicitation.clearanceLevel && (
                        <p className="text-sm">
                          <span className="text-gray-500">Clearance:</span>{' '}
                          <span className="text-gray-900">{clearanceLevelLabels[solicitation.clearanceLevel] || solicitation.clearanceLevel}</span>
                        </p>
                      )}
                      {solicitation.placeOfPerformance?.type && (
                        <p className="text-sm">
                          <span className="text-gray-500">Location:</span>{' '}
                          <span className="text-gray-900 capitalize">{solicitation.placeOfPerformance.type}</span>
                          {solicitation.placeOfPerformance.locations?.length > 0 && (
                            <span className="text-gray-500"> ({solicitation.placeOfPerformance.locations.join(', ')})</span>
                          )}
                        </p>
                      )}
                      {solicitation.placeOfPerformance?.travelRequired && (
                        <p className="text-sm">
                          <span className="text-gray-500">Travel:</span>{' '}
                          <span className="text-gray-900">
                            Required{solicitation.placeOfPerformance.travelPercent ? ` (${solicitation.placeOfPerformance.travelPercent}%)` : ''}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Urgency alert */}
                {isUrgent && !isOverdue && (
                  <div className="flex items-center gap-2 mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      <span className="font-medium">Due soon!</span> Only {daysUntilDue} days remaining to submit your proposal.
                    </p>
                  </div>
                )}

                {isOverdue && (
                  <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">
                      <span className="font-medium">Overdue!</span> The proposal deadline has passed.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Solicitation Slideout */}
      {isEditingSolicitation && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-50"
            onClick={() => setIsEditingSolicitation(false)}
          />
          <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Solicitation</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingSolicitation(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Basic Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="solNum">Solicitation Number</Label>
                    <Input
                      id="solNum"
                      value={solicitation?.solicitationNumber || ''}
                      onChange={(e) => updateSolicitation({ solicitationNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="internalBidNum">Internal Bid Number</Label>
                    <Input
                      id="internalBidNum"
                      value={solicitation?.internalBidNumber || ''}
                      onChange={(e) => updateSolicitation({ internalBidNumber: e.target.value })}
                      placeholder="e.g., BID-2024-042"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={solicitation?.title || ''}
                    onChange={(e) => updateSolicitation({ title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agency">Agency</Label>
                    <select
                      id="agency"
                      value={solicitation?.clientAgency || ''}
                      onChange={(e) => updateSolicitation({ clientAgency: e.target.value })}
                      className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Agency</option>
                      <option value="DOD">Department of Defense (DOD)</option>
                      <option value="HHS">Health & Human Services (HHS)</option>
                      <option value="VA">Veterans Affairs (VA)</option>
                      <option value="DHS">Homeland Security (DHS)</option>
                      <option value="DOJ">Department of Justice (DOJ)</option>
                      <option value="Treasury">Department of Treasury</option>
                      <option value="State">Department of State</option>
                      <option value="DOE">Department of Energy (DOE)</option>
                      <option value="EPA">Environmental Protection Agency (EPA)</option>
                      <option value="NASA">NASA</option>
                      <option value="GSA">General Services Administration (GSA)</option>
                      <option value="SSA">Social Security Administration (SSA)</option>
                      <option value="USDA">Department of Agriculture (USDA)</option>
                      <option value="Commerce">Department of Commerce</option>
                      <option value="Labor">Department of Labor</option>
                      <option value="Interior">Department of Interior</option>
                      <option value="Education">Department of Education</option>
                      <option value="HUD">Housing & Urban Development (HUD)</option>
                      <option value="Transportation">Department of Transportation</option>
                      <option value="OPM">Office of Personnel Management (OPM)</option>
                      <option value="SBA">Small Business Administration (SBA)</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subAgency">Sub-Agency / Bureau</Label>
                    <Input
                      id="subAgency"
                      value={solicitation?.subAgency || ''}
                      onChange={(e) => updateSolicitation({ subAgency: e.target.value })}
                      placeholder="e.g., CDC, FBI, USCIS"
                    />
                  </div>
                </div>
              </div>

              {/* Contract Details */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Contract Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractType">Contract Type</Label>
                    <select
                      id="contractType"
                      value={solicitation?.contractType || ''}
                      onChange={(e) => updateSolicitation({ contractType: e.target.value as any })}
                      className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Type</option>
                      <option value="FFP">Firm Fixed Price (FFP)</option>
                      <option value="T&M">Time & Materials (T&M)</option>
                      <option value="CPFF">Cost Plus Fixed Fee (CPFF)</option>
                      <option value="CPAF">Cost Plus Award Fee (CPAF)</option>
                      <option value="IDIQ">IDIQ</option>
                      <option value="BPA">Blanket Purchase Agreement (BPA)</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evaluationMethod">Evaluation Method</Label>
                    <select
                      id="evaluationMethod"
                      value={solicitation?.evaluationMethod || ''}
                      onChange={(e) => updateSolicitation({ evaluationMethod: e.target.value as any })}
                      className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Method</option>
                      <option value="LPTA">Lowest Price Technically Acceptable (LPTA)</option>
                      <option value="best-value">Best Value</option>
                      <option value="tradeoff">Tradeoff</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="naics">NAICS Code</Label>
                    <Input
                      id="naics"
                      value={solicitation?.naicsCode || ''}
                      onChange={(e) => updateSolicitation({ naicsCode: e.target.value })}
                      placeholder="e.g., 541512"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="psc">PSC Code</Label>
                    <Input
                      id="psc"
                      value={solicitation?.psc || ''}
                      onChange={(e) => updateSolicitation({ psc: e.target.value })}
                      placeholder="e.g., D302"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractVehicle">Contract Vehicle</Label>
                  <Input
                    id="contractVehicle"
                    value={solicitation?.contractVehicle || ''}
                    onChange={(e) => updateSolicitation({ contractVehicle: e.target.value })}
                    placeholder="e.g., GSA MAS, CIO-SP3, Alliant 2"
                  />
                </div>
              </div>

              {/* Period of Performance */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Period of Performance</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Base Year</Label>
                    <div className="flex items-center gap-2 h-9">
                      <input
                        type="checkbox"
                        id="baseYear"
                        checked={solicitation?.periodOfPerformance?.baseYear ?? true}
                        onChange={(e) => updateSolicitation({ 
                          periodOfPerformance: { 
                            ...solicitation?.periodOfPerformance,
                            baseYear: e.target.checked 
                          }
                        })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="baseYear" className="text-sm text-gray-700">Include Base Year</label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="optionYears">Option Years</Label>
                    <select
                      id="optionYears"
                      value={solicitation?.periodOfPerformance?.optionYears ?? 2}
                      onChange={(e) => updateSolicitation({ 
                        periodOfPerformance: { 
                          ...solicitation?.periodOfPerformance,
                          optionYears: parseInt(e.target.value) 
                        }
                      })}
                      className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="0">0 Option Years</option>
                      <option value="1">1 Option Year</option>
                      <option value="2">2 Option Years</option>
                      <option value="3">3 Option Years</option>
                      <option value="4">4 Option Years</option>
                      <option value="5">5 Option Years</option>
                      <option value="6">6 Option Years</option>
                      <option value="7">7 Option Years</option>
                      <option value="8">8 Option Years</option>
                      <option value="9">9 Option Years</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Set-Aside & Compliance */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Set-Aside & Compliance</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="setAside">Set-Aside</Label>
                    <select
                      id="setAside"
                      value={solicitation?.setAside || ''}
                      onChange={(e) => updateSolicitation({ setAside: e.target.value as any })}
                      className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Set-Aside</option>
                      <option value="full-open">Full & Open Competition</option>
                      <option value="small-business">Small Business Set-Aside</option>
                      <option value="8a">8(a) Set-Aside</option>
                      <option value="hubzone">HUBZone Set-Aside</option>
                      <option value="sdvosb">SDVOSB Set-Aside</option>
                      <option value="wosb">WOSB Set-Aside</option>
                      <option value="edwosb">EDWOSB Set-Aside</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clearance">Clearance Required</Label>
                    <select
                      id="clearance"
                      value={solicitation?.clearanceLevel || ''}
                      onChange={(e) => updateSolicitation({ 
                        requiresClearance: e.target.value !== '',
                        clearanceLevel: e.target.value as any 
                      })}
                      className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None Required</option>
                      <option value="public-trust">Public Trust</option>
                      <option value="secret">Secret</option>
                      <option value="top-secret">Top Secret</option>
                      <option value="ts-sci">TS/SCI</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Place of Performance */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Place of Performance</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="performanceType">Work Location Type</Label>
                    <select
                      id="performanceType"
                      value={solicitation?.placeOfPerformance?.type || ''}
                      onChange={(e) => updateSolicitation({ 
                        placeOfPerformance: { 
                          ...solicitation?.placeOfPerformance,
                          type: e.target.value as any 
                        }
                      })}
                      className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Type</option>
                      <option value="remote">Remote</option>
                      <option value="on-site">On-Site</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="travelPercent">Travel Requirement (%)</Label>
                    <Input
                      id="travelPercent"
                      type="number"
                      min="0"
                      max="100"
                      value={solicitation?.placeOfPerformance?.travelPercent || ''}
                      onChange={(e) => updateSolicitation({ 
                        placeOfPerformance: { 
                          ...solicitation?.placeOfPerformance,
                          travelRequired: parseInt(e.target.value) > 0,
                          travelPercent: parseInt(e.target.value) || 0
                        }
                      })}
                      placeholder="0-100"
                    />
                  </div>
                </div>
              </div>

              {/* Key Dates */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Key Dates</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="releaseDate">Release Date</Label>
                    <Input
                      id="releaseDate"
                      type="date"
                      value={solicitation?.releaseDate?.split('T')[0] || ''}
                      onChange={(e) => updateSolicitation({ releaseDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="questionsDue">Questions Due</Label>
                    <Input
                      id="questionsDue"
                      type="date"
                      value={solicitation?.questionsDeadline?.split('T')[0] || ''}
                      onChange={(e) => updateSolicitation({ questionsDeadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proposalDue">Proposal Due</Label>
                    <Input
                      id="proposalDue"
                      type="date"
                      value={solicitation?.proposalDueDate?.split('T')[0] || ''}
                      onChange={(e) => updateSolicitation({ proposalDueDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="awardDate">Anticipated Award</Label>
                    <Input
                      id="awardDate"
                      type="date"
                      value={solicitation?.anticipatedAwardDate?.split('T')[0] || ''}
                      onChange={(e) => updateSolicitation({ anticipatedAwardDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Budget Range (Optional)</h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Minimum ($)</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      value={solicitation?.budgetRange?.min || ''}
                      onChange={(e) => updateSolicitation({ 
                        budgetRange: { 
                          ...solicitation?.budgetRange,
                          min: parseInt(e.target.value) || undefined 
                        }
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Maximum ($)</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      value={solicitation?.budgetRange?.max || ''}
                      onChange={(e) => updateSolicitation({ 
                        budgetRange: { 
                          ...solicitation?.budgetRange,
                          max: parseInt(e.target.value) || undefined 
                        }
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetCeiling">Ceiling ($)</Label>
                    <Input
                      id="budgetCeiling"
                      type="number"
                      value={solicitation?.budgetRange?.ceiling || ''}
                      onChange={(e) => updateSolicitation({ 
                        budgetRange: { 
                          ...solicitation?.budgetRange,
                          ceiling: parseInt(e.target.value) || undefined 
                        }
                      })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Bid Decision */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Bid Decision</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bidDecision">Decision</Label>
                    <select
                      id="bidDecision"
                      value={solicitation?.bidDecision || ''}
                      onChange={(e) => updateSolicitation({ bidDecision: e.target.value as any })}
                      className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Not Decided</option>
                      <option value="pending">Pending Review</option>
                      <option value="go">Go</option>
                      <option value="no-go">No-Go</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bidDecisionDate">Decision Date</Label>
                    <Input
                      id="bidDecisionDate"
                      type="date"
                      value={solicitation?.bidDecisionDate?.split('T')[0] || ''}
                      onChange={(e) => updateSolicitation({ bidDecisionDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bidRationale">Rationale</Label>
                  <textarea
                    id="bidRationale"
                    value={solicitation?.bidDecisionRationale || ''}
                    onChange={(e) => updateSolicitation({ bidDecisionRationale: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    placeholder="Why are we pursuing / not pursuing this opportunity?"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditingSolicitation(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsEditingSolicitation(false)}>
                Save Changes
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Tab Content */}
      <div className="container mx-auto px-6 py-6">
        {/* Main Bid Flow */}
        {activeTab === 'upload' && <UploadTab onContinue={() => setActiveTab('scoping')} />}
        {activeTab === 'scoping' && <ScopingTab onContinue={() => setActiveTab('roles')} />}
        {activeTab === 'roles' && <RolesAndPricingTab />}
        {activeTab === 'rate-justification' && <RateJustificationTab onContinue={() => setActiveTab('subcontractors')} />}
        {activeTab === 'subcontractors' && <SubcontractorsTab onContinue={() => setActiveTab('export')} />}
        {activeTab === 'export' && <ExportTab />}
        
        {/* Utility Tools */}
        {activeTab === 'gsa-bid' && <GSABidTab />}
        {activeTab === 'sub-rates' && <SubRatesTab />}
      </div>
    </div>
  )
}