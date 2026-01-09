import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch all proposals for user's company
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!company) {
    return NextResponse.json({ proposals: [] })
  }

  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('company_id', company.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ proposals: data || [] })
}

// POST - Create a new proposal
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!company) {
    return NextResponse.json({ error: 'No company found' }, { status: 404 })
  }

  const body = await request.json()

  const { data, error } = await supabase
    .from('proposals')
    .insert({
      company_id: company.id,
      title: body.title || 'Untitled Proposal',
      agency: body.agency,
      solicitation_number: body.solicitation_number,
      contract_type: body.contract_type,
      status: body.status || 'draft',
      due_date: body.due_date,
      value: body.value,
      description: body.description,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ proposal: data }, { status: 201 })
}
