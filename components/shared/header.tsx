'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Wrench, ChevronDown, Calculator, Settings } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { SettingsSlideout } from '@/components/settings-slideout';

export function Header() {
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  
  const { 
    activeUtilityTool, 
    setActiveUtilityTool,
  } = useAppContext();

  // Utility tools configuration
  const utilityTools = [
    { 
      id: 'sub-rates' as const, 
      label: 'Sub Rates Calculator', 
      icon: Calculator,
      description: 'Evaluate rates when you are a subcontractor to another prime'
    },
  ];

  // Check if a utility tool is active
  const isUtilityToolActive = activeUtilityTool !== null;

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };

    if (isToolsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isToolsMenuOpen]);

  // Handle tool selection
  const handleUtilityToolSelect = (toolId: 'sub-rates') => {
    setActiveUtilityTool(toolId);
    setIsToolsMenuOpen(false);
  };

  return (
    <>
      <header className="border-b bg-white dark:bg-gray-900 dark:border-gray-800 sticky top-0 z-50 shrink-0">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-2 md:py-3">
            {/* Left: Logo */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg md:text-xl">T</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">TrueBid</h1>
                <p className="text-xs text-muted-foreground">v2.0 - Phase 10</p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Tools Dropdown Menu */}
              <div className="relative" ref={toolsMenuRef}>
                <button
                  onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                  aria-expanded={isToolsMenuOpen}
                  aria-haspopup="true"
                  aria-label="Tools menu"
                  className={`
                    flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-sm font-medium whitespace-nowrap 
                    rounded-md transition-colors focus:outline-none focus-visible:ring-2 
                    focus-visible:ring-amber-500 focus-visible:ring-offset-2
                    ${isUtilityToolActive || isToolsMenuOpen
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                    }
                  `}
                >
                  <Wrench className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Tools</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {/* Dropdown Menu */}
                {isToolsMenuOpen && (
                  <div 
                    className="absolute right-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="tools-menu-button"
                  >
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Utility Tools</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Standalone tools, not part of bid flow</p>
                    </div>
                    
                    {utilityTools.map((tool) => {
                      const Icon = tool.icon;
                      const isActive = activeUtilityTool === tool.id;
                      
                      return (
                        <button
                          key={tool.id}
                          role="menuitem"
                          onClick={() => handleUtilityToolSelect(tool.id)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                            ${isActive 
                              ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`} aria-hidden="true" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{tool.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tool.description}</p>
                          </div>
                          {isActive && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                              Active
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <Button variant="ghost" size="sm" className="px-2 md:px-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <HelpCircle className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Help</span>
              </Button>
              
              {/* Settings Button - Opens Settings Slideout */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsSettingsOpen(true)} 
                className="px-2 md:px-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Settings className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Slideout */}
      <SettingsSlideout 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
}