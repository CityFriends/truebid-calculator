// TrueBid Export Utilities
// Professional government proposal document generation
// Design: Clean typography, generous white space, minimal tables

interface RoleExport {
  id: string
  title: string
  icLevel: string
  baseSalary: number
  quantity: number
  description?: string
  blsCode?: string
  yearsExperience?: string
}

interface ExportData {
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
  
  roles: RoleExport[]
  
  calculateRate: (salary: number, includeProfit: boolean) => number
  calculateEscalatedRate: (rate: number, year: number) => number
  
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

type ExportFormat = 'xlsx' | 'pdf' | 'docx'

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const DESIGN = {
  // Typography
  fonts: {
    primary: 'Helvetica Neue',
    fallback: 'Arial',
  },
  
  // Font sizes (in half-points, so 24 = 12pt)
  fontSize: {
    title: 56,        // 28pt - Document title
    subtitle: 28,     // 14pt - Subtitle/tagline
    h1: 36,           // 18pt - Section headers
    h2: 28,           // 14pt - Subsection headers
    body: 22,         // 11pt - Body text
    small: 20,        // 10pt - Captions, metadata
    tiny: 18,         // 9pt - Footer, fine print
  },
  
  // Colors - Minimal, professional palette
  colors: {
    primary: '1a1a1a',      // Near black - main text
    secondary: '6b7280',    // Gray 500 - secondary text
    muted: '9ca3af',        // Gray 400 - metadata, captions
    accent: '2563eb',       // Blue 600 - links, highlights
    
    // Table colors
    tableHeader: 'f8fafc',  // Slate 50 - very subtle header bg
    tableAlt: 'fafafa',     // Nearly white alt rows
    tableBorder: 'e5e7eb',  // Gray 200 - subtle borders
  },
  
  // Spacing (in twips: 1440 twips = 1 inch)
  spacing: {
    marginPage: 1800,       // 1.25" margins
    paragraphAfter: 240,    // ~0.17" after paragraphs
    sectionGap: 480,        // ~0.33" between sections
    headingBefore: 400,     // Space before headings
    headingAfter: 200,      // Space after headings
  }
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export async function generateExport(
  data: ExportData,
  options: ExportOptions,
  format: ExportFormat
): Promise<Blob> {
  switch (format) {
    case 'xlsx':
      return generateCSVExport(data, options)
    case 'docx':
    case 'pdf':
      return generateWordExport(data, options)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

// ============================================================================
// CSV EXPORT (unchanged - no styling possible)
// ============================================================================

function generateCSVExport(data: ExportData, options: ExportOptions): Promise<Blob> {
  const sections: string[] = []
  
  sections.push(`TrueBid Export - ${data.proposalTitle || 'Proposal'}`)
  sections.push(`Solicitation: ${data.solicitation || 'N/A'}`)
  sections.push(`Client: ${data.client || 'N/A'}`)
  sections.push(`Prepared By: ${data.preparedBy}`)
  sections.push(`Date: ${data.preparedDate}`)
  sections.push('')
  
  if (options.includeRateCard) {
    sections.push('RATE CARD')
    sections.push('')
    
    const headers = ['Labor Category', 'Level', 'Base Salary', 'Base Year Rate']
    for (let y = 2; y <= data.yearsToInclude; y++) {
      headers.push(`Option ${y - 1} Rate`)
    }
    sections.push(headers.join(','))
    
    data.roles.forEach(role => {
      const includeProfit = data.rateCardType !== 'ffp'
      const baseRate = data.calculateRate(role.baseSalary, includeProfit)
      
      const row = [
        `"${role.title}"`,
        role.icLevel,
        role.baseSalary.toFixed(2),
        baseRate.toFixed(2)
      ]
      
      for (let y = 2; y <= data.yearsToInclude; y++) {
        const escalatedRate = data.includeEscalation 
          ? data.calculateEscalatedRate(baseRate, y)
          : baseRate
        row.push(escalatedRate.toFixed(2))
      }
      
      sections.push(row.join(','))
    })
    sections.push('')
  }
  
  if (options.includeBOE) {
    sections.push('BASIS OF ESTIMATE')
    sections.push('')
    sections.push('Labor Category,Qty,Base Salary,Hourly Rate,Annual Hours,Base Year Cost')
    
    let totalBaseCost = 0
    data.roles.forEach(role => {
      const rate = data.calculateRate(role.baseSalary, data.rateCardType !== 'ffp')
      const annualCost = rate * 2080 * role.quantity
      totalBaseCost += annualCost
      
      sections.push([
        `"${role.title}"`,
        role.quantity,
        role.baseSalary.toFixed(2),
        rate.toFixed(2),
        2080,
        annualCost.toFixed(2)
      ].join(','))
    })
    
    sections.push('')
    sections.push(`Total Base Year Labor:,${totalBaseCost.toFixed(2)}`)
    sections.push('')
  }
  
  if (options.includeLCATs) {
    sections.push('LABOR CATEGORY DESCRIPTIONS')
    sections.push('')
    sections.push('Labor Category,Level,Description,BLS Code,Years Experience')
    
    data.roles.forEach(role => {
      sections.push([
        `"${role.title}"`,
        role.icLevel,
        `"${(role.description || '').replace(/"/g, '""')}"`,
        role.blsCode || '',
        role.yearsExperience || ''
      ].join(','))
    })
    sections.push('')
  }
  
  const content = sections.join('\n')
  return Promise.resolve(new Blob([content], { type: 'text/csv;charset=utf-8;' }))
}

// ============================================================================
// WORD EXPORT - POLISHED DESIGN
// ============================================================================

async function generateWordExport(data: ExportData, options: ExportOptions): Promise<Blob> {
  const docx = await import('docx')
  const { 
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, AlignmentType, BorderStyle, WidthType,
    ShadingType, PageNumber, PageBreak, convertInchesToTwip
  } = docx
  
  const D = DESIGN
  const font = D.fonts.primary
  
  // ---------------------------------------------------------------------------
  // HELPER: Create styled text
  // ---------------------------------------------------------------------------
  const text = (content: string, opts: {
    size?: number
    bold?: boolean
    color?: string
    italic?: boolean
    allCaps?: boolean
  } = {}) => new TextRun({
    text: content,
    font,
    size: opts.size || D.fontSize.body,
    bold: opts.bold,
    color: opts.color || D.colors.primary,
    italics: opts.italic,
    allCaps: opts.allCaps,
  })
  
  // ---------------------------------------------------------------------------
  // HELPER: Create paragraph with proper spacing
  // ---------------------------------------------------------------------------
  const para = (content: TextRun | TextRun[], opts: {
    align?: typeof AlignmentType[keyof typeof AlignmentType]
    spaceBefore?: number
    spaceAfter?: number
    indent?: number
  } = {}) => new Paragraph({
    children: Array.isArray(content) ? content : [content],
    alignment: opts.align || AlignmentType.LEFT,
    spacing: {
      before: opts.spaceBefore ?? 0,
      after: opts.spaceAfter ?? D.spacing.paragraphAfter,
      line: 276, // 1.15 line spacing
    },
    indent: opts.indent ? { left: opts.indent } : undefined,
  })
  
  // ---------------------------------------------------------------------------
  // HELPER: Section heading (H1)
  // ---------------------------------------------------------------------------
  const sectionHeading = (title: string) => new Paragraph({
    children: [text(title.toUpperCase(), { 
      size: D.fontSize.h1, 
      bold: true, 
      color: D.colors.primary,
      allCaps: true 
    })],
    spacing: { 
      before: D.spacing.headingBefore, 
      after: D.spacing.headingAfter,
      line: 276,
    },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: D.colors.tableBorder }
    }
  })
  
  // ---------------------------------------------------------------------------
  // HELPER: Subsection heading (H2)
  // ---------------------------------------------------------------------------
  const subHeading = (title: string) => new Paragraph({
    children: [text(title, { size: D.fontSize.h2, bold: true, color: D.colors.secondary })],
    spacing: { before: 300, after: 150, line: 276 },
  })
  
  // ---------------------------------------------------------------------------
  // HELPER: Create clean table cell
  // ---------------------------------------------------------------------------
  const cell = (content: string, opts: {
    width?: number
    bold?: boolean
    align?: typeof AlignmentType[keyof typeof AlignmentType]
    shading?: string
    isHeader?: boolean
    isNumber?: boolean
  } = {}) => {
    return new TableCell({
      width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
      shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
      margins: {
        top: convertInchesToTwip(0.08),
        bottom: convertInchesToTwip(0.08),
        left: convertInchesToTwip(0.12),
        right: convertInchesToTwip(0.12),
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: D.colors.tableBorder },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: D.colors.tableBorder },
        left: { style: BorderStyle.NIL },
        right: { style: BorderStyle.NIL },
      },
      children: [new Paragraph({
        alignment: opts.align || (opts.isNumber ? AlignmentType.RIGHT : AlignmentType.LEFT),
        spacing: { after: 0 },
        children: [text(content, {
          size: opts.isHeader ? D.fontSize.small : D.fontSize.body,
          bold: opts.bold || opts.isHeader,
          color: opts.isHeader ? D.colors.secondary : D.colors.primary,
        })]
      })]
    })
  }
  
  // ---------------------------------------------------------------------------
  // HELPER: Currency formatter
  // ---------------------------------------------------------------------------
  const currency = (val: number) => 
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  
  // ---------------------------------------------------------------------------
  // BUILD DOCUMENT
  // ---------------------------------------------------------------------------
  const children: any[] = []
  
  // ===========================================================================
  // COVER PAGE
  // ===========================================================================
  
  // Spacer to push content down
  children.push(para(text(''), { spaceAfter: 2400 }))
  
  // Document type label
  children.push(para(
    text('COST PROPOSAL', { size: D.fontSize.small, color: D.colors.muted, allCaps: true }),
    { align: AlignmentType.CENTER, spaceAfter: 200 }
  ))
  
  // Main title
  children.push(para(
    text(data.proposalTitle || 'Proposal', { size: D.fontSize.title, bold: true }),
    { align: AlignmentType.CENTER, spaceAfter: 300 }
  ))
  
  // Solicitation
  if (data.solicitation) {
    children.push(para(
      text(`Solicitation ${data.solicitation}`, { size: D.fontSize.subtitle, color: D.colors.secondary }),
      { align: AlignmentType.CENTER, spaceAfter: 120 }
    ))
  }
  
  // Client
  if (data.client) {
    children.push(para(
      text(data.client, { size: D.fontSize.body, color: D.colors.secondary }),
      { align: AlignmentType.CENTER, spaceAfter: 600 }
    ))
  }
  
  // Divider line
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 400 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: D.colors.tableBorder }
    },
    children: []
  }))
  
  // Company name
  children.push(para(
    text(data.companyName, { size: D.fontSize.h2, bold: true }),
    { align: AlignmentType.CENTER, spaceAfter: 120 }
  ))
  
  // SAM UEI if available
  if (data.samUei) {
    children.push(para(
      text(`SAM UEI: ${data.samUei}`, { size: D.fontSize.small, color: D.colors.muted }),
      { align: AlignmentType.CENTER, spaceAfter: 60 }
    ))
  }
  
  // GSA Contract if available
  if (data.gsaContract) {
    children.push(para(
      text(`GSA Contract: ${data.gsaContract}`, { size: D.fontSize.small, color: D.colors.muted }),
      { align: AlignmentType.CENTER, spaceAfter: 200 }
    ))
  }
  
  // Spacer
  children.push(para(text(''), { spaceAfter: 800 }))
  
  // Prepared info
  children.push(para(
    text(`Prepared by ${data.preparedBy}`, { size: D.fontSize.small, color: D.colors.secondary }),
    { align: AlignmentType.CENTER, spaceAfter: 60 }
  ))
  
  children.push(para(
    text(formatDate(data.preparedDate), { size: D.fontSize.small, color: D.colors.muted }),
    { align: AlignmentType.CENTER, spaceAfter: 0 }
  ))
  
  children.push(new Paragraph({ children: [new PageBreak()] }))
  
  // ===========================================================================
  // RATE CARD
  // ===========================================================================
  
  if (options.includeRateCard && data.roles.length > 0) {
    children.push(sectionHeading('Rate Card'))
    
    // Description text
    const rateTypeLabel = data.rateCardType === 'tm' ? 'Time & Materials' :
                          data.rateCardType === 'ffp' ? 'Firm Fixed Price' : 'GSA Schedule'
    
    children.push(para(
      text(`${rateTypeLabel} rates${data.includeEscalation ? ` with ${(data.escalationRate * 100).toFixed(1)}% annual escalation` : ''}.`, 
        { size: D.fontSize.body, color: D.colors.secondary }),
      { spaceAfter: 300 }
    ))
    
    // Calculate column widths
    const colWidths = {
      category: 3600,
      level: 1200,
      rate: 1600,
    }
    
    // Build header row
    const headerCells = [
      cell('Labor Category', { width: colWidths.category, isHeader: true }),
      cell('Level', { width: colWidths.level, isHeader: true, align: AlignmentType.CENTER }),
      cell('Base Year', { width: colWidths.rate, isHeader: true, align: AlignmentType.RIGHT }),
    ]
    
    for (let y = 2; y <= data.yearsToInclude; y++) {
      headerCells.push(cell(`Option ${y - 1}`, { width: colWidths.rate, isHeader: true, align: AlignmentType.RIGHT }))
    }
    
    const headerRow = new TableRow({
      tableHeader: true,
      children: headerCells
    })
    
    // Build data rows
    const dataRows = data.roles.map((role, idx) => {
      const includeProfit = data.rateCardType !== 'ffp'
      const baseRate = data.calculateRate(role.baseSalary, includeProfit)
      const bgColor = idx % 2 === 1 ? D.colors.tableAlt : undefined
      
      const cells = [
        cell(role.title, { width: colWidths.category, shading: bgColor }),
        cell(role.icLevel, { width: colWidths.level, shading: bgColor, align: AlignmentType.CENTER }),
        cell(currency(baseRate), { width: colWidths.rate, shading: bgColor, isNumber: true }),
      ]
      
      for (let y = 2; y <= data.yearsToInclude; y++) {
        const rate = data.includeEscalation
          ? data.calculateEscalatedRate(baseRate, y)
          : baseRate
        cells.push(cell(currency(rate), { width: colWidths.rate, shading: bgColor, isNumber: true }))
      }
      
      return new TableRow({ children: cells })
    })
    
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows]
    }))
    
    // Rate basis footnote
    children.push(para([
      text('Rates calculated using ', { size: D.fontSize.small, color: D.colors.muted }),
      text(`${data.indirectRates.source} FY${data.indirectRates.fiscalYear}`, { size: D.fontSize.small, color: D.colors.muted, italic: true }),
      text(` indirect rates: Fringe ${(data.indirectRates.fringe * 100).toFixed(2)}%, `, { size: D.fontSize.small, color: D.colors.muted }),
      text(`Overhead ${(data.indirectRates.overhead * 100).toFixed(2)}%, `, { size: D.fontSize.small, color: D.colors.muted }),
      text(`G&A ${(data.indirectRates.ga * 100).toFixed(2)}%`, { size: D.fontSize.small, color: D.colors.muted }),
      text(data.rateCardType !== 'ffp' ? `, Profit ${(data.profitMargin * 100).toFixed(1)}%` : '', { size: D.fontSize.small, color: D.colors.muted }),
    ], { spaceBefore: 200, spaceAfter: 0 }))
    
    children.push(new Paragraph({ children: [new PageBreak()] }))
  }
  
  // ===========================================================================
  // BASIS OF ESTIMATE
  // ===========================================================================
  
  if (options.includeBOE && data.roles.length > 0) {
    children.push(sectionHeading('Basis of Estimate'))
    
    children.push(para(
      text('Annual labor cost summary by category for the base performance period.', 
        { size: D.fontSize.body, color: D.colors.secondary }),
      { spaceAfter: 300 }
    ))
    
    let totalCost = 0
    const boeRows = data.roles.map((role, idx) => {
      const rate = data.calculateRate(role.baseSalary, data.rateCardType !== 'ffp')
      const annualCost = rate * 2080 * role.quantity
      totalCost += annualCost
      const bgColor = idx % 2 === 1 ? D.colors.tableAlt : undefined
      
      return new TableRow({
        children: [
          cell(role.title, { width: 3200, shading: bgColor }),
          cell(role.quantity.toString(), { width: 800, shading: bgColor, align: AlignmentType.CENTER }),
          cell(currency(role.baseSalary), { width: 1600, shading: bgColor, isNumber: true }),
          cell(currency(rate), { width: 1400, shading: bgColor, isNumber: true }),
          cell(currency(annualCost), { width: 1800, shading: bgColor, isNumber: true, bold: true }),
        ]
      })
    })
    
    // Total row
    const totalRow = new TableRow({
      children: [
        cell('Total Base Year', { width: 3200, bold: true, shading: D.colors.tableHeader }),
        cell('', { width: 800, shading: D.colors.tableHeader }),
        cell('', { width: 1600, shading: D.colors.tableHeader }),
        cell('', { width: 1400, shading: D.colors.tableHeader }),
        cell(currency(totalCost), { width: 1800, shading: D.colors.tableHeader, isNumber: true, bold: true }),
      ]
    })
    
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell('Labor Category', { width: 3200, isHeader: true }),
            cell('Qty', { width: 800, isHeader: true, align: AlignmentType.CENTER }),
            cell('Base Salary', { width: 1600, isHeader: true, align: AlignmentType.RIGHT }),
            cell('Hourly Rate', { width: 1400, isHeader: true, align: AlignmentType.RIGHT }),
            cell('Annual Cost', { width: 1800, isHeader: true, align: AlignmentType.RIGHT }),
          ]
        }),
        ...boeRows,
        totalRow
      ]
    }))
    
    children.push(para(
      text('Based on 2,080 productive hours per year.', { size: D.fontSize.small, color: D.colors.muted }),
      { spaceBefore: 200 }
    ))
    
    children.push(new Paragraph({ children: [new PageBreak()] }))
  }
  
  // ===========================================================================
  // LABOR CATEGORY DESCRIPTIONS (LCATs)
  // ===========================================================================
  
  if (options.includeLCATs && data.roles.length > 0) {
    children.push(sectionHeading('Labor Category Descriptions'))
    
    children.push(para(
      text('Qualifications and experience requirements for each proposed labor category.', 
        { size: D.fontSize.body, color: D.colors.secondary }),
      { spaceAfter: 400 }
    ))
    
    data.roles.forEach((role, idx) => {
      // Role title with level badge
      children.push(para([
        text(role.title, { size: D.fontSize.h2, bold: true }),
        text(`  ${role.icLevel}`, { size: D.fontSize.small, color: D.colors.muted }),
      ], { spaceBefore: idx > 0 ? 400 : 0, spaceAfter: 120 }))
      
      // Description
      if (role.description) {
        children.push(para(
          text(role.description, { size: D.fontSize.body, color: D.colors.primary }),
          { spaceAfter: 160 }
        ))
      }
      
      // Metadata row
      const metaParts: TextRun[] = []
      
      if (role.yearsExperience) {
        metaParts.push(text('Experience: ', { size: D.fontSize.small, color: D.colors.muted }))
        metaParts.push(text(role.yearsExperience, { size: D.fontSize.small, bold: true }))
      }
      
      if (role.blsCode) {
        if (metaParts.length > 0) {
          metaParts.push(text('    ', { size: D.fontSize.small }))
        }
        metaParts.push(text('BLS Code: ', { size: D.fontSize.small, color: D.colors.muted }))
        metaParts.push(text(role.blsCode, { size: D.fontSize.small, bold: true }))
      }
      
      if (metaParts.length > 0) {
        children.push(para(metaParts, { spaceAfter: 200 }))
      }
      
      // Subtle divider between roles
      if (idx < data.roles.length - 1) {
        children.push(new Paragraph({
          spacing: { before: 100, after: 100 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 2, color: D.colors.tableBorder }
          },
          children: []
        }))
      }
    })
    
    children.push(new Paragraph({ children: [new PageBreak()] }))
  }
  
  // ===========================================================================
  // AUDIT DEFENSE PACKAGE
  // ===========================================================================
  
  if (options.includeAuditPackage && data.roles.length > 0) {
    children.push(sectionHeading('Rate Calculation Detail'))
    
    children.push(para(
      text('Step-by-step rate buildup demonstrating FAR compliance and audit traceability.', 
        { size: D.fontSize.body, color: D.colors.secondary }),
      { spaceAfter: 300 }
    ))
    
    // Methodology explanation
    children.push(subHeading('Calculation Methodology'))
    
    children.push(para([
      text('Hourly rates are calculated using the wrapped rate methodology per FAR 31.2:', { size: D.fontSize.body }),
    ], { spaceAfter: 160 }))
    
    children.push(para(
      text('Base Rate = Annual Salary ÷ 2,080 hours', { size: D.fontSize.body, italic: true }),
      { indent: 400, spaceAfter: 80 }
    ))
    
    children.push(para(
      text(`+ Fringe Benefits (${(data.indirectRates.fringe * 100).toFixed(2)}%)`, { size: D.fontSize.body }),
      { indent: 400, spaceAfter: 80 }
    ))
    
    children.push(para(
      text(`+ Overhead (${(data.indirectRates.overhead * 100).toFixed(2)}%)`, { size: D.fontSize.body }),
      { indent: 400, spaceAfter: 80 }
    ))
    
    children.push(para(
      text(`+ G&A (${(data.indirectRates.ga * 100).toFixed(2)}%)`, { size: D.fontSize.body }),
      { indent: 400, spaceAfter: 80 }
    ))
    
    if (data.rateCardType !== 'ffp') {
      children.push(para(
        text(`+ Profit (${(data.profitMargin * 100).toFixed(1)}%)`, { size: D.fontSize.body }),
        { indent: 400, spaceAfter: 160 }
      ))
    }
    
    children.push(para([
      text('Indirect rates sourced from ', { size: D.fontSize.small, color: D.colors.muted }),
      text(`${data.indirectRates.source} FY${data.indirectRates.fiscalYear}`, { size: D.fontSize.small, color: D.colors.muted, bold: true }),
      text('.', { size: D.fontSize.small, color: D.colors.muted }),
    ], { spaceAfter: 400 }))
    
    // Rate buildup table
    children.push(subHeading('Rate Buildup by Category'))
    
    const auditRows = data.roles.map((role, idx) => {
      const baseRate = role.baseSalary / 2080
      const afterFringe = baseRate * (1 + data.indirectRates.fringe)
      const afterOverhead = afterFringe * (1 + data.indirectRates.overhead)
      const afterGA = afterOverhead * (1 + data.indirectRates.ga)
      const finalRate = data.rateCardType !== 'ffp'
        ? afterGA * (1 + data.profitMargin)
        : afterGA
      const bgColor = idx % 2 === 1 ? D.colors.tableAlt : undefined
      
      return new TableRow({
        children: [
          cell(role.title, { width: 2400, shading: bgColor }),
          cell(currency(baseRate), { width: 1200, shading: bgColor, isNumber: true }),
          cell(currency(afterFringe), { width: 1200, shading: bgColor, isNumber: true }),
          cell(currency(afterOverhead), { width: 1200, shading: bgColor, isNumber: true }),
          cell(currency(afterGA), { width: 1200, shading: bgColor, isNumber: true }),
          cell(currency(finalRate), { width: 1200, shading: bgColor, isNumber: true, bold: true }),
        ]
      })
    })
    
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cell('Category', { width: 2400, isHeader: true }),
            cell('Base', { width: 1200, isHeader: true, align: AlignmentType.RIGHT }),
            cell('+ Fringe', { width: 1200, isHeader: true, align: AlignmentType.RIGHT }),
            cell('+ OH', { width: 1200, isHeader: true, align: AlignmentType.RIGHT }),
            cell('+ G&A', { width: 1200, isHeader: true, align: AlignmentType.RIGHT }),
            cell('Final', { width: 1200, isHeader: true, align: AlignmentType.RIGHT }),
          ]
        }),
        ...auditRows
      ]
    }))
  }
  
  // ===========================================================================
  // CREATE DOCUMENT
  // ===========================================================================
  
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font, size: D.fontSize.body },
          paragraph: { spacing: { after: D.spacing.paragraphAfter, line: 276 } }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: D.spacing.marginPage,
            right: D.spacing.marginPage,
            bottom: D.spacing.marginPage,
            left: D.spacing.marginPage,
          }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 0 },
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 4, color: D.colors.tableBorder }
              },
              children: [
                text(data.companyName, { size: D.fontSize.tiny, color: D.colors.muted }),
                text('  |  ', { size: D.fontSize.tiny, color: D.colors.tableBorder }),
                text(data.solicitation || 'Proposal', { size: D.fontSize.tiny, color: D.colors.muted }),
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 200 },
              border: {
                top: { style: BorderStyle.SINGLE, size: 4, color: D.colors.tableBorder }
              },
              children: [
                text('Page ', { size: D.fontSize.tiny, color: D.colors.muted }),
                new TextRun({ children: [PageNumber.CURRENT], font, size: D.fontSize.tiny, color: D.colors.muted }),
                text(' of ', { size: D.fontSize.tiny, color: D.colors.muted }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font, size: D.fontSize.tiny, color: D.colors.muted }),
              ]
            })
          ]
        })
      },
      children
    }]
  })
  
  return Packer.toBlob(doc)
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } catch {
    return dateString
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const adjustedFilename = filename.replace('.xlsx', '.csv')
  a.download = adjustedFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}