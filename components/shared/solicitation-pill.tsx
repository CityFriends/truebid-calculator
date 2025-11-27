'use client'

import { useState } from 'react'
import { useAppContext } from '@/contexts/app-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Shield,
  ChevronRight,
  X,
  Pencil,
  AlertCircle,
} from 'lucide-react'

export function SolicitationPill() {
  const { solicitation } = useAppContext()
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate days until due
  const getDaysUntilDue = () => {
    if (!solicitation?.proposalDueDate) return null
    const due = new Date(solicitation.proposalDueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilDue = getDaysUntilDue()
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 14
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'TBD'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Empty state - no solicitation loaded
  if (!solicitation?.solicitationNumber) {
    return (
      <div className="fixed top-[60px] right-4 z-50">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-full hover:bg-gray-100 hover:border-gray-400 transition-all"
        >
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">No solicitation loaded</span>
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Floating Pill - Always visible, above header */}
      <div className="fixed top-[60px] right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {solicitation.solicitationNumber}
            </span>
          </div>
          
          {/* Due date indicator */}
          {daysUntilDue !== null && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              isOverdue 
                ? 'bg-red-100 text-red-700' 
                : isUrgent 
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{isOverdue ? 'Overdue' : `${daysUntilDue}d`}</span>
            </div>
          )}
          
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-[60]"
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Panel */}
          <div className="fixed top-[60px] right-4 w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[70] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-gray-100">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs font-mono">
                    {solicitation.solicitationNumber}
                  </Badge>
                  {solicitation.contractType && (
                    <Badge variant="secondary" className="text-xs">
                      {solicitation.contractType}
                    </Badge>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                  {solicitation.title || 'Untitled Solicitation'}
                </h3>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Agency */}
              {solicitation.agency && (
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Agency</p>
                    <p className="text-sm font-medium text-gray-900">
                      {solicitation.agency}
                      {solicitation.subAgency && (
                        <span className="text-gray-500"> / {solicitation.subAgency}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Contract Structure */}
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Contract Structure</p>
                  <p className="text-sm font-medium text-gray-900">
                    {solicitation.periodOfPerformance?.baseYear ? '1 Base' : ''}
                    {solicitation.periodOfPerformance?.optionYears 
                      ? ` + ${solicitation.periodOfPerformance.optionYears} Option Years`
                      : ''
                    }
                  </p>
                </div>
              </div>

              {/* Key Dates */}
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Key Dates</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-600">Proposal Due:</span>
                    <span className={`text-sm font-medium ${
                      isOverdue ? 'text-red-600' : isUrgent ? 'text-yellow-600' : 'text-gray-900'
                    }`}>
                      {formatDate(solicitation.proposalDueDate)}
                    </span>
                  </div>
                  {solicitation.questionsDueDate && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-600">Questions Due:</span>
                      <span className="text-sm text-gray-900">
                        {formatDate(solicitation.questionsDueDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {solicitation.setAside && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    {solicitation.setAside}
                  </Badge>
                )}
                {solicitation.clearanceRequired && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-full">
                    <Shield className="w-3 h-3" />
                    {solicitation.clearanceRequired}
                  </span>
                )}
                {solicitation.placeOfPerformance && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {solicitation.placeOfPerformance}
                  </span>
                )}
                {solicitation.naicsCode && (
                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                    {`NAICS ${solicitation.naicsCode}`}
                  </Badge>
                )}
              </div>

              {/* Urgency alert */}
              {isUrgent && !isOverdue && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="text-xs text-yellow-800">
                    <span className="font-medium">Due soon!</span> Only {daysUntilDue} days remaining to submit.
                  </p>
                </div>
              )}

              {isOverdue && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-xs text-red-800">
                    <span className="font-medium">Overdue!</span> The proposal deadline has passed.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

// Alias for backward compatibility
export { SolicitationPill as SolicitationBar }