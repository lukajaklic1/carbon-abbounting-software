import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ReportingPeriod {
  id: string
  organization_id: string
  year: number
  status: 'draft' | 'in_progress' | 'completed' | 'verified'
  total_co2e_kg: number
  created_at: string
}

interface PeriodStore {
  selectedYear: number | null
  currentPeriod: ReportingPeriod | null
  availablePeriods: ReportingPeriod[]
  setSelectedYear: (year: number) => void
  setCurrentPeriod: (period: ReportingPeriod | null) => void
  setAvailablePeriods: (periods: ReportingPeriod[]) => void
}

export const usePeriodStore = create<PeriodStore>()(
  persist(
    (set) => ({
      selectedYear: null,
      currentPeriod: null,
      availablePeriods: [],
      setSelectedYear: (year) => set({ selectedYear: year }),
      setCurrentPeriod: (period) => set({ currentPeriod: period }),
      setAvailablePeriods: (periods) => set({ availablePeriods: periods }),
    }),
    {
      name: 'carboniq-period',
      partialize: (state: PeriodStore) => ({ selectedYear: state.selectedYear }),
    }
  )
)
