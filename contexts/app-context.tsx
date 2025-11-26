'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// ==================== TYPE DEFINITIONS ====================

export type ContractType = 'tm' | 'ffp' | 'gsa';

// ==================== COMPANY PROFILE (SaaS-Ready) ====================
// Each company using TrueBid will have their own profile

export interface CompanyProfile {
  id: string;
  name: string;
  legalName: string;
  samUei: string;
  cageCode: string;
  businessSize: 'small' | 'other-than-small';
  naicsCodes: string[];
  // GSA Contract Info (if applicable)
  gsaContractNumber?: string;
  gsaMasSchedule?: boolean;
}

// ==================== INDIRECT RATES (Audit-Ready) ====================
// These rates come from your accountant/DCAA-approved rates

export interface IndirectRates {
  // Core rates (from accountant)
  fringe: number;      // Benefits, payroll taxes, PTO value
  overhead: number;    // Facilities, tools, management
  ga: number;          // G&A - executive, legal, BD costs
  
  // Rate basis
  effectiveDate: string;
  fiscalYear: number;
  rateType: 'provisional' | 'final' | 'billing' | 'forward-pricing';
  
  // Audit trail
  source: string;      // e.g., "DCAA Approved" or "CPA Prepared"
  lastUpdated: string;
}

// ==================== PROFIT TARGETS ====================

export interface ProfitTargets {
  tmDefault: number;       // T&M contracts (typically 8-12%)
  ffpLowRisk: number;      // FFP - low risk (12-15%)
  ffpMediumRisk: number;   // FFP - medium risk (15-18%)
  ffpHighRisk: number;     // FFP - high risk (18-25%)
  gsaDefault: number;      // GSA task orders (margin from ceiling)
}

// ==================== ESCALATION RATES ====================

export interface EscalationRates {
  laborDefault: number;    // Annual labor escalation (typically 2-4%)
  odcDefault: number;      // ODC escalation
  source: string;          // e.g., "BLS Employment Cost Index"
}

// ==================== COMPANY POLICY ====================

export interface CompanyPolicy {
  // Hours basis
  standardHours: number;   // 2080 (52 weeks × 40 hours)
  
  // Leave policy (used in fringe calculation, NOT subtracted from billable)
  ptoHours: number;        // Paid time off
  holidayHours: number;    // Federal holidays
  sickHours: number;       // Sick leave
  
  // Billable hours (for project planning, NOT rate calculation)
  // Rate calculation always uses 2080; billable hours affect project cost
  targetBillableHours: number;
  
  // Other
  overtimeMultiplier: number;
}

// ==================== ROLE DEFINITIONS ====================

export interface CompanyRoleStep {
  step: number;
  salary: number;
  monthsToNextStep: number | null;
}

export interface CompanyRoleLevel {
  level: string;           // "IC1", "IC2", "IC3", "IC4", "IC5", "IC6"
  levelName: string;       // "Entry", "Junior", "Intermediate", "Senior", "Staff", "Principal"
  steps: CompanyRoleStep[];
  monthsBeforePromotionReady: number | null;
  isTerminal: boolean;
  yearsExperience: string; // e.g., "0-1", "2-4", "5-8"
}

export interface CompanyRole {
  id: string;
  title: string;
  laborCategory: string;
  description: string;
  levels: CompanyRoleLevel[];
  // BLS mapping for rate justification
  blsOccCode?: string;
  blsOccTitle?: string;
  // GSA mapping
  gsaLaborCategory?: string;
  gsaSin?: string;
  // SCA mapping (for service contracts)
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
  // For audit trail
  rateSource?: string;      // "Quote", "Prior Agreement", "Market Research"
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
  // For audit trail
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
  iffRate: number;          // Industrial Funding Fee (0.75%)
  sins: {
    sin: string;
    name: string;
    laborCategories: GSALaborCategory[];
  }[];
}

// ==================== CONTEXT INTERFACE ====================

interface AppContextType {
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
  
  /**
   * Calculate fully burdened rate from base salary
   * Formula: (Salary / 2080) × (1 + Fringe) × (1 + OH) × (1 + G&A) × (1 + Profit)
   * 
   * @param baseSalary - Annual base salary
   * @param includeProfit - Whether to include profit margin (T&M yes, FFP no, GSA no)
   * @param profitOverride - Override default profit margin
   */
  calculateFullyBurdenedRate: (
    baseSalary: number, 
    includeProfit?: boolean,
    profitOverride?: number
  ) => number;
  
  /**
   * Calculate loaded cost (no profit) for margin analysis
   */
  calculateLoadedCost: (baseSalary: number) => number;
  
  /**
   * Calculate rate with escalation for multi-year contracts
   */
  calculateEscalatedRate: (baseRate: number, year: number) => number;
  
  /**
   * Get rate breakdown for audit documentation
   */
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
  
  /**
   * Calculate year-by-year salaries with step progression
   */
  calculateYearSalaries: (
    role: CompanyRole,
    levelIndex: number,
    startingStepIndex: number,
    contractYears: number
  ) => number[];
  
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
    // Actual rates from FFTC Rate Model (202511)
    fringe: 0.211562,      // 21.1562%
    overhead: 0.342588,    // 34.2588%
    ga: 0.19831,           // 19.831%
    
    effectiveDate: '2025-01-01',
    fiscalYear: 2026,
    rateType: 'forward-pricing',
    source: 'FFTC Rate Model 202511',
    lastUpdated: '2025-11-25',
  });

  // ==================== PROFIT TARGETS ====================
  const [profitTargets, setProfitTargets] = useState<ProfitTargets>({
    tmDefault: 0.10,        // 10% for T&M
    ffpLowRisk: 0.12,       // 12% for low-risk FFP
    ffpMediumRisk: 0.15,    // 15% for medium-risk FFP
    ffpHighRisk: 0.20,      // 20% for high-risk FFP
    gsaDefault: 0.10,       // GSA ceiling includes ~10% profit
  });

  // ==================== ESCALATION ====================
  const [escalationRates, setEscalationRates] = useState<EscalationRates>({
    laborDefault: 0.03,     // 3% per BLS Employment Cost Index
    odcDefault: 0.02,       // 2% for ODCs
    source: 'BLS Employment Cost Index - Professional and Technical Services',
  });

  // ==================== COMPANY POLICY ====================
  const [companyPolicy, setCompanyPolicy] = useState<CompanyPolicy>({
    standardHours: 2080,    // Always 2080 for rate calculation
    ptoHours: 144,          // 18 days
    holidayHours: 88,       // 11 federal holidays
    sickHours: 40,          // 5 days
    targetBillableHours: 1808,  // For project planning
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
    {
      id: 'cr-2',
      title: 'Backend Engineer',
      laborCategory: 'Developer',
      description: 'Backend software development',
      blsOccCode: '15-1252',
      blsOccTitle: 'Software Developers',
      gsaLaborCategory: 'Developer',
      gsaSin: '54151S',
      levels: [
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
    {
      id: 'cr-3',
      title: 'Full Stack Engineer',
      laborCategory: 'Developer',
      description: 'Full-stack software development',
      blsOccCode: '15-1252',
      blsOccTitle: 'Software Developers',
      gsaLaborCategory: 'Developer',
      gsaSin: '54151S',
      levels: [
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
    {
      id: 'cr-4',
      title: 'Frontend Engineer',
      laborCategory: 'Developer',
      description: 'Frontend software development',
      blsOccCode: '15-1252',
      blsOccTitle: 'Software Developers',
      gsaLaborCategory: 'Developer',
      gsaSin: '54151S',
      levels: [
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
    {
      id: 'cr-5',
      title: 'Content Writer',
      laborCategory: 'Content Strategy',
      description: 'Content strategy and writing',
      blsOccCode: '15-1299',
      blsOccTitle: 'Computer Occupations, All Other',
      gsaLaborCategory: 'Content Strategy',
      gsaSin: '54151S',
      levels: [
        {
          level: 'IC2',
          levelName: 'Junior',
          yearsExperience: '0-2',
          monthsBeforePromotionReady: 18,
          isTerminal: false,
          steps: [
            { step: 1, salary: 52660, monthsToNextStep: 12 },
            { step: 2, salary: 54240, monthsToNextStep: null },
          ]
        },
        {
          level: 'IC3',
          levelName: 'Intermediate',
          yearsExperience: '2-4',
          monthsBeforePromotionReady: 24,
          isTerminal: false,
          steps: [
            { step: 1, salary: 76357, monthsToNextStep: 12 },
            { step: 2, salary: 78648, monthsToNextStep: 12 },
            { step: 3, salary: 81007, monthsToNextStep: null },
          ]
        },
        {
          level: 'IC4',
          levelName: 'Senior',
          yearsExperience: '4-7',
          monthsBeforePromotionReady: 30,
          isTerminal: false,
          steps: [
            { step: 1, salary: 108971, monthsToNextStep: 15 },
            { step: 2, salary: 112240, monthsToNextStep: 15 },
            { step: 3, salary: 115607, monthsToNextStep: null },
          ]
        },
        {
          level: 'IC5',
          levelName: 'Staff',
          yearsExperience: '7-10',
          monthsBeforePromotionReady: 36,
          isTerminal: false,
          steps: [
            { step: 1, salary: 147534, monthsToNextStep: 18 },
            { step: 2, salary: 151960, monthsToNextStep: 18 },
            { step: 3, salary: 156519, monthsToNextStep: null },
          ]
        },
        {
          level: 'IC6',
          levelName: 'Principal',
          yearsExperience: '10+',
          monthsBeforePromotionReady: null,
          isTerminal: true,
          steps: [
            { step: 1, salary: 176800, monthsToNextStep: 24 },
            { step: 2, salary: 182104, monthsToNextStep: 24 },
            { step: 3, salary: 187567, monthsToNextStep: null },
          ]
        }
      ]
    },
    {
      id: 'cr-6',
      title: 'DevOps Engineer',
      laborCategory: 'Digital Transformer',
      description: 'DevOps and cloud infrastructure',
      blsOccCode: '15-1253',
      blsOccTitle: 'Software Quality Assurance Analysts and Testers',
      gsaLaborCategory: 'Digital Transformer',
      gsaSin: '54151S',
      levels: [
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
    {
      id: 'cr-7',
      title: 'UX Researcher',
      laborCategory: 'Subject Matter Expert',
      description: 'User experience research',
      blsOccCode: '15-1220',
      blsOccTitle: 'Computer and Information Research Scientists',
      gsaLaborCategory: 'Subject Matter Expert I',
      gsaSin: '541910',
      levels: [
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
    {
      id: 'cr-8',
      title: 'Product Manager',
      laborCategory: 'Product / Program Manager',
      description: 'Product management and strategy',
      blsOccCode: '11-1021',
      blsOccTitle: 'General and Operations Managers',
      gsaLaborCategory: 'Product / Program Manager',
      gsaSin: '54151S',
      levels: [
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
    {
      id: 'cr-9',
      title: 'Delivery Manager',
      laborCategory: 'IT Training',
      description: 'Delivery and project management',
      blsOccCode: '15-1220',
      blsOccTitle: 'Computer and Information Research Scientists',
      gsaLaborCategory: 'IT Training',
      gsaSin: '54151S',
      levels: [
        {
          level: 'IC4',
          levelName: 'Delivery Manager',
          yearsExperience: '6-8',
          monthsBeforePromotionReady: 30,
          isTerminal: false,
          steps: [
            { step: 1, salary: 123000, monthsToNextStep: 15 },
            { step: 2, salary: 126690, monthsToNextStep: 15 },
            { step: 3, salary: 130491, monthsToNextStep: null },
          ]
        },
        {
          level: 'IC5',
          levelName: 'Sr. Delivery Manager',
          yearsExperience: '8+',
          monthsBeforePromotionReady: null,
          isTerminal: true,
          steps: [
            { step: 1, salary: 135000, monthsToNextStep: 18 },
            { step: 2, salary: 139050, monthsToNextStep: 18 },
            { step: 3, salary: 143222, monthsToNextStep: null },
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

  /**
   * Calculate fully burdened rate from base salary
   * This is the audit-ready calculation matching the accountant's model
   */
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

  /**
   * Calculate loaded cost (no profit) for margin analysis
   */
  const calculateLoadedCost = (baseSalary: number): number => {
    return calculateFullyBurdenedRate(baseSalary, false);
  };

  /**
   * Calculate rate with escalation for multi-year contracts
   */
  const calculateEscalatedRate = (baseRate: number, year: number): number => {
    if (year <= 1) return baseRate;
    return baseRate * Math.pow(1 + escalationRates.laborDefault, year - 1);
  };

  /**
   * Get rate breakdown for audit documentation
   */
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

  /**
   * Calculate year-by-year salaries with step progression
   */
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
  // These maintain backwards compatibility with existing components

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

  // Legacy calculateLoadedRate for backwards compatibility
  const calculateLoadedRate = (baseSalary: number, includeProfit: boolean = true): number => {
    return calculateFullyBurdenedRate(baseSalary, includeProfit);
  };

  // ==================== CONTEXT VALUE ====================

  const value: AppContextType = {
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