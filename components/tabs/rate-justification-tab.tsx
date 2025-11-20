'use client'

import React, { useState, useMemo } from 'react'
import { 
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  FileText,
  Download,
  Calendar,
  Info,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  MapPin,
  Briefcase,
  X,
  ChevronRight,
  Award,
  Clock,
  Plane,
  Hotel,
  Car,
  Coffee,
  ShoppingBag,
  Plus,
  Minus,
  Calculator,
  TrendingDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type SectionType = 'bls' | 'gsa' | 'odcs' | 'snapshot'

// Mock role data (will come from Roles & Pricing context)
interface Role {
  id: string
  title: string
  level: string
  salary: number
  hourlyRate: number
  fte: number
}

// Mock BLS data structure
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

// GSA Competitor data structure
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

// ODC Item structure
interface ODCItem {
  id: string
  category: 'travel' | 'materials' | 'equipment' | 'other'
  description: string
  quantity: number
  unitCost: number
  totalCost: number
}

// Mock roles from Roles & Pricing
const mockRoles: Role[] = [
  {
    id: '1',
    title: 'Technical Lead',
    level: 'IC5',
    salary: 180000,
    hourlyRate: 179.85,
    fte: 1.0
  },
  {
    id: '2',
    title: 'Senior Software Engineer',
    level: 'IC4',
    salary: 145000,
    hourlyRate: 149.01,
    fte: 3.0
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    level: 'IC3',
    salary: 120000,
    hourlyRate: 123.68,
    fte: 1.0
  }
]

// Mock BLS data (will be fetched from BLS API)
const mockBLSData: { [key: string]: BLSData } = {
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
  'DevOps Engineer': {
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
  }
}

// Mock GSA competitor data
const mockGSACompetitors: GSACompetitor[] = [
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
    id: '8',
    vendor: 'ManTech',
    laborCategory: 'DevOps Engineer',
    sin: '54151S',
    rate: 135.00,
    education: 'AS',
    yearsExp: 4,
    contractNumber: 'GS-35F-0678R',
    awardYear: 2024,
    region: 'National'
  }
]

// Mock ODC items
const mockODCs: ODCItem[] = [
  {
    id: '1',
    category: 'travel',
    description: 'Round-trip airfare (DC to client site)',
    quantity: 4,
    unitCost: 450,
    totalCost: 1800
  },
  {
    id: '2',
    category: 'travel',
    description: 'Hotel accommodation (3 nights)',
    quantity: 12,
    unitCost: 185,
    totalCost: 2220
  },
  {
    id: '3',
    category: 'travel',
    description: 'Per diem (meals & incidentals)',
    quantity: 12,
    unitCost: 74,
    totalCost: 888
  }
]

export function RateJustificationTab() {
  const [activeSection, setActiveSection] = useState<SectionType>('bls')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSlideoutOpen, setIsSlideoutOpen] = useState(false)
  const [gsaSearchQuery, setGsaSearchQuery] = useState('')
  const [gsaFilterRole, setGsaFilterRole] = useState<string>('all')
  const [selectedGSACompetitor, setSelectedGSACompetitor] = useState<GSACompetitor | null>(null)
  const [odcItems, setOdcItems] = useState<ODCItem[]>(mockODCs)

  // Calculate percentile position for a salary
  const calculatePercentile = (salary: number, blsData: BLSData): number => {
    if (salary <= blsData.percentile10) return 10
    if (salary <= blsData.percentile25) return 10 + ((salary - blsData.percentile10) / (blsData.percentile25 - blsData.percentile10)) * 15
    if (salary <= blsData.median) return 25 + ((salary - blsData.percentile25) / (blsData.median - blsData.percentile25)) * 25
    if (salary <= blsData.percentile75) return 50 + ((salary - blsData.median) / (blsData.percentile75 - blsData.median)) * 25
    if (salary <= blsData.percentile90) return 75 + ((salary - blsData.percentile75) / (blsData.percentile90 - blsData.percentile75)) * 15
    return 90 + Math.min(10, ((salary - blsData.percentile90) / blsData.percentile90) * 100)
  }

  // Get status based on percentile
  const getPercentileStatus = (percentile: number): { color: string; label: string; description: string } => {
    if (percentile >= 75) return { 
      color: 'text-red-700 bg-red-50 border-red-200', 
      label: 'Above Market',
      description: 'May face scrutiny - ensure strong justification'
    }
    if (percentile >= 50) return { 
      color: 'text-blue-700 bg-blue-50 border-blue-200', 
      label: 'Competitive',
      description: 'Well-positioned for market competitiveness'
    }
    if (percentile >= 25) return { 
      color: 'text-green-700 bg-green-50 border-green-200', 
      label: 'Reasonable',
      description: 'Strong audit defense position'
    }
    return { 
      color: 'text-yellow-700 bg-yellow-50 border-yellow-200', 
      label: 'Below Market',
      description: 'May face retention challenges'
    }
  }

  // Get rate comparison status
  const getRateComparison = (myRate: number, competitorRate: number): { 
    color: string; 
    label: string; 
    icon: typeof TrendingUp 
  } => {
    const diff = ((myRate - competitorRate) / competitorRate) * 100
    
    if (diff > 10) return { 
      color: 'text-red-600', 
      label: `${diff.toFixed(0)}% higher`,
      icon: TrendingUp
    }
    if (diff > 0) return { 
      color: 'text-orange-600', 
      label: `${diff.toFixed(0)}% higher`,
      icon: TrendingUp
    }
    if (diff > -10) return { 
      color: 'text-green-600', 
      label: `${Math.abs(diff).toFixed(0)}% lower`,
      icon: TrendingDown
    }
    return { 
      color: 'text-blue-600', 
      label: `${Math.abs(diff).toFixed(0)}% lower`,
      icon: TrendingDown
    }
  }

  // Filter GSA competitors
  const filteredGSACompetitors = useMemo(() => {
    return mockGSACompetitors.filter(competitor => {
      const matchesSearch = competitor.vendor.toLowerCase().includes(gsaSearchQuery.toLowerCase()) ||
        competitor.laborCategory.toLowerCase().includes(gsaSearchQuery.toLowerCase()) ||
        competitor.contractNumber.toLowerCase().includes(gsaSearchQuery.toLowerCase())
      
      const matchesRole = gsaFilterRole === 'all' || competitor.laborCategory === gsaFilterRole
      
      return matchesSearch && matchesRole
    })
  }, [gsaSearchQuery, gsaFilterRole])

  // Get unique labor categories for filter
  const uniqueLaborCategories = useMemo(() => {
    return Array.from(new Set(mockGSACompetitors.map(c => c.laborCategory)))
  }, [])

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

  // Calculate total ODCs
  const totalODCs = useMemo(() => {
    return odcItems.reduce((sum, item) => sum + item.totalCost, 0)
  }, [odcItems])

  // Open slideout with role details
  const openSlideout = (role: Role) => {
    setSelectedRole(role)
    setIsSlideoutOpen(true)
  }

  // Close slideout
  const closeSlideout = () => {
    setIsSlideoutOpen(false)
    setSelectedRole(null)
    setSelectedGSACompetitor(null)
  }

  // Fetch BLS data (mock for now)
  const fetchBLSData = async (socCode: string) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const sidebarItems = [
    {
      id: 'bls' as SectionType,
      label: 'BLS Comparison',
      icon: TrendingUp,
      count: mockRoles.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'gsa' as SectionType,
      label: 'GSA Competitors',
      icon: Building2,
      count: mockGSACompetitors.length,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'odcs' as SectionType,
      label: 'ODCs & Per Diem',
      icon: DollarSign,
      count: odcItems.length,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'snapshot' as SectionType,
      label: 'Bid Snapshot',
      icon: FileText,
      count: 1,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  return (
    <TooltipProvider>
      <div className="flex gap-6 min-h-screen">
        {/* Left Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="sticky top-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Rate Justification</h2>
              <p className="text-xs text-gray-600">
                Market Research & Audit Defense
              </p>
            </div>

            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
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

            {/* Quick Info */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-900 mb-1">Audit Defense</p>
                  <p className="text-xs text-blue-800">
                    All data is time-stamped for future audits. Export PDFs for proposal packages.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* BLS COMPARISON SECTION */}
          {activeSection === 'bls' && (
            <div className="space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">BLS Salary Comparison</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Compare your proposed salaries to Bureau of Labor Statistics market data
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fetchBLSData('all')}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </Button>
                </div>

                {/* Data Source Info */}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Data as of May 2024 • Source: BLS OEWS Survey</span>
                  <a 
                    href="https://www.bls.gov/oes/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    View Source <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Compact Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Level</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">Your Salary</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">BLS Median</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Percentile</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockRoles.map((role) => {
                      const blsData = mockBLSData[role.title]
                      if (!blsData) return null

                      const percentile = calculatePercentile(role.salary, blsData)
                      const status = getPercentileStatus(percentile)

                      return (
                        <tr 
                          key={role.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => openSlideout(role)}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{role.title}</p>
                              <p className="text-xs text-gray-600">{role.fte} FTE</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">{role.level}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              ${role.salary.toLocaleString()}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="text-sm text-gray-700">
                              ${blsData.median.toLocaleString()}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-semibold text-blue-600">
                              {percentile.toFixed(0)}th
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`${status.color} border text-[10px] px-2 py-0.5`}>
                              {status.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Card */}
              <Card className="bg-gray-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total Roles</p>
                      <p className="text-2xl font-bold text-gray-900">{mockRoles.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Avg Percentile</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {(mockRoles.reduce((sum, role) => {
                          const blsData = mockBLSData[role.title]
                          return blsData ? sum + calculatePercentile(role.salary, blsData) : sum
                        }, 0) / mockRoles.length).toFixed(0)}th
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Above Median</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {mockRoles.filter(role => {
                          const blsData = mockBLSData[role.title]
                          return blsData && role.salary > blsData.median
                        }).length}/{mockRoles.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* GSA COMPETITORS SECTION */}
          {activeSection === 'gsa' && (
            <div className="space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">GSA Competitor Analysis</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {filteredGSACompetitors.length} GSA Schedule holders • SIN 54151S
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh GSA Data
                  </Button>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search vendors, labor categories, contracts..."
                      value={gsaSearchQuery}
                      onChange={(e) => setGsaSearchQuery(e.target.value)}
                      className="pl-9 h-9"
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
                <div className="flex items-center gap-6 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Avg: ${gsaStats.avg.toFixed(2)}/hr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-3.5 h-3.5 text-green-600" />
                    <span>Min: ${gsaStats.min.toFixed(2)}/hr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                    <span>Max: ${gsaStats.max.toFixed(2)}/hr</span>
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
              </div>

              {/* Competitor Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredGSACompetitors.map((competitor) => {
                  // Find matching role from our team
                  const ourRole = mockRoles.find(r => r.title === competitor.laborCategory)
                  const comparison = ourRole ? getRateComparison(ourRole.hourlyRate, competitor.rate) : null
                  const ComparisonIcon = comparison?.icon || TrendingUp

                  return (
                    <Card 
                      key={competitor.id} 
                      className="border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedGSACompetitor(competitor)
                        setIsSlideoutOpen(true)
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-sm font-semibold text-gray-900 mb-1">
                              {competitor.vendor}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {competitor.laborCategory}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                            {competitor.sin}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Rate Display */}
                        <div className="flex items-baseline justify-between">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              ${competitor.rate.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">per hour</p>
                          </div>
                          {comparison && ourRole && (
                            <div className={`text-right ${comparison.color}`}>
                              <div className="flex items-center gap-1 text-xs font-medium">
                                <ComparisonIcon className="w-3.5 h-3.5" />
                                <span>{comparison.label}</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5">
                                vs ${ourRole.hourlyRate.toFixed(2)}/hr
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Qualifications */}
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            <span>{competitor.education} + {competitor.yearsExp} yrs</span>
                          </div>
                        </div>

                        {/* Contract Info */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                          <span className="text-gray-600">{competitor.contractNumber}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {competitor.awardYear}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {filteredGSACompetitors.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No competitors found matching your filters</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ODCs & PER DIEM SECTION */}
          {activeSection === 'odcs' && (
            <div className="space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Other Direct Costs</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Calculate travel, materials, equipment, and per diem costs
                    </p>
                  </div>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add ODC Item
                  </Button>
                </div>
              </div>

              {/* ODC Items */}
              <div className="space-y-3">
                {odcItems.map((item) => {
                  const categoryIcons = {
                    travel: Plane,
                    materials: ShoppingBag,
                    equipment: Coffee,
                    other: DollarSign
                  }
                  const CategoryIcon = categoryIcons[item.category]

                  return (
                    <Card key={item.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                            ${item.category === 'travel' ? 'bg-blue-50 text-blue-600' : ''}
                            ${item.category === 'materials' ? 'bg-purple-50 text-purple-600' : ''}
                            ${item.category === 'equipment' ? 'bg-green-50 text-green-600' : ''}
                            ${item.category === 'other' ? 'bg-gray-50 text-gray-600' : ''}
                          `}>
                            <CategoryIcon className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  {item.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                  <span>Qty: {item.quantity}</span>
                                  <span>•</span>
                                  <span>${item.unitCost.toFixed(2)} per unit</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  ${item.totalCost.toLocaleString()}
                                </p>
                                <Badge 
                                  variant="secondary" 
                                  className="text-[10px] px-1.5 py-0 mt-1 capitalize"
                                >
                                  {item.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Total Summary */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Total ODCs</p>
                      <p className="text-xs text-gray-600">{odcItems.length} line items</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">
                      ${totalODCs.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* GSA Per Diem Calculator */}
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">GSA Per Diem Calculator</CardTitle>
                  <CardDescription className="text-xs">
                    Calculate M&IE and lodging rates by location
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">
                        Travel Location
                      </label>
                      <Input placeholder="Washington, DC" className="h-9" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">
                        Number of Days
                      </label>
                      <Input type="number" placeholder="3" className="h-9" />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" size="sm">
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Per Diem
                  </Button>
                  <div className="text-xs text-center text-gray-600">
                    <a 
                      href="https://www.gsa.gov/travel/plan-book/per-diem-rates" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      View GSA Per Diem Rates <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* BID SNAPSHOT SECTION */}
          {activeSection === 'snapshot' && (
            <div className="space-y-4">
              {/* Header */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Bid Defense Package</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Time-stamped snapshot of all rate justification data for audit defense
                </p>
              </div>

              {/* Snapshot Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Complete Rate Justification Snapshot</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Generated on {new Date().toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-2 py-1">
                      Ready
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* What's Included */}
                  <div>
                    <p className="text-xs font-semibold text-gray-900 mb-2">Package Contents:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        <span>BLS salary comparisons ({mockRoles.length} roles)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        <span>GSA competitor analysis ({mockGSACompetitors.length} vendors)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        <span>ODC calculations (${totalODCs.toLocaleString()})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        <span>Source citations & timestamps</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{mockRoles.length}</p>
                      <p className="text-xs text-gray-600 mt-1">Roles Analyzed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{mockGSACompetitors.length}</p>
                      <p className="text-xs text-gray-600 mt-1">GSA Competitors</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {(mockRoles.reduce((sum, role) => {
                          const blsData = mockBLSData[role.title]
                          return blsData ? sum + calculatePercentile(role.salary, blsData) : sum
                        }, 0) / mockRoles.length).toFixed(0)}th
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Avg Percentile</p>
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-900">Export Options:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="justify-start" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        PDF Report
                      </Button>
                      <Button variant="outline" className="justify-start" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Excel Spreadsheet
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-200 flex gap-2">
                    <Button className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download Complete Package
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Defense Tips */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    Audit Defense Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-blue-900">
                  <p>• Download this package immediately after bid submission</p>
                  <p>• Store with your proposal files for future reference</p>
                  <p>• All data includes source citations and timestamps</p>
                  <p>• Keep for minimum 7 years per federal retention requirements</p>
                  <p>• Can be used to defend rates in DCAA audits or negotiations</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Slideout Panel for BLS Details */}
      {isSlideoutOpen && selectedRole && !selectedGSACompetitor && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/20" onClick={closeSlideout} />
          <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">{selectedRole.title}</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {selectedRole.level} • {selectedRole.fte} FTE • ${selectedRole.hourlyRate.toFixed(2)}/hr
                </p>
              </div>
              <button
                onClick={closeSlideout}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {(() => {
                const blsData = mockBLSData[selectedRole.title]
                if (!blsData) return null

                const percentile = calculatePercentile(selectedRole.salary, blsData)
                const status = getPercentileStatus(percentile)
                const isAboveMedian = selectedRole.salary > blsData.median
                const diffFromMedian = selectedRole.salary - blsData.median
                const percentDiff = ((diffFromMedian / blsData.median) * 100).toFixed(1)

                return (
                  <>
                    {/* Salary Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Your Proposed Salary</p>
                        <p className="text-3xl font-bold text-gray-900">
                          ${selectedRole.salary.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">BLS Median Salary</p>
                        <p className="text-3xl font-bold text-gray-600">
                          ${blsData.median.toLocaleString()}
                        </p>
                        <p className={`text-sm mt-1 font-medium ${isAboveMedian ? 'text-red-600' : 'text-green-600'}`}>
                          {isAboveMedian ? '+' : ''}{percentDiff}% vs median
                        </p>
                      </div>
                    </div>

                    {/* Percentile Visualization */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-900">Market Position</p>
                        <p className="text-lg font-bold text-blue-600">
                          {percentile.toFixed(0)}th Percentile
                        </p>
                      </div>

                      {/* Percentile Bar */}
                      <div className="relative h-12 bg-gradient-to-r from-green-100 via-yellow-100 via-blue-100 to-red-100 rounded-lg overflow-hidden border border-gray-200">
                        {/* Marker positions */}
                        <div className="absolute inset-0 flex justify-between px-2 py-2">
                          <div className="text-xs text-gray-600">10%</div>
                          <div className="text-xs text-gray-600">25%</div>
                          <div className="text-xs text-gray-600">50%</div>
                          <div className="text-xs text-gray-600">75%</div>
                          <div className="text-xs text-gray-600">90%</div>
                        </div>

                        {/* Your position marker */}
                        <div 
                          className="absolute top-0 bottom-0 w-1 bg-gray-900"
                          style={{ left: `${Math.min(percentile, 100)}%` }}
                        >
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 rounded-full border-2 border-white" />
                        </div>
                      </div>

                      {/* Percentile Values */}
                      <div className="grid grid-cols-5 gap-2 mt-4 text-center">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">10th</p>
                          <p className="text-sm font-medium text-gray-700">
                            ${(blsData.percentile10 / 1000).toFixed(0)}k
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">25th</p>
                          <p className="text-sm font-medium text-gray-700">
                            ${(blsData.percentile25 / 1000).toFixed(0)}k
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Median</p>
                          <p className="text-sm font-bold text-gray-900">
                            ${(blsData.median / 1000).toFixed(0)}k
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">75th</p>
                          <p className="text-sm font-medium text-gray-700">
                            ${(blsData.percentile75 / 1000).toFixed(0)}k
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">90th</p>
                          <p className="text-sm font-medium text-gray-700">
                            ${(blsData.percentile90 / 1000).toFixed(0)}k
                          </p>
                        </div>
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

                    {/* SOC Code & Occupation */}
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs font-semibold text-gray-900 mb-2">BLS Classification</p>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">SOC Code:</span> {blsData.socCode}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Occupation:</span> {blsData.occupation}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Last Updated:</span> {blsData.lastUpdated}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Source:</span> {blsData.dataSource}
                        </p>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
              <Button variant="outline" className="flex-1">
                View Full Analysis
              </Button>
              <Button className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Slideout Panel for GSA Competitor Details */}
      {isSlideoutOpen && selectedGSACompetitor && !selectedRole && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/20" onClick={closeSlideout} />
          <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">{selectedGSACompetitor.vendor}</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {selectedGSACompetitor.laborCategory} • SIN {selectedGSACompetitor.sin}
                </p>
              </div>
              <button
                onClick={closeSlideout}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {(() => {
                const ourRole = mockRoles.find(r => r.title === selectedGSACompetitor.laborCategory)
                const comparison = ourRole ? getRateComparison(ourRole.hourlyRate, selectedGSACompetitor.rate) : null
                const ComparisonIcon = comparison?.icon || TrendingUp

                return (
                  <>
                    {/* Rate Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Competitor Rate</p>
                        <p className="text-3xl font-bold text-gray-900">
                          ${selectedGSACompetitor.rate.toFixed(2)}/hr
                        </p>
                      </div>
                      {ourRole && comparison && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Your Rate</p>
                          <p className="text-3xl font-bold text-blue-600">
                            ${ourRole.hourlyRate.toFixed(2)}/hr
                          </p>
                          <div className={`flex items-center gap-1 mt-1 ${comparison.color}`}>
                            <ComparisonIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">{comparison.label}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Qualifications */}
                    <div>
                      <p className="text-xs font-semibold text-gray-900 mb-3">Qualifications</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Education</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedGSACompetitor.education}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Experience</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedGSACompetitor.yearsExp} years</p>
                        </div>
                      </div>
                    </div>

                    {/* Contract Details */}
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs font-semibold text-gray-900 mb-2">Contract Information</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Contract Number</span>
                          <span className="text-sm font-medium text-gray-900">{selectedGSACompetitor.contractNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Award Year</span>
                          <Badge variant="secondary" className="text-xs">
                            {selectedGSACompetitor.awardYear}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Region</span>
                          <span className="text-sm font-medium text-gray-900">{selectedGSACompetitor.region}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">SIN</span>
                          <Badge variant="outline" className="text-xs">
                            {selectedGSACompetitor.sin}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Analysis */}
                    {ourRole && comparison && (
                      <div className={`p-4 rounded-lg border ${
                        comparison.color.includes('red') ? 'bg-red-50 border-red-200' :
                        comparison.color.includes('orange') ? 'bg-orange-50 border-orange-200' :
                        comparison.color.includes('green') ? 'bg-green-50 border-green-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start gap-3">
                          <ComparisonIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${comparison.color}`} />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 mb-1">
                              Rate Analysis
                            </p>
                            <p className="text-sm text-gray-700">
                              {comparison.label === 'lower' 
                                ? `Your rate is ${comparison.label.split('%')[0]}% more competitive than ${selectedGSACompetitor.vendor}'s published rate.`
                                : `Your rate is ${comparison.label.split('%')[0]}% above ${selectedGSACompetitor.vendor}'s published rate. Consider justification in your technical proposal.`
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
              <Button variant="outline" className="flex-1">
                View on GSA CALC
              </Button>
              <Button className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export Comparison
              </Button>
            </div>
          </div>
        </div>
      )}
    </TooltipProvider>
  )
}