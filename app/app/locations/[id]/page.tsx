import EditLocationForm from './form'
import { mockLocations } from '@/lib/mock-data'
import { notFound } from 'next/navigation'

async function getLocation(id: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return mockLocations.find(l => l.id === id) ?? mockLocations[0]
  }
  try {
    const { createServerClient } = await import('@/lib/supabase/server')
    const supabase = await createServerClient()
    const { data } = await supabase.from('locations').select('*').eq('id', id).single()
    return data
  } catch { return null }
}

export default async function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const location = await getLocation(id)
  if (!location) notFound()
  return <EditLocationForm location={location} />
}
