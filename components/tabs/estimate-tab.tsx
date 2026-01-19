// @ts-nocheck
"use client"

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { 
  Search, Plus, ChevronRight, Sparkles, Trash2, Pencil, Link2, Unlink,
  FileText, Clock, CheckCircle2, Circle, ArrowRight, GripVertical,
  AlertCircle, ChevronDown, ChevronUp, X, Users, Info, Building2,
  Target, ClipboardList, Layers, Filter, MoreHorizontal, ExternalLink,
  RefreshCw, Check, AlertTriangle, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
<<<<<<< Updated upstream
import { SettingsCallout } from '@/components/shared/settings-callout'
import { Loader2, Wand2 } from 'lucide-react'
=======
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
>>>>>>> Stashed changes
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
import { Progress } from '@/components/ui/progress'

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
  roleId: string
  roleName: string
  hoursByPeriod: {
    base: number
    option1?: number
    option2?: number
    option3?: number
    option4?: number
  }
  rationale: string
  confidence: 'high' | 'medium' | 'low'
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
  return hours.toLocaleString()
}

// ============================================================================
// REQUIREMENT CARD COMPONENT
// ============================================================================

interface RequirementCardProps {
  requirement: SOORequirement
  isSelected: boolean
  isMapped: boolean
  linkedWbsElements: EnhancedWBSElement[]
  onToggleSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onViewLinkedWbs: (wbs: EnhancedWBSElement) => void
  onUnlink: (wbsId: string) => void
  isDragOver?: boolean
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent) => void
}

<<<<<<< Updated upstream
function WBSCard({ element, onClick, onEdit, onDelete }: { element: EnhancedWBSElement; onClick: () => void; onEdit: () => void; onDelete: () => void }) {
  const totalHours = getElementTotalHours(element)
  const gradeConfig = QUALITY_GRADE_CONFIG[element.qualityGrade]
  const methodConfig = ESTIMATE_METHOD_LABELS[element.estimateMethod]
  
  return (
    <div className="group bg-white border border-gray-100 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer" onClick={onClick}>
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900">{element.wbsNumber}</span>
              <h3 className="text-sm font-medium text-gray-900 truncate">{element.title}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {element.sowReference && <span>{element.sowReference}</span>}
              {element.sowReference && <span className="w-1.5 h-1.5 rounded-full bg-gray-300" aria-hidden="true" />}
              <span>{formatDateShort(element.periodOfPerformance.startDate)} – {formatDateShort(element.periodOfPerformance.endDate)}</span>
            </div>
          </div>
          <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onClick(); }} className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Why/What Preview - NEW */}
      {(element.why || element.what) && (
        <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100">
          {element.why && (
            <p className="text-xs text-gray-600 line-clamp-1">
              <span className="font-medium text-gray-700">Why:</span> {element.why}
            </p>
          )}
          {element.what && (
            <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
              <span className="font-medium text-gray-700">What:</span> {element.what}
            </p>
          )}
        </div>
      )}
      
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Badge className={`${gradeConfig.bgColor} ${gradeConfig.textColor} border ${gradeConfig.borderColor} text-[10px] px-1.5 py-0 h-5`}>{gradeConfig.label}</Badge>
          <span className="text-xs text-gray-500">{methodConfig.icon} {methodConfig.label}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-600">{element.laborEstimates.length} roles</span>
          <span className="text-sm font-semibold text-gray-900">{totalHours.toLocaleString()} hrs</span>
        </div>
        <div className="space-y-1.5">
          {element.laborEstimates.slice(0, 2).map((labor) => (
            <div key={labor.id} className="flex items-center justify-between text-xs">
              <span className={labor.isOrphaned ? 'text-red-600' : 'text-gray-600'}>{labor.roleName}</span>
              <span className="text-gray-900">{getTotalHours(labor.hoursByPeriod).toLocaleString()}</span>
            </div>
          ))}
          {element.laborEstimates.length > 2 && <span className="text-[10px] text-gray-400">+{element.laborEstimates.length - 2} more</span>}
        </div>
      </div>
      
      {(element.risks.length > 0 || element.dependencies.length > 0 || element.qualityIssues.length > 0) && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-500">
          {element.risks.length > 0 && <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{element.risks.length}</span>}
          {element.dependencies.length > 0 && <span className="flex items-center gap-1"><Link2 className="w-3 h-3" />{element.dependencies.map(d => d.predecessorWbsNumber).join(', ')}</span>}
          {element.qualityIssues.length > 0 && <span className="flex items-center gap-1 text-yellow-600"><AlertTriangle className="w-3 h-3" />{element.qualityIssues.length} issues</span>}
        </div>
      )}
    </div>
  )
}

function WBSTableView({ elements, onElementClick, onEdit, onDelete, contractPeriods }: { elements: EnhancedWBSElement[]; onElementClick: (id: string) => void; onEdit: (el: EnhancedWBSElement) => void; onDelete: (id: string) => void; contractPeriods: { key: PeriodKey; label: string }[] }) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">WBS</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Title</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">SOW</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Quality</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Method</th>
            {contractPeriods.slice(0, 3).map(period => <th key={period.key} className="text-right px-4 py-3 text-xs font-medium text-gray-600">{period.label}</th>)}
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-600">Total</th>
            <th className="w-20"></th>
          </tr>
        </thead>
        <tbody>
          {elements.map((element, idx) => {
            const totalHours = getElementTotalHours(element)
            const gradeConfig = QUALITY_GRADE_CONFIG[element.qualityGrade]
            return (
              <tr key={element.id} className={`group border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`} onClick={() => onElementClick(element.id)}>
                <td className="px-4 py-3 font-semibold text-gray-900">{element.wbsNumber}</td>
                <td className="px-4 py-3 text-gray-900 max-w-[200px] truncate">{element.title}</td>
                <td className="px-4 py-3 text-gray-500">{element.sowReference || '—'}</td>
                <td className="px-4 py-3"><Badge className={`${gradeConfig.bgColor} ${gradeConfig.textColor} border ${gradeConfig.borderColor} text-[10px] px-1.5 py-0 h-5`}>{gradeConfig.label}</Badge></td>
                <td className="px-4 py-3 text-gray-600">{ESTIMATE_METHOD_LABELS[element.estimateMethod].label}</td>
                {contractPeriods.slice(0, 3).map(period => {
                  const periodTotal = element.laborEstimates.reduce((sum, l) => sum + l.hoursByPeriod[period.key], 0)
                  return <td key={period.key} className="px-4 py-3 text-right text-gray-900">{periodTotal > 0 ? periodTotal.toLocaleString() : '—'}</td>
                })}
                <td className="px-4 py-3 text-right font-semibold text-gray-900">{totalHours.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onElementClick(element.id); }} className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /></Button>                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(element.id); }} className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================================
// HELP BANNER & OTHER HELPER COMPONENTS
// ============================================================================

function HelpBanner() {
  const [isExpanded, setIsExpanded] = useState(false)
  return (
    <div className="mb-6">
      <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
        <Info className="w-4 h-4" /><span>Understanding quality grades & estimate methods</span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isExpanded && (
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Quality Grades</h4>
            <div className="space-y-2">
              {Object.entries(QUALITY_GRADE_CONFIG).map(([key, config]) => (
                <div key={key} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${config.bgColor} border ${config.borderColor}`} />
                  <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>
                  <span className="text-xs text-gray-500">— {config.description}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Estimate Methods</h4>
            <div className="space-y-2">
              {Object.entries(ESTIMATE_METHOD_LABELS).map(([key, config]) => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-sm">{config.icon}</span>
                  <div><span className="text-sm font-medium text-gray-900">{config.label}</span><span className="text-xs text-gray-500 ml-2">— {config.description}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ChargeCodeLibrary({ chargeCodes, onAdd, onEdit, onDelete }: { chargeCodes: ChargeCode[]; onAdd: (cc: ChargeCode) => void; onEdit: (cc: ChargeCode) => void; onDelete: (id: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const filteredCodes = chargeCodes.filter(cc => cc.chargeNumber.toLowerCase().includes(searchQuery.toLowerCase()) || cc.projectName.toLowerCase().includes(searchQuery.toLowerCase()))
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Charge Code Library</h2>
          <p className="text-xs text-gray-600 mt-1">Reference past projects to support historical estimates.</p>
        </div>
        <Button size="sm" onClick={() => onAdd({ id: `cc-${Date.now()}`, chargeNumber: '', projectName: '', client: '', dateRange: '', totalHours: 0, description: '', roles: [] })}><Plus className="w-4 h-4 mr-2" />Add Charge Code</Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search charge codes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCodes.map(cc => (
          <div key={cc.id} className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1"><Hash className="w-4 h-4 text-blue-600" /><span className="font-mono text-sm font-semibold text-gray-900">{cc.chargeNumber}</span></div>
                <h3 className="text-sm font-medium text-gray-900">{cc.projectName}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{cc.totalHours.toLocaleString()} hrs</Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => onEdit(cc)} aria-label="Edit charge code"><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(cc.id)} aria-label="Delete charge code"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2"><Building2 className="w-3 h-3" /><span>{cc.client}</span><span className="w-1.5 h-1.5 rounded-full bg-gray-300" aria-hidden="true" /><Calendar className="w-3 h-3" /><span>{cc.dateRange}</span></div>
            <p className="text-xs text-gray-600 mb-2">{cc.description}</p>
            <div className="flex flex-wrap gap-1">{cc.roles.map(role => <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">{role}</Badge>)}</div>
          </div>
        ))}
      </div>
      {filteredCodes.length === 0 && (
        <div className="text-center py-12">
          <Hash className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-2">{chargeCodes.length === 0 ? 'No charge codes yet' : 'No charge codes match your search'}</p>
          <p className="text-xs text-gray-500 mb-4">Add charge codes to reference past projects in your estimates.</p>
          {chargeCodes.length === 0 && (
            <Button variant="outline" size="sm" onClick={() => onAdd({ id: `cc-${Date.now()}`, chargeNumber: '', projectName: '', client: '', dateRange: '', totalHours: 0, description: '', roles: [] })}>
              <Plus className="w-4 h-4 mr-2" />Add First Charge Code
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function RequirementsSection({
  requirements,
  wbsElements,
  onAdd,
=======
function RequirementCard({
  requirement,
  isSelected,
  isMapped,
  linkedWbsElements,
  onToggleSelect,
>>>>>>> Stashed changes
  onEdit,
  onDelete,
  onViewLinkedWbs,
  onUnlink,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: RequirementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
<<<<<<< Updated upstream
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Requirements & Traceability</h2>
          <p className="text-xs text-gray-600 mt-1 flex items-center gap-1.5">
            <span>{stats.total} requirements</span>
            <span className="w-1 h-1 rounded-full bg-gray-400" aria-hidden="true" />
            <span>{stats.mapped} mapped</span>
            <span className="w-1 h-1 rounded-full bg-gray-400" aria-hidden="true" />
            <span>{stats.shallCoverage}% "shall" covered</span>
            {stats.unmapped > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-red-400" aria-hidden="true" />
                <span className="text-red-600">{stats.unmapped} gaps</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <List className="w-4 h-4 inline mr-1.5" />List
            </button>
            <button
              onClick={() => setViewMode('gaps')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors relative ${viewMode === 'gaps' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />Gaps
              {stats.unmapped > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] bg-red-500 text-white rounded-full flex items-center justify-center">
                  {stats.unmapped}
                </span>
              )}
            </button>
          </div>

          {/* Add button */}
          <Button
            size="sm"
            onClick={() => onAdd({
              id: `req-${Date.now()}`,
              referenceNumber: '',
              title: '',
              description: '',
              type: 'shall',
              category: 'functional',
              priority: 'medium',
              source: '',
              linkedWbsIds: [],
              notes: '',
              isAIExtracted: false
            })}
          >
            <Plus className="w-4 h-4 mr-1" />Add
          </Button>
        </div>
      </div>

      {/* Quick Actions - Select All Unmapped */}
      {stats.unmapped > 0 && selectedRequirements.size === 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{stats.unmapped} unmapped requirement{stats.unmapped !== 1 ? 's' : ''}</span>
          <span>·</span>
          <button
            onClick={onSelectAllUnmapped}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Select all unmapped
          </button>
        </div>
      )}
      
      {/* List View */}
      {viewMode === 'list' && (
        <>
          {requirements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements yet</h3>
              <p className="text-sm text-gray-500 max-w-sm mb-4">
                Upload an RFP to extract requirements automatically, or add them manually.
              </p>
              <Button
                size="sm"
                onClick={() => onAdd({
                  id: `req-${Date.now()}`,
                  referenceNumber: '',
                  title: '',
                  description: '',
                  type: 'shall',
                  category: 'functional',
                  priority: 'medium',
                  source: '',
                  linkedWbsIds: [],
                  notes: '',
                  isAIExtracted: false
                })}
              >
                <Plus className="w-4 h-4 mr-1" />Add Requirement
              </Button>
            </div>
          ) : (
            <>
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
              <div className="space-y-4">
                {filteredRequirements.map((req, idx) => {
              const typeConfig = REQUIREMENT_TYPE_CONFIG[req.type]
              const linkedWbs = getLinkedWbsElements(req.linkedWbsIds)
              const isMapped = linkedWbs.length > 0
              const displayNumber = req.referenceNumber.startsWith('p.') || req.referenceNumber.startsWith('SOO')
                ? req.referenceNumber
                : `REQ-${String(idx + 1).padStart(3, '0')}`

              return (
                <div
                  key={req.id}
                  className={`group bg-white shadow-sm rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${isMapped ? 'border-l-4 border-l-emerald-500' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleSelection(req.id) }}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedRequirements.has(req.id)
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-gray-300 hover:border-emerald-400'
                      }`}
                    >
                      {selectedRequirements.has(req.id) && <Check className="w-3 h-3" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${typeConfig.color}`}>{typeConfig.label}</Badge>
                            <span className="font-mono text-xs text-gray-500">{displayNumber}</span>
                            <span className="text-sm font-medium text-gray-900 truncate">{req.title || 'Untitled'}</span>
                          </div>
                          {req.description && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">{req.description}</p>
                          )}
                          {req.source && (
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{req.source}</span>
                          )}
                          <div className="flex items-center gap-1 flex-wrap mt-1.5">
                            {linkedWbs.map(wbs => (
                              <Badge 
                                key={wbs.id} 
                                variant="secondary" 
                                className="text-[10px] px-1.5 py-0 h-5 cursor-pointer hover:bg-red-100" 
                                onClick={() => onUnlinkWbs(req.id, wbs.id)}
                              >
                                {wbs.wbsNumber} ×
                              </Badge>
                            ))}
                            <Select onValueChange={(wbsId) => onLinkWbs(req.id, wbsId)}>
                              <SelectTrigger className="h-5 w-auto px-2 text-[10px] text-emerald-600 border-none bg-transparent hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>+ Link WBS</span>
                              </SelectTrigger>
                              <SelectContent position="popper" sideOffset={4} className="z-[100] max-h-[200px] overflow-y-auto">
                                {wbsElements.filter(wbs => !req.linkedWbsIds.includes(wbs.id)).map(wbs => (
                                  <SelectItem key={wbs.id} value={wbs.id} className="text-xs">
                                    {wbs.wbsNumber} - {wbs.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50" 
                            onClick={() => onEdit(req)} 
                            aria-label="Edit requirement"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50" 
                            onClick={() => onDelete(req.id)} 
                            aria-label="Delete requirement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
=======
    <div
      className={`
        group rounded-lg border transition-all duration-200
        ${isDragOver 
          ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200' 
          : isSelected 
            ? 'border-emerald-300 bg-emerald-50/50' 
            : isMapped
              ? 'border-gray-200 bg-white hover:border-gray-300'
              : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Main Card Content */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Selection Checkbox */}
          <div className="pt-0.5">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
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
            {isMapped ? (
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
>>>>>>> Stashed changes
                </div>
                <h4 className="text-sm font-medium text-gray-900 leading-tight">
                  {requirement.title}
                </h4>
              </div>

<<<<<<< Updated upstream
      {/* Gaps View */}
      {viewMode === 'gaps' && (
        <div className="space-y-4">
          {unmappedRequirements.length === 0 ? (
            <div className="text-center py-12 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-green-800">All Requirements Mapped!</p>
            </div>
          ) : (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">{unmappedRequirements.length} Unmapped Requirement{unmappedRequirements.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="space-y-2">
                {unmappedRequirements.map(req => {
                  const typeConfig = REQUIREMENT_TYPE_CONFIG[req.type]
                  return (
                    <div key={req.id} className="group bg-white border border-l-4 border-l-red-400 border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${typeConfig.color}`}>{typeConfig.label}</Badge>
                            <span className="font-mono text-sm font-medium text-gray-900">{req.referenceNumber}</span>
                          </div>
                          <p className="text-sm text-gray-700">{req.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select onValueChange={(wbsId) => onLinkWbs(req.id, wbsId)}>
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                              <SelectValue placeholder="Link to WBS..." />
                            </SelectTrigger>
                            <SelectContent>
                              {wbsElements.map(wbs => (
                                <SelectItem key={wbs.id} value={wbs.id}>{wbs.wbsNumber} - {wbs.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50" 
                              onClick={() => onEdit(req)} 
                              aria-label="Edit requirement"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                          </div>
            </>
          )}
        </div>
      )}
=======
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
>>>>>>> Stashed changes

            {/* Description preview */}
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {requirement.description}
            </p>
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
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: () => void
}

function WBSCard({
  wbs,
  linkedRequirements,
  onView,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
}: WBSCardProps) {
  return (
<<<<<<< Updated upstream
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} aria-hidden="true" />
      <div 
        className="fixed inset-y-0 right-0 w-[750px] bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="slideout-title"
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-semibold text-gray-900">{element.wbsNumber}</span>
                {editingTitle ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={titleBuffer}
                      onChange={(e) => setTitleBuffer(e.target.value)}
                      className="h-8 text-lg font-semibold"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle()
                        if (e.key === 'Escape') setEditingTitle(false)
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={handleSaveTitle} className="h-7 w-7 p-0">
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)} className="h-7 w-7 p-0">
                      <X className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                ) : (
                  <h3 
                    id="slideout-title" 
                    className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 truncate"
                    onClick={handleStartEditTitle}
                    title="Click to edit"
=======
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group rounded-lg border border-gray-200 bg-white hover:border-gray-300 
                 hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing"
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div className="pt-0.5 text-gray-300 group-hover:text-gray-400">
            <GripVertical className="w-4 h-4" />
          </div>

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
>>>>>>> Stashed changes
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

function RequirementsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-12">
      <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-600 mb-2">No requirements yet</p>
      <p className="text-xs text-gray-500 mb-4">
        Upload an RFP to extract requirements or add them manually
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

// ============================================================================
// MAIN ESTIMATE TAB COMPONENT
// ============================================================================

export function EstimateTab() {
  const currentProposal = null
  
  // ========== STATE ==========
  
  // Requirements state
  const [requirements, setRequirements] = useState<SOORequirement[]>([])
  const [requirementSearch, setRequirementSearch] = useState('')
  const [requirementFilter, setRequirementFilter] = useState<'all' | 'unmapped' | 'mapped'>('all')
  const [selectedRequirements, setSelectedRequirements] = useState<Set<string>>(new Set())
  
  // WBS state
  const [wbsElements, setWbsElements] = useState<EnhancedWBSElement[]>([])
  const [wbsSearch, setWbsSearch] = useState('')
  const [selectedWbs, setSelectedWbs] = useState<EnhancedWBSElement | null>(null)
  
  // Drag and drop state
  const [draggedWbs, setDraggedWbs] = useState<EnhancedWBSElement | null>(null)
  const [dragOverReq, setDragOverReq] = useState<string | null>(null)
  
  // Dialog state
  const [showAddRequirement, setShowAddRequirement] = useState(false)
  const [showAddWbs, setShowAddWbs] = useState(false)
  const [editingRequirement, setEditingRequirement] = useState<SOORequirement | null>(null)
  const [editingWbs, setEditingWbs] = useState<EnhancedWBSElement | null>(null)
  
  // Bulk generation state
  const [showBulkGenerateDialog, setShowBulkGenerateDialog] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedWbs, setGeneratedWbs] = useState<EnhancedWBSElement[]>([])
  const [generationError, setGenerationError] = useState<string | null>(null)

  // ========== LOAD MOCK DATA ==========
  
  useEffect(() => {
    // Load from context or use mock data
    if (currentProposal?.requirements) {
      setRequirements(currentProposal.requirements)
    } else {
      // Mock requirements for demo
      setRequirements([
        {
          id: 'req-1',
          referenceNumber: 'REQ-001',
          title: 'Visa Appointment Scheduling System',
          description: 'Develop a public-facing visa appointment scheduling system that allows applicants to book, reschedule, and cancel appointments at consular posts worldwide.',
          type: 'functional',
          category: 'Core Features',
          source: 'SOO 3.1.1',
          priority: 'critical',
          linkedWbsIds: []
        },
        {
          id: 'req-2',
          referenceNumber: 'REQ-002',
          title: 'Account Creation & Management',
          description: 'Enable applicants to create secure accounts with email verification, password management, and profile updates.',
          type: 'functional',
          category: 'User Management',
          source: 'SOO 3.1.2',
          priority: 'high',
          linkedWbsIds: []
        },
        {
          id: 'req-3',
          referenceNumber: 'REQ-003',
          title: 'OKTA Integration',
          description: 'Integrate with Department of State OKTA identity provider for single sign-on authentication and authorization.',
          type: 'technical',
          category: 'Security',
          source: 'SOO 3.2.1',
          priority: 'critical',
          linkedWbsIds: []
        },
        {
          id: 'req-4',
          referenceNumber: 'REQ-004',
          title: 'Section 508 Compliance',
          description: 'Ensure all user interfaces meet Section 508 accessibility standards and WCAG 2.1 AA guidelines.',
          type: 'compliance',
          category: 'Accessibility',
          source: 'SOO 4.1',
          priority: 'high',
          linkedWbsIds: []
        },
        {
          id: 'req-5',
          referenceNumber: 'REQ-005',
          title: 'Crisis Management Integration',
          description: 'Integrate with State Department crisis management systems to handle emergency situations at posts.',
          type: 'functional',
          category: 'Core Features',
          source: 'SOO 3.3.1',
          priority: 'medium',
          linkedWbsIds: []
        },
        {
          id: 'req-6',
          referenceNumber: 'REQ-006',
          title: 'Monthly Status Reporting',
          description: 'Provide monthly status reports including sprint velocity, defect metrics, and stakeholder updates.',
          type: 'management',
          category: 'Reporting',
          source: 'SOO 5.1',
          priority: 'medium',
          linkedWbsIds: []
        }
      ])
    }
    
    if (currentProposal?.wbsElements) {
      setWbsElements(currentProposal.wbsElements)
    }
  }, [currentProposal])

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

  const handleLinkWbsToRequirement = useCallback((reqId: string, wbsId: string) => {
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
  }, [])

  const handleUnlinkWbsFromRequirement = useCallback((reqId: string, wbsId: string) => {
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
  }, [])

  // Drag and drop handlers
  const handleWbsDragStart = useCallback((e: React.DragEvent, wbs: EnhancedWBSElement) => {
    setDraggedWbs(wbs)
    e.dataTransfer.effectAllowed = 'link'
  }, [])

  const handleWbsDragEnd = useCallback(() => {
    setDraggedWbs(null)
    setDragOverReq(null)
  }, [])

  const handleReqDragOver = useCallback((e: React.DragEvent, reqId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'link'
    setDragOverReq(reqId)
  }, [])

  const handleReqDragLeave = useCallback(() => {
    setDragOverReq(null)
  }, [])

  const handleReqDrop = useCallback((e: React.DragEvent, reqId: string) => {
    e.preventDefault()
    if (draggedWbs) {
      handleLinkWbsToRequirement(reqId, draggedWbs.id)
    }
    setDraggedWbs(null)
    setDragOverReq(null)
  }, [draggedWbs, handleLinkWbsToRequirement])

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
          availableRoles: [], // Would come from context
          existingWbsNumbers: wbsElements.map(w => w.wbsNumber),
          contractContext: {
            title: currentProposal?.name || 'Untitled',
            agency: 'Department of State',
            contractType: 'tm',
            periodOfPerformance: { baseYear: true, optionYears: 2 }
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
  }, [requirements, selectedRequirements, wbsElements, currentProposal])

  const handleAcceptGeneratedWbs = useCallback(() => {
    // Add generated WBS and auto-link
    const newWbs = generatedWbs.map(wbs => ({
      ...wbs,
      id: `wbs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }))
    
    setWbsElements(prev => [...prev, ...newWbs])
    
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
  }, [generatedWbs, handleLinkWbsToRequirement])

  const handleDiscardGeneratedWbs = useCallback(() => {
    setShowBulkGenerateDialog(false)
    setGeneratedWbs([])
  }, [])

  const handleDeleteRequirement = useCallback((reqId: string) => {
    setRequirements(prev => prev.filter(r => r.id !== reqId))
    setSelectedRequirements(prev => {
      const next = new Set(prev)
      next.delete(reqId)
      return next
    })
  }, [])

  const handleDeleteWbs = useCallback((wbsId: string) => {
    setWbsElements(prev => prev.filter(w => w.id !== wbsId))
    // Unlink from all requirements
    setRequirements(prev => prev.map(req => ({
      ...req,
      linkedWbsIds: req.linkedWbsIds.filter(id => id !== wbsId)
    })))
  }, [])

  // ========== RENDER ==========

  return (
    <TooltipProvider>
<<<<<<< Updated upstream
      <div className="space-y-6">
      <SettingsCallout proposalId={solicitation?.solicitationNumber} />
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><h1 className="text-xl font-semibold text-gray-900">Estimate</h1><Badge variant="outline" className="text-xs">{wbsElements.length} WBS</Badge></div>
         <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs">
         <div className="flex items-center gap-1.5"><span className="text-gray-500">Hours</span><span className="font-semibold text-gray-900">{stats.totalHours.toLocaleString()}</span></div>
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" aria-hidden="true" />
         <div className="flex items-center gap-1.5"><span className="text-gray-500">Quality</span><span className="font-semibold text-gray-900">{stats.avgQuality}%</span></div>
         <span className="w-1.5 h-1.5 rounded-full bg-gray-300" aria-hidden="true" />
         <div className="flex items-center gap-1.5"><span className="text-gray-500">Reqs</span><span className={`font-semibold ${stats.requirementsCoverage === 100 ? 'text-green-600' : 'text-yellow-600'}`}>{stats.requirementsCoverage}%</span></div>
           {stats.issueCount > 0 && <><span className="w-1.5 h-1.5 rounded-full bg-gray-300" aria-hidden="true" /><div className="flex items-center gap-1.5"><span className="text-yellow-600">Issues</span><span className="font-semibold text-yellow-600">{stats.issueCount}</span></div></>}
        </div>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="bg-gray-100 p-1">
              <TabsTrigger value="requirements" className="text-xs px-4 data-[state=active]:bg-white"><ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />Requirements{stats.unmappedRequirements > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] px-1 py-0 h-4">{stats.unmappedRequirements}</Badge>}</TabsTrigger>
              <TabsTrigger value="wbs" className="text-xs px-4 data-[state=active]:bg-white"><Layers className="w-3.5 h-3.5 mr-1.5" />WBS Elements<Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0 h-4">{wbsElements.length}</Badge></TabsTrigger>
              <TabsTrigger value="labor" className="text-xs px-4 data-[state=active]:bg-white"><PieChart className="w-3.5 h-3.5 mr-1.5" />Labor Summary</TabsTrigger>
              <TabsTrigger value="charges" className="text-xs px-4 data-[state=active]:bg-white"><Hash className="w-3.5 h-3.5 mr-1.5" />Charge Codes</TabsTrigger>
            </TabsList>
            {activeSection === 'wbs' && <div className="flex gap-2"><Button size="sm" onClick={() => setShowAddElement(true)}><Plus className="w-4 h-4 mr-2" />Add Element</Button></div>}
          </div>
          
          {/* WBS Tab */}
          <TabsContent value="wbs" className="space-y-4 mt-0">
            <HelpBanner />
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[200px]"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search WBS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" /></div></div>
              <Select value={filterGrade} onValueChange={setFilterGrade}><SelectTrigger className="w-[140px] h-9"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Grade" /></SelectTrigger><SelectContent><SelectItem value="all">All Grades</SelectItem><SelectItem value="blue">Audit-Ready</SelectItem><SelectItem value="green">Complete</SelectItem><SelectItem value="yellow">Needs Review</SelectItem><SelectItem value="red">Incomplete</SelectItem></SelectContent></Select>
              <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="wbs">By WBS #</SelectItem><SelectItem value="quality">By Quality</SelectItem><SelectItem value="hours">By Hours</SelectItem></SelectContent></Select>
              <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
            </div>
            
           {filteredElements.length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-100 rounded-lg"><Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-600">No WBS elements found</p><Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddElement(true)}><Plus className="w-4 h-4 mr-2" />Add First Element</Button></div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{filteredElements.map(element => <WBSCard key={element.id} element={element} onClick={() => setSelectedElementId(element.id)} onEdit={() => setSelectedElementId(element.id)} onDelete={() => handleDeleteElement(element.id)} />)}</div>
            ) : (
              <WBSTableView elements={filteredElements} onElementClick={setSelectedElementId} onEdit={(el) => setSelectedElementId(el.id)} onDelete={handleDeleteElement} contractPeriods={contractPeriods} />
            )}
          </TabsContent>
          
       <TabsContent value="requirements" className="mt-0">
          <RequirementsSection
          requirements={requirements}
          wbsElements={wbsElements}
          onAdd={() => handleOpenReqDialog()}
          onEdit={handleOpenReqDialog}
          onDelete={async (id) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (proposalId && uuidRegex.test(id)) {
              try {
                await requirementsApi.delete(proposalId, id)
              } catch (error) {
                console.error('[Estimate] Failed to delete requirement from database:', error)
              }
            }
            setRequirements(prev => prev.filter(r => r.id !== id))
          }}
          onDeleteAll={async () => {
            if (proposalId) {
              try {
                await requirementsApi.deleteAll(proposalId)
              } catch (error) {
                console.error('[Estimate] Failed to delete requirements from database:', error)
              }
            }
            // Clear local state
            setRequirements([])
            setSelectedRequirements(new Set())
            // Reset context state so Upload tab shows initial state
            setExtractedRequirements([])
            // Only clear the analyzed document flag, preserve proposal metadata (title, agency, etc.)
            updateSolicitation({ analyzedFromDocument: undefined })
          }}
          onLinkWbs={handleLinkWbs}
          onUnlinkWbs={handleUnlinkWbs}
          selectedRequirements={selectedRequirements}
          onToggleSelection={handleToggleRequirementSelection}
          onSelectAllUnmapped={handleSelectAllUnmapped}
          onClearSelection={handleClearSelection}
          onBulkGenerate={handleBulkGenerateWBS}
          isGenerating={isGenerating}
        />
</TabsContent>
          <TabsContent value="labor" className="mt-0"><LaborSummary wbsElements={wbsElements} billableHoursPerYear={uiBillableHours} onNavigateToRoles={handleNavigateToRoles} /></TabsContent>
          <TabsContent value="charges" className="mt-0"><ChargeCodeLibrary chargeCodes={chargeCodes} onAdd={() => handleOpenChargeCodeDialog()} onEdit={handleOpenChargeCodeDialog} onDelete={(id) => setChargeCodes(prev => prev.filter(c => c.id !== id))} /></TabsContent>
        </Tabs>
        
        {/* Slideout */}
        {selectedElement && <WBSSlideout element={selectedElement} isOpen={!!selectedElementId} onClose={() => setSelectedElementId(null)} onUpdate={handleUpdateElement} contractPeriods={contractPeriods} selectedRoles={selectedRoles} allWbsElements={wbsElements} chargeCodes={chargeCodes} onOpenLaborDialog={handleOpenLaborDialog} onDeleteLabor={handleDeleteLabor} />}
        
 {/* Add Element Dialog */}
<Dialog open={showAddElement} onOpenChange={setShowAddElement}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Add WBS Element</DialogTitle>
      <DialogDescription>Create a new Work Breakdown Structure element to address a requirement</DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      {/* Requirement Selector - NEW! */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="linked-requirement">Linked Requirement <span className="text-red-500" aria-label="required">*</span></Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">Select a requirement to auto-fill the title and create traceability. Unmapped requirements are shown first.</p>
            </TooltipContent>
          </Tooltip>
          <span className="text-red-500 ml-auto" aria-label="required">*</span>
=======
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Estimate</h1>
              <p className="text-sm text-gray-500 mt-0.5">
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
>>>>>>> Stashed changes
        </div>

        {/* Two-Column Layout */}
        <div className="flex-1 flex min-h-0">
          {/* Left Column - Requirements */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col bg-white">
            {/* Requirements Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Requirements
                </h2>
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
                  <SelectTrigger className="w-[120px] h-8 text-sm">
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
            <div className="flex-1 overflow-y-auto p-4">
              {filteredRequirements.length === 0 ? (
                <RequirementsEmptyState onAdd={() => setShowAddRequirement(true)} />
              ) : (
                <div className="space-y-2">
                  {filteredRequirements.map(req => (
                    <RequirementCard
                      key={req.id}
                      requirement={req}
                      isSelected={selectedRequirements.has(req.id)}
                      isMapped={req.linkedWbsIds.length > 0}
                      linkedWbsElements={getLinkedWbsElements(req)}
                      onToggleSelect={() => handleToggleRequirementSelection(req.id)}
                      onEdit={() => setEditingRequirement(req)}
                      onDelete={() => handleDeleteRequirement(req.id)}
                      onViewLinkedWbs={(wbs) => setSelectedWbs(wbs)}
                      onUnlink={(wbsId) => handleUnlinkWbsFromRequirement(req.id, wbsId)}
                      isDragOver={dragOverReq === req.id}
                      onDragOver={(e) => handleReqDragOver(e, req.id)}
                      onDragLeave={handleReqDragLeave}
                      onDrop={(e) => handleReqDrop(e, req.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Requirements Footer */}
            <div className="flex-shrink-0 px-4 py-2 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  <CheckCircle2 className="w-3 h-3 inline mr-1 text-emerald-500" />
                  mapped
                  <Circle className="w-3 h-3 inline ml-3 mr-1 text-gray-300" />
                  unmapped
                </span>
                <span>{filteredRequirements.length} shown</span>
              </div>
            </div>
          </div>

          {/* Right Column - WBS Elements */}
          <div className="w-1/2 flex flex-col bg-gray-50">
            {/* WBS Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-3">
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
            <div className="flex-1 overflow-y-auto p-4">
              {filteredWbs.length === 0 ? (
                <WBSEmptyState hasRequirements={requirements.length > 0} />
              ) : (
                <div className="space-y-2">
                  {filteredWbs.map(wbs => (
                    <WBSCard
                      key={wbs.id}
                      wbs={wbs}
                      linkedRequirements={getLinkedRequirements(wbs)}
                      onView={() => setSelectedWbs(wbs)}
                      onEdit={() => setEditingWbs(wbs)}
                      onDelete={() => handleDeleteWbs(wbs.id)}
                      onDragStart={(e) => handleWbsDragStart(e, wbs)}
                      onDragEnd={handleWbsDragEnd}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Drag Hint */}
            {draggedWbs && (
              <div className="flex-shrink-0 px-4 py-2 border-t border-emerald-200 bg-emerald-50">
                <p className="text-xs text-emerald-700 text-center">
                  Drop on a requirement to link <strong>{draggedWbs.wbsNumber}</strong>
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

        {/* Add/Edit WBS Dialog - Placeholder */}
        <Dialog open={showAddWbs || !!editingWbs} onOpenChange={(open) => {
          if (!open) {
            setShowAddWbs(false)
            setEditingWbs(null)
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingWbs ? 'Edit WBS Element' : 'Add WBS Element'}
              </DialogTitle>
              <DialogDescription>
                {editingWbs 
                  ? 'Update the WBS element details below.'
                  : 'Add a new WBS element to your estimate.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WBS Number</Label>
                  <Input placeholder="1.1" />
                </div>
                <div className="space-y-2">
                  <Label>SOW Reference</Label>
                  <Input placeholder="SOO 3.1.1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="WBS element title..." />
              </div>
              <div className="space-y-2">
                <Label>Why (Purpose)</Label>
                <Textarea placeholder="Why is this work needed?" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>What (Deliverables)</Label>
                <Textarea placeholder="What will be delivered?" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Not Included</Label>
                <Textarea placeholder="What is explicitly out of scope?" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estimate Method</Label>
                  <Select defaultValue="engineering">
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
                  <Select defaultValue="medium">
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddWbs(false)
                setEditingWbs(null)
              }}>
                Cancel
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                {editingWbs ? 'Save Changes' : 'Add WBS Element'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

export default EstimateTab