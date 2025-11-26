'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Calculator, AlertTriangle, CheckCircle, Info, Building2, Calendar, FileText, Edit2, Users, Briefcase } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import {
  FFTC_GSA_SCHEDULE,
  getGSARate,
  isRateAvailable,
  getCurrentGSAYear,
} from '@/lib/gsa-schedule-data';

// ==================== TYPES ====================

type StaffType = 'internal' | 'subcontractor';

interface GSATeamMember {
  id: string;
  laborCategoryId: string;
  sin: string;
  title: string;
  gsaCeilingRate: number;
  discountPercent: number;
  bidRate: number;
  staffType: StaffType;
  // Internal fields
  companyRoleId?: string;
  companyRoleTitle?: string;
  level?: string;
  step?: number;
  loadedCost: number;
  // Subcontractor fields
  subcontractorName?: string;
  subRate?: number;
  // Common fields
  quantity: number;
  hoursPerYear: number;
  years: number;
}

interface GSATeamMemberWithCalcs extends GSATeamMember {
  hourlyMargin: number;
  marginPercent: number;
  annualRevenue: number;
  annualCost: number;
  annualProfit: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  isProfitable: boolean;
}

// ==================== COMPONENT ====================

export default function GSABidTab() {
  const { companyRoles, subcontractors, calculateLoadedCost } = useAppContext();
  
  // State
  const [team, setTeam] = useState<GSATeamMember[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentGSAYear());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<GSATeamMember | null>(null);
  
  // Add dialog state
  const [selectedSin, setSelectedSin] = useState<string>('54151S');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [staffType, setStaffType] = useState<StaffType>('internal');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [addHoursPerYear, setAddHoursPerYear] = useState<number>(1920);
  const [addYears, setAddYears] = useState<number>(1);
  
  // Internal staff fields
  const [selectedCompanyRoleId, setSelectedCompanyRoleId] = useState<string>('');
  const [selectedLevelIndex, setSelectedLevelIndex] = useState<number>(0);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  
  // Subcontractor fields
  const [selectedSubFromLibrary, setSelectedSubFromLibrary] = useState<string>('');
  const [subcontractorName, setSubcontractorName] = useState<string>('');
  const [subRate, setSubRate] = useState<string>('');

  // Use the context's calculateLoadedCost function for consistency
  const calculateLoadedRate = (salary: number): number => {
    return calculateLoadedCost(salary);
  };

  // Get categories for selected SIN
  const categoriesForSin = useMemo(() => {
    const sin = FFTC_GSA_SCHEDULE.sins.find(s => s.sin === selectedSin);
    return sin?.laborCategories.filter(cat => isRateAvailable(cat, selectedYear)) || [];
  }, [selectedSin, selectedYear]);

  // Get selected company role details
  const selectedCompanyRole = useMemo(() => {
    return companyRoles.find(r => r.id === selectedCompanyRoleId);
  }, [companyRoles, selectedCompanyRoleId]);

  // Get loaded cost for selected internal role
  const calculatedLoadedCost = useMemo(() => {
    if (!selectedCompanyRole) return 0;
    const level = selectedCompanyRole.levels[selectedLevelIndex];
    if (!level) return 0;
    const step = level.steps[selectedStepIndex];
    if (!step) return 0;
    return calculateLoadedRate(step.salary);
  }, [selectedCompanyRole, selectedLevelIndex, selectedStepIndex]);

  // Calculate team with all metrics
  const teamWithCalcs: GSATeamMemberWithCalcs[] = useMemo(() => {
    return team.map(member => {
      const costPerHour = member.staffType === 'internal' ? member.loadedCost : (member.subRate || 0);
      const annualRevenue = member.bidRate * member.hoursPerYear * member.quantity;
      const annualCost = costPerHour * member.hoursPerYear * member.quantity;
      const annualProfit = annualRevenue - annualCost;
      const hourlyMargin = member.bidRate - costPerHour;
      const marginPercent = member.bidRate > 0 ? ((member.bidRate - costPerHour) / member.bidRate) * 100 : 0;
      
      return {
        ...member,
        hourlyMargin,
        marginPercent,
        annualRevenue,
        annualCost,
        annualProfit,
        totalRevenue: annualRevenue * member.years,
        totalCost: annualCost * member.years,
        totalProfit: annualProfit * member.years,
        isProfitable: hourlyMargin > 0,
      };
    });
  }, [team]);

  // Summary calculations - separated by internal vs sub
  const summary = useMemo(() => {
    const internalMembers = teamWithCalcs.filter(m => m.staffType === 'internal');
    const subMembers = teamWithCalcs.filter(m => m.staffType === 'subcontractor');
    
    // Internal staff metrics
    const internalRevenue = internalMembers.reduce((sum, m) => sum + m.totalRevenue, 0);
    const internalCost = internalMembers.reduce((sum, m) => sum + m.totalCost, 0);
    const internalProfit = internalRevenue - internalCost;
    const internalHours = internalMembers.reduce((sum, m) => sum + (m.hoursPerYear * m.quantity * m.years), 0);
    
    // Subcontractor metrics
    const subRevenue = subMembers.reduce((sum, m) => sum + m.totalRevenue, 0);
    const subCost = subMembers.reduce((sum, m) => sum + m.totalCost, 0);
    const subSpread = subRevenue - subCost;
    const subHours = subMembers.reduce((sum, m) => sum + (m.hoursPerYear * m.quantity * m.years), 0);
    
    // Combined totals
    const totalRevenue = internalRevenue + subRevenue;
    const totalCost = internalCost + subCost;
    const totalProfit = internalProfit + subSpread;
    const totalHours = internalHours + subHours;
    
    // Labor mix (important for small business compliance - often need 50%+ prime labor)
    const laborMixPercent = totalRevenue > 0 ? (internalRevenue / totalRevenue) * 100 : 100;
    
    // IFF impact (0.75% of total revenue comes out of YOUR profit)
    const iffAmount = totalRevenue * 0.0075;
    const profitAfterIFF = totalProfit - iffAmount;
    
    // Margins
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const marginAfterIFF = totalRevenue > 0 ? (profitAfterIFF / totalRevenue) * 100 : 0;
    const internalMarginPercent = internalRevenue > 0 ? (internalProfit / internalRevenue) * 100 : 0;
    const subMarginPercent = subRevenue > 0 ? (subSpread / subRevenue) * 100 : 0;
    
    // FTE and counts
    const totalFTE = teamWithCalcs.reduce((sum, m) => sum + (m.quantity * m.hoursPerYear / 2080), 0);
    const internalFTE = internalMembers.reduce((sum, m) => sum + (m.quantity * m.hoursPerYear / 2080), 0);
    const subFTE = subMembers.reduce((sum, m) => sum + (m.quantity * m.hoursPerYear / 2080), 0);
    const profitableCount = teamWithCalcs.filter(m => m.isProfitable).length;
    const unprofitableCount = teamWithCalcs.filter(m => !m.isProfitable).length;
    const thinMarginCount = teamWithCalcs.filter(m => m.marginPercent > 0 && m.marginPercent < 15).length;
    
    return {
      // Internal
      internalRevenue,
      internalCost,
      internalProfit,
      internalHours,
      internalMarginPercent,
      internalFTE,
      internalCount: internalMembers.length,
      
      // Subcontractor
      subRevenue,
      subCost,
      subSpread,
      subHours,
      subMarginPercent,
      subFTE,
      subCount: subMembers.length,
      
      // Totals
      totalRevenue,
      totalCost,
      totalProfit,
      totalHours,
      avgMargin,
      totalFTE,
      
      // IFF
      iffAmount,
      profitAfterIFF,
      marginAfterIFF,
      
      // Labor mix
      laborMixPercent,
      
      // Health indicators
      profitableCount,
      unprofitableCount,
      thinMarginCount,
      memberCount: teamWithCalcs.length,
    };
  }, [teamWithCalcs]);

  // Handlers
  const handleAddMember = () => {
    if (!selectedCategoryId) return;
    
    const sin = FFTC_GSA_SCHEDULE.sins.find(s => s.sin === selectedSin);
    const category = sin?.laborCategories.find(c => c.id === selectedCategoryId);
    if (!category) return;
    
    const gsaCeilingRate = getGSARate(category, selectedYear);
    if (gsaCeilingRate === null) return;
    
    const bidRate = gsaCeilingRate * (1 - discountPercent / 100);
    
    let newMember: GSATeamMember;
    
    if (staffType === 'internal') {
      if (!selectedCompanyRole) return;
      const level = selectedCompanyRole.levels[selectedLevelIndex];
      const step = level?.steps[selectedStepIndex];
      
      newMember = {
        id: `gsa-${Date.now()}`,
        laborCategoryId: category.id,
        sin: selectedSin,
        title: category.title,
        gsaCeilingRate,
        discountPercent,
        bidRate,
        staffType: 'internal',
        companyRoleId: selectedCompanyRole.id,
        companyRoleTitle: selectedCompanyRole.title,
        level: level?.level,
        step: step?.step,
        loadedCost: calculatedLoadedCost,
        quantity: addQuantity,
        hoursPerYear: addHoursPerYear,
        years: addYears,
      };
    } else {
      const parsedSubRate = parseFloat(subRate);
      if (isNaN(parsedSubRate) || parsedSubRate <= 0 || !subcontractorName.trim()) return;
      
      newMember = {
        id: `gsa-${Date.now()}`,
        laborCategoryId: category.id,
        sin: selectedSin,
        title: category.title,
        gsaCeilingRate,
        discountPercent,
        bidRate,
        staffType: 'subcontractor',
        subcontractorName: subcontractorName.trim(),
        subRate: parsedSubRate,
        loadedCost: parsedSubRate,
        quantity: addQuantity,
        hoursPerYear: addHoursPerYear,
        years: addYears,
      };
    }
    
    setTeam([...team, newMember]);
    setIsAddDialogOpen(false);
    resetAddForm();
  };

  const handleEditMember = () => {
    if (!editingMember) return;
    
    // Recalculate bid rate
    const updatedMember = {
      ...editingMember,
      bidRate: editingMember.gsaCeilingRate * (1 - editingMember.discountPercent / 100),
    };
    
    setTeam(team.map(m => m.id === updatedMember.id ? updatedMember : m));
    setIsEditDialogOpen(false);
    setEditingMember(null);
  };

  const handleRemoveMember = (id: string) => {
    setTeam(team.filter(m => m.id !== id));
  };

  const openEditDialog = (member: GSATeamMember) => {
    setEditingMember({ ...member });
    setIsEditDialogOpen(true);
  };

  const resetAddForm = () => {
    setSelectedCategoryId('');
    setStaffType('internal');
    setDiscountPercent(0);
    setAddQuantity(1);
    setAddHoursPerYear(1920);
    setAddYears(1);
    setSelectedCompanyRoleId('');
    setSelectedLevelIndex(0);
    setSelectedStepIndex(0);
    setSelectedSubFromLibrary('');
    setSubcontractorName('');
    setSubRate('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatRate = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Year options for selector
  const yearOptions = [1, 2, 3, 4, 5].filter(year => {
    return FFTC_GSA_SCHEDULE.sins.some(sin => 
      sin.laborCategories.some(cat => isRateAvailable(cat, year))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">Utility Tool</span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">GSA Schedule Bid Builder</h1>
        <p className="text-slate-600 mt-1">Build task orders using your GSA MAS ceiling rates</p>
      </div>

      {/* Contract Info Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Building2 className="h-5 w-5 text-amber-700" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-slate-900">{FFTC_GSA_SCHEDULE.contractorName}</h3>
              <span className="text-sm text-slate-600">Contract: {FFTC_GSA_SCHEDULE.contractNumber}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Valid: {FFTC_GSA_SCHEDULE.periodOfPerformance.start} to {FFTC_GSA_SCHEDULE.periodOfPerformance.end}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>SAM UEI: {FFTC_GSA_SCHEDULE.samUei}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Info className="h-4 w-4" />
                <span>Max Order: {formatCurrency(FFTC_GSA_SCHEDULE.maxOrder)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-6 bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contract Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>
                  Year {year} {year === getCurrentGSAYear() ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-slate-600">
            <span className="font-medium">{FFTC_GSA_SCHEDULE.sins.length}</span> SINs available
          </div>
        </div>
        
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Role
        </button>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Rate Card Browser */}
        <div className="col-span-4">
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">GSA Rate Card</h3>
              <p className="text-sm text-slate-600">Year {selectedYear} ceiling rates (includes IFF)</p>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {FFTC_GSA_SCHEDULE.sins.map(sin => {
                const availableCategories = sin.laborCategories.filter(cat => isRateAvailable(cat, selectedYear));
                if (availableCategories.length === 0) return null;
                
                return (
                  <div key={sin.sin} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                        {sin.sin}
                      </span>
                      <span className="text-xs text-slate-500 truncate">{sin.name.split(' - ')[0]}</span>
                    </div>
                    <div className="space-y-1">
                      {availableCategories.map(cat => {
                        const rate = getGSARate(cat, selectedYear);
                        return (
                          <div
                            key={cat.id}
                            className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded text-sm hover:bg-slate-100 transition-colors"
                          >
                            <span className="text-slate-700 truncate mr-2">{cat.title}</span>
                            <span className="font-medium text-slate-900 whitespace-nowrap">
                              {formatRate(rate!)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Team Builder */}
        <div className="col-span-5">
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Task Order Team</h3>
              <p className="text-sm text-slate-600">
                {team.length} role{team.length !== 1 ? 's' : ''} • {summary.totalFTE.toFixed(1)} FTE
                {summary.internalCount > 0 && <span className="ml-2">• {summary.internalCount} internal</span>}
                {summary.subCount > 0 && <span className="ml-2">• {summary.subCount} sub</span>}
              </p>
            </div>
            
            {team.length === 0 ? (
              <div className="p-8 text-center">
                <Calculator className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 mb-2">No roles added yet</p>
                <p className="text-sm text-slate-500">Click &quot;Add Role&quot; to build your team</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {teamWithCalcs.map(member => (
                  <div key={member.id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900">{member.title}</h4>
                          <span className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                            {member.sin}
                          </span>
                          {member.staffType === 'internal' ? (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Internal
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              Sub
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          {member.staffType === 'internal' ? (
                            <span>{member.companyRoleTitle} • {member.level} Step {member.step}</span>
                          ) : (
                            <span>{member.subcontractorName}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                          <span>×{member.quantity}</span>
                          <span>•</span>
                          <span>{member.hoursPerYear.toLocaleString()} hrs/yr</span>
                          <span>•</span>
                          <span>{member.years} yr{member.years !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditDialog(member)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Rate Breakdown */}
                    <div className="grid grid-cols-4 gap-2 mt-3 p-3 bg-slate-50 rounded-lg text-sm">
                      <div>
                        <div className="text-xs text-slate-500 mb-0.5">Ceiling</div>
                        <div className="font-medium text-slate-900">{formatRate(member.gsaCeilingRate)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-0.5">Discount</div>
                        <div className="font-medium text-slate-900">{member.discountPercent}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-0.5">Bid Rate</div>
                        <div className="font-medium text-blue-600">{formatRate(member.bidRate)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-0.5">
                          {member.staffType === 'internal' ? 'Loaded Cost' : 'Sub Rate'}
                        </div>
                        <div className="font-medium text-slate-900">
                          {formatRate(member.staffType === 'internal' ? member.loadedCost : member.subRate!)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Margin */}
                    <div className="flex items-center justify-between mt-2 px-3 py-2 rounded-lg bg-slate-50">
                      <span className="text-sm text-slate-600">Hourly Margin</span>
                      <span className={`font-semibold flex items-center gap-1 ${member.isProfitable ? 'text-emerald-600' : 'text-red-600'}`}>
                        {member.isProfitable ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        )}
                        {formatRate(member.hourlyMargin)} ({member.marginPercent.toFixed(1)}%)
                      </span>
                    </div>
                    
                    {/* Totals */}
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-slate-600">Total Contract Value</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(member.totalRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Total Profit</span>
                      <span className={`font-semibold ${member.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(member.totalProfit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="col-span-3">
          <div className="space-y-4">
            {/* Task Order Value */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-600 mb-3">Task Order Value</h3>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {formatCurrency(summary.totalRevenue)}
              </div>
              <div className="text-sm text-slate-600">
                {summary.memberCount} role{summary.memberCount !== 1 ? 's' : ''} • {summary.totalFTE.toFixed(1)} FTE • {summary.totalHours.toLocaleString()} hrs
              </div>
              
              {summary.totalRevenue > FFTC_GSA_SCHEDULE.maxOrder && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Exceeds max order ({formatCurrency(FFTC_GSA_SCHEDULE.maxOrder)})
                </div>
              )}
            </div>

            {/* Labor Mix - Important for compliance */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-600 mb-3">Labor Mix</h3>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Prime Contractor Labor</span>
                  <span className={`font-semibold ${summary.laborMixPercent >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {summary.laborMixPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${summary.laborMixPercent >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(summary.laborMixPercent, 100)}%` }}
                  />
                </div>
                {summary.laborMixPercent < 50 && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Below 50% prime labor threshold
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-blue-600 text-xs">Internal</div>
                  <div className="font-semibold text-slate-900">{formatCurrency(summary.internalRevenue)}</div>
                  <div className="text-xs text-slate-500">{summary.internalFTE.toFixed(1)} FTE</div>
                </div>
                <div className="p-2 bg-purple-50 rounded">
                  <div className="text-purple-600 text-xs">Subcontractor</div>
                  <div className="font-semibold text-slate-900">{formatCurrency(summary.subRevenue)}</div>
                  <div className="text-xs text-slate-500">{summary.subFTE.toFixed(1)} FTE</div>
                </div>
              </div>
            </div>

            {/* Internal Staff Profit */}
            {summary.internalCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium text-blue-900">Internal Staff Profit</h3>
                </div>
                <div className={`text-2xl font-bold ${summary.internalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.internalProfit)}
                </div>
                <div className="text-sm text-blue-700 mb-2">
                  {summary.internalMarginPercent.toFixed(1)}% margin
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Revenue</span>
                    <span className="text-slate-900">{formatCurrency(summary.internalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Your Cost</span>
                    <span className="text-slate-900">({formatCurrency(summary.internalCost)})</span>
                  </div>
                </div>
              </div>
            )}

            {/* Subcontractor Spread */}
            {summary.subCount > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                  <h3 className="text-sm font-medium text-purple-900">Subcontractor Spread</h3>
                </div>
                <div className={`text-2xl font-bold ${summary.subSpread >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.subSpread)}
                </div>
                <div className="text-sm text-purple-700 mb-2">
                  {summary.subMarginPercent.toFixed(1)}% margin
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Billed to Gov&apos;t</span>
                    <span className="text-slate-900">{formatCurrency(summary.subRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">You Pay Subs</span>
                    <span className="text-slate-900">({formatCurrency(summary.subCost)})</span>
                  </div>
                </div>
                
                {/* Per-sub breakdown */}
                {(() => {
                  const subsByCompany = teamWithCalcs
                    .filter(m => m.staffType === 'subcontractor')
                    .reduce((acc, m) => {
                      const name = m.subcontractorName || 'Unknown';
                      if (!acc[name]) {
                        acc[name] = { revenue: 0, cost: 0, count: 0 };
                      }
                      acc[name].revenue += m.totalRevenue;
                      acc[name].cost += m.totalCost;
                      acc[name].count += m.quantity;
                      return acc;
                    }, {} as Record<string, { revenue: number; cost: number; count: number }>);
                  
                  const companies = Object.entries(subsByCompany);
                  if (companies.length <= 1) return null;
                  
                  return (
                    <div className="mt-3 pt-3 border-t border-purple-200 space-y-2">
                      <div className="text-xs font-medium text-purple-700 uppercase">By Company</div>
                      {companies.map(([name, data]) => (
                        <div key={name} className="flex justify-between text-xs">
                          <span className="text-purple-800 truncate mr-2">{name}</span>
                          <span className="text-slate-700 whitespace-nowrap">
                            {formatCurrency(data.revenue - data.cost)} ({data.count} role{data.count !== 1 ? 's' : ''})
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Total Profit with IFF */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-600 mb-3">Total Profitability</h3>
              
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Gross Profit</span>
                  <span className="font-medium text-slate-900">{formatCurrency(summary.totalProfit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Less: IFF (0.75%)</span>
                  <span className="font-medium text-red-600">({formatCurrency(summary.iffAmount)})</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between">
                  <span className="font-medium text-slate-900">Net Profit</span>
                  <span className={`font-bold text-lg ${summary.profitAfterIFF >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.profitAfterIFF)}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-slate-600">
                Effective margin: <span className="font-semibold">{summary.marginAfterIFF.toFixed(1)}%</span>
              </div>
            </div>

            {/* Health Indicators */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-600 mb-3">Margin Health</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    Healthy (≥15%)
                  </div>
                  <span className="font-medium text-slate-900">{summary.profitableCount - summary.thinMarginCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    Thin (0-15%)
                  </div>
                  <span className="font-medium text-slate-900">{summary.thinMarginCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Unprofitable
                  </div>
                  <span className="font-medium text-slate-900">{summary.unprofitableCount}</span>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">GSA Pricing Notes</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Ceiling rates include IFF (0.75%)</li>
                    <li>• IFF is deducted from your profit</li>
                    <li>• Many contracts require ≥50% prime labor</li>
                    <li>• Sub margins typically 5-15%</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Add Role to Task Order</h2>
              <p className="text-sm text-slate-600 mt-1">Select a GSA labor category and configure staffing</p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* SIN Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Special Item Number (SIN)
                </label>
                <select
                  value={selectedSin}
                  onChange={(e) => {
                    setSelectedSin(e.target.value);
                    setSelectedCategoryId('');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {FFTC_GSA_SCHEDULE.sins.map(sin => {
                    const available = sin.laborCategories.filter(cat => isRateAvailable(cat, selectedYear)).length;
                    return (
                      <option key={sin.sin} value={sin.sin} disabled={available === 0}>
                        {sin.sin} ({available} categories)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  GSA Labor Category
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select a category...</option>
                  {categoriesForSin.map(cat => {
                    const rate = getGSARate(cat, selectedYear);
                    return (
                      <option key={cat.id} value={cat.id}>
                        {cat.title} - {formatRate(rate!)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Discount */}
              {selectedCategoryId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Discount from Ceiling (%)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={0.5}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex gap-1">
                      {[0, 5, 10, 15].map(d => (
                        <button
                          key={d}
                          onClick={() => setDiscountPercent(d)}
                          className={`px-2 py-1 text-xs rounded ${
                            discountPercent === d
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {d}%
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedCategoryId && (
                    <div className="mt-2 text-sm text-slate-600">
                      Bid Rate: <span className="font-medium text-blue-600">
                        {formatRate((getGSARate(categoriesForSin.find(c => c.id === selectedCategoryId)!, selectedYear) || 0) * (1 - discountPercent / 100))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Staff Type Toggle */}
              {selectedCategoryId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Staffing Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStaffType('internal')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                        staffType === 'internal'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      Internal Staff
                    </button>
                    <button
                      onClick={() => setStaffType('subcontractor')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                        staffType === 'subcontractor'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Briefcase className="h-4 w-4" />
                      Subcontractor
                    </button>
                  </div>
                </div>
              )}

              {/* Internal Staff Fields */}
              {selectedCategoryId && staffType === 'internal' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Company Role
                    </label>
                    <select
                      value={selectedCompanyRoleId}
                      onChange={(e) => {
                        setSelectedCompanyRoleId(e.target.value);
                        setSelectedLevelIndex(0);
                        setSelectedStepIndex(0);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a role...</option>
                      {companyRoles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCompanyRole && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Level
                          </label>
                          <select
                            value={selectedLevelIndex}
                            onChange={(e) => {
                              setSelectedLevelIndex(parseInt(e.target.value));
                              setSelectedStepIndex(0);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {selectedCompanyRole.levels.map((level, idx) => (
                              <option key={level.level} value={idx}>
                                {level.level} - {level.levelName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Step
                          </label>
                          <select
                            value={selectedStepIndex}
                            onChange={(e) => setSelectedStepIndex(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {selectedCompanyRole.levels[selectedLevelIndex]?.steps.map((step, idx) => (
                              <option key={step.step} value={idx}>
                                Step {step.step} - {formatCurrency(step.salary)}/yr
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-sm text-slate-600">Your Loaded Cost</div>
                        <div className="text-lg font-semibold text-slate-900">{formatRate(calculatedLoadedCost)}/hr</div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Subcontractor Fields */}
              {selectedCategoryId && staffType === 'subcontractor' && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
                  {/* Select from library or add new */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Subcontractor
                    </label>
                    <select
                      value={selectedSubFromLibrary}
                      onChange={(e) => {
                        setSelectedSubFromLibrary(e.target.value);
                        if (e.target.value === 'new') {
                          setSubcontractorName('');
                          setSubRate('');
                        } else if (e.target.value) {
                          const sub = subcontractors.find(s => s.id === e.target.value);
                          if (sub) {
                            setSubcontractorName(sub.companyName);
                            setSubRate(sub.theirRate.toString());
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select a subcontractor...</option>
                      {subcontractors.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.companyName} - {sub.role} (${sub.theirRate}/hr)
                        </option>
                      ))}
                      <option value="new">+ Add New Subcontractor...</option>
                    </select>
                  </div>

                  {/* Show fields for new sub or editing */}
                  {(selectedSubFromLibrary === 'new' || selectedSubFromLibrary) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Booz Allen Hamilton"
                          value={subcontractorName}
                          onChange={(e) => setSubcontractorName(e.target.value)}
                          disabled={selectedSubFromLibrary !== 'new' && selectedSubFromLibrary !== ''}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100 disabled:text-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Their Rate ($/hr)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="What you pay them per hour"
                          value={subRate}
                          onChange={(e) => setSubRate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        {selectedSubFromLibrary && selectedSubFromLibrary !== 'new' && (
                          <p className="text-xs text-purple-600 mt-1">
                            Rate pre-filled from library. Adjust for this task order if needed.
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {subcontractors.length === 0 && (
                    <p className="text-sm text-purple-700">
                      💡 Add subcontractors in your Command Center to quickly select them here.
                    </p>
                  )}
                </div>
              )}

              {/* Common Fields */}
              {selectedCategoryId && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={addQuantity}
                        onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Hrs/Year
                      </label>
                      <select
                        value={addHoursPerYear}
                        onChange={(e) => setAddHoursPerYear(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value={2080}>2,080</option>
                        <option value={1920}>1,920</option>
                        <option value={1880}>1,880</option>
                        <option value={960}>960</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Years
                      </label>
                      <select
                        value={addYears}
                        onChange={(e) => setAddYears(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {[1, 2, 3, 4, 5].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium text-slate-700 mb-2">Preview</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-600">Bid Rate:</div>
                      <div className="font-medium text-blue-600">
                        {formatRate((getGSARate(categoriesForSin.find(c => c.id === selectedCategoryId)!, selectedYear) || 0) * (1 - discountPercent / 100))}
                      </div>
                      <div className="text-slate-600">Your Cost:</div>
                      <div className="font-medium text-slate-900">
                        {staffType === 'internal' 
                          ? formatRate(calculatedLoadedCost)
                          : (subRate ? formatRate(parseFloat(subRate)) : '—')
                        }
                      </div>
                      <div className="text-slate-600">Annual Revenue:</div>
                      <div className="font-medium text-slate-900">
                        {formatCurrency(
                          (getGSARate(categoriesForSin.find(c => c.id === selectedCategoryId)!, selectedYear) || 0) 
                          * (1 - discountPercent / 100) 
                          * addHoursPerYear 
                          * addQuantity
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetAddForm();
                }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={
                  !selectedCategoryId || 
                  (staffType === 'internal' && !selectedCompanyRoleId) ||
                  (staffType === 'subcontractor' && (!subcontractorName.trim() || !subRate))
                }
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {isEditDialogOpen && editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Edit {editingMember.title}</h2>
              <p className="text-sm text-slate-600 mt-1">
                {editingMember.staffType === 'internal' ? 'Internal Staff' : `Subcontractor: ${editingMember.subcontractorName}`}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* GSA Ceiling (read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  GSA Ceiling Rate
                </label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                  {formatRate(editingMember.gsaCeilingRate)}
                </div>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={editingMember.discountPercent}
                  onChange={(e) => setEditingMember({
                    ...editingMember,
                    discountPercent: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="mt-1 text-sm text-slate-600">
                  Bid Rate: <span className="font-medium text-blue-600">
                    {formatRate(editingMember.gsaCeilingRate * (1 - (editingMember.discountPercent || 0) / 100))}
                  </span>
                </div>
              </div>

              {/* Cost field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {editingMember.staffType === 'internal' ? 'Loaded Cost ($/hr)' : 'Sub Rate ($/hr)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingMember.staffType === 'internal' ? editingMember.loadedCost : editingMember.subRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (editingMember.staffType === 'internal') {
                      setEditingMember({ ...editingMember, loadedCost: val });
                    } else {
                      setEditingMember({ ...editingMember, subRate: val, loadedCost: val });
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={editingMember.quantity}
                  onChange={(e) => setEditingMember({
                    ...editingMember,
                    quantity: parseInt(e.target.value) || 1
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Hours Per Year */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hours Per Year
                </label>
                <select
                  value={editingMember.hoursPerYear}
                  onChange={(e) => setEditingMember({
                    ...editingMember,
                    hoursPerYear: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value={2080}>2,080</option>
                  <option value={1920}>1,920</option>
                  <option value={1880}>1,880</option>
                  <option value={960}>960</option>
                </select>
              </div>

              {/* Years */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contract Duration (Years)
                </label>
                <select
                  value={editingMember.years}
                  onChange={(e) => setEditingMember({
                    ...editingMember,
                    years: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {[1, 2, 3, 4, 5].map(y => (
                    <option key={y} value={y}>{y} Year{y !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-sm font-medium text-slate-700 mb-2">Preview</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-slate-600">Bid Rate:</div>
                  <div className="font-medium text-blue-600">
                    {formatRate(editingMember.gsaCeilingRate * (1 - (editingMember.discountPercent || 0) / 100))}
                  </div>
                  <div className="text-slate-600">Hourly Margin:</div>
                  <div className={`font-medium ${
                    (editingMember.gsaCeilingRate * (1 - (editingMember.discountPercent || 0) / 100)) - 
                    (editingMember.staffType === 'internal' ? editingMember.loadedCost : (editingMember.subRate || 0)) > 0 
                      ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {formatRate(
                      (editingMember.gsaCeilingRate * (1 - (editingMember.discountPercent || 0) / 100)) - 
                      (editingMember.staffType === 'internal' ? editingMember.loadedCost : (editingMember.subRate || 0))
                    )}
                  </div>
                  <div className="text-slate-600">Total Contract:</div>
                  <div className="font-medium text-slate-900">
                    {formatCurrency(
                      editingMember.gsaCeilingRate * (1 - (editingMember.discountPercent || 0) / 100) * 
                      editingMember.hoursPerYear * editingMember.quantity * editingMember.years
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingMember(null);
                }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditMember}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}