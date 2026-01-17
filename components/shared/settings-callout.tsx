'use client'

import { useState } from 'react'
import { Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/contexts/app-context'

// ============================================================================
// SETTINGS CALLOUT COMPONENT
// ============================================================================
// Displays a collapsible panel showing bid settings.
// Collapsed by default, can be expanded to see full details.

interface SettingsCalloutProps {
  proposalId?: string
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  'FFP': 'Firm Fixed Price',
  'T&M': 'Time & Materials',
  'CPFF': 'Cost Plus Fixed Fee',
  'GSA': 'GSA Schedule',
}

export function SettingsCallout({ proposalId }: SettingsCalloutProps) {
  const { solicitation, openSolicitationEditor } = useAppContext()
  const [isExpanded, setIsExpanded] = useState(false) // Collapsed by default

  const handleEditSettings = () => {
    openSolicitationEditor()
  }

  // Get current settings for display
  const contractType = solicitation?.contractType || 'T&M'
  const contractTypeLabel = CONTRACT_TYPE_LABELS[contractType] || contractType
  const profitMargin = solicitation?.pricingSettings?.profitMargin ?? 8
  const billableHours = solicitation?.pricingSettings?.billableHours ?? 1920
  const escalationEnabled = solicitation?.pricingSettings?.escalationEnabled ?? true
  const laborEscalation = solicitation?.pricingSettings?.laborEscalation ?? 3

  return (
    <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg">
      {/* Collapsed header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Bid Settings</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{contractTypeLabel}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{profitMargin}% profit</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="flex items-center justify-between pt-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
              <div>
                <span className="text-gray-400">Contract:</span>{' '}
                <span className="font-medium">{contractTypeLabel}</span>
              </div>
              <div>
                <span className="text-gray-400">Profit:</span>{' '}
                <span className="font-medium">{profitMargin}%</span>
              </div>
              <div>
                <span className="text-gray-400">Billable:</span>{' '}
                <span className="font-medium">{billableHours.toLocaleString()} hrs/year</span>
              </div>
              {escalationEnabled && (
                <div>
                  <span className="text-gray-400">Escalation:</span>{' '}
                  <span className="font-medium">+{laborEscalation}%/year</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditSettings}
              className="h-7 text-xs"
            >
              Edit
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsCallout