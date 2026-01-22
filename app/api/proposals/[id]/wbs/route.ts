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

  // Map to database columns (snake_case)
  const insertData = elements.map(el => ({
    proposal_id: id,
    wbs_number: el.wbs_number || el.wbsNumber || '',
    title: el.title || '',
    what: el.what || el.description || '',
    why: el.why || '',
    sow_reference: el.sow_reference || el.sowReference || '',
    not_included: el.not_included || el.notIncluded || '',
    assumptions: el.assumptions || [],
    estimate_method: el.estimate_method || el.estimateMethod || 'engineering',
    labor_estimates: el.labor_estimates || el.laborEstimates || [],
    linked_requirement_ids: el.linked_requirement_ids || el.linkedRequirementIds || [],
    total_hours: el.total_hours || el.totalHours || el.hours || 0,
    confidence: el.confidence || 'medium',
  }))

  const { data, error } = await supabase
    .from('wbs_elements')
    .insert(insertData)
    .select()

  if (error) {
    console.log('[POST wbs] Error:', error)
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
      wbs_number: body.wbs_number || body.wbsNumber,
      title: body.title,
      what: body.what || body.description,
      why: body.why,
      sow_reference: body.sow_reference || body.sowReference,
      not_included: body.not_included || body.notIncluded,
      assumptions: body.assumptions,
      estimate_method: body.estimate_method || body.estimateMethod,
      labor_estimates: body.labor_estimates || body.laborEstimates,
      linked_requirement_ids: body.linked_requirement_ids || body.linkedRequirementIds,
      total_hours: body.total_hours || body.totalHours || body.hours,
      confidence: body.confidence,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select()
    .single()

  if (error) {
    console.log('[PUT wbs] Error:', error)
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
