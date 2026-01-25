"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, Layers, Clock, DollarSign, Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PeriodConfig } from './types'

interface StatsBarProps {
  totalRequirements: number
  selectedRequirements: number
  wbsCount: number
  totalHours: number
  estimatedCost: number
  periods: PeriodConfig[]
  activePeriod: string
  onPeriodChange: (period: string) => void
}

export function StatsBar({
  totalRequirements,
  selectedRequirements,
  wbsCount,
  totalHours,
  estimatedCost,
  periods,
  activePeriod,
  onPeriodChange,
}: StatsBarProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatHours = (value: number) => {
    return value.toLocaleString()
  }

  return (
    <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 border-b border-gray-200">
      {/* Requirements */}
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Requirements</p>
              <p className="text-xl font-semibold text-gray-900 font-mono">
                {selectedRequirements}<span className="text-gray-400">/{totalRequirements}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WBS Elements */}
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">WBS Elements</p>
              <p className="text-xl font-semibold text-gray-900 font-mono">{wbsCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Hours */}
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Hours</p>
              <p className="text-xl font-semibold text-gray-900 font-mono">{formatHours(totalHours)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estimated Cost - Highlighted */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-emerald-700 uppercase tracking-wider font-medium">Estimated Cost</p>
              <p className="text-xl font-semibold text-emerald-700 font-mono">{formatCurrency(estimatedCost)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Selector */}
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Period</p>
              <Select value={activePeriod} onValueChange={onPeriodChange}>
                <SelectTrigger className="h-8 text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(period => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
