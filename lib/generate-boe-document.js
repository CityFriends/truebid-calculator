// BOE Document Generator for TrueBid
// Generates a professional Basis of Estimate Word document
// Usage: node generate-boe-document.js

const { 
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
  LevelFormat,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  PageBreak
} = require('docx');
const fs = require('fs');

// ==================== SAMPLE DATA ====================
// In production, this comes from TrueBid's state

const sampleData = {
  solicitation: {
    number: '19AQMM25Q0273',
    title: 'CAMP - Consular Appointment Management Platform',
    agency: 'Department of State',
    subAgency: 'Bureau of Consular Affairs (CA)',
  },
  offeror: {
    name: 'Friends From The City, LLC',
    address: 'Washington, DC',
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  },
  summary: {
    periodOfPerformance: '1 Base Year + 2 Option Years',
    totalHours: 8500,
    totalCost: 1532000,
    keyPersonnel: ['Product Manager', 'Technical Lead', 'Design Lead']
  },
  epics: [
    {
      wbs: '1.1',
      name: 'ACS Appointment Scheduling',
      description: 'Public-facing appointment scheduling for American Citizen Services',
      pwsRef: 'SOO 2.1',
      tasks: [
        { role: 'Technical Lead', hours: 120, rationale: 'Architecture design and code review for scheduling flow' },
        { role: 'Sr Software Engineer', hours: 400, rationale: 'Based on similar scheduling work on USCIS project (350 hrs) plus 15% for complexity' },
        { role: 'Design Lead', hours: 80, rationale: '10 screens × 8 hours/screen including iteration' },
        { role: 'QA Engineer', hours: 120, rationale: 'Accessibility (40 hrs) + functional testing (80 hrs)' }
      ]
    },
    {
      wbs: '1.2',
      name: 'Admin Appointment Management',
      description: 'Consular staff portal for managing capacity and scheduling rules',
      pwsRef: 'SOO 2.3',
      tasks: [
        { role: 'Technical Lead', hours: 80, rationale: 'Architecture and integration design' },
        { role: 'Sr Software Engineer', hours: 320, rationale: 'Complex calendar UI with drag-drop, RBAC integration' },
        { role: 'Design Lead', hours: 60, rationale: 'Admin dashboard design with multiple user roles' },
        { role: 'QA Engineer', hours: 80, rationale: 'Role-based testing across LE staff and cleared Americans' }
      ]
    },
    {
      wbs: '1.3',
      name: 'Authentication & Authorization',
      description: 'OKTA SSO for staff, AWS Cognito for public users, RBAC implementation',
      pwsRef: 'SOO 3.1',
      tasks: [
        { role: 'Technical Lead', hours: 40, rationale: 'Security architecture and review' },
        { role: 'Sr Software Engineer', hours: 200, rationale: 'OKTA integration (80 hrs) + Cognito (60 hrs) + RBAC (60 hrs)' },
        { role: 'QA Engineer', hours: 60, rationale: 'Penetration testing and role escalation testing' }
      ]
    }
  ],
  laborCategories: [
    { name: 'Technical Lead', icLevel: 'IC5', hourlyRate: 179.85, totalHours: 240 },
    { name: 'Sr Software Engineer', icLevel: 'IC4', hourlyRate: 159.28, totalHours: 920 },
    { name: 'Design Lead', icLevel: 'IC4', hourlyRate: 149.00, totalHours: 140 },
    { name: 'QA Engineer', icLevel: 'IC3', hourlyRate: 118.17, totalHours: 260 }
  ],
  risks: [
    { name: 'Incumbent Knowledge Transfer Risk', probability: 'Medium', impact: 'High', mitigation: 'Request MVP demo, negotiate support period' },
    { name: 'ATO Status Unknown', probability: 'Medium', impact: 'High', mitigation: 'Ask Q&A for ATO timeline' },
    { name: 'BESPIN Platform Dependency', probability: 'Medium', impact: 'Medium', mitigation: 'Establish relationship early' }
  ],
  assumptions: [
    { category: 'Technical', assumption: 'MVP is functional and deployed to pilot posts', impact: 'Significant rework if MVP incomplete' },
    { category: 'Resource', assumption: 'MRPT clearances obtained within 60-90 days', impact: 'Delayed start, personnel substitution' },
    { category: 'Budget', assumption: '$50K/year travel sufficient for post onboarding', impact: 'Limited on-site support if exceeded' }
  ]
};

// ==================== STYLES ====================

const styles = {
  default: {
    document: {
      run: { font: 'Arial', size: 22 } // 11pt
    }
  },
  paragraphStyles: [
    {
      id: 'Title',
      name: 'Title',
      basedOn: 'Normal',
      run: { size: 56, bold: true, color: '000000', font: 'Arial' },
      paragraph: { spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER }
    },
    {
      id: 'Heading1',
      name: 'Heading 1',
      basedOn: 'Normal',
      next: 'Normal',
      quickFormat: true,
      run: { size: 32, bold: true, color: '1a365d', font: 'Arial' },
      paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
    },
    {
      id: 'Heading2',
      name: 'Heading 2',
      basedOn: 'Normal',
      next: 'Normal',
      quickFormat: true,
      run: { size: 26, bold: true, color: '2c5282', font: 'Arial' },
      paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 }
    },
    {
      id: 'Heading3',
      name: 'Heading 3',
      basedOn: 'Normal',
      next: 'Normal',
      quickFormat: true,
      run: { size: 24, bold: true, color: '2d3748', font: 'Arial' },
      paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
    }
  ]
};

// ==================== TABLE HELPERS ====================

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

function createHeaderCell(text, width = 2000) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: '1a365d', type: ShadingType.CLEAR },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 20 })]
      })
    ]
  });
}

function createDataCell(text, width = 2000, alignment = AlignmentType.LEFT) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    children: [
      new Paragraph({
        alignment,
        children: [new TextRun({ text: String(text), size: 20 })]
      })
    ]
  });
}

// ==================== DOCUMENT SECTIONS ====================

function createCoverPage(data) {
  return [
    new Paragraph({ spacing: { before: 2000 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'BASIS OF ESTIMATE', bold: true, size: 72, color: '1a365d' })]
    }),
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: data.solicitation.title, size: 36, color: '2d3748' })]
    }),
    new Paragraph({ spacing: { before: 200 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Solicitation: ${data.solicitation.number}`, size: 24, color: '718096' })]
    }),
    new Paragraph({ spacing: { before: 800 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Submitted by:', size: 22, color: '718096' })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: data.offeror.name, bold: true, size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: data.offeror.address, size: 22, color: '718096' })]
    }),
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: data.offeror.date, size: 22, color: '718096' })]
    }),
    new Paragraph({ children: [new PageBreak()] })
  ];
}

function createExecutiveSummary(data) {
  return [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('1. Executive Summary')] }),
    
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('1.1 Contract Overview')] }),
    
    new Table({
      columnWidths: [3500, 5500],
      rows: [
        new TableRow({
          children: [
            createDataCell('Period of Performance', 3500),
            createDataCell(data.summary.periodOfPerformance, 5500)
          ]
        }),
        new TableRow({
          children: [
            createDataCell('Total Estimated Hours', 3500),
            createDataCell(data.summary.totalHours.toLocaleString() + ' hours', 5500)
          ]
        }),
        new TableRow({
          children: [
            createDataCell('Total Estimated Cost', 3500),
            createDataCell('$' + data.summary.totalCost.toLocaleString(), 5500)
          ]
        }),
        new TableRow({
          children: [
            createDataCell('Key Personnel', 3500),
            createDataCell(data.summary.keyPersonnel.join(', '), 5500)
          ]
        })
      ]
    }),
    
    new Paragraph({ spacing: { before: 300 } }),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('1.2 Estimation Methodology')] }),
    new Paragraph({
      children: [new TextRun('This Basis of Estimate was developed using the following approach:')]
    }),
    new Paragraph({
      spacing: { before: 100, after: 100 },
      indent: { left: 720 },
      children: [new TextRun('1. Requirements Analysis: Systematic review of Statement of Objectives (SOO)')]
    }),
    new Paragraph({
      indent: { left: 720 },
      children: [new TextRun('2. Task Decomposition: Breaking requirements into discrete, estimable work packages')]
    }),
    new Paragraph({
      indent: { left: 720 },
      children: [new TextRun('3. Analogous Estimation: Leveraging similar experience from prior contracts')]
    }),
    new Paragraph({
      indent: { left: 720 },
      children: [new TextRun('4. Expert Judgment: Technical leads provided estimates with documented rationale')]
    }),
    new Paragraph({ children: [new PageBreak()] })
  ];
}

function createLaborEstimates(data) {
  const sections = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('2. Labor Hour Estimates by WBS')] }),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('2.1 Summary by Work Package')] })
  ];
  
  // Create summary table
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      createHeaderCell('WBS', 1000),
      createHeaderCell('Work Package', 3500),
      createHeaderCell('PWS Ref', 1200),
      createHeaderCell('Hours', 1200),
      createHeaderCell('Cost', 1600)
    ]
  });
  
  const dataRows = data.epics.map(epic => {
    const totalHours = epic.tasks.reduce((sum, t) => sum + t.hours, 0);
    const avgRate = 155; // Simplified - in production, calculate from actual roles
    const cost = totalHours * avgRate;
    
    return new TableRow({
      children: [
        createDataCell(epic.wbs, 1000),
        createDataCell(epic.name, 3500),
        createDataCell(epic.pwsRef, 1200),
        createDataCell(totalHours.toLocaleString(), 1200, AlignmentType.RIGHT),
        createDataCell('$' + cost.toLocaleString(), 1600, AlignmentType.RIGHT)
      ]
    });
  });
  
  // Total row
  const totalHours = data.epics.reduce((sum, e) => sum + e.tasks.reduce((s, t) => s + t.hours, 0), 0);
  const totalCost = totalHours * 155;
  
  dataRows.push(new TableRow({
    children: [
      createDataCell('', 1000),
      createDataCell('TOTAL', 3500),
      createDataCell('', 1200),
      createDataCell(totalHours.toLocaleString(), 1200, AlignmentType.RIGHT),
      createDataCell('$' + totalCost.toLocaleString(), 1600, AlignmentType.RIGHT)
    ]
  }));
  
  sections.push(new Table({
    columnWidths: [1000, 3500, 1200, 1200, 1600],
    rows: [headerRow, ...dataRows]
  }));
  
  // Detailed breakdown for each epic
  sections.push(new Paragraph({ spacing: { before: 400 } }));
  sections.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('2.2 Detailed Estimates with Rationale')] }));
  
  data.epics.forEach(epic => {
    sections.push(new Paragraph({ 
      heading: HeadingLevel.HEADING_3, 
      children: [new TextRun(`WBS ${epic.wbs}: ${epic.name}`)] 
    }));
    sections.push(new Paragraph({
      spacing: { after: 150 },
      children: [new TextRun({ text: epic.description, italics: true, color: '718096' })]
    }));
    
    const taskHeaderRow = new TableRow({
      tableHeader: true,
      children: [
        createHeaderCell('Labor Category', 2500),
        createHeaderCell('Hours', 1000),
        createHeaderCell('Rationale', 5000)
      ]
    });
    
    const taskRows = epic.tasks.map(task => 
      new TableRow({
        children: [
          createDataCell(task.role, 2500),
          createDataCell(task.hours.toString(), 1000, AlignmentType.RIGHT),
          createDataCell(task.rationale, 5000)
        ]
      })
    );
    
    sections.push(new Table({
      columnWidths: [2500, 1000, 5000],
      rows: [taskHeaderRow, ...taskRows]
    }));
    sections.push(new Paragraph({ spacing: { after: 200 } }));
  });
  
  sections.push(new Paragraph({ children: [new PageBreak()] }));
  return sections;
}

function createLaborRates(data) {
  return [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('3. Labor Rate Justification')] }),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.1 Rate Summary by Labor Category')] }),
    
    new Table({
      columnWidths: [2500, 1000, 1500, 1500, 1500],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Labor Category', 2500),
            createHeaderCell('IC Level', 1000),
            createHeaderCell('Hours', 1500),
            createHeaderCell('Rate', 1500),
            createHeaderCell('Total', 1500)
          ]
        }),
        ...data.laborCategories.map(cat => 
          new TableRow({
            children: [
              createDataCell(cat.name, 2500),
              createDataCell(cat.icLevel, 1000),
              createDataCell(cat.totalHours.toLocaleString(), 1500, AlignmentType.RIGHT),
              createDataCell('$' + cat.hourlyRate.toFixed(2), 1500, AlignmentType.RIGHT),
              createDataCell('$' + (cat.totalHours * cat.hourlyRate).toLocaleString(), 1500, AlignmentType.RIGHT)
            ]
          })
        )
      ]
    }),
    
    new Paragraph({ spacing: { before: 300 } }),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.2 Rate Calculation Methodology')] }),
    new Paragraph({
      children: [new TextRun('All rates calculated using 2,080 annual hours per FAR 31.2 methodology.')]
    }),
    new Paragraph({ spacing: { before: 150 } }),
    new Paragraph({
      children: [new TextRun({ text: 'Loaded Rate Formula:', bold: true })]
    }),
    new Paragraph({
      spacing: { before: 100 },
      children: [new TextRun({ text: 'Loaded Rate = (Base Salary / 2,080) × (1 + Fringe) × (1 + OH) × (1 + G&A) × (1 + Profit)', italics: true })]
    }),
    new Paragraph({ children: [new PageBreak()] })
  ];
}

function createRisksAndAssumptions(data) {
  return [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('4. Risk Assessment & Assumptions')] }),
    
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('4.1 Identified Risks')] }),
    new Table({
      columnWidths: [2500, 1200, 1200, 3600],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Risk', 2500),
            createHeaderCell('Probability', 1200),
            createHeaderCell('Impact', 1200),
            createHeaderCell('Mitigation', 3600)
          ]
        }),
        ...data.risks.map(risk =>
          new TableRow({
            children: [
              createDataCell(risk.name, 2500),
              createDataCell(risk.probability, 1200),
              createDataCell(risk.impact, 1200),
              createDataCell(risk.mitigation, 3600)
            ]
          })
        )
      ]
    }),
    
    new Paragraph({ spacing: { before: 300 } }),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('4.2 Key Assumptions')] }),
    new Table({
      columnWidths: [1500, 3500, 3500],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Category', 1500),
            createHeaderCell('Assumption', 3500),
            createHeaderCell('Impact if Wrong', 3500)
          ]
        }),
        ...data.assumptions.map(assumption =>
          new TableRow({
            children: [
              createDataCell(assumption.category, 1500),
              createDataCell(assumption.assumption, 3500),
              createDataCell(assumption.impact, 3500)
            ]
          })
        )
      ]
    })
  ];
}

// ==================== GENERATE DOCUMENT ====================

async function generateBOEDocument(data = sampleData, outputPath = 'BOE-Document.docx') {
  const doc = new Document({
    styles,
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: `${data.solicitation.number} - Basis of Estimate`, size: 18, color: '718096' })
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
              children: [
                new TextRun({ text: `${data.offeror.name} - PROPRIETARY`, size: 16, color: '718096' }),
                new TextRun({ text: '   |   Page ', size: 16, color: '718096' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '718096' })
              ]
            })
          ]
        })
      },
      children: [
        ...createCoverPage(data),
        ...createExecutiveSummary(data),
        ...createLaborEstimates(data),
        ...createLaborRates(data),
        ...createRisksAndAssumptions(data)
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ BOE document generated: ${outputPath}`);
  return outputPath;
}

// Run if called directly
if (require.main === module) {
  generateBOEDocument();
}

module.exports = { generateBOEDocument };