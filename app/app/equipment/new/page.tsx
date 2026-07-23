import NewEquipmentForm from './form'
import { mockLocations } from '@/lib/mock-data'

async function getLocations() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return mockLocations
  try {
    const { createServerClient } = await import('@/lib/supabase/server')
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
    if (!org) return []
    const { data } = await supabase.from('locations').select('id, name').eq('organization_id', org.id).eq('is_active', true)
    return data ?? []
  } catch { return mockLocations }
}

export default async function NewEquipmentPage() {
  const locations = await getLocations()
  return <NewEquipmentForm locations={locations} />
}
