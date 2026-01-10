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

  const { data: requirements, error } = await supabase
    .from('requirements')
    .select('*')
    .eq('proposal_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requirements })
}

// Helper function to extract title from requirement text
function extractTitle(text: string): string {
  // Take first 100 chars or up to first period/newline
  const firstLine = text.split(/[.\n]/)[0].trim()
  return firstLine.length > 100 ? firstLine.substring(0, 97) + '...' : firstLine
}

// Helper function to map extraction type to priority
function mapTypeToPriority(type: string): string {
  const typeMap: Record<string, string> = {
    'shall': 'high',
    'must': 'high',
    'required': 'high',
    'should': 'medium',
    'may': 'low',
    'optional': 'low',
  }
  return typeMap[type?.toLowerCase()] || 'medium'
}

// POST - Create requirements (supports bulk insert)
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
  // DB format: { reference_number, title, description, type, source, priority }
  const insertData = requirements.map(req => ({
    proposal_id: id,
    reference_number: req.reference_number || req.id || '',
    title: req.title || extractTitle(req.text || req.description || ''),
    description: req.description || req.text || '',
    source: req.source || req.sourceSection || '',
    priority: req.priority || mapTypeToPriority(req.type),
    type: req.type || 'shall',
  }))

  const { data, error } = await supabase
    .from('requirements')
    .insert(insertData)
    .select()

  if (error) {
    console.log('[POST requirements] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requirements: data })
}

// DELETE - Delete all requirements for a proposal
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('requirements')
    .delete()
    .eq('proposal_id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
