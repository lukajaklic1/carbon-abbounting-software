'use client'

import { useEffect, useState } from 'react'
import { useSuperAdmin } from '../../SuperAdminContext'
import { createClient } from '@/lib/supabase/client'
import { Car } from 'lucide-react'
import { cn } from '@/lib/utils'

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  car: 'Osebni avtomobil', van: 'Kombi', truck: 'Tovornjak',
  bus: 'Avtobus', motorcycle: 'Motorno kolo', other: 'Drugo',
}

export default function AdminVehiclesPage() {
  const { selectedOrg } = useSuperAdmin()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (selectedOrg) load(selectedOrg.id) }, [selectedOrg?.id])

  async function load(orgId: string) {
    setLoading(true)
    const { data } = await createClient().from('vehicles').select('*').eq('organization_id', orgId).order('name')
    setRows(data ?? [])
    setLoading(false)
  }

  if (!selectedOrg) return <div className="p-8 text-sm text-gray-400">Izberite podjetje.</div>

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{selectedOrg.name}</p>
        <h1 className="text-2xl font-bold text-gray-900">Vozila</h1>
      </div>
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-sm text-gray-400">Nalaganje...</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-sm text-gray-300">Ni vozil.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Ime</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Tip</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Gorivo</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={cn('hover:bg-gray-50', i !== 0 && 'border-t border-gray-100')}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                        <Car className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{VEHICLE_TYPE_LABELS[r.vehicle_type] ?? r.vehicle_type ?? '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{r.fuel_type ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold',
                      r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {r.is_active ? 'Aktivno' : 'Neaktivno'}
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
