"use client"

import React, { useMemo, useState } from 'react'
import { Calendar, TrendingUp, Clock, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { EnhancedWBSElement, PeriodConfig } from './types'
import { formatHours } from './utils'

interface TimelineViewProps {
  wbsElements: EnhancedWBSElement[]
  periods: PeriodConfig[]
  companyRoles: Array<{ id: string; title: string }>
  billableHoursPerMonth: number
}

export function TimelineView({
  wbsElements,
  periods,
  companyRoles,
  billableHoursPerMonth = 160,
}: TimelineViewProps) {
  const [activePeriodId, setActivePeriodId] = useState(periods[0]?.id || 'base')

  const activePeriod = periods.find(p => p.id === activePeriodId) || periods[0]
  const monthCount = activePeriod?.monthsCount || 12

  // Calculate FTE data by role for active period
  const roleData = useMemo(() => {
    const data: Record<string, { hours: number; fte: number; monthlyFte: number[] }> = {}

    // Initialize all roles
    companyRoles.forEach(role => {
      data[role.id] = {
        hours: 0,
        fte: 0,
        monthlyFte: Array(monthCount).fill(0)
      }
    })

    // Sum hours from all WBS elements for active period
    wbsElements.forEach(wbs => {
      wbs.laborEstimates.forEach(le => {
        const hours = le.hoursByPeriod[activePeriodId as keyof typeof le.hoursByPeriod] || 0
        if (data[le.roleId]) {
          data[le.roleId].hours += hours
          // Distribute hours evenly across months (simplified)
          const monthlyHours = hours / monthCount
          const monthlyFte = monthlyHours / billableHoursPerMonth
          for (let i = 0; i < monthCount; i++) {
            data[le.roleId].monthlyFte[i] += monthlyFte
          }
        }
      })
    })

    // Calculate total FTE
    Object.keys(data).forEach(roleId => {
      data[roleId].fte = data[roleId].hours / (monthCount * billableHoursPerMonth)
    })

    return data
  }, [wbsElements, companyRoles, activePeriodId, monthCount, billableHoursPerMonth])

  // Get roles that have hours
  const activeRoles = companyRoles.filter(r => roleData[r.id]?.hours > 0)

  // Calculate summary stats
  const stats = useMemo(() => {
    let peakFte = 0
    let totalFte = 0
    let totalHours = 0

    activeRoles.forEach(role => {
      const rd = roleData[role.id]
      totalHours += rd.hours
      totalFte += rd.fte
      const maxMonthlyFte = Math.max(...rd.monthlyFte)
      if (maxMonthlyFte > peakFte) peakFte = maxMonthlyFte
    })

    // Peak FTE is sum of all roles at their peak
    peakFte = 0
    for (let i = 0; i < monthCount; i++) {
      let monthTotal = 0
      activeRoles.forEach(role => {
        monthTotal += roleData[role.id].monthlyFte[i]
      })
      if (monthTotal > peakFte) peakFte = monthTotal
    }

    const avgFte = totalFte

    return { peakFte, avgFte, totalHours }
  }, [activeRoles, roleData, monthCount])

  // Max FTE for scale
  const maxFte = Math.max(stats.peakFte, 1)

  // Color palette for roles
  const roleColors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-orange-500',
    'bg-indigo-500',
  ]
  const getRoleColor = (index: number) => roleColors[index % roleColors.length]

  // Empty state
  if (wbsElements.length === 0 || activeRoles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <Calendar className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No staffing data yet</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Generate WBS elements and add labor estimates to see the staffing timeline.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-4 bg-gray-50">
      {/* Period Tabs */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex gap-2">
          {periods.map(period => (
            <Badge
              key={period.id}
              variant={activePeriodId === period.id ? 'default' : 'outline'}
              className={`cursor-pointer px-4 py-2 text-sm ${
                activePeriodId === period.id
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-white hover:bg-gray-100'
              }`}
              onClick={() => setActivePeriodId(period.id)}
            >
              {period.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Peak FTEs</p>
                <p className="text-2xl font-bold font-mono text-gray-900">{stats.peakFte.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Average FTEs</p>
                <p className="text-2xl font-bold font-mono text-gray-900">{stats.avgFte.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Hours</p>
                <p className="text-2xl font-bold font-mono text-gray-900">{formatHours(stats.totalHours)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-4 h-full flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            FTE by Month — {activePeriod.label}
          </h3>

          {/* Chart */}
          <div className="flex-1 overflow-auto">
            {/* Month Headers */}
            <div className="flex mb-2 pl-32">
              {Array.from({ length: monthCount }, (_, i) => (
                <div key={i} className="flex-1 text-center text-xs font-medium text-gray-500 min-w-[40px]">
                  M{i + 1}
                </div>
              ))}
              <div className="w-20 text-center text-xs font-medium text-gray-500">Total</div>
            </div>

            {/* Role Rows */}
            <div className="space-y-3">
              {activeRoles.map((role, index) => {
                const rd = roleData[role.id]
                return (
                  <div key={role.id} className="flex items-center gap-2">
                    {/* Role Label */}
                    <div className="w-32 flex-shrink-0 flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${getRoleColor(index)}`} />
                      <span className="text-sm text-gray-700 truncate">{role.title}</span>
                    </div>

                    {/* Monthly Bars */}
                    <div className="flex flex-1 gap-1">
                      {rd.monthlyFte.map((fte, monthIdx) => {
                        const barHeight = Math.max((fte / maxFte) * 100, fte > 0 ? 10 : 0)
                        return (
                          <div
                            key={monthIdx}
                            className="flex-1 min-w-[40px] flex items-end justify-center h-12"
                          >
                            <div
                              className={`w-full max-w-[32px] ${getRoleColor(index)} rounded-t transition-all`}
                              style={{ height: `${barHeight}%` }}
                              title={`M${monthIdx + 1}: ${fte.toFixed(2)} FTE`}
                            />
                          </div>
                        )
                      })}
                    </div>

                    {/* Total */}
                    <div className="w-20 text-center">
                      <span className="text-sm font-mono font-medium text-gray-900">
                        {rd.fte.toFixed(1)} FTE
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total Row */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <div className="w-32 flex-shrink-0">
                <span className="text-sm font-semibold text-gray-900">Total</span>
              </div>
              <div className="flex flex-1 gap-1">
                {Array.from({ length: monthCount }, (_, monthIdx) => {
                  let monthTotal = 0
                  activeRoles.forEach(role => {
                    monthTotal += roleData[role.id].monthlyFte[monthIdx]
                  })
                  const barHeight = Math.max((monthTotal / maxFte) * 100, monthTotal > 0 ? 10 : 0)
                  return (
                    <div
                      key={monthIdx}
                      className="flex-1 min-w-[40px] flex items-end justify-center h-12"
                    >
                      <div
                        className="w-full max-w-[32px] bg-emerald-600 rounded-t transition-all"
                        style={{ height: `${barHeight}%` }}
                        title={`M${monthIdx + 1}: ${monthTotal.toFixed(2)} FTE`}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="w-20 text-center">
                <span className="text-sm font-mono font-bold text-emerald-700">
                  {stats.avgFte.toFixed(1)} FTE
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-shrink-0 pt-4 mt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4">
              {activeRoles.map((role, index) => (
                <div key={role.id} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${getRoleColor(index)}`} />
                  <span className="text-xs text-gray-600">{role.title}</span>
                  <span className="text-xs font-mono text-gray-400">
                    ({formatHours(roleData[role.id].hours)}h)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
