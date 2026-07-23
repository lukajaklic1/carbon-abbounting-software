import EditVehicleForm from './form'
import { mockVehicles } from '@/lib/mock-data'
import { notFound } from 'next/navigation'

async function getVehicle(id: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return mockVehicles.find(v => v.id === id) ?? mockVehicles[0]
  try {
    const { createServerClient } = await import('@/lib/supabase/server')
    const supabase = await createServerClient()
    const { data } = await supabase.from('vehicles').select('*').eq('id', id).single()
    return data
  } catch { return null }
}

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const vehicle = await getVehicle(id)
  if (!vehicle) notFound()
  return <EditVehicleForm vehicle={vehicle} />
}
