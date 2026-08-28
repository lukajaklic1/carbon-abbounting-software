'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { usePeriodStore } from '@/stores/period'
import { IconAtom2, IconEngine, IconPlugConnected, IconTruckDelivery } from '@tabler/icons-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { cn } from '@/lib/utils'

const SCOPE_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd']

type Period = { id: string; year: number; total_co2e_kg: number }

type FuelBreakdown = { fuel_type: string; quantity: number; unit: string; co2e_kg: number }

type ScopeData = {
  scope1_kg: number
  scope2_kg: number
  scope3_kg: number
  sources: { name: string; kg: number; scope: string; qty?: number; unit?: string }[]
  mobileFuels: FuelBreakdown[]
  equipFuels: FuelBreakdown[]
}

type YearPoint = { year: string; emisije: number }

export default function AnalyticsPage() {
  const { t } = useLocale()
  const { availablePeriods, selectedYear } = usePeriodStore()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [scopeData, setScopeData] = useState<ScopeData | null>(null)
  const [yearTrend, setYearTrend] = useState<YearPoint[]>([])
  const [loading, setLoading] = useState(true)

  const year = selectedYear ?? new Date().getFullYear()

  useEffect(() => { loadData() }, [year])

  async function loadData() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return
      setOrgId(org.id)

      const { data: pd } = await supabase.from('reporting_periods').select('id').eq('organization_id', org.id).eq('year', year).single()
      if (!pd) { setScopeData({ scope1_kg: 0, scope2_kg: 0, scope3_kg: 0, sources: [], mobileFuels: [], equipFuels: [] }); setLoading(false); return }

      // Fetch all emission sources in parallel
      const [stationary, mobile, equipFuel, refrigerants, gases, electricity, heat, steam, cooling, scope3subs] = await Promise.all([
        supabase.from('scope1_stationary').select('co2e_kg, quantity, unit').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope1_mobile').select('co2e_kg, fuel_type, quantity, unit').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope1_equipment_fuel').select('co2e_kg, fuel_type, quantity, unit').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope1_refrigerants').select('co2e_kg, quantity, unit').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope1_industrial_gases').select('co2e_kg, quantity, unit').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope2_electricity').select('co2e_kg, quantity, unit').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope2_heat').select('co2e_kg, quantity, unit').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope2_steam').select('co2e_kg, quantity, unit').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope2_cooling').select('co2e_kg, quantity, unit').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope3_submissions').select('co2e_kg, category_number').eq('organization_id', org.id).eq('reporting_period_id', pd.id).eq('status', 'done'),
      ])

      const sum = (rows: any) => (rows.data ?? []).reduce((s: number, r: any) => s + (r.co2e_kg ?? 0), 0)
      // Sum quantity — returns null if mixed units, otherwise {qty, unit}
      const sumQty = (rows: any): { qty: number; unit: string } | null => {
        const data = rows.data ?? []
        if (!data.length) return null
        const units = [...new Set(data.map((r: any) => r.unit))]
        if (units.length !== 1) return null
        return { qty: data.reduce((s: number, r: any) => s + (r.quantity ?? 0), 0), unit: units[0] as string }
      }

      const stationaryKg = sum(stationary)
      const mobileKg = sum(mobile)
      const equipKg = sum(equipFuel)
      const refKg = sum(refrigerants)
      const gasKg = sum(gases)
      const elecKg = sum(electricity)
      const heatKg = sum(heat)
      const steamKg = sum(steam)
      const coolingKg = sum(cooling)
      const scope3Kg = sum(scope3subs)

      const scope1_kg = stationaryKg + mobileKg + equipKg + refKg + gasKg
      const scope2_kg = elecKg + heatKg + steamKg + coolingKg

      const qStationary = sumQty(stationary)
      const qEquip = sumQty(equipFuel)
      const qRef = sumQty(refrigerants)
      const qGas = sumQty(gases)
      const qElec = sumQty(electricity)
      const qHeat = sumQty(heat)
      const qSteam = sumQty(steam)
      const qCooling = sumQty(cooling)

      const sources = [
        { name: t('Zemeljski plin', 'Natural gas'), kg: stationaryKg, scope: 'Scope 1', qty: qStationary?.qty, unit: qStationary?.unit },
        { name: t('Gorivo vozil', 'Vehicle fuel'), kg: mobileKg, scope: 'Scope 1' },
        { name: t('Gorivo opreme', 'Equipment fuel'), kg: equipKg, scope: 'Scope 1', qty: qEquip?.qty, unit: qEquip?.unit },
        { name: t('Hladilni plini', 'Refrigerants'), kg: refKg, scope: 'Scope 1', qty: qRef?.qty, unit: qRef?.unit },
        { name: t('Industrijski plini', 'Industrial gases'), kg: gasKg, scope: 'Scope 1', qty: qGas?.qty, unit: qGas?.unit },
        { name: t('Elektrika', 'Electricity'), kg: elecKg, scope: 'Scope 2', qty: qElec?.qty, unit: qElec?.unit },
        { name: t('Toplota', 'Heat'), kg: heatKg, scope: 'Scope 2', qty: qHeat?.qty, unit: qHeat?.unit },
        { name: t('Para', 'Steam'), kg: steamKg, scope: 'Scope 2', qty: qSteam?.qty, unit: qSteam?.unit },
        { name: t('Hlajenje', 'Cooling'), kg: coolingKg, scope: 'Scope 2', qty: qCooling?.qty, unit: qCooling?.unit },
        { name: t('Obseg 3', 'Scope 3'), kg: scope3Kg, scope: 'Scope 3' },
      ].filter(s => s.kg > 0)

      // Helper: group rows by fuel_type
      const groupByFuel = (rows: any): FuelBreakdown[] => {
        const map: Record<string, { quantity: number; unit: string; co2e_kg: number }> = {}
        for (const r of (rows.data ?? [])) {
          const ft = r.fuel_type ?? 'other'
          if (!map[ft]) map[ft] = { quantity: 0, unit: r.unit ?? 'L', co2e_kg: 0 }
          map[ft].quantity += r.quantity ?? 0
          map[ft].co2e_kg += r.co2e_kg ?? 0
          map[ft].unit = r.unit ?? map[ft].unit
        }
        return Object.entries(map)
          .map(([fuel_type, v]) => ({ fuel_type, ...v }))
          .filter(f => f.co2e_kg > 0)
          .sort((a, b) => b.co2e_kg - a.co2e_kg)
      }

      const mobileFuels = groupByFuel(mobile)
      const equipFuels = groupByFuel(equipFuel)

      setScopeData({ scope1_kg, scope2_kg, scope3_kg: scope3Kg, sources, mobileFuels, equipFuels })

      // Trend: fetch real sums for all available periods
      const { data: allPeriods } = await supabase
        .from('reporting_periods').select('id, year').eq('organization_id', org.id).order('year')

      if (allPeriods && allPeriods.length > 0) {
        const TABLES = ['scope1_stationary','scope1_mobile','scope1_equipment_fuel','scope1_refrigerants','scope1_industrial_gases','scope2_electricity','scope2_heat','scope2_steam','scope2_cooling']
        const trendPoints: YearPoint[] = []
        for (const p of allPeriods) {
          const results = await Promise.all(TABLES.map(tbl =>
            supabase.from(tbl).select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', p.id)
          ))
          const s3 = await supabase.from('scope3_submissions').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', p.id).eq('status', 'done')
          const totalKg = [...results, s3].reduce((s, r) => s + (r.data ?? []).reduce((a: number, x: any) => a + (x.co2e_kg ?? 0), 0), 0)
          if (totalKg > 0) trendPoints.push({ year: String(p.year), emisije: parseFloat((totalKg / 1000).toFixed(3)) })
        }
        setYearTrend(trendPoints)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const total = (scopeData?.scope1_kg ?? 0) + (scopeData?.scope2_kg ?? 0) + (scopeData?.scope3_kg ?? 0)
  const totalT = total / 1000

  const yearChartData = yearTrend

  const scopeChartData = [
    { name: t('Obseg 1', 'Scope 1'), value: parseFloat(((scopeData?.scope1_kg ?? 0) / 1000).toFixed(3)), color: SCOPE_COLORS[0] },
    { name: t('Obseg 2', 'Scope 2'), value: parseFloat(((scopeData?.scope2_kg ?? 0) / 1000).toFixed(3)), color: SCOPE_COLORS[1] },
    { name: t('Obseg 3', 'Scope 3'), value: parseFloat(((scopeData?.scope3_kg ?? 0) / 1000).toFixed(3)), color: SCOPE_COLORS[2] },
  ].filter(d => d.value > 0)

  const pct = (kg: number) => total > 0 ? ((kg / total) * 100).toFixed(1) : '0'

  const fmtT = (kg: number) => (kg / 1000).toFixed(2).replace('.', ',')

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 border-b border-gray-200 min-h-[57px] py-3 sm:h-[57px] sm:py-0 shrink-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 shrink-0">{t('Analitika', 'Analytics')}</h1>
          <p className="text-sm text-gray-500 truncate">{t('Pregled emisij CO₂e po scopih in kategorijah.', 'Overview of CO₂e emissions by scope and category.')}</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-6 space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('Skupne emisije', 'Total emissions'), value: fmtT(total), icon: IconAtom2, iconColor: '#3b82f6', bg: '#eff6ff' },
          { label: t('Obseg 1', 'Scope 1'), value: fmtT(scopeData?.scope1_kg ?? 0), icon: IconEngine, iconColor: '#007d53', bg: '#e0fced' },
          { label: t('Obseg 2', 'Scope 2'), value: fmtT(scopeData?.scope2_kg ?? 0), icon: IconPlugConnected, iconColor: '#3b82f6', bg: '#eff6ff' },
          { label: t('Obseg 3', 'Scope 3'), value: fmtT(scopeData?.scope3_kg ?? 0), icon: IconTruckDelivery, iconColor: '#007d53', bg: '#e0fced' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: card.bg }}>
                <Icon className="h-4 w-4" style={{ color: card.iconColor }} />
              </div>
              <p className="text-xs font-medium text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-semibold text-gray-900 tabular-nums">{loading ? '—' : card.value} <span className="text-sm font-medium text-gray-500">tCO₂e</span></p>
            </div>
          )
        })}
      </div>

      {/* Charts row 1: trend + scope pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend by year */}
        {/* Trend by year */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-base font-semibold text-gray-900 mb-5">{t('Emisije po letu', 'Emissions by year')}</p>
          {yearChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={yearChartData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" t" width={52} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: any) => [`${String(v).replace('.', ',')} tCO₂e`, t('Emisije', 'Emissions')]}
                />
                <Bar dataKey="emisije" radius={[6, 6, 0, 0]}>
                  {yearChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.year === String(year) ? '#3b82f6' : '#93c5fd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-sm text-gray-300">{t('Ni podatkov za prikaz', 'No data to display')}</div>
          )}
        </div>

        {/* Scope breakdown bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-base font-semibold text-gray-900 mb-5">{t('Emisije po obsegu', 'Emissions by scope')}</p>
          {scopeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scopeChartData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" t" width={52} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: any) => [`${String(v).replace('.', ',')} tCO₂e`]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {scopeChartData.map((entry, i) => (
                    <Cell key={i} fill={['#3b82f6', '#60a5fa', '#93c5fd'][i % 3]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-sm text-gray-300">{t('Ni podatkov', 'No data')}</div>
          )}
        </div>
      </div>

      {/* Emission sources table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-base font-semibold text-gray-900">{t('Emisije po virih', 'Emissions by source')}</p>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">{t('Nalaganje...', 'Loading...')}</div>
        ) : total === 0 ? (
          <div className="py-12 text-center text-sm text-gray-300">{t('Ni podatkov za prikaz', 'No data to display')}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Vir', 'Source')}</th>
                <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">{t('Poraba', 'Consumption')}</th>
                <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">tCO₂e</th>
                <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* OBSEG 1 */}
              {scopeData?.scope1_kg !== undefined && scopeData.scope1_kg > 0 && <>
                <tr className="bg-gray-50">
                  <td colSpan={4} className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('Obseg 1 – Neposredne emisije', 'Scope 1 – Direct emissions')}</td>
                </tr>
                {(() => {
                  const mobileKg = (scopeData?.mobileFuels ?? []).reduce((s, f) => s + f.co2e_kg, 0)
                  const rows = [
                    t('Zemeljski plin', 'Natural gas'),
                    t('Hladilni plini', 'Refrigerants'),
                    t('Industrijski plini', 'Industrial gases'),
                  ].map(name => scopeData.sources.find(s => s.name === name)).filter((s): s is NonNullable<typeof s> => !!s && s.kg > 0)
                  const equipKgTotal = (scopeData?.equipFuels ?? []).reduce((s, f) => s + f.co2e_kg, 0)
                  const FUEL_LABELS: Record<string, string> = {
                    diesel: t('Dizel', 'Diesel'), petrol: t('Bencin', 'Petrol'),
                    lpg: 'LPG', cng: 'CNG', lng: 'LNG',
                    natural_gas: t('Zemeljski plin', 'Natural gas'),
                    heating_oil: t('Kurilno olje', 'Heating oil'),
                    heavy_fuel_oil: t('Težko kurilno olje', 'Heavy fuel oil'),
                    kerosene: t('Kerozin', 'Kerosene'),
                    biodiesel: t('Biodizel', 'Biodiesel'),
                    biogas: t('Bioplin', 'Biogas'),
                    propane: t('Propan', 'Propane'),
                    butane: t('Butan', 'Butane'),
                    coal_anthracite: t('Premog – antracit', 'Coal – Anthracite'),
                    coal_bituminous: t('Premog – bituminozni', 'Coal – Bituminous'),
                    coal_lignite: t('Premog – lignit', 'Coal – Lignite'),
                    coke: t('Koks', 'Coke'),
                    wood: t('Les / polena', 'Wood / logs'),
                    wood_chips: t('Les / biomasa', 'Wood / biomass'),
                    wood_pellets: t('Lesne pelete', 'Wood pellets'),
                    msw: t('Komunalni odpadki', 'Municipal solid waste'),
                    other: t('Drugo', 'Other'),
                  }
                  return <>
                    {rows.map(r => (
                      <tr key={r.name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm text-gray-700">{r.name}</td>
                        <td className="px-5 py-3 text-sm text-right text-gray-500 tabular-nums">
                          {r.qty != null ? `${r.qty.toLocaleString('sl-SI', { maximumFractionDigits: 1 })} ${r.unit}` : '—'}
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-right text-gray-900 tabular-nums">{(r.kg / 1000).toFixed(3).replace('.', ',')}</td>
                        <td className="px-5 py-3 text-sm text-right text-gray-500 tabular-nums">{pct(r.kg)}%</td>
                      </tr>
                    ))}
                    {equipKgTotal > 0 && <>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm text-gray-700">{t('Gorivo opreme', 'Equipment fuel')}</td>
                        <td className="px-5 py-3 text-sm text-right text-gray-400">—</td>
                        <td className="px-5 py-3 text-sm font-semibold text-right text-gray-900 tabular-nums">{(equipKgTotal / 1000).toFixed(3).replace('.', ',')}</td>
                        <td className="px-5 py-3 text-sm text-right text-gray-500 tabular-nums">{pct(equipKgTotal)}%</td>
                      </tr>
                      {(scopeData?.equipFuels ?? []).map(f => (
                        <tr key={`eq-${f.fuel_type}`} className="hover:bg-gray-50 transition-colors bg-gray-50/50">
                          <td className="pl-10 pr-5 py-2.5 text-sm text-gray-500">↳ {FUEL_LABELS[f.fuel_type] ?? f.fuel_type}</td>
                          <td className="px-5 py-2.5 text-sm text-right text-gray-400 tabular-nums">{f.quantity.toLocaleString('sl-SI', { maximumFractionDigits: 1 })} {f.unit}</td>
                          <td className="px-5 py-2.5 text-sm text-right text-gray-700 tabular-nums">{(f.co2e_kg / 1000).toFixed(3).replace('.', ',')}</td>
                          <td className="px-5 py-2.5 text-sm text-right text-gray-400 tabular-nums">{pct(f.co2e_kg)}%</td>
                        </tr>
                      ))}
                    </>}
                    {mobileKg > 0 && <>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm text-gray-700">{t('Gorivo vozil', 'Vehicle fuel')}</td>
                        <td className="px-5 py-3 text-sm text-right text-gray-400">—</td>
                        <td className="px-5 py-3 text-sm font-semibold text-right text-gray-900 tabular-nums">{(mobileKg / 1000).toFixed(3).replace('.', ',')}</td>
                        <td className="px-5 py-3 text-sm text-right text-gray-500 tabular-nums">{pct(mobileKg)}%</td>
                      </tr>
                      {(scopeData?.mobileFuels ?? []).map(f => (
                        <tr key={f.fuel_type} className="hover:bg-gray-50 transition-colors bg-gray-50/50">
                          <td className="pl-10 pr-5 py-2.5 text-sm text-gray-500">↳ {FUEL_LABELS[f.fuel_type] ?? f.fuel_type}</td>
                          <td className="px-5 py-2.5 text-sm text-right text-gray-400 tabular-nums">{f.quantity.toLocaleString('sl-SI', { maximumFractionDigits: 1 })} {f.unit}</td>
                          <td className="px-5 py-2.5 text-sm text-right text-gray-700 tabular-nums">{(f.co2e_kg / 1000).toFixed(3).replace('.', ',')}</td>
                          <td className="px-5 py-2.5 text-sm text-right text-gray-400 tabular-nums">{pct(f.co2e_kg)}%</td>
                        </tr>
                      ))}
                    </>}
                    <tr className="bg-blue-50/50">
                      <td className="px-5 py-2.5 text-sm font-semibold text-gray-700">{t('Skupaj Obseg 1', 'Scope 1 Total')}</td>
                      <td className="px-5 py-2.5" />
                      <td className="px-5 py-2.5 text-sm font-bold text-right text-gray-900 tabular-nums">{(scopeData.scope1_kg / 1000).toFixed(3).replace('.', ',')}</td>
                      <td className="px-5 py-2.5 text-sm font-semibold text-right text-gray-700 tabular-nums">{pct(scopeData.scope1_kg)}%</td>
                    </tr>
                  </>
                })()}
              </>}

              {/* OBSEG 2 */}
              {scopeData?.scope2_kg !== undefined && scopeData.scope2_kg > 0 && <>
                <tr className="bg-gray-50">
                  <td colSpan={4} className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('Obseg 2 – Posredne emisije (energija)', 'Scope 2 – Indirect emissions (energy)')}</td>
                </tr>
                {[
                  { key: t('Elektrika', 'Electricity'), label: t('Elektrika', 'Electricity') },
                  { key: t('Toplota', 'Heat'), label: t('Toplota', 'Heat') },
                  { key: t('Para', 'Steam'), label: t('Para', 'Steam') },
                  { key: t('Hlajenje', 'Cooling'), label: t('Hlajenje', 'Cooling') },
                ].map(({ key, label }) => {
                  const src = scopeData.sources.find(s => s.name === key)
                  if (!src || src.kg === 0) return null
                  return (
                    <tr key={key} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-700">{label}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-500 tabular-nums">
                        {src.qty != null ? `${src.qty.toLocaleString('sl-SI', { maximumFractionDigits: 1 })} ${src.unit}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-right text-gray-900 tabular-nums">{(src.kg / 1000).toFixed(3).replace('.', ',')}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-500 tabular-nums">{pct(src.kg)}%</td>
                    </tr>
                  )
                })}
                <tr className="bg-blue-50/50">
                  <td className="px-5 py-2.5 text-sm font-semibold text-gray-700">{t('Skupaj Obseg 2', 'Scope 2 Total')}</td>
                  <td className="px-5 py-2.5" />
                  <td className="px-5 py-2.5 text-sm font-bold text-right text-gray-900 tabular-nums">{(scopeData.scope2_kg / 1000).toFixed(3).replace('.', ',')}</td>
                  <td className="px-5 py-2.5 text-sm font-semibold text-right text-gray-700 tabular-nums">{pct(scopeData.scope2_kg)}%</td>
                </tr>
              </>}

              {/* OBSEG 3 */}
              {scopeData?.scope3_kg !== undefined && scopeData.scope3_kg > 0 && <>
                <tr className="bg-gray-50">
                  <td colSpan={4} className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('Obseg 3 – Ostale posredne emisije', 'Scope 3 – Other indirect emissions')}</td>
                </tr>
                <tr className="bg-blue-50/50">
                  <td className="px-5 py-2.5 text-sm font-semibold text-gray-700">{t('Skupaj Obseg 3', 'Scope 3 Total')}</td>
                  <td className="px-5 py-2.5" />
                  <td className="px-5 py-2.5 text-sm font-bold text-right text-gray-900 tabular-nums">{(scopeData.scope3_kg / 1000).toFixed(3).replace('.', ',')}</td>
                  <td className="px-5 py-2.5 text-sm font-semibold text-right text-gray-700 tabular-nums">{pct(scopeData.scope3_kg)}%</td>
                </tr>
              </>}

              {/* TOTAL */}
              <tr className="border-t-2 border-gray-300 bg-gray-100">
                <td className="px-5 py-3 text-sm font-bold text-gray-900">{t('Skupne emisije', 'Total emissions')}</td>
                <td className="px-5 py-3" />
                <td className="px-5 py-3 text-sm font-bold text-right text-gray-900 tabular-nums">{(total / 1000).toFixed(3).replace('.', ',')}</td>
                <td className="px-5 py-3 text-sm font-bold text-right text-gray-900">100%</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>
  )
}
