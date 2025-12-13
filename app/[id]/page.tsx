// app/[id]/page.tsx
import { TabsNavigation } from '@/components/shared/tabs-navigation'

export default function ProposalPage({ params }: { params: { id: string } }) {
  return <TabsNavigation />
}