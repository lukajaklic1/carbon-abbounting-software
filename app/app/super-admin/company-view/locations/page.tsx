'use client'

import { useEffect, useState } from 'react'
import { useSuperAdmin } from '../../SuperAdminContext'
import { createClient } from '@/lib/supabase/client'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminLocationsPage() {
  const { selectedOrg } = useSuperAdmin()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (selectedOrg) load(selectedOrg.id) }, [selectedOrg?.id])

  async function load(orgId: string) {
    setLoading(true)
    const { data } = await createClient().from('locations').select('*').eq('organization_id', orgId).order('name')
    setRows(data ?? [])
    setLoading(false)
  }

  if (!selectedOrg) return <div className="p-8 text-sm text-[#767676]">Izberite podjetje.</div>

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold text-[#767676] uppercase tracking-widest mb-1">{selectedOrg.name}</p>
        <h1 className="text-2xl font-medium text-[#0f0f10]">Lokacije</h1>
      </div>
      {loading ? (
        <div className="bg-white border border-[#ececec] rounded-xl p-12 text-center text-sm text-[#767676]">Nalaganje...</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-[#ececec] rounded-xl p-12 text-center text-sm text-gray-300">Ni lokacij.</div>
      ) : (
        <div className="bg-white border border-[#ececec] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#fafafc]">
              <tr className="border-b border-[#ececec] bg-[#f9f9f9]/50">
                <th className="text-left text-xs font-semibold text-[#767676] uppercase tracking-wider px-5 py-3">Ime</th>
                <th className="text-left text-xs font-semibold text-[#767676] uppercase tracking-wider px-5 py-3">Naslov</th>
                <th className="text-left text-xs font-semibold text-[#767676] uppercase tracking-wider px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={cn('hover:bg-[#f9f9f9]', i !== 0 && 'border-t border-[#ececec]')}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-[#efefef] rounded-lg flex items-center justify-center shrink-0">
                        <MapPin className="h-3.5 w-3.5 text-[#0f0f10]" />
                      </div>
                      <span className="text-sm font-semibold text-[#031f18]">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-[#767676]">{r.address ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold',
                      r.is_active ? 'bg-[#efefef] text-[#0f0f10]' : 'bg-[#fafafa] text-[#767676]')}>
                      {r.is_active ? 'Aktivna' : 'Neaktivna'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
