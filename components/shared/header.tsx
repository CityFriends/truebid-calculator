'use client';

import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between py-3">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">TrueBid</h1>
              <p className="text-xs text-muted-foreground">v2.0 - Phase 9</p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help
            </Button>
            <Button variant="ghost" size="sm">
              Settings
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}