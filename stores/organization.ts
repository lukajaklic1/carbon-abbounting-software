import { create } from 'zustand'

export interface Organization {
  id: string
  name: string
  slug: string
  industry: string
  country_code: string
  employees_range?: string
  plan: 'free' | 'starter' | 'professional' | 'enterprise'
  owner_id: string
  created_at: string
}

interface OrganizationStore {
  organization: Organization | null
  memberRole: 'admin' | 'member' | null
  setOrganization: (org: Organization | null) => void
  setMemberRole: (role: 'admin' | 'member' | null) => void
}

export const useOrganizationStore = create<OrganizationStore>((set) => ({
  organization: null,
  memberRole: null,
  setOrganization: (org) => set({ organization: org }),
  setMemberRole: (role) => set({ memberRole: role }),
}))
