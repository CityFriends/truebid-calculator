import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch WBS elements for a proposal
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
    .from('wbs_elements')
    .select('*')
    .eq('proposal_id', id)
    .order('wbs_number', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ wbsElements: data || [] })
}

// POST - Create WBS elements (bulk insert from AI generation)
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
  const elements = Array.isArray(body) ? body : [body]

  const insertData = elements.map(el => ({
    proposal_id: id,
    wbs_number: el.wbs_number,
    title: el.title,
    description: el.description,
    why: el.why,
    what: el.what,
    assumptions: el.assumptions,
    story_points: el.story_points,
    labor_hours: el.labor_hours,
    roles: el.roles,
    linked_requirements: el.linked_requirements,
  }))

  const { data, error } = await supabase
    .from('wbs_elements')
    .insert(insertData)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ wbsElements: data }, { status: 201 })
}

// PUT - Update WBS element
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
    return NextResponse.json({ error: 'WBS Element ID required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('wbs_elements')
    .update({
      wbs_number: body.wbs_number,
      title: body.title,
      description: body.description,
      why: body.why,
      what: body.what,
      assumptions: body.assumptions,
      story_points: body.story_points,
      labor_hours: body.labor_hours,
      roles: body.roles,
      linked_requirements: body.linked_requirements,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ wbsElement: data })
}

// DELETE - Delete WBS element
export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const wbsId = searchParams.get('wbsId')

  if (!wbsId) {
    return NextResponse.json({ error: 'WBS Element ID required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('wbs_elements')
    .delete()
    .eq('id', wbsId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
