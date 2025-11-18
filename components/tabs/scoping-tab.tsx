'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, AlertTriangle, Wrench, FileText } from 'lucide-react'

export function ScopingTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Scoping</h2>
        <p className="text-gray-600">
          Intelligence Layer - Capture the complete context behind bidding decisions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Epic Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Epic Breakdown</CardTitle>
                <CardDescription>Break RFP into executable epics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Phase 8 - Coming soon. AI-suggested epic structure, story point allocation, and role mapping.
            </p>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>Identify and quantify delivery risks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Phase 8 - Coming soon. Risk probability matrix, impact assessment, and mitigation strategies.
            </p>
          </CardContent>
        </Card>

        {/* Technical Assessment */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Technical Assessment</CardTitle>
                <CardDescription>Document technical approach</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Phase 8 - Coming soon. Technology stack, architecture decisions, and compliance requirements.
            </p>
          </CardContent>
        </Card>

        {/* BD Assumptions & Delivery Handoff */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle>BD Assumptions & Delivery Handoff</CardTitle>
                <CardDescription>The critical bridge</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Phase 8 - Coming soon. Capture BD assumptions, constraints, and key decisions for delivery validation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}