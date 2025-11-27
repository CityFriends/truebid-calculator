'use client'

import { useState, useMemo } from 'react'
import { useAppContext, Subcontractor, ODCItem, PerDiemCalculation, Role } from '@/contexts/app-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Users,
  Plus,
  Check,
  Trash2,
  Calculator,
  Sparkles,
  DollarSign,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Settings2,
  Plane,
  Package,
  Pencil,
  MapPin,
  CheckCircle2,
  HelpCircle,
  Building2,
} from 'lucide-react'

// ==================== LOCAL TYPES ====================

interface RecommendedRole {
  id: string
  title: string
  description: string
  icLevel: string
  quantity: number
  storyPoints: number
  priority: 'high' | 'medium' | 'low'
  isKey?: boolean
}

interface TeamRole {
  id: string
  title: string
  icLevel: string
  quantity: number
  ftePerPerson: number
  baseSalary: number
  hourlyRate: number
  hoursPerYear: number
  years: string[]
}

interface RateBreakdown {
  baseSalary: number
  directRate: number
  fringeAmount: number
  overheadAmount: number
  gaAmount: number
  fullyLoadedRate: number
  profitAmount: number
  billedRate: number
}

// ==================== HELPER FUNCTIONS ====================

// Convert AppContext year object to string array
const yearsObjectToArray = (years: { base: boolean; option1: boolean; option2: boolean; option3: boolean; option4: boolean }): string[] => {
  const result: string[] = []
  if (years.base) result.push('base')
  if (years.option1) result.push('option1')
  if (years.option2) result.push('option2')
  if (years.option3) result.push('option3')
  if (years.option4) result.push('option4')
  return result
}

// Convert string array to AppContext year object
const yearsArrayToObject = (years: string[]): { base: boolean; option1: boolean; option2: boolean; option3: boolean; option4: boolean } => ({
  base: years.includes('base'),
  option1: years.includes('option1'),
  option2: years.includes('option2'),
  option3: years.includes('option3'),
  option4: years.includes('option4'),
})

// ODC Category labels
const odcCategoryLabels: Record<string, string> = {
  'travel': 'Travel',
  'materials': 'Materials',
  'equipment': 'Equipment',
  'software': 'Software',
  'other': 'Other',
}

// IC Level to base salary mapping
const icLevelRates: Record<string, number> = {
  'IC2': 75000,
  'IC3': 95000,
  'IC4': 120000,
  'IC5': 150000,
  'IC6': 180000,
}

const icLevelOptions = ['IC2', 'IC3', 'IC4', 'IC5', 'IC6']
const fteOptions = [0.25, 0.5, 0.75, 1.0]

// Mock recommended roles from AI analysis
const mockRecommendedRoles: RecommendedRole[] = [
  { id: 'rec-1', title: 'Technical Lead', description: 'Technical Lead position', icLevel: 'IC5', quantity: 1, storyPoints: 45, priority: 'high', isKey: true },
  { id: 'rec-2', title: 'Senior Software Engineer', description: 'Senior Software Engineer position', icLevel: 'IC4', quantity: 3, storyPoints: 120, priority: 'high' },
  { id: 'rec-3', title: 'DevOps Engineer', description: 'DevOps Engineer position', icLevel: 'IC4', quantity: 1, storyPoints: 35, priority: 'medium' },
  { id: 'rec-4', title: 'UX Designer', description: 'User Experience Designer', icLevel: 'IC3', quantity: 1, storyPoints: 25, priority: 'medium' },
  { id: 'rec-5', title: 'Business Analyst', description: 'Business Analyst position', icLevel: 'IC3', quantity: 1, storyPoints: 20, priority: 'low' },
]

// ==================== MAIN COMPONENT ====================

export function RolesAndPricingTab() {
  const {
    solicitation,
    companyPolicy,
    indirectRates,
    escalationRates,
    profitTargets,
    // Subcontractors from context
    subcontractors,
    addSubcontractor,
    updateSubcontractor,
    removeSubcontractor,
    // ODCs from context
    odcs,
    addODC,
    updateODC,
    removeODC,
    // Per Diem from context
    perDiem,
    addPerDiem,
    updatePerDiem,
    removePerDiem,
    // Selected Roles from context
    selectedRoles,
    setSelectedRoles,
    addRole,
    updateRole,
    removeRole,
  } = useAppContext()

  // ==================== DERIVED VALUES (needed early) ====================

  // Normalize indirect rates (handle decimal vs percentage)
  const normalizeRate = (rate: number | undefined, defaultVal: number): number => {
    if (rate === undefined) return defaultVal
    return rate < 1 ? rate * 100 : rate
  }
  
  const rates = {
    fringe: normalizeRate(indirectRates?.fringe, 21.16),
    overhead: normalizeRate(indirectRates?.overhead, 34.26),
    gAndA: normalizeRate(indirectRates?.ga, 19.83),
  }

  // ==================== LOCAL STATE ====================
  
  // Profit & Escalation controls (initialize from context)
  const [profitMargin, setProfitMargin] = useState(() => 
    profitTargets?.tmDefault ? profitTargets.tmDefault * 100 : 8
  )
  const [laborEscalation, setLaborEscalation] = useState(() => 
    escalationRates?.laborDefault ? escalationRates.laborDefault * 100 : 3
  )
  const [odcEscalation, setOdcEscalation] = useState(() => 
    escalationRates?.odcDefault ? escalationRates.odcDefault * 100 : 2
  )
  const [showEscalation, setShowEscalation] = useState(true)
  
  // Panel states
  const [selectedRoleForBreakdown, setSelectedRoleForBreakdown] = useState<TeamRole | null>(null)
  const [showSubsExpanded, setShowSubsExpanded] = useState(false)
  const [showOdcExpanded, setShowOdcExpanded] = useState(false)
  const [showTravelExpanded, setShowTravelExpanded] = useState(false)
  
  // Role edit dialog
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<TeamRole | null>(null)
  const [roleFormData, setRoleFormData] = useState({
    title: '',
    icLevel: 'IC4',
    quantity: 1,
    ftePerPerson: 1,
    baseSalary: 120000,
    hoursPerYear: 1920,
    years: [] as string[],
  })
  
  // ODC dialog
  const [odcDialogOpen, setOdcDialogOpen] = useState(false)
  const [editingOdc, setEditingOdc] = useState<ODCItem | null>(null)
  const [odcFormData, setOdcFormData] = useState({
    description: '',
    category: 'software' as ODCItem['category'],
    quantity: 1,
    unitCost: 0,
    years: [] as string[],
  })
  
  // Per Diem (Travel) dialog
  const [travelDialogOpen, setTravelDialogOpen] = useState(false)
  const [editingTravel, setEditingTravel] = useState<PerDiemCalculation | null>(null)
  const [travelFormData, setTravelFormData] = useState({
    location: '',
    ratePerDay: 0,
    numberOfDays: 1,
    numberOfPeople: 1,
    years: [] as string[],
  })
  
  // Subcontractor dialog
  const [subDialogOpen, setSubDialogOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<Subcontractor | null>(null)
  const [subFormData, setSubFormData] = useState({
    companyName: '',
    role: '',
    laborCategory: '',
    theirRate: 0,
    markupPercent: 10,
    fte: 1,
    years: [] as string[],
  })

  // ==================== DERIVED VALUES ====================
  
  // Static rate calculation (doesn't depend on state) - defined first so useMemo can use it
  const calculateRateBreakdownStatic = (
    baseSalary: number, 
    ratesObj: { fringe: number; overhead: number; gAndA: number },
    profit: number
  ): RateBreakdown => {
    const standardHours = 2080
    const directRate = baseSalary / standardHours
    const fringeAmount = directRate * (ratesObj.fringe / 100)
    const withFringe = directRate + fringeAmount
    const overheadAmount = withFringe * (ratesObj.overhead / 100)
    const withOverhead = withFringe + overheadAmount
    const gaAmount = withOverhead * (ratesObj.gAndA / 100)
    const fullyLoadedRate = withOverhead + gaAmount
    const profitAmount = fullyLoadedRate * (profit / 100)
    const billedRate = fullyLoadedRate + profitAmount
    return { baseSalary, directRate, fringeAmount, overheadAmount, gaAmount, fullyLoadedRate, profitAmount, billedRate }
  }
  
  // Convert AppContext Role to local TeamRole format for display
  const teamRoles: TeamRole[] = useMemo(() => {
    return selectedRoles.map(role => {
      const baseSalary = role.baseSalary || icLevelRates[role.icLevel] || 100000
      const breakdown = calculateRateBreakdownStatic(baseSalary, rates, profitMargin)
      return {
        id: role.id,
        title: role.name,
        icLevel: role.icLevel,
        quantity: role.quantity,
        ftePerPerson: role.fte,
        baseSalary,
        hourlyRate: breakdown.billedRate,
        hoursPerYear: role.billableHours || 1920,
        years: yearsObjectToArray(role.years),
      }
    })
  }, [selectedRoles, rates, profitMargin])

  // ==================== DERIVED VALUES ====================

  // Contract years from solicitation
  const contractYears = useMemo(() => {
    const years: { id: string; label: string; index: number }[] = []
    if (solicitation?.periodOfPerformance?.baseYear !== false) {
      years.push({ id: 'base', label: 'Base', index: 0 })
    }
    const optionYears = solicitation?.periodOfPerformance?.optionYears || 2
    for (let i = 1; i <= optionYears; i++) {
      years.push({ id: `option${i}`, label: `Opt ${i}`, index: i })
    }
    return years
  }, [solicitation])

  // ==================== CALCULATION FUNCTIONS ====================

  const calculateRateBreakdown = (baseSalary: number): RateBreakdown => {
    const standardHours = 2080 // Always use 2080 for rate calculation
    const directRate = baseSalary / standardHours
    
    const fringeAmount = directRate * (rates.fringe / 100)
    const withFringe = directRate + fringeAmount
    
    const overheadAmount = withFringe * (rates.overhead / 100)
    const withOverhead = withFringe + overheadAmount
    
    const gaAmount = withOverhead * (rates.gAndA / 100)
    const fullyLoadedRate = withOverhead + gaAmount
    
    const profitAmount = fullyLoadedRate * (profitMargin / 100)
    const billedRate = fullyLoadedRate + profitAmount
    
    return { baseSalary, directRate, fringeAmount, overheadAmount, gaAmount, fullyLoadedRate, profitAmount, billedRate }
  }

  const calculateHourlyRate = (icLevel: string, customSalary?: number): number => {
    const baseSalary = customSalary || icLevelRates[icLevel] || 100000
    return calculateRateBreakdown(baseSalary).billedRate
  }

  // Apply escalation multiplier for a given year index
  const getEscalationMultiplier = (yearIndex: number, escalationRate: number): number => {
    if (!showEscalation || yearIndex === 0) return 1
    return Math.pow(1 + escalationRate / 100, yearIndex)
  }

  // ==================== COST CALCULATIONS WITH ESCALATION ====================

  // Calculate subcontractor cost for a specific year
  const calculateSubYearCost = (sub: Subcontractor, yearIndex: number): number => {
    const baseCost = sub.theirRate * sub.fte * 1920 // Assuming 1920 billable hours
    const withMarkup = baseCost * (1 + sub.markupPercent / 100)
    const escalated = withMarkup * getEscalationMultiplier(yearIndex, laborEscalation)
    return escalated
  }

  // Calculate ODC cost for a specific year
  const calculateOdcYearCost = (odc: ODCItem, yearIndex: number): number => {
    // Use totalCost if available, otherwise calculate from quantity * unitCost
    const baseCost = odc.totalCost || (odc.quantity || 1) * (odc.unitCost || 0)
    const escalated = baseCost * getEscalationMultiplier(yearIndex, odcEscalation)
    return escalated
  }

  // Calculate per diem cost for a specific year
  const calculatePerDiemYearCost = (pd: PerDiemCalculation, yearIndex: number): number => {
    const baseCost = pd.ratePerDay * pd.numberOfDays * pd.numberOfPeople
    const escalated = baseCost * getEscalationMultiplier(yearIndex, odcEscalation)
    return escalated
  }

  // ==================== AGGREGATE CALCULATIONS ====================

  const calculations = useMemo(() => {
    const yearCosts: Record<string, { labor: number; subs: number; odcs: number; travel: number; total: number }> = {}
    
    // Helper function inside useMemo to ensure fresh closure
    const getEscMult = (yearIndex: number, rate: number): number => {
      if (!showEscalation || yearIndex === 0) return 1
      return Math.pow(1 + rate / 100, yearIndex)
    }
    
    contractYears.forEach((year) => {
      const laborEscMult = getEscMult(year.index, laborEscalation)
      const odcEscMult = getEscMult(year.index, odcEscalation)
      
      // Labor costs
      let laborTotal = 0
      teamRoles.forEach(role => {
        if (role.years.includes(year.id)) {
          const escalatedRate = role.hourlyRate * laborEscMult
          const annualCost = escalatedRate * role.hoursPerYear * role.quantity * role.ftePerPerson
          laborTotal += annualCost
        }
      })
      
      // Subcontractor costs
      let subsTotal = 0
      subcontractors.forEach(sub => {
        const subYears = yearsObjectToArray(sub.years)
        if (subYears.includes(year.id)) {
          const baseCost = sub.theirRate * sub.fte * 1920
          const withMarkup = baseCost * (1 + sub.markupPercent / 100)
          subsTotal += withMarkup * laborEscMult
        }
      })
      
      // ODC costs - calculate directly here
      let odcsTotal = 0
      odcs.forEach(odc => {
        const odcYears = yearsObjectToArray(odc.years)
        if (odcYears.includes(year.id)) {
          const baseCost = odc.totalCost || (odc.quantity || 1) * (odc.unitCost || 0)
          odcsTotal += baseCost * odcEscMult
        }
      })
      
      // Per Diem (Travel) costs - calculate directly here
      let travelTotal = 0
      perDiem.forEach(pd => {
        const pdYears = yearsObjectToArray(pd.years)
        if (pdYears.includes(year.id)) {
          const baseCost = pd.totalCost || pd.ratePerDay * pd.numberOfDays * pd.numberOfPeople
          travelTotal += baseCost * odcEscMult
        }
      })
      
      yearCosts[year.id] = {
        labor: laborTotal,
        subs: subsTotal,
        odcs: odcsTotal,
        travel: travelTotal,
        total: laborTotal + subsTotal + odcsTotal + travelTotal,
      }
    })
    
    const laborTotal = Object.values(yearCosts).reduce((sum, y) => sum + y.labor, 0)
    const subsTotal = Object.values(yearCosts).reduce((sum, y) => sum + y.subs, 0)
    const odcsTotal = Object.values(yearCosts).reduce((sum, y) => sum + y.odcs, 0)
    const travelTotal = Object.values(yearCosts).reduce((sum, y) => sum + y.travel, 0)
    const totalContract = laborTotal + subsTotal + odcsTotal + travelTotal
    
    const totalFTE = teamRoles.reduce((sum, r) => sum + (r.quantity * r.ftePerPerson), 0)
    const avgRate = teamRoles.length > 0
      ? teamRoles.reduce((sum, r) => sum + r.hourlyRate, 0) / teamRoles.length
      : 0
    
    return {
      yearCosts,
      laborTotal,
      subsTotal,
      odcsTotal,
      travelTotal,
      totalContract,
      totalFTE,
      avgRate,
      roleCount: teamRoles.length,
    }
  }, [teamRoles, contractYears, laborEscalation, odcEscalation, showEscalation, subcontractors, odcs, perDiem])

  // ==================== ROLE HANDLERS ====================

  const handleAddToTeam = (recRole: RecommendedRole) => {
    const baseSalary = icLevelRates[recRole.icLevel] || 100000
    const defaultYears = contractYears.length > 0 
      ? contractYears.map(y => y.id) 
      : ['base', 'option1', 'option2']
    
    addRole({
      id: `role-${Date.now()}`,
      name: recRole.title,
      description: recRole.description,
      icLevel: recRole.icLevel as 'IC1' | 'IC2' | 'IC3' | 'IC4' | 'IC5' | 'IC6',
      baseSalary,
      quantity: recRole.quantity,
      fte: 1,
      storyPoints: recRole.storyPoints,
      years: yearsArrayToObject(defaultYears),
      billableHours: 1920,
      isKeyPersonnel: recRole.isKey,
    })
  }

  const handleRemoveFromTeam = (roleId: string) => {
    removeRole(roleId)
    if (selectedRoleForBreakdown?.id === roleId) {
      setSelectedRoleForBreakdown(null)
    }
  }

  const handleEditRole = (role: TeamRole) => {
    setEditingRole(role)
    setRoleFormData({
      title: role.title,
      icLevel: role.icLevel,
      quantity: role.quantity,
      ftePerPerson: role.ftePerPerson,
      baseSalary: role.baseSalary,
      hoursPerYear: role.hoursPerYear,
      years: [...role.years],
    })
    setEditRoleDialogOpen(true)
  }

  const handleSaveRole = () => {
    if (!editingRole) return
    
    updateRole(editingRole.id, {
      name: roleFormData.title,
      icLevel: roleFormData.icLevel as 'IC1' | 'IC2' | 'IC3' | 'IC4' | 'IC5' | 'IC6',
      baseSalary: roleFormData.baseSalary,
      quantity: roleFormData.quantity,
      fte: roleFormData.ftePerPerson,
      years: yearsArrayToObject(roleFormData.years),
      billableHours: roleFormData.hoursPerYear,
    })
    
    setEditRoleDialogOpen(false)
    setEditingRole(null)
  }

  const toggleRoleFormYear = (yearId: string) => {
    setRoleFormData(prev => ({
      ...prev,
      years: prev.years.includes(yearId)
        ? prev.years.filter(y => y !== yearId)
        : [...prev.years, yearId]
    }))
  }

  const isRoleAdded = (title: string) => teamRoles.some(r => r.title === title)

  const toggleRoleYear = (roleId: string, yearId: string) => {
    const role = teamRoles.find(r => r.id === roleId)
    if (!role) return
    
    const newYears = role.years.includes(yearId)
      ? role.years.filter(y => y !== yearId)
      : [...role.years, yearId]
    
    updateRole(roleId, {
      years: yearsArrayToObject(newYears),
    })
  }

  // ==================== ODC HANDLERS (using AppContext) ====================

  const handleAddOdc = () => {
    setEditingOdc(null)
    // Ensure we have years - default to base + 2 options if contractYears is empty
    const defaultYears = contractYears.length > 0 
      ? contractYears.map(y => y.id) 
      : ['base', 'option1', 'option2']
    setOdcFormData({
      description: '',
      category: 'software',
      quantity: 1,
      unitCost: 0,
      years: defaultYears,
    })
    setOdcDialogOpen(true)
  }

  const handleEditOdc = (odc: ODCItem) => {
    setEditingOdc(odc)
    setOdcFormData({
      description: odc.description,
      category: odc.category,
      quantity: odc.quantity,
      unitCost: odc.unitCost,
      years: yearsObjectToArray(odc.years),
    })
    setOdcDialogOpen(true)
  }

  const handleSaveOdc = () => {
    const totalCost = odcFormData.quantity * odcFormData.unitCost
    if (editingOdc) {
      updateODC(editingOdc.id, {
        description: odcFormData.description,
        category: odcFormData.category,
        quantity: odcFormData.quantity,
        unitCost: odcFormData.unitCost,
        totalCost,
        years: yearsArrayToObject(odcFormData.years),
      })
    } else {
      addODC({
        id: `odc-${Date.now()}`,
        description: odcFormData.description,
        category: odcFormData.category,
        quantity: odcFormData.quantity,
        unitCost: odcFormData.unitCost,
        totalCost,
        years: yearsArrayToObject(odcFormData.years),
      })
    }
    setOdcDialogOpen(false)
    setEditingOdc(null)
  }

  const handleDeleteOdc = (odcId: string) => removeODC(odcId)

  const toggleOdcFormYear = (yearId: string) => {
    setOdcFormData(prev => ({
      ...prev,
      years: prev.years.includes(yearId)
        ? prev.years.filter(y => y !== yearId)
        : [...prev.years, yearId]
    }))
  }

  // ==================== PER DIEM (TRAVEL) HANDLERS (using AppContext) ====================

  const handleAddTravel = () => {
    setEditingTravel(null)
    const defaultYears = contractYears.length > 0 
      ? contractYears.map(y => y.id) 
      : ['base', 'option1', 'option2']
    setTravelFormData({
      location: '',
      ratePerDay: 0,
      numberOfDays: 1,
      numberOfPeople: 1,
      years: defaultYears,
    })
    setTravelDialogOpen(true)
  }

  const handleEditTravel = (pd: PerDiemCalculation) => {
    setEditingTravel(pd)
    setTravelFormData({
      location: pd.location,
      ratePerDay: pd.ratePerDay,
      numberOfDays: pd.numberOfDays,
      numberOfPeople: pd.numberOfPeople,
      years: yearsObjectToArray(pd.years),
    })
    setTravelDialogOpen(true)
  }

  const handleSaveTravel = () => {
    const totalCost = travelFormData.ratePerDay * travelFormData.numberOfDays * travelFormData.numberOfPeople
    if (editingTravel) {
      updatePerDiem(editingTravel.id, {
        location: travelFormData.location,
        ratePerDay: travelFormData.ratePerDay,
        numberOfDays: travelFormData.numberOfDays,
        numberOfPeople: travelFormData.numberOfPeople,
        totalCost,
        years: yearsArrayToObject(travelFormData.years),
      })
    } else {
      addPerDiem({
        id: `pd-${Date.now()}`,
        location: travelFormData.location,
        ratePerDay: travelFormData.ratePerDay,
        numberOfDays: travelFormData.numberOfDays,
        numberOfPeople: travelFormData.numberOfPeople,
        totalCost,
        years: yearsArrayToObject(travelFormData.years),
      })
    }
    setTravelDialogOpen(false)
    setEditingTravel(null)
  }

  const handleDeleteTravel = (pdId: string) => removePerDiem(pdId)

  const toggleTravelFormYear = (yearId: string) => {
    setTravelFormData(prev => ({
      ...prev,
      years: prev.years.includes(yearId)
        ? prev.years.filter(y => y !== yearId)
        : [...prev.years, yearId]
    }))
  }

  // ==================== SUBCONTRACTOR HANDLERS (using AppContext) ====================

  const handleAddSub = () => {
    setEditingSub(null)
    const defaultYears = contractYears.length > 0 
      ? contractYears.map(y => y.id) 
      : ['base', 'option1', 'option2']
    setSubFormData({
      companyName: '',
      role: '',
      laborCategory: '',
      theirRate: 0,
      markupPercent: 10,
      fte: 1,
      years: defaultYears,
    })
    setSubDialogOpen(true)
  }

  const handleEditSub = (sub: Subcontractor) => {
    setEditingSub(sub)
    setSubFormData({
      companyName: sub.companyName,
      role: sub.role,
      laborCategory: sub.laborCategory || '',
      theirRate: sub.theirRate,
      markupPercent: sub.markupPercent,
      fte: sub.fte,
      years: yearsObjectToArray(sub.years),
    })
    setSubDialogOpen(true)
  }

  const handleSaveSub = () => {
    const billedRate = subFormData.theirRate * (1 + subFormData.markupPercent / 100)
    if (editingSub) {
      updateSubcontractor(editingSub.id, {
        companyName: subFormData.companyName,
        role: subFormData.role,
        laborCategory: subFormData.laborCategory,
        theirRate: subFormData.theirRate,
        markupPercent: subFormData.markupPercent,
        billedRate,
        fte: subFormData.fte,
        years: yearsArrayToObject(subFormData.years),
      })
    } else {
      addSubcontractor({
        id: `sub-${Date.now()}`,
        companyName: subFormData.companyName,
        role: subFormData.role,
        laborCategory: subFormData.laborCategory,
        theirRate: subFormData.theirRate,
        markupPercent: subFormData.markupPercent,
        billedRate,
        fte: subFormData.fte,
        years: yearsArrayToObject(subFormData.years),
      })
    }
    setSubDialogOpen(false)
    setEditingSub(null)
  }

  const handleDeleteSub = (subId: string) => removeSubcontractor(subId)

  const toggleSubFormYear = (yearId: string) => {
    setSubFormData(prev => ({
      ...prev,
      years: prev.years.includes(yearId)
        ? prev.years.filter(y => y !== yearId)
        : [...prev.years, yearId]
    }))
  }

  // ==================== UTILITY FUNCTIONS ====================

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const totalStoryPoints = mockRecommendedRoles.reduce((sum, r) => sum + r.storyPoints, 0)
  const totalRecommendedFTE = mockRecommendedRoles.reduce((sum, r) => sum + r.quantity, 0)
  const contractType = solicitation?.contractType || 'T&M'

  // ==================== RENDER ====================

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">Roles & Pricing</h1>
            <Badge variant="outline" className="text-xs">{contractType}</Badge>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Profit Margin */}
            <div className="flex items-center gap-2">
              <Label htmlFor="profit" className="text-sm text-gray-600">Profit</Label>
              <div className="flex items-center">
                <Input
                  id="profit"
                  type="number"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(Number(e.target.value))}
                  className="w-16 h-8 text-sm"
                />
                <span className="text-sm text-gray-500 ml-1">%</span>
              </div>
            </div>
            
            {/* Escalation Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="escalation"
                checked={showEscalation}
                onChange={(e) => setShowEscalation(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="escalation" className="text-sm text-gray-600">Escalation</Label>
              {showEscalation && (
                <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 cursor-help">
                        <span className="text-xs text-gray-500">Labor</span>
                        <Input
                          type="number"
                          value={laborEscalation}
                          onChange={(e) => setLaborEscalation(Number(e.target.value))}
                          className="w-14 h-8 text-sm"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Annual escalation for prime labor rates</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 cursor-help">
                        <span className="text-xs text-gray-500">Other</span>
                        <Input
                          type="number"
                          value={odcEscalation}
                          onChange={(e) => setOdcEscalation(Number(e.target.value))}
                          className="w-14 h-8 text-sm"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Annual escalation for ODCs, Travel, and Subcontractors</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            <Button className="h-9">
              Continue to Rate Justification
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Three column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Recommended Roles */}
          <div className="border border-gray-100 rounded-lg p-4 bg-white">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gray-400" />
                  <h2 className="font-medium text-gray-900">Recommended Roles</h2>
                </div>
                <span className="text-xs text-gray-500">AI-generated</span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{totalRecommendedFTE}</span>
                  <span className="text-gray-500">FTE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{totalStoryPoints}</span>
                  <span className="text-gray-500">Story Points</span>
                </div>
              </div>

              <div className="space-y-2">
                {mockRecommendedRoles.map((role) => {
                  const added = isRoleAdded(role.title)
                  return (
                    <div
                      key={role.id}
                      className={`border rounded-lg p-3 transition-all ${
                        added ? 'border-gray-100 bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">{role.title}</span>
                            {role.isKey && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-0">
                                Key
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                        <span>IC: <span className="font-medium text-gray-900">{role.icLevel}</span></span>
                        <span>Qty: <span className="font-medium text-gray-900">{role.quantity}</span></span>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0 h-4 ${
                            role.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' 
                            : role.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {role.priority}
                        </Badge>
                        <span className="text-gray-400">{role.storyPoints} SP</span>
                      </div>

                      {added ? (
                        <div className="flex items-center justify-center gap-2 py-1.5 text-sm text-gray-500 bg-gray-100 rounded-md">
                          <Check className="w-4 h-4" />
                          Added
                        </div>
                      ) : (
                        <Button onClick={() => handleAddToTeam(role)} className="w-full h-8 text-sm">
                          Add to Team
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Team Summary */}
          <div className="border border-gray-100 rounded-lg p-4 bg-white">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <h2 className="font-medium text-gray-900">Team Summary</h2>
              </div>

              <div className="text-sm text-gray-500">
                {calculations.totalFTE.toFixed(2)} FTE · {calculations.roleCount} roles
              </div>

              {teamRoles.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No roles added yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add roles from recommendations</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teamRoles.map((role) => (
                    <div
                      key={role.id}
                      className="group border border-gray-100 rounded-lg p-3 bg-gray-50 hover:border-gray-200 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium text-sm text-gray-900">{role.title}</span>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{role.icLevel}</Badge>
                            <span>×{role.quantity}</span>
                            <span>·</span>
                            <span>{role.ftePerPerson} FTE</span>
                            <span>·</span>
                            <span>{role.hoursPerYear.toLocaleString()} hrs</span>
                            <span>·</span>
                            <span className="font-medium text-gray-700">{formatCurrency(role.hourlyRate)}/hr</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRole(role)}
                                className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">Edit role</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRoleForBreakdown(role)}
                                className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <Calculator className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">View rate breakdown</p></TooltipContent>
                          </Tooltip>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromTeam(role.id)}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {contractYears.map((year) => {
                          const isActive = role.years.includes(year.id)
                          return (
                            <button
                              key={year.id}
                              onClick={() => toggleRoleYear(role.id, year.id)}
                              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${
                                isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              {year.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Contract Value */}
          <div className="border border-gray-100 rounded-lg p-4 bg-white">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <h2 className="font-medium text-gray-900">Contract Value</h2>
              </div>

              <p className="text-sm text-gray-500">
                {showEscalation 
                  ? `With escalation: ${laborEscalation}% labor, ${odcEscalation}% ODC/Travel`
                  : 'Fixed pricing across all years'
                }
              </p>

              {/* Year breakdown */}
              <div className="space-y-1">
                {contractYears.map((year) => {
                  const yearData = calculations.yearCosts[year.id] || { total: 0 }
                  const laborEsc = showEscalation && year.index > 0 ? `+${(laborEscalation * year.index).toFixed(1)}%` : ''
                  return (
                    <div key={year.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {year.id === 'base' ? 'Base Year' : `Option Year ${year.id.replace('option', '')}`}:
                        </span>
                        {laborEsc && <span className="text-xs text-gray-400">({laborEsc})</span>}
                      </div>
                      <span className="font-medium text-gray-900">{formatCurrency(yearData.total)}</span>
                    </div>
                  )
                })}
              </div>

              {/* Labor Subtotal */}
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Labor Subtotal:</span>
                <span className="font-medium text-gray-900">{formatCurrency(calculations.laborTotal)}</span>
              </div>

              {/* Subcontractors - Collapsible */}
              <div className="border-t border-gray-100 pt-3">
                <button
                  onClick={() => setShowSubsExpanded(!showSubsExpanded)}
                  className="w-full flex items-center justify-between py-1 hover:bg-gray-50 rounded -mx-1 px-1"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-600">+ Subcontractors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{formatCurrency(calculations.subsTotal)}</span>
                    {showSubsExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                
                {showSubsExpanded && (
                  <div className="mt-2 ml-5 space-y-2">
                    {subcontractors.map((sub) => (
                      <div key={sub.id} className="group text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 font-medium">{sub.companyName}</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">+{sub.markupPercent}%</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium">{formatCurrency(sub.billedRate * sub.fte * 1920)}/yr</span>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" onClick={() => handleEditSub(sub)} className="h-5 w-5 p-0 text-gray-400 hover:text-blue-600">
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteSub(sub.id)} className="h-5 w-5 p-0 text-gray-400 hover:text-red-600">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="text-gray-500 mt-0.5">{sub.role} · {sub.fte} FTE · {formatCurrency(sub.theirRate)}/hr</div>
                      </div>
                    ))}
                    <button onClick={handleAddSub} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2">
                      <Plus className="w-3 h-3" />
                      Add Subcontractor
                    </button>
                  </div>
                )}
              </div>

              {/* ODCs - Collapsible */}
              <div className="border-t border-gray-100 pt-3">
                <button
                  onClick={() => setShowOdcExpanded(!showOdcExpanded)}
                  className="w-full flex items-center justify-between py-1 hover:bg-gray-50 rounded -mx-1 px-1"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-600">+ ODCs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{formatCurrency(calculations.odcsTotal)}</span>
                    {showOdcExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                
                {showOdcExpanded && (
                  <div className="mt-2 ml-5 space-y-1.5">
                    {odcs.map((odc) => (
                      <div key={odc.id} className="group flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{odc.description}</span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{odcCategoryLabels[odc.category]}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">
                            {odc.quantity > 1 ? `${odc.quantity} × ` : ''}{formatCurrency(odc.unitCost)}/yr
                          </span>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={() => handleEditOdc(odc)} className="h-5 w-5 p-0 text-gray-400 hover:text-blue-600">
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteOdc(odc.id)} className="h-5 w-5 p-0 text-gray-400 hover:text-red-600">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={handleAddOdc} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2">
                      <Plus className="w-3 h-3" />
                      Add ODC
                    </button>
                  </div>
                )}
              </div>

              {/* Travel (Per Diem) - Collapsible */}
              <div className="border-t border-gray-100 pt-3">
                <button
                  onClick={() => setShowTravelExpanded(!showTravelExpanded)}
                  className="w-full flex items-center justify-between py-1 hover:bg-gray-50 rounded -mx-1 px-1"
                >
                  <div className="flex items-center gap-2">
                    <Plane className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-600">+ Travel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{formatCurrency(calculations.travelTotal)}</span>
                    {showTravelExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                
                {showTravelExpanded && (
                  <div className="mt-2 ml-5 space-y-2">
                    {perDiem.map((pd) => (
                      <div key={pd.id} className="group text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">{pd.location}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium">{formatCurrency(pd.totalCost)}/yr</span>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" onClick={() => handleEditTravel(pd)} className="h-5 w-5 p-0 text-gray-400 hover:text-blue-600">
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteTravel(pd.id)} className="h-5 w-5 p-0 text-gray-400 hover:text-red-600">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="text-gray-500 mt-0.5">
                          {pd.numberOfPeople} people × {pd.numberOfDays} days × {formatCurrency(pd.ratePerDay)}/day
                        </div>
                      </div>
                    ))}
                    <button onClick={handleAddTravel} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2">
                      <Plus className="w-3 h-3" />
                      Add Travel
                    </button>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Contract:</span>
                  <span className="text-2xl font-semibold text-green-600">{formatCurrency(calculations.totalContract)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Labor + Subs + ODCs + Travel (with escalation)</p>
              </div>

              {/* Summary */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total FTE:</span>
                    <span className="font-medium text-gray-900">{calculations.totalFTE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avg Rate:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(calculations.avgRate)}/hr</span>
                  </div>
                </div>
              </div>

              {/* Profit insight */}
              {calculations.totalContract > 0 && (
                <div className="p-3 bg-green-50 border-l-2 border-l-green-500 rounded-r-lg">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-green-800">Estimated Profit at {profitMargin}%</p>
                      <p className="text-sm font-semibold text-green-700 mt-0.5">
                        {formatCurrency(calculations.laborTotal * (profitMargin / 100) / (1 + profitMargin / 100))}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== DIALOGS ==================== */}

        {/* Edit Role Dialog */}
        <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>Modify role details and year allocations</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role-title">Role Name</Label>
                <Input
                  id="role-title"
                  value={roleFormData.title}
                  onChange={(e) => setRoleFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role-ic-level">IC Level</Label>
                  <select
                    id="role-ic-level"
                    value={roleFormData.icLevel}
                    onChange={(e) => {
                      const newLevel = e.target.value
                      setRoleFormData(prev => ({
                        ...prev,
                        icLevel: newLevel,
                        baseSalary: icLevelRates[newLevel] || prev.baseSalary,
                      }))
                    }}
                    className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {icLevelOptions.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-salary">Base Salary</Label>
                  <Input
                    id="role-salary"
                    type="number"
                    value={roleFormData.baseSalary}
                    onChange={(e) => setRoleFormData(prev => ({ ...prev, baseSalary: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role-quantity">Quantity</Label>
                  <Input
                    id="role-quantity"
                    type="number"
                    min={1}
                    value={roleFormData.quantity}
                    onChange={(e) => setRoleFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-fte">FTE per Person</Label>
                  <select
                    id="role-fte"
                    value={roleFormData.ftePerPerson}
                    onChange={(e) => setRoleFormData(prev => ({ ...prev, ftePerPerson: Number(e.target.value) }))}
                    className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {fteOptions.map(fte => (
                      <option key={fte} value={fte}>{fte}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="role-hours">Billable Hours Per Year</Label>
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="w-3.5 h-3.5 text-gray-400" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">Standard full-time is 1,920 (2,080 minus holidays/PTO). Adjust for partial allocations.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="role-hours"
                  type="number"
                  min={0}
                  max={2080}
                  value={roleFormData.hoursPerYear}
                  onChange={(e) => setRoleFormData(prev => ({ ...prev, hoursPerYear: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Year Allocations</Label>
                <div className="flex flex-wrap gap-2">
                  {contractYears.map((year) => {
                    const isActive = roleFormData.years.includes(year.id)
                    return (
                      <button
                        key={year.id}
                        type="button"
                        onClick={() => toggleRoleFormYear(year.id)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {year.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-900">Calculated Billed Rate:</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatCurrency(calculateHourlyRate(roleFormData.icLevel, roleFormData.baseSalary))}/hr
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRoleDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveRole}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ODC Dialog */}
        <Dialog open={odcDialogOpen} onOpenChange={setOdcDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingOdc ? 'Edit ODC' : 'Add ODC'}</DialogTitle>
              <DialogDescription>Other Direct Costs directly attributable to the contract</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="odc-desc">Description <span className="text-red-500">*</span></Label>
                <Input
                  id="odc-desc"
                  placeholder="e.g., AWS Cloud Services"
                  value={odcFormData.description}
                  onChange={(e) => setOdcFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="odc-category">Category</Label>
                  <select
                    id="odc-category"
                    value={odcFormData.category}
                    onChange={(e) => setOdcFormData(prev => ({ ...prev, category: e.target.value as ODCItem['category'] }))}
                    className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(odcCategoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="odc-qty">Quantity</Label>
                  <Input
                    id="odc-qty"
                    type="number"
                    min={1}
                    value={odcFormData.quantity}
                    onChange={(e) => setOdcFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="odc-cost">Unit Cost (per year) <span className="text-red-500">*</span></Label>
                <Input
                  id="odc-cost"
                  type="number"
                  min={0}
                  placeholder="0.00"
                  value={odcFormData.unitCost || ''}
                  onChange={(e) => setOdcFormData(prev => ({ ...prev, unitCost: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Applicable Years</Label>
                <div className="flex flex-wrap gap-2">
                  {contractYears.map((year) => {
                    const isActive = odcFormData.years.includes(year.id)
                    return (
                      <button
                        key={year.id}
                        type="button"
                        onClick={() => toggleOdcFormYear(year.id)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {year.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {odcFormData.unitCost > 0 && odcFormData.years.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total: {odcFormData.quantity} × {formatCurrency(odcFormData.unitCost)} × {odcFormData.years.length} years</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(odcFormData.quantity * odcFormData.unitCost * odcFormData.years.length)}</span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOdcDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveOdc} disabled={!odcFormData.description || odcFormData.unitCost <= 0}>
                {editingOdc ? <><CheckCircle2 className="w-4 h-4 mr-2" />Save Changes</> : <><Plus className="w-4 h-4 mr-2" />Add ODC</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Travel (Per Diem) Dialog */}
        <Dialog open={travelDialogOpen} onOpenChange={setTravelDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTravel ? 'Edit Travel' : 'Add Travel'}</DialogTitle>
              <DialogDescription>Per diem travel costs per FAR 31.205-46</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="travel-location">Location <span className="text-red-500">*</span></Label>
                <Input
                  id="travel-location"
                  placeholder="e.g., Washington, DC"
                  value={travelFormData.location}
                  onChange={(e) => setTravelFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="travel-rate">Rate/Day</Label>
                  <Input
                    id="travel-rate"
                    type="number"
                    min={0}
                    placeholder="0.00"
                    value={travelFormData.ratePerDay || ''}
                    onChange={(e) => setTravelFormData(prev => ({ ...prev, ratePerDay: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travel-days">Days</Label>
                  <Input
                    id="travel-days"
                    type="number"
                    min={1}
                    value={travelFormData.numberOfDays}
                    onChange={(e) => setTravelFormData(prev => ({ ...prev, numberOfDays: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travel-people">People</Label>
                  <Input
                    id="travel-people"
                    type="number"
                    min={1}
                    value={travelFormData.numberOfPeople}
                    onChange={(e) => setTravelFormData(prev => ({ ...prev, numberOfPeople: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Applicable Years</Label>
                <div className="flex flex-wrap gap-2">
                  {contractYears.map((year) => {
                    const isActive = travelFormData.years.includes(year.id)
                    return (
                      <button
                        key={year.id}
                        type="button"
                        onClick={() => toggleTravelFormYear(year.id)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {year.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {travelFormData.ratePerDay > 0 && travelFormData.years.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {travelFormData.numberOfPeople} × {travelFormData.numberOfDays}d × {formatCurrency(travelFormData.ratePerDay)} × {travelFormData.years.length}yr
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(travelFormData.ratePerDay * travelFormData.numberOfDays * travelFormData.numberOfPeople * travelFormData.years.length)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setTravelDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveTravel} disabled={!travelFormData.location || travelFormData.ratePerDay <= 0}>
                {editingTravel ? <><CheckCircle2 className="w-4 h-4 mr-2" />Save Changes</> : <><Plus className="w-4 h-4 mr-2" />Add Travel</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Subcontractor Dialog */}
        <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingSub ? 'Edit Subcontractor' : 'Add Subcontractor'}</DialogTitle>
              <DialogDescription>Subcontractor labor with pass-through markup</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sub-company">Company Name <span className="text-red-500">*</span></Label>
                <Input
                  id="sub-company"
                  placeholder="e.g., TechPartners LLC"
                  value={subFormData.companyName}
                  onChange={(e) => setSubFormData(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sub-role">Role <span className="text-red-500">*</span></Label>
                <Input
                  id="sub-role"
                  placeholder="e.g., Senior Cloud Architect"
                  value={subFormData.role}
                  onChange={(e) => setSubFormData(prev => ({ ...prev, role: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sub-lcat">Labor Category (Optional)</Label>
                <Input
                  id="sub-lcat"
                  placeholder="e.g., Subject Matter Expert III"
                  value={subFormData.laborCategory}
                  onChange={(e) => setSubFormData(prev => ({ ...prev, laborCategory: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sub-rate">Their Rate/hr <span className="text-red-500">*</span></Label>
                  <Input
                    id="sub-rate"
                    type="number"
                    min={0}
                    placeholder="0.00"
                    value={subFormData.theirRate || ''}
                    onChange={(e) => setSubFormData(prev => ({ ...prev, theirRate: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub-markup">Markup %</Label>
                  <Input
                    id="sub-markup"
                    type="number"
                    min={0}
                    max={100}
                    value={subFormData.markupPercent}
                    onChange={(e) => setSubFormData(prev => ({ ...prev, markupPercent: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub-fte">FTE</Label>
                  <Input
                    id="sub-fte"
                    type="number"
                    min={0.25}
                    max={10}
                    step={0.25}
                    value={subFormData.fte}
                    onChange={(e) => setSubFormData(prev => ({ ...prev, fte: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Applicable Years</Label>
                <div className="flex flex-wrap gap-2">
                  {contractYears.map((year) => {
                    const isActive = subFormData.years.includes(year.id)
                    return (
                      <button
                        key={year.id}
                        type="button"
                        onClick={() => toggleSubFormYear(year.id)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {year.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {subFormData.theirRate > 0 && subFormData.years.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Billed Rate:</span>
                    <span className="text-gray-900">{formatCurrency(subFormData.theirRate * (1 + subFormData.markupPercent / 100))}/hr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Annual ({subFormData.fte} FTE × 1,920 hrs):</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(subFormData.theirRate * (1 + subFormData.markupPercent / 100) * subFormData.fte * 1920)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSubDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveSub} disabled={!subFormData.companyName || !subFormData.role || subFormData.theirRate <= 0}>
                {editingSub ? <><CheckCircle2 className="w-4 h-4 mr-2" />Save Changes</> : <><Plus className="w-4 h-4 mr-2" />Add Sub</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rate Breakdown Slide-out Panel */}
        {selectedRoleForBreakdown && (
          <>
            <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedRoleForBreakdown(null)} />
            <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-50 animate-in slide-in-from-right">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Rate Breakdown</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedRoleForBreakdown.title}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRoleForBreakdown(null)} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {(() => {
                  const breakdown = calculateRateBreakdown(selectedRoleForBreakdown.baseSalary)
                  return (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Base Salary:</span>
                          <span className="font-medium text-gray-900">{formatCurrency(breakdown.baseSalary)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">÷ Standard Hours:</span>
                          <span className="font-medium text-gray-900">2,080</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <span className="text-sm font-medium text-gray-900">Direct Rate:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(breakdown.directRate)}/hr</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Indirect Rates</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">+ Fringe ({rates.fringe.toFixed(2)}%):</span>
                          <span className="font-medium text-gray-900">{formatCurrency(breakdown.fringeAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">+ Overhead ({rates.overhead.toFixed(2)}%):</span>
                          <span className="font-medium text-gray-900">{formatCurrency(breakdown.overheadAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">+ G&A ({rates.gAndA.toFixed(2)}%):</span>
                          <span className="font-medium text-gray-900">{formatCurrency(breakdown.gaAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <span className="text-sm font-medium text-gray-900">Fully Loaded Rate:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(breakdown.fullyLoadedRate)}/hr</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Profit</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">+ Profit ({profitMargin}%):</span>
                          <span className="font-medium text-gray-900">{formatCurrency(breakdown.profitAmount)}</span>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-blue-900">Billed Rate:</span>
                          <span className="text-xl font-bold text-blue-600">{formatCurrency(breakdown.billedRate)}/hr</span>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Annual Cost (Base Year)</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Billable Hours:</span>
                          <span className="font-medium text-gray-900">{selectedRoleForBreakdown.hoursPerYear.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">× Quantity:</span>
                          <span className="font-medium text-gray-900">{selectedRoleForBreakdown.quantity}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">× FTE:</span>
                          <span className="font-medium text-gray-900">{selectedRoleForBreakdown.ftePerPerson}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <span className="text-sm font-medium text-gray-900">Annual Cost:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(
                              breakdown.billedRate * 
                              selectedRoleForBreakdown.hoursPerYear * 
                              selectedRoleForBreakdown.quantity * 
                              selectedRoleForBreakdown.ftePerPerson
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                          {contractType === 'T&M' ? (
                            <><span className="font-medium">T&M Contract:</span> This billed rate is what you charge the government per hour.</>
                          ) : contractType === 'FFP' ? (
                            <><span className="font-medium">FFP Contract:</span> This rate is for internal cost estimation. The government pays a fixed total price.</>
                          ) : (
                            <><span className="font-medium">Tip:</span> Use this rate to estimate labor costs and ensure profitability.</>
                          )}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}