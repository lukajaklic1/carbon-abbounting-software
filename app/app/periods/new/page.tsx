'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FormCard } from '@/components/domain/FormCard'
import { CalendarDays } from 'lucide-react'
import { usePeriodStore } from '@/stores/period'
import { useLocale } from '@/lib/i18n/LocaleProvider'

const YEARS = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i)

export default function NewPeriodPage() {
  const router = useRouter()
  const { availablePeriods, setAvailablePeriods, setSelectedYear, setCurrentPeriod } = usePeriodStore()
  const { t } = useLocale()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const takenYears = availablePeriods.map(p => p.year)

  async function handleCreate() {
    if (takenYears.includes(year)) {
      setError(`Leto ${year} že obstaja.`)
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return

      const { data: period, error: err } = await supabase
        .from('reporting_periods')
        .insert({ organization_id: org.id, year, status: 'draft' })
        .select().single()

      if (err) { setError(err.message); setLoading(false); return }

      const updated = [...availablePeriods, period].sort((a, b) => b.year - a.year)
      setAvailablePeriods(updated)
      setSelectedYear(period.year)
      setCurrentPeriod(period)
      router.push('/app/dashboard')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <FormCard title={t('Novo leto poročanja', 'New reporting year')} backHref="/app/dashboard">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <CalendarDays className="h-5 w-5 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-700">
              {t('Vsako leto poročanja je ločen nabor podatkov o emisijah.', 'Each reporting year is a separate set of emissions data.')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('Izberite leto', 'Select year')}</label>
            <div className="grid grid-cols-4 gap-2">
              {YEARS.map(y => {
                const taken = takenYears.includes(y)
                return (
                  <button key={y} onClick={() => !taken && setYear(y)} disabled={taken}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      taken ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' :
                      year === y ? 'border-blue-600 bg-blue-50 text-blue-600' :
                      'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                    }`}>
                    {y}
                    {taken && <span className="block text-[9px] font-normal mt-0.5">{t('že obstaja', 'exists')}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={() => router.back()}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              {t('Prekliči', 'Cancel')}
            </button>
            <button onClick={handleCreate} disabled={loading}
              className="flex-[2] px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-xl transition-colors">
              {loading ? t('Ustvarjanje...', 'Creating...') : `${t('Ustvari', 'Create')} ${year}`}
            </button>
          </div>
        </div>
      </FormCard>
    </div>
  )
}
