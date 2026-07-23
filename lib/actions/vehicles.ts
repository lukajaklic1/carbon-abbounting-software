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

export async function createVehicle(formData: FormData) {
  const supabase = await createServerClient()
  const org = await getOrg(supabase)

  const { count } = await supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true)
  const limits: Record<string, number> = { free: 2, starter: 10, professional: Infinity, enterprise: Infinity }
  if ((count ?? 0) >= (limits[org.plan] ?? 2)) {
    return { error: 'Plan limit reached. Upgrade to add more vehicles.' }
  }

  const { error } = await supabase.from('vehicles').insert({
    organization_id: org.id,
    name: formData.get('name') as string,
    vehicle_type: formData.get('vehicle_type') as string,
    fuel_type: formData.get('fuel_type') as string,
    size_category: formData.get('size_category') as string || 'average',
  })

  if (error) return { error: error.message }
  revalidatePath('/app/vehicles')
  return { success: true }
}

export async function updateVehicle(id: string, formData: FormData) {
  const supabase = await createServerClient()
  await getOrg(supabase)

  const { error } = await supabase.from('vehicles').update({
    name: formData.get('name') as string,
    vehicle_type: formData.get('vehicle_type') as string,
    fuel_type: formData.get('fuel_type') as string,
    size_category: formData.get('size_category') as string || 'average',
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/app/vehicles')
  return { success: true }
}

export async function deleteVehicle(id: string) {
  const supabase = await createServerClient()
  await getOrg(supabase)
  const { error } = await supabase.from('vehicles').update({ is_active: false }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/vehicles')
  return { success: true }
}
