"use client"

import React, { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { X, Upload, FileText, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/contexts/app-context'
import { requirementsApi, proposalsApi } from '@/lib/api'

interface UploadSlideoutProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete?: () => void
}

// Map API contract type to context format
const mapContractType = (type: string): 'FFP' | 'T&M' | 'CPFF' | 'IDIQ' => {
  const mapping: Record<string, 'FFP' | 'T&M' | 'CPFF' | 'IDIQ'> = {
    'ffp': 'FFP',
    'tm': 'T&M',
    'cpff': 'CPFF',
    'idiq': 'IDIQ',
    'unknown': 'T&M',
  }
  return mapping[type.toLowerCase()] || 'T&M'
}

// Map set-aside to context format
type SetAsideType = '' | 'full-open' | 'small-business' | '8a' | 'hubzone' | 'sdvosb' | 'wosb' | 'edwosb'

const mapSetAside = (setAside: string): SetAsideType => {
  const mapping: Record<string, SetAsideType> = {
    'Small Business': 'small-business',
    'small-business': 'small-business',
    '8(a)': '8a',
    '8a': '8a',
    'HUBZone': 'hubzone',
    'hubzone': 'hubzone',
    'SDVOSB': 'sdvosb',
    'sdvosb': 'sdvosb',
    'WOSB': 'wosb',
    'wosb': 'wosb',
    'EDWOSB': 'edwosb',
    'edwosb': 'edwosb',
    'Full & Open': 'full-open',
    'full-open': 'full-open',
  }
  return mapping[setAside] || 'full-open'
}

export function UploadSlideout({ isOpen, onClose, onUploadComplete }: UploadSlideoutProps) {
  const {
    updateSolicitation,
    setRecommendedRoles,
    setExtractedRequirements,
  } = useAppContext()

  const params = useParams()
  const proposalId = params?.id as string | undefined

  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
    setErrorMessage(null)

    let progressInterval: NodeJS.Timeout | null = null

    try {
      setProgress(10)
      setProgressText('Uploading document...')

      const formData = new FormData()
      formData.append('file', file)

      setProgress(15)
      setProgressText('Extracting text from PDF...')

      // Animate progress
      let currentProgress = 15
      progressInterval = setInterval(() => {
        currentProgress += 0.5
        if (currentProgress >= 85) currentProgress = 85
        setProgress(Math.round(currentProgress))

        if (currentProgress >= 25 && currentProgress < 50) {
          setProgressText('Analyzing solicitation structure...')
        } else if (currentProgress >= 50 && currentProgress < 75) {
          setProgressText('Extracting requirements...')
        } else if (currentProgress >= 75) {
          setProgressText('Finalizing analysis...')
        }
      }, 500)

      // Call API
      const response = await fetch('/api/extract-rfp', {
        method: 'POST',
        body: formData,
      })

      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Upload failed: ${response.status}`)
      }

      setProgress(90)
      setProgressText('Processing results...')

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed')
      }

      // Update solicitation context
      updateSolicitation({
        title: data.metadata?.title || '',
        solicitationNumber: data.metadata?.solicitationNumber || '',
        clientAgency: data.metadata?.clientAgency || '',
        contractType: mapContractType(data.metadata?.contractType || 'unknown'),
        naicsCode: data.metadata?.naicsCode || '',
        proposalDueDate: data.metadata?.responseDeadline || undefined,
        setAside: mapSetAside(data.metadata?.setAside || 'full-open'),
        periodOfPerformance: {
          baseYear: true,
          optionYears: data.metadata?.periodOfPerformance?.options || 0,
        },
        analyzedFromDocument: file.name,
      })

      // Store requirements
      if (data.requirements && data.requirements.length > 0) {
        const mappedRequirements = data.requirements.map((req: { id: string; text: string; type: string; sourceSection: string }, idx: number) => ({
          id: req.id || `req-${idx + 1}`,
          text: req.text,
          description: req.text,
          type: req.type || 'other',
          sourceSection: req.sourceSection || 'Unknown',
          source: req.sourceSection || 'RFP',
          linkedWbsIds: [],
        }))

        setExtractedRequirements(mappedRequirements)

        // Persist to API if we have a proposal ID
        if (proposalId) {
          try {
            await requirementsApi.create(proposalId, mappedRequirements)
          } catch (err) {
            console.warn('[UploadSlideout] Failed to persist requirements:', err)
          }
        }
      }

      // Store suggested roles
      if (data.suggestedRoles && data.suggestedRoles.length > 0) {
        setRecommendedRoles(data.suggestedRoles)
      }

      // Update proposal in database
      if (proposalId) {
        try {
          await proposalsApi.update(proposalId, {
            title: data.metadata?.title || undefined,
            solicitation_number: data.metadata?.solicitationNumber || undefined,
            agency: data.metadata?.clientAgency || undefined,
            contract_type: mapContractType(data.metadata?.contractType || 'unknown'),
          })
        } catch (err) {
          console.warn('[UploadSlideout] Failed to update proposal:', err)
        }
      }

      setProgress(100)
      setState('complete')

      // Notify parent and close after short delay
      setTimeout(() => {
        onUploadComplete?.()
        onClose()
        // Reset for next time
        setState('idle')
        setProgress(0)
      }, 1500)

    } catch (error) {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      console.error('[UploadSlideout] Upload error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
      setState('error')
    }
  }

  const handleRetry = () => {
    setState('idle')
    setErrorMessage(null)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slideout Panel */}
      <div
        className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-slideout-title"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="upload-slideout-title" className="text-lg font-semibold text-gray-900">
            Upload RFP Document
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Idle State - Upload Zone */}
          {state === 'idle' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Upload your solicitation document to automatically extract requirements, metadata, and suggested roles.
              </p>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer
                  ${isDragging
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }
                `}
                onClick={() => document.getElementById('upload-slideout-file')?.click()}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="upload-slideout-file"
                />

                <div className="space-y-3">
                  <div className={`
                    w-12 h-12 rounded-lg mx-auto flex items-center justify-center transition-colors
                    ${isDragging ? 'bg-emerald-100' : 'bg-gray-100'}
                  `}>
                    <Upload className={`w-6 h-6 ${isDragging ? 'text-emerald-600' : 'text-gray-400'}`} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Drop your RFP here
                    </p>
                    <p className="text-xs text-gray-500">
                      or click to browse • PDF up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              {uploadedFileName && (
                <p className="text-xs text-gray-500 text-center">
                  Previously uploaded: {uploadedFileName}
                </p>
              )}
            </div>
          )}

          {/* Analyzing State */}
          {state === 'analyzing' && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-lg bg-emerald-50 mx-auto flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-emerald-600 animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Analyzing RFP</h3>
                <p className="text-sm text-gray-600">{progressText}</p>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
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

          {/* Complete State */}
          {state === 'complete' && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-lg bg-emerald-50 mx-auto flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Analysis Complete</h3>
                <p className="text-sm text-gray-600">Requirements extracted successfully</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-lg bg-red-50 mx-auto flex items-center justify-center mb-4">
                  <AlertCircle className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Analysis Failed</h3>
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
