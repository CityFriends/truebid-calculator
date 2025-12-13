'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Circle, Sun, Moon, Monitor } from 'lucide-react';

export function Footer() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="border-t bg-white dark:bg-gray-900 dark:border-gray-800 shrink-0">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between py-2 md:py-3 text-sm">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <nav className="hidden sm:flex items-center gap-3 md:gap-4 text-gray-600 dark:text-gray-400">
              <a href="#" className="hover:text-gray-900 dark:hover:text-gray-200">Home</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-gray-200">Docs</a>
              <a href="#" className="hidden md:inline hover:text-gray-900 dark:hover:text-gray-200">Knowledge Base</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-gray-200">Help</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-gray-200">Contact</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-gray-200">Legal</a>
            </nav>
          </div>

          {/* Right: Status + Theme Toggle */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden sm:flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Circle className="w-2 h-2 fill-green-500 text-green-500" />
              <span className="hidden md:inline">All systems normal.</span>
            </div>

            {/* Theme Toggle */}
            {mounted && (
              <div className="flex items-center border dark:border-gray-700 rounded-md overflow-hidden">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-1.5 ${theme === 'light' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  title="Light mode"
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-1.5 ${theme === 'dark' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  title="Dark mode"
                >
                  <Moon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`p-1.5 ${theme === 'system' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  title="System preference"
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}