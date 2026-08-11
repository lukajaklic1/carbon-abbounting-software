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
  status: 'active'
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: orgs } = await supabase.from('organizations').select('id, name, created_at').order('created_at', { ascending: false })
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
        status: 'active',
      })))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const fmt = (d: string) => new Date(d).toLocaleDateString('sl-SI', { day: 'numeric', month: 'numeric', year: 'numeric' })

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#031f18]">Podjetja</h1>
        <p className="text-sm text-[#455451] mt-0.5">{companies.length} podjetij na platformi</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#455451]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Išči podjetje..."
            className="pl-8 pr-3 py-2 text-sm border border-[#e2e2e4] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e2e2e4] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#fafafc]">
            <tr className="border-b border-[#e2e2e4]">
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#455451]">Podjetje</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#455451]">Registrirano</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#455451]">Uporabniki</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#455451]">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-12 text-sm text-[#455451]">Nalaganje...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-sm text-[#455451]">Ni rezultatov.</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} className={cn('border-b border-gray-50 hover:bg-[#f9f9f9] transition-colors', i === filtered.length - 1 && 'border-0')}>
                <td className="px-5 py-3.5 text-sm font-semibold text-[#031f18]">{c.name}</td>
                <td className="px-5 py-3.5 text-sm text-[#455451]">{fmt(c.created_at)}</td>
                <td className="px-5 py-3.5 text-sm text-[#455451]">{c.member_count} {c.member_count === 1 ? 'uporabnik' : 'uporabnika'}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Aktivno</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
