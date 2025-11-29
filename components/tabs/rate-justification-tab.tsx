'use client'

import React, { useState, useMemo } from 'react'
import { 
  TrendingUp,
  TrendingDown,
  Building2,
  FileText,
  Download,
  Calendar,
  Info,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Award,
  Calculator,
  HelpCircle,
  Users,
  Pencil,
  Shield,
  AlertTriangle,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppContext } from '@/contexts/app-context'

// ==================== TYPES ====================

type SectionType = 'bls' | 'gsa' | 'export'

// Role display type for this tab (derived from context)
interface RoleDisplay {
  id: string
  title: string
  level: string
  salary: number
  hourlyRate: number
  fte: number
  isPrime?: boolean
  companyName?: string
  theirRate?: number
  billedRate?: number
  markupPercent?: number
}

// Justification for premium rates
interface RoleJustification {
  roleId: string
  roleTitle: string
  percentile: number
  selectedReasons: {
    clearance?: string
    location?: string
    certifications?: string[]
    keyPersonnel?: boolean
    nicheSkills?: boolean
    experience?: string
    pastPerformance?: boolean
  }
  notes: string
  savedAt: string
}

interface BLSData {
  socCode: string
  occupation: string
  percentile10: number
  percentile25: number
  median: number
  percentile75: number
  percentile90: number
  mean: number
  lastUpdated: string
  dataSource: string
}

interface GSACompetitor {
  id: string
  vendor: string
  laborCategory: string
  sin: string
  rate: number
  education: string
  yearsExp: number
  contractNumber: string
  awardYear: number
  region: string
}

// ==================== BLS DATA MAPPINGS ====================
// Maps common role titles to BLS SOC codes and data
// In production, this would come from an API

const BLS_MAPPINGS: { [key: string]: BLSData } = {
  // Technical Leadership
  'Technical Lead': {
    socCode: '11-3021',
    occupation: 'Computer and Information Systems Managers',
    percentile10: 98890,
    percentile25: 128230,
    median: 169510,
    percentile75: 217200,
    percentile90: 267620,
    mean: 179780,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  'Solutions Architect': {
    socCode: '15-1299',
    occupation: 'Computer Occupations, All Other',
    percentile10: 62480,
    percentile25: 88450,
    median: 118370,
    percentile75: 153050,
    percentile90: 189170,
    mean: 121370,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  // Software Development
  'Senior Software Engineer': {
    socCode: '15-1252',
    occupation: 'Software Developers',
    percentile10: 77020,
    percentile25: 103690,
    median: 132270,
    percentile75: 168570,
    percentile90: 208620,
    mean: 139380,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  'Software Engineer': {
    socCode: '15-1252',
    occupation: 'Software Developers',
    percentile10: 77020,
    percentile25: 103690,
    median: 132270,
    percentile75: 168570,
    percentile90: 208620,
    mean: 139380,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  'Software Developer': {
    socCode: '15-1252',
    occupation: 'Software Developers',
    percentile10: 77020,
    percentile25: 103690,
    median: 132270,
    percentile75: 168570,
    percentile90: 208620,
    mean: 139380,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  // DevOps / Infrastructure - Map to Software Developers (modern DevOps is software engineering)
  'DevOps Engineer': {
    socCode: '15-1252',
    occupation: 'Software Developers',
    percentile10: 77020,
    percentile25: 103690,
    median: 132270,
    percentile75: 168570,
    percentile90: 208620,
    mean: 139380,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  'Systems Administrator': {
    socCode: '15-1244',
    occupation: 'Network and Computer Systems Administrators',
    percentile10: 52700,
    percentile25: 65000,
    median: 90520,
    percentile75: 119220,
    percentile90: 148820,
    mean: 96900,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  'Cloud Engineer': {
    socCode: '15-1252',
    occupation: 'Software Developers',
    percentile10: 77020,
    percentile25: 103690,
    median: 132270,
    percentile75: 168570,
    percentile90: 208620,
    mean: 139380,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  'Site Reliability Engineer': {
    socCode: '15-1252',
    occupation: 'Software Developers',
    percentile10: 77020,
    percentile25: 103690,
    median: 132270,
    percentile75: 168570,
    percentile90: 208620,
    mean: 139380,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  // Data / Analytics
  'Data Scientist': {
    socCode: '15-2051',
    occupation: 'Data Scientists',
    percentile10: 61090,
    percentile25: 85560,
    median: 108020,
    percentile75: 141330,
    percentile90: 178440,
    mean: 113310,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  'Data Engineer': {
    socCode: '15-1252',
    occupation: 'Software Developers',
    percentile10: 77020,
    percentile25: 103690,
    median: 132270,
    percentile75: 168570,
    percentile90: 208620,
    mean: 139380,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  // Security
  'Security Engineer': {
    socCode: '15-1212',
    occupation: 'Information Security Analysts',
    percentile10: 64280,
    percentile25: 84100,
    median: 120360,
    percentile75: 156230,
    percentile90: 188150,
    mean: 125750,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  'Cybersecurity Analyst': {
    socCode: '15-1212',
    occupation: 'Information Security Analysts',
    percentile10: 64280,
    percentile25: 84100,
    median: 120360,
    percentile75: 156230,
    percentile90: 188150,
    mean: 125750,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  // QA / Testing
  'QA Engineer': {
    socCode: '15-1253',
    occupation: 'Software Quality Assurance Analysts and Testers',
    percentile10: 51350,
    percentile25: 71290,
    median: 101800,
    percentile75: 130870,
    percentile90: 158830,
    mean: 104090,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  'Test Engineer': {
    socCode: '15-1253',
    occupation: 'Software Quality Assurance Analysts and Testers',
    percentile10: 51350,
    percentile25: 71290,
    median: 101800,
    percentile75: 130870,
    percentile90: 158830,
    mean: 104090,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  // Design
  'UI/UX Designer': {
    socCode: '15-1255',
    occupation: 'Web and Digital Interface Designers',
    percentile10: 41810,
    percentile25: 57220,
    median: 80730,
    percentile75: 109890,
    percentile90: 142980,
    mean: 85560,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  'UX Designer': {
    socCode: '15-1255',
    occupation: 'Web and Digital Interface Designers',
    percentile10: 41810,
    percentile25: 57220,
    median: 80730,
    percentile75: 109890,
    percentile90: 142980,
    mean: 85560,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  // Project Management
  'Project Manager': {
    socCode: '11-9199',
    occupation: 'Managers, All Other',
    percentile10: 62610,
    percentile25: 89030,
    median: 125540,
    percentile75: 172770,
    percentile90: 224080,
    mean: 135960,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  'Program Manager': {
    socCode: '11-9199',
    occupation: 'Managers, All Other',
    percentile10: 62610,
    percentile25: 89030,
    median: 125540,
    percentile75: 172770,
    percentile90: 224080,
    mean: 135960,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  // Business Analysis
  'Business Analyst': {
    socCode: '13-1111',
    occupation: 'Management Analysts',
    percentile10: 52250,
    percentile25: 71500,
    median: 99410,
    percentile75: 137160,
    percentile90: 175080,
    mean: 107640,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  'Systems Analyst': {
    socCode: '15-1211',
    occupation: 'Computer Systems Analysts',
    percentile10: 58150,
    percentile25: 77640,
    median: 102240,
    percentile75: 130720,
    percentile90: 161580,
    mean: 105010,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  },
  // Default fallback for unmapped roles
  'DEFAULT': {
    socCode: '15-1299',
    occupation: 'Computer Occupations, All Other',
    percentile10: 62480,
    percentile25: 88450,
    median: 118370,
    percentile75: 153050,
    percentile90: 189170,
    mean: 121370,
    lastUpdated: '2024-05-01',
    dataSource: 'BLS OEWS Survey'
  }
}

// Function to find best BLS match for a role title
const findBLSData = (roleTitle: string): BLSData | null => {
  if (!roleTitle) return null
  
  // Direct match
  if (BLS_MAPPINGS[roleTitle]) {
    return BLS_MAPPINGS[roleTitle]
  }
  
  // Partial match - check if any key is contained in the role title
  const lowerTitle = roleTitle.toLowerCase()
  for (const [key, data] of Object.entries(BLS_MAPPINGS)) {
    if (key !== 'DEFAULT' && lowerTitle.includes(key.toLowerCase())) {
      return data
    }
  }
  
  // Check for common keywords
  if (lowerTitle.includes('engineer') && lowerTitle.includes('software')) {
    return BLS_MAPPINGS['Software Engineer']
  }
  if (lowerTitle.includes('lead') || lowerTitle.includes('architect')) {
    return BLS_MAPPINGS['Technical Lead']
  }
  if (lowerTitle.includes('devops') || lowerTitle.includes('cloud') || lowerTitle.includes('infrastructure')) {
    return BLS_MAPPINGS['DevOps Engineer']
  }
  if (lowerTitle.includes('security') || lowerTitle.includes('cyber')) {
    return BLS_MAPPINGS['Security Engineer']
  }
  if (lowerTitle.includes('data') && lowerTitle.includes('scien')) {
    return BLS_MAPPINGS['Data Scientist']
  }
  if (lowerTitle.includes('qa') || lowerTitle.includes('test') || lowerTitle.includes('quality')) {
    return BLS_MAPPINGS['QA Engineer']
  }
  if (lowerTitle.includes('design') || lowerTitle.includes('ux') || lowerTitle.includes('ui')) {
    return BLS_MAPPINGS['UI/UX Designer']
  }
  if (lowerTitle.includes('project') || lowerTitle.includes('program')) {
    return BLS_MAPPINGS['Project Manager']
  }
  if (lowerTitle.includes('analyst')) {
    return BLS_MAPPINGS['Business Analyst']
  }
  
  // Return default if no match found
  return BLS_MAPPINGS['DEFAULT']
}

// ==================== GSA COMPETITOR DATA ====================
// Mock GSA data - in production this would come from GSA CALC API

const GSA_COMPETITORS: GSACompetitor[] = [
  // Senior Software Engineers
  {
    id: '1',
    vendor: 'Booz Allen Hamilton',
    laborCategory: 'Senior Software Engineer',
    sin: '54151S',
    rate: 185.00,
    education: 'BS',
    yearsExp: 8,
    contractNumber: 'GS-35F-0119Y',
    awardYear: 2023,
    region: 'National'
  },
  {
    id: '2',
    vendor: 'Deloitte Consulting LLP',
    laborCategory: 'Senior Software Engineer',
    sin: '54151S',
    rate: 210.00,
    education: 'MS',
    yearsExp: 5,
    contractNumber: 'GS-35F-0456K',
    awardYear: 2024,
    region: 'National'
  },
  {
    id: '3',
    vendor: 'SAIC',
    laborCategory: 'Senior Software Engineer',
    sin: '54151S',
    rate: 165.00,
    education: 'BS',
    yearsExp: 6,
    contractNumber: 'GS-35F-0783N',
    awardYear: 2023,
    region: 'National'
  },
  {
    id: '4',
    vendor: 'Accenture Federal Services',
    laborCategory: 'Senior Software Engineer',
    sin: '54151S',
    rate: 195.00,
    education: 'BS',
    yearsExp: 8,
    contractNumber: 'GS-35F-0291P',
    awardYear: 2024,
    region: 'National'
  },
  // Technical Leads
  {
    id: '5',
    vendor: 'CACI International',
    laborCategory: 'Technical Lead',
    sin: '54151S',
    rate: 215.00,
    education: 'MS',
    yearsExp: 10,
    contractNumber: 'GS-35F-0547H',
    awardYear: 2023,
    region: 'National'
  },
  {
    id: '6',
    vendor: 'Leidos',
    laborCategory: 'Technical Lead',
    sin: '54151S',
    rate: 225.00,
    education: 'BS',
    yearsExp: 12,
    contractNumber: 'GS-35F-0892M',
    awardYear: 2024,
    region: 'National'
  },
  {
    id: '7',
    vendor: 'Northrop Grumman',
    laborCategory: 'Technical Lead',
    sin: '54151S',
    rate: 235.00,
    education: 'MS',
    yearsExp: 15,
    contractNumber: 'GS-35F-0123T',
    awardYear: 2024,
    region: 'National'
  },
  // DevOps Engineers
  {
    id: '8',
    vendor: 'General Dynamics IT',
    laborCategory: 'DevOps Engineer',
    sin: '54151S',
    rate: 145.00,
    education: 'BS',
    yearsExp: 5,
    contractNumber: 'GS-35F-0234L',
    awardYear: 2023,
    region: 'National'
  },
  {
    id: '9',
    vendor: 'ManTech',
    laborCategory: 'DevOps Engineer',
    sin: '54151S',
    rate: 135.00,
    education: 'AS',
    yearsExp: 4,
    contractNumber: 'GS-35F-0678R',
    awardYear: 2024,
    region: 'National'
  },
  {
    id: '10',
    vendor: 'Peraton',
    laborCategory: 'DevOps Engineer',
    sin: '54151S',
    rate: 155.00,
    education: 'BS',
    yearsExp: 6,
    contractNumber: 'GS-35F-0345Q',
    awardYear: 2024,
    region: 'National'
  },
  // Software Engineers (mid-level)
  {
    id: '11',
    vendor: 'CGI Federal',
    laborCategory: 'Software Engineer',
    sin: '54151S',
    rate: 145.00,
    education: 'BS',
    yearsExp: 4,
    contractNumber: 'GS-35F-0567W',
    awardYear: 2023,
    region: 'National'
  },
  {
    id: '12',
    vendor: 'ICF',
    laborCategory: 'Software Engineer',
    sin: '54151S',
    rate: 138.00,
    education: 'BS',
    yearsExp: 3,
    contractNumber: 'GS-35F-0789X',
    awardYear: 2024,
    region: 'National'
  },
  // Data Scientists
  {
    id: '13',
    vendor: 'Palantir',
    laborCategory: 'Data Scientist',
    sin: '54151S',
    rate: 225.00,
    education: 'PhD',
    yearsExp: 5,
    contractNumber: 'GS-35F-0890Z',
    awardYear: 2024,
    region: 'National'
  },
  {
    id: '14',
    vendor: 'Booz Allen Hamilton',
    laborCategory: 'Data Scientist',
    sin: '54151S',
    rate: 195.00,
    education: 'MS',
    yearsExp: 6,
    contractNumber: 'GS-35F-0119Y',
    awardYear: 2023,
    region: 'National'
  },
  // Security Engineers
  {
    id: '15',
    vendor: 'CrowdStrike',
    laborCategory: 'Security Engineer',
    sin: '54151S',
    rate: 185.00,
    education: 'BS',
    yearsExp: 7,
    contractNumber: 'GS-35F-0456A',
    awardYear: 2024,
    region: 'National'
  },
  {
    id: '16',
    vendor: 'Palo Alto Networks',
    laborCategory: 'Security Engineer',
    sin: '54151S',
    rate: 175.00,
    education: 'BS',
    yearsExp: 5,
    contractNumber: 'GS-35F-0567B',
    awardYear: 2023,
    region: 'National'
  },
  // QA Engineers
  {
    id: '17',
    vendor: 'Accenture Federal Services',
    laborCategory: 'QA Engineer',
    sin: '54151S',
    rate: 125.00,
    education: 'BS',
    yearsExp: 4,
    contractNumber: 'GS-35F-0291P',
    awardYear: 2024,
    region: 'National'
  },
  {
    id: '18',
    vendor: 'SAIC',
    laborCategory: 'QA Engineer',
    sin: '54151S',
    rate: 115.00,
    education: 'BS',
    yearsExp: 3,
    contractNumber: 'GS-35F-0783N',
    awardYear: 2023,
    region: 'National'
  },
  // Project Managers
  {
    id: '19',
    vendor: 'Deloitte Consulting LLP',
    laborCategory: 'Project Manager',
    sin: '54151S',
    rate: 195.00,
    education: 'MBA',
    yearsExp: 10,
    contractNumber: 'GS-35F-0456K',
    awardYear: 2024,
    region: 'National'
  },
  {
    id: '20',
    vendor: 'KPMG',
    laborCategory: 'Project Manager',
    sin: '54151S',
    rate: 185.00,
    education: 'BS',
    yearsExp: 8,
    contractNumber: 'GS-35F-0678C',
    awardYear: 2023,
    region: 'National'
  }
]

// Function to find GSA competitors for a role
const findGSACompetitors = (roleTitle: string): GSACompetitor[] => {
  if (!roleTitle) return []
  
  const lowerTitle = roleTitle.toLowerCase()
  
  return GSA_COMPETITORS.filter(competitor => {
    const lowerCategory = competitor.laborCategory.toLowerCase()
    
    // Exact match (case insensitive) - always allow
    if (lowerTitle === lowerCategory) {
      return true
    }
    
    // SPECIFIC MAPPINGS FIRST - these take priority to avoid false positives
    
    // "Senior Software Engineer" should ONLY match "Senior Software Engineer"
    if (lowerTitle.includes('senior') && lowerTitle.includes('software') && lowerTitle.includes('engineer')) {
      return lowerCategory === 'senior software engineer'
    }
    
    // Plain "Software Engineer" (no senior) can match both
    if (lowerTitle.includes('software') && lowerTitle.includes('engineer') && !lowerTitle.includes('senior')) {
      return lowerCategory === 'software engineer' || lowerCategory === 'senior software engineer'
    }
    
    // DevOps specific - must come before generic "engineer" check
    if (lowerTitle.includes('devops')) {
      return lowerCategory === 'devops engineer'
    }
    
    // Security specific
    if (lowerTitle.includes('security') || lowerTitle.includes('cyber')) {
      return lowerCategory === 'security engineer'
    }
    
    // Technical Lead / Architect mappings
    if (lowerTitle.includes('technical lead') || lowerTitle.includes('tech lead') || 
        (lowerTitle.includes('lead') && !lowerTitle.includes('software') && !lowerTitle.includes('devops'))) {
      return lowerCategory === 'technical lead'
    }
    
    if (lowerTitle.includes('architect') && !lowerTitle.includes('software')) {
      return lowerCategory === 'technical lead'
    }
    
    // Data specific
    if (lowerTitle.includes('data scientist') || lowerTitle.includes('data analyst')) {
      return lowerCategory === 'data scientist'
    }
    
    // QA specific
    if (lowerTitle.includes('qa') || lowerTitle.includes('quality assurance') || lowerTitle.includes('test engineer')) {
      return lowerCategory === 'qa engineer'
    }
    
    // Project Manager specific
    if (lowerTitle.includes('project manager') || lowerTitle.includes('program manager')) {
      return lowerCategory === 'project manager'
    }
    
    // GENERIC FALLBACK - only if no specific rule matched above
    // Role title contains the full category name
    if (lowerTitle.includes(lowerCategory)) {
      return true
    }
    
    return false
  })
}

// ==================== FAR TOOLTIPS ====================

const farTooltips = {
  priceAnalysis: {
    clause: 'FAR 15.404-1',
    title: 'Proposal Analysis Techniques',
    description: 'Price analysis shall be used when cost or pricing data are not required. Techniques include comparison with competitive prices, published price lists, and independent government estimates.'
  },
  adequateCompetition: {
    clause: 'FAR 15.403-1(c)(1)',
    title: 'Adequate Price Competition',
    description: 'When adequate price competition exists, contracting officers may rely on the competition to establish price reasonableness.'
  },
  blsData: {
    clause: 'FAR 22.1002',
    title: 'Wage Determinations',
    description: 'BLS data provides nationally recognized wage statistics used to support labor rate reasonableness in federal contracting.'
  }
}

// ==================== HELPER FUNCTIONS ====================

const calculatePercentile = (salary: number, blsData: BLSData): number => {
  if (salary <= blsData.percentile10) return 10
  if (salary <= blsData.percentile25) return 10 + ((salary - blsData.percentile10) / (blsData.percentile25 - blsData.percentile10)) * 15
  if (salary <= blsData.median) return 25 + ((salary - blsData.percentile25) / (blsData.median - blsData.percentile25)) * 25
  if (salary <= blsData.percentile75) return 50 + ((salary - blsData.median) / (blsData.percentile75 - blsData.median)) * 25
  if (salary <= blsData.percentile90) return 75 + ((salary - blsData.percentile75) / (blsData.percentile90 - blsData.percentile75)) * 15
  return 90 + Math.min(10, ((salary - blsData.percentile90) / blsData.percentile90) * 100)
}

const getPercentileStatus = (percentile: number): { 
  color: string
  borderColor: string
  label: string
  description: string 
} => {
  if (percentile >= 75) return { 
    color: 'bg-red-50 text-red-700 border-red-200', 
    borderColor: 'border-l-red-500',
    label: 'Premium Rate',
    description: 'Above 75th percentile - ensure strong justification for audit defense'
  }
  if (percentile >= 50) return { 
    color: 'bg-blue-50 text-blue-700 border-blue-200', 
    borderColor: 'border-l-blue-500',
    label: 'Competitive',
    description: 'Between median and 75th percentile - well-positioned for market'
  }
  if (percentile >= 25) return { 
    color: 'bg-green-50 text-green-700 border-green-200', 
    borderColor: 'border-l-green-500',
    label: 'Market Rate',
    description: 'Between 25th and 50th percentile - strong audit defense position'
  }
  return { 
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200', 
    borderColor: 'border-l-yellow-500',
    label: 'Below Market',
    description: 'Below 25th percentile - may face retention challenges'
  }
}

const getRateComparison = (myRate: number, competitorRate: number): { 
  color: string
  label: string
  icon: typeof TrendingUp
  bgColor: string
} => {
  const diff = ((myRate - competitorRate) / competitorRate) * 100
  
  if (diff > 10) return { 
    color: 'text-red-600', 
    bgColor: 'bg-red-50 border-red-200',
    label: `${diff.toFixed(0)}% higher`,
    icon: TrendingUp
  }
  if (diff > 0) return { 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50 border-orange-200',
    label: `${diff.toFixed(0)}% higher`,
    icon: TrendingUp
  }
  if (diff > -10) return { 
    color: 'text-green-600', 
    bgColor: 'bg-green-50 border-green-200',
    label: `${Math.abs(diff).toFixed(0)}% lower`,
    icon: TrendingDown
  }
  return { 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50 border-blue-200',
    label: `${Math.abs(diff).toFixed(0)}% lower`,
    icon: TrendingDown
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ==================== COMPONENT ====================

export function RateJustificationTab() {
  // Get data from context
  const context = useAppContext()
  
  // Handle both selectedRoles and teamMembers (context may use either)
  const contextRoles = context.selectedRoles || context.teamMembers || []
  
  // Get subcontractors from context
  const contextSubcontractors = context.subcontractors || []
  
  // Get calculateLoadedRate function from context if available
  const calculateLoadedRate = context.calculateLoadedRate

  // State
  const [activeSection, setActiveSection] = useState<SectionType>('bls')
  const [selectedRole, setSelectedRole] = useState<RoleDisplay | null>(null)
  const [selectedGSACompetitor, setSelectedGSACompetitor] = useState<GSACompetitor | null>(null)
  const [isSlideoutOpen, setIsSlideoutOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // BLS section state
  const [blsSearchQuery, setBlsSearchQuery] = useState('')
  
  // GSA section state
  const [gsaSearchQuery, setGsaSearchQuery] = useState('')
  const [gsaFilterRole, setGsaFilterRole] = useState<string>('all')
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  
  // Rate justification state - stores justifications per role
  const [roleJustifications, setRoleJustifications] = useState<Record<string, RoleJustification>>({})

  // Justification options
  const justificationOptions = [
    { id: 'clearance', label: 'Security Clearance Required', options: ['Secret', 'Top Secret', 'TS/SCI', 'TS/SCI w/ Poly'] },
    { id: 'location', label: 'Geographic Location Premium', options: ['Washington DC Metro', 'San Francisco Bay Area', 'New York Metro', 'Boston Metro', 'Other HCOL Area'] },
    { id: 'certifications', label: 'Specialized Certifications', options: ['AWS Certified', 'Azure Certified', 'CISSP', 'PMP', 'ITIL', 'Agile/Scrum', 'Other'] },
    { id: 'keyPersonnel', label: 'Key Personnel (Named Individual)', options: null },
    { id: 'nicheSkills', label: 'Niche Technology / Domain Expertise', options: null },
    { id: 'experience', label: 'Experience Beyond Minimum', options: ['10+ years', '15+ years', '20+ years'] },
    { id: 'pastPerformance', label: 'Incumbent / Past Performance', options: null },
  ]

  // ==================== TRANSFORM CONTEXT DATA ====================

  // Convert prime roles from context to display format
  // Deduplicate by title - BLS comparison is per role, not per FTE
  const primeRoles: RoleDisplay[] = useMemo(() => {
    if (!contextRoles || !Array.isArray(contextRoles)) {
      return []
    }
    
    // Group roles by title and aggregate FTE
    const roleMap = new Map<string, any>()
    
    contextRoles
      .filter((role: any) => role && role.id)
      .forEach((role: any) => {
        const title = role.title || role.role || role.name || role.laborCategory || `Role ${role.id}`
        const existing = roleMap.get(title)
        
        if (existing) {
          // Aggregate FTE for same role
          existing.fte += (role.quantity || role.fte || role.count || 1)
        } else {
          const salary = role.baseSalary || role.salary || role.annualSalary || 0
          
          // Try to get hourly rate directly, or calculate from salary
          // loadedRate is the fully-loaded billable rate from context
          let hourlyRate = role.loadedRate || role.hourlyRate || role.rate || 0
          
          // If no hourly rate but we have salary, calculate it using context function
          if (hourlyRate === 0 && salary > 0) {
            if (calculateLoadedRate) {
              // Use the context's calculation with actual company multipliers
              hourlyRate = calculateLoadedRate(salary)
            } else {
              // Fallback: base hourly with approximate wrap rate (~2.1x)
              hourlyRate = (salary / 2080) * 2.1
            }
          }
          
          const level = role.icLevel || role.level || role.ic_level || 'IC3'
          const fte = role.quantity || role.fte || role.count || 1
          
          roleMap.set(title, {
            id: role.id || '',
            title,
            level,
            salary,
            hourlyRate,
            fte,
            isPrime: true
          })
        }
      })
    
    return Array.from(roleMap.values())
  }, [contextRoles])

  // Convert subcontractors from context to display format
  // Deduplicate by role title + company - one entry per unique sub role
  const subRoles: RoleDisplay[] = useMemo(() => {
    if (!contextSubcontractors || !Array.isArray(contextSubcontractors)) {
      return []
    }
    
    // Group subs by role + company
    const subMap = new Map<string, any>()
    
    contextSubcontractors
      .filter((sub: any) => sub && sub.id)
      .forEach((sub: any) => {
        const title = sub.role || sub.laborCategory || sub.title || `Sub Role ${sub.id}`
        const company = sub.companyName || sub.company || sub.vendor || ''
        const key = `${title}|${company}`
        const existing = subMap.get(key)
        
        if (existing) {
          // Aggregate FTE for same role from same company
          existing.fte += (sub.fte || sub.quantity || 1)
        } else {
          const theirRate = sub.theirRate || sub.rate || 0
          const billedRate = sub.billedRate || sub.ourRate || theirRate
          const fte = sub.fte || sub.quantity || 1
          
          subMap.set(key, {
            id: sub.id || '',
            title,
            level: 'SUB',
            salary: 0,
            hourlyRate: theirRate,
            billedRate,
            fte,
            isPrime: false,
            companyName: company,
            theirRate,
            markupPercent: billedRate > theirRate ? ((billedRate - theirRate) / theirRate * 100) : 0
          })
        }
      })
    
    return Array.from(subMap.values())
  }, [contextSubcontractors])

  // Combine prime and sub roles
  const roles: RoleDisplay[] = useMemo(() => {
    return [...primeRoles, ...subRoles]
  }, [primeRoles, subRoles])

  // Get all relevant GSA competitors for our roles
  const relevantGSACompetitors = useMemo(() => {
    const allCompetitors: GSACompetitor[] = []
    const seenIds = new Set<string>()
    
    roles.forEach(role => {
      const competitors = findGSACompetitors(role.title)
      competitors.forEach(comp => {
        if (!seenIds.has(comp.id)) {
          seenIds.add(comp.id)
          allCompetitors.push(comp)
        }
      })
    })
    
    // If no role-specific competitors found, return all competitors
    if (allCompetitors.length === 0) {
      return GSA_COMPETITORS
    }
    
    return allCompetitors
  }, [roles])

  // ==================== COMPUTED VALUES ====================

  // Filter roles for BLS section
  const filteredRoles = useMemo(() => {
    if (!blsSearchQuery) return roles
    const query = blsSearchQuery.toLowerCase()
    return roles.filter(role => 
      role.title.toLowerCase().includes(query) ||
      role.level.toLowerCase().includes(query)
    )
  }, [blsSearchQuery, roles])

  // Filter GSA competitors
  const filteredGSACompetitors = useMemo(() => {
    return relevantGSACompetitors.filter(competitor => {
      const matchesSearch = !gsaSearchQuery || 
        competitor.vendor.toLowerCase().includes(gsaSearchQuery.toLowerCase()) ||
        competitor.laborCategory.toLowerCase().includes(gsaSearchQuery.toLowerCase()) ||
        competitor.contractNumber.toLowerCase().includes(gsaSearchQuery.toLowerCase())
      
      const matchesRole = gsaFilterRole === 'all' || competitor.laborCategory === gsaFilterRole
      
      return matchesSearch && matchesRole
    })
  }, [gsaSearchQuery, gsaFilterRole, relevantGSACompetitors])

  // Group GSA competitors by labor category
  const groupedGSACompetitors = useMemo(() => {
    const groups: Record<string, GSACompetitor[]> = {}
    filteredGSACompetitors.forEach(competitor => {
      if (!groups[competitor.laborCategory]) {
        groups[competitor.laborCategory] = []
      }
      groups[competitor.laborCategory].push(competitor)
    })
    return groups
  }, [filteredGSACompetitors])

  // Get unique labor categories for filter
  const uniqueLaborCategories = useMemo(() => {
    return Array.from(new Set(relevantGSACompetitors.map(c => c.laborCategory)))
  }, [relevantGSACompetitors])

  // Calculate GSA statistics
  const gsaStats = useMemo(() => {
    if (filteredGSACompetitors.length === 0) return { avg: 0, min: 0, max: 0 }
    
    const rates = filteredGSACompetitors.map(c => c.rate)
    return {
      avg: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
      min: Math.min(...rates),
      max: Math.max(...rates)
    }
  }, [filteredGSACompetitors])

  // Calculate BLS summary stats
  const blsSummary = useMemo(() => {
    const rolesWithData = roles.filter(role => findBLSData(role.title) !== null)
    if (rolesWithData.length === 0) return { avgPercentile: 0, aboveMedian: 0, total: 0 }
    
    const percentiles = rolesWithData.map(role => {
      const blsData = findBLSData(role.title)!
      return calculatePercentile(role.salary, blsData)
    })
    
    const aboveMedian = rolesWithData.filter(role => {
      const blsData = findBLSData(role.title)
      return blsData && role.salary > blsData.median
    }).length

    return {
      avgPercentile: percentiles.reduce((sum, p) => sum + p, 0) / percentiles.length,
      aboveMedian,
      total: rolesWithData.length
    }
  }, [roles])

  // Calculate justification stats
  const justificationStats = useMemo(() => {
    const rolesWithData = roles.filter(role => findBLSData(role.title) !== null)
    
    const needsJustification = rolesWithData.filter(role => {
      const blsData = findBLSData(role.title)!
      const percentile = calculatePercentile(role.salary, blsData)
      return percentile >= 75
    })
    
    const hasJustification = needsJustification.filter(role => 
      roleJustifications[role.id]?.savedAt !== undefined && roleJustifications[role.id]?.savedAt !== ''
    )
    
    return {
      needed: needsJustification.length,
      completed: hasJustification.length
    }
  }, [roles, roleJustifications])

  // ==================== HANDLERS ====================

  const openRoleSlideout = (role: Role) => {
    setSelectedRole(role)
    setSelectedGSACompetitor(null)
    setIsSlideoutOpen(true)
  }

  const openGSASlideout = (competitor: GSACompetitor) => {
    setSelectedGSACompetitor(competitor)
    setSelectedRole(null)
    setIsSlideoutOpen(true)
  }

  const closeSlideout = () => {
    setIsSlideoutOpen(false)
    setSelectedRole(null)
    setSelectedGSACompetitor(null)
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const refreshData = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  // ==================== SIDEBAR CONFIG ====================

  const sidebarItems = [
    {
      id: 'bls' as SectionType,
      label: 'BLS Market Data',
      icon: TrendingUp,
      count: roles.length,
      color: 'text-blue-600'
    },
    {
      id: 'gsa' as SectionType,
      label: 'GSA Competitors',
      icon: Building2,
      count: relevantGSACompetitors.length,
      color: 'text-purple-600'
    },
    {
      id: 'export' as SectionType,
      label: 'Export & Audit',
      icon: FileText,
      count: 0,
      color: 'text-orange-600'
    }
  ]

  // ==================== RENDER ====================

  return (
    <TooltipProvider>
      <div className="flex gap-6">
        {/* ==================== LEFT SIDEBAR ==================== */}
        <div className="w-56 flex-shrink-0">
          <div className="sticky top-6">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Rate Justification</h2>
              <p className="text-xs text-gray-600">
                Market research for audit defense
              </p>
            </div>

            {/* Navigation */}
            <nav className="space-y-1" aria-label="Rate justification sections">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg 
                      text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isActive ? item.color : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.count > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                        {item.count}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Summary Stats */}
            <div className="mt-6 space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Prime Roles</span>
                <span className="text-sm font-semibold text-gray-900">{primeRoles.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Sub Roles</span>
                <span className="text-sm font-semibold text-orange-600">{subRoles.length}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-600">Avg Market Position</span>
                <span className="text-sm font-semibold text-blue-600">{blsSummary.avgPercentile.toFixed(0)}th</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Above Median</span>
                <span className="text-sm font-semibold text-gray-900">{blsSummary.aboveMedian}/{blsSummary.total}</span>
              </div>
              {justificationStats.needed > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-600">Justifications</span>
                  <span className={`text-sm font-semibold ${justificationStats.completed === justificationStats.needed ? 'text-green-600' : 'text-amber-600'}`}>
                    {justificationStats.completed}/{justificationStats.needed}
                  </span>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-900 mb-1">Audit Defense</p>
                  <p className="text-xs text-blue-800">
                    All data is timestamped for DCAA audits. Export before bid submission.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== MAIN CONTENT ==================== */}
        <div className="flex-1 min-w-0 space-y-4">
          
          {/* ==================== BLS MARKET DATA SECTION ==================== */}
          {activeSection === 'bls' && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-gray-900">BLS Market Data</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Learn about BLS data usage">
                          <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs font-medium mb-1">{farTooltips.blsData.clause}: {farTooltips.blsData.title}</p>
                        <p className="text-xs">{farTooltips.blsData.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Compare proposed salaries to Bureau of Labor Statistics data
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </div>

              {/* Data Source Info */}
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Data as of May 2024</span>
                </div>
                <span>•</span>
                <span>Source: BLS Occupational Employment Statistics</span>
                <a 
                  href="https://www.bls.gov/oes/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 ml-auto"
                >
                  View BLS.gov <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search roles..."
                  value={blsSearchQuery}
                  onChange={(e) => setBlsSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  aria-label="Search roles"
                />
              </div>

              {/* Role Cards */}
              {filteredRoles.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    {roles.length === 0 
                      ? 'No roles added to your team yet'
                      : 'No roles match your search'
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {roles.length === 0
                      ? 'Add roles in Roles & Pricing to see market comparisons'
                      : 'Try a different search term'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRoles.map((role) => {
                    const blsData = findBLSData(role.title)
                    if (!blsData) return null

                    const isSub = role.isPrime === false
                    
                    // BLS provides base wages. For fair comparison:
                    // - Primes: compare salary to BLS salary
                    // - Subs: compare their loaded rate to BLS loaded equivalent
                    
                    // BLS median hourly (base wage)
                    const blsMedianHourly = blsData.median / 2080
                    
                    // For subs: estimate what a loaded rate would be (~2.0x wrap rate is typical)
                    // This makes the comparison fair since subs quote loaded rates
                    const blsLoadedHourly = blsMedianHourly * 2.0
                    
                    // For primes: use salary comparison
                    // For subs: use hourly rate vs estimated loaded rate
                    const compareValue = isSub ? role.hourlyRate : role.salary
                    const blsCompareValue = isSub ? blsLoadedHourly : blsData.median
                    
                    const percentile = isSub 
                      ? calculatePercentile(role.hourlyRate * 2080 / 2.0, blsData) // Estimate base salary for percentile
                      : calculatePercentile(role.salary, blsData)
                    const status = getPercentileStatus(percentile)
                    const diffFromMedian = compareValue - blsCompareValue
                    const percentDiff = ((diffFromMedian / blsCompareValue) * 100)

                    // Border color: Blue for prime, Orange for sub
                    const borderColor = isSub ? 'border-l-orange-500' : 'border-l-blue-500'
                    
                    // Check if justification is needed and if it exists
                    const needsJustification = percentile >= 75
                    const hasJustification = roleJustifications[role.id]?.savedAt !== undefined && roleJustifications[role.id]?.savedAt !== ''

                    return (
                      <div
                        key={role.id}
                        className={`
                          group border border-gray-200 border-l-4 rounded-lg p-4 
                          hover:border-blue-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] 
                          transition-all cursor-pointer bg-white
                          ${borderColor}
                        `}
                        onClick={() => openRoleSlideout(role)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && openRoleSlideout(role)}
                        aria-label={`View BLS analysis for ${role.title}`}
                      >
                        <div className="flex items-start justify-between">
                          {/* Left: Role Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-medium text-sm text-gray-900">{role.title}</h4>
                              {isSub ? (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-orange-50 text-orange-700 border-orange-200">
                                  Sub
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                  {role.level}
                                </Badge>
                              )}
                              {isSub && role.companyName && (
                                <span className="text-xs text-gray-500">{role.companyName}</span>
                              )}
                              {/* Justification Status Indicator */}
                              {needsJustification && (
                                hasJustification ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Justified
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Rate justification documented</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                        <AlertTriangle className="w-3 h-3" />
                                        Needs Justification
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Click to add rate justification for audit defense</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )
                              )}
                            </div>
                            <p className="text-xs text-gray-600">
                              {role.fte} FTE • ${role.hourlyRate.toFixed(2)}/hr
                              {isSub && role.markupPercent && role.markupPercent > 0 && (
                                <span className="text-gray-400"> (+{role.markupPercent.toFixed(0)}% markup)</span>
                              )}
                            </p>
                          </div>

                          {/* Center: Rate/Salary Comparison */}
                          <div className="text-center px-6">
                            {isSub ? (
                              <>
                                <p className="text-lg font-bold text-gray-900">${role.hourlyRate.toFixed(2)}/hr</p>
                                <p className={`text-xs font-medium ${percentDiff >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                  {percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(0)}% vs ${blsLoadedHourly.toFixed(2)}/hr
                                </p>
                                <p className="text-[10px] text-gray-400">est. market loaded rate</p>
                              </>
                            ) : (
                              <>
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(role.salary)}</p>
                                <p className={`text-xs font-medium ${percentDiff >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                  {percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(0)}% vs median
                                </p>
                              </>
                            )}
                          </div>

                          {/* Right: Percentile & Status */}
                          <div className="flex items-center gap-3">
                            {/* Mini Percentile Bar */}
                            <div className="w-24">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500">Position</span>
                                <span className="text-xs font-semibold text-blue-600">{percentile.toFixed(0)}th</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    percentile >= 75 ? 'bg-red-500' :
                                    percentile >= 50 ? 'bg-blue-500' :
                                    percentile >= 25 ? 'bg-green-500' :
                                    'bg-yellow-500'
                                  }`}
                                  style={{ width: `${Math.min(percentile, 100)}%` }}
                                />
                              </div>
                            </div>

                            <Badge className={`${status.color} border text-[10px] px-2 py-0.5`}>
                              {status.label}
                            </Badge>

                            <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ==================== GSA COMPETITORS SECTION ==================== */}
          {activeSection === 'gsa' && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-gray-900">GSA Schedule Competitors</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Learn about price analysis">
                          <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs font-medium mb-1">{farTooltips.priceAnalysis.clause}: {farTooltips.priceAnalysis.title}</p>
                        <p className="text-xs">{farTooltips.priceAnalysis.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Benchmark your rates against GSA Schedule holders
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </div>

              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search vendors, contracts..."
                    value={gsaSearchQuery}
                    onChange={(e) => setGsaSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                    aria-label="Search GSA competitors"
                  />
                </div>
                <Select value={gsaFilterRole} onValueChange={setGsaFilterRole}>
                  <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {uniqueLaborCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stats Bar */}
              <div className="flex items-center gap-6 text-xs text-gray-600 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Avg: <span className="font-semibold text-gray-900">${gsaStats.avg.toFixed(2)}/hr</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-3.5 h-3.5 text-green-600" />
                  <span>Min: <span className="font-semibold text-gray-900">${gsaStats.min.toFixed(2)}/hr</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                  <span>Max: <span className="font-semibold text-gray-900">${gsaStats.max.toFixed(2)}/hr</span></span>
                </div>
                <a 
                  href="https://calc.gsa.gov/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 ml-auto"
                >
                  View GSA CALC <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Grouped Competitors */}
              {Object.keys(groupedGSACompetitors).length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    {roles.length === 0 
                      ? 'Add roles in Roles & Pricing to see competitor data'
                      : 'No competitors match your filters'
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {roles.length === 0
                      ? 'GSA competitors are matched based on your team roles'
                      : 'Try adjusting your search or filter'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedGSACompetitors).map(([category, competitors]) => {
                    const isExpanded = expandedCategories[category] !== false // Default to expanded
                    const lowerCategory = category.toLowerCase()
                    
                    // Find matching role from our team - use STRICT matching
                    const ourRole = roles.find(r => {
                      const lowerTitle = r.title.toLowerCase()
                      
                      // Exact match
                      if (lowerTitle === lowerCategory) return true
                      
                      // Specific category matching (same logic as findGSACompetitors)
                      if (lowerCategory === 'senior software engineer') {
                        return lowerTitle.includes('senior') && lowerTitle.includes('software') && lowerTitle.includes('engineer')
                      }
                      
                      if (lowerCategory === 'software engineer') {
                        return lowerTitle.includes('software') && lowerTitle.includes('engineer') && !lowerTitle.includes('senior')
                      }
                      
                      if (lowerCategory === 'devops engineer') {
                        return lowerTitle.includes('devops')
                      }
                      
                      if (lowerCategory === 'technical lead') {
                        return lowerTitle.includes('technical lead') || lowerTitle.includes('tech lead') ||
                               (lowerTitle.includes('lead') && !lowerTitle.includes('software') && !lowerTitle.includes('devops'))
                      }
                      
                      if (lowerCategory === 'security engineer') {
                        return lowerTitle.includes('security') || lowerTitle.includes('cyber')
                      }
                      
                      if (lowerCategory === 'data scientist') {
                        return lowerTitle.includes('data scientist') || lowerTitle.includes('data analyst')
                      }
                      
                      if (lowerCategory === 'qa engineer') {
                        return lowerTitle.includes('qa') || lowerTitle.includes('quality') || lowerTitle.includes('test engineer')
                      }
                      
                      if (lowerCategory === 'project manager') {
                        return lowerTitle.includes('project manager') || lowerTitle.includes('program manager')
                      }
                      
                      // Fallback: exact containment
                      if (lowerTitle.includes(lowerCategory) || lowerCategory.includes(lowerTitle)) {
                        return true
                      }
                      
                      return false
                    })
                    const categoryRates = competitors.map(c => c.rate)
                    const avgRate = categoryRates.reduce((sum, r) => sum + r, 0) / categoryRates.length

                    return (
                      <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                          aria-expanded={isExpanded}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-sm text-gray-900">{category}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                              {competitors.length} vendors
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            {ourRole && (
                              <div className="text-right text-xs">
                                <span className="text-gray-500">Your rate:</span>
                                <span className="font-semibold text-gray-900 ml-1">${ourRole.hourlyRate.toFixed(2)}/hr</span>
                                <span className="text-gray-500 ml-2">vs avg</span>
                                <span className={`font-semibold ml-1 ${ourRole.hourlyRate < avgRate ? 'text-green-600' : 'text-orange-600'}`}>
                                  ${avgRate.toFixed(2)}/hr
                                </span>
                              </div>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {/* Competitors List */}
                        {isExpanded && (
                          <div className="divide-y divide-gray-100">
                            {competitors.map((competitor) => {
                              const comparison = ourRole ? getRateComparison(ourRole.hourlyRate, competitor.rate) : null
                              const ComparisonIcon = comparison?.icon || TrendingUp

                              return (
                                <div
                                  key={competitor.id}
                                  className="group px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                                  onClick={() => openGSASlideout(competitor)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => e.key === 'Enter' && openGSASlideout(competitor)}
                                  aria-label={`View details for ${competitor.vendor}`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{competitor.vendor}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                      <span>{competitor.contractNumber}</span>
                                      <span>•</span>
                                      <span>{competitor.education} + {competitor.yearsExp} yrs</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-6">
                                    {/* Your Rate */}
                                    {ourRole && (
                                      <div className="text-right">
                                        <p className="text-[10px] text-gray-500 uppercase">Your Rate</p>
                                        <p className="text-sm font-semibold text-blue-600">${ourRole.hourlyRate.toFixed(2)}/hr</p>
                                      </div>
                                    )}
                                    
                                    {/* Their Rate */}
                                    <div className="text-right">
                                      <p className="text-[10px] text-gray-500 uppercase">Their Rate</p>
                                      <p className="text-sm font-bold text-gray-900">${competitor.rate.toFixed(2)}/hr</p>
                                    </div>

                                    {/* Comparison */}
                                    {comparison && (
                                      <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${comparison.bgColor}`}>
                                        <ComparisonIcon className="w-3 h-3" />
                                        <span>{comparison.label}</span>
                                      </div>
                                    )}
                                    
                                    <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ==================== EXPORT & AUDIT SECTION ==================== */}
          {activeSection === 'export' && (
            <>
              {/* Header */}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-gray-900">Export & Audit Defense</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Learn about audit defense">
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs font-medium mb-1">{farTooltips.adequateCompetition.clause}</p>
                      <p className="text-xs">{farTooltips.adequateCompetition.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Generate timestamped documentation for proposal packages and future audits
                </p>
              </div>

              {/* Package Status Card */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Rate Justification Package</h4>
                    <p className="text-xs text-gray-600">
                      Generated {new Date().toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] px-2 py-0.5">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ready to Export
                  </Badge>
                </div>

                {/* Package Contents Checklist */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-700 mb-3">Package Contents</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-700 p-2 bg-gray-50 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <span>BLS salary analysis ({blsSummary.total} roles)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700 p-2 bg-gray-50 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <span>GSA competitor data ({relevantGSACompetitors.length} vendors)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700 p-2 bg-gray-50 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <span>Market position analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700 p-2 bg-gray-50 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <span>Source citations & timestamps</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{blsSummary.total}</p>
                    <p className="text-xs text-gray-600 mt-1">Roles Analyzed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{relevantGSACompetitors.length}</p>
                    <p className="text-xs text-gray-600 mt-1">GSA Comparisons</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{blsSummary.avgPercentile.toFixed(0)}th</p>
                    <p className="text-xs text-gray-600 mt-1">Avg Market Position</p>
                  </div>
                </div>

                {/* Export Actions */}
                <div className="space-y-3">
                  <Button className="w-full" size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Download Complete Package (PDF)
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      BLS Analysis Only
                    </Button>
                    <Button variant="outline" size="sm">
                      <Building2 className="w-4 h-4 mr-2" />
                      GSA Comparison Only
                    </Button>
                  </div>
                </div>
              </div>

              {/* Audit Defense Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">DCAA Audit Best Practices</h4>
                    <ul className="text-xs text-blue-800 space-y-1.5">
                      <li>• Download this package immediately after bid submission</li>
                      <li>• Store with your proposal files for a minimum of 7 years</li>
                      <li>• All data includes source citations and timestamps for verification</li>
                      <li>• Use to defend rates in DCAA audits or price negotiations</li>
                      <li>• Re-generate if rates change before final submission</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ==================== BLS SLIDEOUT PANEL ==================== */}
      {isSlideoutOpen && selectedRole && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={closeSlideout}
            aria-hidden="true"
          />

          {/* Panel */}
          <div 
            className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-50 animate-in slide-in-from-right"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bls-panel-title"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 id="bls-panel-title" className="text-lg font-semibold text-gray-900">{selectedRole.title}</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {selectedRole.level} • {selectedRole.fte} FTE • ${selectedRole.hourlyRate.toFixed(2)}/hr
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={closeSlideout}
                aria-label="Close panel"
                className="h-8 w-8 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {(() => {
                const blsData = findBLSData(selectedRole.title)
                if (!blsData) return <p className="text-sm text-gray-600">No BLS data available for this role.</p>

                const percentile = calculatePercentile(selectedRole.salary, blsData)
                const status = getPercentileStatus(percentile)
                const diffFromMedian = selectedRole.salary - blsData.median
                const percentDiff = ((diffFromMedian / blsData.median) * 100)

                return (
                  <>
                    {/* Salary Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Your Proposed Salary</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(selectedRole.salary)}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">BLS Median Salary</p>
                        <p className="text-2xl font-bold text-gray-600">
                          {formatCurrency(blsData.median)}
                        </p>
                        <p className={`text-sm mt-1 font-medium ${percentDiff >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(1)}% vs median
                        </p>
                      </div>
                    </div>

                    {/* Market Position */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-900">Market Position</p>
                        <p className="text-lg font-bold text-blue-600">
                          {percentile.toFixed(0)}th Percentile
                        </p>
                      </div>

                      {/* Percentile Bar */}
                      <div className="relative h-10 bg-gradient-to-r from-green-100 via-blue-100 to-red-100 rounded-lg overflow-hidden border border-gray-200">
                        {/* Position marker */}
                        <div 
                          className="absolute top-0 bottom-0 w-1 bg-gray-900"
                          style={{ left: `${Math.min(percentile, 100)}%` }}
                        >
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 rounded-full border-2 border-white" />
                        </div>
                      </div>

                      {/* Percentile Labels */}
                      <div className="grid grid-cols-5 gap-2 mt-3 text-center">
                        {[
                          { label: '10th', value: blsData.percentile10 },
                          { label: '25th', value: blsData.percentile25 },
                          { label: 'Median', value: blsData.median },
                          { label: '75th', value: blsData.percentile75 },
                          { label: '90th', value: blsData.percentile90 },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                            <p className={`text-sm font-medium ${label === 'Median' ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                              ${(value / 1000).toFixed(0)}k
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Message */}
                    <div className={`p-4 rounded-lg border ${status.color}`}>
                      <div className="flex items-start gap-3">
                        {percentile >= 50 ? (
                          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-semibold mb-1">{status.label}</p>
                          <p className="text-sm">{status.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Rate Justification Form - Only show when above 75th percentile */}
                    {percentile >= 75 && (
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                          <h4 className="text-sm font-semibold text-gray-900">Rate Justification Required</h4>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-4">
                          This role is above the 75th percentile. Document your justification for audit defense.
                        </p>

                        {(() => {
                          const currentJustification = roleJustifications[selectedRole.id] || {
                            roleId: selectedRole.id,
                            roleTitle: selectedRole.title,
                            percentile,
                            selectedReasons: {},
                            notes: '',
                            savedAt: ''
                          }

                          const updateJustification = (updates: Partial<RoleJustification['selectedReasons']> | { notes: string }) => {
                            setRoleJustifications(prev => ({
                              ...prev,
                              [selectedRole.id]: {
                                ...currentJustification,
                                ...(('notes' in updates) ? updates : { selectedReasons: { ...currentJustification.selectedReasons, ...updates } }),
                                savedAt: ''
                              }
                            }))
                          }

                          const saveJustification = () => {
                            setRoleJustifications(prev => ({
                              ...prev,
                              [selectedRole.id]: {
                                ...currentJustification,
                                savedAt: new Date().toISOString()
                              }
                            }))
                          }

                          const hasJustification = currentJustification.savedAt !== ''

                          return (
                            <div className="space-y-4">
                              {/* Security Clearance */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox 
                                    id="clearance"
                                    checked={!!currentJustification.selectedReasons.clearance}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateJustification({ clearance: '' })
                                      } else {
                                        updateJustification({ clearance: undefined })
                                      }
                                    }}
                                  />
                                  <Label htmlFor="clearance" className="text-sm font-medium cursor-pointer">Security Clearance Required</Label>
                                </div>
                                {currentJustification.selectedReasons.clearance !== undefined && (
                                  <Select 
                                    value={currentJustification.selectedReasons.clearance || ''} 
                                    onValueChange={(value) => updateJustification({ clearance: value })}
                                  >
                                    <SelectTrigger className="w-full h-8 text-xs">
                                      <SelectValue placeholder="Select clearance level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Secret">Secret</SelectItem>
                                      <SelectItem value="Top Secret">Top Secret</SelectItem>
                                      <SelectItem value="TS/SCI">TS/SCI</SelectItem>
                                      <SelectItem value="TS/SCI w/ Poly">TS/SCI w/ Poly</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>

                              {/* Geographic Location */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox 
                                    id="location"
                                    checked={!!currentJustification.selectedReasons.location}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateJustification({ location: '' })
                                      } else {
                                        updateJustification({ location: undefined })
                                      }
                                    }}
                                  />
                                  <Label htmlFor="location" className="text-sm font-medium cursor-pointer">Geographic Location Premium</Label>
                                </div>
                                {currentJustification.selectedReasons.location !== undefined && (
                                  <Select 
                                    value={currentJustification.selectedReasons.location || ''} 
                                    onValueChange={(value) => updateJustification({ location: value })}
                                  >
                                    <SelectTrigger className="w-full h-8 text-xs">
                                      <SelectValue placeholder="Select location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Washington DC Metro">Washington DC Metro</SelectItem>
                                      <SelectItem value="San Francisco Bay Area">San Francisco Bay Area</SelectItem>
                                      <SelectItem value="New York Metro">New York Metro</SelectItem>
                                      <SelectItem value="Boston Metro">Boston Metro</SelectItem>
                                      <SelectItem value="Other HCOL Area">Other HCOL Area</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>

                              {/* Experience Level */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox 
                                    id="experience"
                                    checked={!!currentJustification.selectedReasons.experience}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateJustification({ experience: '' })
                                      } else {
                                        updateJustification({ experience: undefined })
                                      }
                                    }}
                                  />
                                  <Label htmlFor="experience" className="text-sm font-medium cursor-pointer">Experience Beyond Minimum</Label>
                                </div>
                                {currentJustification.selectedReasons.experience !== undefined && (
                                  <Select 
                                    value={currentJustification.selectedReasons.experience || ''} 
                                    onValueChange={(value) => updateJustification({ experience: value })}
                                  >
                                    <SelectTrigger className="w-full h-8 text-xs">
                                      <SelectValue placeholder="Select experience level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="10+ years">10+ years</SelectItem>
                                      <SelectItem value="15+ years">15+ years</SelectItem>
                                      <SelectItem value="20+ years">20+ years</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>

                              {/* Key Personnel */}
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  id="keyPersonnel"
                                  checked={!!currentJustification.selectedReasons.keyPersonnel}
                                  onCheckedChange={(checked) => updateJustification({ keyPersonnel: !!checked })}
                                />
                                <Label htmlFor="keyPersonnel" className="text-sm font-medium cursor-pointer">Key Personnel (Named Individual)</Label>
                              </div>

                              {/* Niche Skills */}
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  id="nicheSkills"
                                  checked={!!currentJustification.selectedReasons.nicheSkills}
                                  onCheckedChange={(checked) => updateJustification({ nicheSkills: !!checked })}
                                />
                                <Label htmlFor="nicheSkills" className="text-sm font-medium cursor-pointer">Niche Technology / Domain Expertise</Label>
                              </div>

                              {/* Past Performance */}
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  id="pastPerformance"
                                  checked={!!currentJustification.selectedReasons.pastPerformance}
                                  onCheckedChange={(checked) => updateJustification({ pastPerformance: !!checked })}
                                />
                                <Label htmlFor="pastPerformance" className="text-sm font-medium cursor-pointer">Incumbent / Past Performance</Label>
                              </div>

                              {/* Additional Notes */}
                              <div className="space-y-2">
                                <Label htmlFor="notes" className="text-sm font-medium">Additional Notes</Label>
                                <Textarea
                                  id="notes"
                                  placeholder="Provide additional context for why this rate is justified (certifications, specialized skills, agency-specific experience, etc.)"
                                  value={currentJustification.notes}
                                  onChange={(e) => updateJustification({ notes: e.target.value })}
                                  className="text-sm min-h-[80px]"
                                />
                              </div>

                              {/* Save Button */}
                              <div className="flex items-center justify-between pt-2">
                                <Button 
                                  onClick={saveJustification}
                                  size="sm"
                                  className="gap-2"
                                >
                                  <Save className="w-4 h-4" />
                                  Save Justification
                                </Button>
                                {hasJustification && (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Saved {new Date(currentJustification.savedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {/* BLS Classification */}
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs font-semibold text-gray-900 mb-3">BLS Classification</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">SOC Code</span>
                          <span className="font-medium text-gray-900">{blsData.socCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Occupation</span>
                          <span className="font-medium text-gray-900 text-right max-w-[250px]">{blsData.occupation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Updated</span>
                          <span className="font-medium text-gray-900">{blsData.lastUpdated}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Source</span>
                          <span className="font-medium text-gray-900">{blsData.dataSource}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <Button variant="outline" className="flex-1">
                <ExternalLink className="w-4 h-4 mr-2" />
                View on BLS.gov
              </Button>
              <Button className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export Analysis
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ==================== GSA SLIDEOUT PANEL ==================== */}
      {isSlideoutOpen && selectedGSACompetitor && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={closeSlideout}
            aria-hidden="true"
          />

          {/* Panel */}
          <div 
            className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-50 animate-in slide-in-from-right"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gsa-panel-title"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 id="gsa-panel-title" className="text-lg font-semibold text-gray-900">{selectedGSACompetitor.vendor}</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {selectedGSACompetitor.laborCategory} • SIN {selectedGSACompetitor.sin}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={closeSlideout}
                aria-label="Close panel"
                className="h-8 w-8 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {(() => {
                // Use STRICT matching logic (same as main list)
                const lowerCategory = selectedGSACompetitor.laborCategory.toLowerCase()
                
                const ourRole = roles.find(r => {
                  const lowerTitle = r.title.toLowerCase()
                  
                  // Exact match
                  if (lowerTitle === lowerCategory) return true
                  
                  // Specific category matching
                  if (lowerCategory === 'senior software engineer') {
                    return lowerTitle.includes('senior') && lowerTitle.includes('software') && lowerTitle.includes('engineer')
                  }
                  
                  if (lowerCategory === 'software engineer') {
                    return lowerTitle.includes('software') && lowerTitle.includes('engineer') && !lowerTitle.includes('senior')
                  }
                  
                  if (lowerCategory === 'devops engineer') {
                    return lowerTitle.includes('devops')
                  }
                  
                  if (lowerCategory === 'technical lead') {
                    return lowerTitle.includes('technical lead') || lowerTitle.includes('tech lead') ||
                           (lowerTitle.includes('lead') && !lowerTitle.includes('software') && !lowerTitle.includes('devops'))
                  }
                  
                  if (lowerCategory === 'security engineer') {
                    return lowerTitle.includes('security') || lowerTitle.includes('cyber')
                  }
                  
                  if (lowerCategory === 'data scientist') {
                    return lowerTitle.includes('data scientist') || lowerTitle.includes('data analyst')
                  }
                  
                  if (lowerCategory === 'qa engineer') {
                    return lowerTitle.includes('qa') || lowerTitle.includes('quality') || lowerTitle.includes('test engineer')
                  }
                  
                  if (lowerCategory === 'project manager') {
                    return lowerTitle.includes('project manager') || lowerTitle.includes('program manager')
                  }
                  
                  // Fallback: exact containment
                  if (lowerTitle.includes(lowerCategory) || lowerCategory.includes(lowerTitle)) {
                    return true
                  }
                  
                  return false
                })
                const comparison = ourRole ? getRateComparison(ourRole.hourlyRate, selectedGSACompetitor.rate) : null
                const ComparisonIcon = comparison?.icon || TrendingUp

                return (
                  <>
                    {/* Rate Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-600 mb-1">Your Rate</p>
                        {ourRole ? (
                          <>
                            <p className="text-2xl font-bold text-blue-600">
                              ${ourRole.hourlyRate.toFixed(2)}/hr
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{ourRole.title}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-lg font-medium text-gray-400">No matching role</p>
                            <p className="text-xs text-gray-500 mt-1">Add a {selectedGSACompetitor.laborCategory} to compare</p>
                          </>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Competitor Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${selectedGSACompetitor.rate.toFixed(2)}/hr
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{selectedGSACompetitor.vendor}</p>
                      </div>
                    </div>
                    
                    {/* Comparison Badge */}
                    {comparison && (
                      <div className={`p-4 rounded-lg border ${comparison.bgColor}`}>
                        <div className="flex items-center gap-3">
                          <ComparisonIcon className={`w-5 h-5 ${comparison.color}`} />
                          <div>
                            <p className={`text-sm font-semibold ${comparison.color}`}>
                              Your rate is {comparison.label} than {selectedGSACompetitor.vendor}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {comparison.color.includes('green') || comparison.color.includes('blue')
                                ? 'You are competitively priced against this GSA Schedule holder.'
                                : 'Consider highlighting differentiators like experience, certifications, or specialized skills.'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Qualifications */}
                    <div>
                      <p className="text-xs font-semibold text-gray-900 mb-3">Qualifications</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Award className="w-4 h-4 text-gray-500" />
                            <p className="text-xs text-gray-600">Education</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{selectedGSACompetitor.education}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <p className="text-xs text-gray-600">Experience</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{selectedGSACompetitor.yearsExp} years</p>
                        </div>
                      </div>
                    </div>

                    {/* Contract Details */}
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs font-semibold text-gray-900 mb-3">Contract Information</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contract Number</span>
                          <span className="font-medium text-gray-900">{selectedGSACompetitor.contractNumber}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Award Year</span>
                          <Badge variant="secondary" className="text-xs">
                            {selectedGSACompetitor.awardYear}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Region</span>
                          <span className="font-medium text-gray-900">{selectedGSACompetitor.region}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">SIN</span>
                          <Badge variant="outline" className="text-xs">
                            {selectedGSACompetitor.sin}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <Button variant="outline" className="flex-1">
                <ExternalLink className="w-4 h-4 mr-2" />
                View on GSA CALC
              </Button>
              <Button className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export Comparison
              </Button>
            </div>
          </div>
        </>
      )}
    </TooltipProvider>
  )
}