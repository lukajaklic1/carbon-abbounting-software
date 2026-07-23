'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

async function getOrgId(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: org } = await supabase.from('organizations').select('id, plan').eq('owner_id', user.id).single()
  if (!org) throw new Error('No organization found')
  return org
}

export async function createLocation(formData: FormData) {
  const supabase = await createServerClient()
  const org = await getOrgId(supabase)

  // Plan limit check
  const { count } = await supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true)
  const limits: Record<string, number> = { free: 1, starter: 5, professional: Infinity, enterprise: Infinity }
  if ((count ?? 0) >= (limits[org.plan] ?? 1)) {
    return { error: `Plan limit reached. Upgrade to add more locations.` }
  }

  const { error } = await supabase.from('locations').insert({
    organization_id: org.id,
    name: formData.get('name') as string,
    address: formData.get('address') as string || null,
    country_code: (formData.get('country_code') as string || 'SI').toUpperCase(),
  })

  if (error) return { error: error.message }
  revalidatePath('/app/locations')
  return { success: true }
}

export async function updateLocation(id: string, formData: FormData) {
  const supabase = await createServerClient()
  await getOrgId(supabase)

  const { error } = await supabase.from('locations').update({
    name: formData.get('name') as string,
    address: formData.get('address') as string || null,
    country_code: (formData.get('country_code') as string || 'SI').toUpperCase(),
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/app/locations')
  return { success: true }
}

export async function deleteLocation(id: string) {
  const supabase = await createServerClient()
  await getOrgId(supabase)

  const { error } = await supabase.from('locations').update({ is_active: false }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/locations')
  return { success: true }
}
