// Export utilities for generating proposal documentation
// Uses SheetJS (xlsx) for Excel generation in the browser

import * as XLSX from 'xlsx'

interface ExportData {
  // Document Info
  solicitation: string
  client: string
  proposalTitle: string
  preparedBy: string
  preparedDate: string
  
  // Company Info
  companyName: string
  samUei: string
  gsaContract?: string
  
  // Indirect Rates
  indirectRates: {
    fringe: number
    overhead: number
    ga: number
    source: string
    fiscalYear: number
  }
  
  // Profit & Escalation
  profitMargin: number
  escalationRate: number
  
  // Roles
  roles: Array<{
    id: string
    title: string
    icLevel: string
    baseSalary: number
    quantity: number
    description: string
    blsCode?: string
    yearsExperience?: string
  }>
  
  // Calculations
  calculateRate: (salary: number, includeProfit: boolean) => number
  calculateEscalatedRate: (rate: number, year: number) => number
  
  // Options
  rateCardType: 'tm' | 'ffp' | 'gsa' | 'all'
  yearsToInclude: number
  includeEscalation: boolean
}

interface ExportOptions {
  includeRateCard: boolean
  includeBOE: boolean
  includeLCATs: boolean
  includeAuditPackage: boolean
}

// ==================== RATE CARD SHEET ====================

function createRateCardSheet(data: ExportData): XLSX.WorkSheet {
  const rows: any[][] = []
  
  // Header
  rows.push([`${data.companyName} - Labor Rate Card`])
  rows.push([`Solicitation: ${data.solicitation || 'N/A'}`])
  rows.push([`Prepared: ${data.preparedDate}`])
  rows.push([])
  
  // Column headers
  const headers = ['Labor Category', 'IC Level', 'Base Salary', 'Base Year Rate']
  if (data.yearsToInclude >= 2) headers.push('Option Year 1')
  if (data.yearsToInclude >= 3) headers.push('Option Year 2')
  if (data.yearsToInclude >= 4) headers.push('Option Year 3')
  if (data.yearsToInclude >= 5) headers.push('Option Year 4')
  headers.push('BLS Code')
  rows.push(headers)
  
  // Data rows
  data.roles.forEach(role => {
    const includeProfit = data.rateCardType !== 'ffp'
    const baseRate = data.calculateRate(role.baseSalary, includeProfit)
    
    const row: any[] = [
      role.title,
      role.icLevel,
      role.baseSalary,
      baseRate
    ]
    
    if (data.yearsToInclude >= 2) {
      row.push(data.includeEscalation ? data.calculateEscalatedRate(baseRate, 2) : baseRate)
    }
    if (data.yearsToInclude >= 3) {
      row.push(data.includeEscalation ? data.calculateEscalatedRate(baseRate, 3) : baseRate)
    }
    if (data.yearsToInclude >= 4) {
      row.push(data.includeEscalation ? data.calculateEscalatedRate(baseRate, 4) : baseRate)
    }
    if (data.yearsToInclude >= 5) {
      row.push(data.includeEscalation ? data.calculateEscalatedRate(baseRate, 5) : baseRate)
    }
    
    row.push(role.blsCode || '15-1252')
    rows.push(row)
  })
  
  // Footer notes
  rows.push([])
  rows.push([`Rate Type: ${data.rateCardType === 'tm' ? 'T&M (includes profit)' : data.rateCardType === 'ffp' ? 'FFP (cost only)' : 'GSA Ceiling'}`])
  rows.push([`Indirect Rates: Fringe ${(data.indirectRates.fringe * 100).toFixed(2)}% | OH ${(data.indirectRates.overhead * 100).toFixed(2)}% | G&A ${(data.indirectRates.ga * 100).toFixed(2)}%`])
  if (data.rateCardType !== 'ffp') {
    rows.push([`Profit: ${(data.profitMargin * 100).toFixed(1)}%`])
  }
  if (data.includeEscalation) {
    rows.push([`Annual Escalation: ${(data.escalationRate * 100).toFixed(1)}%`])
  }
  rows.push([`Source: ${data.indirectRates.source} (FY${data.indirectRates.fiscalYear})`])
  
  const ws = XLSX.utils.aoa_to_sheet(rows)
  
  // Set column widths
  ws['!cols'] = [
    { wch: 30 },  // Labor Category
    { wch: 10 },  // IC Level
    { wch: 15 },  // Base Salary
    { wch: 15 },  // Base Year
    { wch: 15 },  // Opt 1
    { wch: 15 },  // Opt 2
    { wch: 15 },  // Opt 3
    { wch: 15 },  // Opt 4
    { wch: 12 },  // BLS Code
  ]
  
  return ws
}

// ==================== BOE SUMMARY SHEET ====================

function createBOESummarySheet(
  data: ExportData,
  totals: {
    baseYear: number
    option1: number
    option2: number
    subTotal: number
    odcTotal: number
    perDiemTotal: number
  }
): XLSX.WorkSheet {
  const rows: any[][] = []
  
  // Header
  rows.push(['BASIS OF ESTIMATE - SUMMARY'])
  rows.push([])
  rows.push(['Document Information'])
  rows.push(['Solicitation:', data.solicitation || 'N/A'])
  rows.push(['Client:', data.client || 'N/A'])
  rows.push(['Proposal Title:', data.proposalTitle || 'N/A'])
  rows.push(['Offeror:', data.companyName])
  rows.push(['SAM UEI:', data.samUei])
  rows.push(['Prepared By:', data.preparedBy])
  rows.push(['Date:', data.preparedDate])
  rows.push([])
  
  // Cost Summary
  rows.push(['COST SUMMARY'])
  rows.push(['Cost Element', 'Base Year', 'Option 1', 'Option 2', 'Total'])
  
  const laborTotal = totals.baseYear + totals.option1 + totals.option2
  rows.push(['Direct Labor', totals.baseYear, totals.option1, totals.option2, laborTotal])
  rows.push(['Subcontractor Labor', totals.subTotal / 3, totals.subTotal / 3, totals.subTotal / 3, totals.subTotal])
  rows.push(['Other Direct Costs', totals.odcTotal, 0, 0, totals.odcTotal])
  rows.push(['Travel / Per Diem', totals.perDiemTotal, 0, 0, totals.perDiemTotal])
  rows.push([])
  
  const grandTotal = laborTotal + totals.subTotal + totals.odcTotal + totals.perDiemTotal
  rows.push(['TOTAL PROPOSED PRICE', 
    totals.baseYear + totals.subTotal/3 + totals.odcTotal + totals.perDiemTotal,
    totals.option1 + totals.subTotal/3,
    totals.option2 + totals.subTotal/3,
    grandTotal
  ])
  
  const ws = XLSX.utils.aoa_to_sheet(rows)
  
  // Set column widths
  ws['!cols'] = [
    { wch: 25 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
  ]
  
  return ws
}

// ==================== BOE DETAIL SHEET ====================

function createBOEDetailSheet(data: ExportData): XLSX.WorkSheet {
  const rows: any[][] = []
  
  rows.push(['BASIS OF ESTIMATE - LABOR DETAIL'])
  rows.push([])
  rows.push(['Labor Category', 'IC Level', 'Qty', 'Hourly Rate', 'Hours/Year', 'Annual Cost', 'Base', 'Opt 1', 'Opt 2'])
  
  data.roles.forEach(role => {
    const rate = data.calculateRate(role.baseSalary, true)
    const hours = 2080
    const annualCost = rate * hours
    const opt1Cost = data.includeEscalation ? data.calculateEscalatedRate(rate, 2) * hours : annualCost
    const opt2Cost = data.includeEscalation ? data.calculateEscalatedRate(rate, 3) * hours : annualCost
    
    rows.push([
      role.title,
      role.icLevel,
      role.quantity,
      rate,
      hours,
      annualCost * role.quantity,
      annualCost * role.quantity,
      opt1Cost * role.quantity,
      opt2Cost * role.quantity
    ])
  })
  
  const ws = XLSX.utils.aoa_to_sheet(rows)
  
  ws['!cols'] = [
    { wch: 25 },
    { wch: 10 },
    { wch: 6 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ]
  
  return ws
}

// ==================== LCAT DEFINITIONS SHEET ====================

function createLCATSheet(data: ExportData): XLSX.WorkSheet {
  const rows: any[][] = []
  
  rows.push(['LABOR CATEGORY DESCRIPTIONS'])
  rows.push([])
  rows.push(['Labor Category', 'IC Level', 'Description', 'Education', 'Experience', 'BLS Code', 'BLS Title'])
  
  data.roles.forEach(role => {
    rows.push([
      role.title,
      role.icLevel,
      role.description,
      "Bachelor's Degree in relevant field or equivalent experience",
      role.yearsExperience || '4-7 years',
      role.blsCode || '15-1252',
      'Software Developers'
    ])
  })
  
  const ws = XLSX.utils.aoa_to_sheet(rows)
  
  ws['!cols'] = [
    { wch: 25 },
    { wch: 10 },
    { wch: 50 },
    { wch: 40 },
    { wch: 15 },
    { wch: 12 },
    { wch: 25 },
  ]
  
  return ws
}

// ==================== AUDIT PACKAGE SHEET ====================

function createAuditSheet(data: ExportData): XLSX.WorkSheet {
  const rows: any[][] = []
  
  rows.push(['RATE CALCULATION AUDIT WORKSHEET'])
  rows.push([])
  rows.push(['Source Documentation'])
  rows.push(['Indirect Rate Source:', data.indirectRates.source])
  rows.push(['Fiscal Year:', `FY${data.indirectRates.fiscalYear}`])
  rows.push(['Escalation Source:', 'BLS Employment Cost Index - Professional and Technical Services'])
  rows.push([])
  
  rows.push(['Indirect Rate Structure'])
  rows.push(['Rate Type', 'Percentage', 'Application'])
  rows.push(['Fringe Benefits', `${(data.indirectRates.fringe * 100).toFixed(4)}%`, 'Applied to base labor rate'])
  rows.push(['Overhead', `${(data.indirectRates.overhead * 100).toFixed(4)}%`, 'Applied after fringe'])
  rows.push(['G&A', `${(data.indirectRates.ga * 100).toFixed(4)}%`, 'Applied after overhead'])
  rows.push(['Profit', `${(data.profitMargin * 100).toFixed(2)}%`, 'Applied to total cost (T&M only)'])
  rows.push([])
  
  rows.push(['Rate Calculation Methodology'])
  rows.push(['Step', 'Formula', 'Description'])
  rows.push(['1', 'Base Salary ÷ 2080', 'Convert annual salary to hourly base rate'])
  rows.push(['2', 'Base Rate × (1 + Fringe)', 'Add fringe benefits'])
  rows.push(['3', 'After Fringe × (1 + OH)', 'Add overhead'])
  rows.push(['4', 'After OH × (1 + G&A)', 'Add G&A - this is Loaded Cost'])
  rows.push(['5', 'Loaded Cost × (1 + Profit)', 'Add profit margin for T&M billing rate'])
  rows.push([])
  
  rows.push(['Sample Rate Calculations'])
  rows.push(['Labor Category', 'Base Salary', 'Base Rate', 'After Fringe', 'After OH', 'After G&A (Cost)', 'With Profit (Bill Rate)'])
  
  data.roles.slice(0, 5).forEach(role => {
    const baseRate = role.baseSalary / 2080
    const afterFringe = baseRate * (1 + data.indirectRates.fringe)
    const afterOH = afterFringe * (1 + data.indirectRates.overhead)
    const afterGA = afterOH * (1 + data.indirectRates.ga)
    const withProfit = afterGA * (1 + data.profitMargin)
    
    rows.push([
      role.title,
      role.baseSalary,
      baseRate.toFixed(2),
      afterFringe.toFixed(2),
      afterOH.toFixed(2),
      afterGA.toFixed(2),
      withProfit.toFixed(2)
    ])
  })
  
  const ws = XLSX.utils.aoa_to_sheet(rows)
  
  ws['!cols'] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 20 },
  ]
  
  return ws
}

// ==================== MAIN EXPORT FUNCTION ====================

export async function generateExport(
  data: ExportData,
  options: ExportOptions,
  format: 'xlsx' | 'pdf' | 'docx'
): Promise<Blob> {
  // Calculate totals
  const totals = {
    baseYear: 0,
    option1: 0,
    option2: 0,
    subTotal: 0,
    odcTotal: 0,
    perDiemTotal: 0
  }
  
  data.roles.forEach(role => {
    const rate = data.calculateRate(role.baseSalary, true)
    const annual = rate * 2080 * role.quantity
    totals.baseYear += annual
    totals.option1 += annual * (1 + data.escalationRate)
    totals.option2 += annual * Math.pow(1 + data.escalationRate, 2)
  })

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new()
    
    // Add sheets based on options
    if (options.includeRateCard) {
      const rateCardWs = createRateCardSheet(data)
      XLSX.utils.book_append_sheet(wb, rateCardWs, 'Rate Card')
    }
    
    if (options.includeBOE) {
      const boeSummaryWs = createBOESummarySheet(data, totals)
      XLSX.utils.book_append_sheet(wb, boeSummaryWs, 'BoE Summary')
      
      const boeDetailWs = createBOEDetailSheet(data)
      XLSX.utils.book_append_sheet(wb, boeDetailWs, 'BoE Detail')
    }
    
    if (options.includeLCATs) {
      const lcatWs = createLCATSheet(data)
      XLSX.utils.book_append_sheet(wb, lcatWs, 'LCAT Definitions')
    }
    
    if (options.includeAuditPackage) {
      const auditWs = createAuditSheet(data)
      XLSX.utils.book_append_sheet(wb, auditWs, 'Audit Worksheet')
    }
    
    // Generate buffer
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }
  
  // For PDF and DOCX, we would need additional libraries
  // For now, fall back to Excel
  throw new Error(`Format ${format} not yet implemented. Please use Excel (.xlsx)`)
}

// ==================== DOWNLOAD HELPER ====================

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ==================== FORMAT CURRENCY FOR EXCEL ====================

export function formatCurrencyCell(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}