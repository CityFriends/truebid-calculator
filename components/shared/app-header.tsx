'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppContext } from '@/contexts/app-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  ChevronDown,
  Settings,
  HelpCircle,
  Wrench,
  Calculator,
  DollarSign,
  Building2,
  FileText,
  ExternalLink,
} from 'lucide-react'
import { SettingsSlideout } from '@/components/settings-slideout'

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { companyProfile, setActiveUtilityTool } = useAppContext()
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  const companyName = companyProfile?.name || 'TrueBid'
  const isHome = pathname === '/'

  const handleToolSelect = (tool: string) => {
    setActiveUtilityTool(tool)
    // If on dashboard, navigate to a utility context
    if (isHome) {
      router.push('/tools')
    }
  }

  return (
    <>
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="h-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Left: Logo + Breadcrumb */}
          <div className="flex items-center gap-3">
            {/* TrueBid Logo */}
            <Link 
              href="/"
              className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
              aria-label="Go to dashboard"
            >
              <span className="text-white font-bold text-sm">T</span>
            </Link>

            {/* Separator */}
            <span className="text-gray-300 dark:text-gray-600 text-lg font-light">/</span>

            {/* Company Name */}
            <Link 
              href="/"
              className="text-sm font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {companyName}
            </Link>
          </div>

          {/* Right: Tools, Help, Settings */}
          <div className="flex items-center gap-1">
            {/* Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <Wrench className="w-4 h-4" />
                  <span className="hidden sm:inline">Tools</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-gray-500">
                  Utility Tools
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleToolSelect('sub-rates')}>
                  <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                  Sub Rates Calculator
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToolSelect('rate-builder')} disabled>
                  <Calculator className="w-4 h-4 mr-2 text-blue-600" />
                  Rate Builder
                  <span className="ml-auto text-[10px] text-gray-400">Soon</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToolSelect('wrap-rate')} disabled>
                  <Building2 className="w-4 h-4 mr-2 text-purple-600" />
                  Wrap Rate Analyzer
                  <span className="ml-auto text-[10px] text-gray-400">Soon</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-gray-500">
                  Resources
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <a href="https://sam.gov" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-gray-500" />
                    SAM.gov
                    <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://www.gsa.gov/buy-through-us/purchasing-programs/gsa-multiple-award-schedule" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-gray-500" />
                    GSA Schedules
                    <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help */}
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Help</span>
            </Button>

            {/* Settings */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Slideout */}
      <SettingsSlideout 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  )
}