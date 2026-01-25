"use client"

import React from 'react'
import {
  Search, Sparkles, CheckCircle2, Circle,
  ChevronDown, ChevronUp, Loader2, Upload,
  ClipboardList, Link2, ArrowRight, Unlink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { SOORequirement, EnhancedWBSElement, EstimateStats } from './types'
import { getTypeColor, formatHours } from './utils'

interface RequirementsViewProps {
  requirements: SOORequirement[]
  wbsElements: EnhancedWBSElement[]
  stats: EstimateStats
  searchQuery: string
  onSearchChange: (value: string) => void
  filterStatus: 'all' | 'unmapped' | 'mapped'
  onFilterChange: (value: 'all' | 'unmapped' | 'mapped') => void
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  onSelectAll: () => void
  onClearSelection: () => void
  onGenerateWbs: () => void
  isGenerating: boolean
  generatingIds: Set<string>
  onViewWbs: (wbs: EnhancedWBSElement) => void
  onUnlinkWbs: (reqId: string, wbsId: string) => void
  hasUploadedRfp: boolean
  allSelected: boolean
  someSelected: boolean
}

export function RequirementsView({
  requirements,
  wbsElements,
  stats,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onGenerateWbs,
  isGenerating,
  generatingIds,
  onViewWbs,
  onUnlinkWbs,
  hasUploadedRfp,
  allSelected,
  someSelected,
}: RequirementsViewProps) {
  const selectedCount = selectedIds.size
  const unmappedSelectedCount = Array.from(selectedIds).filter(id => {
    const req = requirements.find(r => r.id === id)
    return req && req.linkedWbsIds.length === 0
  }).length

  const getLinkedWbsElements = (requirement: SOORequirement) => {
    return wbsElements.filter(wbs => requirement.linkedWbsIds.includes(wbs.id))
  }

  // Empty state
  if (requirements.length === 0) {
    if (!hasUploadedRfp) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Upload className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements yet</h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            Go to the <span className="font-medium">Upload</span> tab to extract requirements from an RFP document.
          </p>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ClipboardList className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements extracted</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Re-upload the RFP or add requirements manually.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with stats */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
              <span className="text-sm text-gray-500">Requirements</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-gray-700">{stats.mapped} mapped</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Circle className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{stats.unmapped} unmapped</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Total Hours:</span>
            <span className="text-lg font-semibold text-emerald-600">{formatHours(stats.totalHours)}</span>
          </div>
        </div>

        {/* Search and filter row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={onFilterChange}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unmapped">Unmapped</SelectItem>
              <SelectItem value="mapped">Mapped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selection action bar */}
      {selectedCount > 0 && (
        <div className="flex-shrink-0 px-6 py-3 border-b border-emerald-200 bg-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-emerald-800">
                {selectedCount} selected
              </span>
              {selectedCount !== unmappedSelectedCount && (
                <span className="text-xs text-emerald-600">
                  ({unmappedSelectedCount} unmapped)
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-7 text-xs text-emerald-700 hover:text-emerald-900"
              >
                Clear
              </Button>
            </div>
            <Button
              onClick={onGenerateWbs}
              disabled={isGenerating || unmappedSelectedCount === 0}
              className="h-8 bg-emerald-600 hover:bg-emerald-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate WBS ({unmappedSelectedCount})
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Requirements list */}
      <div className="flex-1 overflow-y-auto">
        {/* Table header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-2 z-10">
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="w-8">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    const input = el as unknown as HTMLInputElement
                    input.indeterminate = someSelected && !allSelected
                  }
                }}
                onCheckedChange={onSelectAll}
                className="w-4 h-4"
              />
            </div>
            <div className="w-6" /> {/* Status icon */}
            <div className="w-24">Ref #</div>
            <div className="flex-1">Requirement</div>
            <div className="w-20">Type</div>
            <div className="w-24 text-right">WBS</div>
          </div>
        </div>

        {/* Requirements rows */}
        <div className="divide-y divide-gray-100">
          {requirements.map((req) => {
            const isSelected = selectedIds.has(req.id)
            const isMapped = req.linkedWbsIds.length > 0
            const isReqGenerating = generatingIds.has(req.id)
            const linkedWbs = getLinkedWbsElements(req)

            return (
              <RequirementRow
                key={req.id}
                requirement={req}
                isSelected={isSelected}
                isMapped={isMapped}
                isGenerating={isReqGenerating}
                linkedWbs={linkedWbs}
                onToggleSelection={() => onToggleSelection(req.id)}
                onViewWbs={onViewWbs}
                onUnlinkWbs={(wbsId) => onUnlinkWbs(req.id, wbsId)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface RequirementRowProps {
  requirement: SOORequirement
  isSelected: boolean
  isMapped: boolean
  isGenerating: boolean
  linkedWbs: EnhancedWBSElement[]
  onToggleSelection: () => void
  onViewWbs: (wbs: EnhancedWBSElement) => void
  onUnlinkWbs: (wbsId: string) => void
}

function RequirementRow({
  requirement,
  isSelected,
  isMapped,
  isGenerating,
  linkedWbs,
  onToggleSelection,
  onViewWbs,
  onUnlinkWbs,
}: RequirementRowProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  return (
    <div className={`
      group transition-colors
      ${isGenerating ? 'bg-blue-50' : isSelected ? 'bg-emerald-50/50' : 'hover:bg-gray-50'}
    `}>
      {/* Main row */}
      <div className="flex items-center gap-4 px-6 py-3">
        <div className="w-8">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            disabled={isGenerating}
            className="w-4 h-4"
          />
        </div>
        <div className="w-6">
          {isGenerating ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          ) : isMapped ? (
            <Tooltip>
              <TooltipTrigger>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Mapped to {linkedWbs.length} WBS</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger>
                <Circle className="w-4 h-4 text-gray-300" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Not yet mapped</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="w-24">
          <span className="text-xs font-mono text-gray-500">
            {requirement.referenceNumber}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {requirement.title}
          </h4>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {requirement.description}
          </p>
        </div>
        <div className="w-20">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 h-5 ${getTypeColor(requirement.type)}`}
          >
            {requirement.type}
          </Badge>
        </div>
        <div className="w-24 text-right">
          {linkedWbs.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <Link2 className="w-3 h-3" />
              {linkedWbs.length}
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expanded linked WBS */}
      {isExpanded && linkedWbs.length > 0 && (
        <div className="px-6 pb-3 pl-20">
          <div className="space-y-1.5 bg-gray-50 rounded-lg p-2">
            {linkedWbs.map(wbs => (
              <div
                key={wbs.id}
                className="flex items-center justify-between gap-2 p-2 bg-white rounded group/wbs"
              >
                <button
                  onClick={() => onViewWbs(wbs)}
                  className="flex items-center gap-2 text-left flex-1 min-w-0"
                >
                  <ArrowRight className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs font-mono text-gray-500">{wbs.wbsNumber}</span>
                  <span className="text-xs text-gray-700 truncate">{wbs.title}</span>
                  <span className="text-xs text-gray-400">{formatHours(wbs.totalHours)}h</span>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 opacity-0 group-hover/wbs:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    onUnlinkWbs(wbs.id)
                  }}
                >
                  <Unlink className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
