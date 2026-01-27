"use client"

import React from 'react'
import { ClipboardList, Grid3X3, Calendar, FileText, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

type EstimateView = 'requirements' | 'labor-matrix' | 'timeline'

interface SourceDocument {
  id: string
  filename: string
  fileType: string
}

interface EstimateSidebarProps {
  activeView: EstimateView
  onViewChange: (view: EstimateView) => void
  requirementsCount: number
  wbsCount: number
  sourceDocuments?: SourceDocument[]
  onUploadDocument?: () => void
}

export function EstimateSidebar({
  activeView,
  onViewChange,
  requirementsCount,
  wbsCount,
  sourceDocuments = [],
  onUploadDocument,
}: EstimateSidebarProps) {
  const navItems = [
    {
      id: 'requirements' as const,
      label: 'Requirements',
      icon: ClipboardList,
      badge: requirementsCount > 0 ? requirementsCount : undefined,
    },
    {
      id: 'labor-matrix' as const,
      label: 'Labor Matrix',
      icon: Grid3X3,
      badge: wbsCount > 0 ? wbsCount : undefined,
    },
    {
      id: 'timeline' as const,
      label: 'Timeline',
      icon: Calendar,
    },
  ]

  return (
    <aside className="w-60 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col">
      {/* Navigation Section */}
      <div className="p-4">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Estimate
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
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4",
                  isActive ? "text-emerald-600" : "text-gray-500"
                )} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    isActive
                      ? "bg-emerald-100 text-emerald-700"
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

      {/* Divider */}
      <div className="mx-4 border-t border-gray-200" />

      {/* Source Documents Section */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Source Documents
        </h3>

        {sourceDocuments.length > 0 ? (
          <div className="space-y-2">
            {sourceDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="flex-1 truncate">{doc.filename}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 px-3 py-2">No documents uploaded</p>
        )}

        {/* Upload Button */}
        {onUploadDocument && (
          <button
            onClick={onUploadDocument}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        )}
      </div>
    </aside>
  )
}
