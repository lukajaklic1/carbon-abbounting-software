'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSuperAdmin } from '../../../SuperAdminContext'
import { fmtQty } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

type SectionConfig = {
  title: string
  scope: string
  table: string
  resourceTable?: string
  resourceKey?: string
  typeKey?: string
  typeLabel?: string
  directRows?: boolean
}

const SECTIONS: Record<string, SectionConfig> = {
  'scope1/stationary': {
    title: 'Stacionarno zgorevanje', scope: 'Scope 1',
    table: 'scope1_stationary', resourceTable: 'locations', resourceKey: 'location_id', typeKey: 'fuel_type', typeLabel: 'Gorivo',
  },
  'scope1/mobile': {
    title: 'Poraba vozil', scope: 'Scope 1',
    table: 'scope1_mobile', resourceTable: 'vehicles', resourceKey: 'vehicle_id', typeKey: 'fuel_type', typeLabel: 'Gorivo',
  },
  'scope1/equipment-fuel': {
    title: 'Gorivo opreme', scope: 'Scope 1',
    table: 'scope1_equipment_fuel', resourceTable: 'equipment', resourceKey: 'equipment_id', typeKey: 'fuel_type', typeLabel: 'Gorivo',
  },
  'scope1/refrigerants': {
    title: 'Hladilni plini', scope: 'Scope 1',
    table: 'scope1_refrigerants', typeKey: 'refrigerant_type', typeLabel: 'Vrsta', directRows: true,
  },
  'scope1/industrial-gases': {
    title: 'Industrijski plini', scope: 'Scope 1',
    table: 'scope1_industrial_gases', resourceTable: 'equipment', resourceKey: 'equipment_id', typeKey: 'gas_type', typeLabel: 'Vrsta',
  },
  'scope2/electricity': {
    title: 'Elektrika', scope: 'Scope 2',
    table: 'scope2_electricity', resourceTable: 'locations', resourceKey: 'location_id', typeKey: 'country_code', typeLabel: 'Država',
  },
  'scope2/heat': {
    title: 'Toplota', scope: 'Scope 2',
    table: 'scope2_heat', resourceTable: 'locations', resourceKey: 'location_id', typeKey: 'fuel_type', typeLabel: 'Vir',
  },
  'scope2/steam': {
    title: 'Para', scope: 'Scope 2',
    table: 'scope2_steam', resourceTable: 'locations', resourceKey: 'location_id',
  },
  'scope2/cooling': {
    title: 'Hlajenje', scope: 'Scope 2',
    table: 'scope2_cooling', resourceTable: 'locations', resourceKey: 'location_id',
  },
}

export default function CompanyViewSectionPage() {
  const { selectedOrg } = useSuperAdmin()
  const params = useParams()
  const year = Number(params.year)
  const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug ?? ''

  const cfg = SECTIONS[slug]

  const [rows, setRows] = useState<any[]>([])
  const [resourceMap, setResourceMap] = useState<Record<string, string>>({})
  const [totalCo2e, setTotalCo2e] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedOrg && cfg && year) load(selectedOrg.id, year)
  }, [selectedOrg?.id, year, slug])

  async function load(orgId: string, yr: number) {
    setLoading(true)
    setRows([])
    setResourceMap({})
    try {
      const supabase = createClient()

      const { data: pd } = await supabase
        .from('reporting_periods').select('id').eq('organization_id', orgId).eq('year', yr).maybeSingle()

      if (!pd) { setLoading(false); return }

      const { data: entries } = await supabase
        .from(cfg.table).select('*').eq('organization_id', orgId).eq('reporting_period_id', pd.id)

      setRows(entries ?? [])
      setTotalCo2e((entries ?? []).reduce((s: number, r: any) => s + (r.co2e_kg ?? 0), 0))

      if (cfg.resourceTable && cfg.resourceKey) {
        const { data: resources } = await supabase
          .from(cfg.resourceTable).select('id, name').eq('organization_id', orgId)
        const map: Record<string, string> = {}
        ;(resources ?? []).forEach((r: any) => { map[r.id] = r.name })
        setResourceMap(map)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (!cfg) {
    return <div className="p-8 text-sm text-[#455451]">Neznana sekcija.</div>
  }
  if (!selectedOrg) {
    return <div className="p-8 text-sm text-[#455451]">Izberite podjetje v zgornjem meniju.</div>
  }

  const getResourceName = (row: any) =>
    cfg.resourceKey ? (resourceMap[row[cfg.resourceKey]] ?? row[cfg.resourceKey] ?? '—') : '—'

  const getTypeVal = (row: any) => cfg.typeKey ? (row[cfg.typeKey] ?? '—') : null

  const fmtCo2e = (kg: number) => `${(kg / 1000).toFixed(3).replace('.', ',')} tCO₂e`

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold text-[#455451] uppercase tracking-widest mb-1">
          {cfg.scope} · {selectedOrg.name} · {year}
        </p>
        <h1 className="text-2xl font-bold text-[#031f18]">{cfg.title}</h1>
      </div>

      {/* Summary card */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-3 bg-white border border-[#e2e2e4] rounded-xl px-5 py-4">
          <div className="w-9 h-9 bg-[#edf7f1] rounded-lg flex items-center justify-center shrink-0">
            <svg className="h-4 w-4 text-[#26a552]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-[#455451]">Skupne emisije</p>
            <p className="text-lg font-bold text-[#031f18]">{fmtCo2e(totalCo2e)}</p>
          </div>
          <div className="ml-6 pl-6 border-l border-[#e2e2e4]">
            <p className="text-xs text-[#455451]">Vnosov</p>
            <p className="text-lg font-bold text-[#031f18]">{rows.length}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-[#e2e2e4] rounded-xl p-12 text-center text-sm text-[#455451]">Nalaganje...</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-[#e2e2e4] rounded-xl p-12 text-center text-sm text-gray-300">
          Ni vnesenih podatkov za to kategorijo.
        </div>
      ) : (
        <div className="bg-white border border-[#e2e2e4] rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#fafafc]">
              <tr className="border-b border-[#e2e2e4] bg-[#f9f9f9]/50">
                {!cfg.directRows && cfg.resourceTable && (
                  <th className="text-left text-xs font-semibold text-[#455451] uppercase tracking-wider px-5 py-3">Vir</th>
                )}
                {cfg.typeKey && cfg.typeLabel && (
                  <th className="text-left text-xs font-semibold text-[#455451] uppercase tracking-wider px-5 py-3">{cfg.typeLabel}</th>
                )}
                <th className="text-left text-xs font-semibold text-[#455451] uppercase tracking-wider px-5 py-3">Količina</th>
                <th className="text-left text-xs font-semibold text-[#455451] uppercase tracking-wider px-5 py-3">Emisije</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className={cn('hover:bg-[#f9f9f9] transition-colors', i !== 0 && 'border-t border-[#e2e2e4]')}>
                  {!cfg.directRows && cfg.resourceTable && (
                    <td className="px-5 py-4 text-sm font-semibold text-[#031f18]">{getResourceName(row)}</td>
                  )}
                  {cfg.typeKey && cfg.typeLabel && (
                    <td className="px-5 py-4 text-sm text-[#455451]">{getTypeVal(row)}</td>
                  )}
                  <td className="px-5 py-4 text-sm text-[#031f18]">
                    {row.quantity != null
                      ? `${fmtQty(row.quantity)} ${row.unit ?? ''}`
                      : row.quantity_kg != null
                      ? `${fmtQty(row.quantity_kg)} kg`
                      : row.kwh != null
                      ? `${fmtQty(row.kwh)} kWh`
                      : '—'}
                  </td>
                  <td className="px-5 py-4">
                    {row.co2e_kg != null ? (
                      <span className="text-sm font-semibold text-green-700">{fmtCo2e(row.co2e_kg)}</span>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#e2e2e4] bg-[#f9f9f9]/50">
                {!cfg.directRows && cfg.resourceTable && <td className="px-5 py-3" />}
                {cfg.typeKey && cfg.typeLabel && <td className="px-5 py-3" />}
                <td className="px-5 py-3 text-xs font-semibold text-[#455451]">Skupaj</td>
                <td className="px-5 py-3 text-sm font-bold text-[#031f18]">{fmtCo2e(totalCo2e)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
