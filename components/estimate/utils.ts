// Utility functions for estimate components

export const getTypeColor = (type: string) => {
  switch (type) {
    case 'functional': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'technical': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'compliance': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'management': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-700'
    case 'high': return 'bg-orange-100 text-orange-700'
    case 'medium': return 'bg-yellow-100 text-yellow-700'
    case 'low': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export const getConfidenceColor = (confidence: string) => {
  switch (confidence) {
    case 'high': return 'text-emerald-600'
    case 'medium': return 'text-amber-600'
    case 'low': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

export const getConfidenceBgColor = (confidence: string) => {
  switch (confidence) {
    case 'high': return 'bg-emerald-50 border-emerald-200'
    case 'medium': return 'bg-amber-50 border-amber-200'
    case 'low': return 'bg-red-50 border-red-200'
    default: return 'bg-gray-50 border-gray-200'
  }
}

export const formatHours = (hours: number) => {
  return (hours || 0).toLocaleString()
}

export const formatFTE = (hours: number, monthlyHours: number = 160) => {
  const fte = hours / monthlyHours
  return fte.toFixed(2)
}

// Calculate total hours for a period across all WBS elements
export const calculatePeriodTotalHours = (
  wbsElements: Array<{ laborEstimates: Array<{ hoursByPeriod: Record<string, number> }> }>,
  periodKey: string
) => {
  return wbsElements.reduce((total, wbs) => {
    const periodHours = wbs.laborEstimates.reduce((sum, labor) => {
      return sum + (labor.hoursByPeriod[periodKey as keyof typeof labor.hoursByPeriod] || 0)
    }, 0)
    return total + periodHours
  }, 0)
}

// Calculate hours by role for a specific WBS element and period
export const getHoursByRole = (
  laborEstimates: Array<{ roleId: string; hoursByPeriod: Record<string, number> }>,
  roleId: string,
  periodKey: string
) => {
  const labor = laborEstimates.find(l => l.roleId === roleId)
  if (!labor) return 0
  return labor.hoursByPeriod[periodKey as keyof typeof labor.hoursByPeriod] || 0
}

// Generate next WBS number
export const generateNextWbsNumber = (existingNumbers: string[]): string => {
  if (existingNumbers.length === 0) return '1.1'

  const parsed = existingNumbers.map(n => {
    const parts = n.split('.')
    return { major: parseInt(parts[0]) || 1, minor: parseInt(parts[1]) || 0 }
  }).sort((a, b) => a.major === b.major ? b.minor - a.minor : b.major - a.major)

  const highest = parsed[0]
  return `${highest.major}.${highest.minor + 1}`
}

// Map requirement type to category
export const mapTypeToCategory = (type: string): string => {
  const categoryMap: Record<string, string> = {
    'delivery': 'Deliverables',
    'reporting': 'Reporting',
    'staffing': 'Staffing',
    'compliance': 'Compliance',
    'governance': 'Governance',
    'transition': 'Transition',
    'functional': 'Core Features',
    'technical': 'Technical',
    'management': 'Management',
    'other': 'Other',
  }
  return categoryMap[type] || 'Other'
}

// Map extraction type to SOO requirement type
export const mapToSOOType = (type: string): 'functional' | 'technical' | 'compliance' | 'management' | 'other' => {
  const typeMap: Record<string, 'functional' | 'technical' | 'compliance' | 'management' | 'other'> = {
    'delivery': 'functional',
    'reporting': 'management',
    'staffing': 'management',
    'compliance': 'compliance',
    'governance': 'management',
    'transition': 'functional',
    'functional': 'functional',
    'technical': 'technical',
    'management': 'management',
    'other': 'other',
  }
  return typeMap[type] || 'other'
}
