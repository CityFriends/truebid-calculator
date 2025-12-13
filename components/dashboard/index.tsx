'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/contexts/app-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  FileText,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
  CheckCircle2,
  Check,
  Send,
  Trash2,
  Copy,
  Star,
  Users,
  AlertCircle,
  Grid3X3,
  List,
  ChevronDown,
  ChevronRight,
  Archive,
  ArchiveRestore,
  Upload,
  ArrowUpDown,
  Kanban,
  CalendarDays,
  History,
  Keyboard,
  X,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type ProposalStatus = 'draft' | 'in-review' | 'submitted' | 'won' | 'lost' | 'no-bid'
type ViewMode = 'grid' | 'list' | 'kanban' | 'calendar'
type SortOption = 'dueDate' | 'value' | 'updatedAt' | 'title' | 'status'

interface Proposal {
  id: string
  title: string
  solicitation: string
  client: string
  status: ProposalStatus
  totalValue: number
  dueDate: string | null
  updatedAt: string
  createdAt: string
  teamSize: number
  progress: number
  starred: boolean
  archived: boolean
  contractType: 'tm' | 'ffp' | 'hybrid'
  periodOfPerformance: string
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'prop-1',
    title: 'CAMP Modernization Services',
    solicitation: '19AQMM25Q0273',
    client: 'General Services Administration',
    status: 'draft',
    totalValue: 1247500,
    dueDate: '2025-12-20',
    updatedAt: '2025-12-13T10:30:00Z',
    createdAt: '2025-12-01T09:00:00Z',
    teamSize: 6,
    progress: 65,
    starred: true,
    archived: false,
    contractType: 'tm',
    periodOfPerformance: '1 Base + 2 OYs',
  },
  {
    id: 'prop-2',
    title: 'Data Analytics Platform',
    solicitation: 'HHS-2025-0142',
    client: 'Department of Health and Human Services',
    status: 'in-review',
    totalValue: 2100000,
    dueDate: '2025-12-28',
    updatedAt: '2025-12-12T14:20:00Z',
    createdAt: '2025-11-15T08:00:00Z',
    teamSize: 8,
    progress: 90,
    starred: true,
    archived: false,
    contractType: 'ffp',
    periodOfPerformance: '1 Base + 4 OYs',
  },
  {
    id: 'prop-3',
    title: 'Cloud Migration Support',
    solicitation: 'VA-IT-2025-0089',
    client: 'Department of Veterans Affairs',
    status: 'won',
    totalValue: 1890000,
    dueDate: null,
    updatedAt: '2025-12-10T16:45:00Z',
    createdAt: '2025-10-20T11:00:00Z',
    teamSize: 5,
    progress: 100,
    starred: false,
    archived: false,
    contractType: 'hybrid',
    periodOfPerformance: '1 Base + 2 OYs',
  },
  {
    id: 'prop-4',
    title: 'Cybersecurity Assessment',
    solicitation: 'DHS-CYBER-2025-012',
    client: 'Department of Homeland Security',
    status: 'lost',
    totalValue: 750000,
    dueDate: null,
    updatedAt: '2025-12-08T09:15:00Z',
    createdAt: '2025-10-05T14:00:00Z',
    teamSize: 4,
    progress: 100,
    starred: false,
    archived: false,
    contractType: 'ffp',
    periodOfPerformance: '1 Base + 1 OY',
  },
  {
    id: 'prop-5',
    title: 'Case Management System',
    solicitation: 'DOJ-CMS-2025-001',
    client: 'Department of Justice',
    status: 'submitted',
    totalValue: 3500000,
    dueDate: null,
    updatedAt: '2025-12-11T11:30:00Z',
    createdAt: '2025-09-15T10:00:00Z',
    teamSize: 12,
    progress: 100,
    starred: true,
    archived: false,
    contractType: 'tm',
    periodOfPerformance: '1 Base + 4 OYs',
  },
]

// ============================================================================
// UTILITIES
// ============================================================================

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toLocaleString()}`
}

const getDaysUntilDue = (dueDate: string | null): number | null => {
  if (!dueDate) return null
  const due = new Date(dueDate)
  const now = new Date()
  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getStatusConfig = (status: ProposalStatus) => {
  const configs = {
    'draft': { label: 'Draft', bgColor: 'bg-gray-100 text-gray-700', dotColor: 'bg-gray-400' },
    'in-review': { label: 'In Review', bgColor: 'bg-yellow-100 text-yellow-700', dotColor: 'bg-yellow-500' },
    'submitted': { label: 'Submitted', bgColor: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' },
    'won': { label: 'Won', bgColor: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
    'lost': { label: 'Lost', bgColor: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' },
    'no-bid': { label: 'No Bid', bgColor: 'bg-gray-100 text-gray-500', dotColor: 'bg-gray-400' },
  }
  return configs[status]
}

// Get unique agencies from proposals
const getUniqueAgencies = (proposals: Proposal[]): string[] => {
  const agencies = new Set(proposals.map(p => p.client))
  return Array.from(agencies).sort()
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROPOSALS_STORAGE_KEY = 'truebid-proposals'
const RECENTLY_VIEWED_KEY = 'truebid-recently-viewed'

const STATUS_OPTIONS: { value: ProposalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'in-review', label: 'In Review' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'no-bid', label: 'No Bid' },
]

const CONTRACT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'tm', label: 'T&M' },
  { value: 'ffp', label: 'FFP' },
  { value: 'hybrid', label: 'Hybrid' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'dueDate', label: 'Due Date' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'value', label: 'Value' },
  { value: 'title', label: 'Alphabetical' },
  { value: 'status', label: 'Status' },
]

// ============================================================================
// PROPOSAL CARD COMPONENT
// ============================================================================

function ProposalCard({
  proposal,
  onOpen,
  onToggleStar,
  onDuplicate,
  onDelete,
  onToggleArchive,
  onStatusChange,
}: {
  proposal: Proposal
  onOpen: () => void
  onToggleStar: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleArchive: () => void
  onStatusChange: (status: ProposalStatus) => void
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const statusConfig = getStatusConfig(proposal.status)
  const daysUntilDue = getDaysUntilDue(proposal.dueDate)
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0
  const canArchive = ['won', 'lost', 'no-bid'].includes(proposal.status)

  const allStatuses: { id: ProposalStatus; label: string }[] = [
    { id: 'draft', label: 'Draft' },
    { id: 'in-review', label: 'In Review' },
    { id: 'submitted', label: 'Submitted' },
    { id: 'won', label: 'Won' },
    { id: 'lost', label: 'Lost' },
    { id: 'no-bid', label: 'No Bid' },
  ]

  return (
    <div
      className={`
        group border border-gray-200 rounded-lg p-4 
        hover:border-blue-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] 
        transition-all cursor-pointer bg-white
        ${proposal.archived ? 'opacity-60' : ''}
      `}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      {/* Header with title and actions */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          {/* Title with star */}
          <div className="flex items-start gap-2 mb-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
              className={`mt-0.5 shrink-0 ${
                proposal.starred 
                  ? 'text-amber-500 hover:text-amber-600' 
                  : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <Star className={`w-4 h-4 ${proposal.starred ? 'fill-current' : ''}`} />
            </button>
            <h3 className="font-medium text-sm text-gray-900 leading-tight line-clamp-2">
              {proposal.title}
            </h3>
          </div>
          
          {/* Badges */}
          <div className="flex items-center gap-1.5 mb-2">
            {/* Clickable Status Badge */}
            <div className="relative">
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowStatusMenu(!showStatusMenu); 
                }}
                className={`
                  inline-flex items-center text-[10px] px-1.5 py-0.5 h-5 rounded-md border-0 
                  font-medium transition-all hover:ring-2 hover:ring-blue-200
                  ${statusConfig.bgColor}
                `}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dotColor}`} />
                {statusConfig.label}
                <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
              </button>
              
              {/* Status Dropdown */}
              {showStatusMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={(e) => { e.stopPropagation(); setShowStatusMenu(false); }}
                  />
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                    {allStatuses.map((status) => {
                      const config = getStatusConfig(status.id)
                      const isSelected = proposal.status === status.id
                      return (
                        <button
                          key={status.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onStatusChange(status.id)
                            setShowStatusMenu(false)
                          }}
                          className={`
                            w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left
                            hover:bg-gray-50 transition-colors
                            ${isSelected ? 'bg-gray-50 font-medium' : ''}
                          `}
                        >
                          <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                          {status.label}
                          {isSelected && <Check className="w-3 h-3 ml-auto text-blue-600" />}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-[10px] px-1.5 py-0 h-5">
              {proposal.contractType.toUpperCase()}
            </Badge>
            {proposal.archived && (
              <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-[10px] px-1.5 py-0 h-5">
                Archived
              </Badge>
            )}
          </div>
        </div>
        
        {/* Action buttons - visible on hover */}
        <div className="flex gap-1 ml-2">
          {canArchive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onToggleArchive(); }}
              className="text-gray-400 hover:text-purple-600 hover:bg-purple-50 
                         h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {proposal.archived ? (
                <ArchiveRestore className="w-3.5 h-3.5" />
              ) : (
                <Archive className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 
                       h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 
                       h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Client */}
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="truncate">{proposal.client}</span>
      </div>

      {/* Metadata footer */}
      <div className="space-y-1.5 text-xs border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Solicitation</span>
          <span className="font-mono text-gray-700">{proposal.solicitation}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Value</span>
          <span className="font-semibold text-gray-900">{formatCurrency(proposal.totalValue)}</span>
        </div>
        {proposal.dueDate && ['draft', 'in-review'].includes(proposal.status) && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Due</span>
            <span className={`flex items-center gap-1 font-medium ${
              isUrgent ? 'text-yellow-600' : 'text-gray-700'
            }`}>
              <Calendar className="w-3 h-3" />
              {daysUntilDue !== null && daysUntilDue >= 0 
                ? `${daysUntilDue} days left`
                : new Date(proposal.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
            </span>
          </div>
        )}
        {proposal.status === 'won' && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Status</span>
            <span className="text-green-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Awarded
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Team</span>
          <span className="flex items-center gap-1 text-gray-700">
            <Users className="w-3 h-3" />
            {proposal.teamSize} members
          </span>
        </div>
        
        {/* Last updated */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <span className="text-gray-400">Updated</span>
          <span className="text-gray-400">{formatRelativeTime(proposal.updatedAt)}</span>
        </div>
        
        {/* Progress bar for active proposals */}
        {['draft', 'in-review'].includes(proposal.status) && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500">Progress</span>
              <span className="text-gray-700">{proposal.progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  proposal.progress >= 90 ? 'bg-green-500' :
                  proposal.progress >= 50 ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`}
                style={{ width: `${proposal.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// KANBAN VIEW - with Drag & Drop
// ============================================================================

function KanbanView({
  proposals,
  onOpen,
  onStatusChange,
}: {
  proposals: Proposal[]
  onOpen: (id: string) => void
  onStatusChange: (id: string, status: ProposalStatus) => void
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<ProposalStatus | null>(null)

  const columns: { status: ProposalStatus; label: string; color: string }[] = [
    { status: 'draft', label: 'Draft', color: 'border-gray-300' },
    { status: 'in-review', label: 'In Review', color: 'border-yellow-400' },
    { status: 'submitted', label: 'Submitted', color: 'border-blue-400' },
    { status: 'won', label: 'Won', color: 'border-green-400' },
    { status: 'lost', label: 'Lost', color: 'border-red-400' },
  ]

  const handleDragStart = (e: React.DragEvent, proposalId: string) => {
    setDraggedId(proposalId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', proposalId)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, status: ProposalStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, newStatus: ProposalStatus) => {
    e.preventDefault()
    const proposalId = e.dataTransfer.getData('text/plain')
    if (proposalId && draggedId) {
      onStatusChange(proposalId, newStatus)
    }
    setDraggedId(null)
    setDragOverColumn(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnProposals = proposals.filter(p => p.status === column.status && !p.archived)
        const totalValue = columnProposals.reduce((sum, p) => sum + p.totalValue, 0)
        const isDropTarget = dragOverColumn === column.status
        
        return (
          <div 
            key={column.status}
            className={`
              flex-shrink-0 w-72 rounded-lg border-t-4 transition-colors
              ${column.color}
              ${isDropTarget ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-gray-50'}
            `}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-gray-900">{column.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnProposals.length}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(totalValue)} total
              </p>
            </div>
            
            <div className="p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto min-h-[100px]">
              {columnProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, proposal.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onOpen(proposal.id)}
                  className={`
                    bg-white p-3 rounded-lg border border-gray-200 
                    hover:border-blue-400 hover:shadow-sm cursor-grab active:cursor-grabbing
                    transition-all select-none
                    ${draggedId === proposal.id ? 'opacity-50 ring-2 ring-blue-400' : ''}
                  `}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {proposal.starred && (
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0 mt-0.5" />
                    )}
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {proposal.title}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{proposal.client}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(proposal.totalValue)}
                    </span>
                    {proposal.dueDate && getDaysUntilDue(proposal.dueDate) !== null && (
                      <span className={`flex items-center gap-1 ${
                        getDaysUntilDue(proposal.dueDate)! <= 7 ? 'text-yellow-600' : 'text-gray-500'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {getDaysUntilDue(proposal.dueDate)}d
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {columnProposals.length === 0 && (
                <div className={`
                  text-center py-8 text-sm rounded-lg border-2 border-dashed
                  ${isDropTarget ? 'border-blue-300 text-blue-500 bg-blue-50' : 'border-gray-200 text-gray-400'}
                `}>
                  {isDropTarget ? 'Drop here' : 'No proposals'}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// CALENDAR VIEW
// ============================================================================

function CalendarView({
  proposals,
  onOpen,
}: {
  proposals: Proposal[]
  onOpen: (id: string) => void
}) {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  // Get proposals with due dates this month
  const proposalsWithDates = proposals.filter(p => {
    if (!p.dueDate || p.archived) return false
    const dueDate = new Date(p.dueDate)
    return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear
  })

  // Generate calendar days
  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDay = firstDay.getDay()
  
  const days = []
  for (let i = 0; i < startingDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getProposalsForDay = (day: number) => {
    return proposalsWithDates.filter(p => {
      const dueDate = new Date(p.dueDate!)
      return dueDate.getDate() === day
    })
  }

  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{monthName}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {proposalsWithDates.length} proposal{proposalsWithDates.length !== 1 ? 's' : ''} due this month
        </p>
      </div>
      
      {/* Calendar Header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayProposals = day ? getProposalsForDay(day) : []
          const isToday = day === today.getDate()
          
          return (
            <div 
              key={i} 
              className={`
                min-h-[100px] p-1 border-b border-r border-gray-100
                ${day ? 'bg-white' : 'bg-gray-50'}
                ${isToday ? 'ring-2 ring-inset ring-blue-500' : ''}
              `}
            >
              {day && (
                <>
                  <div className={`text-xs font-medium p-1 ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayProposals.slice(0, 2).map((proposal) => (
                      <div
                        key={proposal.id}
                        onClick={() => onOpen(proposal.id)}
                        className={`
                          text-[10px] p-1 rounded truncate cursor-pointer
                          ${proposal.status === 'draft' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : ''}
                          ${proposal.status === 'in-review' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : ''}
                          ${proposal.status === 'submitted' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}
                        `}
                      >
                        {proposal.title}
                      </div>
                    ))}
                    {dayProposals.length > 2 && (
                      <div className="text-[10px] text-gray-500 pl-1">
                        +{dayProposals.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// URGENCY BANNER
// ============================================================================

function UrgencyBanner({ 
  proposals, 
  onOpen 
}: { 
  proposals: Proposal[]
  onOpen: (id: string) => void 
}) {
  const urgentProposals = proposals.filter(p => {
    if (p.archived || !['draft', 'in-review'].includes(p.status)) return false
    const days = getDaysUntilDue(p.dueDate)
    return days !== null && days >= 0 && days <= 7
  }).sort((a, b) => getDaysUntilDue(a.dueDate)! - getDaysUntilDue(b.dueDate)!)

  if (urgentProposals.length === 0) return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-yellow-800">
            {urgentProposals.length} proposal{urgentProposals.length > 1 ? 's' : ''} due this week
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {urgentProposals.map((proposal) => (
              <button
                key={proposal.id}
                onClick={() => onOpen(proposal.id)}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-100 hover:bg-yellow-200 rounded text-xs font-medium text-yellow-800 transition-colors"
              >
                {proposal.title}
                <span className="text-yellow-600">
                  ({getDaysUntilDue(proposal.dueDate)}d)
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// RECENTLY VIEWED
// ============================================================================

function RecentlyViewed({
  proposals,
  recentIds,
  onOpen,
}: {
  proposals: Proposal[]
  recentIds: string[]
  onOpen: (id: string) => void
}) {
  const recentProposals = recentIds
    .map(id => proposals.find(p => p.id === id))
    .filter((p): p is Proposal => p !== undefined)
    .slice(0, 5)

  if (recentProposals.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-600">Recently Viewed</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {recentProposals.map((proposal) => (
          <button
            key={proposal.id}
            onClick={() => onOpen(proposal.id)}
            className="flex-shrink-0 flex items-center gap-3 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all"
          >
            {proposal.starred && (
              <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
            )}
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                {proposal.title}
              </p>
              <p className="text-xs text-gray-500">{formatRelativeTime(proposal.updatedAt)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// KEYBOARD SHORTCUTS MODAL
// ============================================================================

function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: '/', description: 'Focus search' },
    { key: 'n', description: 'New proposal' },
    { key: 'g', description: 'Grid view' },
    { key: 'l', description: 'List view' },
    { key: 'k', description: 'Kanban view' },
    { key: 'c', description: 'Calendar view' },
    { key: 'a', description: 'Toggle archive view' },
    { key: '?', description: 'Show shortcuts' },
    { key: 'Esc', description: 'Close dialogs' },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-[400px] max-w-[90vw]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Keyboard Shortcuts</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 space-y-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-600">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-gray-700">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ============================================================================
// EMPTY STATES
// ============================================================================

function EmptyState({
  companyName,
  onNewProposal,
  onImportRFP,
}: {
  companyName: string
  onNewProposal: () => void
  onImportRFP: () => void
}) {
  return (
    <div className="py-16 px-4">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Welcome, {companyName}
        </h2>
        <p className="text-gray-600 mb-8">
          Your proposal workspace is ready. How would you like to get started?
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
          <button
            onClick={onNewProposal}
            className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all text-left"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Start from scratch</h3>
            <p className="text-sm text-gray-500 mb-3">
              Create a blank proposal and build your estimate step by step.
            </p>
            <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
              + Blank Proposal
            </span>
          </button>
          
          <button
            onClick={onImportRFP}
            className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all text-left"
          >
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Import an RFP</h3>
            <p className="text-sm text-gray-500 mb-3">
              Upload a PDF and let AI extract requirements and recommend roles.
            </p>
            <span className="text-sm font-medium text-green-600 group-hover:text-green-700">
              ↑ Upload RFP
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

function FilteredEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  )
}

// ============================================================================
// MAIN DASHBOARD
// ============================================================================

export function Dashboard() {
  const router = useRouter()
  const { companyProfile, setActiveUtilityTool } = useAppContext()
  
  // Core state
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  
  // View state
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showArchived, setShowArchived] = useState(false)
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [agencyFilter, setAgencyFilter] = useState<string>('all')
  
  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('dueDate')
  const [sortDesc, setSortDesc] = useState(true)
  
  // Recently viewed
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([])
  
  // UI state
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Load proposals from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(PROPOSALS_STORAGE_KEY)
    if (stored) {
      try {
        setProposals(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored proposals:', e)
        setProposals(MOCK_PROPOSALS)
      }
    } else {
      setProposals(MOCK_PROPOSALS)
    }
    
    // Load recently viewed
    const recentStored = localStorage.getItem(RECENTLY_VIEWED_KEY)
    if (recentStored) {
      try {
        setRecentlyViewed(JSON.parse(recentStored))
      } catch (e) {
        console.error('Failed to parse recently viewed:', e)
      }
    }
    
    setIsLoaded(true)
  }, [])

  // Save proposals when they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(proposals))
    }
  }, [proposals, isLoaded])

  // Save recently viewed when it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed))
    }
  }, [recentlyViewed, isLoaded])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.key) {
        case '/':
          e.preventDefault()
          document.getElementById('search-input')?.focus()
          break
        case 'n':
          e.preventDefault()
          handleNewProposal()
          break
        case 'g':
          setViewMode('grid')
          break
        case 'l':
          setViewMode('list')
          break
        case 'k':
          setViewMode('kanban')
          break
        case 'c':
          setViewMode('calendar')
          break
        case 'a':
          setShowArchived(prev => !prev)
          break
        case '?':
          setShowShortcuts(true)
          break
        case 'Escape':
          setShowShortcuts(false)
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Unique agencies for filter
  const uniqueAgencies = useMemo(() => getUniqueAgencies(proposals), [proposals])

  // Filter and sort proposals
  const filteredProposals = useMemo(() => {
    let result = proposals

    // Archive filter
    result = result.filter(p => showArchived ? p.archived : !p.archived)

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.solicitation.toLowerCase().includes(query) ||
        p.client.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(p => p.contractType === typeFilter)
    }

    // Agency filter
    if (agencyFilter !== 'all') {
      result = result.filter(p => p.client === agencyFilter)
    }

    // Sort
    result = [...result].sort((a, b) => {
      // Starred items always first
      if (a.starred !== b.starred) {
        return a.starred ? -1 : 1
      }

      let comparison = 0
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0
          else if (!a.dueDate) comparison = 1
          else if (!b.dueDate) comparison = -1
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          break
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        case 'value':
          comparison = a.totalValue - b.totalValue
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'status':
          const statusOrder = ['draft', 'in-review', 'submitted', 'won', 'lost', 'no-bid']
          comparison = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
          break
      }

      return sortDesc ? -comparison : comparison
    })

    return result
  }, [proposals, showArchived, searchQuery, statusFilter, typeFilter, agencyFilter, sortBy, sortDesc])

  // Stats calculations
  const stats = useMemo(() => {
    const active = proposals.filter(p => !p.archived && ['draft', 'in-review'].includes(p.status))
    const submitted = proposals.filter(p => !p.archived && p.status === 'submitted')
    const won = proposals.filter(p => !p.archived && p.status === 'won')
    const lost = proposals.filter(p => !p.archived && p.status === 'lost')
    
    const pipelineValue = active.reduce((sum, p) => sum + p.totalValue, 0) +
                          submitted.reduce((sum, p) => sum + p.totalValue, 0)
    
    const winRate = won.length + lost.length > 0
      ? Math.round((won.length / (won.length + lost.length)) * 100)
      : 0

    return {
      active: active.length,
      pipelineValue,
      submitted: submitted.length,
      winRate,
    }
  }, [proposals])

  // Handlers
  const handleNewProposal = () => {
    setActiveUtilityTool(null)
    const newId = `prop-${Date.now()}`
    router.push(`/${newId}`)
  }

  const handleImportRFP = () => {
    setActiveUtilityTool(null)
    const newId = `prop-${Date.now()}`
    router.push(`/${newId}?tab=upload`)
  }

  const handleOpenProposal = (proposalId: string) => {
    setActiveUtilityTool(null)
    // Add to recently viewed
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== proposalId)
      return [proposalId, ...filtered].slice(0, 10)
    })
    router.push(`/${proposalId}`)
  }

  const handleToggleStar = (proposalId: string) => {
    setProposals(prev =>
      prev.map(p => p.id === proposalId ? { ...p, starred: !p.starred } : p)
    )
  }

  const handleToggleArchive = (proposalId: string) => {
    setProposals(prev =>
      prev.map(p => p.id === proposalId ? { ...p, archived: !p.archived } : p)
    )
  }

  const handleDuplicate = (proposalId: string) => {
    const original = proposals.find(p => p.id === proposalId)
    if (!original) return
    
    const duplicate: Proposal = {
      ...original,
      id: `prop-${Date.now()}`,
      title: `${original.title} (Copy)`,
      status: 'draft',
      starred: false,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
    }
    setProposals(prev => [duplicate, ...prev])
  }

  const handleDelete = (proposalId: string) => {
    if (confirm('Are you sure you want to delete this proposal?')) {
      setProposals(prev => prev.filter(p => p.id !== proposalId))
    }
  }

  const handleStatusChange = (proposalId: string, newStatus: ProposalStatus) => {
    setProposals(prev =>
      prev.map(p => p.id === proposalId ? { ...p, status: newStatus, updatedAt: new Date().toISOString() } : p)
    )
  }

  const handleStatClick = (stat: 'active' | 'pipeline' | 'submitted' | 'winRate') => {
    // Clear other filters first
    setSearchQuery('')
    setTypeFilter('all')
    setAgencyFilter('all')
    setShowArchived(false)
    
    switch (stat) {
      case 'active':
        setStatusFilter('all') // Will show draft and in-review naturally
        break
      case 'pipeline':
        setStatusFilter('all')
        break
      case 'submitted':
        setStatusFilter('submitted')
        break
      case 'winRate':
        setStatusFilter('won')
        break
    }
  }

  const companyName = companyProfile?.name || 'TrueBid'
  const archivedCount = proposals.filter(p => p.archived).length
  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || agencyFilter !== 'all'

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {proposals.length === 0 ? (
          <EmptyState
            companyName={companyName}
            onNewProposal={handleNewProposal}
            onImportRFP={handleImportRFP}
          />
        ) : (
          <>
            {/* Urgency Banner */}
            <UrgencyBanner proposals={proposals} onOpen={handleOpenProposal} />

            {/* Recently Viewed */}
            <RecentlyViewed
              proposals={proposals}
              recentIds={recentlyViewed}
              onOpen={handleOpenProposal}
            />

            {/* Stats Row - Clickable */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <button
                onClick={() => handleStatClick('active')}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600">Active Proposals</span>
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
                <div className="text-xs text-gray-500">In progress</div>
              </button>

              <button
                onClick={() => handleStatClick('pipeline')}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-green-400 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-600">Pipeline Value</span>
                  <DollarSign className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pipelineValue)}</div>
                <div className="text-xs text-gray-500">Total potential</div>
              </button>

              <button
                onClick={() => handleStatClick('submitted')}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-yellow-400 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-600">Submitted</span>
                  <Send className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.submitted}</div>
                <div className="text-xs text-gray-500">Awaiting decision</div>
              </button>

              <button
                onClick={() => handleStatClick('winRate')}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-purple-400 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-600">Win Rate</span>
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.winRate}%</div>
                <div className="text-xs text-gray-500">Historical</div>
              </button>
            </div>

            {/* Toolbar - Sticky */}
            <div className="sticky top-14 z-20 bg-gray-50 py-3 -mx-6 px-6 mb-4 border-b border-gray-200">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search-input"
                    placeholder="Search proposals... (Press /)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProposalStatus | 'all')}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Agency Filter */}
                <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Agency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agencies</SelectItem>
                    {uniqueAgencies.map((agency) => (
                      <SelectItem key={agency} value={agency}>
                        {agency.length > 30 ? agency.substring(0, 30) + '...' : agency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all')
                      setTypeFilter('all')
                      setAgencyFilter('all')
                    }}
                    className="h-9 text-xs text-gray-500"
                  >
                    Clear filters
                  </Button>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-xs">Sort by</DropdownMenuLabel>
                    {SORT_OPTIONS.map((opt) => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={sortBy === opt.value}
                        onCheckedChange={() => setSortBy(opt.value)}
                      >
                        {opt.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={sortDesc}
                      onCheckedChange={() => setSortDesc(!sortDesc)}
                    >
                      Descending
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Toggle */}
                <div className="flex gap-1 border border-gray-200 rounded-md p-0.5 bg-white">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-2 h-8"
                    title="Grid view (G)"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="px-2 h-8"
                    title="List view (L)"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                    className="px-2 h-8"
                    title="Kanban view (K)"
                  >
                    <Kanban className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className="px-2 h-8"
                    title="Calendar view (C)"
                  >
                    <CalendarDays className="w-4 h-4" />
                  </Button>
                </div>

                {/* Archive Toggle */}
                <Button
                  variant={showArchived ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className="h-9 gap-1.5"
                  title="Toggle archive (A)"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                  {archivedCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                      {archivedCount}
                    </Badge>
                  )}
                </Button>

                {/* Add New */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="h-9 gap-1.5">
                      Add New...
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleNewProposal}>
                      <FileText className="w-4 h-4 mr-2" />
                      Blank Proposal
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleImportRFP}>
                      <Upload className="w-4 h-4 mr-2" />
                      Import from RFP
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                      <FileText className="w-4 h-4 mr-2" />
                      From Template
                      <Badge variant="secondary" className="ml-auto text-[10px]">Soon</Badge>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Keyboard Shortcuts */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShortcuts(true)}
                  className="h-9 w-9 p-0 hidden sm:flex"
                  title="Keyboard shortcuts (?)"
                >
                  <Keyboard className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Results count */}
            <p className="text-xs text-gray-500 mb-4">
              {showArchived 
                ? `Showing ${filteredProposals.length} archived proposal${filteredProposals.length !== 1 ? 's' : ''}`
                : `Showing ${filteredProposals.length} of ${proposals.filter(p => !p.archived).length} proposals`
              }
              {hasActiveFilters && ' (filtered)'}
            </p>

            {/* Main Content Area */}
            <div>
              {viewMode === 'grid' && filteredProposals.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      onOpen={() => handleOpenProposal(proposal.id)}
                      onToggleStar={() => handleToggleStar(proposal.id)}
                      onToggleArchive={() => handleToggleArchive(proposal.id)}
                      onDuplicate={() => handleDuplicate(proposal.id)}
                      onDelete={() => handleDelete(proposal.id)}
                      onStatusChange={(status) => handleStatusChange(proposal.id, status)}
                    />
                  ))}
                </div>
              )}

              {viewMode === 'list' && filteredProposals.length > 0 && (
                <div className="space-y-2">
                  {filteredProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      onClick={() => handleOpenProposal(proposal.id)}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm cursor-pointer transition-all"
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleStar(proposal.id); }}
                        className={`shrink-0 ${
                          proposal.starred 
                            ? 'text-amber-500 hover:text-amber-600' 
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${proposal.starred ? 'fill-current' : ''}`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 truncate">{proposal.title}</h3>
                        <p className="text-xs text-gray-500 truncate">{proposal.client}</p>
                      </div>
                      <Badge className={`shrink-0 ${getStatusConfig(proposal.status).bgColor}`}>
                        {getStatusConfig(proposal.status).label}
                      </Badge>
                      <span className="text-sm font-semibold text-gray-900 shrink-0 w-20 text-right">
                        {formatCurrency(proposal.totalValue)}
                      </span>
                      <span className="text-xs text-gray-500 shrink-0 w-24 text-right">
                        {formatRelativeTime(proposal.updatedAt)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {viewMode === 'kanban' && (
                <KanbanView
                  proposals={proposals}
                  onOpen={handleOpenProposal}
                  onStatusChange={handleStatusChange}
                />
              )}

              {viewMode === 'calendar' && (
                <CalendarView
                  proposals={proposals}
                  onOpen={handleOpenProposal}
                />
              )}

              {/* Empty States */}
              {filteredProposals.length === 0 && viewMode !== 'kanban' && viewMode !== 'calendar' && (
                showArchived ? (
                  <FilteredEmptyState
                    icon={Archive}
                    title="No archived proposals"
                    description="Completed proposals will appear here when archived"
                  />
                ) : searchQuery || hasActiveFilters ? (
                  <FilteredEmptyState
                    icon={Search}
                    title="No matching proposals"
                    description="Try adjusting your search or filters"
                  />
                ) : null
              )}
            </div>
          </>
        )}
      </main>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  )
}

export default Dashboard