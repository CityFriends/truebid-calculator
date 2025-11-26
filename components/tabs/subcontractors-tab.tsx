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
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Trash2, Building2, DollarSign, TrendingUp, Calculator, Info } from 'lucide-react'

interface SubcontractorsTabProps {
  onContinue?: () => void
}

// Currency formatter
const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function SubcontractorsTab({ onContinue }: SubcontractorsTabProps) {
  const {
    subcontractors,
    addSubcontractor,
    removeSubcontractor,
    updateSubcontractor,
    annualEscalation
  } = useAppContext()

  // Add subcontractor dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSubName, setNewSubName] = useState('')
  const [newSubRole, setNewSubRole] = useState('')
  const [newSubRate, setNewSubRate] = useState<number>(150)
  const [newSubMarkup, setNewSubMarkup] = useState<number>(15)

  // Edit subcontractor dialog
  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleAddSubcontractor = () => {
    if (!newSubName.trim() || !newSubRole.trim()) return

    const billedRate = newSubRate * (1 + newSubMarkup / 100)
    
    const newSub = {
      id: `sub-${Date.now()}`,
      companyName: newSubName,
      role: newSubRole,
      theirRate: newSubRate,
      markupPercent: newSubMarkup,
      billedRate: billedRate,
      fte: 1.0,
      years: {
        base: true,
        option1: true,
        option2: true
      }
    }

    addSubcontractor(newSub)
    
    // Reset form
    setNewSubName('')
    setNewSubRole('')
    setNewSubRate(150)
    setNewSubMarkup(15)
    setIsAddDialogOpen(false)
  }

  const openEditDialog = (subId: string) => {
    setEditingSubId(subId)
    setIsEditDialogOpen(true)
  }

  // Calculate costs
  const calculateSubYearCost = (year: 'base' | 'option1' | 'option2') => {
    let total = 0
    subcontractors.forEach(sub => {
      if (sub.years[year]) {
        const annualCost = sub.billedRate * 2080 * sub.fte
        total += annualCost
      }
    })
    return total
  }

  const baseYearCost = calculateSubYearCost('base')
  const optionYear1Cost = calculateSubYearCost('option1') * (1 + annualEscalation / 100)
  const optionYear2Cost = calculateSubYearCost('option2') * Math.pow(1 + annualEscalation / 100, 2)
  const totalSubCost = baseYearCost + optionYear1Cost + optionYear2Cost

  // Calculate total markup revenue (what you make)
  const calculateMarkupRevenue = () => {
    let total = 0
    subcontractors.forEach(sub => {
      const markupAmount = sub.theirRate * (sub.markupPercent / 100)
      const annualMarkup = markupAmount * 2080 * sub.fte
      
      // Apply to active years
      if (sub.years.base) total += annualMarkup
      if (sub.years.option1) total += annualMarkup * (1 + annualEscalation / 100)
      if (sub.years.option2) total += annualMarkup * Math.pow(1 + annualEscalation / 100, 2)
    })
    return total
  }

  const totalMarkupRevenue = calculateMarkupRevenue()

  // Calculate total FTE
  const totalFTE = subcontractors.reduce((sum, sub) => sum + sub.fte, 0)

  // Calculate average markup
  const avgMarkup = subcontractors.length > 0
    ? subcontractors.reduce((sum, sub) => sum + sub.markupPercent, 0) / subcontractors.length
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Subcontractors</h2>
          <p className="text-gray-600">Manage subcontractor team and markup calculations</p>
        </div>
        
        <div className="flex items-center gap-4">
          {onContinue && (
            <Button onClick={onContinue}>
              Continue to Prime Check →
            </Button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Subcontractor Markup</p>
            <p className="text-sm text-blue-800">
              Your markup is the percentage added to the subcontractor's base rate. Industry standard is 10-20%. 
              This becomes your revenue from subcontractor labor.
            </p>
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Add Subcontractor (30%) */}
        <div className="col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Add Subcontractor</CardTitle>
              <CardDescription>Define company and role details</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subcontractor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Subcontractor</DialogTitle>
                    <DialogDescription>
                      Enter subcontractor company information and rates
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sub-company">Company Name</Label>
                      <Input
                        id="sub-company"
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        placeholder="e.g. Acme Consulting LLC"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sub-role">Labor Category / Role</Label>
                      <Input
                        id="sub-role"
                        value={newSubRole}
                        onChange={(e) => setNewSubRole(e.target.value)}
                        placeholder="e.g. Senior Developer"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sub-rate">Their Rate ($/hr)</Label>
                        <Input
                          id="sub-rate"
                          type="number"
                          value={newSubRate}
                          onChange={(e) => setNewSubRate(parseFloat(e.target.value))}
                          placeholder="150"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sub-markup">Your Markup (%)</Label>
                        <Input
                          id="sub-markup"
                          type="number"
                          value={newSubMarkup}
                          onChange={(e) => setNewSubMarkup(parseFloat(e.target.value))}
                          placeholder="15"
                        />
                      </div>
                    </div>
                    
                    {/* Rate Preview */}
                    <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Their Rate:</span>
                        <span className="font-medium">${newSubRate.toFixed(2)}/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Your Markup ({newSubMarkup}%):</span>
                        <span className="font-medium text-green-600">
                          +${(newSubRate * (newSubMarkup / 100)).toFixed(2)}/hr
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="font-semibold">Billed to Customer:</span>
                        <span className="font-bold text-blue-600">
                          ${(newSubRate * (1 + newSubMarkup / 100)).toFixed(2)}/hr
                        </span>
                      </div>
                    </div>

                    <Button onClick={handleAddSubcontractor} className="w-full">
                      Add Subcontractor
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Quick Stats */}
              <div className="mt-6 space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Total Subcontractors</span>
                    <span className="text-lg font-bold text-gray-900">{subcontractors.length}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Total FTE</span>
                    <span className="text-lg font-bold text-gray-900">{totalFTE.toFixed(2)}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Avg Markup</span>
                    <span className="text-lg font-bold text-green-600">{avgMarkup.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MIDDLE: Subcontractor List (35%) */}
        <div className="col-span-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Subcontractor Team
              </CardTitle>
              <CardDescription>
                {subcontractors.length} companies • {totalFTE.toFixed(2)} FTE
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subcontractors.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">No subcontractors added yet</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Subcontractor
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {subcontractors.map(sub => {
                    const markupAmount = sub.theirRate * (sub.markupPercent / 100)
                    const annualCost = sub.billedRate * 2080 * sub.fte

                    return (
                      <div key={sub.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{sub.companyName}</h4>
                              <Badge variant="outline" className="text-xs">{sub.role}</Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                              <div>
                                <span className="text-gray-500">Base:</span>
                                <span className="ml-1 font-medium">${sub.theirRate}/hr</span>
                              </div>
                              <span>•</span>
                              <div>
                                <span className="text-gray-500">Markup:</span>
                                <span className="ml-1 font-medium text-green-600">{sub.markupPercent}%</span>
                              </div>
                              <span>•</span>
                              <div>
                                <span className="text-gray-500">Billed:</span>
                                <span className="ml-1 font-medium text-blue-600">
                                  ${sub.billedRate.toFixed(2)}/hr
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              <span className="text-gray-500">FTE:</span>
                              <span className="font-medium">{sub.fte}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-500">Annual:</span>
                              <span className="font-medium">{formatCurrency(annualCost)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => openEditDialog(sub.id)}
                                  >
                                    <Calculator className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit details</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeSubcontractor(sub.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Year Badges */}
                        <div className="flex items-center gap-2">
                          {sub.years.base && <Badge variant="secondary" className="text-xs">Base</Badge>}
                          {sub.years.option1 && <Badge variant="secondary" className="text-xs">Opt 1</Badge>}
                          {sub.years.option2 && <Badge variant="secondary" className="text-xs">Opt 2</Badge>}
                        </div>

                        {/* Your Markup Revenue */}
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Your Markup Revenue:</span>
                            <span className="font-semibold text-green-600">
                              +${markupAmount.toFixed(2)}/hr
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Cost Summary (30%) */}
        <div className="col-span-3 space-y-6">
          {/* Total Cost Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Subcontractor Costs
              </CardTitle>
              <CardDescription>
                Multi-year with {annualEscalation}% escalation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Year:</span>
                  <span className="font-medium">{formatCurrency(baseYearCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Option Year 1:</span>
                  <span className="font-medium">{formatCurrency(optionYear1Cost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Option Year 2:</span>
                  <span className="font-medium">{formatCurrency(optionYear2Cost)}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Total (3 years):</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalSubCost)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Amount billed to customer
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Markup Revenue Card */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Your Markup Revenue
              </CardTitle>
              <CardDescription className="text-green-800">
                What you earn from subcontractors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {formatCurrency(totalMarkupRevenue)}
                </p>
                <p className="text-xs text-green-800">
                  Total markup over 3 years
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-green-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-800">Avg Markup:</span>
                  <span className="font-semibold text-green-900">{avgMarkup.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-800">Per Year (avg):</span>
                  <span className="font-semibold text-green-900">
                    {formatCurrency(totalMarkupRevenue / 3)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {subcontractors.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No subcontractors to show
                </p>
              ) : (
                subcontractors.map(sub => {
                  const baseAnnual = sub.billedRate * 2080 * sub.fte
                  let threeYearTotal = 0
                  if (sub.years.base) threeYearTotal += baseAnnual
                  if (sub.years.option1) threeYearTotal += baseAnnual * (1 + annualEscalation / 100)
                  if (sub.years.option2) threeYearTotal += baseAnnual * Math.pow(1 + annualEscalation / 100, 2)

                  return (
                    <div key={sub.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate flex-1">
                        {sub.companyName}
                      </span>
                      <span className="font-medium ml-2">
                        {formatCurrency(threeYearTotal)}
                      </span>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      {editingSubId && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subcontractor</DialogTitle>
              <DialogDescription>
                Update subcontractor details and active years
              </DialogDescription>
            </DialogHeader>
            <EditSubcontractorForm
              subcontractor={subcontractors.find(s => s.id === editingSubId)!}
              onUpdate={updateSubcontractor}
              onClose={() => {
                setIsEditDialogOpen(false)
                setEditingSubId(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Edit Subcontractor Form Component
function EditSubcontractorForm({
  subcontractor,
  onUpdate,
  onClose
}: {
  subcontractor: any
  onUpdate: (id: string, updates: any) => void
  onClose: () => void
}) {
  const [companyName, setCompanyName] = useState(subcontractor.companyName)
  const [role, setRole] = useState(subcontractor.role)
  const [theirRate, setTheirRate] = useState(subcontractor.theirRate)
  const [markupPercent, setMarkupPercent] = useState(subcontractor.markupPercent)
  const [fte, setFte] = useState(subcontractor.fte)
  const [years, setYears] = useState(subcontractor.years)

  const handleSave = () => {
    const billedRate = theirRate * (1 + markupPercent / 100)
    
    onUpdate(subcontractor.id, {
      companyName,
      role,
      theirRate,
      markupPercent,
      billedRate,
      fte,
      years
    })
    onClose()
  }

  const billedRate = theirRate * (1 + markupPercent / 100)

  return (
    <div className="space-y-4">
      <div>
        <Label>Company Name</Label>
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </div>
      
      <div>
        <Label>Labor Category / Role</Label>
        <Input
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Their Rate ($/hr)</Label>
          <Input
            type="number"
            value={theirRate}
            onChange={(e) => setTheirRate(parseFloat(e.target.value))}
          />
        </div>
        <div>
          <Label>Your Markup (%)</Label>
          <Input
            type="number"
            value={markupPercent}
            onChange={(e) => setMarkupPercent(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div>
        <Label>FTE Allocation</Label>
        <Select value={fte.toString()} onValueChange={(v) => setFte(parseFloat(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.25">0.25 FTE</SelectItem>
            <SelectItem value="0.5">0.5 FTE</SelectItem>
            <SelectItem value="0.75">0.75 FTE</SelectItem>
            <SelectItem value="1">1.0 FTE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rate Preview */}
      <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Their Rate:</span>
          <span className="font-medium">${theirRate.toFixed(2)}/hr</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Your Markup ({markupPercent}%):</span>
          <span className="font-medium text-green-600">
            +${(theirRate * (markupPercent / 100)).toFixed(2)}/hr
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="font-semibold">Billed to Customer:</span>
          <span className="font-bold text-blue-600">
            ${billedRate.toFixed(2)}/hr
          </span>
        </div>
      </div>

      {/* Active Years */}
      <div>
        <Label className="mb-2 block">Active Years</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={years.base}
              onCheckedChange={(checked) => setYears({ ...years, base: checked as boolean })}
            />
            <Label className="font-normal cursor-pointer">Base Year</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={years.option1}
              onCheckedChange={(checked) => setYears({ ...years, option1: checked as boolean })}
            />
            <Label className="font-normal cursor-pointer">Option Year 1</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={years.option2}
              onCheckedChange={(checked) => setYears({ ...years, option2: checked as boolean })}
            />
            <Label className="font-normal cursor-pointer">Option Year 2</Label>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1">
          Save Changes
        </Button>
      </div>
    </div>
  )
}