'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

type Org = { id: string; name: string }

type SuperAdminContextType = {
  orgs: Org[]
  selectedOrg: Org | null
  setSelectedOrg: (org: Org | null) => void
  year: number
  setYear: (year: number) => void
}

const SuperAdminContext = createContext<SuperAdminContextType>({
  orgs: [],
  selectedOrg: null,
  setSelectedOrg: () => {},
  year: new Date().getFullYear(),
  setYear: () => {},
})

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    createClient()
      .from('organizations')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        const list = data ?? []
        setOrgs(list)
        if (list.length > 0) setSelectedOrg(list[0])
      })
  }, [])

  return (
    <SuperAdminContext.Provider value={{ orgs, selectedOrg, setSelectedOrg, year, setYear }}>
      {children}
    </SuperAdminContext.Provider>
  )
}

export function useSuperAdmin() {
  return useContext(SuperAdminContext)
}
