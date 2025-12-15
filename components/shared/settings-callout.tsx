'use client'

import { useState, useEffect } from 'react'
import { Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/contexts/app-context'

// ============================================================================
// SETTINGS CALLOUT COMPONENT
// ============================================================================
// Displays a dismissable callout prompting users to review bid settings
// before estimating. Shows once per proposal, dismissal persisted to localStorage.

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
  const [isDismissed, setIsDismissed] = useState(true) // Start hidden, show after check
  
  // Check localStorage on mount
  useEffect(() => {
    if (!proposalId) {
      setIsDismissed(false)
      return
    }
    
    const dismissedKey = `truebid-settings-callout-dismissed-${proposalId}`
    const wasDismissed = localStorage.getItem(dismissedKey) === 'true'
    setIsDismissed(wasDismissed)
  }, [proposalId])
  
  const handleDismiss = () => {
    setIsDismissed(true)
    if (proposalId) {
      localStorage.setItem(`truebid-settings-callout-dismissed-${proposalId}`, 'true')
    }
  }
  
  const handleEditSettings = () => {
    openSolicitationEditor()
    handleDismiss() // Dismiss after they click edit
  }
  
  // Don't render if dismissed
  if (isDismissed) return null
  
  // Get current settings for display
  const contractType = solicitation?.contractType || 'T&M'
  const contractTypeLabel = CONTRACT_TYPE_LABELS[contractType] || contractType
  const profitMargin = solicitation?.pricingSettings?.profitMargin ?? 8
  const billableHours = solicitation?.pricingSettings?.billableHours ?? 1920
  const escalationEnabled = solicitation?.pricingSettings?.escalationEnabled ?? true
  const laborEscalation = solicitation?.pricingSettings?.laborEscalation ?? 3
  
  return (
    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Settings className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 mb-1">
              Review your bid settings before estimating
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-blue-700">
              <span className="font-medium">{contractTypeLabel}</span>
              <span className="text-blue-300">•</span>
              <span>{profitMargin}% profit</span>
              <span className="text-blue-300">•</span>
              <span>{billableHours.toLocaleString()} hrs/year</span>
              {escalationEnabled && (
                <>
                  <span className="text-blue-300">•</span>
                  <span>+{laborEscalation}% annually</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEditSettings}
            className="h-8 text-xs bg-white border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          >
            Edit Settings
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsCallout