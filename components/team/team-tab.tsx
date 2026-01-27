"use client"

import React, { useState } from 'react'
import { useAppContext } from '@/contexts/app-context'
import { TeamSidebar } from './team-sidebar'
import { RolesAndPricingTab } from '@/components/tabs/roles-and-pricing-tab'
import { RateJustificationTab } from '@/components/tabs/rate-justification-tab'
import { TeamingPartnersTab } from '@/components/tabs/teaming-partners-tab'

type TeamView = 'roles' | 'rate-justification' | 'teaming-partners'

export function TeamTab() {
  const { companyRoles, teamingPartners } = useAppContext()
  const [activeView, setActiveView] = useState<TeamView>('roles')

  return (
    <div className="absolute inset-0 flex bg-white overflow-hidden">
      {/* Sidebar */}
      <TeamSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        rolesCount={companyRoles?.length || 0}
        partnersCount={teamingPartners?.length || 0}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'roles' && (
          <div className="p-6">
            <RolesAndPricingTab />
          </div>
        )}

        {activeView === 'rate-justification' && (
          <div className="p-6">
            <RateJustificationTab />
          </div>
        )}

        {activeView === 'teaming-partners' && (
          <div className="p-6">
            <TeamingPartnersTab />
          </div>
        )}
      </div>
    </div>
  )
}
