'use client'

import { useEffect, useState } from 'react'
import { usePeriodStore } from '@/stores/period'
import { useOrganizationStore } from '@/stores/organization'
import { createClient } from '@/lib/supabase/client'
import { formatCo2e } from '@/lib/utils/co2e'
import { TrendingUp, FileText, Flame, Car, Wrench, Thermometer, FlaskConical, Zap, ArrowRight, Leaf, Building2, BarChart3 } from 'lucide-react'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import Link from 'next/link'
import { mockOrg, mockPeriod } from '@/lib/mock-data'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

const INDUSTRY_LABELS: Record<string, string> = {
  manufacturing: 'Predelovalna industrija', retail: 'Trgovina', transport: 'Transport',
  energy: 'Energetika', finance: 'Finance', construction: 'Gradbeništvo',
  agriculture: 'Kmetijstvo', hospitality: 'Gostinstvo', healthcare: 'Zdravstvo',
  it: 'Informacijska tehnologija', education: 'Izobraževanje', public: 'Javna uprava', other: 'Drugo',
}

const SCOPE_COLORS = ['#2563eb', '#f59e0b', '#10b981']
const YEAR_COLOR = '#2563eb'

export default function DashboardPage() {
  const { selectedYear, currentPeriod, availablePeriods, setSelectedYear, setCurrentPeriod } = usePeriodStore()
  const { organization } = useOrganizationStore()
  const { t } = useLocale()

  const org = IS_MOCK ? mockOrg : organization
  const period = IS_MOCK ? mockPeriod : currentPeriod

  const displayYear = selectedYear ?? new Date().getFullYear()
  const totalKg = period?.total_co2e_kg ?? 0
  const totalTons = totalKg / 1000

  // Chart: emissions by year (from all available periods)
  const yearChartData = IS_MOCK
    ? [
        { year: '2023', emisije: 32.1 },
        { year: '2024', emisije: 41.5 },
        { year: '2025', emisije: 48.3 },
      ]
    : availablePeriods.map(p => ({
        year: String(p.year),
        emisije: parseFloat((p.total_co2e_kg / 1000).toFixed(2)),
      })).reverse()

  // Chart: scope breakdown for selected year (mock data for now)
  const scopeChartData = totalKg > 0
    ? [
        { name: 'Scope 1', value: parseFloat((totalKg * 0.7 / 1000).toFixed(2)) },
        { name: 'Scope 2', value: parseFloat((totalKg * 0.3 / 1000).toFixed(2)) },
      ]
    : IS_MOCK
      ? [
          { name: 'Scope 1', value: 33.8 },
          { name: 'Scope 2', value: 14.5 },
        ]
      : []

  const sources = [
    { label: 'Zemeljski plin', href: `/app/periods/${displayYear}/scope1/stationary`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', scope: 'Scope 1' },
    { label: 'Vozila', href: `/app/periods/${displayYear}/scope1/mobile`, icon: Car, color: 'text-blue-600', bg: 'bg-blue-50', scope: 'Scope 1' },
    { label: 'Oprema', href: `/app/periods/${displayYear}/scope1/equipment-fuel`, icon: Wrench, color: 'text-gray-500', bg: 'bg-gray-100', scope: 'Scope 1' },
    { label: 'Hladilni plini', href: `/app/periods/${displayYear}/scope1/refrigerants`, icon: Thermometer, color: 'text-cyan-500', bg: 'bg-cyan-50', scope: 'Scope 1' },
    { label: 'Industrijski plini', href: `/app/periods/${displayYear}/scope1/industrial-gases`, icon: FlaskConical, color: 'text-purple-500', bg: 'bg-purple-50', scope: 'Scope 1' },
    { label: 'Elektrika', href: `/app/periods/${displayYear}/scope2/electricity`, icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50', scope: 'Scope 2' },
  ]

  const statsCards = [
    { label: t('Skupne emisije', 'Total emissions'), value: `${totalTons.toFixed(2)} t`, sub: t('CO₂e letno', 'CO₂e annual'), icon: Leaf, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Scope 1', value: '0.00 t', sub: t('Direktne emisije', 'Direct emissions'), icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Scope 2', value: '0.00 t', sub: t('Posredne emisije', 'Indirect emissions'), icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: t('Viri podatkov', 'Data sources'), value: `0 / ${sources.length}`, sub: t('Izpolnjeno', 'Completed'), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {IS_MOCK && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          {t('Demo način – prikazani so vzorčni podatki.', 'Demo mode – sample data is shown.')}
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{org?.name}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {org?.industry ? (INDUSTRY_LABELS[org.industry] ?? org.industry) : ''} · {org?.country_code} · {displayYear}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </div>
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center shrink-0`}>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Emissions by year */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm font-semibold text-gray-700 mb-1">{t('Emisije po letih', 'Emissions by year')}</p>
          <p className="text-xs text-gray-400 mb-5">{t('Skupne emisije CO₂e (tCO₂e) po poročevalskih obdobjih', 'Total CO₂e emissions (tCO₂e) by reporting period')}</p>
          {yearChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={yearChartData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" t" />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v) => [`${v} tCO₂e`, t('Emisije', 'Emissions')]}
                />
                <Bar dataKey="emisije" fill={YEAR_COLOR} radius={[6, 6, 0, 0]}
                  label={false}
                >
                  {yearChartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.year === String(displayYear) ? '#2563eb' : '#bfdbfe'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
              {t('Ni podatkov za prikaz', 'No data to display')}
            </div>
          )}
        </div>

        {/* Scope breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm font-semibold text-gray-700 mb-1">{t('Emisije po scopu', 'Emissions by scope')} — {displayYear}</p>
          <p className="text-xs text-gray-400 mb-5">{t('Razmerje med Scope 1 in Scope 2', 'Breakdown between Scope 1 and Scope 2')}</p>
          {scopeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={scopeChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {scopeChartData.map((_, index) => (
                    <Cell key={index} fill={SCOPE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v) => [`${v} tCO₂e`]}
                />
                <Legend iconType="circle" iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 12, color: '#64748b' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
              {t('Vnesite podatke za prikaz', 'Enter data to display')}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: emission sources + quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Emission sources */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('Viri emisij', 'Emission sources')} — {displayYear}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sources.map((s) => {
              const Icon = s.icon
              return (
                <Link key={s.href} href={s.href}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group">
                  <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-400">{s.scope}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{s.label}</p>
                    <p className="text-xs text-gray-400">{t('Ni podatkov', 'No data')}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('Hitri dostop', 'Quick links')}</h2>
          <div className="space-y-3">
            <Link href="/app/analytics"
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{t('Analitika', 'Analytics')}</p>
                <p className="text-xs text-gray-400">{t('Grafi in trendi', 'Charts & trends')}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 shrink-0" />
            </Link>
            <Link href="/app/reports"
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{t('Poročila', 'Reports')}</p>
                <p className="text-xs text-gray-400">{t('Izvoz PDF, CSRD', 'PDF export, CSRD')}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 shrink-0" />
            </Link>
            <Link href="/app/locations"
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{t('Lokacije', 'Locations')}</p>
                <p className="text-xs text-gray-400">{t('Upravljanje lokacij', 'Manage locations')}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
