'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSuperAdmin } from '../SuperAdminContext'
import { Leaf, Flame, Zap, Wind } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

const SCOPE_COLORS = ['#26a552', '#f59e0b', '#10b981']
const SOURCE_COLORS = ['#26a552','#3b82f6','#60a5fa','#f59e0b','#fbbf24','#10b981','#34d399','#6366f1','#a78bfa']
const TABLES = ['scope1_stationary','scope1_mobile','scope1_equipment_fuel','scope1_refrigerants','scope1_industrial_gases','scope2_electricity','scope2_heat','scope2_steam','scope2_cooling']

type ScopeData = {
  scope1_kg: number
  scope2_kg: number
  scope3_kg: number
  sources: { name: string; kg: number }[]
}

type YearPoint = { year: string; emisije: number }

export default function CompanyDataPage() {
  const { selectedOrg, year } = useSuperAdmin()
  const [scopeData, setScopeData] = useState<ScopeData | null>(null)
  const [yearTrend, setYearTrend] = useState<YearPoint[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedOrg) loadData(selectedOrg.id, year)
  }, [selectedOrg?.id, year])

  async function loadData(orgId: string, yr: number) {
    setLoading(true)
    setScopeData(null)
    setYearTrend([])
    try {
      const supabase = createClient()

      const { data: pd } = await supabase
        .from('reporting_periods').select('id').eq('organization_id', orgId).eq('year', yr).single()

      if (!pd) {
        setScopeData({ scope1_kg: 0, scope2_kg: 0, scope3_kg: 0, sources: [] })
        setLoading(false)
        return
      }

      const [stationary, mobile, equipFuel, refrigerants, gases, electricity, heat, steam, cooling, scope3subs] = await Promise.all([
        supabase.from('scope1_stationary').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope1_mobile').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope1_equipment_fuel').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope1_refrigerants').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope1_industrial_gases').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope2_electricity').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope2_heat').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope2_steam').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope2_cooling').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope3_submissions').select('co2e_kg, category_number').eq('organization_id', orgId).eq('reporting_period_id', pd.id).eq('status', 'done'),
      ])

      const sum = (r: any) => (r.data ?? []).reduce((s: number, x: any) => s + (x.co2e_kg ?? 0), 0)

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
        { name: 'Zemeljski plin', kg: stationaryKg },
        { name: 'Gorivo vozil', kg: mobileKg },
        { name: 'Gorivo opreme', kg: equipKg },
        { name: 'Hladilni plini', kg: refKg },
        { name: 'Industrijski plini', kg: gasKg },
        { name: 'Elektrika', kg: elecKg },
        { name: 'Toplota', kg: heatKg },
        { name: 'Para', kg: steamKg },
        { name: 'Hlajenje', kg: coolingKg },
        { name: 'Scope 3', kg: scope3Kg },
      ].filter(s => s.kg > 0)

      setScopeData({ scope1_kg, scope2_kg, scope3_kg: scope3Kg, sources })

      // Trend across all periods
      const { data: allPeriods } = await supabase
        .from('reporting_periods').select('id, year').eq('organization_id', orgId).order('year')

      if (allPeriods && allPeriods.length > 0) {
        const trendPoints: YearPoint[] = []
        for (const p of allPeriods) {
          const results = await Promise.all(TABLES.map(tbl =>
            supabase.from(tbl).select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', p.id)
          ))
          const s3 = await supabase.from('scope3_submissions').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', p.id).eq('status', 'done')
          const totalKg = [...results, s3].reduce((s, r) => s + (r.data ?? []).reduce((a: number, x: any) => a + (x.co2e_kg ?? 0), 0), 0)
          if (totalKg > 0) trendPoints.push({ year: String(p.year), emisije: parseFloat((totalKg / 1000).toFixed(3)) })
        }
        setYearTrend(trendPoints)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const total = (scopeData?.scope1_kg ?? 0) + (scopeData?.scope2_kg ?? 0) + (scopeData?.scope3_kg ?? 0)
  const fmtT = (kg: number) => (kg / 1000).toFixed(2).replace('.', ',')
  const pct = (kg: number) => total > 0 ? ((kg / total) * 100).toFixed(1) : '0'

  const scopeChartData = [
    { name: 'Scope 1', value: parseFloat(((scopeData?.scope1_kg ?? 0) / 1000).toFixed(3)), color: SCOPE_COLORS[0] },
    { name: 'Scope 2', value: parseFloat(((scopeData?.scope2_kg ?? 0) / 1000).toFixed(3)), color: SCOPE_COLORS[1] },
    { name: 'Scope 3', value: parseFloat(((scopeData?.scope3_kg ?? 0) / 1000).toFixed(3)), color: SCOPE_COLORS[2] },
  ].filter(d => d.value > 0)

  const sourceChartData = (scopeData?.sources ?? [])
    .sort((a, b) => b.kg - a.kg)
    .map(s => ({ name: s.name, value: parseFloat((s.kg / 1000).toFixed(3)) }))

  if (!selectedOrg) {
    return <div className="p-8 text-sm text-[#767676]">Izberite podjetje v zgornjem meniju.</div>
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold text-[#767676] uppercase tracking-widest mb-1">Podatki podjetja</p>
        <h1 className="text-2xl font-bold text-[#031f18]">{selectedOrg.name}</h1>
        <p className="text-sm text-[#767676] mt-0.5">Emisije CO₂e za leto {year}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Skupaj', value: fmtT(total), sub: 'tCO₂e', icon: Leaf, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Scope 1', value: fmtT(scopeData?.scope1_kg ?? 0), sub: `${pct(scopeData?.scope1_kg ?? 0)}%`, icon: Flame, color: 'text-[#26a552]', bg: 'bg-[#edf7f1]' },
          { label: 'Scope 2', value: fmtT(scopeData?.scope2_kg ?? 0), sub: `${pct(scopeData?.scope2_kg ?? 0)}%`, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Scope 3', value: fmtT(scopeData?.scope3_kg ?? 0), sub: `${pct(scopeData?.scope3_kg ?? 0)}%`, icon: Wind, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white border border-[#ececec] rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-[#767676]">{card.label}</p>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', card.bg)}>
                  <Icon className={cn('h-4 w-4', card.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#031f18] tabular-nums">{loading ? '—' : card.value}</p>
              <p className="text-xs text-[#767676] mt-0.5">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-[#ececec] rounded-xl p-6">
          <p className="text-sm font-semibold text-[#031f18] mb-0.5">Trend emisij po letih</p>
          <p className="text-xs text-[#767676] mb-5">tCO₂e</p>
          {yearTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={yearTrend} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" t" width={50} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: any) => [`${String(v).replace('.', ',')} tCO₂e`, 'Emisije']} />
                <Bar dataKey="emisije" radius={[6, 6, 0, 0]}>
                  {yearTrend.map((entry, i) => (
                    <Cell key={i} fill={entry.year === String(year) ? '#26a552' : '#bfdbfe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-300">Ni podatkov za prikaz</div>
          )}
        </div>

        <div className="bg-white border border-[#ececec] rounded-xl p-6">
          <p className="text-sm font-semibold text-[#031f18] mb-0.5">Delež po obsegu</p>
          <p className="text-xs text-[#767676] mb-5">{year}</p>
          {scopeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={scopeChartData} cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {scopeChartData.map((_, i) => <Cell key={i} fill={scopeChartData[i].color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: any) => [`${String(v).replace('.', ',')} tCO₂e`]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-300">Ni podatkov</div>
          )}
        </div>
      </div>

      {/* Source breakdown */}
      {sourceChartData.length > 0 && (
        <div className="bg-white border border-[#ececec] rounded-xl p-6">
          <p className="text-sm font-semibold text-[#031f18] mb-0.5">Emisije po virih</p>
          <p className="text-xs text-[#767676] mb-5">{year} · tCO₂e</p>
          <ResponsiveContainer width="100%" height={Math.max(180, sourceChartData.length * 36)}>
            <BarChart data={sourceChartData} layout="vertical" barSize={18} margin={{ left: 16, right: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" t" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={130} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(v: any) => [`${String(v).replace('.', ',')} tCO₂e`]} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {sourceChartData.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
