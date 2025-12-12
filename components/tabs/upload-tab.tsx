'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppContext } from '@/contexts/app-context'
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  FileCheck,
  Scale,
  ChevronDown,
  ChevronUp,
  Calendar,
  Building2,
  Shield,
  MapPin,
  Pencil,
} from 'lucide-react'

// ==================== TYPES ====================
interface UploadTabProps {
  onContinue?: () => void
}

type ContractTypeOption = 'T&M' | 'FFP' | 'GSA'

// ==================== MOCK EXTRACTED DATA ====================
const mockExtractedSolicitation = {
  solicitationNumber: '75D301-24-R-00456',
  title: 'Enterprise Cloud Migration and DevSecOps Support Services',
  clientAgency: 'Department of Health and Human Services',
  subAgency: 'Centers for Medicare & Medicaid Services',
  proposalDueDate: '2025-01-15',
  contractType: 'T&M' as const,
  naicsCode: '541512',
  periodOfPerformance: {
    baseYear: true,
    optionYears: 4,
  },
  setAside: 'small-business' as const,
  requiresClearance: true,
  clearanceLevel: 'public-trust' as const,
  placeOfPerformance: {
    type: 'hybrid' as const,
    locations: ['Baltimore, MD', 'Washington, DC'],
    travelRequired: true,
    travelPercent: 15,
  },
  pricingSettings: {
    billableHours: 1920,
    profitMargin: 8,
    escalationEnabled: true,
    laborEscalation: 3,
    odcEscalation: 0,
  },
}

const mockExtractedRoles = [
  { id: 'rec-1', name: 'Technical Lead', description: 'Technical Lead position overseeing architecture and team delivery', icLevel: 'IC5' as const, baseSalary: 150000, quantity: 1, fte: 1, storyPoints: 45, years: { base: true, option1: true, option2: true, option3: true, option4: true }, isKeyPersonnel: true, confidence: 'high' as const },
  { id: 'rec-2', name: 'Senior Software Engineer', description: 'Senior Software Engineer for cloud migration and DevSecOps implementation', icLevel: 'IC4' as const, baseSalary: 120000, quantity: 3, fte: 1, storyPoints: 120, years: { base: true, option1: true, option2: true, option3: true, option4: true }, confidence: 'high' as const },
  { id: 'rec-3', name: 'DevOps Engineer', description: 'DevOps Engineer for CI/CD pipeline and infrastructure automation', icLevel: 'IC4' as const, baseSalary: 120000, quantity: 1, fte: 1, storyPoints: 35, years: { base: true, option1: true, option2: true, option3: true, option4: true }, confidence: 'medium' as const },
  { id: 'rec-4', name: 'Cloud Security Engineer', description: 'Security specialist for FedRAMP compliance and DevSecOps', icLevel: 'IC4' as const, baseSalary: 125000, quantity: 1, fte: 1, storyPoints: 30, years: { base: true, option1: true, option2: true, option3: true, option4: true }, confidence: 'medium' as const },
  { id: 'rec-5', name: 'Business Analyst', description: 'Business Analyst for requirements gathering and stakeholder coordination', icLevel: 'IC3' as const, baseSalary: 95000, quantity: 1, fte: 1, storyPoints: 20, years: { base: true, option1: true, option2: true, option3: true, option4: true }, confidence: 'low' as const },
]

// ==================== CONTRACT TYPE CONFIG ====================
const contractTypeOptions: {
  value: ContractTypeOption
  label: string
  description: string
  icon: typeof Clock
}[] = [
  {
    value: 'T&M',
    label: 'Time & Materials',
    description: 'Bill hourly rates for actual time worked. Best for evolving scope.',
    icon: Clock,
  },
  {
    value: 'FFP',
    label: 'Firm Fixed Price',
    description: 'Fixed total price regardless of actual costs. Best for well-defined scope.',
    icon: FileCheck,
  },
  {
    value: 'GSA',
    label: 'GSA Schedule',
    description: 'Use pre-negotiated GSA MAS ceiling rates. Faster procurement.',
    icon: Scale,
  },
]

// ==================== HELPERS ====================
const setAsideLabels: Record<string, string> = {
  'full-open': 'Full & Open',
  'small-business': 'Small Business',
  '8a': '8(a)',
  'hubzone': 'HUBZone',
  'sdvosb': 'SDVOSB',
  'wosb': 'WOSB',
  'edwosb': 'EDWOSB'
}

// ==================== COMPONENT ====================
export function UploadTab({ onContinue }: UploadTabProps) {
  const { 
    updateSolicitation, 
    setRecommendedRoles,
    solicitation,
    companyProfile,
    openSolicitationEditor,
    resetSolicitation,
  } = useAppContext()
  
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'analyzing' | 'complete'>('idle')
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  
  // Contract type selection - sync with context
  const [selectedContractType, setSelectedContractType] = useState<ContractTypeOption | null>(null)
  const [detectedContractType, setDetectedContractType] = useState<ContractTypeOption | null>(null)
  
  // Expanded details view
  const [showDetails, setShowDetails] = useState(false)

  // Check GSA availability
  const hasGSASchedule = companyProfile?.gsaMasSchedule || false
  const gsaContractNumber = companyProfile?.gsaContractNumber || ''

  // ==================== RESTORE STATE FROM CONTEXT ON MOUNT ====================
  useEffect(() => {
    // If solicitation has data (was previously analyzed), restore the complete state
    if (solicitation.analyzedFromDocument) {
      setUploadedFileName(solicitation.analyzedFromDocument)
      setState('complete')
      
      // Restore contract type selection
      const contractType = solicitation.contractType as ContractTypeOption
      if (contractType && ['T&M', 'FFP', 'GSA'].includes(contractType)) {
        setSelectedContractType(contractType)
        setDetectedContractType(contractType) // Assume detected = what was saved
      }
    }
  }, []) // Only run on mount - don't re-run when solicitation changes

  // Drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0].type === 'application/pdf') {
      handleFileUpload(files[0])
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [])

  // File upload and analysis
  const handleFileUpload = async (file: File) => {
    setUploadedFileName(file.name)
    setState('analyzing')
    setProgress(0)

    const steps = [
      { progress: 15, text: 'Uploading document...' },
      { progress: 30, text: 'Parsing PDF structure...' },
      { progress: 50, text: 'Extracting solicitation details...' },
      { progress: 70, text: 'Identifying contract structure...' },
      { progress: 85, text: 'Analyzing compliance requirements...' },
      { progress: 100, text: 'Complete!' },
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 400))
      setProgress(step.progress)
      setProgressText(step.text)
    }

    // Store detected type and pre-select it
    const detected = mockExtractedSolicitation.contractType as ContractTypeOption
    setDetectedContractType(detected)
    setSelectedContractType(detected)

    // Update context with all extracted data
    updateSolicitation({
      ...mockExtractedSolicitation,
      analyzedFromDocument: file.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    setRecommendedRoles(mockExtractedRoles)
    setState('complete')
  }

  const handleContractTypeSelect = (type: ContractTypeOption) => {
    if (type === 'GSA' && !hasGSASchedule) return
    setSelectedContractType(type)
    // Persist to context immediately
    updateSolicitation({ contractType: type })
  }

  const handleReset = () => {
    // Reset local state
    setUploadedFileName(null)
    setState('idle')
    setProgress(0)
    setProgressText('')
    setSelectedContractType(null)
    setDetectedContractType(null)
    setShowDetails(false)
    
    // Reset context
    resetSolicitation()
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="max-w-xl mx-auto py-12">
      {/* ==================== IDLE STATE ==================== */}
      {state === 'idle' && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Upload RFP</h1>
            <p className="text-sm text-gray-600">
              Upload your solicitation document to extract details automatically
            </p>
          </div>

          {/* Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer
              ${isDragging 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            
            <div className="space-y-3">
              <div className={`
                w-12 h-12 rounded-lg mx-auto flex items-center justify-center transition-colors
                ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                <Upload className={`w-6 h-6 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Drop your RFP here
                </p>
                <p className="text-xs text-gray-500">
                  or click to browse • PDF up to 50MB
                </p>
              </div>
            </div>
          </div>

          {/* What happens next - subtle */}
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Extract details</span>
            </div>
            <span className="text-gray-300">→</span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI analysis</span>
            </div>
            <span className="text-gray-300">→</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready to estimate</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ANALYZING STATE ==================== */}
      {state === 'analyzing' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-lg bg-blue-50 mx-auto flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-blue-600 animate-pulse" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Analyzing RFP</h1>
            <p className="text-sm text-gray-600">{progressText}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">{progress}%</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <FileText className="w-3.5 h-3.5" />
            <span>{uploadedFileName}</span>
          </div>
        </div>
      )}

      {/* ==================== COMPLETE STATE ==================== */}
      {state === 'complete' && (
        <div className="space-y-6">
          {/* Success Header */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-lg bg-green-50 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">RFP Analyzed</h1>
            <p className="text-sm text-gray-600">
              Review the details and select your pricing approach
            </p>
          </div>

          {/* Extracted Summary - Collapsible */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Collapsed Header */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {solicitation.solicitationNumber || mockExtractedSolicitation.solicitationNumber}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {solicitation.clientAgency || mockExtractedSolicitation.clientAgency} • 1 Base + {solicitation.periodOfPerformance?.optionYears ?? mockExtractedSolicitation.periodOfPerformance.optionYears} Options
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Extracted
                </Badge>
                {showDetails ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {showDetails && (
              <div className="px-4 py-4 border-t border-gray-200 space-y-4">
                {/* Title */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Title</p>
                  <p className="text-sm text-gray-900">{solicitation.title || mockExtractedSolicitation.title}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Agency</p>
                      <p className="text-sm text-gray-900">{solicitation.clientAgency || mockExtractedSolicitation.clientAgency}</p>
                      {(solicitation.subAgency || mockExtractedSolicitation.subAgency) && (
                        <p className="text-xs text-gray-500">{solicitation.subAgency || mockExtractedSolicitation.subAgency}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Proposal Due</p>
                      <p className="text-sm text-gray-900">
                        {new Date(solicitation.proposalDueDate || mockExtractedSolicitation.proposalDueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Clearance</p>
                      <p className="text-sm text-gray-900 capitalize">
                        {(solicitation.clearanceLevel || mockExtractedSolicitation.clearanceLevel)?.replace('-', ' ') || 'None'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm text-gray-900 capitalize">
                        {solicitation.placeOfPerformance?.type || mockExtractedSolicitation.placeOfPerformance.type}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    NAICS: {solicitation.naicsCode || mockExtractedSolicitation.naicsCode}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    {setAsideLabels[(solicitation.setAside || mockExtractedSolicitation.setAside) as string] || 'Unknown'}
                  </Badge>
                </div>

                {/* Edit Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); openSolicitationEditor(); }}
                  className="w-full"
                >
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Edit Details
                </Button>
              </div>
            )}
          </div>

          {/* Contract Type Selection - Radio Style */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-900">
              How will you price this bid?
            </h2>
            
            <div className="space-y-2">
              {contractTypeOptions.map((option) => {
                const isSelected = selectedContractType === option.value
                const isDetected = detectedContractType === option.value
                const isDisabled = option.value === 'GSA' && !hasGSASchedule
                const Icon = option.icon
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleContractTypeSelect(option.value)}
                    disabled={isDisabled}
                    className={`
                      w-full text-left px-4 py-3 rounded-lg border transition-all
                      ${isSelected 
                        ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400' 
                        : isDisabled
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Radio Circle */}
                      <div className={`
                        w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                        ${isSelected 
                          ? 'border-blue-600 bg-blue-600' 
                          : 'border-gray-300'
                        }
                      `}>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                            {option.label}
                          </span>
                          {isDetected && (
                            <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] px-1.5 py-0">
                              Detected
                            </Badge>
                          )}
                        </div>
                        <p className={`text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                          {option.description}
                        </p>
                        
                        {/* GSA Contract Info */}
                        {option.value === 'GSA' && hasGSASchedule && (
                          <p className="text-xs text-gray-500 mt-1">
                            Contract: {gsaContractNumber}
                          </p>
                        )}
                        {option.value === 'GSA' && !hasGSASchedule && (
                          <p className="text-xs text-amber-600 mt-1">
                            No GSA schedule on file
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-gray-600">
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            
            <Button 
              onClick={handleContinue} 
              disabled={!selectedContractType}
            >
              Continue to Estimate
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadTab