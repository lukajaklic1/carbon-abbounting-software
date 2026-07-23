'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormCard, FormField, FormInput, FormSelect } from '@/components/domain/FormCard'
import { createLocation } from '@/lib/actions/locations'

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

export default function NewLocationPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (IS_MOCK) {
      await new Promise(r => setTimeout(r, 400))
      router.push('/app/locations')
      return
    }

    try {
      const formData = new FormData(e.currentTarget)
      const result = await createLocation(formData)
      if (result?.error) { setError(result.error); setLoading(false) }
      else router.push('/app/locations')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <FormCard title="Add Location" subtitle="Add a physical site or office" backHref="/app/locations">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <FormField label="Location name" >
          <FormInput name="name" placeholder="e.g. Glavna pisarna Ljubljana" required />
        </FormField>
        <FormField label="Address" >
          <FormInput name="address" placeholder="e.g. Dunajska cesta 1, Ljubljana" />
        </FormField>
        <FormField label="Country" >
          <FormSelect name="country_code" defaultValue="SI">
            <option value="SI">🇸🇮 Slovenia</option>
            <option value="HR">🇭🇷 Croatia</option>
            <option value="AT">🇦🇹 Austria</option>
            <option value="DE">🇩🇪 Germany</option>
            <option value="IT">🇮🇹 Italy</option>
            <option value="GB">🇬🇧 United Kingdom</option>
            <option value="OTHER">Other</option>
          </FormSelect>
        </FormField>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.push('/app/locations')}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors">
            {loading ? 'Saving...' : 'Add Location'}
          </button>
        </div>
      </form>
    </FormCard>
  )
}
