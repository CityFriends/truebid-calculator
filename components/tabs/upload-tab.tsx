'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppContext } from '@/contexts/app-context'
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  Calendar,
  Building2,
  Shield,
  Clock,
  Briefcase,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

// ==================== TYPES ====================
interface UploadTabProps {
  onContinue?: () => void
}

// ==================== MOCK EXTRACTED DATA ====================
// This simulates what the AI would extract from an RFP
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
}

// ==================== HELPERS ====================
const contractTypeLabels: Record<string, string> = {
  'FFP': 'Firm Fixed Price',
  'T&M': 'Time & Materials',
  'CPFF': 'Cost Plus Fixed Fee',
  'CPAF': 'Cost Plus Award Fee',
  'IDIQ': 'IDIQ',
  'BPA': 'BPA',
  'hybrid': 'Hybrid'
}

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
  const { updateSolicitation } = useAppContext()
  
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [state, setState] = useState<'idle' | 'analyzing' | 'complete'>('idle')
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')

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
    setUploadedFile(file)
    setState('analyzing')
    setProgress(0)

    // Simulate analysis progress
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

    // Update solicitation in context
    updateSolicitation({
      ...mockExtractedSolicitation,
      analyzedFromDocument: file.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    setState('complete')
  }

  const handleReset = () => {
    setUploadedFile(null)
    setState('idle')
    setProgress(0)
    setProgressText('')
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="max-w-2xl mx-auto py-12">
      {/* IDLE STATE: Upload */}
      {state === 'idle' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Upload RFP</h1>
            <p className="text-gray-600">
              Upload your RFP document to automatically extract solicitation details
            </p>
          </div>

          {/* Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-16 text-center transition-all cursor-pointer
              ${isDragging 
                ? 'border-blue-500 bg-blue-50' 
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
            
            <div className="space-y-4">
              <div className={`
                w-14 h-14 rounded-xl mx-auto flex items-center justify-center transition-colors
                ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                <Upload className={`w-7 h-7 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              
              <div>
                <p className="text-base font-medium text-gray-900 mb-1">
                  Drop your RFP here
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse • PDF up to 50MB
                </p>
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Extract details</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>AI analysis</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready to scope</span>
            </div>
          </div>
        </div>
      )}

      {/* ANALYZING STATE */}
      {state === 'analyzing' && (
        <div className="space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 mx-auto flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Analyzing RFP</h1>
            <p className="text-gray-600">{progressText}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">{progress}%</p>
          </div>

          {/* File info */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <FileText className="w-4 h-4" />
            <span>{uploadedFile?.name}</span>
          </div>
        </div>
      )}

      {/* COMPLETE STATE */}
      {state === 'complete' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 mx-auto flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">RFP Analyzed</h1>
            <p className="text-gray-600">
              We extracted the following details from your document
            </p>
          </div>

          {/* Extracted Data Card */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* File Header */}
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{uploadedFile?.name}</span>
              </div>
              <Badge className="bg-green-100 text-green-700 border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Extracted
              </Badge>
            </div>

            {/* Extracted Details */}
            <div className="p-5 space-y-4">
              {/* Solicitation Info */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Solicitation</span>
                </div>
                <p className="font-semibold text-gray-900">{mockExtractedSolicitation.solicitationNumber}</p>
                <p className="text-sm text-gray-600 mt-1">{mockExtractedSolicitation.title}</p>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Grid of details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Agency</p>
                    <p className="text-sm font-medium text-gray-900">{mockExtractedSolicitation.clientAgency}</p>
                    {mockExtractedSolicitation.subAgency && (
                      <p className="text-xs text-gray-500">{mockExtractedSolicitation.subAgency}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Contract Type</p>
                    <p className="text-sm font-medium text-gray-900">
                      {contractTypeLabels[mockExtractedSolicitation.contractType]}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Period of Performance</p>
                    <p className="text-sm font-medium text-gray-900">
                      1 Base + {mockExtractedSolicitation.periodOfPerformance.optionYears} Options
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Proposal Due</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(mockExtractedSolicitation.proposalDueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Badges Row */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  NAICS: {mockExtractedSolicitation.naicsCode}
                </Badge>
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  {setAsideLabels[mockExtractedSolicitation.setAside]}
                </Badge>
                {mockExtractedSolicitation.requiresClearance && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    <Shield className="w-3 h-3 mr-1" />
                    {mockExtractedSolicitation.clearanceLevel?.replace('-', ' ')}
                  </Badge>
                )}
                {mockExtractedSolicitation.placeOfPerformance.type && (
                  <Badge variant="outline" className="text-xs">
                    {mockExtractedSolicitation.placeOfPerformance.type}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleReset} className="text-gray-600">
              <RefreshCw className="w-4 h-4 mr-2" />
              Upload Different File
            </Button>
            
            <Button onClick={handleContinue} size="lg">
              Continue to Scoping
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadTab