'use client'

import { use } from 'react'
import { TabsNavigation } from '@/components/shared/tabs-navigation'
import { useProposalSync } from '@/hooks/use-proposal-sync'

export default function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  // Sync AppContext with localStorage for this proposal
  useProposalSync(id)

  return <TabsNavigation />
}