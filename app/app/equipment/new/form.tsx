'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormCard, FormField, FormInput, FormSelect } from '@/components/domain/FormCard'
import { createEquipment } from '@/lib/actions/equipment'

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

export default function NewEquipmentForm({ locations }: { locations: any[] }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (IS_MOCK) { await new Promise(r => setTimeout(r, 400)); router.push('/app/equipment'); return }
    try {
      const result = await createEquipment(new FormData(e.currentTarget))
      if (result?.error) { setError(result.error); setLoading(false) }
      else router.push('/app/equipment')
    } catch (err: any) { setError(err.message); setLoading(false) }
  }

  return (
    <FormCard title="Add Equipment" subtitle="Boilers, AC units, refrigeration and process equipment" backHref="/app/equipment">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <FormField label="Equipment name">
          <FormInput name="name" placeholder="e.g. Plinski kotel – Ljubljana" required />
        </FormField>
        <FormField label="Equipment type">
          <FormSelect name="equipment_type" defaultValue="boiler">
            <option value="boiler">Boiler</option>
            <option value="generator">Generator</option>
            <option value="oven">Oven / Furnace</option>
            <option value="compressor">Compressor</option>
            <option value="air_conditioning">Air Conditioning</option>
            <option value="fire_suppression">Fire Suppression</option>
            <option value="refrigeration">Refrigeration</option>
            <option value="industrial_process">Industrial Process</option>
            <option value="other">Other</option>
          </FormSelect>
        </FormField>
        <FormField label="Location (optional)">
          <FormSelect name="location_id" defaultValue="">
            <option value="">— No location —</option>
            {locations.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </FormSelect>
        </FormField>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.push('/app/equipment')}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors">
            {loading ? 'Saving...' : 'Add Equipment'}
          </button>
        </div>
      </form>
    </FormCard>
  )
}
