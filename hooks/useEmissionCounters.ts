'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePeriodStore } from '@/stores/period'

export interface Counter { done: number; total: number }
export type CounterMap = Record<string, Counter>

export function useEmissionCounters() {
  const { selectedYear } = usePeriodStore()
  const [counters, setCounters] = useState<CounterMap>({})

  useEffect(() => {
    if (!selectedYear) return
    let cancelled = false

    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
        if (!org) return

        const { data: period } = await supabase
          .from('reporting_periods').select('id')
          .eq('organization_id', org.id).eq('year', selectedYear).single()

        const pid = period?.id ?? null

        const [
          { count: locCount },
          { count: vehCount },
          { count: equCount },
          { count: equFuelCount },
          { count: equRefCount },
          { count: equGasCount },
          { count: statCount },
          { count: mobCount },
          { count: efCount },
          { count: refCount },
          { count: gasCount },
          { count: elecCount },
        ] = await Promise.all([
          supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true),
          supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true),
          supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true),
          supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true).eq('uses_fuel', true),
          supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true).eq('uses_refrigerants', true),
          supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true).eq('uses_industrial_gases', true),
          pid
            ? supabase.from('scope1_stationary').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid)
            : Promise.resolve({ count: 0 }),
          pid
            ? supabase.from('scope1_mobile').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid)
            : Promise.resolve({ count: 0 }),
          pid
            ? supabase.from('scope1_equipment_fuel').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid)
            : Promise.resolve({ count: 0 }),
          pid
            ? supabase.from('scope1_refrigerants').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid)
            : Promise.resolve({ count: 0 }),
          pid
            ? supabase.from('scope1_industrial_gases').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid)
            : Promise.resolve({ count: 0 }),
          pid
            ? supabase.from('scope2_electricity').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid)
            : Promise.resolve({ count: 0 }),
        ])

        if (cancelled) return

        const y = selectedYear
        setCounters({
          '/app/locations': { done: locCount ?? 0, total: locCount ?? 0 },
          '/app/vehicles':  { done: vehCount ?? 0, total: vehCount ?? 0 },
          '/app/equipment': { done: equCount ?? 0, total: equCount ?? 0 },
          [`/app/periods/${y}/scope1/stationary`]:       { done: statCount ?? 0, total: locCount ?? 0 },
          [`/app/periods/${y}/scope1/mobile`]:           { done: mobCount ?? 0,  total: vehCount ?? 0 },
          [`/app/periods/${y}/scope1/equipment-fuel`]:   { done: efCount ?? 0,   total: equFuelCount ?? 0 },
          [`/app/periods/${y}/scope1/refrigerants`]:     { done: refCount ?? 0,  total: equRefCount ?? 0 },
          [`/app/periods/${y}/scope1/industrial-gases`]: { done: gasCount ?? 0,  total: equGasCount ?? 0 },
          [`/app/periods/${y}/scope2/electricity`]:      { done: elecCount ?? 0, total: locCount ?? 0 },
        })
      } catch (e) {
        console.error('useEmissionCounters error:', e)
      }
    }

    load()
    return () => { cancelled = true }
  }, [selectedYear])

  return counters
}
