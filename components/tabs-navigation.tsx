'use client'

import { useApp, TabType } from '@/contexts/app-context'
import { 
  Upload, 
  Users, 
  Target, 
  Link2, 
  CheckCircle2, 
  Calendar, 
  FileText 
} from 'lucide-react'

interface Tab {
  id: TabType
  label: string
  icon: React.ReactNode
}

const tabs: Tab[] = [
  { id: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
  { id: 'roles-pricing', label: 'Roles & Pricing', icon: <Users className="w-4 h-4" /> },
  { id: 'scoping', label: 'Scoping', icon: <Target className="w-4 h-4" /> },
  { id: 'subcontractors', label: 'Subcontractors', icon: <Link2 className="w-4 h-4" /> },
  { id: 'prime-check', label: 'Prime Check', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'gsa', label: 'GSA Schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 'export', label: 'Export', icon: <FileText className="w-4 h-4" /> },
]

export function TabsNavigation() {
  const { activeTab, setActiveTab } = useApp()

  return (
    <div className="border-b">
      <div className="flex space-x-1 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
              border-b-2 -mb-px
              ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}