'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Users, TrendingUp, UserPlus } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type MonthPoint = { month: string; value: number }

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ orgs: 0, users: 0, newOrgs: 0, newUsers: 0 })
  const [orgTrend, setOrgTrend] = useState<MonthPoint[]>([])
  const [userTrend, setUserTrend] = useState<MonthPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const supabase = createClient()

      const [{ data: orgs }, { data: members }] = await Promise.all([
        supabase.from('organizations').select('id, created_at').order('created_at'),
        supabase.from('organization_members').select('id, created_at, status').eq('status', 'active').order('created_at'),
      ])

      const now = new Date()
      const thisMonth = now.toISOString().slice(0, 7)
      const newOrgs = (orgs ?? []).filter(o => o.created_at?.slice(0, 7) === thisMonth).length
      const newUsers = (members ?? []).filter(m => m.created_at?.slice(0, 7) === thisMonth).length

      setStats({ orgs: orgs?.length ?? 0, users: members?.length ?? 0, newOrgs, newUsers })

      // Build monthly trend (last 6 months)
      const months: string[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push(d.toISOString().slice(0, 7))
      }

      const monthLabel = (ym: string) => {
        const [y, m] = ym.split('-')
        return new Date(Number(y), Number(m) - 1).toLocaleDateString('sl-SI', { month: 'short', year: 'numeric' })
      }

      // Cumulative org count per month
      let orgCount = 0
      const orgData: MonthPoint[] = months.map(ym => {
        orgCount += (orgs ?? []).filter(o => o.created_at?.slice(0, 7) === ym).length
        return { month: monthLabel(ym), value: orgCount }
      })

      let userCount = 0
      const userData: MonthPoint[] = months.map(ym => {
        userCount += (members ?? []).filter(m => m.created_at?.slice(0, 7) === ym).length
        return { month: monthLabel(ym), value: userCount }
      })

      setOrgTrend(orgData)
      setUserTrend(userData)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const cards = [
    { label: 'Skupaj podjetij', value: stats.orgs, icon: Building2, color: 'text-gray-900', bg: 'bg-gray-100' },
    { label: 'Aktivni uporabniki', value: stats.users, icon: Users, color: 'text-gray-900', bg: 'bg-gray-100' },
    { label: 'Nova podjetja ta mesec', value: stats.newOrgs, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Novi uporabniki ta mesec', value: stats.newUsers, icon: UserPlus, color: 'text-orange-500', bg: 'bg-orange-50' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 border-b border-gray-200 h-[57px] shrink-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 shrink-0">Nadzorna plošča</h1>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-6 space-y-6">
      <div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
              <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-2xl font-medium text-gray-900">{loading ? '—' : c.value}</p>
                <p className="text-xs text-gray-500">{c.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrendCard title="Rast podjetij" data={orgTrend} color="#0f0f10" total={stats.orgs} />
        <TrendCard title="Rast uporabnikov" data={userTrend} color="#10b981" total={stats.users} />
      </div>
    </div>
  )
}

function TrendCard({ title, data, color, total }: { title: string; data: MonthPoint[]; color: string; total: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold text-gray-900">{title}</p>
        <span className="text-lg font-bold tabular-nums" style={{ color }}>{total}</span>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
            fill={`url(#grad-${color})`} dot={false} activeDot={{ r: 4, fill: color }} />
        </AreaChart>
      </ResponsiveContainer>
      </div>
      </div>
    </div>
  )
}
