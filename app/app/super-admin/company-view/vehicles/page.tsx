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

  if (!selectedOrg) return <div className="p-8 text-sm text-gray-500">Izberite podjetje.</div>

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 border-b border-gray-200 h-[57px] shrink-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 shrink-0">Vozila</h1>
          <p className="text-sm text-gray-500 truncate">{selectedOrg.name}</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Nalaganje...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-300">Ni vozil.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Ime</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Tip</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Gorivo</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={cn('hover:bg-gray-50 transition-colors', i !== 0 && 'border-t border-gray-200')}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{backgroundColor:'#e5eeff',border:'1px solid #d6e5ff'}}>
                          <Car className="h-3.5 w-3.5" style={{color:'#215bcf'}} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{VEHICLE_TYPE_LABELS[r.vehicle_type] ?? r.vehicle_type ?? '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{r.fuel_type ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={r.is_active ? {backgroundColor:'#e0fced',border:'1px solid #d4f8e6',color:'#098259'} : {backgroundColor:'#f1f3f5',border:'1px solid #e9ecef',color:'#868e96'}}>
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
    </div>
  )
}
