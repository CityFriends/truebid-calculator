"use client"

import React from 'react'
import { Sparkles, Loader2, Upload, ClipboardList, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SOORequirement, EnhancedWBSElement } from './types'
import { getTypeColor, formatHours } from './utils'

interface RequirementsViewProps {
  requirements: SOORequirement[]
  wbsElements: EnhancedWBSElement[]
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  onSelectAll: () => void
  onGenerateWbs: () => void
  onGenerateSingleWbs: (reqId: string) => void
  isGenerating: boolean
  generatingIds: Set<string>
  onViewWbs: (wbs: EnhancedWBSElement) => void
  hasUploadedRfp: boolean
  allSelected: boolean
}

export function RequirementsView({
  requirements,
  wbsElements,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  onGenerateWbs,
  onGenerateSingleWbs,
  isGenerating,
  generatingIds,
  onViewWbs,
  hasUploadedRfp,
  allSelected,
}: RequirementsViewProps) {
  const selectedCount = selectedIds.size

  // Get WBS elements linked to selected requirements
  const previewWbsElements = React.useMemo(() => {
    const linkedWbsIds = new Set<string>()
    requirements.forEach(req => {
      if (selectedIds.has(req.id)) {
        req.linkedWbsIds.forEach(id => linkedWbsIds.add(id))
      }
    })
    return wbsElements.filter(wbs => linkedWbsIds.has(wbs.id))
  }, [requirements, selectedIds, wbsElements])

  // Empty state
  if (requirements.length === 0) {
    if (!hasUploadedRfp) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-16">
          <Upload className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements yet</h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            Go to the <span className="font-medium">Upload</span> tab to extract requirements from an RFP document.
          </p>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <ClipboardList className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements extracted</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Re-upload the RFP or add requirements manually.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Left Column - Requirements List */}
      <div className="w-1/2 border-r border-gray-200 flex flex-col">
        {/* Header with Select All */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({requirements.length})
            </span>
          </div>
        </div>

        {/* Requirements List */}
        <div className="flex-1 overflow-y-auto">
          {requirements.map((req) => {
            const isSelected = selectedIds.has(req.id)
            const isReqGenerating = generatingIds.has(req.id)
            const hasLinkedWbs = req.linkedWbsIds.length > 0

            return (
              <div
                key={req.id}
                className={`
                  flex items-start gap-3 px-4 py-3 border-b border-gray-100 transition-all
                  ${isSelected ? 'bg-white' : 'bg-gray-50 opacity-60'}
                  ${isReqGenerating ? 'bg-blue-50' : ''}
                `}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(req.id)}
                  disabled={isReqGenerating}
                  className="mt-1 w-5 h-5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="font-mono text-xs px-1.5 py-0 h-5 bg-gray-100">
                      {req.referenceNumber}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 h-5 ${getTypeColor(req.type)}`}
                    >
                      {req.type}
                    </Badge>
                    {hasLinkedWbs && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-emerald-50 text-emerald-700 border-emerald-200">
                        {req.linkedWbsIds.length} WBS
                      </Badge>
                    )}
                    {isReqGenerating && (
                      <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                    )}
                    {/* Per-card generate button - only show for unmapped requirements */}
                    {isSelected && !hasLinkedWbs && !isReqGenerating && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onGenerateSingleWbs(req.id)
                        }}
                        disabled={isGenerating}
                        className="ml-auto flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Generate WBS for this requirement"
                      >
                        <Sparkles className="w-3 h-3" />
                        Generate
                      </button>
                    )}
                  </div>
                  <h4 className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                    {req.title}
                  </h4>
                  <p className={`text-xs mt-1 line-clamp-2 ${isSelected ? 'text-gray-600' : 'text-gray-400'}`}>
                    {req.description}
                  </p>
                  {!isSelected && (
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-1 inline-block">
                      Out of Scope
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Generate WBS Button */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
          <Button
            onClick={onGenerateWbs}
            disabled={isGenerating || selectedCount === 0}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating WBS...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate WBS for {selectedCount} Selected
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right Column - WBS Preview */}
      <div className="w-1/2 flex flex-col bg-gray-50">
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            WBS Preview ({previewWbsElements.length})
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {previewWbsElements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Layers className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                {selectedCount === 0
                  ? 'Select requirements to see linked WBS elements'
                  : 'No WBS elements generated yet. Click "Generate WBS" to create them.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {previewWbsElements.map(wbs => (
                <Card
                  key={wbs.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onViewWbs(wbs)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                        {wbs.wbsNumber}
                      </Badge>
                      <span className="text-xs text-gray-500 font-mono">
                        {formatHours(wbs.totalHours)}h
                      </span>
                    </div>
                    <CardTitle className="text-sm font-medium text-gray-900">
                      {wbs.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {wbs.what || wbs.why || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {wbs.estimateMethod}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${
                        wbs.confidence === 'high' ? 'text-emerald-600' :
                        wbs.confidence === 'medium' ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {wbs.confidence} confidence
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
