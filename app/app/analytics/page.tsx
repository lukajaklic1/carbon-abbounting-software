'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { usePeriodStore } from '@/stores/period'
import { Leaf, Flame, Zap, Wind } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

const SCOPE_COLORS = ['#2563eb', '#f59e0b', '#10b981']
const SOURCE_COLORS = ['#2563eb','#3b82f6','#60a5fa','#f59e0b','#fbbf24','#10b981','#34d399','#6366f1','#a78bfa']

type Period = { id: string; year: number; total_co2e_kg: number }

type ScopeData = {
  scope1_kg: number
  scope2_kg: number
  scope3_kg: number
  sources: { name: string; kg: number; scope: string }[]
}

export default function AnalyticsPage() {
  const { t } = useLocale()
  const { availablePeriods, selectedYear } = usePeriodStore()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [scopeData, setScopeData] = useState<ScopeData | null>(null)
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
      if (!pd) { setScopeData({ scope1_kg: 0, scope2_kg: 0, scope3_kg: 0, sources: [] }); setLoading(false); return }

      // Fetch all emission sources in parallel
      const [stationary, mobile, equipFuel, refrigerants, gases, electricity, heat, steam, cooling, scope3subs] = await Promise.all([
        supabase.from('scope1_stationary').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope1_mobile').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope1_equipment_fuel').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope1_refrigerants').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope1_industrial_gases').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope2_electricity').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope2_heat').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope2_steam').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope2_cooling').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope3_submissions').select('co2e_kg, category_number').eq('organization_id', org.id).eq('reporting_period_id', pd.id).eq('status', 'done'),
      ])

      const sum = (rows: any) => (rows.data ?? []).reduce((s: number, r: any) => s + (r.co2e_kg ?? 0), 0)

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

      const sources = [
        { name: t('Zemeljski plin', 'Natural gas'), kg: stationaryKg, scope: 'Scope 1' },
        { name: t('Gorivo vozil', 'Vehicle fuel'), kg: mobileKg, scope: 'Scope 1' },
        { name: t('Gorivo opreme', 'Equipment fuel'), kg: equipKg, scope: 'Scope 1' },
        { name: t('Hladilni plini', 'Refrigerants'), kg: refKg, scope: 'Scope 1' },
        { name: t('Industrijski plini', 'Industrial gases'), kg: gasKg, scope: 'Scope 1' },
        { name: t('Elektrika', 'Electricity'), kg: elecKg, scope: 'Scope 2' },
        { name: t('Toplota', 'Heat'), kg: heatKg, scope: 'Scope 2' },
        { name: t('Para', 'Steam'), kg: steamKg, scope: 'Scope 2' },
        { name: t('Hlajenje', 'Cooling'), kg: coolingKg, scope: 'Scope 2' },
        { name: 'Scope 3', kg: scope3Kg, scope: 'Scope 3' },
      ].filter(s => s.kg > 0)

      setScopeData({ scope1_kg, scope2_kg, scope3_kg: scope3Kg, sources })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const total = (scopeData?.scope1_kg ?? 0) + (scopeData?.scope2_kg ?? 0) + (scopeData?.scope3_kg ?? 0)
  const totalT = total / 1000

  const yearChartData = [...(availablePeriods ?? [])]
    .sort((a, b) => a.year - b.year)
    .map(p => ({ year: String(p.year), emisije: parseFloat((p.total_co2e_kg / 1000).toFixed(3)) }))

  const scopeChartData = [
    { name: 'Scope 1', value: parseFloat(((scopeData?.scope1_kg ?? 0) / 1000).toFixed(3)), color: SCOPE_COLORS[0] },
    { name: 'Scope 2', value: parseFloat(((scopeData?.scope2_kg ?? 0) / 1000).toFixed(3)), color: SCOPE_COLORS[1] },
    { name: 'Scope 3', value: parseFloat(((scopeData?.scope3_kg ?? 0) / 1000).toFixed(3)), color: SCOPE_COLORS[2] },
  ].filter(d => d.value > 0)

  const sourceChartData = (scopeData?.sources ?? [])
    .sort((a, b) => b.kg - a.kg)
    .map(s => ({ name: s.name, value: parseFloat((s.kg / 1000).toFixed(3)), scope: s.scope }))

  const pct = (kg: number) => total > 0 ? ((kg / total) * 100).toFixed(1) : '0'

  const fmtT = (kg: number) => (kg / 1000).toFixed(2).replace('.', ',')

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{t('Analitika', 'Analytics')} · {year}</p>
        <h1 className="text-2xl font-bold text-gray-900">{t('Ogljični odtis', 'Carbon Footprint')}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t('Pregled emisij CO₂e za poročevalsko leto', 'Overview of CO₂e emissions for the reporting year')} {year}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('Skupaj', 'Total'), value: fmtT(total), sub: 'tCO₂e', icon: Leaf, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Scope 1', value: fmtT(scopeData?.scope1_kg ?? 0), sub: `${pct(scopeData?.scope1_kg ?? 0)}%`, icon: Flame, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Scope 2', value: fmtT(scopeData?.scope2_kg ?? 0), sub: `${pct(scopeData?.scope2_kg ?? 0)}%`, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Scope 3', value: fmtT(scopeData?.scope3_kg ?? 0), sub: `${pct(scopeData?.scope3_kg ?? 0)}%`, icon: Wind, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-gray-400">{card.label}</p>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', card.bg)}>
                  <Icon className={cn('h-4 w-4', card.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{loading ? '—' : card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Charts row 1: trend + scope pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend by year */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm font-semibold text-gray-900 mb-0.5">{t('Trend emisij po letih', 'Emissions trend by year')}</p>
          <p className="text-xs text-gray-400 mb-5">tCO₂e</p>
          {yearChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={yearChartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" t" width={50} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: any) => [`${String(v).replace('.', ',')} tCO₂e`, t('Emisije', 'Emissions')]}
                />
                <Bar dataKey="emisije" radius={[6, 6, 0, 0]}>
                  {yearChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.year === String(year) ? '#2563eb' : '#bfdbfe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-300">{t('Ni podatkov za prikaz', 'No data to display')}</div>
          )}
        </div>

        {/* Scope breakdown pie */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm font-semibold text-gray-900 mb-0.5">{t('Delež po obsegu', 'Breakdown by scope')}</p>
          <p className="text-xs text-gray-400 mb-5">{year}</p>
          {scopeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={scopeChartData} cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {scopeChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: any) => [`${String(v).replace('.', ',')} tCO₂e`]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-300">{t('Ni podatkov', 'No data')}</div>
          )}
        </div>
      </div>

      {/* Emission sources breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-sm font-semibold text-gray-900 mb-0.5">{t('Emisije po virih', 'Emissions by source')}</p>
        <p className="text-xs text-gray-400 mb-5">{year} · tCO₂e</p>
        {sourceChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sourceChartData} layout="vertical" barSize={18} margin={{ left: 16, right: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" t" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={130} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(v: any) => [`${String(v).replace('.', ',')} tCO₂e`]}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {sourceChartData.map((entry, i) => (
                  <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-16 text-center text-sm text-gray-300">{t('Ni podatkov za prikaz', 'No data to display')}</div>
        )}

        {/* Source list */}
        {sourceChartData.length > 0 && (
          <div className="mt-6 space-y-2">
            {sourceChartData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                <span className="text-xs text-gray-600 flex-1">{s.name}</span>
                <span className="text-xs font-semibold text-gray-900 tabular-nums">{String(s.value).replace('.', ',')} t</span>
                <span className="text-xs text-gray-400 w-10 text-right">{total > 0 ? ((s.value * 1000 / total) * 100).toFixed(1) : 0}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
