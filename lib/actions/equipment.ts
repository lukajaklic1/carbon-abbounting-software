'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

async function getOrg(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: org } = await supabase.from('organizations').select('id, plan').eq('owner_id', user.id).single()
  if (!org) throw new Error('No organization found')
  return org
}

export async function createEquipment(formData: FormData) {
  const supabase = await createServerClient()
  const org = await getOrg(supabase)

  const { count } = await supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true)
  const limits: Record<string, number> = { free: 3, starter: 15, professional: Infinity, enterprise: Infinity }
  if ((count ?? 0) >= (limits[org.plan] ?? 3)) {
    return { error: 'Plan limit reached. Upgrade to add more equipment.' }
  }

  const locationId = formData.get('location_id') as string
  const { error } = await supabase.from('equipment').insert({
    organization_id: org.id,
    name: formData.get('name') as string,
    equipment_type: formData.get('equipment_type') as string,
    location_id: locationId || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/app/equipment')
  return { success: true }
}

export async function updateEquipment(id: string, formData: FormData) {
  const supabase = await createServerClient()
  await getOrg(supabase)

  const locationId = formData.get('location_id') as string
  const { error } = await supabase.from('equipment').update({
    name: formData.get('name') as string,
    equipment_type: formData.get('equipment_type') as string,
    location_id: locationId || null,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/app/equipment')
  return { success: true }
}

export async function deleteEquipment(id: string) {
  const supabase = await createServerClient()
  await getOrg(supabase)
  const { error } = await supabase.from('equipment').update({ is_active: false }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/equipment')
  return { success: true }
}
