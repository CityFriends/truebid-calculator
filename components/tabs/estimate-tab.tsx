"use client"

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Search, Plus, ChevronRight, Sparkles, Trash2, Pencil, Link2, Unlink,
  FileText, Clock, CheckCircle2, Circle, ArrowRight, GripVertical,
  AlertCircle, ChevronDown, ChevronUp, X, Users, Info, Building2,
  Target, ClipboardList, Layers, Filter, MoreHorizontal, ExternalLink,
  RefreshCw, Check, AlertTriangle, Loader2, Upload
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAppContext, type ExtractedRequirement } from '@/contexts/app-context'
import { Progress } from '@/components/ui/progress'
import { requirementsApi } from '@/lib/api'
import { useParams } from 'next/navigation'

// ============================================================================
// TYPES
// ============================================================================

interface SOORequirement {
  id: string
  referenceNumber: string
  title: string
  description: string
  type: 'functional' | 'technical' | 'compliance' | 'management' | 'other'
  category: string
  source: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  linkedWbsIds: string[]
}

interface LaborEstimate {
  id: string
  roleId: string
  roleName: string
  hoursByPeriod: {
    base: number
    option1: number
    option2: number
    option3: number
    option4: number
  }
  rationale: string
  confidence: 'high' | 'medium' | 'low'
  isAISuggested?: boolean
  isOrphaned?: boolean
}

interface WBSRisk {
  id: string
  description: string
  probability: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  mitigation: string
}

interface EnhancedWBSElement {
  id: string
  wbsNumber: string
  title: string
  sowReference: string
  why: string
  what: string
  notIncluded: string
  assumptions: string[]
  estimateMethod: 'engineering' | 'analogous' | 'parametric' | 'expert'
  laborEstimates: LaborEstimate[]
  linkedRequirementIds: string[]
  totalHours: number
  confidence: 'high' | 'medium' | 'low'
  risks?: WBSRisk[]
  dependencies?: string[]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getTypeColor = (type: string) => {
  switch (type) {
    case 'functional': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'technical': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'compliance': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'management': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-700'
    case 'high': return 'bg-orange-100 text-orange-700'
    case 'medium': return 'bg-yellow-100 text-yellow-700'
    case 'low': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

const getConfidenceColor = (confidence: string) => {
  switch (confidence) {
    case 'high': return 'text-emerald-600'
    case 'medium': return 'text-amber-600'
    case 'low': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

const formatHours = (hours: number) => {
  return (hours || 0).toLocaleString()
}

// ============================================================================
// REQUIREMENT CARD COMPONENT
// ============================================================================

interface RequirementCardProps {
  requirement: SOORequirement
  isSelected: boolean
  isMapped: boolean
  isGenerating: boolean
  isHighlighted: boolean
  linkedWbsElements: EnhancedWBSElement[]
  onToggleSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onGenerate: () => void
  onViewLinkedWbs: (wbs: EnhancedWBSElement) => void
  onUnlink: (wbsId: string) => void
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

function RequirementCard({
  requirement,
  isSelected,
  isMapped,
  isGenerating,
  isHighlighted,
  linkedWbsElements,
  onToggleSelect,
  onEdit,
  onDelete,
  onGenerate,
  onViewLinkedWbs,
  onUnlink,
  onDragStart,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
}: RequirementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      draggable={!isGenerating}
      onDragStart={isGenerating ? undefined : onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        group rounded-lg border transition-all duration-200
        ${isGenerating
          ? 'border-blue-300 bg-blue-50/50 cursor-wait'
          : 'cursor-grab active:cursor-grabbing'
        }
        ${isHighlighted
          ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200 shadow-md'
          : isSelected
            ? 'border-emerald-300 bg-emerald-50/50'
            : isMapped
              ? 'border-gray-200 bg-white hover:border-gray-300'
              : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
    >
      {/* Main Card Content */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Selection Checkbox */}
          <div className="pt-0.5">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              disabled={isGenerating}
              className={`
                w-5 h-5 border-2 transition-colors
                ${isMapped
                  ? 'border-emerald-400 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500'
                  : 'border-gray-400 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500'
                }
              `}
            />
          </div>

          {/* Mapping Status Indicator */}
          <div className="pt-0.5">
            {isGenerating ? (
              <Tooltip>
                <TooltipTrigger>
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Generating WBS...</p>
                </TooltipContent>
              </Tooltip>
            ) : isMapped ? (
              <Tooltip>
                <TooltipTrigger>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Mapped to {linkedWbsElements.length} WBS element{linkedWbsElements.length !== 1 ? 's' : ''}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger>
                  <Circle className="w-4 h-4 text-gray-300" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Not yet mapped to WBS</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-500">
                    {requirement.referenceNumber}
                  </span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${getTypeColor(requirement.type)}`}>
                    {requirement.type}
                  </Badge>
                </div>
                <h4 className="text-sm font-medium text-gray-900 leading-tight">
                  {requirement.title}
                </h4>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Generate WBS button for unmapped requirements */}
                {!isMapped && !isGenerating && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          onGenerate()
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Generate WBS with AI</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                  onClick={onEdit}
                  disabled={isGenerating}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                  onClick={onDelete}
                  disabled={isGenerating}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Description preview */}
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {requirement.description}
            </p>

            {/* Generating status */}
            {isGenerating && (
              <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Generating WBS element...</span>
              </div>
            )}
          </div>
        </div>

        {/* Linked WBS Elements (if any) */}
        {isMapped && linkedWbsElements.length > 0 && (
          <div className="mt-3 ml-11">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {linkedWbsElements.length} linked WBS element{linkedWbsElements.length !== 1 ? 's' : ''}
            </button>
            
            {isExpanded && (
              <div className="mt-2 space-y-1.5">
                {linkedWbsElements.map(wbs => (
                  <div 
                    key={wbs.id}
                    className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-md group/wbs"
                  >
                    <button
                      onClick={() => onViewLinkedWbs(wbs)}
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
                        onUnlink(wbs.id)
                      }}
                    >
                      <Unlink className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// WBS ELEMENT CARD COMPONENT
// ============================================================================

interface WBSCardProps {
  wbs: EnhancedWBSElement
  linkedRequirements: SOORequirement[]
  isNew?: boolean
  isHighlighted?: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

function WBSCard({
  wbs,
  linkedRequirements,
  isNew = false,
  isHighlighted = false,
  onView,
  onEdit,
  onDelete,
  onMouseEnter,
  onMouseLeave,
}: WBSCardProps) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        group rounded-lg border bg-white transition-all duration-300
        ${isNew
          ? 'border-emerald-400 ring-2 ring-emerald-200 shadow-lg shadow-emerald-100 animate-in fade-in slide-in-from-top-2'
          : isHighlighted
            ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200 shadow-md'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      <div className="p-3">
        <div className="flex items-start gap-3">

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-semibold text-emerald-600">
                    {wbs.wbsNumber}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] px-1.5 py-0 h-4 ${getConfidenceColor(wbs.confidence)}`}
                  >
                    {wbs.confidence}
                  </Badge>
                </div>
                <h4 
                  className="text-sm font-medium text-gray-900 leading-tight cursor-pointer hover:text-emerald-600"
                  onClick={onView}
                >
                  {wbs.title}
                </h4>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                  onClick={onEdit}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                  onClick={onDelete}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatHours(wbs.totalHours)} hours
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {wbs.laborEstimates.length} roles
              </span>
              {linkedRequirements.length > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Link2 className="w-3 h-3" />
                  {linkedRequirements.length} req{linkedRequirements.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Linked Requirements Preview */}
            {linkedRequirements.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {linkedRequirements.slice(0, 3).map(req => (
                  <Badge 
                    key={req.id}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 bg-gray-100"
                  >
                    {req.referenceNumber}
                  </Badge>
                ))}
                {linkedRequirements.length > 3 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-gray-100">
                    +{linkedRequirements.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// WBS SLIDEOUT PANEL
// ============================================================================

interface WBSSlideoutProps {
  wbs: EnhancedWBSElement | null
  linkedRequirements: SOORequirement[]
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}

function WBSSlideout({ wbs, linkedRequirements, isOpen, onClose, onEdit }: WBSSlideoutProps) {
  if (!wbs || !isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl 
                      border-l border-gray-200 overflow-y-auto z-50 
                      animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 
                        flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono font-semibold text-emerald-600">
                {wbs.wbsNumber}
              </span>
              <Badge 
                variant="outline" 
                className={`text-xs ${getConfidenceColor(wbs.confidence)}`}
              >
                {wbs.confidence} confidence
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{wbs.title}</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit} className="h-8">
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="text-2xl leading-none h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Task Description Section */}
          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              Task Description
            </h4>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500 uppercase tracking-wider">Why (Purpose)</Label>
                <p className="text-sm text-gray-700 mt-1">{wbs.why || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 uppercase tracking-wider">What (Deliverables)</Label>
                <p className="text-sm text-gray-700 mt-1">{wbs.what || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 uppercase tracking-wider">Not Included</Label>
                <p className="text-sm text-gray-700 mt-1">{wbs.notIncluded || 'Not specified'}</p>
              </div>
            </div>
          </section>

          {/* Assumptions */}
          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Assumptions
            </h4>
            {wbs.assumptions.length > 0 ? (
              <ul className="space-y-1">
                {wbs.assumptions.map((assumption, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {assumption}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No assumptions documented</p>
            )}
          </section>

          {/* Linked Requirements */}
          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-600" />
              Linked Requirements ({linkedRequirements.length})
            </h4>
            {linkedRequirements.length > 0 ? (
              <div className="space-y-2">
                {linkedRequirements.map(req => (
                  <div key={req.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">{req.referenceNumber}</span>
                      <Badge variant="outline" className={`text-[10px] ${getTypeColor(req.type)}`}>
                        {req.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">{req.title}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No requirements linked</p>
            )}
          </section>

          {/* Labor Estimates */}
          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Labor Estimates
            </h4>
            <div className="space-y-3">
              {wbs.laborEstimates.map((labor, idx) => (
                <div key={idx} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{labor.roleName}</span>
                    <Badge variant="outline" className={`text-xs ${getConfidenceColor(labor.confidence)}`}>
                      {labor.confidence}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-gray-500">Base</div>
                      <div className="font-semibold text-gray-900">{labor.hoursByPeriod.base}h</div>
                    </div>
                    {labor.hoursByPeriod.option1 !== undefined && (
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-gray-500">OY1</div>
                        <div className="font-semibold text-gray-900">{labor.hoursByPeriod.option1}h</div>
                      </div>
                    )}
                    {labor.hoursByPeriod.option2 !== undefined && (
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-gray-500">OY2</div>
                        <div className="font-semibold text-gray-900">{labor.hoursByPeriod.option2}h</div>
                      </div>
                    )}
                  </div>
                  {labor.rationale && (
                    <p className="text-xs text-gray-500 mt-2 italic">{labor.rationale}</p>
                  )}
                </div>
              ))}
              {wbs.laborEstimates.length === 0 && (
                <p className="text-sm text-gray-500 italic">No labor estimates added</p>
              )}
            </div>
          </section>

          {/* Summary */}
          <section className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-emerald-800">Total Hours</span>
              <span className="text-lg font-bold text-emerald-700">{formatHours(wbs.totalHours)}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-emerald-600">Estimate Method</span>
              <span className="text-xs font-medium text-emerald-700 capitalize">{wbs.estimateMethod}</span>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

// ============================================================================
// BULK GENERATE DIALOG
// ============================================================================

interface BulkGenerateDialogProps {
  isOpen: boolean
  onClose: () => void
  isGenerating: boolean
  progress: number
  generatedWbs: EnhancedWBSElement[]
  error: string | null
  selectedCount: number
  onAccept: () => void
  onDiscard: () => void
}

function BulkGenerateDialog({
  isOpen,
  onClose,
  isGenerating,
  progress,
  generatedWbs,
  error,
  selectedCount,
  onAccept,
  onDiscard,
}: BulkGenerateDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            AI WBS Generation
          </DialogTitle>
          <DialogDescription>
            {isGenerating 
              ? `Generating WBS elements for ${selectedCount} requirements...`
              : error
                ? 'An error occurred during generation'
                : `Generated ${generatedWbs.length} WBS elements`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isGenerating ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-600">
                    Analyzing requirements and generating WBS structure...
                  </p>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-gray-500">{progress}% complete</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Generation Failed</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {generatedWbs.map((wbs, idx) => (
                <div key={idx} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono font-semibold text-emerald-600">
                      {wbs.wbsNumber}
                    </span>
                    <Badge variant="outline" className={`text-xs ${getConfidenceColor(wbs.confidence)}`}>
                      {wbs.confidence}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">{wbs.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{wbs.why}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{formatHours(wbs.totalHours)} hours</span>
                    <span>{wbs.laborEstimates.length} roles</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          {isGenerating ? (
            <Button variant="outline" onClick={onClose} disabled>
              Cancel
            </Button>
          ) : error ? (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onDiscard}>
                Discard
              </Button>
              <Button onClick={onAccept} className="bg-emerald-600 hover:bg-emerald-700">
                <Check className="w-4 h-4 mr-2" />
                Accept {generatedWbs.length} WBS
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// EMPTY STATES
// ============================================================================

function RequirementsEmptyState({ onAdd, hasUploadedRfp, isFiltered }: { onAdd: () => void; hasUploadedRfp: boolean; isFiltered: boolean }) {
  if (isFiltered) {
    // No results due to search/filter
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-2">No matching requirements</p>
        <p className="text-xs text-gray-500">
          Try adjusting your search or filter
        </p>
      </div>
    )
  }

  if (!hasUploadedRfp) {
    // No RFP uploaded yet
    return (
      <div className="text-center py-12">
        <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-2">No requirements yet</p>
        <p className="text-xs text-gray-500 mb-4">
          Go to the <span className="font-medium">Upload</span> tab to extract requirements from an RFP
        </p>
      </div>
    )
  }

  // RFP uploaded but no requirements (shouldn't happen often)
  return (
    <div className="text-center py-12">
      <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-600 mb-2">No requirements extracted</p>
      <p className="text-xs text-gray-500 mb-4">
        Add requirements manually or re-upload the RFP
      </p>
      <Button variant="outline" size="sm" onClick={onAdd}>
        <Plus className="w-4 h-4 mr-2" />
        Add Requirement
      </Button>
    </div>
  )
}

function WBSEmptyState({ hasRequirements }: { hasRequirements: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Layers className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-sm text-gray-600 mb-2">No WBS elements yet</p>
      <p className="text-xs text-gray-500 max-w-[240px]">
        {hasRequirements
          ? 'Select requirements and click "Generate WBS" to create work breakdown structure elements using AI'
          : 'Add requirements first, then generate WBS elements'
        }
      </p>
      {hasRequirements && (
        <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200 border-dashed">
          <p className="text-xs text-emerald-700">
            <strong>Tip:</strong> Drag WBS elements onto requirements to create links, or use AI generation
          </p>
        </div>
      )}
    </div>
  )
}

// Placeholder card shown while WBS is being generated
function WBSGeneratingPlaceholder({ referenceNumber }: { referenceNumber: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">Generating WBS...</span>
          </div>
          <p className="text-xs text-emerald-600">
            Creating work breakdown structure for <span className="font-mono font-medium">{referenceNumber}</span>
          </p>
        </div>
      </div>
      {/* Shimmer effect skeleton */}
      <div className="mt-3 space-y-2">
        <div className="h-3 bg-emerald-200/50 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-emerald-200/50 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  )
}

// ============================================================================
// MAIN ESTIMATE TAB COMPONENT
// ============================================================================

export function EstimateTab() {
  const {
    companyRoles,
    solicitation,
    estimateWbsElements,
    setEstimateWbsElements,
    indirectRates,
    uiBillableHours,
    uiProfitMargin,
    extractedRequirements,
    setExtractedRequirements,
  } = useAppContext()

  // Get proposal ID from URL for API calls
  const params = useParams()
  const proposalId = params?.id as string | undefined
  
  // ========== STATE ==========
  
  // Requirements state
  const [requirements, setRequirements] = useState<SOORequirement[]>([])
  const [requirementSearch, setRequirementSearch] = useState('')
  const [requirementFilter, setRequirementFilter] = useState<'all' | 'unmapped' | 'mapped'>('all')
  const [selectedRequirements, setSelectedRequirements] = useState<Set<string>>(new Set())

  // Hover state for cross-column highlighting
  const [hoveredRequirementId, setHoveredRequirementId] = useState<string | null>(null)
  const [hoveredWbsId, setHoveredWbsId] = useState<string | null>(null)

  // WBS state
  const [wbsElements, setWbsElements] = useState<EnhancedWBSElement[]>([])
  const [wbsSearch, setWbsSearch] = useState('')
  const [selectedWbs, setSelectedWbs] = useState<EnhancedWBSElement | null>(null)
  
  // Drag and drop state (drag requirements to WBS area)
  const [draggedRequirement, setDraggedRequirement] = useState<SOORequirement | null>(null)
  const [isDragOverWbsArea, setIsDragOverWbsArea] = useState(false)
  
  // Dialog state
  const [showAddRequirement, setShowAddRequirement] = useState(false)
  const [showAddWbs, setShowAddWbs] = useState(false)
  const [editingRequirement, setEditingRequirement] = useState<SOORequirement | null>(null)
  const [editingWbs, setEditingWbs] = useState<EnhancedWBSElement | null>(null)
  const [preLinkedRequirement, setPreLinkedRequirement] = useState<SOORequirement | null>(null)

  // WBS form state (for Add/Edit slideout)
  const [wbsFormLoading, setWbsFormLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    taskDescription: true,
    laborEstimates: true,
    assumptions: false,
    risks: false,
    dependencies: false,
  })
  const [wbsForm, setWbsForm] = useState({
    wbsNumber: '',
    title: '',
    sowReference: '',
    why: '',
    what: '',
    notIncluded: '',
    estimateMethod: 'engineering' as 'engineering' | 'analogous' | 'parametric' | 'expert',
    confidence: 'medium' as 'high' | 'medium' | 'low',
    laborEstimates: [] as LaborEstimate[],
    assumptions: [] as string[],
    risks: [] as WBSRisk[],
    dependencies: [] as string[],
  })
  
  // Bulk generation state
  const [showBulkGenerateDialog, setShowBulkGenerateDialog] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedWbs, setGeneratedWbs] = useState<EnhancedWBSElement[]>([])
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Track which requirements are currently generating WBS
  const [generatingRequirementIds, setGeneratingRequirementIds] = useState<Set<string>>(new Set())

  // Track newly created WBS for highlight animation (auto-clears after 3s)
  const [newlyCreatedWbsIds, setNewlyCreatedWbsIds] = useState<Set<string>>(new Set())

  // Track if we've done initial data load (to prevent useEffect from resetting state)
  const isInitializedRef = React.useRef(false)

  // ========== LOAD REQUIREMENTS FROM CONTEXT ==========

  // Map extracted requirement type to SOO requirement type
  const mapRequirementType = useCallback((type: string): SOORequirement['type'] => {
    const typeMap: Record<string, SOORequirement['type']> = {
      'delivery': 'functional',
      'reporting': 'management',
      'staffing': 'management',
      'compliance': 'compliance',
      'governance': 'management',
      'transition': 'functional',
      'other': 'other',
      // Also handle direct SOORequirement types
      'functional': 'functional',
      'technical': 'technical',
      'management': 'management',
    }
    return typeMap[type] || 'other'
  }, [])

  // Map category from requirement type
  const mapCategory = useCallback((type: string): string => {
    const categoryMap: Record<string, string> = {
      'delivery': 'Deliverables',
      'reporting': 'Reporting',
      'staffing': 'Staffing',
      'compliance': 'Compliance',
      'governance': 'Governance',
      'transition': 'Transition',
      'functional': 'Core Features',
      'technical': 'Technical',
      'management': 'Management',
      'other': 'Other',
    }
    return categoryMap[type] || 'Other'
  }, [])

  useEffect(() => {
    // Always sync WBS from context (for persistence across tab/page navigation)
    // Transform EstimateWBSElement to EnhancedWBSElement with defaults for missing fields
    if (estimateWbsElements && estimateWbsElements.length > 0) {
      const enhancedWbs: EnhancedWBSElement[] = estimateWbsElements.map(wbs => {
        // Cast through unknown to access potentially existing enhanced fields
        const enhanced = wbs as unknown as Partial<EnhancedWBSElement>
        return {
          id: wbs.id,
          wbsNumber: wbs.wbsNumber,
          title: wbs.title,
          sowReference: enhanced.sowReference || '',
          why: enhanced.why || '',
          what: enhanced.what || wbs.description || '',
          notIncluded: enhanced.notIncluded || '',
          assumptions: enhanced.assumptions || [],
          estimateMethod: enhanced.estimateMethod || 'engineering',
          laborEstimates: wbs.laborEstimates.map((le, idx) => ({
            id: le.id || `${wbs.id}-labor-${idx}`,
            roleId: le.roleId,
            roleName: le.roleName,
            hoursByPeriod: {
              base: le.hoursByPeriod.base || 0,
              option1: le.hoursByPeriod.option1 || 0,
              option2: le.hoursByPeriod.option2 || 0,
              option3: le.hoursByPeriod.option3 || 0,
              option4: le.hoursByPeriod.option4 || 0,
            },
            rationale: le.rationale,
            confidence: le.confidence,
          })),
          linkedRequirementIds: enhanced.linkedRequirementIds || [],
          totalHours: wbs.totalHours || 0,
          confidence: enhanced.confidence || 'medium',
          risks: enhanced.risks || [],
          dependencies: enhanced.dependencies || [],
        }
      })
      setWbsElements(enhancedWbs)
    }

    // Always sync requirements from extractedRequirements when they exist
    // This handles both initial load AND navigation back from other pages
    if (extractedRequirements && extractedRequirements.length > 0) {
      // Check if any requirements need reference numbers assigned
      const needsRefNumbers = extractedRequirements.some(req => !req.reference_number)

      // If reference numbers are missing, assign them and sync to context
      if (needsRefNumbers) {
        const updatedExtracted = extractedRequirements.map((req, index) => ({
          ...req,
          reference_number: req.reference_number || `REQ-${String(index + 1).padStart(3, '0')}`
        }))
        setExtractedRequirements(updatedExtracted)
      }

      const mappedRequirements: SOORequirement[] = extractedRequirements.map((req, index) => {
        // Use existing title, or extract from text as fallback
        const text = req.text || req.description || ''
        let title = req.title
        if (!title && text) {
          const firstSentenceMatch = text.match(/^[^.!?]+[.!?]/)
          title = firstSentenceMatch
            ? firstSentenceMatch[0].trim()
            : text.slice(0, 100) + (text.length > 100 ? '...' : '')
        }

        // Use stable reference number from context (assigned above or from previous save)
        const referenceNumber = req.reference_number || `REQ-${String(index + 1).padStart(3, '0')}`

        return {
          id: req.id || `req-${index + 1}`,
          referenceNumber,
          title: title || `Requirement ${index + 1}`,
          description: text,
          type: mapRequirementType(req.type),
          category: mapCategory(req.type),
          source: req.sourceSection || req.source || 'RFP',
          priority: 'medium' as const,
          linkedWbsIds: req.linkedWbsIds || []
        }
      })
      setRequirements(mappedRequirements)
      isInitializedRef.current = true
      return
    }

    // Skip further initialization if already done (prevents clearing on dependency changes)
    if (isInitializedRef.current) {
      return
    }

    // Only clear requirements if no RFP was uploaded
    // Check solicitation.analyzedFromDocument to verify RFP upload
    if (!solicitation?.analyzedFromDocument) {
      // No RFP uploaded - keep requirements empty
      setRequirements([])
      isInitializedRef.current = true
      return
    }

    // Mark as initialized
    isInitializedRef.current = true
  }, [extractedRequirements, solicitation?.analyzedFromDocument, mapRequirementType, mapCategory, estimateWbsElements, setExtractedRequirements])

  // Auto-generate WBS when a requirement is dropped and dialog opens
  useEffect(() => {
    if (preLinkedRequirement && showAddWbs && !editingWbs) {
      // Reset form and start loading
      setWbsForm({
        wbsNumber: '',
        title: '',
        sowReference: preLinkedRequirement.source || '',
        why: '',
        what: '',
        notIncluded: '',
        estimateMethod: 'engineering',
        confidence: 'medium',
        laborEstimates: [],
        assumptions: [],
        risks: [],
        dependencies: [],
      })
      setWbsFormLoading(true)

      // Calculate next WBS number
      const nextWbsNumber = wbsElements.length === 0
        ? '1.1'
        : (() => {
            const numbers = wbsElements.map(w => {
              const parts = w.wbsNumber.split('.')
              return { major: parseInt(parts[0]) || 1, minor: parseInt(parts[1]) || 0 }
            }).sort((a, b) => a.major === b.major ? b.minor - a.minor : b.major - a.major)
            const highest = numbers[0]
            return `${highest.major}.${highest.minor + 1}`
          })()

      // Use Labor Categories from Account Center (companyRoles)
      // These are the company's defined roles that the AI should pick from
      const availableRolesForApi = companyRoles.map(r => ({
        id: r.id,
        name: r.title,
        laborCategory: r.laborCategory,
        description: r.description,
        levels: r.levels.map(l => ({
          level: l.level,
          levelName: l.levelName,
          yearsExperience: l.yearsExperience,
          baseSalary: l.steps[0]?.salary || 0,
        })),
      }))

      // Call API to generate WBS
      fetch('/api/generate-wbs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements: [{
            id: preLinkedRequirement.id,
            referenceNumber: preLinkedRequirement.referenceNumber,
            title: preLinkedRequirement.title,
            description: preLinkedRequirement.description,
            type: preLinkedRequirement.type,
            category: preLinkedRequirement.category,
            source: preLinkedRequirement.source,
          }],
          availableRoles: availableRolesForApi,
          existingWbsNumbers: wbsElements.map(w => w.wbsNumber),
          contractContext: {
            title: solicitation?.title || 'Untitled',
            agency: 'Government Agency',
            contractType: 'tm',
            periodOfPerformance: { baseYear: true, optionYears: 2 }
          }
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.wbsElements && data.wbsElements.length > 0) {
            const generated = data.wbsElements[0]
            setWbsForm({
              wbsNumber: generated.wbsNumber || nextWbsNumber,
              title: generated.title || '',
              sowReference: generated.sowReference || preLinkedRequirement.source || '',
              why: generated.why || '',
              what: generated.what || '',
              notIncluded: generated.notIncluded || '',
              estimateMethod: generated.estimateMethod || 'engineering',
              confidence: generated.confidence || 'medium',
              laborEstimates: (generated.laborEstimates || []).map((le: any) => ({
                roleId: le.roleId || '',
                roleName: le.roleName || '',
                hoursByPeriod: {
                  base: le.hoursByPeriod?.base || 0,
                  option1: le.hoursByPeriod?.option1 || 0,
                  option2: le.hoursByPeriod?.option2 || 0,
                  option3: le.hoursByPeriod?.option3 || 0,
                  option4: le.hoursByPeriod?.option4 || 0,
                },
                rationale: le.rationale || '',
                confidence: le.confidence || 'medium',
              })),
              assumptions: generated.assumptions || [],
              risks: (generated.risks || []).map((r: any) => ({
                id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                description: r.description || '',
                probability: r.likelihood || r.probability || 'medium',
                impact: r.impact || 'medium',
                mitigation: r.mitigation || '',
              })),
              dependencies: generated.suggestedDependencies || generated.dependencies || [],
            })
          } else {
            // Fallback to basic defaults if API fails
            setWbsForm(prev => ({
              ...prev,
              wbsNumber: nextWbsNumber,
              title: `Implement: ${preLinkedRequirement.title}`,
              sowReference: preLinkedRequirement.source || preLinkedRequirement.referenceNumber,
            }))
          }
        })
        .catch(() => {
          // Fallback on error
          setWbsForm(prev => ({
            ...prev,
            wbsNumber: nextWbsNumber,
            title: `Implement: ${preLinkedRequirement.title}`,
            sowReference: preLinkedRequirement.source || preLinkedRequirement.referenceNumber,
          }))
        })
        .finally(() => {
          setWbsFormLoading(false)
        })
    }
  }, [preLinkedRequirement, showAddWbs, editingWbs, wbsElements, companyRoles])

  // Reset form when dialog closes
  useEffect(() => {
    if (!showAddWbs && !editingWbs) {
      setWbsForm({
        wbsNumber: '',
        title: '',
        sowReference: '',
        why: '',
        what: '',
        notIncluded: '',
        estimateMethod: 'engineering',
        confidence: 'medium',
        laborEstimates: [],
        assumptions: [],
        risks: [],
        dependencies: [],
      })
      setWbsFormLoading(false)
    }
  }, [showAddWbs, editingWbs])

  // Populate form when editing an existing WBS
  useEffect(() => {
    if (editingWbs) {
      setWbsForm({
        wbsNumber: editingWbs.wbsNumber || '',
        title: editingWbs.title || '',
        sowReference: editingWbs.sowReference || '',
        why: editingWbs.why || '',
        what: editingWbs.what || '',
        notIncluded: editingWbs.notIncluded || '',
        estimateMethod: editingWbs.estimateMethod || 'engineering',
        confidence: editingWbs.confidence || 'medium',
        laborEstimates: editingWbs.laborEstimates || [],
        assumptions: editingWbs.assumptions || [],
        risks: editingWbs.risks || [],
        dependencies: editingWbs.dependencies || [],
      })
    }
  }, [editingWbs])

  // ========== SHARED WBS GENERATION FUNCTION ==========

  // Calculate hourly rate from base salary using indirect rates
  const calculateHourlyRate = useCallback((baseSalary: number) => {
    const standardHours = 2080
    const baseRate = baseSalary / standardHours
    const afterFringe = baseRate * (1 + indirectRates.fringe)
    const afterOverhead = afterFringe * (1 + indirectRates.overhead)
    const afterGA = afterOverhead * (1 + indirectRates.ga)
    const withProfit = afterGA * (1 + uiProfitMargin / 100)
    return withProfit
  }, [indirectRates, uiProfitMargin])

  // Shared function to generate WBS for a requirement (used by drag-drop, per-card button, bulk)
  const generateWbsForRequirement = useCallback(async (requirement: SOORequirement) => {
    // Mark as generating
    setGeneratingRequirementIds(prev => new Set(prev).add(requirement.id))

    try {
      // Calculate next WBS number
      const nextWbsNumber = wbsElements.length === 0
        ? '1.1'
        : (() => {
            const numbers = wbsElements.map(w => {
              const parts = w.wbsNumber.split('.')
              return { major: parseInt(parts[0]) || 1, minor: parseInt(parts[1]) || 0 }
            }).sort((a, b) => a.major === b.major ? b.minor - a.minor : b.major - a.major)
            const highest = numbers[0]
            return `${highest.major}.${highest.minor + 1}`
          })()

      // Prepare roles for API
      const availableRolesForApi = companyRoles.map(r => ({
        id: r.id,
        name: r.title,
        laborCategory: r.laborCategory,
        description: r.description,
        levels: r.levels.map(l => ({
          level: l.level,
          levelName: l.levelName,
          yearsExperience: l.yearsExperience,
          baseSalary: l.steps[0]?.salary || 0,
        })),
      }))

      // Call API to generate WBS
      const response = await fetch('/api/generate-wbs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements: [{
            id: requirement.id,
            referenceNumber: requirement.referenceNumber,
            title: requirement.title,
            description: requirement.description,
            type: requirement.type,
            category: requirement.category,
            source: requirement.source,
          }],
          availableRoles: availableRolesForApi,
          existingWbsNumbers: wbsElements.map(w => w.wbsNumber),
          contractContext: {
            title: solicitation?.title || 'Untitled',
            agency: solicitation?.clientAgency || 'Government Agency',
            contractType: solicitation?.contractType?.toLowerCase() || 'tm',
            periodOfPerformance: solicitation?.periodOfPerformance || { baseYear: true, optionYears: 2 }
          }
        })
      })

      const data = await response.json()

      if (data.wbsElements && data.wbsElements.length > 0) {
        const generated = data.wbsElements[0]
        const newWbsId = `wbs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Create the new WBS element
        const newWbs: EnhancedWBSElement = {
          id: newWbsId,
          wbsNumber: generated.wbsNumber || nextWbsNumber,
          title: generated.title || `Implement: ${requirement.title}`,
          sowReference: generated.sowReference || requirement.source || '',
          why: generated.why || '',
          what: generated.what || '',
          notIncluded: generated.notIncluded || '',
          assumptions: generated.assumptions || [],
          estimateMethod: generated.estimateMethod || 'engineering',
          laborEstimates: (generated.laborEstimates || []).map((le: any) => ({
            roleId: le.roleId || '',
            roleName: le.roleName || '',
            hoursByPeriod: {
              base: le.hoursByPeriod?.base || 0,
              option1: le.hoursByPeriod?.option1 || 0,
              option2: le.hoursByPeriod?.option2 || 0,
              option3: le.hoursByPeriod?.option3 || 0,
              option4: le.hoursByPeriod?.option4 || 0,
            },
            rationale: le.rationale || '',
            confidence: le.confidence || 'medium',
          })),
          linkedRequirementIds: [requirement.id],
          totalHours: (generated.laborEstimates || []).reduce((sum: number, le: any) => {
            const hours = le.hoursByPeriod || {}
            return sum + (hours.base || 0) + (hours.option1 || 0) + (hours.option2 || 0) + (hours.option3 || 0) + (hours.option4 || 0)
          }, 0),
          confidence: generated.confidence || 'medium',
          risks: (generated.risks || []).map((r: any) => ({
            id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            description: r.description || '',
            probability: r.likelihood || r.probability || 'medium',
            impact: r.impact || 'medium',
            mitigation: r.mitigation || '',
          })),
          dependencies: generated.suggestedDependencies || generated.dependencies || [],
        }

        // Add WBS to state
        setWbsElements(prev => [...prev, newWbs])

        // Link requirement to WBS
        setRequirements(prev => prev.map(req =>
          req.id === requirement.id
            ? { ...req, linkedWbsIds: [...req.linkedWbsIds, newWbsId] }
            : req
        ))
        // Sync requirement linking to context for persistence
        setExtractedRequirements((prev: ExtractedRequirement[]) => (prev || []).map(req =>
          req.id === requirement.id
            ? { ...req, linkedWbsIds: [...(req.linkedWbsIds || []), newWbsId] }
            : req
        ))

        // Persist the link to the database
        const dbRequirement = requirements.find(r => r.id === requirement.id)
        if (proposalId && dbRequirement) {
          const updatedLinkedWbsIds = [...(dbRequirement.linkedWbsIds || []), newWbsId]
          console.log('[DEBUG] Persisting link to DB:', { reqId: dbRequirement.id, linked_wbs_ids: updatedLinkedWbsIds })
          requirementsApi.update(proposalId, {
            reqId: dbRequirement.id,
            linked_wbs_ids: updatedLinkedWbsIds
          })
            .then(res => console.log('[DEBUG] Link persisted:', res))
            .catch(err => console.error('[DEBUG] Failed to persist link:', err))
        }

        // Also sync to context for Roles & Pricing tab
        setEstimateWbsElements(prev => [...(prev || []), newWbs])

        // Add to newly created for highlight animation
        setNewlyCreatedWbsIds(prev => new Set(prev).add(newWbsId))
        // Auto-remove highlight after 3 seconds
        setTimeout(() => {
          setNewlyCreatedWbsIds(prev => {
            const next = new Set(prev)
            next.delete(newWbsId)
            return next
          })
        }, 3000)

        return newWbs
      } else {
        throw new Error('No WBS generated')
      }
    } catch (error) {
      console.error('WBS generation failed:', error)
      // Create a fallback WBS with basic info
      const nextWbsNumber = wbsElements.length === 0 ? '1.1' : `1.${wbsElements.length + 1}`
      const newWbsId = `wbs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const fallbackWbs: EnhancedWBSElement = {
        id: newWbsId,
        wbsNumber: nextWbsNumber,
        title: `Implement: ${requirement.title}`,
        sowReference: requirement.source || requirement.referenceNumber,
        why: '',
        what: requirement.description,
        notIncluded: '',
        assumptions: [],
        estimateMethod: 'engineering',
        laborEstimates: [],
        linkedRequirementIds: [requirement.id],
        totalHours: 0,
        confidence: 'low',
        risks: [],
        dependencies: [],
      }

      setWbsElements(prev => [...prev, fallbackWbs])
      setRequirements(prev => prev.map(req =>
        req.id === requirement.id
          ? { ...req, linkedWbsIds: [...req.linkedWbsIds, newWbsId] }
          : req
      ))
      // Sync requirement linking to context for persistence
      setExtractedRequirements((prev: ExtractedRequirement[]) => (prev || []).map(req =>
        req.id === requirement.id
          ? { ...req, linkedWbsIds: [...(req.linkedWbsIds || []), newWbsId] }
          : req
      ))
      setEstimateWbsElements(prev => [...(prev || []), fallbackWbs])

      // Add to newly created for highlight animation
      setNewlyCreatedWbsIds(prev => new Set(prev).add(newWbsId))
      setTimeout(() => {
        setNewlyCreatedWbsIds(prev => {
          const next = new Set(prev)
          next.delete(newWbsId)
          return next
        })
      }, 3000)

      return fallbackWbs
    } finally {
      // Remove from generating state
      setGeneratingRequirementIds(prev => {
        const next = new Set(prev)
        next.delete(requirement.id)
        return next
      })
    }
  }, [wbsElements, companyRoles, solicitation, setEstimateWbsElements, setExtractedRequirements])

  // ========== COMPUTED VALUES ==========
  
  const filteredRequirements = useMemo(() => {
    let filtered = requirements
    
    // Search filter
    if (requirementSearch) {
      const search = requirementSearch.toLowerCase()
      filtered = filtered.filter(req => 
        req.title.toLowerCase().includes(search) ||
        req.referenceNumber.toLowerCase().includes(search) ||
        req.description.toLowerCase().includes(search)
      )
    }
    
    // Status filter
    if (requirementFilter === 'unmapped') {
      filtered = filtered.filter(req => req.linkedWbsIds.length === 0)
    } else if (requirementFilter === 'mapped') {
      filtered = filtered.filter(req => req.linkedWbsIds.length > 0)
    }
    
    return filtered
  }, [requirements, requirementSearch, requirementFilter])

  const filteredWbs = useMemo(() => {
    if (!wbsSearch) return wbsElements
    const search = wbsSearch.toLowerCase()
    return wbsElements.filter(wbs => 
      wbs.title.toLowerCase().includes(search) ||
      wbs.wbsNumber.toLowerCase().includes(search)
    )
  }, [wbsElements, wbsSearch])

  const stats = useMemo(() => {
    const total = requirements.length
    const mapped = requirements.filter(r => r.linkedWbsIds.length > 0).length
    const unmapped = total - mapped
    const totalHours = wbsElements.reduce((sum, w) => sum + w.totalHours, 0)
    
    return { total, mapped, unmapped, totalHours }
  }, [requirements, wbsElements])

  const selectedUnmappedCount = useMemo(() => {
    return Array.from(selectedRequirements).filter(id => {
      const req = requirements.find(r => r.id === id)
      return req && req.linkedWbsIds.length === 0
    }).length
  }, [selectedRequirements, requirements])

  // ========== HANDLERS ==========

  const getLinkedWbsElements = useCallback((requirement: SOORequirement) => {
    return wbsElements.filter(wbs => requirement.linkedWbsIds.includes(wbs.id))
  }, [wbsElements])

  const getLinkedRequirements = useCallback((wbs: EnhancedWBSElement) => {
    return requirements.filter(req => req.linkedWbsIds.includes(wbs.id))
  }, [requirements])

  const handleToggleRequirementSelection = useCallback((reqId: string) => {
    setSelectedRequirements(prev => {
      const next = new Set(prev)
      if (next.has(reqId)) {
        next.delete(reqId)
      } else {
        next.add(reqId)
      }
      return next
    })
  }, [])

  const handleSelectAllUnmapped = useCallback(() => {
    const unmappedIds = requirements
      .filter(r => r.linkedWbsIds.length === 0)
      .map(r => r.id)
    setSelectedRequirements(new Set(unmappedIds))
  }, [requirements])

  const handleClearSelection = useCallback(() => {
    setSelectedRequirements(new Set())
  }, [])

  // Select all visible (filtered) requirements
  const handleSelectAllFiltered = useCallback(() => {
    const filteredIds = filteredRequirements.map(r => r.id)
    const allSelected = filteredIds.every(id => selectedRequirements.has(id))
    if (allSelected) {
      // Deselect all filtered
      setSelectedRequirements(prev => {
        const next = new Set(prev)
        filteredIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      // Select all filtered
      setSelectedRequirements(prev => new Set([...prev, ...filteredIds]))
    }
  }, [filteredRequirements, selectedRequirements])

  // Check if all filtered requirements are selected
  const allFilteredSelected = useMemo(() => {
    if (filteredRequirements.length === 0) return false
    return filteredRequirements.every(r => selectedRequirements.has(r.id))
  }, [filteredRequirements, selectedRequirements])

  // Check if some (but not all) filtered requirements are selected
  const someFilteredSelected = useMemo(() => {
    if (filteredRequirements.length === 0) return false
    const selectedCount = filteredRequirements.filter(r => selectedRequirements.has(r.id)).length
    return selectedCount > 0 && selectedCount < filteredRequirements.length
  }, [filteredRequirements, selectedRequirements])

  const handleLinkWbsToRequirement = useCallback((reqId: string, wbsId: string) => {
    // Get current linkedWbsIds for the requirement
    const currentReq = requirements.find(r => r.id === reqId)
    const newLinkedWbsIds = currentReq && !currentReq.linkedWbsIds.includes(wbsId)
      ? [...currentReq.linkedWbsIds, wbsId]
      : currentReq?.linkedWbsIds || [wbsId]

    setRequirements(prev => prev.map(req => {
      if (req.id === reqId && !req.linkedWbsIds.includes(wbsId)) {
        return { ...req, linkedWbsIds: [...req.linkedWbsIds, wbsId] }
      }
      return req
    }))

    setWbsElements(prev => prev.map(wbs => {
      if (wbs.id === wbsId && !wbs.linkedRequirementIds.includes(reqId)) {
        return { ...wbs, linkedRequirementIds: [...wbs.linkedRequirementIds, reqId] }
      }
      return wbs
    }))
    // Sync to context for persistence
    setEstimateWbsElements(prev => (prev || []).map(wbs => {
      if (wbs.id === wbsId && !wbs.linkedRequirementIds?.includes(reqId)) {
        return { ...wbs, linkedRequirementIds: [...(wbs.linkedRequirementIds || []), reqId] }
      }
      return wbs
    }))
    // Sync requirement linking to context for persistence
    setExtractedRequirements((prev: ExtractedRequirement[]) => (prev || []).map(req => {
      if (req.id === reqId && !req.linkedWbsIds?.includes(wbsId)) {
        return { ...req, linkedWbsIds: [...(req.linkedWbsIds || []), wbsId] }
      }
      return req
    }))

    // Sync to API (fire and forget)
    if (proposalId) {
      console.log('[Estimate] Linking requirement to WBS - API call:', {
        proposalId,
        reqId,
        newLinkedWbsIds
      })
      requirementsApi.update(proposalId, { reqId, linked_wbs_ids: newLinkedWbsIds })
        .then(response => console.log('[Estimate] Link API response:', response))
        .catch(err => console.warn('[Estimate] Failed to sync requirement link to API:', err))
    }
  }, [setEstimateWbsElements, setExtractedRequirements, requirements, proposalId])

  const handleUnlinkWbsFromRequirement = useCallback((reqId: string, wbsId: string) => {
    // Get current linkedWbsIds for the requirement after unlinking
    const currentReq = requirements.find(r => r.id === reqId)
    const newLinkedWbsIds = currentReq
      ? currentReq.linkedWbsIds.filter(id => id !== wbsId)
      : []

    setRequirements(prev => prev.map(req => {
      if (req.id === reqId) {
        return { ...req, linkedWbsIds: req.linkedWbsIds.filter(id => id !== wbsId) }
      }
      return req
    }))

    setWbsElements(prev => prev.map(wbs => {
      if (wbs.id === wbsId) {
        return { ...wbs, linkedRequirementIds: wbs.linkedRequirementIds.filter(id => id !== reqId) }
      }
      return wbs
    }))
    // Sync to context for persistence
    setEstimateWbsElements(prev => (prev || []).map(wbs => {
      if (wbs.id === wbsId) {
        return { ...wbs, linkedRequirementIds: (wbs.linkedRequirementIds || []).filter(id => id !== reqId) }
      }
      return wbs
    }))
    // Sync requirement unlinking to context for persistence
    setExtractedRequirements((prev: ExtractedRequirement[]) => (prev || []).map(req => {
      if (req.id === reqId) {
        return { ...req, linkedWbsIds: (req.linkedWbsIds || []).filter(id => id !== wbsId) }
      }
      return req
    }))

    // Sync to API (fire and forget)
    if (proposalId) {
      console.log('[Estimate] Unlinking requirement from WBS - API call:', {
        proposalId,
        reqId,
        newLinkedWbsIds
      })
      requirementsApi.update(proposalId, { reqId, linked_wbs_ids: newLinkedWbsIds })
        .then(response => console.log('[Estimate] Unlink API response:', response))
        .catch(err => console.warn('[Estimate] Failed to sync requirement unlink to API:', err))
    }
  }, [setEstimateWbsElements, setExtractedRequirements, requirements, proposalId])

  // Drag and drop handlers (drag requirements to WBS area)
  const handleRequirementDragStart = useCallback((e: React.DragEvent, req: SOORequirement) => {
    setDraggedRequirement(req)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', req.id)
  }, [])

  const handleRequirementDragEnd = useCallback(() => {
    setDraggedRequirement(null)
    setIsDragOverWbsArea(false)
  }, [])

  const handleWbsAreaDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOverWbsArea(true)
  }, [])

  const handleWbsAreaDragLeave = useCallback((e: React.DragEvent) => {
    // Only set to false if we're leaving the WBS area entirely
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOverWbsArea(false)
    }
  }, [])

  const handleWbsAreaDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (draggedRequirement) {
      // Directly generate WBS for the dropped requirement
      generateWbsForRequirement(draggedRequirement)
    }
    setDraggedRequirement(null)
    setIsDragOverWbsArea(false)
  }, [draggedRequirement, generateWbsForRequirement])

  // Save WBS element from form (handles both add and edit)
  const handleSaveWbs = useCallback(() => {
    if (!wbsForm.title || !wbsForm.wbsNumber) return

    // Calculate total hours from labor estimates
    const totalHours = wbsForm.laborEstimates.reduce((sum, le) => {
      return sum + (le.hoursByPeriod.base || 0) +
        (le.hoursByPeriod.option1 || 0) +
        (le.hoursByPeriod.option2 || 0) +
        (le.hoursByPeriod.option3 || 0) +
        (le.hoursByPeriod.option4 || 0)
    }, 0)

    if (editingWbs) {
      // UPDATE existing WBS
      const updatedWbs: EnhancedWBSElement = {
        ...editingWbs,
        wbsNumber: wbsForm.wbsNumber,
        title: wbsForm.title,
        sowReference: wbsForm.sowReference,
        why: wbsForm.why,
        what: wbsForm.what,
        notIncluded: wbsForm.notIncluded,
        assumptions: wbsForm.assumptions,
        estimateMethod: wbsForm.estimateMethod,
        laborEstimates: wbsForm.laborEstimates,
        totalHours,
        confidence: wbsForm.confidence,
        risks: wbsForm.risks,
        dependencies: wbsForm.dependencies,
      }

      // Update in local state
      setWbsElements(prev => prev.map(wbs =>
        wbs.id === editingWbs.id ? updatedWbs : wbs
      ))

      // Sync to context for persistence
      setEstimateWbsElements(prev => (prev || []).map(wbs =>
        wbs.id === editingWbs.id ? {
          ...wbs,
          wbsNumber: wbsForm.wbsNumber,
          title: wbsForm.title,
          description: wbsForm.what,
          laborEstimates: wbsForm.laborEstimates.map((le, idx) => ({
            id: `${editingWbs.id}-labor-${idx}`,
            roleId: le.roleId,
            roleName: le.roleName,
            hoursByPeriod: {
              base: le.hoursByPeriod.base || 0,
              option1: le.hoursByPeriod.option1 || 0,
              option2: le.hoursByPeriod.option2 || 0,
              option3: le.hoursByPeriod.option3 || 0,
              option4: le.hoursByPeriod.option4 || 0,
            },
            rationale: le.rationale,
            confidence: le.confidence,
            isAISuggested: false,
          })),
          totalHours,
          updatedAt: new Date().toISOString(),
        } : wbs
      ))
    } else {
      // CREATE new WBS
      const newWbsId = `wbs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const newWbs: EnhancedWBSElement = {
        id: newWbsId,
        wbsNumber: wbsForm.wbsNumber,
        title: wbsForm.title,
        sowReference: wbsForm.sowReference,
        why: wbsForm.why,
        what: wbsForm.what,
        notIncluded: wbsForm.notIncluded,
        assumptions: wbsForm.assumptions,
        estimateMethod: wbsForm.estimateMethod,
        laborEstimates: wbsForm.laborEstimates,
        linkedRequirementIds: preLinkedRequirement ? [preLinkedRequirement.id] : [],
        totalHours,
        confidence: wbsForm.confidence,
        risks: wbsForm.risks,
        dependencies: wbsForm.dependencies,
      }

      // Add the new WBS element to local state
      setWbsElements(prev => [...prev, newWbs])

      // Add to newly created for highlight animation
      setNewlyCreatedWbsIds(prev => new Set(prev).add(newWbsId))
      setTimeout(() => {
        setNewlyCreatedWbsIds(prev => {
          const next = new Set(prev)
          next.delete(newWbsId)
          return next
        })
      }, 3000)

      // Also sync to context estimateWbsElements for Roles & Pricing tab
      setEstimateWbsElements(prev => [...prev, {
        id: newWbsId,
        wbsNumber: wbsForm.wbsNumber,
        title: wbsForm.title,
        description: wbsForm.what,
        laborEstimates: wbsForm.laborEstimates.map((le, idx) => ({
          id: `${newWbsId}-labor-${idx}`,
          roleId: le.roleId,
          roleName: le.roleName,
          hoursByPeriod: {
            base: le.hoursByPeriod.base || 0,
            option1: le.hoursByPeriod.option1 || 0,
            option2: le.hoursByPeriod.option2 || 0,
            option3: le.hoursByPeriod.option3 || 0,
            option4: le.hoursByPeriod.option4 || 0,
          },
          rationale: le.rationale,
          confidence: le.confidence,
          isAISuggested: true,
        })),
        status: 'draft',
        totalHours,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }])

      // Link the requirement to this WBS if there's a pre-linked requirement
      if (preLinkedRequirement) {
        setRequirements(prev => prev.map(req => {
          if (req.id === preLinkedRequirement.id) {
            return { ...req, linkedWbsIds: [...req.linkedWbsIds, newWbsId] }
          }
          return req
        }))
        // Sync requirement linking to context for persistence
        setExtractedRequirements((prev: ExtractedRequirement[]) => (prev || []).map(req => {
          if (req.id === preLinkedRequirement.id) {
            return { ...req, linkedWbsIds: [...(req.linkedWbsIds || []), newWbsId] }
          }
          return req
        }))
      }
    }

    // Close the slideout and reset state
    setShowAddWbs(false)
    setEditingWbs(null)
    setPreLinkedRequirement(null)
    setWbsForm({
      wbsNumber: '',
      title: '',
      sowReference: '',
      why: '',
      what: '',
      notIncluded: '',
      estimateMethod: 'engineering',
      confidence: 'medium',
      laborEstimates: [],
      assumptions: [],
      risks: [],
      dependencies: [],
    })
  }, [wbsForm, editingWbs, preLinkedRequirement, setEstimateWbsElements, setExtractedRequirements])

  // Bulk WBS generation
  const handleBulkGenerateWBS = useCallback(async () => {
    const selectedReqs = requirements.filter(r =>
      selectedRequirements.has(r.id) && r.linkedWbsIds.length === 0
    )

    if (selectedReqs.length === 0) return

    setShowBulkGenerateDialog(true)
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationError(null)
    setGeneratedWbs([])

    // Prepare roles from companyRoles (Labor Categories)
    const availableRolesForApi = companyRoles.map(r => ({
      id: r.id,
      name: r.title,
      laborCategory: r.laborCategory,
      description: r.description,
      levels: r.levels.map(l => ({
        level: l.level,
        levelName: l.levelName,
        yearsExperience: l.yearsExperience,
        baseSalary: l.steps[0]?.salary || 0,
      })),
    }))

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/generate-wbs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements: selectedReqs,
          availableRoles: availableRolesForApi,
          existingWbsNumbers: wbsElements.map(w => w.wbsNumber),
          contractContext: {
            title: solicitation?.title || 'Untitled',
            agency: solicitation?.clientAgency || 'Government Agency',
            contractType: solicitation?.contractType?.toLowerCase() || 'tm',
            periodOfPerformance: solicitation?.periodOfPerformance || { baseYear: true, optionYears: 2 }
          }
        })
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)

      if (!response.ok) {
        throw new Error('Failed to generate WBS')
      }

      const data = await response.json()
      setGeneratedWbs(data.wbsElements || [])
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }, [requirements, selectedRequirements, wbsElements, companyRoles, solicitation])

  const handleAcceptGeneratedWbs = useCallback(() => {
    // Add generated WBS and auto-link
    const newWbs = generatedWbs.map(wbs => ({
      ...wbs,
      id: `wbs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }))

    setWbsElements(prev => [...prev, ...newWbs])

    // Also sync to context for Roles & Pricing tab
    setEstimateWbsElements(prev => [...(prev || []), ...newWbs])

    // Auto-link to requirements
    newWbs.forEach(wbs => {
      if (wbs.linkedRequirementIds) {
        wbs.linkedRequirementIds.forEach(reqId => {
          handleLinkWbsToRequirement(reqId, wbs.id)
        })
      }
    })

    setShowBulkGenerateDialog(false)
    setGeneratedWbs([])
    setSelectedRequirements(new Set())
  }, [generatedWbs, handleLinkWbsToRequirement, setEstimateWbsElements])

  const handleDiscardGeneratedWbs = useCallback(() => {
    setShowBulkGenerateDialog(false)
    setGeneratedWbs([])
  }, [])

  const handleDeleteRequirement = useCallback((reqId: string) => {
    setRequirements(prev => {
      // Filter out the deleted requirement
      const remaining = prev.filter(r => r.id !== reqId)
      // Renumber the remaining requirements sequentially
      return remaining.map((req, index) => ({
        ...req,
        referenceNumber: `REQ-${String(index + 1).padStart(3, '0')}`
      }))
    })
    setSelectedRequirements(prev => {
      const next = new Set(prev)
      next.delete(reqId)
      return next
    })
  }, [])

  const handleDeleteWbs = useCallback((wbsId: string) => {
    setWbsElements(prev => prev.filter(w => w.id !== wbsId))
    // Sync to context for persistence
    setEstimateWbsElements(prev => (prev || []).filter(w => w.id !== wbsId))
    // Unlink from all requirements
    setRequirements(prev => prev.map(req => ({
      ...req,
      linkedWbsIds: req.linkedWbsIds.filter(id => id !== wbsId)
    })))
  }, [setEstimateWbsElements])

  // ========== RENDER ==========

  return (
    <TooltipProvider>
      <div className="absolute inset-0 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Estimate</h1>
              <p className="text-sm text-gray-500 mt-1">
                {stats.total} requirements → {wbsElements.length} WBS elements
              </p>
            </div>
            
            {/* Generate WBS Button */}
            <div className="flex items-center gap-3">
              {selectedRequirements.size > 0 && (
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-sm text-gray-600">
                    {selectedRequirements.size} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                    className="h-7 w-7 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={selectedUnmappedCount === 0}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate WBS
                    {selectedUnmappedCount > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-emerald-500 text-white">
                        {selectedUnmappedCount}
                      </Badge>
                    )}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleBulkGenerateWBS}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate for {selectedUnmappedCount} selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSelectAllUnmapped}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Select all unmapped ({stats.unmapped})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{stats.mapped}</span> mapped
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{stats.unmapped}</span> unmapped
              </span>
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Labor Summary: <span className="font-medium text-gray-900">{formatHours(stats.totalHours)} hours</span>
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Column - Requirements */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col bg-white overflow-hidden min-h-0">
            {/* Requirements Header */}
            <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Select All Checkbox */}
                  {filteredRequirements.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Checkbox
                            checked={allFilteredSelected}
                            onCheckedChange={handleSelectAllFiltered}
                            className={`
                              w-5 h-5 border-2
                              ${someFilteredSelected ? 'data-[state=checked]:bg-emerald-500' : ''}
                              ${allFilteredSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-400'}
                            `}
                            {...(someFilteredSelected && !allFilteredSelected ? { 'data-state': 'indeterminate' } : {})}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {allFilteredSelected ? 'Deselect all' : `Select all ${filteredRequirements.length}`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Requirements
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddRequirement(true)}
                  className="h-7"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search requirements..."
                    value={requirementSearch}
                    onChange={(e) => setRequirementSearch(e.target.value)}
                    className="pl-9 h-8 text-sm"
                  />
                </div>
                <Select value={requirementFilter} onValueChange={(v: any) => setRequirementFilter(v)}>
                  <SelectTrigger className="w-[100px] h-8 text-sm">
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

            {/* Requirements List */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {filteredRequirements.length === 0 ? (
                <RequirementsEmptyState
                  onAdd={() => setShowAddRequirement(true)}
                  hasUploadedRfp={!!solicitation?.analyzedFromDocument}
                  isFiltered={requirements.length > 0 && (!!requirementSearch || requirementFilter !== 'all')}
                />
              ) : (
                <div className="space-y-2">
                  {filteredRequirements.map(req => (
                    <RequirementCard
                      key={req.id}
                      requirement={req}
                      isSelected={selectedRequirements.has(req.id)}
                      isMapped={req.linkedWbsIds.length > 0}
                      isGenerating={generatingRequirementIds.has(req.id)}
                      isHighlighted={hoveredWbsId !== null && req.linkedWbsIds.includes(hoveredWbsId)}
                      linkedWbsElements={getLinkedWbsElements(req)}
                      onToggleSelect={() => handleToggleRequirementSelection(req.id)}
                      onEdit={() => setEditingRequirement(req)}
                      onDelete={() => handleDeleteRequirement(req.id)}
                      onGenerate={() => generateWbsForRequirement(req)}
                      onViewLinkedWbs={(wbs) => setSelectedWbs(wbs)}
                      onUnlink={(wbsId) => handleUnlinkWbsFromRequirement(req.id, wbsId)}
                      onDragStart={(e) => handleRequirementDragStart(e, req)}
                      onDragEnd={handleRequirementDragEnd}
                      onMouseEnter={() => setHoveredRequirementId(req.id)}
                      onMouseLeave={() => setHoveredRequirementId(null)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - WBS Elements (Drop Target) */}
          <div
            className={`w-1/2 flex flex-col overflow-hidden min-h-0 transition-colors duration-200 ${
              isDragOverWbsArea
                ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-300'
                : 'bg-gray-50'
            }`}
            onDragOver={handleWbsAreaDragOver}
            onDragLeave={handleWbsAreaDragLeave}
            onDrop={handleWbsAreaDrop}
          >
            {/* WBS Header */}
            <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  WBS Elements
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddWbs(true)}
                  className="h-7"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search WBS..."
                  value={wbsSearch}
                  onChange={(e) => setWbsSearch(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </div>

            {/* WBS List */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {/* Get generating requirements for placeholders */}
              {(() => {
                const generatingReqs = requirements.filter(r => generatingRequirementIds.has(r.id))
                const hasGenerating = generatingReqs.length > 0
                const hasWbs = filteredWbs.length > 0

                if (!hasGenerating && !hasWbs) {
                  return <WBSEmptyState hasRequirements={requirements.length > 0} />
                }

                return (
                  <div className="space-y-2">
                    {/* Show generating placeholders at top */}
                    {generatingReqs.map(req => (
                      <WBSGeneratingPlaceholder
                        key={`generating-${req.id}`}
                        referenceNumber={req.referenceNumber}
                      />
                    ))}
                    {/* Show existing WBS cards */}
                    {filteredWbs.map(wbs => (
                      <WBSCard
                        key={wbs.id}
                        wbs={wbs}
                        linkedRequirements={getLinkedRequirements(wbs)}
                        isNew={newlyCreatedWbsIds.has(wbs.id)}
                        isHighlighted={hoveredRequirementId !== null && (wbs.linkedRequirementIds || []).includes(hoveredRequirementId)}
                        onView={() => setSelectedWbs(wbs)}
                        onEdit={() => setEditingWbs(wbs)}
                        onDelete={() => handleDeleteWbs(wbs.id)}
                        onMouseEnter={() => setHoveredWbsId(wbs.id)}
                        onMouseLeave={() => setHoveredWbsId(null)}
                      />
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Drag Hint */}
            {draggedRequirement && (
              <div className="flex-shrink-0 px-4 py-2 border-t border-emerald-200 bg-emerald-50">
                <p className="text-xs text-emerald-700 text-center">
                  Drop here to create WBS for <strong>{draggedRequirement.referenceNumber}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* WBS Slideout */}
        <WBSSlideout
          wbs={selectedWbs}
          linkedRequirements={selectedWbs ? getLinkedRequirements(selectedWbs) : []}
          isOpen={!!selectedWbs}
          onClose={() => setSelectedWbs(null)}
          onEdit={() => {
            if (selectedWbs) {
              setEditingWbs(selectedWbs)
              setSelectedWbs(null)
            }
          }}
        />

        {/* Bulk Generate Dialog */}
        <BulkGenerateDialog
          isOpen={showBulkGenerateDialog}
          onClose={() => setShowBulkGenerateDialog(false)}
          isGenerating={isGenerating}
          progress={generationProgress}
          generatedWbs={generatedWbs}
          error={generationError}
          selectedCount={selectedUnmappedCount}
          onAccept={handleAcceptGeneratedWbs}
          onDiscard={handleDiscardGeneratedWbs}
        />

        {/* Add/Edit Requirement Dialog - Placeholder */}
        <Dialog open={showAddRequirement || !!editingRequirement} onOpenChange={(open) => {
          if (!open) {
            setShowAddRequirement(false)
            setEditingRequirement(null)
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingRequirement ? 'Edit Requirement' : 'Add Requirement'}
              </DialogTitle>
              <DialogDescription>
                {editingRequirement 
                  ? 'Update the requirement details below.'
                  : 'Add a new requirement to your proposal.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input placeholder="REQ-007" />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Requirement title..." />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe the requirement..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select defaultValue="functional">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="functional">Functional</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddRequirement(false)
                setEditingRequirement(null)
              }}>
                Cancel
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                {editingRequirement ? 'Save Changes' : 'Add Requirement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit WBS Slideout Panel */}
        {(showAddWbs || editingWbs) && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => {
                setShowAddWbs(false)
                setEditingWbs(null)
                setPreLinkedRequirement(null)
              }}
            />

            {/* Slideout Panel */}
            <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl
                            border-l border-gray-200 overflow-hidden z-50
                            animate-in slide-in-from-right duration-200 flex flex-col">
              {/* Header */}
              <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {editingWbs ? 'Edit WBS Element' : 'Add WBS Element'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {preLinkedRequirement
                        ? `Creating WBS for ${preLinkedRequirement.referenceNumber}`
                        : 'Define work breakdown structure element'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddWbs(false)
                      setEditingWbs(null)
                      setPreLinkedRequirement(null)
                    }}
                    className="text-2xl leading-none h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Auto-fill with AI Button */}
                {preLinkedRequirement && !wbsFormLoading && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => {
                      setWbsFormLoading(true)
                      // Reset form first
                      setWbsForm({
                        wbsNumber: '',
                        title: '',
                        sowReference: preLinkedRequirement.source || '',
                        why: '',
                        what: '',
                        notIncluded: '',
                        estimateMethod: 'engineering',
                        confidence: 'medium',
                        laborEstimates: [],
                        assumptions: [],
                        risks: [],
                        dependencies: [],
                      })

                      // Calculate next WBS number
                      const nextWbsNumber = wbsElements.length === 0
                        ? '1.1'
                        : (() => {
                            const numbers = wbsElements.map(w => {
                              const parts = w.wbsNumber.split('.')
                              return { major: parseInt(parts[0]) || 1, minor: parseInt(parts[1]) || 0 }
                            }).sort((a, b) => a.major === b.major ? b.minor - a.minor : b.major - a.major)
                            const highest = numbers[0]
                            return `${highest.major}.${highest.minor + 1}`
                          })()

                      // Use Labor Categories from Account Center
                      const availableRolesForApi = companyRoles.map(r => ({
                        id: r.id,
                        name: r.title,
                        laborCategory: r.laborCategory,
                        description: r.description,
                        levels: r.levels.map(l => ({
                          level: l.level,
                          levelName: l.levelName,
                          yearsExperience: l.yearsExperience,
                          baseSalary: l.steps[0]?.salary || 0,
                        })),
                      }))

                      fetch('/api/generate-wbs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          requirements: [{
                            id: preLinkedRequirement.id,
                            referenceNumber: preLinkedRequirement.referenceNumber,
                            title: preLinkedRequirement.title,
                            description: preLinkedRequirement.description,
                            type: preLinkedRequirement.type,
                            category: preLinkedRequirement.category,
                            source: preLinkedRequirement.source,
                          }],
                          availableRoles: availableRolesForApi,
                          existingWbsNumbers: wbsElements.map(w => w.wbsNumber),
                          contractContext: {
                            title: solicitation?.title || 'Untitled',
                            agency: solicitation?.clientAgency || 'Government Agency',
                            contractType: solicitation?.contractType || 'T&M',
                            periodOfPerformance: {
                              baseYear: solicitation?.periodOfPerformance?.baseYear ?? true,
                              optionYears: solicitation?.periodOfPerformance?.optionYears ?? 2
                            }
                          }
                        })
                      })
                        .then(res => res.json())
                        .then(data => {
                          if (data.wbsElements && data.wbsElements.length > 0) {
                            const generated = data.wbsElements[0]
                            setWbsForm({
                              wbsNumber: generated.wbsNumber || nextWbsNumber,
                              title: generated.title || '',
                              sowReference: generated.sowReference || preLinkedRequirement.source || '',
                              why: generated.why || '',
                              what: generated.what || '',
                              notIncluded: generated.notIncluded || '',
                              estimateMethod: generated.estimateMethod || 'engineering',
                              confidence: generated.confidence || 'medium',
                              laborEstimates: (generated.laborEstimates || []).map((le: any) => ({
                                roleId: le.roleId || '',
                                roleName: le.roleName || '',
                                hoursByPeriod: {
                                  base: le.hoursByPeriod?.base || 0,
                                  option1: le.hoursByPeriod?.option1 || 0,
                                  option2: le.hoursByPeriod?.option2 || 0,
                                  option3: le.hoursByPeriod?.option3 || 0,
                                  option4: le.hoursByPeriod?.option4 || 0,
                                },
                                rationale: le.rationale || '',
                                confidence: le.confidence || 'medium',
                              })),
                              assumptions: generated.assumptions || [],
                              risks: (generated.risks || []).map((r: any) => ({
                                id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                description: r.description || '',
                                probability: r.likelihood || r.probability || 'medium',
                                impact: r.impact || 'medium',
                                mitigation: r.mitigation || '',
                              })),
                              dependencies: generated.suggestedDependencies || generated.dependencies || [],
                            })
                          }
                        })
                        .catch(err => console.error('AI generation failed:', err))
                        .finally(() => setWbsFormLoading(false))
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Auto-fill with AI
                  </Button>
                )}

                {/* Loading state */}
                {wbsFormLoading && (
                  <div className="flex items-center justify-center py-4 bg-emerald-50 rounded-lg mt-3">
                    <Loader2 className="w-5 h-5 text-emerald-600 animate-spin mr-2" />
                    <span className="text-sm text-emerald-700">AI is generating WBS details...</span>
                  </div>
                )}
              </div>

              {/* Scrollable Content */}
              <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${wbsFormLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Show pre-linked requirement */}
                {preLinkedRequirement && !editingWbs && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Link2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">Linked Requirement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-600">{preLinkedRequirement.referenceNumber}</span>
                      <span className="text-sm text-emerald-700">{preLinkedRequirement.title}</span>
                    </div>
                  </div>
                )}

                {/* Basic Info - Always visible */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>WBS Number</Label>
                    <Input
                      placeholder="1.1"
                      value={wbsForm.wbsNumber}
                      onChange={(e) => setWbsForm(prev => ({ ...prev, wbsNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SOW Reference</Label>
                    <Input
                      placeholder="SOO 3.1.1"
                      value={wbsForm.sowReference}
                      onChange={(e) => setWbsForm(prev => ({ ...prev, sowReference: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="WBS element title..."
                    value={wbsForm.title}
                    onChange={(e) => setWbsForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estimate Method</Label>
                    <Select
                      value={wbsForm.estimateMethod}
                      onValueChange={(v: 'engineering' | 'analogous' | 'parametric' | 'expert') =>
                        setWbsForm(prev => ({ ...prev, estimateMethod: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="analogous">Analogous</SelectItem>
                        <SelectItem value="parametric">Parametric</SelectItem>
                        <SelectItem value="expert">Expert Judgment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Confidence</Label>
                    <Select
                      value={wbsForm.confidence}
                      onValueChange={(v: 'high' | 'medium' | 'low') =>
                        setWbsForm(prev => ({ ...prev, confidence: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Collapsible: Task Description */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedSections(prev => ({ ...prev, taskDescription: !prev.taskDescription }))}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Target className="w-4 h-4 text-emerald-600" />
                      Task Description
                    </span>
                    {expandedSections.taskDescription ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSections.taskDescription && (
                    <div className="p-4 space-y-4 border-t border-gray-200">
                      <div className="space-y-2">
                        <Label>Why (Purpose)</Label>
                        <Textarea
                          placeholder="Why is this work needed?"
                          rows={2}
                          value={wbsForm.why}
                          onChange={(e) => setWbsForm(prev => ({ ...prev, why: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>What (Deliverables)</Label>
                        <Textarea
                          placeholder="What will be delivered?"
                          rows={2}
                          value={wbsForm.what}
                          onChange={(e) => setWbsForm(prev => ({ ...prev, what: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Not Included</Label>
                        <Textarea
                          placeholder="What is explicitly out of scope?"
                          rows={2}
                          value={wbsForm.notIncluded}
                          onChange={(e) => setWbsForm(prev => ({ ...prev, notIncluded: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible: Labor Estimates */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedSections(prev => ({ ...prev, laborEstimates: !prev.laborEstimates }))}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Users className="w-4 h-4 text-blue-600" />
                      Labor Estimates
                      {wbsForm.laborEstimates.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {wbsForm.laborEstimates.length} role{wbsForm.laborEstimates.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </span>
                    {expandedSections.laborEstimates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSections.laborEstimates && (
                    <div className="p-4 space-y-4 border-t border-gray-200">
                      {/* Add Role Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={companyRoles.length === 0}
                        onClick={() => {
                          if (companyRoles.length === 0) return
                          const firstRole = companyRoles[0]
                          const firstLevel = firstRole.levels[0]
                          setWbsForm(prev => ({
                            ...prev,
                            laborEstimates: [...prev.laborEstimates, {
                              id: `labor-${Date.now()}-${prev.laborEstimates.length}`,
                              roleId: `${firstRole.id}-${firstLevel?.level || 'IC3'}`,
                              roleName: `${firstRole.title} (${firstLevel?.levelName || 'Mid'})`,
                              hoursByPeriod: { base: 0, option1: 0, option2: 0, option3: 0, option4: 0 },
                              rationale: '',
                              confidence: 'medium',
                            }]
                          }))
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Labor Category
                      </Button>

                      {companyRoles.length === 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800">
                            No labor categories defined. Go to Account Center to add Labor Categories.
                          </p>
                        </div>
                      )}

                      {wbsForm.laborEstimates.length === 0 ? (
                        <p className="text-sm text-gray-500 italic text-center py-4">
                          No labor estimates added yet. Click "Add Labor Category" above.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {wbsForm.laborEstimates.map((le, idx) => {
                            // Find the role and calculate hourly rate
                            const roleIdParts = le.roleId.split('-')
                            const baseRoleId = roleIdParts.slice(0, -1).join('-') || le.roleId
                            const levelCode = roleIdParts[roleIdParts.length - 1] || 'IC3'
                            const role = companyRoles.find(r => r.id === baseRoleId) || companyRoles.find(r => le.roleName.includes(r.title))
                            const level = role?.levels.find(l => l.level === levelCode)
                            const baseSalary = level?.steps[0]?.salary || 0
                            const hourlyRate = calculateHourlyRate(baseSalary)
                            const totalHours = (le.hoursByPeriod.base || 0) +
                              (le.hoursByPeriod.option1 || 0) +
                              (le.hoursByPeriod.option2 || 0) +
                              (le.hoursByPeriod.option3 || 0) +
                              (le.hoursByPeriod.option4 || 0)
                            const totalCost = totalHours * hourlyRate

                            return (
                              <div key={idx} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3">
                                {/* Role Header */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 space-y-2">
                                    {/* Role/Level Selection */}
                                    <Select
                                      value={le.roleId}
                                      onValueChange={(v) => {
                                        const [rId, lvl] = v.split('|')
                                        const selectedRole = companyRoles.find(r => r.id === rId)
                                        const selectedLevel = selectedRole?.levels.find(l => l.level === lvl)
                                        setWbsForm(prev => ({
                                          ...prev,
                                          laborEstimates: prev.laborEstimates.map((l, i) =>
                                            i === idx ? {
                                              ...l,
                                              roleId: `${rId}-${lvl}`,
                                              roleName: `${selectedRole?.title || ''} (${selectedLevel?.levelName || lvl})`
                                            } : l
                                          )
                                        }))
                                      }}
                                    >
                                      <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Select labor category..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {companyRoles.map(r => (
                                          <React.Fragment key={r.id}>
                                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                                              {r.title}
                                            </div>
                                            {r.levels.map(lvl => (
                                              <SelectItem
                                                key={`${r.id}|${lvl.level}`}
                                                value={`${r.id}|${lvl.level}`}
                                              >
                                                <span className="flex items-center justify-between gap-4">
                                                  <span>{lvl.levelName} ({lvl.level})</span>
                                                  <span className="text-xs text-gray-400">
                                                    ${(lvl.steps[0]?.salary || 0).toLocaleString()}/yr
                                                  </span>
                                                </span>
                                              </SelectItem>
                                            ))}
                                          </React.Fragment>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {/* Rate Info */}
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span className="font-medium text-gray-700">
                                        ${hourlyRate.toFixed(2)}/hr
                                      </span>
                                      <span className="text-gray-400">|</span>
                                      <span>
                                        {totalHours.toLocaleString()} hrs total
                                      </span>
                                      <span className="text-gray-400">|</span>
                                      <span className="font-medium text-emerald-600">
                                        ${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                    onClick={() => {
                                      setWbsForm(prev => ({
                                        ...prev,
                                        laborEstimates: prev.laborEstimates.filter((_, i) => i !== idx)
                                      }))
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>

                                {/* Hours by Period */}
                                <div className="grid grid-cols-5 gap-2">
                                  <div className="text-center">
                                    <Label className="text-[10px] text-gray-500 block mb-1">Base Year</Label>
                                    <Input
                                      type="number"
                                      className="h-8 text-sm text-center"
                                      value={le.hoursByPeriod.base || ''}
                                      onChange={(e) => {
                                        setWbsForm(prev => ({
                                          ...prev,
                                          laborEstimates: prev.laborEstimates.map((l, i) =>
                                            i === idx ? { ...l, hoursByPeriod: { ...l.hoursByPeriod, base: parseInt(e.target.value) || 0 } } : l
                                          )
                                        }))
                                      }}
                                    />
                                  </div>
                                  <div className="text-center">
                                    <Label className="text-[10px] text-gray-500 block mb-1">OY1</Label>
                                    <Input
                                      type="number"
                                      className="h-8 text-sm text-center"
                                      value={le.hoursByPeriod.option1 || ''}
                                      onChange={(e) => {
                                        setWbsForm(prev => ({
                                          ...prev,
                                          laborEstimates: prev.laborEstimates.map((l, i) =>
                                            i === idx ? { ...l, hoursByPeriod: { ...l.hoursByPeriod, option1: parseInt(e.target.value) || 0 } } : l
                                          )
                                        }))
                                      }}
                                    />
                                  </div>
                                  <div className="text-center">
                                    <Label className="text-[10px] text-gray-500 block mb-1">OY2</Label>
                                    <Input
                                      type="number"
                                      className="h-8 text-sm text-center"
                                      value={le.hoursByPeriod.option2 || ''}
                                      onChange={(e) => {
                                        setWbsForm(prev => ({
                                          ...prev,
                                          laborEstimates: prev.laborEstimates.map((l, i) =>
                                            i === idx ? { ...l, hoursByPeriod: { ...l.hoursByPeriod, option2: parseInt(e.target.value) || 0 } } : l
                                          )
                                        }))
                                      }}
                                    />
                                  </div>
                                  <div className="text-center">
                                    <Label className="text-[10px] text-gray-500 block mb-1">OY3</Label>
                                    <Input
                                      type="number"
                                      className="h-8 text-sm text-center"
                                      value={le.hoursByPeriod.option3 || ''}
                                      onChange={(e) => {
                                        setWbsForm(prev => ({
                                          ...prev,
                                          laborEstimates: prev.laborEstimates.map((l, i) =>
                                            i === idx ? { ...l, hoursByPeriod: { ...l.hoursByPeriod, option3: parseInt(e.target.value) || 0 } } : l
                                          )
                                        }))
                                      }}
                                    />
                                  </div>
                                  <div className="text-center">
                                    <Label className="text-[10px] text-gray-500 block mb-1">OY4</Label>
                                    <Input
                                      type="number"
                                      className="h-8 text-sm text-center"
                                      value={le.hoursByPeriod.option4 || ''}
                                      onChange={(e) => {
                                        setWbsForm(prev => ({
                                          ...prev,
                                          laborEstimates: prev.laborEstimates.map((l, i) =>
                                            i === idx ? { ...l, hoursByPeriod: { ...l.hoursByPeriod, option4: parseInt(e.target.value) || 0 } } : l
                                          )
                                        }))
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Rationale */}
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="Rationale for this estimate..."
                                    className="flex-1 h-8 text-sm"
                                    value={le.rationale}
                                    onChange={(e) => {
                                      setWbsForm(prev => ({
                                        ...prev,
                                        laborEstimates: prev.laborEstimates.map((l, i) =>
                                          i === idx ? { ...l, rationale: e.target.value } : l
                                        )
                                      }))
                                    }}
                                  />
                                  <Select
                                    value={le.confidence}
                                    onValueChange={(v: 'high' | 'medium' | 'low') => {
                                      setWbsForm(prev => ({
                                        ...prev,
                                        laborEstimates: prev.laborEstimates.map((l, i) =>
                                          i === idx ? { ...l, confidence: v } : l
                                        )
                                      }))
                                    }}
                                  >
                                    <SelectTrigger className="w-24 h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="high">High</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )
                          })}

                          {/* Running Total */}
                          {wbsForm.laborEstimates.length > 0 && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Total Labor Cost:</span>
                                <span className="text-lg font-semibold text-emerald-600">
                                  ${wbsForm.laborEstimates.reduce((sum, le) => {
                                    const roleIdParts = le.roleId.split('-')
                                    const baseRoleId = roleIdParts.slice(0, -1).join('-') || le.roleId
                                    const levelCode = roleIdParts[roleIdParts.length - 1] || 'IC3'
                                    const role = companyRoles.find(r => r.id === baseRoleId) || companyRoles.find(r => le.roleName.includes(r.title))
                                    const level = role?.levels.find(l => l.level === levelCode)
                                    const baseSalary = level?.steps[0]?.salary || 0
                                    const hourlyRate = calculateHourlyRate(baseSalary)
                                    const totalHours = (le.hoursByPeriod.base || 0) +
                                      (le.hoursByPeriod.option1 || 0) +
                                      (le.hoursByPeriod.option2 || 0) +
                                      (le.hoursByPeriod.option3 || 0) +
                                      (le.hoursByPeriod.option4 || 0)
                                    return sum + (totalHours * hourlyRate)
                                  }, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Collapsible: Assumptions */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedSections(prev => ({ ...prev, assumptions: !prev.assumptions }))}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Assumptions
                      {wbsForm.assumptions.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {wbsForm.assumptions.length}
                        </Badge>
                      )}
                    </span>
                    {expandedSections.assumptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSections.assumptions && (
                    <div className="p-4 space-y-3 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setWbsForm(prev => ({
                            ...prev,
                            assumptions: [...prev.assumptions, '']
                          }))
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Assumption
                      </Button>
                      {wbsForm.assumptions.length === 0 ? (
                        <p className="text-sm text-gray-500 italic text-center py-2">No assumptions added yet</p>
                      ) : (
                        <div className="space-y-2">
                          {wbsForm.assumptions.map((assumption, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input
                                placeholder="Enter assumption..."
                                className="h-9 text-sm"
                                value={assumption}
                                onChange={(e) => {
                                  setWbsForm(prev => ({
                                    ...prev,
                                    assumptions: prev.assumptions.map((a, i) => i === idx ? e.target.value : a)
                                  }))
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 text-gray-400 hover:text-red-600"
                                onClick={() => {
                                  setWbsForm(prev => ({
                                    ...prev,
                                    assumptions: prev.assumptions.filter((_, i) => i !== idx)
                                  }))
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Collapsible: Risks */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedSections(prev => ({ ...prev, risks: !prev.risks }))}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      Risks
                      {wbsForm.risks.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {wbsForm.risks.length}
                        </Badge>
                      )}
                    </span>
                    {expandedSections.risks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSections.risks && (
                    <div className="p-4 space-y-3 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setWbsForm(prev => ({
                            ...prev,
                            risks: [...prev.risks, {
                              id: `risk-${Date.now()}`,
                              description: '',
                              probability: 'medium',
                              impact: 'medium',
                              mitigation: '',
                            }]
                          }))
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Risk
                      </Button>
                      {wbsForm.risks.length === 0 ? (
                        <p className="text-sm text-gray-500 italic text-center py-2">No risks identified yet</p>
                      ) : (
                        <div className="space-y-3">
                          {wbsForm.risks.map((risk, idx) => (
                            <div key={risk.id} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <Input
                                  placeholder="Risk description..."
                                  className="h-9 text-sm"
                                  value={risk.description}
                                  onChange={(e) => {
                                    setWbsForm(prev => ({
                                      ...prev,
                                      risks: prev.risks.map((r, i) =>
                                        i === idx ? { ...r, description: e.target.value } : r
                                      )
                                    }))
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 w-9 p-0 text-gray-400 hover:text-red-600"
                                  onClick={() => {
                                    setWbsForm(prev => ({
                                      ...prev,
                                      risks: prev.risks.filter((_, i) => i !== idx)
                                    }))
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs text-gray-500 mb-1 block">Probability</Label>
                                  <Select
                                    value={risk.probability}
                                    onValueChange={(v: 'low' | 'medium' | 'high') => {
                                      setWbsForm(prev => ({
                                        ...prev,
                                        risks: prev.risks.map((r, i) =>
                                          i === idx ? { ...r, probability: v } : r
                                        )
                                      }))
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-500 mb-1 block">Impact</Label>
                                  <Select
                                    value={risk.impact}
                                    onValueChange={(v: 'low' | 'medium' | 'high') => {
                                      setWbsForm(prev => ({
                                        ...prev,
                                        risks: prev.risks.map((r, i) =>
                                          i === idx ? { ...r, impact: v } : r
                                        )
                                      }))
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <Input
                                placeholder="Mitigation strategy..."
                                className="h-8 text-sm"
                                value={risk.mitigation}
                                onChange={(e) => {
                                  setWbsForm(prev => ({
                                    ...prev,
                                    risks: prev.risks.map((r, i) =>
                                      i === idx ? { ...r, mitigation: e.target.value } : r
                                    )
                                  }))
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Collapsible: Dependencies */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedSections(prev => ({ ...prev, dependencies: !prev.dependencies }))}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <ArrowRight className="w-4 h-4 text-purple-600" />
                      Dependencies
                      {wbsForm.dependencies.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {wbsForm.dependencies.length}
                        </Badge>
                      )}
                    </span>
                    {expandedSections.dependencies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSections.dependencies && (
                    <div className="p-4 space-y-3 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setWbsForm(prev => ({
                            ...prev,
                            dependencies: [...prev.dependencies, '']
                          }))
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Dependency
                      </Button>
                      {wbsForm.dependencies.length === 0 ? (
                        <p className="text-sm text-gray-500 italic text-center py-2">No dependencies specified</p>
                      ) : (
                        <div className="space-y-2">
                          {wbsForm.dependencies.map((dep, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input
                                placeholder="WBS number (e.g., 1.1) or description..."
                                className="h-9 text-sm"
                                value={dep}
                                onChange={(e) => {
                                  setWbsForm(prev => ({
                                    ...prev,
                                    dependencies: prev.dependencies.map((d, i) => i === idx ? e.target.value : d)
                                  }))
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 text-gray-400 hover:text-red-600"
                                onClick={() => {
                                  setWbsForm(prev => ({
                                    ...prev,
                                    dependencies: prev.dependencies.filter((_, i) => i !== idx)
                                  }))
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddWbs(false)
                    setEditingWbs(null)
                    setPreLinkedRequirement(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={wbsFormLoading || !wbsForm.title || !wbsForm.wbsNumber}
                  onClick={handleSaveWbs}
                >
                  {wbsFormLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : editingWbs ? 'Save Changes' : 'Add WBS Element'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

export default EstimateTab