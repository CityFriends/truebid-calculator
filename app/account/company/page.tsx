'use client'

import React, { useState, useEffect } from 'react'
import { Building2, Camera, Check, X, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { toast } from 'sonner'

interface CompanySettings {
  name: string
  logoUrl: string | null
  size: string
  // Proposal defaults
  defaultBillableHours: number
  defaultContractType: 'ffp' | 'tm' | 'cpff' | 'idiq'
  fiscalYearStart: number // 1-12
  defaultOverheadRate: number // percentage
  defaultFringeRate: number // percentage
  defaultGaRate: number // percentage (G&A)
}

const CONTRACT_TYPES = [
  { value: 'ffp', label: 'Firm Fixed Price (FFP)' },
  { value: 'tm', label: 'Time & Materials (T&M)' },
  { value: 'cpff', label: 'Cost Plus Fixed Fee (CPFF)' },
  { value: 'idiq', label: 'IDIQ' },
]

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '200+', label: '200+ employees' },
]

export function CompanyPage() {
  const [settings, setSettings] = useState<CompanySettings>({
    name: '',
    logoUrl: null,
    size: '11-50',
    defaultBillableHours: 1880,
    defaultContractType: 'tm',
    fiscalYearStart: 1,
    defaultOverheadRate: 0,
    defaultFringeRate: 0,
    defaultGaRate: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  
  // Editing states
  const [editingName, setEditingName] = useState(false)
  const [nameBuffer, setNameBuffer] = useState('')
  
  // Load settings from localStorage
  useEffect(() => {
    const companyProfile = localStorage.getItem('truebid-company-profile')
    if (companyProfile) {
      try {
        const parsed = JSON.parse(companyProfile)
        setSettings({
          name: parsed.companyName || 'My Company',
          logoUrl: parsed.logoUrl || null,
          size: parsed.companySize || '11-50',
          defaultBillableHours: parsed.defaultBillableHours || 1880,
          defaultContractType: parsed.defaultContractType || 'tm',
          fiscalYearStart: parsed.fiscalYearStart || 1,
          defaultOverheadRate: parsed.defaultOverheadRate || 0,
          defaultFringeRate: parsed.defaultFringeRate || 0,
          defaultGaRate: parsed.defaultGaRate || 0,
        })
      } catch {
        // Use defaults
      }
    }
    setIsLoading(false)
  }, [])
  
  // Save settings to localStorage
  const saveSettings = (updates: Partial<CompanySettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    
    const companyProfile = localStorage.getItem('truebid-company-profile')
    const existing = companyProfile ? JSON.parse(companyProfile) : {}
    localStorage.setItem('truebid-company-profile', JSON.stringify({
      ...existing,
      companyName: newSettings.name,
      logoUrl: newSettings.logoUrl,
      companySize: newSettings.size,
      defaultBillableHours: newSettings.defaultBillableHours,
      defaultContractType: newSettings.defaultContractType,
      fiscalYearStart: newSettings.fiscalYearStart,
      defaultOverheadRate: newSettings.defaultOverheadRate,
      defaultFringeRate: newSettings.defaultFringeRate,
      defaultGaRate: newSettings.defaultGaRate,
    }))
    
    toast.success('Settings saved')
  }
  
  const handleStartEditName = () => {
    setNameBuffer(settings.name)
    setEditingName(true)
  }
  
  const handleSaveName = () => {
    if (nameBuffer.trim()) {
      saveSettings({ name: nameBuffer.trim() })
    }
    setEditingName(false)
  }
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-32 bg-gray-200 rounded" />
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="h-16 w-16 bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Company</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your company settings and proposal defaults</p>
        </div>
        
        {/* Company Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Company Information</h3>
          
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="relative group">
              <Avatar className="w-16 h-16 rounded-lg">
                <AvatarImage src={settings.logoUrl || undefined} alt={settings.name} className="rounded-lg" />
                <AvatarFallback className="text-lg bg-gray-100 text-gray-600 rounded-lg">
                  {getInitials(settings.name)}
                </AvatarFallback>
              </Avatar>
              <button 
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {/* TODO: Logo upload */}}
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Details */}
            <div className="flex-1 space-y-4">
              {/* Company Name */}
              <div>
                <Label className="text-xs text-gray-500">Company Name</Label>
                {editingName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={nameBuffer}
                      onChange={(e) => setNameBuffer(e.target.value)}
                      className="h-9 max-w-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName()
                        if (e.key === 'Escape') setEditingName(false)
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={handleSaveName} className="h-9 w-9 p-0">
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingName(false)} className="h-9 w-9 p-0">
                      <X className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-medium text-gray-900">{settings.name}</p>
                    <Button variant="ghost" size="sm" onClick={handleStartEditName} className="h-7 px-2 text-xs">
                      Edit
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Company Size */}
              <div>
                <Label className="text-xs text-gray-500">Company Size</Label>
                <Select 
                  value={settings.size} 
                  onValueChange={(value) => saveSettings({ size: value })}
                >
                  <SelectTrigger className="w-48 h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map(size => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Proposal Defaults Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Proposal Defaults</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">These values are used as defaults when creating new proposals. You can override them per-proposal.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Billable Hours */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-500">Billable Hours per Year</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">Industry standard is 1,880-2,080. This affects FTE calculations.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                min="1400"
                max="2400"
                value={settings.defaultBillableHours}
                onChange={(e) => saveSettings({ defaultBillableHours: parseInt(e.target.value) || 1880 })}
                className="h-9 w-32"
              />
            </div>
            
            {/* Default Contract Type */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Default Contract Type</Label>
              <Select 
                value={settings.defaultContractType} 
                onValueChange={(value: 'ffp' | 'tm' | 'cpff' | 'idiq') => saveSettings({ defaultContractType: value })}
              >
                <SelectTrigger className="w-56 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Fiscal Year Start */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Fiscal Year Start</Label>
              <Select 
                value={String(settings.fiscalYearStart)} 
                onValueChange={(value) => saveSettings({ fiscalYearStart: parseInt(value) })}
              >
                <SelectTrigger className="w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month.value} value={String(month.value)}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Rate Defaults Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Rate Defaults</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">Default indirect rates for new proposals. These should match your DCAA-approved rates.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            {/* Overhead Rate */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Overhead Rate (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="200"
                  step="0.1"
                  value={settings.defaultOverheadRate}
                  onChange={(e) => saveSettings({ defaultOverheadRate: parseFloat(e.target.value) || 0 })}
                  className="h-9 w-28 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
            
            {/* Fringe Rate */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Fringe Rate (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.defaultFringeRate}
                  onChange={(e) => saveSettings({ defaultFringeRate: parseFloat(e.target.value) || 0 })}
                  className="h-9 w-28 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
            
            {/* G&A Rate */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">G&A Rate (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={settings.defaultGaRate}
                  onChange={(e) => saveSettings({ defaultGaRate: parseFloat(e.target.value) || 0 })}
                  className="h-9 w-28 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Leave rates at 0% if you don't use indirect cost pools or prefer to set them per-proposal.
          </p>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default CompanyPage