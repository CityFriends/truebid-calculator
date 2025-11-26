'use client'

import { useState } from 'react'
import { Upload, Target, Users, TrendingUp, Building2, FileDown, Calculator, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadTab } from '@/components/tabs/upload-tab'
import { ScopingTab } from '@/components/tabs/scoping-tab'
import { RolesAndPricingTab } from '@/components/tabs/roles-and-pricing-tab'
import { RateJustificationTab } from '@/components/tabs/rate-justification-tab'
import { SubcontractorsTab } from '@/components/tabs/subcontractors-tab'
import { SubRatesTab } from '@/components/tabs/sub-rates-tab'
import GSABidTab from '@/components/tabs/gsa-bid-tab'

type TabType = 'upload' | 'scoping' | 'roles' | 'rate-justification' | 'subcontractors' | 'export' | 'gsa-bid' | 'sub-rates'

export function TabsNavigation() {
  const [activeTab, setActiveTab] = useState<TabType>('roles')

  // Main bid flow tabs
  const bidFlowTabs = [
    { id: 'upload' as TabType, label: 'Upload', icon: Upload },
    { id: 'scoping' as TabType, label: 'Scoping', icon: Target },
    { id: 'roles' as TabType, label: 'Roles & Pricing', icon: Users },
    { id: 'rate-justification' as TabType, label: 'Rate Justification', icon: TrendingUp },
    { id: 'subcontractors' as TabType, label: 'Subcontractors', icon: Building2 },
    { id: 'export' as TabType, label: 'Export', icon: FileDown },
  ]

  // Utility tools (standalone features)
  const utilityTabs = [
    { id: 'gsa-bid' as TabType, label: 'GSA Bid', icon: FileSpreadsheet },
    { id: 'sub-rates' as TabType, label: 'Sub Rates', icon: Calculator },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {/* Main Bid Flow Tabs */}
            {bidFlowTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                    ${isActive 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300 mx-3" />

            {/* Utility Tools */}
            {utilityTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 my-1 text-sm font-medium whitespace-nowrap rounded-md transition-colors
                    ${isActive 
                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Main Bid Flow */}
        {activeTab === 'upload' && <UploadTab onContinue={() => setActiveTab('scoping')} />}
        {activeTab === 'scoping' && <ScopingTab onContinue={() => setActiveTab('roles')} />}
        {activeTab === 'roles' && <RolesAndPricingTab onContinue={() => setActiveTab('rate-justification')} />}
        {activeTab === 'rate-justification' && <RateJustificationTab onContinue={() => setActiveTab('subcontractors')} />}
        {activeTab === 'subcontractors' && <SubcontractorsTab onContinue={() => setActiveTab('export')} />}
        {activeTab === 'export' && <PlaceholderTab name="Export" />}
        
        {/* Utility Tools */}
       {activeTab === 'gsa-bid' && <GSABidTab />}
        {activeTab === 'sub-rates' && <SubRatesTab />}
      </div>
    </div>
  )
}

// Placeholder component for tabs we haven't built yet
function PlaceholderTab({ name, onContinue, isUtility }: { name: string; onContinue?: () => void; isUtility?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-gray-900">{name}</h2>
            {isUtility && (
              <span className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded">
                Utility Tool
              </span>
            )}
          </div>
          <p className="text-gray-600">This tab is coming soon</p>
        </div>
        {onContinue && (
          <Button onClick={onContinue}>
            Continue →
          </Button>
        )}
      </div>
      
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <p className="text-gray-500 mb-4">
          The {name} {isUtility ? 'utility' : 'tab'} will be built in the next phase
        </p>
        {!isUtility && onContinue && (
          <p className="text-sm text-gray-400">
            For now, click Continue to move to the next tab
          </p>
        )}
      </div>
    </div>
  )
}