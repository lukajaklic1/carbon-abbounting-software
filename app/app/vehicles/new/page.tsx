'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormCard, FormField, FormInput, FormSelect } from '@/components/domain/FormCard'
import { createVehicle } from '@/lib/actions/vehicles'

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

export default function NewVehiclePage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (IS_MOCK) { await new Promise(r => setTimeout(r, 400)); router.push('/app/vehicles'); return }
    try {
      const result = await createVehicle(new FormData(e.currentTarget))
      if (result?.error) { setError(result.error); setLoading(false) }
      else router.push('/app/vehicles')
    } catch (err: any) { setError(err.message); setLoading(false) }
  }

  return (
    <FormCard title="Add Vehicle" subtitle="Track fuel consumption and mobile emissions" backHref="/app/vehicles">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <FormField label="Vehicle name">
          <FormInput name="name" placeholder="e.g. VW Golf – LJ 123 AB" required />
        </FormField>
        <FormField label="Vehicle type">
          <FormSelect name="vehicle_type" defaultValue="car">
            <option value="car">Car</option>
            <option value="van">Van</option>
            <option value="truck">Truck / HGV</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="other">Other</option>
          </FormSelect>
        </FormField>
        <FormField label="Fuel type">
          <FormSelect name="fuel_type" defaultValue="diesel">
            <option value="diesel">Diesel</option>
            <option value="petrol">Petrol</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
            <option value="lpg">LPG</option>
            <option value="cng">CNG</option>
            <option value="unknown">Unknown</option>
          </FormSelect>
        </FormField>
        <FormField label="Size category">
          <FormSelect name="size_category" defaultValue="average">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="average">Average</option>
          </FormSelect>
        </FormField>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.push('/app/vehicles')}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors">
            {loading ? 'Saving...' : 'Add Vehicle'}
          </button>
        </div>
      </form>
    </FormCard>
  )
}
