import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch all company roles
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
    return NextResponse.json({ roles: [] })
  }

  const { data, error } = await supabase
    .from('company_roles')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ roles: data || [] })
}

// POST - Create a new role
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
    .from('company_roles')
    .insert({
      company_id: company.id,
      title: body.title,
      labor_category: body.labor_category,
      soc_code: body.soc_code,
      education: body.education,
      certifications: body.certifications,
      salary_levels: body.salary_levels,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ role: data }, { status: 201 })
}

// PUT - Update a role (expects id in body)
export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  if (!body.id) {
    return NextResponse.json({ error: 'Role ID required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('company_roles')
    .update({
      title: body.title,
      labor_category: body.labor_category,
      soc_code: body.soc_code,
      education: body.education,
      certifications: body.certifications,
      salary_levels: body.salary_levels,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ role: data })
}

// DELETE - Delete a role
export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Role ID required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('company_roles')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
