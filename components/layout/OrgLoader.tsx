'use client'

import { useEffect } from 'react'
import { useOrganizationStore } from '@/stores/organization'
import { usePeriodStore } from '@/stores/period'
import { createClient } from '@/lib/supabase/client'

export function OrgLoader() {
  const { setOrganization, setMemberRole } = useOrganizationStore()
  const { selectedYear, setCurrentPeriod, setAvailablePeriods, setSelectedYear } = usePeriodStore()

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Try owner first
        let org: any = null
        let role: 'admin' | 'member' = 'admin'

        const { data: ownedOrg } = await supabase
          .from('organizations').select('*').eq('owner_id', user.id).single()

        if (ownedOrg) {
          org = ownedOrg
          role = 'admin'
        } else {
          // Try as member
          const { data: membership } = await supabase
            .from('organization_members')
            .select('role, organizations(*)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()
          if (membership?.organizations) {
            org = membership.organizations
            role = membership.role as 'admin' | 'member'
          }
        }

        if (!org) return
        setOrganization(org)
        setMemberRole(role)

        const { data: periods } = await supabase
          .from('reporting_periods').select('*')
          .eq('organization_id', org.id)
          .order('year', { ascending: false })

        if (!periods?.length) return
        setAvailablePeriods(periods)

        const targetYear = selectedYear ?? periods[0].year
        const match = periods.find(p => p.year === targetYear) ?? periods[0]
        setSelectedYear(match.year)
        setCurrentPeriod(match)
      } catch {}
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
