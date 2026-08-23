'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type Company = {
  id: string
  name: string
  created_at: string
  member_count: number
  is_active: boolean
  upgrade_requested_at: string | null
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: orgs } = await supabase.from('organizations').select('id, name, created_at, is_active, upgrade_requested_at').order('created_at', { ascending: false })
      const { data: members } = await supabase.from('organization_members').select('organization_id, status')

      const countMap: Record<string, number> = {}
      ;(members ?? []).filter(m => m.status === 'active').forEach(m => {
        countMap[m.organization_id] = (countMap[m.organization_id] ?? 0) + 1
      })

      setCompanies((orgs ?? []).map(o => ({
        id: o.id,
        name: o.name,
        created_at: o.created_at,
        member_count: countMap[o.id] ?? 0,
        is_active: o.is_active ?? false,
        upgrade_requested_at: o.upgrade_requested_at ?? null,
      })))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    setToggling(id)
    try {
      const supabase = createClient()
      await supabase.from('organizations').update({ is_active: !current }).eq('id', id)
      setCompanies(cs => cs.map(c => c.id === id ? { ...c, is_active: !current } : c))
    } catch (e) { console.error(e) }
    setToggling(null)
  }

  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const fmt = (d: string) => new Date(d).toLocaleDateString('sl-SI', { day: 'numeric', month: 'numeric', year: 'numeric' })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 border-b border-gray-200 h-[57px] shrink-0">
        <h1 className="text-base font-semibold text-gray-900">Podjetja</h1>
      </div>

      <div className="flex gap-3 px-6 py-3.5 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Išči podjetje..."
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 w-56 placeholder:text-gray-300" />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Podjetje</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Registrirano</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Uporabniki</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Zahteva</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Plačnik</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12 text-sm text-gray-500">Nalaganje...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-sm text-gray-500">Ni rezultatov.</td></tr>
              ) : filtered.map((c, i) => (
                <tr key={c.id} className={cn('hover:bg-gray-50 transition-colors', i !== 0 && 'border-t border-gray-100')}>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{fmt(c.created_at)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{c.member_count} {c.member_count === 1 ? 'uporabnik' : 'uporabnika'}</td>
                  <td className="px-5 py-3.5">
                    {c.upgrade_requested_at ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md" style={{backgroundColor:'#fff3bf',border:'1px solid #ffe066',color:'#e67700'}}>
                        Zahteva · {fmt(c.upgrade_requested_at)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleActive(c.id, c.is_active)}
                      disabled={toggling === c.id}
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                        c.is_active ? 'bg-blue-600' : 'bg-gray-200',
                        toggling === c.id && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span className={cn(
                        'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                        c.is_active ? 'translate-x-4.5' : 'translate-x-0.5'
                      )} />
                    </button>
                    <span className="ml-2 text-xs text-gray-500">{c.is_active ? 'Plačnik' : 'Brezplačno'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
