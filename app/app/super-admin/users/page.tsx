'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSuperAdmin } from '../SuperAdminContext'

type UserRow = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  org_name: string
  role: string
  is_super_admin: boolean
  created_at: string
  status: string
}

export default function UsersPage() {
  const { selectedOrg } = useSuperAdmin()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => { load() }, [selectedOrg?.id])

  async function load() {
    setLoading(true)
    try {
      const supabase = createClient()

      const [{ data: members }, { data: orgs }, { data: superAdmins }] = await Promise.all([
        selectedOrg
          ? supabase.from('organization_members').select('*').eq('organization_id', selectedOrg.id).order('created_at', { ascending: false })
          : supabase.from('organization_members').select('*').order('created_at', { ascending: false }),
        supabase.from('organizations').select('id, name, owner_id'),
        supabase.from('super_admins').select('user_id'),
      ])

      const orgMap: Record<string, string> = {}
      ;(orgs ?? []).forEach(o => { orgMap[o.id] = o.name })
      const superAdminIds = new Set((superAdmins ?? []).map(s => s.user_id))

      const rows: UserRow[] = (members ?? []).map(m => ({
        id: m.id,
        first_name: m.first_name ?? null,
        last_name: m.last_name ?? null,
        email: m.invited_email ?? m.email ?? null,
        org_name: orgMap[m.organization_id] ?? '—',
        role: superAdminIds.has(m.user_id) ? 'super_admin' : m.role,
        is_super_admin: superAdminIds.has(m.user_id),
        created_at: m.accepted_at ?? m.invited_at ?? m.created_at,
        status: m.status,
      }))

      setUsers(rows)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const filtered = users.filter(u => {
    const name = `${u.first_name ?? ''} ${u.last_name ?? ''} ${u.email ?? ''}`.toLowerCase()
    if (search && !name.includes(search.toLowerCase())) return false
    if (roleFilter === 'admin' && u.role !== 'admin') return false
    if (roleFilter === 'user' && u.role !== 'member') return false
    if (roleFilter === 'super_admin' && !u.is_super_admin) return false
    return true
  })

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('sl-SI') : '—'

  const roleBadge = (role: string, isSA: boolean) => {
    if (isSA) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Super admin</span>
    if (role === 'admin') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#d4eddf] text-[#0f0f10]">Admin</span>
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#fafafa] text-[#767676]">Uporabnik</span>
  }

  const fullName = (u: UserRow) => [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || '—'

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#0f0f10]">Uporabniki</h1>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#767676]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Ime, priimek ali e-pošta..."
            className="pl-8 pr-3 py-2 text-sm border border-[#ececec] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[#ececec] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Vse vloge</option>
          <option value="admin">Admin</option>
          <option value="user">Uporabnik</option>
          <option value="super_admin">Super admin</option>
        </select>
      </div>

      <div className="bg-white border border-[#ececec] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#fafafc]">
            <tr className="border-b border-[#ececec]">
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#767676]">Uporabnik</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#767676]">E-pošta</th>
              {!selectedOrg && <th className="text-left px-5 py-3 text-xs font-semibold text-[#767676]">Podjetje</th>}
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#767676]">Vloga</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#767676]">Registriran</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#767676]">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-sm text-[#767676]">Nalaganje...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-sm text-[#767676]">Ni rezultatov.</td></tr>
            ) : filtered.map((u, i) => (
              <tr key={u.id} className={cn('border-b border-gray-50 hover:bg-[#f9f9f9] transition-colors', i === filtered.length - 1 && 'border-0')}>
                <td className="px-5 py-3.5 text-sm font-semibold text-[#031f18]">{fullName(u)}</td>
                <td className="px-5 py-3.5 text-sm text-[#767676]">{u.email}</td>
                {!selectedOrg && <td className="px-5 py-3.5 text-sm text-[#767676]">{u.org_name}</td>}
                <td className="px-5 py-3.5">{roleBadge(u.role, u.is_super_admin)}</td>
                <td className="px-5 py-3.5 text-sm text-[#767676]">{fmt(u.created_at)}</td>
                <td className="px-5 py-3.5">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold',
                    u.status === 'active' ? 'bg-[#efefef] text-[#0f0f10]' : 'bg-[#fafafa] text-[#767676]')}>
                    {u.status === 'active' ? 'Aktiven' : u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
