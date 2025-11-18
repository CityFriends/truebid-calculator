'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

// Types
export type TabType = 'upload' | 'roles-pricing' | 'scoping' | 'subcontractors' | 'prime-check' | 'gsa' | 'export'

export type ICLevel = 'IC3' | 'IC4' | 'IC5'

export interface Role {
  id: string
  title: string
  icLevel: ICLevel
  quantity: number
  isKeyPersonnel: boolean
  confidence: 'high' | 'medium' | 'low'
  storyPoints: number
  description: string
  baseSalary?: number
  billableHours?: number
  isCustom?: boolean
}

export interface SelectedRole extends Role {
  baseSalary: number
  billableHours: number
  loadedRate: number
  annualCost: number
}

export interface CompanyPolicy {
  vacationDays: number
  federalHolidays: number
  sickDays: number
  totalPTODays: number
  ptoHours: number
  standardHours: number
  billableHours: number
}

export interface CostMultipliers {
  fringe: number
  overhead: number
  ga: number
  profit: number
}

interface RfpData {
  fileName: string
  fileSize: number
  analysisComplete: boolean
  summary?: string
}

interface AppContextType {
  // Tab Navigation
  activeTab: TabType
  setActiveTab: (tab: TabType) => void

  // RFP Data
  rfpData: RfpData | null
  setRfpData: (data: RfpData | null) => void

  // Roles
  recommendedRoles: Role[]
  setRecommendedRoles: (roles: Role[]) => void
  selectedRoles: SelectedRole[]
  setSelectedRoles: (roles: SelectedRole[]) => void
  
  // Compatibility: teamMembers alias
  teamMembers: SelectedRole[]
  
  // Role Management
  addRole: (role: Role) => void
  removeRole: (roleId: string) => void
  updateRole: (roleId: string, updates: Partial<SelectedRole>) => void
  addTeamMember: (role: Role) => void
  updateTeamMember: (roleId: string, updates: Partial<SelectedRole>) => void

  // Company Policy
  companyPolicy: CompanyPolicy
  updateCompanyPolicy: (policy: Partial<CompanyPolicy>) => void

  // Cost Multipliers
  costMultipliers: CostMultipliers
  updateCostMultipliers: (multipliers: Partial<CostMultipliers>) => void

  // Profit & Escalation
  profitMargin: number
  setProfitMargin: (margin: number) => void
  annualEscalation: number
  setAnnualEscalation: (escalation: number) => void

  // Calculations
  calculateLoadedRate: (baseSalary: number, billableHours: number) => number
  calculateAnnualCost: (loadedRate: number, billableHours: number, quantity: number) => number
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Default company policy
const defaultCompanyPolicy: CompanyPolicy = {
  vacationDays: 18,
  federalHolidays: 11,
  sickDays: 5,
  totalPTODays: 34,
  ptoHours: 272,
  standardHours: 2080,
  billableHours: 1808
}

// Default cost multipliers
const defaultCostMultipliers: CostMultipliers = {
  fringe: 1.45,    // 45% benefits
  overhead: 1.30,  // 30% overhead
  ga: 1.05,        // 5% G&A
  profit: 0.10     // 10% profit
}

// Salary data by IC level
const salaryByICLevel: Record<ICLevel, number> = {
  IC3: 95000,
  IC4: 130000,
  IC5: 180000
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [rfpData, setRfpData] = useState<RfpData | null>(null)
  const [recommendedRoles, setRecommendedRoles] = useState<Role[]>([])
  const [selectedRoles, setSelectedRoles] = useState<SelectedRole[]>([])
  const [companyPolicy, setCompanyPolicy] = useState<CompanyPolicy>(defaultCompanyPolicy)
  const [costMultipliers, setCostMultipliers] = useState<CostMultipliers>(defaultCostMultipliers)
  const [profitMargin, setProfitMargin] = useState(8.0)
  const [annualEscalation, setAnnualEscalation] = useState(2.0)

  // Calculate loaded rate
  const calculateLoadedRate = (baseSalary: number, billableHours: number): number => {
    // CRITICAL: Always use 2080 for base rate calculation
    const baseRate = baseSalary / 2080
    const afterFringe = baseRate * costMultipliers.fringe
    const afterOverhead = afterFringe * costMultipliers.overhead
    const afterGA = afterOverhead * costMultipliers.ga
    const withProfit = afterGA * (1 + (profitMargin / 100))
    
    return withProfit
  }

  // Calculate annual cost
  const calculateAnnualCost = (loadedRate: number, billableHours: number, quantity: number): number => {
    return loadedRate * billableHours * quantity
  }

  // Add role to selected roles
  const addRole = (role: Role) => {
    const baseSalary = role.baseSalary || salaryByICLevel[role.icLevel]
    const billableHours = role.billableHours || companyPolicy.billableHours
    const loadedRate = calculateLoadedRate(baseSalary, billableHours)
    const annualCost = calculateAnnualCost(loadedRate, billableHours, role.quantity)

    const selectedRole: SelectedRole = {
      ...role,
      baseSalary,
      billableHours,
      loadedRate,
      annualCost
    }

    setSelectedRoles(prev => [...prev, selectedRole])
  }

  // Remove role
  const removeRole = (roleId: string) => {
    setSelectedRoles(prev => prev.filter(r => r.id !== roleId))
  }

  // Update role
  const updateRole = (roleId: string, updates: Partial<SelectedRole>) => {
    setSelectedRoles(prev => prev.map(role => {
      if (role.id !== roleId) return role

      const updatedRole = { ...role, ...updates }
      
      // Recalculate if salary or hours changed
      if (updates.baseSalary !== undefined || updates.billableHours !== undefined) {
        updatedRole.loadedRate = calculateLoadedRate(
          updatedRole.baseSalary,
          updatedRole.billableHours
        )
        updatedRole.annualCost = calculateAnnualCost(
          updatedRole.loadedRate,
          updatedRole.billableHours,
          updatedRole.quantity
        )
      }

      return updatedRole
    }))
  }

  // Update company policy
  const updateCompanyPolicy = (policy: Partial<CompanyPolicy>) => {
    setCompanyPolicy(prev => ({ ...prev, ...policy }))
  }

  // Update cost multipliers
  const updateCostMultipliers = (multipliers: Partial<CostMultipliers>) => {
    setCostMultipliers(prev => ({ ...prev, ...multipliers }))
  }

  const value: AppContextType = {
    activeTab,
    setActiveTab,
    rfpData,
    setRfpData,
    recommendedRoles,
    setRecommendedRoles,
    selectedRoles,
    setSelectedRoles,
    teamMembers: selectedRoles, // Compatibility alias
    addRole,
    removeRole,
    updateRole,
    addTeamMember: addRole, // Compatibility alias
    updateTeamMember: updateRole, // Compatibility alias
    companyPolicy,
    updateCompanyPolicy,
    costMultipliers,
    updateCostMultipliers,
    profitMargin,
    setProfitMargin,
    annualEscalation,
    setAnnualEscalation,
    calculateLoadedRate,
    calculateAnnualCost
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}