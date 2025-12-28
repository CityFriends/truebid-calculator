'use client'

import { useEffect } from 'react'
import { SubRatesTab } from '@/components/tabs/sub-rates-tab'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Wrench, DollarSign, Calculator, Building2 } from 'lucide-react'
import Link from 'next/link'
import { useAppContext, UtilityToolType } from '@/contexts/app-context'

export default function ToolsPage() {
  const { activeUtilityTool, setActiveUtilityTool } = useAppContext()

  // Default to sub-rates if no tool selected
  useEffect(() => {
    if (!activeUtilityTool) {
      setActiveUtilityTool('sub-rates')
    }
  }, [activeUtilityTool, setActiveUtilityTool])

  const tools = [
    { id: 'sub-rates', label: 'Sub Rates Calculator', icon: DollarSign, available: true },
    { id: 'rate-builder', label: 'Rate Builder', icon: Calculator, available: false },
    { id: 'wrap-rate', label: 'Wrap Rate Analyzer', icon: Building2, available: false },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Tools Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-gray-500" />
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Utility Tools</h1>
              </div>
            </div>
          </div>

          {/* Tool Tabs */}
          <div className="flex gap-1 mt-4 -mb-px">
            {tools.map((tool) => {
              const Icon = tool.icon
              const isActive = activeUtilityTool === tool.id
              return (
                <button
                  key={tool.id}
                  onClick={() => tool.available && setActiveUtilityTool(tool.id as UtilityToolType)}
                  disabled={!tool.available}
                  className={`
                    flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg
                    border border-b-0 transition-colors
                    ${isActive
                      ? 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white'
                      : tool.available
                        ? 'bg-transparent border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        : 'bg-transparent border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tool.label}
                  {!tool.available && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-400">
                      Soon
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tool Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeUtilityTool === 'sub-rates' && <SubRatesTab />}
        {activeUtilityTool === 'rate-builder' && (
          <div className="text-center py-16 text-gray-500">
            Rate Builder coming soon
          </div>
        )}
        {activeUtilityTool === 'wrap-rate' && (
          <div className="text-center py-16 text-gray-500">
            Wrap Rate Analyzer coming soon
          </div>
        )}
      </main>
    </div>
  )
}