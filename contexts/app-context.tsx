'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// ==================== TYPE DEFINITIONS ====================

export type ContractType = 'tm' | 'ffp' | 'gsa';

// ==================== SOLICITATION TYPES ====================
// These types define the RFP/solicitation data that flows across all tabs

export interface SolicitationInfo {
  // Basic Info
  solicitationNumber: string
  title: string
  clientAgency: string
  subAgency?: string
  
  // Dates
  releaseDate?: string
  questionsDeadline?: string
  proposalDueDate?: string
  anticipatedAwardDate?: string
  
  // Contract Details
  contractType: 'FFP' | 'T&M' | 'CPFF' | 'CPAF' | 'IDIQ' | 'BPA' | 'hybrid' | ''
  contractVehicle?: string
  naicsCode?: string
  psc?: string
  
  // Period of Performance
  periodOfPerformance: {
    baseYear: boolean
    optionYears: number
    totalMonths?: number
  }
  
  // Set-Aside & Compliance
  setAside: 'full-open' | 'small-business' | '8a' | 'hubzone' | 'sdvosb' | 'wosb' | 'edwosb' | ''
  requiresClearance: boolean
  clearanceLevel?: 'public-trust' | 'secret' | 'top-secret' | 'ts-sci' | ''
  
  // Place of Performance
  placeOfPerformance: {
    type: 'remote' | 'on-site' | 'hybrid' | ''
    locations: string[]
    travelRequired: boolean
    travelPercent?: number
  }
  
  // Budget & Evaluation
  budgetRange?: {
    min?: number
    max?: number
    ceiling?: number
  }
  evaluationCriteria?: EvaluationCriterion[]
  
  // Key Contacts
  contractingOfficer?: ContactInfo
  contractingOfficerRep?: ContactInfo
  
  // Source Selection
  evaluationMethod?: 'LPTA' | 'best-value' | 'tradeoff' | ''
  
  // Extracted Requirements (from AI analysis)
  keyRequirements?: string[]
  technicalRequirements?: string[]
  
  // Internal Tracking
  internalBidNumber?: string
  bidDecision?: 'go' | 'no-go' | 'pending' | ''
  bidDecisionDate?: string
  bidDecisionRationale?: string
  
  // Metadata
  createdAt: string
  updatedAt: string
  analyzedFromDocument?: string
}

export interface EvaluationCriterion {
  id: string
  factor: string
  weight?: number
  description?: string
  subfactors?: string[]
}

export interface ContactInfo {
  name: string
  email?: string
  phone?: string
  organization?: string
}

// Default empty solicitation
export const emptySolicitation: SolicitationInfo = {
  solicitationNumber: '',
  title: '',
  clientAgency: '',
  contractType: '',
  periodOfPerformance: {
    baseYear: true,
    optionYears: 2
  },
  setAside: '',
  requiresClearance: false,
  placeOfPerformance: {
    type: '',
    locations: [],
    travelRequired: false
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// Helper functions for solicitation
export const hasSolicitationData = (sol: SolicitationInfo): boolean => {
  return Boolean(sol.solicitationNumber || sol.title || sol.clientAgency)
}

export const getSolicitationDisplayName = (sol: SolicitationInfo): string => {
  if (sol.title) return sol.title
  if (sol.solicitationNumber) return sol.solicitationNumber
  return 'Untitled Solicitation'
}

export const contractTypeLabels: Record<string, string> = {
  'FFP': 'Firm Fixed Price',
  'T&M': 'Time & Materials',
  'CPFF': 'Cost Plus Fixed Fee',
  'CPAF': 'Cost Plus Award Fee',
  'IDIQ': 'Indefinite Delivery/Indefinite Quantity',
  'BPA': 'Blanket Purchase Agreement',
  'hybrid': 'Hybrid'
}

export const setAsideLabels: Record<string, string> = {
  'full-open': 'Full & Open Competition',
  'small-business': 'Small Business Set-Aside',
  '8a': '8(a) Set-Aside',
  'hubzone': 'HUBZone Set-Aside',
  'sdvosb': 'SDVOSB Set-Aside',
  'wosb': 'WOSB Set-Aside',
  'edwosb': 'EDWOSB Set-Aside'
}

// ==================== COMPANY PROFILE (SaaS-Ready) ====================

export interface CompanyProfile {
  id: string;
  name: string;
  legalName: string;
  samUei: string;
  cageCode: string;
  businessSize: 'small' | 'other-than-small';
  naicsCodes: string[];
  gsaContractNumber?: string;
  gsaMasSchedule?: boolean;
}

// ==================== INDIRECT RATES (Audit-Ready) ====================

export interface IndirectRates {
  fringe: number;
  overhead: number;
  ga: number;
  effectiveDate: string;
  fiscalYear: number;
  rateType: 'provisional' | 'final' | 'billing' | 'forward-pricing';
  source: string;
  lastUpdated: string;
}

// ==================== PROFIT TARGETS ====================

export interface ProfitTargets {
  tmDefault: number;
  ffpLowRisk: number;
  ffpMediumRisk: number;
  ffpHighRisk: number;
  gsaDefault: number;
}

// ==================== ESCALATION RATES ====================

export interface EscalationRates {
  laborDefault: number;
  odcDefault: number;
  source: string;
}

// ==================== COMPANY POLICY ====================

export interface CompanyPolicy {
  standardHours: number;
  ptoHours: number;
  holidayHours: number;
  sickHours: number;
  targetBillableHours: number;
  overtimeMultiplier: number;
}

// ==================== ROLE DEFINITIONS ====================

export interface CompanyRoleStep {
  step: number;
  salary: number;
  monthsToNextStep: number | null;
}

export interface CompanyRoleLevel {
  level: string;
  levelName: string;
  steps: CompanyRoleStep[];
  monthsBeforePromotionReady: number | null;
  isTerminal: boolean;
  yearsExperience: string;
}

export interface CompanyRole {
  id: string;
  title: string;
  laborCategory: string;
  description: string;
  levels: CompanyRoleLevel[];
  blsOccCode?: string;
  blsOccTitle?: string;
  gsaLaborCategory?: string;
  gsaSin?: string;
  scaCode?: string;
  scaOccupation?: string;
}

// ==================== BID-SPECIFIC ROLES ====================

export interface Role {
  id: string;
  name: string;
  description: string;
  icLevel: 'IC1' | 'IC2' | 'IC3' | 'IC4' | 'IC5' | 'IC6';
  baseSalary: number;
  quantity: number;
  fte: number;
  storyPoints: number;
  years: {
    base: boolean;
    option1: boolean;
    option2: boolean;
    option3: boolean;
    option4: boolean;
  };
  assumptions?: string[];
  isKeyPersonnel?: boolean;
  confidence?: 'high' | 'medium' | 'low';
  isCustom?: boolean;
  title?: string;
  loadedRate?: number;
  annualCost?: number;
  billableHours?: number;
}

// ==================== SUBCONTRACTORS ====================

export interface Subcontractor {
  id: string;
  companyName: string;
  role: string;
  laborCategory?: string;
  theirRate: number;
  markupPercent: number;
  billedRate: number;
  fte: number;
  years: {
    base: boolean;
    option1: boolean;
    option2: boolean;
    option3: boolean;
    option4: boolean;
  };
  rateSource?: string;
  quoteDate?: string;
  quoteReference?: string;
}

// ==================== ODCs ====================

export interface ODCItem {
  id: string;
  category: 'travel' | 'materials' | 'equipment' | 'software' | 'other';
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  years: {
    base: boolean;
    option1: boolean;
    option2: boolean;
    option3: boolean;
    option4: boolean;
  };
  costSource?: string;
  quoteReference?: string;
}

// ==================== PER DIEM ====================

export interface PerDiemCalculation {
  id: string;
  location: string;
  ratePerDay: number;
  numberOfDays: number;
  numberOfPeople: number;
  totalCost: number;
  years: {
    base: boolean;
    option1: boolean;
    option2: boolean;
    option3: boolean;
    option4: boolean;
  };
}

// ==================== GSA SCHEDULE ====================

export interface GSALaborCategory {
  id: string;
  sin: string;
  title: string;
  rates: {
    year1: number | null;
    year2: number | null;
    year3: number | null;
    year4: number | null;
    year5: number | null;
  };
  educationRequirement?: string;
  yearsExperience?: number;
}

export interface GSAContractInfo {
  contractNumber: string;
  contractorName: string;
  samUei: string;
  periodOfPerformance: {
    start: string;
    end: string;
  };
  maxOrder: number;
  minOrder: number;
  iffRate: number;
  sins: {
    sin: string;
    name: string;
    laborCategories: GSALaborCategory[];
  }[];
}

// ==================== CONTEXT INTERFACE ====================

interface AppContextType {
  // Solicitation (RFP Details)
  solicitation: SolicitationInfo;
  setSolicitation: (sol: SolicitationInfo) => void;
  updateSolicitation: (updates: Partial<SolicitationInfo>) => void;
  resetSolicitation: () => void;
  
  // Company Profile (SaaS)
  companyProfile: CompanyProfile;
  setCompanyProfile: (profile: CompanyProfile) => void;
  
  // Indirect Rates (Audit-Ready)
  indirectRates: IndirectRates;
  setIndirectRates: (rates: IndirectRates) => void;
  
  // Profit Targets
  profitTargets: ProfitTargets;
  setProfitTargets: (targets: ProfitTargets) => void;
  
  // Escalation
  escalationRates: EscalationRates;
  setEscalationRates: (rates: EscalationRates) => void;
  
  // Company Policy
  companyPolicy: CompanyPolicy;
  setCompanyPolicy: (policy: CompanyPolicy) => void;
  
  // Contract Configuration
  contractType: ContractType;
  setContractType: (type: ContractType) => void;
  
  // Company Role Library
  companyRoles: CompanyRole[];
  setCompanyRoles: (roles: CompanyRole[]) => void;
  addCompanyRole: (role: CompanyRole) => void;
  updateCompanyRole: (id: string, updates: Partial<CompanyRole>) => void;
  removeCompanyRole: (id: string) => void;
  
  // Bid-Specific Roles
  recommendedRoles: Role[];
  setRecommendedRoles: (roles: Role[]) => void;
  selectedRoles: Role[];
  setSelectedRoles: (roles: Role[]) => void;
  addRole: (role: Role) => void;
  removeRole: (id: string) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  
  // Subcontractors
  subcontractors: Subcontractor[];
  setSubcontractors: (subs: Subcontractor[]) => void;
  addSubcontractor: (sub: Subcontractor) => void;
  removeSubcontractor: (id: string) => void;
  updateSubcontractor: (id: string, updates: Partial<Subcontractor>) => void;
  
  // ODCs
  odcs: ODCItem[];
  setODCs: (odcs: ODCItem[]) => void;
  addODC: (odc: ODCItem) => void;
  removeODC: (id: string) => void;
  updateODC: (id: string, updates: Partial<ODCItem>) => void;
  
  // Per Diem
  perDiem: PerDiemCalculation[];
  setPerDiem: (perDiem: PerDiemCalculation[]) => void;
  addPerDiem: (pd: PerDiemCalculation) => void;
  removePerDiem: (id: string) => void;
  updatePerDiem: (id: string, updates: Partial<PerDiemCalculation>) => void;
  
  // GSA Schedule
  gsaContractInfo: GSAContractInfo | null;
  setGSAContractInfo: (info: GSAContractInfo | null) => void;
  
  // ==================== CALCULATION FUNCTIONS (Audit-Ready) ====================
  
  calculateFullyBurdenedRate: (
    baseSalary: number, 
    includeProfit?: boolean,
    profitOverride?: number
  ) => number;
  
  calculateLoadedCost: (baseSalary: number) => number;
  
  calculateEscalatedRate: (baseRate: number, year: number) => number;
  
  getRateBreakdown: (baseSalary: number, includeProfit?: boolean) => {
    baseRate: number;
    fringeAmount: number;
    afterFringe: number;
    overheadAmount: number;
    afterOverhead: number;
    gaAmount: number;
    afterGA: number;
    profitAmount: number;
    fullyBurdenedRate: number;
  };
  
  calculateYearSalaries: (
    role: CompanyRole,
    levelIndex: number,
    startingStepIndex: number,
    contractYears: number
  ) => number[];
  
  // ==================== DERIVED VALUES ====================
  
  // Get total contract years from solicitation
  getTotalContractYears: () => number;
  
  // Get years array for iteration
  getContractYearsArray: () => { key: string; label: string; enabled: boolean }[];
  
  // Legacy compatibility
  costMultipliers: { fringe: number; overhead: number; ga: number };
  setCostMultipliers: (multipliers: { fringe: number; overhead: number; ga: number }) => void;
  profitMargin: number;
  setProfitMargin: (margin: number) => void;
  annualEscalation: number;
  setAnnualEscalation: (rate: number) => void;
}

// ==================== CONTEXT CREATION ====================

const AppContext = createContext<AppContextType | undefined>(undefined);

// ==================== PROVIDER COMPONENT ====================

export function AppProvider({ children }: { children: ReactNode }) {
  
  // ==================== SOLICITATION STATE ====================
  const [solicitation, setSolicitation] = useState<SolicitationInfo>(emptySolicitation);

  const updateSolicitation = (updates: Partial<SolicitationInfo>) => {
    setSolicitation(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    }));
  };

  const resetSolicitation = () => {
    setSolicitation({
      ...emptySolicitation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  // ==================== COMPANY PROFILE (SaaS) ====================
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    id: 'fftc-001',
    name: 'Friends From The City',
    legalName: 'Friends From The City, LLC',
    samUei: 'RA62AG44CFZ8',
    cageCode: '',
    businessSize: 'small',
    naicsCodes: ['541511', '541512', '541519', '541611'],
    gsaContractNumber: '47QTCA23D0076',
    gsaMasSchedule: true,
  });

  // ==================== INDIRECT RATES (From Accountant) ====================
  const [indirectRates, setIndirectRates] = useState<IndirectRates>({
    fringe: 0.211562,
    overhead: 0.342588,
    ga: 0.19831,
    effectiveDate: '2025-01-01',
    fiscalYear: 2026,
    rateType: 'forward-pricing',
    source: 'FFTC Rate Model 202511',
    lastUpdated: '2025-11-25',
  });

  // ==================== PROFIT TARGETS ====================
  const [profitTargets, setProfitTargets] = useState<ProfitTargets>({
    tmDefault: 0.10,
    ffpLowRisk: 0.12,
    ffpMediumRisk: 0.15,
    ffpHighRisk: 0.20,
    gsaDefault: 0.10,
  });

  // ==================== ESCALATION ====================
  const [escalationRates, setEscalationRates] = useState<EscalationRates>({
    laborDefault: 0.03,
    odcDefault: 0.02,
    source: 'BLS Employment Cost Index - Professional and Technical Services',
  });

  // ==================== COMPANY POLICY ====================
  const [companyPolicy, setCompanyPolicy] = useState<CompanyPolicy>({
    standardHours: 2080,
    ptoHours: 144,
    holidayHours: 88,
    sickHours: 40,
    targetBillableHours: 1808,
    overtimeMultiplier: 1.5,
  });

  // ==================== CONTRACT CONFIG ====================
  const [contractType, setContractType] = useState<ContractType>('tm');

  // ==================== COMPANY ROLE LIBRARY ====================
  const [companyRoles, setCompanyRoles] = useState<CompanyRole[]>([
    {
      id: 'cr-1',
      title: 'Product Designer',
      laborCategory: 'UX/UI Designer',
      description: 'User research and product design',
      blsOccCode: '15-1252',
      blsOccTitle: 'Software Developers',
      gsaLaborCategory: 'UX/UI Designer',
      gsaSin: '54151S',
      levels: [
        {
          level: 'IC1',
          levelName: 'Temp',
          yearsExperience: '0-1',
          monthsBeforePromotionReady: 12,
          isTerminal: false,
          steps: [
            { step: 1, salary: 79850, monthsToNextStep: null },
          ]
        },
        {
          level: 'IC2',
          levelName: 'Junior',
          yearsExperience: '0-2',
          monthsBeforePromotionReady: 18,
          isTerminal: false,
          steps: [
            { step: 1, salary: 79850, monthsToNextStep: 12 },
            { step: 2, salary: 82246, monthsToNextStep: null },
          ]
        },
        {
          level: 'IC3',
          levelName: 'Intermediate',
          yearsExperience: '2-4',
          monthsBeforePromotionReady: 24,
          isTerminal: false,
          steps: [
            { step: 1, salary: 103100, monthsToNextStep: 12 },
            { step: 2, salary: 106193, monthsToNextStep: 12 },
            { step: 3, salary: 109379, monthsToNextStep: null },
          ]
        },
        {
          level: 'IC4',
          levelName: 'Senior',
          yearsExperience: '4-7',
          monthsBeforePromotionReady: 30,
          isTerminal: false,
          steps: [
            { step: 1, salary: 133100, monthsToNextStep: 15 },
            { step: 2, salary: 137093, monthsToNextStep: 15 },
            { step: 3, salary: 141206, monthsToNextStep: null },
          ]
        },
        {
          level: 'IC5',
          levelName: 'Staff',
          yearsExperience: '7-10',
          monthsBeforePromotionReady: 36,
          isTerminal: false,
          steps: [
            { step: 1, salary: 169000, monthsToNextStep: 18 },
            { step: 2, salary: 174070, monthsToNextStep: 18 },
            { step: 3, salary: 179292, monthsToNextStep: null },
          ]
        },
        {
          level: 'IC6',
          levelName: 'Principal',
          yearsExperience: '10+',
          monthsBeforePromotionReady: null,
          isTerminal: true,
          steps: [
            { step: 1, salary: 211400, monthsToNextStep: 24 },
            { step: 2, salary: 217742, monthsToNextStep: 24 },
            { step: 3, salary: 224274, monthsToNextStep: null },
          ]
        }
      ]
    },
  ]);

  // ==================== BID-SPECIFIC DATA ====================
  const [recommendedRoles, setRecommendedRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([
    {
      id: 'sub-1',
      companyName: 'Booz Allen Hamilton',
      role: 'Senior Cloud Architect',
      theirRate: 185,
      markupPercent: 15,
      billedRate: 185 * 1.15,
      fte: 1.0,
      years: { base: true, option1: true, option2: true, option3: false, option4: false },
      rateSource: 'Quote',
    },
    {
      id: 'sub-2',
      companyName: 'Deloitte Consulting',
      role: 'Cybersecurity Specialist',
      theirRate: 165,
      markupPercent: 12,
      billedRate: 165 * 1.12,
      fte: 1.0,
      years: { base: true, option1: true, option2: true, option3: false, option4: false },
      rateSource: 'Prior Agreement',
    }
  ]);
  const [odcs, setODCs] = useState<ODCItem[]>([]);
  const [perDiem, setPerDiem] = useState<PerDiemCalculation[]>([
    {
      id: 'pd-1',
      location: 'Washington, DC',
      ratePerDay: 294,
      numberOfDays: 15,
      numberOfPeople: 2,
      totalCost: 8820,
      years: { base: true, option1: true, option2: true, option3: false, option4: false }
    }
  ]);
  const [gsaContractInfo, setGSAContractInfo] = useState<GSAContractInfo | null>(null);

  // ==================== CALCULATION FUNCTIONS ====================

  const calculateFullyBurdenedRate = (
    baseSalary: number,
    includeProfit: boolean = true,
    profitOverride?: number
  ): number => {
    const baseRate = baseSalary / companyPolicy.standardHours;
    const afterFringe = baseRate * (1 + indirectRates.fringe);
    const afterOverhead = afterFringe * (1 + indirectRates.overhead);
    const afterGA = afterOverhead * (1 + indirectRates.ga);
    
    if (includeProfit) {
      const profit = profitOverride ?? profitTargets.tmDefault;
      return afterGA * (1 + profit);
    }
    return afterGA;
  };

  const calculateLoadedCost = (baseSalary: number): number => {
    return calculateFullyBurdenedRate(baseSalary, false);
  };

  const calculateEscalatedRate = (baseRate: number, year: number): number => {
    if (year <= 1) return baseRate;
    return baseRate * Math.pow(1 + escalationRates.laborDefault, year - 1);
  };

  const getRateBreakdown = (baseSalary: number, includeProfit: boolean = true) => {
    const baseRate = baseSalary / companyPolicy.standardHours;
    const fringeAmount = baseRate * indirectRates.fringe;
    const afterFringe = baseRate + fringeAmount;
    const overheadAmount = afterFringe * indirectRates.overhead;
    const afterOverhead = afterFringe + overheadAmount;
    const gaAmount = afterOverhead * indirectRates.ga;
    const afterGA = afterOverhead + gaAmount;
    const profitAmount = includeProfit ? afterGA * profitTargets.tmDefault : 0;
    const fullyBurdenedRate = afterGA + profitAmount;

    return {
      baseRate,
      fringeAmount,
      afterFringe,
      overheadAmount,
      afterOverhead,
      gaAmount,
      afterGA,
      profitAmount,
      fullyBurdenedRate,
    };
  };

  const calculateYearSalaries = (
    role: CompanyRole,
    levelIndex: number,
    startingStepIndex: number,
    contractYears: number
  ): number[] => {
    const level = role.levels[levelIndex];
    if (!level) return [];
    
    const salaries: number[] = [];
    let currentStepIndex = startingStepIndex;
    let monthsInCurrentStep = 0;
    
    for (let year = 0; year < contractYears; year++) {
      const currentStep = level.steps[currentStepIndex];
      if (!currentStep) {
        salaries.push(level.steps[level.steps.length - 1].salary);
        continue;
      }
      
      salaries.push(currentStep.salary);
      
      monthsInCurrentStep += 12;
      
      if (currentStep.monthsToNextStep !== null && 
          monthsInCurrentStep >= currentStep.monthsToNextStep &&
          currentStepIndex < level.steps.length - 1) {
        currentStepIndex++;
        monthsInCurrentStep = monthsInCurrentStep - currentStep.monthsToNextStep;
      }
    }
    
    return salaries;
  };

  // ==================== DERIVED VALUES FROM SOLICITATION ====================

  const getTotalContractYears = (): number => {
    const baseYears = solicitation.periodOfPerformance.baseYear ? 1 : 0;
    return baseYears + solicitation.periodOfPerformance.optionYears;
  };

  const getContractYearsArray = (): { key: string; label: string; enabled: boolean }[] => {
    const years: { key: string; label: string; enabled: boolean }[] = [];
    
    if (solicitation.periodOfPerformance.baseYear) {
      years.push({ key: 'base', label: 'Base Year', enabled: true });
    }
    
    for (let i = 1; i <= solicitation.periodOfPerformance.optionYears; i++) {
      years.push({ 
        key: `option${i}`, 
        label: `Option Year ${i}`, 
        enabled: true 
      });
    }
    
    return years;
  };

  // ==================== ROLE MANAGEMENT ====================

  const addCompanyRole = (role: CompanyRole) => {
    setCompanyRoles([...companyRoles, role]);
  };

  const updateCompanyRole = (id: string, updates: Partial<CompanyRole>) => {
    setCompanyRoles(companyRoles.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeCompanyRole = (id: string) => {
    setCompanyRoles(companyRoles.filter(r => r.id !== id));
  };

  const addRole = (role: Role) => {
    setSelectedRoles([...selectedRoles, role]);
  };

  const removeRole = (id: string) => {
    setSelectedRoles(selectedRoles.filter(r => r.id !== id));
  };

  const updateRole = (id: string, updates: Partial<Role>) => {
    setSelectedRoles(selectedRoles.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  // ==================== SUBCONTRACTOR MANAGEMENT ====================

  const addSubcontractor = (sub: Subcontractor) => {
    setSubcontractors([...subcontractors, sub]);
  };

  const removeSubcontractor = (id: string) => {
    setSubcontractors(subcontractors.filter(s => s.id !== id));
  };

  const updateSubcontractor = (id: string, updates: Partial<Subcontractor>) => {
    setSubcontractors(subcontractors.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // ==================== ODC MANAGEMENT ====================

  const addODC = (odc: ODCItem) => {
    setODCs([...odcs, odc]);
  };

  const removeODC = (id: string) => {
    setODCs(odcs.filter(o => o.id !== id));
  };

  const updateODC = (id: string, updates: Partial<ODCItem>) => {
    setODCs(odcs.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  // ==================== PER DIEM MANAGEMENT ====================

  const addPerDiem = (pd: PerDiemCalculation) => {
    setPerDiem([...perDiem, pd]);
  };

  const removePerDiem = (id: string) => {
    setPerDiem(perDiem.filter(p => p.id !== id));
  };

  const updatePerDiem = (id: string, updates: Partial<PerDiemCalculation>) => {
    setPerDiem(perDiem.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // ==================== LEGACY COMPATIBILITY ====================

  const costMultipliers = {
    fringe: indirectRates.fringe,
    overhead: indirectRates.overhead,
    ga: indirectRates.ga,
  };

  const setCostMultipliers = (multipliers: { fringe: number; overhead: number; ga: number }) => {
    setIndirectRates({
      ...indirectRates,
      fringe: multipliers.fringe,
      overhead: multipliers.overhead,
      ga: multipliers.ga,
    });
  };

  const profitMargin = profitTargets.tmDefault * 100;
  const setProfitMargin = (margin: number) => {
    setProfitTargets({
      ...profitTargets,
      tmDefault: margin / 100,
    });
  };

  const annualEscalation = escalationRates.laborDefault * 100;
  const setAnnualEscalation = (rate: number) => {
    setEscalationRates({
      ...escalationRates,
      laborDefault: rate / 100,
    });
  };

  // ==================== CONTEXT VALUE ====================

  const value: AppContextType = {
    // Solicitation
    solicitation,
    setSolicitation,
    updateSolicitation,
    resetSolicitation,
    
    // Company Profile
    companyProfile,
    setCompanyProfile,
    
    // Indirect Rates
    indirectRates,
    setIndirectRates,
    
    // Profit Targets
    profitTargets,
    setProfitTargets,
    
    // Escalation
    escalationRates,
    setEscalationRates,
    
    // Company Policy
    companyPolicy,
    setCompanyPolicy,
    
    // Contract Config
    contractType,
    setContractType,
    
    // Company Roles
    companyRoles,
    setCompanyRoles,
    addCompanyRole,
    updateCompanyRole,
    removeCompanyRole,
    
    // Bid Roles
    recommendedRoles,
    setRecommendedRoles,
    selectedRoles,
    setSelectedRoles,
    addRole,
    removeRole,
    updateRole,
    
    // Subcontractors
    subcontractors,
    setSubcontractors,
    addSubcontractor,
    removeSubcontractor,
    updateSubcontractor,
    
    // ODCs
    odcs,
    setODCs,
    addODC,
    removeODC,
    updateODC,
    
    // Per Diem
    perDiem,
    setPerDiem,
    addPerDiem,
    removePerDiem,
    updatePerDiem,
    
    // GSA
    gsaContractInfo,
    setGSAContractInfo,
    
    // Calculations (Audit-Ready)
    calculateFullyBurdenedRate,
    calculateLoadedCost,
    calculateEscalatedRate,
    getRateBreakdown,
    calculateYearSalaries,
    
    // Derived values
    getTotalContractYears,
    getContractYearsArray,
    
    // Legacy compatibility
    costMultipliers,
    setCostMultipliers,
    profitMargin,
    setProfitMargin,
    annualEscalation,
    setAnnualEscalation,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ==================== HOOK ====================

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}