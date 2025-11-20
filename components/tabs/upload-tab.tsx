'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface UploadTabProps {
  onContinue?: () => void
}

export function UploadTab({ onContinue }: UploadTabProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)

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

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    setIsAnalyzing(true)
    
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false)
      setAnalysisComplete(true)
    }, 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload RFP Document</h2>
        <p className="text-gray-600">
          Upload your RFP PDF to automatically extract requirements and generate role recommendations
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center transition-colors
              ${isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : uploadedFile 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            {!uploadedFile ? (
              <div className="space-y-4">
                <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    Drop your RFP here, or click to browse
                  </p>
                  <p className="text-sm text-gray-600">
                    Supports PDF files up to 50MB
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild>
                      <span className="cursor-pointer">
                        Select File
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className="space-y-4">
                <Loader2 className="w-16 h-16 text-blue-600 mx-auto animate-spin" />
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    Analyzing RFP...
                  </p>
                  <p className="text-sm text-gray-600">
                    Extracting requirements and generating recommendations
                  </p>
                </div>
              </div>
            ) : analysisComplete ? (
              <div className="space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    Analysis Complete!
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {uploadedFile.name} has been processed successfully
                  </p>
                  {onContinue && (
                    <Button onClick={onContinue} size="lg">
                      Continue to Scoping →
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">Extract Requirements</h3>
            <p className="text-sm text-gray-600">
              AI analyzes your RFP to identify key requirements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Upload className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">Generate Roles</h3>
            <p className="text-sm text-gray-600">
              Automatically recommend team composition
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">Calculate Costs</h3>
            <p className="text-sm text-gray-600">
              Build accurate pricing with rate justification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Tips for best results:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Upload the complete RFP document in PDF format</li>
                <li>Ensure the document is text-based (not scanned images)</li>
                <li>Include any amendments or modifications</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}