'use client'

import { useState } from 'react'
import { useAppContext } from '@/contexts/app-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Shield,
  ChevronRight,
  X,
  Pencil,
  AlertCircle,
  DollarSign,
  TrendingUp,
  HelpCircle,
} from 'lucide-react'

export function SolicitationPill() {
  const { 
    solicitation,
    // UI-specific settings from context
    uiLaborEscalation,
    uiOdcEscalation,
    uiShowEscalation,
    setUiLaborEscalation,
    setUiOdcEscalation,
    setUiShowEscalation,
    uiProfitMargin,
    setUiProfitMargin,
    uiBillableHours,
    setUiBillableHours,
  } = useAppContext()
  
  const [isExpanded, setIsExpanded] = useState(false)

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

  // Empty state - no solicitation loaded
  if (!solicitation?.solicitationNumber) {
    return (
      <TooltipProvider>
        <div className="fixed top-[60px] right-4 z-50">
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-full hover:bg-gray-100 hover:border-gray-400 transition-all"
          >
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">No solicitation loaded</span>
          </button>
        </div>
        
        {/* Still show expanded panel for pricing settings even without solicitation */}
        {isExpanded && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 z-[60]"
              onClick={() => setIsExpanded(false)}
            />
            <div className="fixed top-[60px] right-4 w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[70] animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between p-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Contract Settings</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Configure pricing parameters</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="p-4">
                <PricingSettingsSection 
                  billableHours={uiBillableHours}
                  setBillableHours={setUiBillableHours}
                  profitMargin={uiProfitMargin}
                  setProfitMargin={setUiProfitMargin}
                  showEscalation={uiShowEscalation}
                  setShowEscalation={setUiShowEscalation}
                  laborEscalation={uiLaborEscalation}
                  setLaborEscalation={setUiLaborEscalation}
                  odcEscalation={uiOdcEscalation}
                  setOdcEscalation={setUiOdcEscalation}
                />
              </div>
            </div>
          </>
        )}
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      {/* Floating Pill - Always visible, above header */}
      <div className="fixed top-[60px] right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {solicitation.solicitationNumber}
            </span>
          </div>
          
          {/* Due date indicator */}
          {daysUntilDue !== null && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              isOverdue 
                ? 'bg-red-100 text-red-700' 
                : isUrgent 
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{isOverdue ? 'Overdue' : `${daysUntilDue}d`}</span>
            </div>
          )}
          
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-[60]"
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Panel */}
          <div className="fixed top-[60px] right-4 w-[420px] max-h-[calc(100vh-80px)] bg-white rounded-xl shadow-2xl border border-gray-200 z-[70] animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs font-mono">
                    {solicitation.solicitationNumber}
                  </Badge>
                  {solicitation.contractType && (
                    <Badge variant="secondary" className="text-xs">
                      {solicitation.contractType}
                    </Badge>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                  {solicitation.title || 'Untitled Solicitation'}
                </h3>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Agency */}
              {solicitation.agency && (
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Agency</p>
                    <p className="text-sm font-medium text-gray-900">
                      {solicitation.agency}
                      {solicitation.subAgency && (
                        <span className="text-gray-500"> / {solicitation.subAgency}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Contract Structure */}
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Contract Structure</p>
                  <p className="text-sm font-medium text-gray-900">
                    {solicitation.periodOfPerformance?.baseYear ? '1 Base' : ''}
                    {solicitation.periodOfPerformance?.optionYears 
                      ? ` + ${solicitation.periodOfPerformance.optionYears} Option Years`
                      : ''
                    }
                  </p>
                </div>
              </div>

              {/* Key Dates */}
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Key Dates</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-600">Proposal Due:</span>
                    <span className={`text-sm font-medium ${
                      isOverdue ? 'text-red-600' : isUrgent ? 'text-yellow-600' : 'text-gray-900'
                    }`}>
                      {formatDate(solicitation.proposalDueDate)}
                    </span>
                  </div>
                  {solicitation.questionsDueDate && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-600">Questions Due:</span>
                      <span className="text-sm text-gray-900">
                        {formatDate(solicitation.questionsDueDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {solicitation.setAside && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    {solicitation.setAside}
                  </Badge>
                )}
                {solicitation.clearanceRequired && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-full">
                    <Shield className="w-3 h-3" />
                    {solicitation.clearanceRequired}
                  </span>
                )}
                {solicitation.placeOfPerformance && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {solicitation.placeOfPerformance}
                  </span>
                )}
                {solicitation.naicsCode && (
                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                    {`NAICS ${solicitation.naicsCode}`}
                  </Badge>
                )}
              </div>

              {/* Urgency alert */}
              {isUrgent && !isOverdue && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="text-xs text-yellow-800">
                    <span className="font-medium">Due soon!</span> Only {daysUntilDue} days remaining to submit.
                  </p>
                </div>
              )}

              {isOverdue && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-xs text-red-800">
                    <span className="font-medium">Overdue!</span> The proposal deadline has passed.
                  </p>
                </div>
              )}

              {/* Pricing Settings Section */}
              <div className="pt-4 border-t border-gray-200">
                <PricingSettingsSection 
                  billableHours={uiBillableHours}
                  setBillableHours={setUiBillableHours}
                  profitMargin={uiProfitMargin}
                  setProfitMargin={setUiProfitMargin}
                  showEscalation={uiShowEscalation}
                  setShowEscalation={setUiShowEscalation}
                  laborEscalation={uiLaborEscalation}
                  setLaborEscalation={setUiLaborEscalation}
                  odcEscalation={uiOdcEscalation}
                  setOdcEscalation={setUiOdcEscalation}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </TooltipProvider>
  )
}

// Extracted Pricing Settings Component
interface PricingSettingsProps {
  billableHours: number
  setBillableHours: (value: number) => void
  profitMargin: number
  setProfitMargin: (value: number) => void
  showEscalation: boolean
  setShowEscalation: (value: boolean) => void
  laborEscalation: number
  setLaborEscalation: (value: number) => void
  odcEscalation: number
  setOdcEscalation: (value: number) => void
}

function PricingSettingsSection({
  billableHours,
  setBillableHours,
  profitMargin,
  setProfitMargin,
  showEscalation,
  setShowEscalation,
  laborEscalation,
  setLaborEscalation,
  odcEscalation,
  setOdcEscalation,
}: PricingSettingsProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-gray-400" />
        <h4 className="text-sm font-medium text-gray-900">Pricing Settings</h4>
      </div>
      
      {/* Billable Hours & Profit Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Billable Hours */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <Label htmlFor="billableHours" className="text-xs text-gray-600">Billable Hours/Year</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Learn more about billable hours">
                  <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Standard billable hours per FTE per year. Typically 1,920 (accounting for PTO/holidays) or 2,080 (full calendar year).</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="billableHours"
            type="number"
            value={billableHours}
            onChange={(e) => setBillableHours(Number(e.target.value))}
            className="h-9 text-sm"
          />
        </div>
        
        {/* Profit Margin */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <Label htmlFor="profitMargin" className="text-xs text-gray-600">Profit Margin</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Learn more about profit margin">
                  <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Applied to your fully-loaded labor rate (after fringe, overhead, and G&A) to calculate your fee on prime labor.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <Input
              id="profitMargin"
              type="number"
              value={profitMargin}
              onChange={(e) => setProfitMargin(Number(e.target.value))}
              className="h-9 text-sm pr-7"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
          </div>
        </div>
      </div>
      
      {/* Escalation Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="escalation"
            checked={showEscalation}
            onChange={(e) => setShowEscalation(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex items-center gap-1">
            <Label htmlFor="escalation" className="text-xs text-gray-600 cursor-pointer">Apply Annual Escalation</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Learn more about escalation">
                  <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Automatically increase rates year-over-year to account for inflation and salary growth. Applied compounding to option years.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {showEscalation && (
          <div className="grid grid-cols-2 gap-4 pl-6">
            {/* Labor Escalation */}
            <div className="space-y-1.5">
              <Label htmlFor="laborEsc" className="text-xs text-gray-500">Labor</Label>
              <div className="relative">
                <Input
                  id="laborEsc"
                  type="number"
                  step="0.1"
                  value={laborEscalation}
                  onChange={(e) => setLaborEscalation(Number(e.target.value))}
                  className="h-8 text-sm pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%/yr</span>
              </div>
            </div>
            
            {/* ODC/Travel Escalation */}
            <div className="space-y-1.5">
              <Label htmlFor="odcEsc" className="text-xs text-gray-500">ODC/Travel</Label>
              <div className="relative">
                <Input
                  id="odcEsc"
                  type="number"
                  step="0.1"
                  value={odcEscalation}
                  onChange={(e) => setOdcEscalation(Number(e.target.value))}
                  className="h-8 text-sm pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%/yr</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Summary Preview */}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-medium text-gray-700">Current Settings</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-white border border-gray-200 text-gray-600">
            {billableHours.toLocaleString()} hrs/yr
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-white border border-gray-200 text-gray-600">
            {profitMargin}% profit
          </span>
          {showEscalation ? (
            <>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 border border-blue-200 text-blue-700">
                {laborEscalation}% labor esc
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 border border-blue-200 text-blue-700">
                {odcEscalation}% ODC esc
              </span>
            </>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 border border-gray-200 text-gray-500">
              No escalation
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Alias for backward compatibility
export { SolicitationPill as SolicitationBar }