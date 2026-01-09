import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch user's company
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ company: data })
}

// POST - Create company
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const { data, error } = await supabase
    .from('companies')
    .insert({
      owner_id: user.id,
      name: body.name,
      legal_name: body.legal_name,
      sam_uei: body.sam_uei,
      cage_code: body.cage_code,
      duns: body.duns,
      ein: body.ein,
      naics_codes: body.naics_codes,
      address: body.address,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ company: data }, { status: 201 })
}

// PUT - Update company
export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const { data, error } = await supabase
    .from('companies')
    .update({
      name: body.name,
      legal_name: body.legal_name,
      sam_uei: body.sam_uei,
      cage_code: body.cage_code,
      duns: body.duns,
      ein: body.ein,
      naics_codes: body.naics_codes,
      address: body.address,
      updated_at: new Date().toISOString(),
    })
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ company: data })
}
