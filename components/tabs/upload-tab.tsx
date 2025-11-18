'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/app-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Loader2 } from 'lucide-react'

export function UploadTab() {
  const { setRfpData, setRecommendedRoles, setActiveTab } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setAnalysisComplete(false)
    }
  }

  const handleAnalyze = async () => {
    if (!file) return

    setIsAnalyzing(true)

    try {
      // TODO: Replace with actual OpenAI API call
      // For now, simulate analysis with mock data
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock recommended roles
  const mockRoles = [
  {
    id: '1',
    title: 'Technical Lead',
    icLevel: 'IC5' as const,
    quantity: 1,
    isKeyPersonnel: true,
    confidence: 'high' as const,
    storyPoints: 45,
    description: 'Lead technical architecture and mentor development team'
  },
  {
    id: '2',
    title: 'Senior Software Engineer',
    icLevel: 'IC4' as const,
    quantity: 3,
    isKeyPersonnel: false,
    confidence: 'high' as const,
    storyPoints: 120,
    description: 'Build core application features and APIs'
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    icLevel: 'IC4' as const,
    quantity: 1,
    isKeyPersonnel: false,
    confidence: 'medium' as const,
    storyPoints: 35,
    description: 'Manage CI/CD pipelines and cloud infrastructure'
  }
]

      setRecommendedRoles(mockRoles)
      setRfpData({
        fileName: file.name,
        fileSize: file.size,
        analysisComplete: true,
        summary: 'RFP analysis complete. 3 roles recommended.'
      })
      setAnalysisComplete(true)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleContinue = () => {
    setActiveTab('roles-pricing')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Upload RFP</CardTitle>
          <CardDescription>
            Upload your RFP document for AI-powered analysis and role recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="rfp-upload"
            />
            <label htmlFor="rfp-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                {file ? file.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">PDF files only</p>
            </label>
          </div>

          {/* File Info */}
          {file && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          {file && !analysisComplete && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing RFP...
                </>
              ) : (
                'Analyze RFP'
              )}
            </Button>
          )}

          {/* Analysis Complete */}
          {analysisComplete && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900">
                  ✓ Analysis Complete
                </p>
                <p className="text-xs text-green-700 mt-1">
                  3 roles recommended based on RFP requirements
                </p>
              </div>

              <Button onClick={handleContinue} className="w-full">
                Continue to Roles & Pricing →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}