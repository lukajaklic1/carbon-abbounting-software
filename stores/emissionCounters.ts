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
        { count: locCount }, { count: vehCount }, { count: periodVehCount }, { count: equCount },
        { count: statCount }, { count: mobCount }, { count: efCount },
        { count: refCount }, { count: gasCount }, { count: elecCount },
        { count: heatCount }, { count: steamCount }, { count: coolCount },
        { count: plStatCount }, { count: plElecCount },
        { count: plHeatCount }, { count: plSteamCount }, { count: plCoolCount },
        { count: peFuelCount }, { count: peRefCount }, { count: peGasCount },
      ] = await Promise.all([
        supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true),
        pid ? supabase.from('period_vehicles').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true),
        pid ? supabase.from('scope1_stationary').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope1_mobile').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope1_equipment_fuel').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope1_refrigerants').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope1_industrial_gases').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope2_electricity').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope2_heat').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope2_steam').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('scope2_cooling').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
        pid ? supabase.from('period_locations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid).eq('scope_type', 'stationary') : Promise.resolve({ count: 0 }),
        pid ? supabase.from('period_locations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid).eq('scope_type', 'electricity') : Promise.resolve({ count: 0 }),
        pid ? supabase.from('period_locations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid).eq('scope_type', 'heat') : Promise.resolve({ count: 0 }),
        pid ? supabase.from('period_locations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid).eq('scope_type', 'steam') : Promise.resolve({ count: 0 }),
        pid ? supabase.from('period_locations').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid).eq('scope_type', 'cooling') : Promise.resolve({ count: 0 }),
        pid ? supabase.from('period_equipment').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid).eq('scope_type', 'fuel') : Promise.resolve({ count: 0 }),
        pid ? supabase.from('period_equipment').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid).eq('scope_type', 'refrigerants') : Promise.resolve({ count: 0 }),
        pid ? supabase.from('period_equipment').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('reporting_period_id', pid).eq('scope_type', 'industrial_gases') : Promise.resolve({ count: 0 }),
      ])

      set({
        counters: {
          '/app/locations': { done: locCount ?? 0, total: locCount ?? 0 },
          '/app/vehicles':  { done: vehCount ?? 0, total: vehCount ?? 0 },
          '/app/equipment': { done: equCount ?? 0, total: equCount ?? 0 },
          [`/app/periods/${year}/scope1/stationary`]:       { done: statCount ?? 0, total: plStatCount ?? 0 },
          [`/app/periods/${year}/scope1/mobile`]:           { done: mobCount ?? 0,  total: periodVehCount ?? 0 },
          [`/app/periods/${year}/scope1/equipment-fuel`]:   { done: efCount ?? 0,   total: peFuelCount ?? 0 },
          [`/app/periods/${year}/scope1/refrigerants`]:     { done: refCount ?? 0,  total: peRefCount ?? 0 },
          [`/app/periods/${year}/scope1/industrial-gases`]: { done: gasCount ?? 0,  total: peGasCount ?? 0 },
          [`/app/periods/${year}/scope2/electricity`]:      { done: elecCount ?? 0, total: plElecCount ?? 0 },
          [`/app/periods/${year}/scope2/heat`]:             { done: heatCount ?? 0,  total: plHeatCount ?? 0 },
          [`/app/periods/${year}/scope2/steam`]:            { done: steamCount ?? 0, total: plSteamCount ?? 0 },
          [`/app/periods/${year}/scope2/cooling`]:          { done: coolCount ?? 0,  total: plCoolCount ?? 0 },
        }
      })
    } catch (e) {
      console.error('emissionCounters refresh error:', e)
    }
  }
}))
