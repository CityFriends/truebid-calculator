import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch requirements for a proposal
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { data, error } = await supabase
    .from('requirements')
    .select('*')
    .eq('proposal_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requirements: data || [] })
}

// POST - Create requirements (bulk insert from RFP extraction)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  // Handle both single and bulk inserts
  const requirements = Array.isArray(body) ? body : [body]

  // Map from extraction format to DB format
  // Extraction format: { id, text, type, sourceSection, title?, pageNumber? }
  // DB format: { reference_number, title, description, section, priority, is_mapped, req_type }
  const insertData = requirements.map(req => ({
    proposal_id: id,
    // Support both formats
    reference_number: req.reference_number || req.id || '',
    title: req.title || extractTitle(req.text) || 'Requirement',
    description: req.description || req.text || '',
    section: req.section || req.sourceSection || '',
    priority: req.priority || mapTypeToPriority(req.type),
    req_type: req.type || 'other',
    is_mapped: req.is_mapped || false,
    page_number: req.pageNumber || req.page_number || null,
  }))

  const { data, error } = await supabase
    .from('requirements')
    .insert(insertData)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform response to frontend format
  const transformedRequirements = (data || []).map(r => ({
    id: r.id,
    text: r.description,
    title: r.title,
    type: r.req_type || 'other',
    sourceSection: r.section,
    pageNumber: r.page_number,
  }))

  return NextResponse.json({ requirements: transformedRequirements }, { status: 201 })
}

// Helper: Extract a short title from requirement text
function extractTitle(text: string | undefined): string {
  if (!text) return 'Requirement'
  // Take first 50 chars or up to first period
  const firstSentence = text.split('.')[0]
  if (firstSentence.length <= 60) return firstSentence
  return text.substring(0, 50) + '...'
}

// Helper: Map requirement type to priority
function mapTypeToPriority(type: string | undefined): string {
  const highPriority = ['compliance', 'staffing', 'delivery']
  const mediumPriority = ['reporting', 'governance']
  if (highPriority.includes(type || '')) return 'high'
  if (mediumPriority.includes(type || '')) return 'medium'
  return 'low'
}

// PUT - Update requirement
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  if (!body.id) {
    return NextResponse.json({ error: 'Requirement ID required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('requirements')
    .update({
      reference_number: body.reference_number,
      title: body.title,
      description: body.description,
      section: body.section,
      priority: body.priority,
      is_mapped: body.is_mapped,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requirement: data })
}

// DELETE - Delete requirement
export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const reqId = searchParams.get('reqId')

  if (!reqId) {
    return NextResponse.json({ error: 'Requirement ID required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('requirements')
    .delete()
    .eq('id', reqId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
