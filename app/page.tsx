'use client'

import { useState } from 'react'
import { ScopingTab } from '@/components/tabs/scoping-tab'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Target, DollarSign, Users, FileCheck, ArrowRight } from 'lucide-react'

type TabType = 'upload' | 'scoping' | 'roles' | 'subcontractors' | 'prime' | 'gsa' | 'export'

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabType>('upload')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">TrueBid</h1>
                <p className="text-xs text-gray-500">The foundation of good work</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              v2.0 - Phase 7
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1800px] mx-auto px-6">
          <nav className="flex gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('upload')}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>

            <button
              onClick={() => setActiveTab('scoping')}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'scoping'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              <Target className="w-4 h-4" />
              Scoping
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'roles'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              <Users className="w-4 h-4" />
              Roles & Pricing
            </button>

            <button
              onClick={() => setActiveTab('subcontractors')}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'subcontractors'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              <Users className="w-4 h-4" />
              Subcontractors
            </button>

            <button
              onClick={() => setActiveTab('prime')}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'prime'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              <FileCheck className="w-4 h-4" />
              Prime Check
            </button>

            <button
              onClick={() => setActiveTab('gsa')}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'gsa'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              <DollarSign className="w-4 h-4" />
              GSA Schedule
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'export'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              <FileText className="w-4 h-4" />
              Export
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-[1800px] mx-auto p-6 w-full">
        {activeTab === 'upload' && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload RFP</h3>
            <p className="text-sm text-gray-600 mb-6">Coming soon: Upload and analyze RFP documents</p>
            <Button onClick={() => setActiveTab('scoping')}>
              Continue to Scoping
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {activeTab === 'scoping' && (
          <div className="space-y-4">
            <ScopingTab />
            <div className="flex justify-end">
              <Button onClick={() => setActiveTab('roles')} size="lg">
                Continue to Roles & Pricing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Roles & Pricing</h3>
            <p className="text-sm text-gray-600">Coming soon: Team composition and rate calculations</p>
          </div>
        )}

        {activeTab === 'subcontractors' && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Subcontractors</h3>
            <p className="text-sm text-gray-600">Coming soon: Subcontractor management and pricing</p>
          </div>
        )}

        {activeTab === 'prime' && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Prime Check</h3>
            <p className="text-sm text-gray-600">Coming soon: Validate against prime contractor offers</p>
          </div>
        )}

        {activeTab === 'gsa' && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">GSA Schedule</h3>
            <p className="text-sm text-gray-600">Coming soon: GSA Schedule integration and comparison</p>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Export</h3>
            <p className="text-sm text-gray-600">Coming soon: Export proposal documents</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              © 2024 TrueBid Calculator. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-gray-900 transition-colors">Documentation</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Support</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}