'use client'

import { useState } from 'react'
import { useAppContext } from '@/contexts/app-context'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Calculator, Trash2, Users, DollarSign, Target, Plane, ShoppingBag, Coffee, MapPin } from 'lucide-react'

interface RoleAllocation {
  fte: 0.25 | 0.5 | 0.75 | 1.0
  baseYear: boolean
  optionYear1: boolean
  optionYear2: boolean
}

interface RolesAndPricingTabProps {
  onContinue?: () => void
}

// Currency formatter
const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function RolesAndPricingTab({ onContinue }: RolesAndPricingTabProps) {
  const {
    contractType,          
    setContractType,
    recommendedRoles,
    selectedRoles,
    addRole,
    removeRole,
    updateRole,
    profitMargin,
    setProfitMargin,
    annualEscalation,
    setAnnualEscalation,
    calculateLoadedRate,
    companyPolicy,
    odcs,
    addODC,
    removeODC,
    perDiem,
    addPerDiem,
    removePerDiem,
    subcontractors
  } = useAppContext()

  // FTE allocations per role (TODO: Move to context in Phase 8)
  const [roleAllocations, setRoleAllocations] = useState<Record<string, RoleAllocation>>({})

  // Budget tracking
  const [targetBudget, setTargetBudget] = useState<number>(0)
  const [showBudgetInput, setShowBudgetInput] = useState(false)

  // Custom role dialog
  const [isCustomRoleOpen, setIsCustomRoleOpen] = useState(false)
  const [customRoleTitle, setCustomRoleTitle] = useState('')
  const [customRoleIC, setCustomRoleIC] = useState<'IC3' | 'IC4' | 'IC5'>('IC4')

  // Rate breakdown modal state
  const [selectedRoleForBreakdown, setSelectedRoleForBreakdown] = useState<string | null>(null)

  const handleAddRole = (role: typeof recommendedRoles[0]) => {
    addRole(role)
    
    // Initialize allocation for this role
    setRoleAllocations(prev => ({
      ...prev,
      [role.id]: {
        fte: 1.0,
        baseYear: true,
        optionYear1: true,
        optionYear2: true
      }
    }))
  }

  const handleAddCustomRole = () => {
    if (!customRoleTitle.trim()) return

    const newRole = {
      id: `custom-${Date.now()}`,
      name: customRoleTitle,
      title: customRoleTitle,
      icLevel: customRoleIC,
      quantity: 1,
      isKeyPersonnel: false,
      confidence: 'medium' as const,
      storyPoints: 0,
      description: `Custom ${customRoleTitle} position`,
      isCustom: true,
      baseSalary: customRoleIC === 'IC5' ? 175000 : customRoleIC === 'IC4' ? 135000 : 105000,
      fte: 1.0,
      years: { base: true, option1: true, option2: true },
      loadedRate: 0,
      annualCost: 0,
      billableHours: 2080
    }

    addRole(newRole)
    
    setRoleAllocations(prev => ({
      ...prev,
      [newRole.id]: {
        fte: 1.0,
        baseYear: true,
        optionYear1: true,
        optionYear2: true
      }
    }))

    setCustomRoleTitle('')
    setIsCustomRoleOpen(false)
  }

  const handleUpdateAllocation = (roleId: string, updates: Partial<RoleAllocation>) => {
    setRoleAllocations(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        ...updates
      }
    }))
  }

  // Calculate contract values by year
  const calculateYearCost = (year: 'baseYear' | 'optionYear1' | 'optionYear2') => {
    let total = 0
    selectedRoles.forEach(role => {
      const allocation = roleAllocations[role.id]
      if (allocation && allocation[year]) {
        const fte = allocation.fte
        const cost = (role.annualCost || 0) * fte
        total += cost
      }
    })
    return total
  }

  const baseYearCost = calculateYearCost('baseYear')
  const optionYear1Cost = calculateYearCost('optionYear1') * (1 + annualEscalation / 100)
  const optionYear2Cost = calculateYearCost('optionYear2') * Math.pow(1 + annualEscalation / 100, 2)
  const totalContract = baseYearCost + optionYear1Cost + optionYear2Cost

  // Calculate total ODCs and Per Diem
  const totalODCs = odcs.reduce((sum, item) => sum + item.totalCost, 0)
  const totalPerDiem = perDiem.reduce((sum, pd) => sum + pd.totalCost, 0)
  
  // Calculate total Subcontractor costs
  const calculateSubcontractorCosts = () => {
    let baseYear = 0
    let option1 = 0
    let option2 = 0
    
    subcontractors.forEach(sub => {
      const annualCost = sub.billedRate * 2080 * sub.fte
      if (sub.years.base) baseYear += annualCost
      if (sub.years.option1) option1 += annualCost
      if (sub.years.option2) option2 += annualCost
    })
    
    const option1WithEscalation = option1 * (1 + annualEscalation / 100)
    const option2WithEscalation = option2 * Math.pow(1 + annualEscalation / 100, 2)
    
    return baseYear + option1WithEscalation + option2WithEscalation
  }
  
  const totalSubcontractors = calculateSubcontractorCosts()
  const grandTotal = totalContract + totalODCs + totalPerDiem + totalSubcontractors

  // Calculate total FTE
  const totalFTE = selectedRoles.reduce((sum, role) => {
    const allocation = roleAllocations[role.id]
    return sum + (allocation ? allocation.fte * role.quantity : 0)
  }, 0)

  // Scenario calculations
  const scenarios = [
    { name: 'Base', hours: 1808, description: 'Full PTO (18 days)' },
    { name: 'Standard+', hours: 1880, description: 'Less PTO (10 days)' },
    { name: 'High', hours: 1912, description: 'Key Personnel (5 days)' },
    { name: 'Maximum', hours: 1920, description: 'Minimum PTO (2 weeks)' }
  ]

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Roles & Pricing</h2>
          <p className="text-gray-600">Build your team and analyze project costs</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* CONTRACT TYPE TOGGLE */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border">
            <Label className="text-sm font-medium">Contract Type:</Label>
            <ToggleGroup
              type="single"
              value={contractType}
              onValueChange={(value) => {
                if (value) setContractType(value as 'tm' | 'ffp');
              }}
              className="gap-0"
            >
              <ToggleGroupItem
                value="tm"
                className="px-4 data-[state=on]:bg-blue-600 data-[state=on]:text-white"
              >
                T&M
              </ToggleGroupItem>
              <ToggleGroupItem
                value="ffp"
                className="px-4 data-[state=on]:bg-blue-600 data-[state=on]:text-white"
              >
                FFP
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="profit-margin" className="text-sm">Profit Margin</Label>
            <Input
              id="profit-margin"
              type="number"
              step="0.1"
              value={profitMargin}
              onChange={(e) => setProfitMargin(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="annual-escalation"
              checked={true}
            />
            <Label htmlFor="annual-escalation" className="text-sm">Annual Escalation</Label>
            <Input
              type="number"
              step="0.1"
              value={annualEscalation}
              onChange={(e) => setAnnualEscalation(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>

          {onContinue && (
            <Button onClick={onContinue}>
              Continue to Rate Justification →
            </Button>
          )}
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Recommended Roles (30%) */}
        <div className="col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recommended Roles</CardTitle>
              <CardDescription>AI-generated from RFP analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Summary */}
                <div className="flex items-center justify-between text-sm pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{recommendedRoles.length} FTE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {recommendedRoles.reduce((sum, r) => sum + r.storyPoints, 0)} Story Points
                    </span>
                  </div>
                </div>

                {/* Roles List */}
                {recommendedRoles.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Upload an RFP to see recommended roles
                  </p>
                ) : (
                  recommendedRoles.map(role => {
                    const isAdded = selectedRoles.some(r => r.id === role.id)
                    
                    return (
                      <div key={role.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                            {role.isKeyPersonnel && (
                             <span className="text-yellow-500">⭐</span>
                             )}
                            <h4 className="font-medium text-sm">{role.title || role.name}</h4>
                            </div>
                            <p className="text-xs text-gray-600">{role.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-gray-500">IC Level:</span>
                            <Badge variant="outline" className="ml-1">{role.icLevel}</Badge>
                          </div>
                          <div>
                            <span className="text-gray-500">Qty:</span>
                            <span className="ml-1 font-medium">{role.quantity}</span>
                          </div>
                          <div>
                            <Badge 
                              variant={role.confidence === 'high' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {role.confidence === 'high' ? 'High' : role.confidence === 'medium' ? 'Medium' : 'Low'}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-gray-500">{role.storyPoints} SP</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleAddRole(role)}
                          disabled={isAdded}
                          size="sm"
                          className={`w-full ${isAdded ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}`}
                          variant={isAdded ? "default" : "default"}
                        >
                          {isAdded ? '✓ Added' : 'Add to Team'}
                        </Button>
                      </div>
                    )
                  })
                )}

                {/* Add Custom Role */}
                <Dialog open={isCustomRoleOpen} onOpenChange={setIsCustomRoleOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Custom Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Custom Role</DialogTitle>
                      <DialogDescription>
                        Create a custom role for your team
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="role-title">Role Title</Label>
                        <Input
                          id="role-title"
                          value={customRoleTitle}
                          onChange={(e) => setCustomRoleTitle(e.target.value)}
                          placeholder="e.g. Product Manager"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ic-level">IC Level</Label>
                        <Select value={customRoleIC} onValueChange={(v: any) => setCustomRoleIC(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IC3">IC3</SelectItem>
                            <SelectItem value="IC4">IC4</SelectItem>
                            <SelectItem value="IC5">IC5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddCustomRole} className="w-full">
                        Add Role
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MIDDLE: Team Summary (35%) */}
        <div className="col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Summary
              </CardTitle>
              <CardDescription>
                {totalFTE.toFixed(2)} FTE • {selectedRoles.length} roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedRoles.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Add roles from the left to build your team
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedRoles.map(role => {
                    const allocation = roleAllocations[role.id] || { fte: 1.0, baseYear: true, optionYear1: true, optionYear2: true }
                    
                    return (
                      <div key={role.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {role.isKeyPersonnel && (
                                <span className="text-yellow-500">⭐</span>
                              )}
                              <h4 className="font-medium text-sm">{role.title || role.name}</h4>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="outline" className="text-xs">{role.icLevel}</Badge>
                              <span className="text-xs text-gray-600">×{role.quantity}</span>
                              <span className="text-xs text-gray-600">•</span>
                              <span className="text-xs text-gray-600">{allocation.fte} FTE</span>
                              <span className="text-xs text-gray-600">•</span>
                              <span className="text-xs font-medium">{formatCurrency(role.loadedRate || 0)}/hr</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setSelectedRoleForBreakdown(role.id)}
                                >
                                  <Calculator className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-xl">
                                <DialogHeader>
                                  <DialogTitle>{role.title || role.name} - Rate Breakdown</DialogTitle>
                                  <DialogDescription>
                                    Detailed cost calculation and settings
                                  </DialogDescription>
                                </DialogHeader>
                                <RateBreakdownModal 
                                  role={role} 
                                  allocation={allocation}
                                  onUpdateRole={updateRole}
                                  onUpdateAllocation={handleUpdateAllocation}
                                />
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeRole(role.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Year Badges */}
                        <div className="flex items-center gap-2">
                          {allocation.baseYear && <Badge variant="secondary" className="text-xs">Base</Badge>}
                          {allocation.optionYear1 && <Badge variant="secondary" className="text-xs">Opt 1</Badge>}
                          {allocation.optionYear2 && <Badge variant="secondary" className="text-xs">Opt 2</Badge>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Contract Value (35%) */}
        <div className="col-span-4 space-y-6">
          {/* Contract Value Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Contract Value
              </CardTitle>
              <CardDescription>
                Multi-year pricing with {annualEscalation}% annual escalation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Year:</span>
                  <span className="font-medium">{formatCurrency(baseYearCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Option Year 1: (+{annualEscalation}%)</span>
                  <span className="font-medium">{formatCurrency(optionYear1Cost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Option Year 2: (+{(annualEscalation * 2).toFixed(1)}%)</span>
                  <span className="font-medium">{formatCurrency(optionYear2Cost)}</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Direct Labor (3 years):</span>
                  <span className="font-medium">{formatCurrency(totalContract)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subcontractors (3 years):</span>
                  <span className="font-medium">{formatCurrency(totalSubcontractors)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ODCs:</span>
                  <span className="font-medium">{formatCurrency(totalODCs)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Per Diem:</span>
                  <span className="font-medium">{formatCurrency(totalPerDiem)}</span>
                </div>
                <div className="pt-2 border-t flex justify-between">
                  <span className="font-semibold">Grand Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget & Scenarios Card */}
          <Card>
            <Tabs defaultValue="budget">
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="budget">Budget</TabsTrigger>
                  <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="budget" className="mt-0 space-y-4">
                  {/* Budget Target */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Budget Target</h4>
                      {!showBudgetInput && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBudgetInput(true)}
                          className="h-7 text-xs"
                        >
                          {targetBudget > 0 ? 'Edit' : 'Set Budget'}
                        </Button>
                      )}
                    </div>
                    
                    {showBudgetInput ? (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Enter budget"
                          value={targetBudget || ''}
                          onChange={(e) => setTargetBudget(parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                        <Button
                          size="sm"
                          onClick={() => setShowBudgetInput(false)}
                          className="h-9"
                        >
                          Save
                        </Button>
                      </div>
                    ) : targetBudget > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Target:</span>
                          <span className="font-medium">{formatCurrency(targetBudget)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Current:</span>
                          <span className="font-medium">{formatCurrency(baseYearCost)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={baseYearCost > targetBudget ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                            {baseYearCost > targetBudget ? 'Over Budget:' : 'Remaining:'}
                          </span>
                          <span className={baseYearCost > targetBudget ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                            {formatCurrency(Math.abs(targetBudget - baseYearCost))}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              baseYearCost > targetBudget ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min((baseYearCost / targetBudget) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No budget set</p>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Team Breakdown</h4>
                    <div className="space-y-2">
                      {selectedRoles.map(role => {
                        const allocation = roleAllocations[role.id] || { fte: 1.0, baseYear: true, optionYear1: true, optionYear2: true }
                        const roleCost = allocation.baseYear ? (role.annualCost || 0) * allocation.fte : 0
                        
                        return (
                          <div key={role.id} className="flex justify-between text-sm">
                            <span className="text-gray-600 truncate flex-1">
                            {role.title || role.name} ({(allocation.fte * role.quantity).toFixed(2)} FTE)
                            </span>
                            <span className="font-medium ml-2">{formatCurrency(roleCost)}</span>
                          </div>
                        )
                      })}
                      {selectedRoles.length === 0 && (
                        <p className="text-sm text-gray-500">No roles added yet</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <h4 className="text-sm font-medium">Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total FTE:</span>
                        <span className="font-medium">{totalFTE.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Base Year:</span>
                        <span className="font-medium">{formatCurrency(baseYearCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Rate:</span>
                        <span className="font-medium">
                          {selectedRoles.length > 0 
                            ? `${formatCurrency(selectedRoles.reduce((sum, r) => sum + (r.loadedRate || 0), 0) / selectedRoles.length)}/hr`
                            : '$0.00/hr'}
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="scenarios" className="mt-0 space-y-2">
                  <TooltipProvider>
                    {scenarios.map(scenario => {
                      const scenarioCost = selectedRoles.reduce((sum, role) => {
                        const allocation = roleAllocations[role.id]
                        if (!allocation || !allocation.baseYear) return sum
                        
                        const loadedRate = calculateLoadedRate(role.baseSalary, scenario.hours)
                        const cost = loadedRate * scenario.hours * role.quantity * allocation.fte
                        return sum + cost
                      }, 0)

                      return (
                        <Tooltip key={scenario.name}>
                          <TooltipTrigger asChild>
                            <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-help">
                              <div>
                                <p className="text-sm font-medium">{scenario.name}</p>
                                <p className="text-xs text-gray-500">{scenario.hours} hrs</p>
                              </div>
                              <span className="text-sm font-medium">{formatCurrency(scenarioCost)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{scenario.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </TooltipProvider>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* ODCs & Per Diem Section - Full Width */}
      <div className="space-y-6">
        {/* ODCs Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Other Direct Costs (ODCs)</CardTitle>
                <CardDescription>Travel, materials, equipment, and other project costs</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add ODC Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {odcs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No ODC items added yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {odcs.map((item) => {
                  const categoryIcons = {
                    travel: Plane,
                    materials: ShoppingBag,
                    equipment: Coffee,
                    other: DollarSign
                  }
                  const CategoryIcon = categoryIcons[item.category]
                  const categoryColors = {
                    travel: 'bg-blue-50 text-blue-600',
                    materials: 'bg-purple-50 text-purple-600',
                    equipment: 'bg-green-50 text-green-600',
                    other: 'bg-gray-50 text-gray-600'
                  }

                  return (
                    <Card key={item.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryColors[item.category]}`}>
                            <CategoryIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                              <span>Qty: {item.quantity}</span>
                              <span>•</span>
                              <span>${item.unitCost.toFixed(2)} each</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(item.totalCost)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-600"
                                onClick={() => removeODC(item.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Total ODCs */}
            {odcs.length > 0 && (
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total ODCs:</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(totalODCs)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per Diem Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              GSA Per Diem Calculator
            </CardTitle>
            <CardDescription>Calculate travel per diem costs by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Location</Label>
                <Input placeholder="Washington, DC" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Number of Days</Label>
                <Input type="number" placeholder="3" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Number of People</Label>
                <Input type="number" placeholder="2" />
              </div>
            </div>
            <Button variant="outline" className="w-full md:w-auto">
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Per Diem
            </Button>

            {/* Per Diem Results */}
            {perDiem.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Calculated Per Diem</h4>
                {perDiem.map((pd, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pd.location}</p>
                      <p className="text-xs text-gray-600">
                        {pd.numberOfDays} days × {pd.numberOfPeople} people × ${pd.ratePerDay}/day
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(pd.totalCost)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600"
                        onClick={() => removePerDiem(index)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Per Diem:</span>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(totalPerDiem)}</span>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-600 text-center">
              <a 
                href="https://www.gsa.gov/travel/plan-book/per-diem-rates" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                View GSA Per Diem Rates →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Rate Breakdown Modal Component
function RateBreakdownModal({ 
  role, 
  allocation,
  onUpdateRole,
  onUpdateAllocation 
}: { 
  role: any
  allocation: RoleAllocation
  onUpdateRole: (roleId: string, updates: any) => void
  onUpdateAllocation: (roleId: string, updates: Partial<RoleAllocation>) => void
}) {
  const { costMultipliers, profitMargin } = useAppContext()

  const baseRate = role.baseSalary / 2080
  const afterFringe = baseRate * (1 + costMultipliers.fringe)
  const afterOverhead = afterFringe * (1 + costMultipliers.overhead)
  const afterGA = afterOverhead * (1 + costMultipliers.ga)
  const loadedRate = afterGA * (1 + profitMargin / 100)

  return (
    <div className="space-y-6">
      {/* Rate Calculation Breakdown */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Rate Calculation</h4>
        <div className="space-y-2 bg-gray-50 p-4 rounded-lg text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Base Salary ÷ 2080 hours:</span>
            <span className="font-mono">${baseRate.toFixed(2)}/hr</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">+ Fringe (45%):</span>
            <span className="font-mono">${afterFringe.toFixed(2)}/hr</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">+ Overhead (30%):</span>
            <span className="font-mono">${afterOverhead.toFixed(2)}/hr</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">+ G&A (5%):</span>
            <span className="font-mono">${afterGA.toFixed(2)}/hr</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="font-medium">Loaded Rate (with {profitMargin}% profit):</span>
            <span className="font-mono font-bold text-blue-600">${loadedRate.toFixed(2)}/hr</span>
          </div>
        </div>
      </div>

      {/* Edit Controls */}
      <div className="space-y-4 pt-4 border-t">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">IC Level</Label>
            <Select 
              value={role.icLevel} 
              onValueChange={(v) => onUpdateRole(role.id, { icLevel: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IC3">IC3 - Junior Level</SelectItem>
                <SelectItem value="IC4">IC4 - Senior Level</SelectItem>
                <SelectItem value="IC5">IC5 - Principal Level</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={role.quantity}
                onChange={(e) => onUpdateRole(role.id, { quantity: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Hours/Year</Label>
              <Input
                type="number"
                value={role.billableHours || 2080}
                onChange={(e) => onUpdateRole(role.id, { billableHours: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Base Salary</Label>
            <Input
              type="number"
              value={role.baseSalary}
              onChange={(e) => onUpdateRole(role.id, { baseSalary: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">FTE Allocation</Label>
            <Select 
              value={allocation.fte.toString()} 
              onValueChange={(v) => onUpdateAllocation(role.id, { fte: parseFloat(v) as any })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.25">0.25 FTE (Quarter Time)</SelectItem>
                <SelectItem value="0.5">0.5 FTE (Half Time)</SelectItem>
                <SelectItem value="0.75">0.75 FTE (Three Quarter Time)</SelectItem>
                <SelectItem value="1">1.0 FTE (Full Time)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Years</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${role.id}-base`}
                  checked={allocation.baseYear}
                  onCheckedChange={(checked) => onUpdateAllocation(role.id, { baseYear: checked as boolean })}
                />
                <Label htmlFor={`${role.id}-base`} className="text-sm font-normal cursor-pointer">
                  Base Year
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${role.id}-opt1`}
                  checked={allocation.optionYear1}
                  onCheckedChange={(checked) => onUpdateAllocation(role.id, { optionYear1: checked as boolean })}
                />
                <Label htmlFor={`${role.id}-opt1`} className="text-sm font-normal cursor-pointer">
                  Option Year 1
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${role.id}-opt2`}
                  checked={allocation.optionYear2}
                  onCheckedChange={(checked) => onUpdateAllocation(role.id, { optionYear2: checked as boolean })}
                />
                <Label htmlFor={`${role.id}-opt2`} className="text-sm font-normal cursor-pointer">
                  Option Year 2
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}