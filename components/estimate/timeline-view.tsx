"use client"

import React, { useMemo } from 'react'
import { Calendar, Users, TrendingUp } from 'lucide-react'
import type { EnhancedWBSElement, PeriodConfig } from './types'
import { formatHours, formatFTE } from './utils'

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
  // Calculate hours and FTE by period and role
  const periodData = useMemo(() => {
    return periods.map(period => {
      const roleData: Record<string, { hours: number; fte: number }> = {}
      let totalHours = 0

      // Initialize all roles
      companyRoles.forEach(role => {
        roleData[role.id] = { hours: 0, fte: 0 }
      })

      // Sum hours from all WBS elements
      wbsElements.forEach(wbs => {
        wbs.laborEstimates.forEach(le => {
          const hours = le.hoursByPeriod[period.id as keyof typeof le.hoursByPeriod] || 0
          if (roleData[le.roleId]) {
            roleData[le.roleId].hours += hours
          }
          totalHours += hours
        })
      })

      // Calculate FTE for each role (hours / (months * hours per month))
      const totalMonthlyHours = period.monthsCount * billableHoursPerMonth
      Object.keys(roleData).forEach(roleId => {
        roleData[roleId].fte = roleData[roleId].hours / totalMonthlyHours
      })

      const totalFte = totalHours / totalMonthlyHours

      return {
        period,
        roleData,
        totalHours,
        totalFte,
      }
    })
  }, [wbsElements, periods, companyRoles, billableHoursPerMonth])

  // Get max FTE for scale
  const maxFte = useMemo(() => {
    let max = 0
    periodData.forEach(p => {
      if (p.totalFte > max) max = p.totalFte
    })
    return Math.max(max, 1) // At least 1 for scale
  }, [periodData])

  // Get roles that have hours in any period
  const activeRoles = useMemo(() => {
    const roleSet = new Set<string>()
    periodData.forEach(p => {
      Object.entries(p.roleData).forEach(([roleId, data]) => {
        if (data.hours > 0) roleSet.add(roleId)
      })
    })
    return companyRoles.filter(r => roleSet.has(r.id))
  }, [periodData, companyRoles])

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
  if (wbsElements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Calendar className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No staffing data yet</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Generate WBS elements and add labor estimates to see the staffing timeline.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Summary cards */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="w-4 h-4" />
            Total Roles
          </div>
          <div className="text-2xl font-bold text-gray-900">{activeRoles.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Peak FTE
          </div>
          <div className="text-2xl font-bold text-emerald-600">{formatFTE(maxFte * billableHoursPerMonth * 12, billableHoursPerMonth * 12)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar className="w-4 h-4" />
            Total Hours
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatHours(periodData.reduce((sum, p) => sum + p.totalHours, 0))}
          </div>
        </div>
      </div>

      {/* Timeline chart */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">FTE Distribution by Period</h3>

        {/* Chart area */}
        <div className="flex gap-4 items-end h-64">
          {periodData.map((pd, periodIndex) => (
            <div key={pd.period.id} className="flex-1 flex flex-col">
              {/* Stacked bar */}
              <div className="flex-1 flex flex-col justify-end">
                <div
                  className="w-full rounded-t-md overflow-hidden flex flex-col-reverse"
                  style={{ height: `${Math.min((pd.totalFte / maxFte) * 100, 100)}%`, minHeight: pd.totalFte > 0 ? '4px' : '0' }}
                >
                  {activeRoles.map((role, roleIndex) => {
                    const roleHours = pd.roleData[role.id]?.hours || 0
                    const percentage = pd.totalHours > 0 ? (roleHours / pd.totalHours) * 100 : 0
                    return (
                      <div
                        key={role.id}
                        className={`${getRoleColor(roleIndex)} transition-all`}
                        style={{ height: `${percentage}%` }}
                        title={`${role.title}: ${formatHours(roleHours)}h (${formatFTE(roleHours, pd.period.monthsCount * billableHoursPerMonth)} FTE)`}
                      />
                    )
                  })}
                </div>
              </div>

              {/* FTE label */}
              <div className="text-center mt-2">
                <div className="text-sm font-semibold text-gray-900">
                  {formatFTE(pd.totalHours, pd.period.monthsCount * billableHoursPerMonth)}
                </div>
                <div className="text-xs text-gray-500">FTE</div>
              </div>

              {/* Period label */}
              <div className="text-center mt-1 pt-2 border-t border-gray-200">
                <div className="text-xs font-medium text-gray-700">{pd.period.shortLabel}</div>
                <div className="text-[10px] text-gray-400">{formatHours(pd.totalHours)}h</div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4">
            {activeRoles.map((role, index) => (
              <div key={role.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${getRoleColor(index)}`} />
                <span className="text-xs text-gray-600">{role.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed table */}
      <div className="flex-shrink-0 mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase px-4 py-3">
                Role
              </th>
              {periods.map(period => (
                <th key={period.id} className="text-center text-xs font-semibold text-gray-600 uppercase px-3 py-3">
                  {period.shortLabel}
                </th>
              ))}
              <th className="text-center text-xs font-semibold text-gray-600 uppercase px-3 py-3 bg-emerald-50">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeRoles.map((role, index) => {
              const roleTotal = periodData.reduce((sum, pd) => sum + (pd.roleData[role.id]?.hours || 0), 0)
              return (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded ${getRoleColor(index)}`} />
                      <span className="text-sm text-gray-900">{role.title}</span>
                    </div>
                  </td>
                  {periodData.map(pd => (
                    <td key={pd.period.id} className="text-center px-3 py-3">
                      <div className="text-sm text-gray-700">
                        {formatHours(pd.roleData[role.id]?.hours || 0)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatFTE(pd.roleData[role.id]?.hours || 0, pd.period.monthsCount * billableHoursPerMonth)} FTE
                      </div>
                    </td>
                  ))}
                  <td className="text-center px-3 py-3 bg-emerald-50/50">
                    <div className="text-sm font-medium text-emerald-700">
                      {formatHours(roleTotal)}
                    </div>
                  </td>
                </tr>
              )
            })}
            {/* Totals row */}
            <tr className="bg-emerald-100 font-semibold">
              <td className="px-4 py-3">
                <span className="text-sm text-emerald-800">Total</span>
              </td>
              {periodData.map(pd => (
                <td key={pd.period.id} className="text-center px-3 py-3">
                  <div className="text-sm text-emerald-700">{formatHours(pd.totalHours)}</div>
                  <div className="text-xs text-emerald-600">
                    {formatFTE(pd.totalHours, pd.period.monthsCount * billableHoursPerMonth)} FTE
                  </div>
                </td>
              ))}
              <td className="text-center px-3 py-3 bg-emerald-200/50">
                <div className="text-sm font-bold text-emerald-800">
                  {formatHours(periodData.reduce((sum, p) => sum + p.totalHours, 0))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
