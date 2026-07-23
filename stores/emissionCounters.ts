import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

interface Counter { done: number; total: number }
interface EmissionCountersState {
  counters: Record<string, Counter>
  refresh: (year: number) => Promise<void>
}

export const useEmissionCountersStore = create<EmissionCountersState>((set) => ({
  counters: {},
  refresh: async (year: number) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return

      const { data: period } = await supabase
        .from('reporting_periods').select('id')
        .eq('organization_id', org.id).eq('year', year).single()
      const pid = period?.id ?? null

      const [
        { count: locCount }, { count: vehCount }, { count: equCount },
        { count: equFuelCount }, { count: equRefCount }, { count: equGasCount },
        { count: statCount }, { count: mobCount }, { count: efCount },
        { count: refCount }, { count: gasCount }, { count: elecCount },
        { count: heatCount }, { count: steamCount }, { count: coolCount },
        { count: locGasCount }, { count: locElecCount },
        { count: locHeatCount }, { count: locSteamCount }, { count: locCoolCount },
      ] = await Promise.all([
        supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true),
        supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true),
        supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true).eq('uses_fuel', true),
        supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true).eq('uses_refrigerants', true),
        supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true).eq('uses_industrial_gases', true),
        pid ? supabase.from('scope1_stationary').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope1_mobile').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope1_equipment_fuel').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope1_refrigerants').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope1_industrial_gases').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope2_electricity').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope2_heat').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope2_steam').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope2_cooling').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true).eq('uses_natural_gas', true),
        supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true).eq('uses_electricity', true),
        supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true).eq('uses_heat', true),
        supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true).eq('uses_steam', true),
        supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true).eq('uses_cooling', true),
      ])

      set({
        counters: {
          '/app/locations': { done: locCount ?? 0, total: locCount ?? 0 },
          '/app/vehicles':  { done: vehCount ?? 0, total: vehCount ?? 0 },
          '/app/equipment': { done: equCount ?? 0, total: equCount ?? 0 },
          [`/app/periods/${year}/scope1/stationary`]:       { done: statCount ?? 0, total: locGasCount ?? 0 },
          [`/app/periods/${year}/scope1/mobile`]:           { done: mobCount ?? 0,  total: vehCount ?? 0 },
          [`/app/periods/${year}/scope1/equipment-fuel`]:   { done: efCount ?? 0,   total: equFuelCount ?? 0 },
          [`/app/periods/${year}/scope1/refrigerants`]:     { done: refCount ?? 0,  total: equRefCount ?? 0 },
          [`/app/periods/${year}/scope1/industrial-gases`]: { done: gasCount ?? 0,  total: equGasCount ?? 0 },
          [`/app/periods/${year}/scope2/electricity`]:      { done: elecCount ?? 0, total: locElecCount ?? 0 },
          [`/app/periods/${year}/scope2/heat`]:             { done: heatCount ?? 0,  total: locHeatCount ?? 0 },
          [`/app/periods/${year}/scope2/steam`]:            { done: steamCount ?? 0, total: locSteamCount ?? 0 },
          [`/app/periods/${year}/scope2/cooling`]:          { done: coolCount ?? 0,  total: locCoolCount ?? 0 },
        }
      })
    } catch (e) {
      console.error('emissionCounters refresh error:', e)
    }
  }
}))
