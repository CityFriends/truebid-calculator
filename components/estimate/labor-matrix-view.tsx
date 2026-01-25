"use client"

import React, { useState, useCallback, useMemo } from 'react'
import { Clock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { EnhancedWBSElement, PeriodConfig } from './types'
import { formatHours } from './utils'

interface LaborMatrixViewProps {
  wbsElements: EnhancedWBSElement[]
  periods: PeriodConfig[]
  activePeriod: string
  companyRoles: Array<{ id: string; title: string }>
  onUpdateHours: (wbsId: string, roleId: string, periodKey: string, hours: number) => void
  onViewWbs: (wbs: EnhancedWBSElement) => void
  onAddWbs: () => void
}

// Method badge colors
const getMethodColor = (method: string) => {
  switch (method) {
    case 'engineering': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'analogous': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'parametric': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'expert': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

// Confidence dots component
function ConfidenceDots({ level }: { level: 'high' | 'medium' | 'low' }) {
  const filled = level === 'high' ? 4 : level === 'medium' ? 3 : 2
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= filled
              ? level === 'high' ? 'bg-emerald-500' :
                level === 'medium' ? 'bg-amber-500' : 'bg-red-500'
              : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export function LaborMatrixView({
  wbsElements,
  periods,
  activePeriod,
  companyRoles,
  onUpdateHours,
  onViewWbs,
  onAddWbs,
}: LaborMatrixViewProps) {
  const [editingCell, setEditingCell] = useState<{ wbsId: string; roleId: string } | null>(null)
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

  const handleCellClick = (e: React.MouseEvent, wbsId: string, roleId: string, currentValue: number) => {
    e.stopPropagation()
    setEditingCell({ wbsId, roleId })
    setEditValue(String(currentValue || ''))
  }

  const handleCellBlur = () => {
    if (editingCell) {
      const numValue = parseFloat(editValue) || 0
      onUpdateHours(editingCell.wbsId, editingCell.roleId, activePeriod, numValue)
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
      <div className="flex flex-col items-center justify-center h-full py-16">
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
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          {periods.map(period => (
            <Badge
              key={period.id}
              variant={activePeriod === period.id ? 'default' : 'outline'}
              className={`cursor-pointer px-3 py-1 ${
                activePeriod === period.id
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              {period.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Matrix table */}
      <div className="flex-1 overflow-auto p-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-16 font-semibold">WBS #</TableHead>
              <TableHead className="min-w-[200px] font-semibold">Task Name</TableHead>
              <TableHead className="w-28 font-semibold">Method</TableHead>
              <TableHead className="w-24 font-semibold">Confidence</TableHead>
              {usedRoles.map(role => (
                <TableHead key={role.id} className="w-24 text-center font-semibold">
                  {role.title}
                </TableHead>
              ))}
              <TableHead className="w-24 text-center font-semibold bg-emerald-50">
                Total Hours
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wbsElements.map(wbs => {
              const wbsTotal = getWbsPeriodTotal(wbs)

              return (
                <TableRow
                  key={wbs.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onViewWbs(wbs)}
                >
                  <TableCell className="font-mono text-sm text-emerald-600 font-semibold">
                    {wbs.wbsNumber}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-gray-900">{wbs.title}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${getMethodColor(wbs.estimateMethod)}`}
                    >
                      {wbs.estimateMethod}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ConfidenceDots level={wbs.confidence} />
                  </TableCell>
                  {usedRoles.map(role => {
                    const hours = getCellHours(wbs, role.id)
                    const isEditing = editingCell?.wbsId === wbs.id && editingCell?.roleId === role.id

                    return (
                      <TableCell key={role.id} className="text-center p-1">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleCellKeyDown}
                            className="w-20 h-8 text-center text-sm font-mono mx-auto"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <button
                            onClick={(e) => handleCellClick(e, wbs.id, role.id, hours)}
                            className={`
                              w-20 h-8 rounded text-sm font-mono transition-colors mx-auto block
                              ${hours > 0
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium'
                                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                              }
                            `}
                          >
                            {hours > 0 ? formatHours(hours) : '—'}
                          </button>
                        )}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-center bg-emerald-50/50">
                    <span className="text-sm font-semibold font-mono text-emerald-700">
                      {formatHours(wbsTotal)}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}

            {/* Totals row */}
            <TableRow className="bg-emerald-100 font-semibold">
              <TableCell colSpan={4} className="text-emerald-800">
                Period Total
              </TableCell>
              {usedRoles.map(role => (
                <TableCell key={role.id} className="text-center">
                  <span className="text-sm font-mono text-emerald-700">
                    {formatHours(periodTotals[role.id] || 0)}
                  </span>
                </TableCell>
              ))}
              <TableCell className="text-center bg-emerald-200/50">
                <span className="text-sm font-bold font-mono text-emerald-800">
                  {formatHours(periodTotals.total)}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
