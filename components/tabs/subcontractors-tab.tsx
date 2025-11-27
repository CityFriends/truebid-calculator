'use client'

import { useState } from 'react'
import { useAppContext } from '@/contexts/app-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
  DollarSign, 
  TrendingUp, 
  Search,
  Pencil,
  X,
  CheckCircle2,
  Info,
  HelpCircle,
  Users,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

// ==================== TYPES ====================
interface SubcontractorsTabProps {
  onContinue?: () => void
}

interface SubcontractorFormData {
  companyName: string
  role: string
  laborCategory: string
  theirRate: number
  markupPercent: number
  fte: number
  rateSource: string
  quoteDate: string
  quoteReference: string
  years: {
    base: boolean
    option1: boolean
    option2: boolean
    option3: boolean
    option4: boolean
  }
}

// ==================== HELPERS ====================
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`
  }
  return formatCurrency(amount)
}

const emptyFormData: SubcontractorFormData = {
  companyName: '',
  role: '',
  laborCategory: '',
  theirRate: 150,
  markupPercent: 15,
  fte: 1.0,
  rateSource: 'quote',
  quoteDate: '',
  quoteReference: '',
  years: {
    base: true,
    option1: true,
    option2: true,
    option3: false,
    option4: false,
  }
}

// ==================== COMPONENT ====================
export function SubcontractorsTab({ onContinue }: SubcontractorsTabProps) {
  const {
    subcontractors,
    addSubcontractor,
    removeSubcontractor,
    updateSubcontractor,
    escalationRates,
    companyPolicy,
    solicitation,
  } = useAppContext()

  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'company' | 'role'>('all')
  const [sortBy, setSortBy] = useState<'company' | 'rate' | 'cost'>('company')
  
  // Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<SubcontractorFormData>(emptyFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Sidebar collapse state
  const [showCostBreakdown, setShowCostBreakdown] = useState(true)

  // Get contract years from solicitation
  const contractYears = solicitation.periodOfPerformance.baseYear 
    ? 1 + solicitation.periodOfPerformance.optionYears 
    : solicitation.periodOfPerformance.optionYears

  // ==================== CALCULATIONS ====================
  const calculateSubYearCost = (yearKey: 'base' | 'option1' | 'option2' | 'option3' | 'option4', yearIndex: number) => {
    let total = 0
    subcontractors.forEach(sub => {
      if (sub.years[yearKey]) {
        const annualCost = sub.billedRate * companyPolicy.standardHours * sub.fte
        const escalatedCost = yearIndex === 0 ? annualCost : annualCost * Math.pow(1 + escalationRates.laborDefault, yearIndex)
        total += escalatedCost
      }
    })
    return total
  }

  const yearCosts = {
    base: calculateSubYearCost('base', 0),
    option1: calculateSubYearCost('option1', 1),
    option2: calculateSubYearCost('option2', 2),
    option3: calculateSubYearCost('option3', 3),
    option4: calculateSubYearCost('option4', 4),
  }

  const totalSubCost = Object.values(yearCosts).reduce((sum, cost) => sum + cost, 0)

  const calculateMarkupRevenue = () => {
    let total = 0
    subcontractors.forEach(sub => {
      const markupPerHour = sub.theirRate * (sub.markupPercent / 100)
      const annualMarkup = markupPerHour * companyPolicy.standardHours * sub.fte
      
      if (sub.years.base) total += annualMarkup
      if (sub.years.option1) total += annualMarkup * (1 + escalationRates.laborDefault)
      if (sub.years.option2) total += annualMarkup * Math.pow(1 + escalationRates.laborDefault, 2)
      if (sub.years.option3) total += annualMarkup * Math.pow(1 + escalationRates.laborDefault, 3)
      if (sub.years.option4) total += annualMarkup * Math.pow(1 + escalationRates.laborDefault, 4)
    })
    return total
  }

  const totalMarkupRevenue = calculateMarkupRevenue()
  const totalFTE = subcontractors.reduce((sum, sub) => sum + sub.fte, 0)
  const avgMarkup = subcontractors.length > 0
    ? subcontractors.reduce((sum, sub) => sum + sub.markupPercent, 0) / subcontractors.length
    : 0

  // ==================== FILTERING & SORTING ====================
  const filteredSubcontractors = subcontractors
    .filter(sub => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        sub.companyName.toLowerCase().includes(query) ||
        sub.role.toLowerCase().includes(query) ||
        (sub.laborCategory && sub.laborCategory.toLowerCase().includes(query))
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rate':
          return b.billedRate - a.billedRate
        case 'cost':
          return (b.billedRate * b.fte) - (a.billedRate * a.fte)
        case 'company':
        default:
          return a.companyName.localeCompare(b.companyName)
      }
    })

  // Get unique companies for sidebar
  const uniqueCompanies = [...new Set(subcontractors.map(s => s.companyName))]

  // ==================== HANDLERS ====================
  const openAddPanel = () => {
    setEditingId(null)
    setFormData(emptyFormData)
    setFormErrors({})
    setIsPanelOpen(true)
  }

  const openEditPanel = (subId: string) => {
    const sub = subcontractors.find(s => s.id === subId)
    if (!sub) return

    setEditingId(subId)
    setFormData({
      companyName: sub.companyName,
      role: sub.role,
      laborCategory: sub.laborCategory || '',
      theirRate: sub.theirRate,
      markupPercent: sub.markupPercent,
      fte: sub.fte,
      rateSource: sub.rateSource || 'quote',
      quoteDate: sub.quoteDate || '',
      quoteReference: sub.quoteReference || '',
      years: { ...sub.years },
    })
    setFormErrors({})
    setIsPanelOpen(true)
  }

  const closePanel = () => {
    setIsPanelOpen(false)
    setEditingId(null)
    setFormData(emptyFormData)
    setFormErrors({})
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.companyName.trim()) {
      errors.companyName = 'Company name is required'
    }
    if (!formData.role.trim()) {
      errors.role = 'Role is required'
    }
    if (formData.theirRate <= 0) {
      errors.theirRate = 'Rate must be greater than 0'
    }
    if (formData.markupPercent < 0) {
      errors.markupPercent = 'Markup cannot be negative'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) return

    const billedRate = formData.theirRate * (1 + formData.markupPercent / 100)

    if (editingId) {
      // Update existing
      updateSubcontractor(editingId, {
        companyName: formData.companyName,
        role: formData.role,
        laborCategory: formData.laborCategory,
        theirRate: formData.theirRate,
        markupPercent: formData.markupPercent,
        billedRate,
        fte: formData.fte,
        rateSource: formData.rateSource,
        quoteDate: formData.quoteDate,
        quoteReference: formData.quoteReference,
        years: formData.years,
      })
    } else {
      // Add new
      addSubcontractor({
        id: `sub-${Date.now()}`,
        companyName: formData.companyName,
        role: formData.role,
        laborCategory: formData.laborCategory,
        theirRate: formData.theirRate,
        markupPercent: formData.markupPercent,
        billedRate,
        fte: formData.fte,
        rateSource: formData.rateSource,
        quoteDate: formData.quoteDate,
        quoteReference: formData.quoteReference,
        years: formData.years,
      })
    }

    closePanel()
  }

  const handleDelete = (id: string) => {
    removeSubcontractor(id)
  }

  // ==================== RENDER ====================
  return (
    <TooltipProvider>
      <div className="flex gap-6">
        {/* Left Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="sticky top-6">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Subcontractors</h2>
              <p className="text-xs text-gray-600">
                Manage your teaming partners
              </p>
            </div>

            {/* Quick Stats */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">Companies</span>
                <span className="text-sm font-semibold text-gray-900">{uniqueCompanies.length}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">Total FTE</span>
                <span className="text-sm font-semibold text-gray-900">{totalFTE.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-lg">
                <span className="text-xs text-green-700">Avg Markup</span>
                <span className="text-sm font-semibold text-green-700">{avgMarkup.toFixed(1)}%</span>
              </div>
            </div>

            {/* Cost Summary - Collapsible */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
              <button
                onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                className="w-full px-3 py-2.5 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-sm text-gray-900">Cost Summary</span>
                </div>
                {showCostBreakdown ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              {showCostBreakdown && (
                <div className="p-3 border-t border-gray-200 space-y-2">
                  {solicitation.periodOfPerformance.baseYear && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Base Year:</span>
                      <span className="font-medium">{formatCurrencyCompact(yearCosts.base)}</span>
                    </div>
                  )}
                  {solicitation.periodOfPerformance.optionYears >= 1 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Option 1:</span>
                      <span className="font-medium">{formatCurrencyCompact(yearCosts.option1)}</span>
                    </div>
                  )}
                  {solicitation.periodOfPerformance.optionYears >= 2 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Option 2:</span>
                      <span className="font-medium">{formatCurrencyCompact(yearCosts.option2)}</span>
                    </div>
                  )}
                  {solicitation.periodOfPerformance.optionYears >= 3 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Option 3:</span>
                      <span className="font-medium">{formatCurrencyCompact(yearCosts.option3)}</span>
                    </div>
                  )}
                  {solicitation.periodOfPerformance.optionYears >= 4 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Option 4:</span>
                      <span className="font-medium">{formatCurrencyCompact(yearCosts.option4)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-gray-900">Total:</span>
                      <span className="font-bold text-blue-600">{formatCurrencyCompact(totalSubCost)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Markup Revenue Card */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-900">Your Markup Revenue</span>
              </div>
              <p className="text-xl font-bold text-green-700 mb-1">
                {formatCurrencyCompact(totalMarkupRevenue)}
              </p>
              <p className="text-[10px] text-green-700">
                Over {contractYears} year{contractYears !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-900 mb-1">Markup Guidance</p>
                  <p className="text-xs text-blue-800">
                    Industry standard is 10-20% markup on subcontractor rates. This is your revenue from teaming.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Header with Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Subcontractor Team</h3>
              <p className="text-sm text-gray-600">
                {subcontractors.length} subcontractor{subcontractors.length !== 1 ? 's' : ''} • {totalFTE.toFixed(2)} FTE
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={openAddPanel}>
                <Plus className="w-4 h-4 mr-2" />
                Add Subcontractor
              </Button>
              {onContinue && (
                <Button variant="outline" onClick={onContinue}>
                  Continue to Export →
                </Button>
              )}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by company, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Company Name</SelectItem>
                <SelectItem value="rate">Billed Rate</SelectItem>
                <SelectItem value="cost">Annual Cost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subcontractor Cards Grid */}
          {filteredSubcontractors.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                {searchQuery ? 'No subcontractors match your search' : 'No subcontractors added yet'}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {searchQuery ? 'Try a different search term' : 'Add teaming partners to your proposal'}
              </p>
              {!searchQuery && (
                <Button variant="outline" size="sm" onClick={openAddPanel}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subcontractor
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredSubcontractors.map(sub => {
                const markupAmount = sub.theirRate * (sub.markupPercent / 100)
                const annualCost = sub.billedRate * companyPolicy.standardHours * sub.fte
                const activeYears = [
                  sub.years.base && 'Base',
                  sub.years.option1 && 'Opt 1',
                  sub.years.option2 && 'Opt 2',
                  sub.years.option3 && 'Opt 3',
                  sub.years.option4 && 'Opt 4',
                ].filter(Boolean)

                return (
                  <div
                    key={sub.id}
                    className="group border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all cursor-pointer bg-white"
                    onClick={() => openEditPanel(sub.id)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 mb-1 leading-tight">
                          {sub.companyName}
                        </h4>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                            {sub.role}
                          </Badge>
                          <span className="text-[10px] text-gray-500">{sub.fte} FTE</span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); openEditPanel(sub.id); }}
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleDelete(sub.id); }}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Rate Info */}
                    <div className="space-y-1.5 text-xs mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Their Rate:</span>
                        <span className="font-medium text-gray-700">${sub.theirRate.toFixed(2)}/hr</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Markup:</span>
                        <span className="font-medium text-green-600">+{sub.markupPercent}% (+${markupAmount.toFixed(2)})</span>
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                        <span className="text-gray-500">Billed Rate:</span>
                        <span className="font-semibold text-blue-600">${sub.billedRate.toFixed(2)}/hr</span>
                      </div>
                    </div>

                    {/* Year Badges */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {activeYears.map((year, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                          {year}
                        </Badge>
                      ))}
                    </div>

                    {/* Annual Cost */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">Annual Cost</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrencyCompact(annualCost)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Slide-out Panel */}
        {isPanelOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/20 z-40"
              onClick={closePanel}
            />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-50 animate-in slide-in-from-right">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingId ? 'Edit Subcontractor' : 'Add Subcontractor'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {editingId ? 'Update subcontractor details' : 'Enter subcontractor information'}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={closePanel}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                {/* Company Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    Company Information
                  </h4>
                  
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">
                        Role <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="role"
                        placeholder="e.g., Senior Developer"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className={formErrors.role ? 'border-red-500' : ''}
                      />
                      {formErrors.role && (
                        <p className="text-xs text-red-500">{formErrors.role}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="laborCategory">Labor Category</Label>
                      <Input
                        id="laborCategory"
                        placeholder="e.g., Software Developer III"
                        value={formData.laborCategory}
                        onChange={(e) => setFormData({ ...formData, laborCategory: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Rate Information */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    Rate Information
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="theirRate">
                        Their Rate ($/hr) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="theirRate"
                        type="number"
                        step="0.01"
                        placeholder="150.00"
                        value={formData.theirRate}
                        onChange={(e) => setFormData({ ...formData, theirRate: parseFloat(e.target.value) || 0 })}
                        className={formErrors.theirRate ? 'border-red-500' : ''}
                      />
                      {formErrors.theirRate && (
                        <p className="text-xs text-red-500">{formErrors.theirRate}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="markupPercent">
                        Your Markup (%)
                      </Label>
                      <Input
                        id="markupPercent"
                        type="number"
                        step="0.1"
                        placeholder="15"
                        value={formData.markupPercent}
                        onChange={(e) => setFormData({ ...formData, markupPercent: parseFloat(e.target.value) || 0 })}
                        className={formErrors.markupPercent ? 'border-red-500' : ''}
                      />
                      {formErrors.markupPercent && (
                        <p className="text-xs text-red-500">{formErrors.markupPercent}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fte">FTE Allocation</Label>
                    <Select 
                      value={formData.fte.toString()} 
                      onValueChange={(v) => setFormData({ ...formData, fte: parseFloat(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.25">0.25 FTE (Quarter Time)</SelectItem>
                        <SelectItem value="0.5">0.5 FTE (Half Time)</SelectItem>
                        <SelectItem value="0.75">0.75 FTE (Three Quarter)</SelectItem>
                        <SelectItem value="1">1.0 FTE (Full Time)</SelectItem>
                        <SelectItem value="2">2.0 FTE</SelectItem>
                        <SelectItem value="3">3.0 FTE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rate Preview */}
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Their Rate:</span>
                      <span className="font-medium">${formData.theirRate.toFixed(2)}/hr</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Your Markup ({formData.markupPercent}%):</span>
                      <span className="font-medium text-green-600">
                        +${(formData.theirRate * (formData.markupPercent / 100)).toFixed(2)}/hr
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                      <span className="font-semibold">Billed to Customer:</span>
                      <span className="font-bold text-blue-600">
                        ${(formData.theirRate * (1 + formData.markupPercent / 100)).toFixed(2)}/hr
                      </span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-gray-200 text-gray-500">
                      <span>Annual Cost ({formData.fte} FTE):</span>
                      <span className="font-medium">
                        {formatCurrency(formData.theirRate * (1 + formData.markupPercent / 100) * companyPolicy.standardHours * formData.fte)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Years */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-900">Active Contract Years</h4>
                  
                  <div className="space-y-2">
                    {solicitation.periodOfPerformance.baseYear && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="year-base"
                          checked={formData.years.base}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, years: { ...formData.years, base: checked as boolean } })
                          }
                        />
                        <Label htmlFor="year-base" className="text-sm font-normal cursor-pointer">
                          Base Year
                        </Label>
                      </div>
                    )}
                    {solicitation.periodOfPerformance.optionYears >= 1 && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="year-opt1"
                          checked={formData.years.option1}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, years: { ...formData.years, option1: checked as boolean } })
                          }
                        />
                        <Label htmlFor="year-opt1" className="text-sm font-normal cursor-pointer">
                          Option Year 1
                        </Label>
                      </div>
                    )}
                    {solicitation.periodOfPerformance.optionYears >= 2 && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="year-opt2"
                          checked={formData.years.option2}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, years: { ...formData.years, option2: checked as boolean } })
                          }
                        />
                        <Label htmlFor="year-opt2" className="text-sm font-normal cursor-pointer">
                          Option Year 2
                        </Label>
                      </div>
                    )}
                    {solicitation.periodOfPerformance.optionYears >= 3 && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="year-opt3"
                          checked={formData.years.option3}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, years: { ...formData.years, option3: checked as boolean } })
                          }
                        />
                        <Label htmlFor="year-opt3" className="text-sm font-normal cursor-pointer">
                          Option Year 3
                        </Label>
                      </div>
                    )}
                    {solicitation.periodOfPerformance.optionYears >= 4 && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="year-opt4"
                          checked={formData.years.option4}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, years: { ...formData.years, option4: checked as boolean } })
                          }
                        />
                        <Label htmlFor="year-opt4" className="text-sm font-normal cursor-pointer">
                          Option Year 4
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audit Trail (Advanced) */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    Rate Documentation
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">Optional documentation for audit purposes</p>
                      </TooltipContent>
                    </Tooltip>
                  </h4>

                  <div className="space-y-2">
                    <Label htmlFor="rateSource">Rate Source</Label>
                    <Select 
                      value={formData.rateSource} 
                      onValueChange={(v) => setFormData({ ...formData, rateSource: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quote">Quote</SelectItem>
                        <SelectItem value="prior-agreement">Prior Agreement</SelectItem>
                        <SelectItem value="gsa-schedule">GSA Schedule</SelectItem>
                        <SelectItem value="market-research">Market Research</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quoteDate">Quote Date</Label>
                      <Input
                        id="quoteDate"
                        type="date"
                        value={formData.quoteDate}
                        onChange={(e) => setFormData({ ...formData, quoteDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quoteReference">Reference #</Label>
                      <Input
                        id="quoteReference"
                        placeholder="e.g., Q-2024-001"
                        value={formData.quoteReference}
                        onChange={(e) => setFormData({ ...formData, quoteReference: e.target.value })}
                      />
                    </div>
                  </div>
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
                      Add Subcontractor
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

export default SubcontractorsTab