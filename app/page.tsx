'use client'

import { AppProvider } from '@/contexts/app-context'
import { TabsNavigation } from '@/components/tabs-navigation'
import { UploadTab } from '@/components/tabs/upload-tab'
import { RolesAndPricingTab } from '@/components/tabs/roles-and-pricing-tab'
import { ScopingTab } from '@/components/tabs/scoping-tab'
import { useApp } from '@/contexts/app-context'
import { Footer } from '@/components/footer'

function AppContent() {
  const { activeTab } = useApp()

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            
            {/* Brand */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">TrueBid</h1>
              <p className="text-sm text-gray-600">The foundation of good work</p>
            </div>
          </div>

          {/* Version */}
          <div className="text-sm text-gray-500">
            v2.0 - Phase 7
          </div>
        </div>

        {/* Tabs */}
        <TabsNavigation />
      </header>

      {/* Main Content */}
      <main className="p-6 flex-1">
        {activeTab === 'upload' && <UploadTab />}
        {activeTab === 'roles-pricing' && <RolesAndPricingTab />}
        {activeTab === 'scoping' && <ScopingTab />}
        {activeTab === 'subcontractors' && (
          <div className="text-center py-20 text-gray-500">
            Subcontractors tab coming soon...
          </div>
        )}
        {activeTab === 'prime-check' && (
          <div className="text-center py-20 text-gray-500">
            Prime Check tab coming soon...
          </div>
        )}
        {activeTab === 'gsa' && (
          <div className="text-center py-20 text-gray-500">
            GSA Schedule tab coming soon...
          </div>
        )}
        {activeTab === 'export' && (
          <div className="text-center py-20 text-gray-500">
            Export tab coming soon...
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}