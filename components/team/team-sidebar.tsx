"use client"

import React from 'react'
import { Users, TrendingUp, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type TeamView = 'roles' | 'rate-justification' | 'teaming-partners'

interface TeamSidebarProps {
  activeView: TeamView
  onViewChange: (view: TeamView) => void
  rolesCount?: number
  partnersCount?: number
}

export function TeamSidebar({
  activeView,
  onViewChange,
  rolesCount = 0,
  partnersCount = 0,
}: TeamSidebarProps) {
  const navItems = [
    {
      id: 'roles' as const,
      label: 'Roles & Pricing',
      icon: Users,
      badge: rolesCount > 0 ? rolesCount : undefined,
    },
    {
      id: 'rate-justification' as const,
      label: 'Rate Justification',
      icon: TrendingUp,
    },
    {
      id: 'teaming-partners' as const,
      label: 'Teaming Partners',
      icon: Building2,
      badge: partnersCount > 0 ? partnersCount : undefined,
    },
  ]

  return (
    <aside className="w-60 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col">
      {/* Navigation Section */}
      <div className="p-4">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Team
        </h3>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4",
                  isActive ? "text-blue-600" : "text-gray-500"
                )} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-200 text-gray-600"
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
