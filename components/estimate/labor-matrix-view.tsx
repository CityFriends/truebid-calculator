"use client"

import React, { useState, useCallback, useMemo } from 'react'
import {
  ChevronDown, ChevronRight, Clock, Users, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { EnhancedWBSElement, LaborEstimate, PeriodConfig } from './types'
import { formatHours, getConfidenceColor } from './utils'

interface LaborMatrixViewProps {
  wbsElements: EnhancedWBSElement[]
  periods: PeriodConfig[]
  activePeriod: string
  onPeriodChange: (periodId: string) => void
  companyRoles: Array<{ id: string; title: string }>
  onUpdateHours: (wbsId: string, roleId: string, periodKey: string, hours: number) => void
  onViewWbs: (wbs: EnhancedWBSElement) => void
  onAddWbs: () => void
}

export function LaborMatrixView({
  wbsElements,
  periods,
  activePeriod,
  onPeriodChange,
  companyRoles,
  onUpdateHours,
  onViewWbs,
  onAddWbs,
}: LaborMatrixViewProps) {
  const [expandedWbs, setExpandedWbs] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{ wbsId: string; roleId: string; periodKey: string } | null>(null)
  const [editValue, setEditValue] = useState('')

  // Get all unique roles used across all WBS elements
  const usedRoles = useMemo(() => {
    const roleSet = new Set<string>()
    wbsElements.forEach(wbs => {
      wbs.laborEstimates.forEach(le => roleSet.add(le.roleId))
    })
    return companyRoles.filter(r => roleSet.has(r.id))
  }, [wbsElements, companyRoles])

  // Calculate totals for the active period
  const periodTotals = useMemo(() => {
    const totals: Record<string, number> = { total: 0 }
    usedRoles.forEach(role => {
      totals[role.id] = 0
    })

    wbsElements.forEach(wbs => {
      wbs.laborEstimates.forEach(le => {
        const hours = le.hoursByPeriod[activePeriod as keyof typeof le.hoursByPeriod] || 0
        if (totals[le.roleId] !== undefined) {
          totals[le.roleId] += hours
        }
        totals.total += hours
      })
    })

    return totals
  }, [wbsElements, usedRoles, activePeriod])

  // Calculate WBS totals for active period
  const getWbsPeriodTotal = useCallback((wbs: EnhancedWBSElement) => {
    return wbs.laborEstimates.reduce((sum, le) => {
      return sum + (le.hoursByPeriod[activePeriod as keyof typeof le.hoursByPeriod] || 0)
    }, 0)
  }, [activePeriod])

  // Get hours for a specific cell
  const getCellHours = useCallback((wbs: EnhancedWBSElement, roleId: string) => {
    const labor = wbs.laborEstimates.find(le => le.roleId === roleId)
    if (!labor) return 0
    return labor.hoursByPeriod[activePeriod as keyof typeof labor.hoursByPeriod] || 0
  }, [activePeriod])

  const toggleExpanded = (wbsId: string) => {
    setExpandedWbs(prev => {
      const next = new Set(prev)
      if (next.has(wbsId)) {
        next.delete(wbsId)
      } else {
        next.add(wbsId)
      }
      return next
    })
  }

  const handleCellClick = (wbsId: string, roleId: string, currentValue: number) => {
    setEditingCell({ wbsId, roleId, periodKey: activePeriod })
    setEditValue(String(currentValue))
  }

  const handleCellBlur = () => {
    if (editingCell) {
      const numValue = parseFloat(editValue) || 0
      onUpdateHours(editingCell.wbsId, editingCell.roleId, editingCell.periodKey, numValue)
      setEditingCell(null)
      setEditValue('')
    }
  }

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur()
    } else if (e.key === 'Escape') {
      setEditingCell(null)
      setEditValue('')
    }
  }

  // Empty state
  if (wbsElements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Clock className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No WBS elements yet</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
          Generate WBS elements from requirements in the Requirements view, or add one manually.
        </p>
        <Button onClick={onAddWbs} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add WBS Element
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Period tabs */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          {periods.map(period => (
            <button
              key={period.id}
              onClick={() => onPeriodChange(period.id)}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${activePeriod === period.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }
              `}
            >
              {period.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse min-w-max">
          {/* Header row with role columns */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3 w-64 sticky left-0 bg-gray-100 z-20">
                WBS Element
              </th>
              {usedRoles.map(role => (
                <th
                  key={role.id}
                  className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-3 w-24"
                >
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="truncate block max-w-[80px]">{role.title}</span>
                    </TooltipTrigger>
                    <TooltipContent>{role.title}</TooltipContent>
                  </Tooltip>
                </th>
              ))}
              <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-3 w-24 bg-emerald-50">
                Total
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {wbsElements.map(wbs => {
              const isExpanded = expandedWbs.has(wbs.id)
              const wbsTotal = getWbsPeriodTotal(wbs)

              return (
                <React.Fragment key={wbs.id}>
                  {/* WBS row */}
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleExpanded(wbs.id)}
                          className="p-0.5 hover:bg-gray-200 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <button
                            onClick={() => onViewWbs(wbs)}
                            className="flex items-center gap-2 hover:text-emerald-600"
                          >
                            <span className="text-xs font-mono font-semibold text-emerald-600">
                              {wbs.wbsNumber}
                            </span>
                            <span className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                              {wbs.title}
                            </span>
                          </button>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1 py-0 h-4 ${getConfidenceColor(wbs.confidence)}`}
                            >
                              {wbs.confidence}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              <Users className="w-3 h-3 inline mr-0.5" />
                              {wbs.laborEstimates.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role hour cells */}
                    {usedRoles.map(role => {
                      const hours = getCellHours(wbs, role.id)
                      const isEditing = editingCell?.wbsId === wbs.id && editingCell?.roleId === role.id

                      return (
                        <td key={role.id} className="px-2 py-2 text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={handleCellKeyDown}
                              className="w-20 h-8 text-center text-sm mx-auto"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => handleCellClick(wbs.id, role.id, hours)}
                              className={`
                                w-20 h-8 rounded text-sm font-medium transition-colors mx-auto block
                                ${hours > 0
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                }
                              `}
                            >
                              {hours > 0 ? formatHours(hours) : '—'}
                            </button>
                          )}
                        </td>
                      )
                    })}

                    {/* WBS total */}
                    <td className="px-2 py-2 text-center bg-emerald-50/50">
                      <span className="text-sm font-semibold text-emerald-700">
                        {formatHours(wbsTotal)}
                      </span>
                    </td>
                  </tr>

                  {/* Expanded details */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={usedRoles.length + 2} className="bg-gray-50 px-4 py-3">
                        <div className="pl-8 space-y-2">
                          <div className="text-xs text-gray-500">
                            <strong>Why:</strong> {wbs.why || 'Not specified'}
                          </div>
                          <div className="text-xs text-gray-500">
                            <strong>What:</strong> {wbs.what || 'Not specified'}
                          </div>
                          {wbs.assumptions.length > 0 && (
                            <div className="text-xs text-gray-500">
                              <strong>Assumptions:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {wbs.assumptions.slice(0, 3).map((a, i) => (
                                  <li key={i}>{a}</li>
                                ))}
                                {wbs.assumptions.length > 3 && (
                                  <li className="text-gray-400">+{wbs.assumptions.length - 3} more</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}

            {/* Totals row */}
            <tr className="bg-emerald-100 font-semibold sticky bottom-0">
              <td className="px-4 py-3 sticky left-0 bg-emerald-100 z-10">
                <span className="text-sm text-emerald-800">Period Total</span>
              </td>
              {usedRoles.map(role => (
                <td key={role.id} className="px-2 py-3 text-center">
                  <span className="text-sm text-emerald-700">
                    {formatHours(periodTotals[role.id] || 0)}
                  </span>
                </td>
              ))}
              <td className="px-2 py-3 text-center bg-emerald-200/50">
                <span className="text-sm font-bold text-emerald-800">
                  {formatHours(periodTotals.total)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
