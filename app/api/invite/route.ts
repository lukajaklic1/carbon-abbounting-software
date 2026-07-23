import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { email, organizationId, role } = await req.json()

    if (!email || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check caller is admin of this org
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify caller is owner or admin member
    const { data: org } = await supabaseAdmin
      .from('organizations').select('id').eq('id', organizationId).eq('owner_id', user.id).single()
    const { data: adminMember } = await supabaseAdmin
      .from('organization_members').select('id')
      .eq('organization_id', organizationId).eq('user_id', user.id)
      .eq('role', 'admin').eq('status', 'active').single()

    if (!org && !adminMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Check not already a member
    const { data: existing } = await supabaseAdmin
      .from('organization_members').select('id, status')
      .eq('organization_id', organizationId).eq('invited_email', email).single()

    if (existing && existing.status === 'active') {
      return NextResponse.json({ error: 'User is already an active member' }, { status: 409 })
    }

    // Upsert the invited member record
    if (existing) {
      await supabaseAdmin.from('organization_members')
        .update({ status: 'invited', role: role ?? 'member', invited_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin.from('organization_members').insert({
        organization_id: organizationId,
        invited_email: email,
        role: role ?? 'member',
        status: 'invited',
      })
    }

    // Send Supabase invite email
    const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite`,
      data: { organization_id: organizationId },
    })

    if (inviteErr) {
      // User may already exist — that's fine, they'll see the org on next login
      if (!inviteErr.message.includes('already been registered')) {
        return NextResponse.json({ error: inviteErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
