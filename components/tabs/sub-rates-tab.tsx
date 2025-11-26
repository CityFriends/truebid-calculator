'use client'

import { useState } from 'react'
import { useAppContext } from '@/contexts/app-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Shield, AlertTriangle, CheckCircle, XCircle, Calculator, Info, TrendingDown, TrendingUp, DollarSign, Users, Pencil, Clock, Calendar } from 'lucide-react'

// Prime offer interface with year-by-year breakdown
interface YearBreakdown {
  year: number
  salary: number
  loadedRate: number
  offeredRate: number
  hourlyMargin: number
  annualProfit: number
  isProfitable: boolean
}

interface PrimeOffer {
  id: string
  primeName: string
  roleTitle: string
  roleId: string
  level: string
  levelIndex: number
  levelName: string
  startingStep: number
  startingStepIndex: number
  startingSalary: number
  contractYears: number
  hoursPerYear: number
  offeredRate: number
  yearBreakdowns: YearBreakdown[]
  totalProfit: number
  avgMarginPercent: number
  isProfitable: boolean
}

// Currency formatter
const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatCurrencyShort = (amount: number): string => {
  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(0)}k`
  }
  return `$${amount.toFixed(0)}`
}

export function SubRatesTab() {
  const {
    companyRoles,
    calculateLoadedRate,
    calculateYearSalaries,
    costMultipliers,
    profitMargin,
    companyPolicy
  } = useAppContext()

  // Prime offers state
  const [primeOffers, setPrimeOffers] = useState<PrimeOffer[]>([])

  // Add offer dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newPrimeName, setNewPrimeName] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [selectedLevelIndex, setSelectedLevelIndex] = useState<number | null>(null)
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)
  const [contractYears, setContractYears] = useState<number>(3)
  const [hoursPerYear, setHoursPerYear] = useState<number>(1880)
  const [newOfferedRate, setNewOfferedRate] = useState<number>(150)

  // Edit offer dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<PrimeOffer | null>(null)
  const [editPrimeName, setEditPrimeName] = useState('')
  const [editRoleId, setEditRoleId] = useState('')
  const [editLevelIndex, setEditLevelIndex] = useState<number | null>(null)
  const [editStepIndex, setEditStepIndex] = useState<number | null>(null)
  const [editContractYears, setEditContractYears] = useState<number>(3)
  const [editHoursPerYear, setEditHoursPerYear] = useState<number>(1880)
  const [editOfferedRate, setEditOfferedRate] = useState<number>(150)

  // Get selected role data
  const selectedRole = companyRoles.find(r => r.id === selectedRoleId)
  const selectedLevel = selectedLevelIndex !== null ? selectedRole?.levels[selectedLevelIndex] : null
  const selectedStep = selectedStepIndex !== null ? selectedLevel?.steps[selectedStepIndex] : null

  // Calculate year-by-year breakdown
  const calculateYearBreakdowns = (
    roleId: string,
    levelIndex: number,
    stepIndex: number,
    years: number,
    offeredRate: number,
    hoursPerYr: number
  ): YearBreakdown[] => {
    const role = companyRoles.find(r => r.id === roleId)
    if (!role) return []

    const yearSalaries = calculateYearSalaries(role, levelIndex, stepIndex, years)
    
    return yearSalaries.map((salary, index) => {
      const loadedRate = calculateLoadedRate(salary, true)
      const hourlyMargin = offeredRate - loadedRate
      const annualProfit = hourlyMargin * hoursPerYr
      
      return {
        year: index + 1,
        salary,
        loadedRate,
        offeredRate,
        hourlyMargin,
        annualProfit,
        isProfitable: hourlyMargin >= 0
      }
    })
  }

  const handleAddOffer = () => {
    if (!newPrimeName.trim() || !selectedRole || selectedLevelIndex === null || selectedStepIndex === null) return

    const yearBreakdowns = calculateYearBreakdowns(
      selectedRoleId,
      selectedLevelIndex,
      selectedStepIndex,
      contractYears,
      newOfferedRate,
      hoursPerYear
    )

    const totalProfit = yearBreakdowns.reduce((sum, yb) => sum + yb.annualProfit, 0)
    const avgLoadedRate = yearBreakdowns.reduce((sum, yb) => sum + yb.loadedRate, 0) / yearBreakdowns.length
    const avgMarginPercent = ((newOfferedRate - avgLoadedRate) / avgLoadedRate) * 100

    const newOffer: PrimeOffer = {
      id: `prime-${Date.now()}`,
      primeName: newPrimeName,
      roleTitle: selectedRole.title,
      roleId: selectedRoleId,
      level: selectedLevel!.level,
      levelIndex: selectedLevelIndex,
      levelName: selectedLevel!.levelName,
      startingStep: selectedStep!.step,
      startingStepIndex: selectedStepIndex,
      startingSalary: selectedStep!.salary,
      contractYears,
      hoursPerYear,
      offeredRate: newOfferedRate,
      yearBreakdowns,
      totalProfit,
      avgMarginPercent,
      isProfitable: totalProfit >= 0
    }

    setPrimeOffers([...primeOffers, newOffer])
    
    // Reset form
    setNewPrimeName('')
    setSelectedRoleId('')
    setSelectedLevelIndex(null)
    setSelectedStepIndex(null)
    setContractYears(3)
    setHoursPerYear(1880)
    setNewOfferedRate(150)
    setIsAddDialogOpen(false)
  }

  const openEditDialog = (offer: PrimeOffer) => {
    setEditingOffer(offer)
    setEditPrimeName(offer.primeName)
    setEditRoleId(offer.roleId)
    setEditLevelIndex(offer.levelIndex)
    setEditStepIndex(offer.startingStepIndex)
    setEditContractYears(offer.contractYears)
    setEditHoursPerYear(offer.hoursPerYear)
    setEditOfferedRate(offer.offeredRate)
    setIsEditDialogOpen(true)
  }

  const handleEditOffer = () => {
    if (!editingOffer || editLevelIndex === null || editStepIndex === null) return

    const role = companyRoles.find(r => r.id === editRoleId)
    if (!role) return

    const level = role.levels[editLevelIndex]
    const step = level?.steps[editStepIndex]
    if (!level || !step) return

    const yearBreakdowns = calculateYearBreakdowns(
      editRoleId,
      editLevelIndex,
      editStepIndex,
      editContractYears,
      editOfferedRate,
      editHoursPerYear
    )

    const totalProfit = yearBreakdowns.reduce((sum, yb) => sum + yb.annualProfit, 0)
    const avgLoadedRate = yearBreakdowns.reduce((sum, yb) => sum + yb.loadedRate, 0) / yearBreakdowns.length
    const avgMarginPercent = ((editOfferedRate - avgLoadedRate) / avgLoadedRate) * 100

    setPrimeOffers(primeOffers.map(o => 
      o.id === editingOffer.id 
        ? {
            ...o,
            primeName: editPrimeName,
            roleId: editRoleId,
            roleTitle: role.title,
            level: level.level,
            levelIndex: editLevelIndex,
            levelName: level.levelName,
            startingStep: step.step,
            startingStepIndex: editStepIndex,
            startingSalary: step.salary,
            contractYears: editContractYears,
            hoursPerYear: editHoursPerYear,
            offeredRate: editOfferedRate,
            yearBreakdowns,
            totalProfit,
            avgMarginPercent,
            isProfitable: totalProfit >= 0
          }
        : o
    ))

    setIsEditDialogOpen(false)
    setEditingOffer(null)
  }

  const removeOffer = (id: string) => {
    setPrimeOffers(primeOffers.filter(o => o.id !== id))
  }

  // Calculate summary stats
  const profitableCount = primeOffers.filter(o => o.isProfitable).length
  const unprofitableCount = primeOffers.filter(o => !o.isProfitable).length
  const totalProfitAllOffers = primeOffers.reduce((sum, o) => sum + o.totalProfit, 0)

  // Get preview data for add dialog
  const getPreview = () => {
    if (!selectedRole || selectedLevelIndex === null || selectedStepIndex === null) return null
    
    const yearBreakdowns = calculateYearBreakdowns(
      selectedRoleId,
      selectedLevelIndex,
      selectedStepIndex,
      contractYears,
      newOfferedRate,
      hoursPerYear
    )
    
    if (yearBreakdowns.length === 0) return null

    const totalProfit = yearBreakdowns.reduce((sum, yb) => sum + yb.annualProfit, 0)
    const avgLoadedRate = yearBreakdowns.reduce((sum, yb) => sum + yb.loadedRate, 0) / yearBreakdowns.length
    const avgMarginPercent = ((newOfferedRate - avgLoadedRate) / avgLoadedRate) * 100

    return {
      yearBreakdowns,
      totalProfit,
      avgMarginPercent,
      isProfitable: totalProfit >= 0
    }
  }

  const preview = getPreview()

  // Group company roles by labor category for display
  const rolesByCategory = companyRoles.reduce((acc, role) => {
    if (!acc[role.laborCategory]) {
      acc[role.laborCategory] = []
    }
    acc[role.laborCategory].push(role)
    return acc
  }, {} as Record<string, typeof companyRoles>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-gray-900">Sub Rates</h2>
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
              Utility Tool
            </Badge>
          </div>
          <p className="text-gray-600">Validate prime contractor offers with step increase projections</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900 mb-1">When You're the Subcontractor</p>
            <p className="text-sm text-amber-800">
              Compare the prime's offered rate against your fully-loaded costs (calculated using 2,080 hours — your PTO, 
              holidays, and sick leave are captured in fringe). Hours offered affects total revenue and utilization risk.
            </p>
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Add Prime Offer */}
        <div className="col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Analyze Prime Offer</CardTitle>
              <CardDescription>Select role, level, step & contract duration</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Prime Offer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Analyze Prime Contractor Offer</DialogTitle>
                    <DialogDescription>
                      Select role, level, and starting step to see year-by-year profitability
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Prime Contractor Name</Label>
                      <Input
                        value={newPrimeName}
                        onChange={(e) => setNewPrimeName(e.target.value)}
                        placeholder="e.g. Lockheed Martin"
                      />
                    </div>
                    
                    <div>
                      <Label>Your Role</Label>
                      <Select 
                        value={selectedRoleId} 
                        onValueChange={(v) => {
                          setSelectedRoleId(v)
                          setSelectedLevelIndex(null)
                          setSelectedStepIndex(null)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {companyRoles.map(role => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedRole && (
                      <div>
                        <Label>Level</Label>
                        <Select 
                          value={selectedLevelIndex?.toString() ?? ''} 
                          onValueChange={(v) => {
                            setSelectedLevelIndex(parseInt(v))
                            setSelectedStepIndex(null)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedRole.levels.map((level, index) => (
                              <SelectItem key={level.level} value={index.toString()}>
                                {level.level} - {level.levelName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedLevel && (
                      <div>
                        <Label>Starting Step</Label>
                        <Select 
                          value={selectedStepIndex?.toString() ?? ''} 
                          onValueChange={(v) => setSelectedStepIndex(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select starting step" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedLevel.steps.map((step, index) => (
                              <SelectItem key={step.step} value={index.toString()}>
                                Step {step.step} - {formatCurrency(step.salary)}
                                {step.monthsToNextStep && ` (${step.monthsToNextStep}mo to next)`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Contract Years</Label>
                        <Select 
                          value={contractYears.toString()} 
                          onValueChange={(v) => setContractYears(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(y => (
                              <SelectItem key={y} value={y.toString()}>
                                {y} Year{y > 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Hours Offered/Year</Label>
                        <Input
                          type="number"
                          value={hoursPerYear}
                          onChange={(e) => setHoursPerYear(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Hours presets */}
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: '1 FTE (1,920)', value: 1920 },
                        { label: '1 FTE (1,880)', value: 1880 },
                        { label: '0.5 FTE (960)', value: 960 },
                        { label: 'Max (2,080)', value: 2080 },
                      ].map(preset => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setHoursPerYear(preset.value)}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${
                            hoursPerYear === preset.value
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div>
                      <Label>Prime's Offered Rate ($/hr)</Label>
                      <Input
                        type="number"
                        value={newOfferedRate}
                        onChange={(e) => setNewOfferedRate(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    {/* Year-by-Year Preview */}
                    {preview && (
                      <div className={`p-4 rounded-lg space-y-3 ${preview.isProfitable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {preview.isProfitable ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className={`font-semibold ${preview.isProfitable ? 'text-green-800' : 'text-red-800'}`}>
                              {preview.isProfitable ? 'Profitable' : 'Unprofitable'}
                            </span>
                          </div>
                          <span className={`text-lg font-bold ${preview.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                            {preview.isProfitable ? '+' : ''}{formatCurrency(preview.totalProfit)}
                          </span>
                        </div>
                        
                        {/* Year breakdown table */}
                        <div className="border rounded overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-2 py-1 text-left">Year</th>
                                <th className="px-2 py-1 text-right">Salary</th>
                                <th className="px-2 py-1 text-right">Your Rate</th>
                                <th className="px-2 py-1 text-right">Profit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {preview.yearBreakdowns.map(yb => (
                                <tr key={yb.year} className={yb.isProfitable ? '' : 'bg-red-50'}>
                                  <td className="px-2 py-1 font-medium">Year {yb.year}</td>
                                  <td className="px-2 py-1 text-right">{formatCurrencyShort(yb.salary)}</td>
                                  <td className="px-2 py-1 text-right">${yb.loadedRate.toFixed(2)}</td>
                                  <td className={`px-2 py-1 text-right font-medium ${yb.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                                    {yb.isProfitable ? '+' : ''}{formatCurrencyShort(yb.annualProfit)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <p className="text-xs text-gray-600">
                          Avg margin: {preview.avgMarginPercent >= 0 ? '+' : ''}{preview.avgMarginPercent.toFixed(1)}%
                        </p>

                        {/* Utilization note in preview */}
                        {hoursPerYear < 2080 && (
                          <p className="text-xs text-blue-700 mt-2">
                            ℹ️ {hoursPerYear.toLocaleString()} hrs = {((hoursPerYear / 2080) * 100).toFixed(0)}% utilization
                          </p>
                        )}
                      </div>
                    )}

                    <Button 
                      onClick={handleAddOffer} 
                      className="w-full"
                      disabled={!newPrimeName.trim() || !selectedRole || selectedLevelIndex === null || selectedStepIndex === null}
                    >
                      Add Analysis
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Quick Stats */}
              <div className="mt-6 space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Offers Analyzed</span>
                    <span className="text-lg font-bold text-gray-900">{primeOffers.length}</span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-700">Profitable</span>
                    <span className="text-lg font-bold text-green-600">{profitableCount}</span>
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-red-700">Unprofitable</span>
                    <span className="text-lg font-bold text-red-600">{unprofitableCount}</span>
                  </div>
                </div>
              </div>

              {/* Rate Structure Reference */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-2">Your Rate Structure</p>
                <div className="space-y-1 text-xs text-blue-800">
                  <div className="flex justify-between">
                    <span>Fringe:</span>
                    <span>{(costMultipliers.fringe * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overhead:</span>
                    <span>{(costMultipliers.overhead * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>G&A:</span>
                    <span>{(costMultipliers.ga * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-blue-200">
                    <span>Profit Margin:</span>
                    <span>{profitMargin}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MIDDLE: Prime Offer Analysis */}
        <div className="col-span-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Prime Offer Analysis
              </CardTitle>
              <CardDescription>
                {primeOffers.length} offers • Year-by-year breakdown with step increases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {primeOffers.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">No prime offers analyzed yet</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Analyze Your First Offer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {primeOffers.map(offer => (
                    <div 
                      key={offer.id} 
                      className={`p-4 border rounded-lg ${offer.isProfitable ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{offer.primeName}</h4>
                            <Badge 
                              variant={offer.isProfitable ? 'default' : 'destructive'}
                              className={offer.isProfitable ? 'bg-green-600' : ''}
                            >
                              {offer.isProfitable ? 'Profitable' : 'Loss'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {offer.roleTitle} • {offer.level} {offer.levelName}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>Starting: Step {offer.startingStep} @ {formatCurrencyShort(offer.startingSalary)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {offer.contractYears} yr{offer.contractYears > 1 ? 's' : ''}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {offer.hoursPerYear.toLocaleString()} hrs/yr
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                            onClick={() => openEditDialog(offer)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeOffer(offer.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Year-by-Year Table */}
                      <div className="border rounded overflow-hidden mb-3">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-2 py-1.5 text-left">Year</th>
                              <th className="px-2 py-1.5 text-right">Salary</th>
                              <th className="px-2 py-1.5 text-right">Your Rate</th>
                              <th className="px-2 py-1.5 text-right">Prime</th>
                              <th className="px-2 py-1.5 text-right">P/L ({(offer.hoursPerYear / 1000).toFixed(1)}k hrs)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {offer.yearBreakdowns.map(yb => (
                              <tr key={yb.year} className={yb.isProfitable ? 'bg-white' : 'bg-red-50'}>
                                <td className="px-2 py-1.5 font-medium">Year {yb.year}</td>
                                <td className="px-2 py-1.5 text-right text-gray-600">{formatCurrencyShort(yb.salary)}</td>
                                <td className="px-2 py-1.5 text-right">${yb.loadedRate.toFixed(2)}</td>
                                <td className="px-2 py-1.5 text-right">${yb.offeredRate.toFixed(2)}</td>
                                <td className={`px-2 py-1.5 text-right font-medium ${yb.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                                  {yb.isProfitable ? '+' : ''}{formatCurrencyShort(yb.annualProfit)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Total Impact */}
                      <div className={`p-3 rounded-lg ${offer.isProfitable ? 'bg-green-100' : 'bg-red-100'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-gray-600">Total Contract Profit/Loss</p>
                            <p className="text-xs text-gray-500">
                              Avg margin: {offer.avgMarginPercent >= 0 ? '+' : ''}{offer.avgMarginPercent.toFixed(1)}%
                            </p>
                          </div>
                          <p className={`text-xl font-bold ${offer.isProfitable ? 'text-green-700' : 'text-red-700'}`}>
                            {offer.isProfitable ? '+' : ''}{formatCurrency(offer.totalProfit)}
                          </p>
                        </div>
                      </div>

                      {/* Warning for unprofitable years */}
                      {offer.yearBreakdowns.some(yb => !yb.isProfitable) && (
                        <div className="mt-3 p-2 bg-amber-100 rounded flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-800">
                            {offer.yearBreakdowns.filter(yb => !yb.isProfitable).length} of {offer.contractYears} years 
                            are unprofitable due to step increases raising your costs.
                          </p>
                        </div>
                      )}

                      {/* Utilization warning for partial FTE */}
                      {offer.hoursPerYear < 2080 && (
                        <div className="mt-3 p-2 bg-blue-100 rounded flex items-start gap-2">
                          <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-800">
                            Prime is offering {offer.hoursPerYear.toLocaleString()} hours/year — this covers <strong>{((offer.hoursPerYear / 2080) * 100).toFixed(0)}%</strong> of 
                            a full-time employee. {offer.hoursPerYear < 1040 
                              ? "You'll need significant other work to fill the gap." 
                              : "Ensure you have other work to maintain full utilization."}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Summary */}
        <div className="col-span-3 space-y-6">
          {/* Profitability Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {primeOffers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Add prime offers to see analysis
                </p>
              ) : (
                <>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Profitable Offers</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {profitableCount}/{primeOffers.length}
                    </p>
                  </div>

                  <div className={`text-center p-4 rounded-lg ${totalProfitAllOffers >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className={`text-sm mb-2 ${totalProfitAllOffers >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      Total Potential Profit
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {totalProfitAllOffers >= 0 ? (
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      )}
                      <p className={`text-2xl font-bold ${totalProfitAllOffers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalProfitAllOffers >= 0 ? '+' : ''}{formatCurrency(totalProfitAllOffers)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Company Role Library Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Your Rate Card
              </CardTitle>
              <CardDescription className="text-xs">{companyRoles.length} roles with step increases</CardDescription>
            </CardHeader>
            <CardContent className="max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {companyRoles.slice(0, 5).map(role => (
                  <div key={role.id} className="text-xs p-2 bg-gray-50 rounded">
                    <span className="font-medium text-gray-900">{role.title}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {role.levels.map(level => (
                        <span key={level.level} className="text-gray-500">
                          {level.level}: ${(level.steps[0].salary / 1000).toFixed(0)}k+
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Rate & Utilization Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Your loaded rate uses 2,080 hrs — PTO/holidays are in fringe</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Step increases typically add ~3% annually to your costs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>&lt;2,080 hrs means partial utilization — you need other work</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Request escalation clauses for multi-year contracts</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Prime Offer</DialogTitle>
            <DialogDescription>
              Update all offer details
            </DialogDescription>
          </DialogHeader>
          {editingOffer && (
            <div className="space-y-4">
              <div>
                <Label>Prime Contractor Name</Label>
                <Input
                  value={editPrimeName}
                  onChange={(e) => setEditPrimeName(e.target.value)}
                />
              </div>

              <div>
                <Label>Role</Label>
                <Select 
                  value={editRoleId} 
                  onValueChange={(v) => {
                    setEditRoleId(v)
                    setEditLevelIndex(null)
                    setEditStepIndex(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyRoles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editRoleId && (
                <div>
                  <Label>Level</Label>
                  <Select 
                    value={editLevelIndex?.toString() ?? ''} 
                    onValueChange={(v) => {
                      setEditLevelIndex(parseInt(v))
                      setEditStepIndex(null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {companyRoles.find(r => r.id === editRoleId)?.levels.map((level, index) => (
                        <SelectItem key={level.level} value={index.toString()}>
                          {level.level} - {level.levelName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editLevelIndex !== null && editRoleId && (
                <div>
                  <Label>Starting Step</Label>
                  <Select 
                    value={editStepIndex?.toString() ?? ''} 
                    onValueChange={(v) => setEditStepIndex(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select step" />
                    </SelectTrigger>
                    <SelectContent>
                      {companyRoles.find(r => r.id === editRoleId)?.levels[editLevelIndex]?.steps.map((step, index) => (
                        <SelectItem key={step.step} value={index.toString()}>
                          Step {step.step} - {formatCurrency(step.salary)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Contract Years</Label>
                  <Select 
                    value={editContractYears.toString()} 
                    onValueChange={(v) => setEditContractYears(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(y => (
                        <SelectItem key={y} value={y.toString()}>
                          {y} Year{y > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hours Offered/Year</Label>
                  <Input
                    type="number"
                    value={editHoursPerYear}
                    onChange={(e) => setEditHoursPerYear(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Hours presets */}
              <div className="flex flex-wrap gap-1">
                {[
                  { label: '1 FTE (1,920)', value: 1920 },
                  { label: '1 FTE (1,880)', value: 1880 },
                  { label: '0.5 FTE (960)', value: 960 },
                  { label: 'Max (2,080)', value: 2080 },
                ].map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setEditHoursPerYear(preset.value)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      editHoursPerYear === preset.value
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div>
                <Label>Prime's Offered Rate ($/hr)</Label>
                <Input
                  type="number"
                  value={editOfferedRate}
                  onChange={(e) => setEditOfferedRate(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditOffer} 
                  className="flex-1"
                  disabled={editLevelIndex === null || editStepIndex === null}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}