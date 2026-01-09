import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

<<<<<<< HEAD
=======
// Transform snake_case DB response to camelCase for frontend
function transformProposal(p: Record<string, unknown>) {
  return {
    id: p.id,
    title: p.title || 'Untitled Proposal',
    solicitation: p.solicitation_number || '',
    client: p.agency || '',
    status: p.status || 'draft',
    totalValue: p.total_value || 0,
    dueDate: p.due_date || null,
    updatedAt: p.updated_at || new Date().toISOString(),
    createdAt: p.created_at || new Date().toISOString(),
    teamSize: p.team_size || 0,
    progress: p.progress || 0,
    starred: p.starred || false,
    archived: p.archived || false,
    contractType: p.contract_type || 'tm',
    periodOfPerformance: p.period_of_performance || '',
    // Include nested data
    requirements: p.requirements,
    wbsElements: p.wbs_elements,
  }
}

>>>>>>> 26cbda194f9c5d7443068014d9c4c180506d854f
// GET - Fetch single proposal with requirements and WBS
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

  // Fetch proposal with related data
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select(`
      *,
      requirements (*),
      wbs_elements (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

<<<<<<< HEAD
  return NextResponse.json({ proposal })
=======
  return NextResponse.json({ proposal: transformProposal(proposal) })
>>>>>>> 26cbda194f9c5d7443068014d9c4c180506d854f
}

// PUT - Update proposal
export async function PUT(
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

<<<<<<< HEAD
  const { data, error } = await supabase
    .from('proposals')
    .update({
      title: body.title,
      agency: body.agency,
      solicitation_number: body.solicitation_number,
      contract_type: body.contract_type,
      status: body.status,
      due_date: body.due_date,
      value: body.value,
      description: body.description,
      updated_at: new Date().toISOString(),
    })
=======
  // Build update object only with fields that were provided
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  // Map camelCase to snake_case and handle both formats
  if (body.title !== undefined) updateData.title = body.title
  if (body.agency !== undefined) updateData.agency = body.agency
  if (body.client !== undefined) updateData.agency = body.client
  if (body.solicitation_number !== undefined) updateData.solicitation_number = body.solicitation_number
  if (body.solicitation !== undefined) updateData.solicitation_number = body.solicitation
  if (body.contract_type !== undefined) updateData.contract_type = body.contract_type
  if (body.contractType !== undefined) updateData.contract_type = body.contractType
  if (body.status !== undefined) updateData.status = body.status
  if (body.due_date !== undefined) updateData.due_date = body.due_date
  if (body.dueDate !== undefined) updateData.due_date = body.dueDate
  if (body.total_value !== undefined) updateData.total_value = body.total_value
  if (body.totalValue !== undefined) updateData.total_value = body.totalValue
  if (body.team_size !== undefined) updateData.team_size = body.team_size
  if (body.teamSize !== undefined) updateData.team_size = body.teamSize
  if (body.progress !== undefined) updateData.progress = body.progress
  if (body.starred !== undefined) updateData.starred = body.starred
  if (body.archived !== undefined) updateData.archived = body.archived
  if (body.period_of_performance !== undefined) updateData.period_of_performance = body.period_of_performance
  if (body.periodOfPerformance !== undefined) updateData.period_of_performance = body.periodOfPerformance
  if (body.description !== undefined) updateData.description = body.description

  const { data, error } = await supabase
    .from('proposals')
    .update(updateData)
>>>>>>> 26cbda194f9c5d7443068014d9c4c180506d854f
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

<<<<<<< HEAD
  return NextResponse.json({ proposal: data })
=======
  return NextResponse.json({ proposal: transformProposal(data) })
>>>>>>> 26cbda194f9c5d7443068014d9c4c180506d854f
}

// DELETE - Delete proposal (cascades to requirements/wbs)
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
    .from('proposals')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
