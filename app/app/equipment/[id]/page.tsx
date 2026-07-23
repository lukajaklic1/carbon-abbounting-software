import EditEquipmentForm from './form'
import { mockEquipment, mockLocations } from '@/lib/mock-data'
import { notFound } from 'next/navigation'

async function getData(id: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { equipment: mockEquipment.find(e => e.id === id) ?? mockEquipment[0], locations: mockLocations }
  }
  try {
    const { createServerClient } = await import('@/lib/supabase/server')
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
    const [{ data: equipment }, { data: locations }] = await Promise.all([
      supabase.from('equipment').select('*').eq('id', id).single(),
      supabase.from('locations').select('id, name').eq('organization_id', org?.id).eq('is_active', true),
    ])
    return { equipment, locations: locations ?? [] }
  } catch { return null }
}

export default async function EditEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getData(id)
  if (!data?.equipment) notFound()
  return <EditEquipmentForm equipment={data.equipment} locations={data.locations} />
}
