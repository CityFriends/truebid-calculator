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

  const insertData = requirements.map(req => ({
    proposal_id: id,
    reference_number: req.reference_number,
    title: req.title,
    description: req.description,
    section: req.section,
    priority: req.priority,
    is_mapped: req.is_mapped || false,
  }))

  const { data, error } = await supabase
    .from('requirements')
    .insert(insertData)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requirements: data }, { status: 201 })
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
