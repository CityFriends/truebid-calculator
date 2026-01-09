import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch company settings
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // First get the company
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!company) {
    return NextResponse.json({ error: 'No company found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .eq('company_id', company.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ settings: data })
}

// POST - Create or update company settings (upsert)
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the company
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
    .from('company_settings')
    .upsert({
      company_id: company.id,
      fringe_rate: body.fringe_rate,
      overhead_rate: body.overhead_rate,
      ga_rate: body.ga_rate,
      profit_rate: body.profit_rate,
      escalation_rate: body.escalation_rate,
      salary_structure: body.salary_structure,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'company_id'
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ settings: data })
}
