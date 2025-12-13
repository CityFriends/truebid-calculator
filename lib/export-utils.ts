// ============================================================================
// EXPORT UTILITIES - TrueBid Cost Proposal Document Generation
// Modern, Minimalist Professional Design
// ============================================================================

import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  Header, 
  Footer, 
  AlignmentType, 
  HeadingLevel, 
  BorderStyle, 
  WidthType,
  PageNumber,
  LevelFormat,
  ShadingType,
  PageBreak,
  convertInchesToTwip
} from 'docx'

// ============================================================================
// TYPES
// ============================================================================

export interface ExportRole {
  id: string
  title: string
  name?: string
  icLevel?: string
  baseSalary: number
  quantity: number
  description?: string
  blsCode?: string
  yearsExperience?: string
  allocatedHours?: number
  wbsCount?: number
}

export interface WBSElement {
  id: string
  wbsNumber: string
  title: string
  description: string
  hours: number
  laborBreakdown: {
    roleId: string
    roleName: string
    hours: number
    rationale?: string
  }[]
  estimateMethod: 'historical' | 'expert' | 'parametric' | 'analogous' | 'engineering'
  confidenceLevel: 'high' | 'medium' | 'low'
  assumptions?: string[]
  sooReference?: string
}

export interface ExportData {
  solicitation: string
  client: string
  proposalTitle: string
  preparedBy: string
  preparedDate: string
  companyName: string
  samUei?: string
  gsaContract?: string
  
  indirectRates: {
    fringe: number
    overhead: number
    ga: number
    source: string
    fiscalYear: string
  }
  profitMargin: number
  escalationRate: number
  productiveHours: number
  
  roles: ExportRole[]
  wbsElements?: WBSElement[]
  
  rateCardType: 'tm' | 'ffp' | 'hybrid'
  yearsToInclude: number
  includeEscalation: boolean
  
  calculateRate: (salary: number, includeProfit: boolean) => number
  calculateEscalatedRate: (rate: number, year: number) => number
}

export interface ExportOptions {
  includeRateCard: boolean
  includeBOE: boolean
  includeLCATs: boolean
  includeAuditPackage: boolean
}

// ============================================================================
// DESIGN SYSTEM - Modern Minimalist
// ============================================================================

const FONT = 'Arial' // Closest to Helvetica on Windows

const COLOR = {
  black: '000000',
  darkGray: '333333',
  mediumGray: '666666',
  lightGray: '999999',
  border: 'DDDDDD',
  headerBg: 'F8F8F8',
  accent: '0066CC',
}

// Font sizes in half-points
const SIZE = {
  title: 48,        // 24pt
  h1: 32,           // 16pt
  h2: 26,           // 13pt
  h3: 22,           // 11pt
  body: 20,         // 10pt
  small: 18,        // 9pt
  caption: 16,      // 8pt
}

const STYLES = {
  default: {
    document: {
      run: { font: FONT, size: SIZE.body, color: COLOR.darkGray },
    }
  },
  paragraphStyles: [
    {
      id: 'Title',
      name: 'Title',
      basedOn: 'Normal',
      run: { size: SIZE.title, color: COLOR.black, font: FONT },
      paragraph: { spacing: { after: 120 } }
    },
    {
      id: 'Heading1',
      name: 'Heading 1',
      basedOn: 'Normal',
      next: 'Normal',
      run: { size: SIZE.h1, bold: true, color: COLOR.black, font: FONT },
      paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
    },
    {
      id: 'Heading2',
      name: 'Heading 2',
      basedOn: 'Normal',
      next: 'Normal',
      run: { size: SIZE.h2, bold: true, color: COLOR.darkGray, font: FONT },
      paragraph: { spacing: { before: 300, after: 120 }, outlineLevel: 1 }
    },
    {
      id: 'BodyText',
      name: 'Body Text',
      basedOn: 'Normal',
      run: { size: SIZE.body, font: FONT, color: COLOR.darkGray },
      paragraph: { spacing: { after: 180, line: 276 } }
    },
  ]
}

const NUMBERING_CONFIG = [
  {
    reference: 'bullet-list',
    levels: [{
      level: 0,
      format: LevelFormat.BULLET,
      text: '•',
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } }
    }]
  }
]

// ============================================================================
// TABLE HELPERS - Modern Minimal Design
// ============================================================================

const noBorder = { style: BorderStyle.NONE, size: 0, color: COLOR.border }
const bottomBorder = { style: BorderStyle.SINGLE, size: 6, color: COLOR.border }
const topBorder = { style: BorderStyle.SINGLE, size: 6, color: COLOR.border }

function headerCell(text: string, width: number, align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: noBorder, left: noBorder, right: noBorder, bottom: bottomBorder },
    shading: { fill: COLOR.headerBg, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 80, right: 80 },
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, size: SIZE.small, bold: true, color: COLOR.mediumGray, font: FONT })]
    })]
  })
}

function dataCell(text: string, width: number, align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT, bold = false): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: noBorder, left: noBorder, right: noBorder, bottom: bottomBorder },
    margins: { top: 120, bottom: 120, left: 80, right: 80 },
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, size: SIZE.body, bold, color: bold ? COLOR.black : COLOR.darkGray, font: FONT })]
    })]
  })
}

function totalCell(text: string, width: number, align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: topBorder, left: noBorder, right: noBorder, bottom: noBorder },
    margins: { top: 120, bottom: 120, left: 80, right: 80 },
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, size: SIZE.body, bold: true, color: COLOR.black, font: FONT })]
    })]
  })
}

// ============================================================================
// FORMATTERS
// ============================================================================

function currency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function currencyK(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return currency(n)
}

function pct(n: number): string {
  return `${(n * 100).toFixed(2)}%`
}

function num(n: number): string {
  return n.toLocaleString('en-US')
}

function contractType(t: string): string {
  return { tm: 'Time & Materials', ffp: 'Firm Fixed Price', hybrid: 'Hybrid' }[t] || t
}

function fmtDate(d: string): string {
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }
  catch { return d }
}

function yearLabel(y: number): string {
  return y === 1 ? 'Base Year' : `Option ${y - 1}`
}

// ============================================================================
// DOCUMENT SECTIONS
// ============================================================================

function coverPage(data: ExportData): Paragraph[] {
  const items: Paragraph[] = []
  
  // Title
  items.push(new Paragraph({
    spacing: { before: 600, after: 80 },
    children: [new TextRun({ text: 'Cost Proposal', size: SIZE.title, color: COLOR.black, font: FONT })]
  }))
  
  // Subtitle - proposal title
  if (data.proposalTitle) {
    items.push(new Paragraph({
      spacing: { after: 400 },
      children: [new TextRun({ text: data.proposalTitle, size: SIZE.h2, color: COLOR.mediumGray, font: FONT })]
    }))
  }
  
  // Divider
  items.push(new Paragraph({
    spacing: { before: 200, after: 300 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR.border } },
    children: []
  }))
  
  // Company name
  items.push(new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text: data.companyName || data.preparedBy, size: SIZE.h1, bold: true, color: COLOR.black, font: FONT })]
  }))
  
  // Company details
  if (data.samUei) {
    items.push(new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'SAM UEI  ', size: SIZE.body, color: COLOR.lightGray, font: FONT }),
        new TextRun({ text: data.samUei, size: SIZE.body, color: COLOR.darkGray, font: FONT })
      ]
    }))
  }
  
  if (data.gsaContract) {
    items.push(new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'GSA Contract  ', size: SIZE.body, color: COLOR.lightGray, font: FONT }),
        new TextRun({ text: data.gsaContract, size: SIZE.body, color: COLOR.darkGray, font: FONT })
      ]
    }))
  }
  
  // Solicitation
  if (data.solicitation) {
    items.push(new Paragraph({
      spacing: { before: 200, after: 60 },
      children: [
        new TextRun({ text: 'Solicitation  ', size: SIZE.body, color: COLOR.lightGray, font: FONT }),
        new TextRun({ text: data.solicitation, size: SIZE.body, color: COLOR.darkGray, font: FONT })
      ]
    }))
  }
  
  // Client
  if (data.client) {
    items.push(new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'Prepared for  ', size: SIZE.body, color: COLOR.lightGray, font: FONT }),
        new TextRun({ text: data.client, size: SIZE.body, color: COLOR.darkGray, font: FONT })
      ]
    }))
  }
  
  // Date
  items.push(new Paragraph({
    spacing: { after: 200 },
    children: [
      new TextRun({ text: 'Date  ', size: SIZE.body, color: COLOR.lightGray, font: FONT }),
      new TextRun({ text: fmtDate(data.preparedDate), size: SIZE.body, color: COLOR.darkGray, font: FONT })
    ]
  }))
  
  items.push(new Paragraph({ children: [new PageBreak()] }))
  return items
}

function executiveSummary(data: ExportData): Paragraph[] {
  const items: Paragraph[] = []
  const totalFTEs = data.roles.reduce((s, r) => s + r.quantity, 0)
  
  // Calculate yearly totals
  const yearTotals: number[] = []
  for (let y = 1; y <= data.yearsToInclude; y++) {
    let total = 0
    data.roles.forEach(role => {
      const base = data.calculateRate(role.baseSalary, data.rateCardType !== 'ffp')
      const rate = y === 1 ? base : data.calculateEscalatedRate(base, y)
      total += rate * data.productiveHours * role.quantity
    })
    yearTotals.push(total)
  }
  const grandTotal = yearTotals.reduce((s, t) => s + t, 0)
  
  items.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Executive Summary')] }))
  
  items.push(new Paragraph({
    style: 'BodyText',
    children: [new TextRun(`This cost proposal presents our pricing for ${data.solicitation || 'the solicitation'}${data.client ? ` with ${data.client}` : ''}. We propose a ${contractType(data.rateCardType).toLowerCase()} arrangement with ${data.roles.length} labor categories over ${data.yearsToInclude} year${data.yearsToInclude > 1 ? 's' : ''}.`)]
  }))
  
  // Key metrics in a clean table
  const metricsRows: TableRow[] = [
    new TableRow({
      children: [
        headerCell('Total Value', 2400),
        headerCell('Duration', 2400),
        headerCell('Team Size', 2400),
        headerCell('Categories', 2400),
      ]
    }),
    new TableRow({
      children: [
        dataCell(currencyK(grandTotal), 2400, AlignmentType.LEFT, true),
        dataCell(`${data.yearsToInclude} Year${data.yearsToInclude > 1 ? 's' : ''}`, 2400, AlignmentType.LEFT, true),
        dataCell(`${totalFTEs} FTE${totalFTEs > 1 ? 's' : ''}`, 2400, AlignmentType.LEFT, true),
        dataCell(`${data.roles.length}`, 2400, AlignmentType.LEFT, true),
      ]
    })
  ]
  
  items.push(
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    new Table({ columnWidths: [2400, 2400, 2400, 2400], rows: metricsRows })
  )
  
  // Pricing by year
  items.push(new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun('Pricing by Period')]
  }))
  
  const pricingRows: TableRow[] = [
    new TableRow({
      children: [
        headerCell('Period', 4000),
        headerCell('Hours', 2500, AlignmentType.RIGHT),
        headerCell('Cost', 3000, AlignmentType.RIGHT),
      ]
    })
  ]
  
  yearTotals.forEach((total, i) => {
    pricingRows.push(new TableRow({
      children: [
        dataCell(yearLabel(i + 1), 4000),
        dataCell(num(data.productiveHours * totalFTEs), 2500, AlignmentType.RIGHT),
        dataCell(currency(total), 3000, AlignmentType.RIGHT),
      ]
    }))
  })
  
  pricingRows.push(new TableRow({
    children: [
      totalCell('Total Contract Value', 4000),
      totalCell('', 2500),
      totalCell(currency(grandTotal), 3000, AlignmentType.RIGHT),
    ]
  }))
  
  items.push(
    new Paragraph({ spacing: { before: 160 }, children: [] }),
    new Table({ columnWidths: [4000, 2500, 3000], rows: pricingRows }),
    new Paragraph({
      spacing: { before: 120 },
      children: [new TextRun({ text: `Based on ${num(data.productiveHours)} productive hours per FTE per year${data.includeEscalation && data.yearsToInclude > 1 ? `, ${pct(data.escalationRate)} annual escalation` : ''}.`, size: SIZE.small, color: COLOR.lightGray, italics: true, font: FONT })]
    })
  )
  
  return items
}

function rateCard(data: ExportData): Paragraph[] {
  const items: Paragraph[] = []
  
  items.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Rate Card')] }))
  items.push(new Paragraph({
    style: 'BodyText',
    children: [new TextRun(`Fully burdened hourly rates by labor category under ${contractType(data.rateCardType).toLowerCase()} pricing.`)]
  }))
  
  // Header
  const headerCells = [headerCell('Labor Category', 3500), headerCell('Level', 1000, AlignmentType.CENTER)]
  for (let y = 1; y <= data.yearsToInclude; y++) {
    headerCells.push(headerCell(yearLabel(y), 1500, AlignmentType.RIGHT))
  }
  
  const rows: TableRow[] = [new TableRow({ children: headerCells })]
  
  // Data rows
  data.roles.forEach(role => {
    const base = data.calculateRate(role.baseSalary, data.rateCardType !== 'ffp')
    const cells = [
      dataCell(role.title || role.name || '', 3500),
      dataCell(role.icLevel || '—', 1000, AlignmentType.CENTER),
    ]
    for (let y = 1; y <= data.yearsToInclude; y++) {
      const rate = y === 1 ? base : data.calculateEscalatedRate(base, y)
      cells.push(dataCell(currency(rate), 1500, AlignmentType.RIGHT))
    }
    rows.push(new TableRow({ children: cells }))
  })
  
  const widths = [3500, 1000, ...Array(data.yearsToInclude).fill(1500)]
  
  items.push(
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    new Table({ columnWidths: widths, rows }),
    new Paragraph({
      spacing: { before: 120 },
      children: [new TextRun({ text: `Indirect rates: Fringe ${pct(data.indirectRates.fringe)}, OH ${pct(data.indirectRates.overhead)}, G&A ${pct(data.indirectRates.ga)}${data.rateCardType !== 'ffp' ? `, Profit ${pct(data.profitMargin)}` : ''} (${data.indirectRates.source} FY${data.indirectRates.fiscalYear})`, size: SIZE.small, color: COLOR.lightGray, italics: true, font: FONT })]
    })
  )
  
  return items
}

function basisOfEstimate(data: ExportData): Paragraph[] {
  const items: Paragraph[] = []
  const totalFTEs = data.roles.reduce((s, r) => s + r.quantity, 0)
  
  items.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Basis of Estimate')] }))
  items.push(new Paragraph({
    style: 'BodyText',
    children: [new TextRun('Labor cost breakdown by category and performance period.')]
  }))
  
  // Labor Summary Table
  const headerCells = [
    headerCell('Labor Category', 2800),
    headerCell('Qty', 700, AlignmentType.CENTER),
    headerCell('Rate/Hr', 1200, AlignmentType.RIGHT),
  ]
  for (let y = 1; y <= data.yearsToInclude; y++) {
    headerCells.push(headerCell(y === 1 ? 'Base Year' : `OY${y-1}`, 1500, AlignmentType.RIGHT))
  }
  
  const rows: TableRow[] = [new TableRow({ children: headerCells })]
  const yearTotals: number[] = Array(data.yearsToInclude).fill(0)
  
  data.roles.forEach(role => {
    const base = data.calculateRate(role.baseSalary, data.rateCardType !== 'ffp')
    const cells = [
      dataCell(role.title || role.name || '', 2800),
      dataCell(role.quantity.toString(), 700, AlignmentType.CENTER),
      dataCell(currency(base), 1200, AlignmentType.RIGHT),
    ]
    for (let y = 1; y <= data.yearsToInclude; y++) {
      const rate = y === 1 ? base : data.calculateEscalatedRate(base, y)
      const cost = rate * data.productiveHours * role.quantity
      yearTotals[y - 1] += cost
      cells.push(dataCell(currency(cost), 1500, AlignmentType.RIGHT))
    }
    rows.push(new TableRow({ children: cells }))
  })
  
  // Total row
  const totalCells = [totalCell('Total', 2800), totalCell('', 700), totalCell('', 1200)]
  yearTotals.forEach(t => totalCells.push(totalCell(currency(t), 1500, AlignmentType.RIGHT)))
  rows.push(new TableRow({ children: totalCells }))
  
  const widths = [2800, 700, 1200, ...Array(data.yearsToInclude).fill(1500)]
  
  items.push(
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    new Table({ columnWidths: widths, rows }),
    new Paragraph({
      spacing: { before: 120 },
      children: [new TextRun({ text: `${num(data.productiveHours)} productive hours per FTE per year.`, size: SIZE.small, color: COLOR.lightGray, italics: true, font: FONT })]
    })
  )
  
  // WBS Elements Section - Detailed Breakdown
  if (data.wbsElements && data.wbsElements.length > 0) {
    items.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Work Breakdown Structure')] }))
    items.push(new Paragraph({
      style: 'BodyText',
      children: [new TextRun(`Detailed breakdown of ${data.wbsElements.length} work elements totaling ${num(data.wbsElements.reduce((s, e) => s + e.hours, 0))} hours.`)]
    }))
    
    data.wbsElements.forEach((element, idx) => {
      // WBS Header with number and title
      items.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: idx === 0 ? 200 : 360 },
        children: [
          new TextRun({ text: `${element.wbsNumber}  `, color: COLOR.lightGray, font: FONT }),
          new TextRun({ text: element.title, font: FONT })
        ]
      }))
      
      // Metadata line: method, confidence, SOO ref
      const metaParts: string[] = []
      metaParts.push(`${element.estimateMethod} estimate`)
      metaParts.push(`${element.confidenceLevel} confidence`)
      if (element.sooReference) metaParts.push(`Ref: ${element.sooReference}`)
      
      items.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: metaParts.join('  ·  '), size: SIZE.small, color: COLOR.lightGray, font: FONT })]
      }))
      
      // Description
      items.push(new Paragraph({
        style: 'BodyText',
        children: [new TextRun(element.description)]
      }))
      
      // Total hours summary
      items.push(new Paragraph({
        spacing: { before: 120, after: 80 },
        children: [
          new TextRun({ text: 'Total Hours: ', bold: true, size: SIZE.body, color: COLOR.darkGray, font: FONT }),
          new TextRun({ text: `${num(element.hours)}`, size: SIZE.body, color: COLOR.darkGray, font: FONT })
        ]
      }))
      
      // Labor Allocation Table with hours by period
      if (element.laborBreakdown && element.laborBreakdown.length > 0) {
        items.push(new Paragraph({
          spacing: { before: 160, after: 80 },
          children: [new TextRun({ text: 'Labor Allocation', bold: true, size: SIZE.body, color: COLOR.darkGray, font: FONT })]
        }))
        
        // Build header with year columns
        const laborHeaderCells = [
          headerCell('Role', 2200),
          headerCell('Total', 1000, AlignmentType.RIGHT),
        ]
        for (let y = 1; y <= data.yearsToInclude; y++) {
          laborHeaderCells.push(headerCell(y === 1 ? 'Base' : `OY${y-1}`, 900, AlignmentType.RIGHT))
        }
        laborHeaderCells.push(headerCell('Rationale', 3500))
        
        const laborRows: TableRow[] = [new TableRow({ children: laborHeaderCells })]
        
        element.laborBreakdown.forEach(labor => {
          // Calculate hours per year (even distribution or use period-specific if available)
          const hoursPerYear = Math.round(labor.hours / data.yearsToInclude)
          
          const rowCells = [
            dataCell(labor.roleName, 2200),
            dataCell(num(labor.hours), 1000, AlignmentType.RIGHT, true),
          ]
          for (let y = 1; y <= data.yearsToInclude; y++) {
            rowCells.push(dataCell(num(hoursPerYear), 900, AlignmentType.RIGHT))
          }
          rowCells.push(dataCell(labor.rationale || '—', 3500))
          
          laborRows.push(new TableRow({ children: rowCells }))
        })
        
        // Calculate column widths
        const laborWidths = [2200, 1000, ...Array(data.yearsToInclude).fill(900), 3500]
        
        items.push(new Table({ columnWidths: laborWidths, rows: laborRows }))
      }
      
      // Assumptions
      if (element.assumptions && element.assumptions.length > 0) {
        items.push(new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [new TextRun({ text: 'Assumptions', bold: true, size: SIZE.body, color: COLOR.darkGray, font: FONT })]
        }))
        
        element.assumptions.forEach(assumption => {
          items.push(new Paragraph({
            numbering: { reference: 'bullet-list', level: 0 },
            children: [new TextRun({ text: assumption, size: SIZE.body, color: COLOR.darkGray, font: FONT })]
          }))
        })
      }
    })
  }
  
  return items
}

function laborCategories(data: ExportData): Paragraph[] {
  const items: Paragraph[] = []
  
  // Calculate hours from WBS
  const roleHours: Record<string, number> = {}
  data.wbsElements?.forEach(el => {
    el.laborBreakdown.forEach(lb => {
      roleHours[lb.roleName] = (roleHours[lb.roleName] || 0) + lb.hours
    })
  })
  
  items.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Labor Categories')] }))
  items.push(new Paragraph({
    style: 'BodyText',
    children: [new TextRun('Qualifications and responsibilities for each proposed labor category.')]
  }))
  
  data.roles.forEach(role => {
    const name = role.title || role.name || ''
    const rate = data.calculateRate(role.baseSalary, data.rateCardType !== 'ffp')
    const hours = roleHours[name] || 0
    
    items.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun(name)]
    }))
    
    // Metadata line
    const meta = [`${role.icLevel || 'N/A'}`, `${currency(rate)}/hr`]
    if (role.quantity > 1) meta.push(`${role.quantity} positions`)
    if (hours > 0) meta.push(`${num(hours)} hours allocated`)
    
    items.push(new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: meta.join('  ·  '), size: SIZE.small, color: COLOR.lightGray, font: FONT })]
    }))
    
    if (role.description) {
      items.push(new Paragraph({ style: 'BodyText', children: [new TextRun(role.description)] }))
    }
    
    if (role.yearsExperience) {
      items.push(new Paragraph({
        style: 'BodyText',
        children: [new TextRun({ text: 'Experience: ', bold: true }), new TextRun(role.yearsExperience)]
      }))
    }
    
    if (role.blsCode) {
      items.push(new Paragraph({
        style: 'BodyText',
        children: [new TextRun({ text: 'BLS Code: ', bold: true }), new TextRun(role.blsCode)]
      }))
    }
  })
  
  return items
}

function rateCalculation(data: ExportData): Paragraph[] {
  const items: Paragraph[] = []
  
  items.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Rate Calculation')] }))
  items.push(new Paragraph({
    style: 'BodyText',
    children: [new TextRun('Detailed rate buildup demonstrating FAR 31.2 compliance.')]
  }))
  
  items.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Methodology')] }))
  
  const steps = [
    'Direct Rate = Annual Salary ÷ 2,080 hours',
    `+ Fringe @ ${pct(data.indirectRates.fringe)}`,
    `+ Overhead @ ${pct(data.indirectRates.overhead)}`,
    `+ G&A @ ${pct(data.indirectRates.ga)}`,
  ]
  if (data.rateCardType !== 'ffp') steps.push(`+ Profit @ ${pct(data.profitMargin)}`)
  
  steps.forEach(step => {
    items.push(new Paragraph({
      numbering: { reference: 'bullet-list', level: 0 },
      children: [new TextRun({ text: step, size: SIZE.body, color: COLOR.darkGray, font: FONT })]
    }))
  })
  
  items.push(new Paragraph({
    spacing: { before: 120 },
    children: [new TextRun({ text: `Source: ${data.indirectRates.source} FY${data.indirectRates.fiscalYear}`, size: SIZE.small, color: COLOR.lightGray, italics: true, font: FONT })]
  }))
  
  // Rate buildup table
  items.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Rate Buildup')] }))
  
  const rows: TableRow[] = [
    new TableRow({
      children: [
        headerCell('Category', 2200),
        headerCell('Direct', 1300, AlignmentType.RIGHT),
        headerCell('+Fringe', 1300, AlignmentType.RIGHT),
        headerCell('+OH', 1300, AlignmentType.RIGHT),
        headerCell('+G&A', 1300, AlignmentType.RIGHT),
        headerCell('Final', 1300, AlignmentType.RIGHT),
      ]
    })
  ]
  
  data.roles.forEach(role => {
    const direct = role.baseSalary / 2080
    const fringe = direct * (1 + data.indirectRates.fringe)
    const oh = fringe * (1 + data.indirectRates.overhead)
    const ga = oh * (1 + data.indirectRates.ga)
    const final = data.rateCardType !== 'ffp' ? ga * (1 + data.profitMargin) : ga
    
    rows.push(new TableRow({
      children: [
        dataCell(role.title || role.name || '', 2200),
        dataCell(currency(direct), 1300, AlignmentType.RIGHT),
        dataCell(currency(fringe), 1300, AlignmentType.RIGHT),
        dataCell(currency(oh), 1300, AlignmentType.RIGHT),
        dataCell(currency(ga), 1300, AlignmentType.RIGHT),
        dataCell(currency(final), 1300, AlignmentType.RIGHT, true),
      ]
    }))
  })
  
  items.push(
    new Paragraph({ spacing: { before: 160 }, children: [] }),
    new Table({ columnWidths: [2200, 1300, 1300, 1300, 1300, 1300], rows })
  )
  
  return items
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export async function generateWordDocument(data: ExportData, options: ExportOptions): Promise<Blob> {
  const content: Paragraph[] = []
  
  content.push(...coverPage(data))
  if (data.roles.length > 0) content.push(...executiveSummary(data))
  if (options.includeRateCard && data.roles.length > 0) content.push(...rateCard(data))
  if (options.includeBOE && data.roles.length > 0) content.push(...basisOfEstimate(data))
  if (options.includeLCATs && data.roles.length > 0) content.push(...laborCategories(data))
  if (options.includeAuditPackage && data.roles.length > 0) content.push(...rateCalculation(data))
  
  const doc = new Document({
    styles: STYLES,
    numbering: { config: NUMBERING_CONFIG },
    sections: [{
      properties: {
        page: { margin: { top: convertInchesToTwip(0.75), right: convertInchesToTwip(0.75), bottom: convertInchesToTwip(0.75), left: convertInchesToTwip(0.75) } }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `${data.companyName}  ·  ${data.solicitation || 'Cost Proposal'}`, size: SIZE.caption, color: COLOR.lightGray, font: FONT })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Page ', size: SIZE.caption, color: COLOR.lightGray, font: FONT }),
              new TextRun({ children: [PageNumber.CURRENT], size: SIZE.caption, color: COLOR.lightGray, font: FONT }),
              new TextRun({ text: ' of ', size: SIZE.caption, color: COLOR.lightGray, font: FONT }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: SIZE.caption, color: COLOR.lightGray, font: FONT }),
            ]
          })]
        })
      },
      children: content
    }]
  })
  
  const buffer = await Packer.toBuffer(doc)
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}

export async function generateExport(data: ExportData, options: ExportOptions, format: 'xlsx' | 'pdf' | 'docx'): Promise<Blob> {
  if (format === 'docx' || format === 'pdf') return generateWordDocument(data, options)
  if (format === 'xlsx') return generateCSV(data, options)
  throw new Error(`Unsupported format: ${format}`)
}

function generateCSV(data: ExportData, options: ExportOptions): Blob {
  const lines: string[] = []
  lines.push(`"Cost Proposal - ${data.solicitation || 'Export'}"`)
  lines.push(`"${data.companyName}","${data.client}","${data.preparedDate}"`)
  lines.push('')
  
  if (options.includeRateCard) {
    lines.push('"RATE CARD"')
    const h = ['Labor Category', 'Level', 'Qty', 'Salary']
    for (let y = 1; y <= data.yearsToInclude; y++) h.push(`${yearLabel(y)} Rate`, `${yearLabel(y)} Cost`)
    lines.push(h.map(x => `"${x}"`).join(','))
    
    data.roles.forEach(r => {
      const base = data.calculateRate(r.baseSalary, data.rateCardType !== 'ffp')
      const row = [r.title || r.name || '', r.icLevel || '', r.quantity, r.baseSalary]
      for (let y = 1; y <= data.yearsToInclude; y++) {
        const rate = y === 1 ? base : data.calculateEscalatedRate(base, y)
        row.push(rate.toFixed(2), (rate * data.productiveHours * r.quantity).toFixed(2))
      }
      lines.push(row.map(x => `"${x}"`).join(','))
    })
  }
  
  return new Blob([lines.join('\n')], { type: 'text/csv' })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface GoogleDriveUploadResult { fileId: string; webViewLink: string; fileName: string }

export async function uploadToGoogleDrive(blob: Blob, fileName: string, accessToken: string, folderId?: string): Promise<GoogleDriveUploadResult> {
  const metadata: Record<string, unknown> = { name: fileName, mimeType: blob.type }
  if (folderId) metadata.parents = [folderId]
  
  const boundary = '-------314159265358979323846'
  const body = `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${blob.type}\r\nContent-Transfer-Encoding: base64\r\n\r\n${btoa(new Uint8Array(await blob.arrayBuffer()).reduce((d, b) => d + String.fromCharCode(b), ''))}\r\n--${boundary}--`
  
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,name', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body
  })
  
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`)
  const r = await res.json()
  return { fileId: r.id, webViewLink: r.webViewLink, fileName: r.name }
}