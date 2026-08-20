'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  MapPin, Car, BarChart2, FileText,
  Flame, Zap, Thermometer, FlaskConical, LogOut, ChevronDown, Wrench, Wind, Package,
  LayoutDashboard, Building2, Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { SuperAdminProvider, useSuperAdmin } from './SuperAdminContext'

const YEAR_OPTIONS = [2022, 2023, 2024, 2025, 2026]

interface Counter { done: number; total: number }

async function fetchAdminCounters(orgId: string, year: number): Promise<Record<string, Counter>> {
  const supabase = createClient()

  const { data: period } = await supabase
    .from('reporting_periods').select('id').eq('organization_id', orgId).eq('year', year).maybeSingle()
  const pid = period?.id ?? null

  const base = `/app/super-admin/company-view/${year}`

  const [
    { count: locCount }, { count: vehCount }, { count: equCount },
    { count: equFuelCount }, { count: equRefCount }, { count: equGasCount },
    { count: statCount }, { count: mobCount }, { count: efCount },
    { count: refCount }, { count: gasCount }, { count: elecCount },
    { count: heatCount }, { count: steamCount }, { count: coolCount },
    { count: locGasCount }, { count: locElecCount },
    { count: locHeatCount }, { count: locSteamCount }, { count: locCoolCount },
  ] = await Promise.all([
    supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true),
    supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true),
    supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true).eq('uses_fuel', true),
    supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true).eq('uses_refrigerants', true),
    supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true).eq('uses_industrial_gases', true),
    pid ? supabase.from('scope1_stationary').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
    pid ? supabase.from('scope1_mobile').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
    pid ? supabase.from('scope1_equipment_fuel').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
    pid ? supabase.from('scope1_refrigerants').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
    pid ? supabase.from('scope1_industrial_gases').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
    pid ? supabase.from('scope2_electricity').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
    pid ? supabase.from('scope2_heat').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
    pid ? supabase.from('scope2_steam').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
    pid ? supabase.from('scope2_cooling').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('reporting_period_id', pid) : Promise.resolve({ count: 0 }),
    supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true).eq('uses_natural_gas', true),
    supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true).eq('uses_electricity', true),
    supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true).eq('uses_heat', true),
    supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true).eq('uses_steam', true),
    supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true).eq('uses_cooling', true),
  ])

  return {
    '/app/super-admin/company-view/locations': { done: locCount ?? 0, total: locCount ?? 0 },
    '/app/super-admin/company-view/vehicles':  { done: vehCount ?? 0, total: vehCount ?? 0 },
    '/app/super-admin/company-view/equipment': { done: equCount ?? 0, total: equCount ?? 0 },
    [`${base}/scope1/stationary`]:       { done: statCount ?? 0, total: locGasCount ?? 0 },
    [`${base}/scope1/mobile`]:           { done: mobCount ?? 0,  total: vehCount ?? 0 },
    [`${base}/scope1/equipment-fuel`]:   { done: efCount ?? 0,   total: equFuelCount ?? 0 },
    [`${base}/scope1/refrigerants`]:     { done: refCount ?? 0,  total: equRefCount ?? 0 },
    [`${base}/scope1/industrial-gases`]: { done: gasCount ?? 0,  total: equGasCount ?? 0 },
    [`${base}/scope2/electricity`]:      { done: elecCount ?? 0, total: locElecCount ?? 0 },
    [`${base}/scope2/heat`]:             { done: heatCount ?? 0, total: locHeatCount ?? 0 },
    [`${base}/scope2/steam`]:            { done: steamCount ?? 0,total: locSteamCount ?? 0 },
    [`${base}/scope2/cooling`]:          { done: coolCount ?? 0, total: locCoolCount ?? 0 },
  }
}

// ── Reusable sidebar sub-components ──────────────────────────────────────────

function CollapsibleSection({ label, open, onToggle, children }: {
  label: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="pt-2">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#f9f9f9] transition-colors group">
        <p className="text-[10px] font-semibold text-[#767676] uppercase tracking-widest group-hover:text-[#767676]">{label}</p>
        <ChevronDown className={cn('h-3 w-3 text-[#767676] transition-transform duration-200', open ? 'rotate-0' : '-rotate-90')} />
      </button>
      {open && <div className="space-y-0.5 mt-0.5">{children}</div>}
    </div>
  )
}

function NavItem({ href, label, icon: Icon, counter, entityOnly, exact }: {
  href: string; label: string; icon: React.ElementType
  counter?: Counter; entityOnly?: boolean; exact?: boolean
}) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname.startsWith(href)
  const allDone = !entityOnly && counter && counter.total > 0 && counter.done === counter.total
  return (
    <Link href={href} className={cn(
      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
      active ? 'bg-[#efefef] text-[#0f0f10]' : 'text-[#767676] hover:bg-[#f9f9f9] hover:text-[#031f18]'
    )}>
      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-[#0f0f10]' : 'text-[#767676]')} />
      <span className="truncate flex-1">{label}</span>
      {counter !== undefined && (
        <span className={cn('text-[10px] font-normal tabular-nums shrink-0 tracking-tight',
          allDone ? 'text-[#0f0f10]' : active ? 'text-[#51a676]' : 'text-[#767676]')}>
          {entityOnly ? counter.total : `${counter.done}/${counter.total}`}
        </span>
      )}
    </Link>
  )
}

// ── Main sidebar ──────────────────────────────────────────────────────────────

function SuperAdminSidebar() {
  const { year, setYear } = useSuperAdmin()
  const pathname = usePathname()
  const router = useRouter()
  const { selectedOrg } = useSuperAdmin()
  const base = `/app/super-admin/company-view/${year}`

  const [counters, setCounters] = useState<Record<string, Counter>>({})
  const [userMeta, setUserMeta] = useState<{ name: string; initials: string }>({ name: '—', initials: '?' })

  const [openOrg, setOpenOrg] = useState(true)
  const [openScope1, setOpenScope1] = useState(true)
  const [openScope2, setOpenScope2] = useState(true)
  const [openScope3, setOpenScope3] = useState(true)
  const [openReports, setOpenReports] = useState(true)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const fn = user.user_metadata?.first_name ?? ''
      const ln = user.user_metadata?.last_name ?? ''
      const name = fn && ln ? `${fn} ${ln}` : user.email ?? '—'
      const initials = `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase() || '?'
      setUserMeta({ name, initials })
    })
  }, [])

  useEffect(() => {
    if (selectedOrg) fetchAdminCounters(selectedOrg.id, year).then(setCounters)
  }, [selectedOrg?.id, year])

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  const platformActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <aside className="flex flex-col h-full w-[220px] bg-white border-r border-[#ececec] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[#ececec] shrink-0">
        <div className="w-8 h-8 bg-[#0f0f10] rounded-xl flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <polygon points="16,4 28,10 16,16 4,10" fill="white" fillOpacity="0.95"/>
            <polygon points="4,10 16,16 16,28 4,22" fill="white" fillOpacity="0.55"/>
            <polygon points="28,10 16,16 16,28 28,22" fill="white" fillOpacity="0.75"/>
          </svg>
        </div>
        <div>
          <span className="font-bold text-[#031f18] text-sm leading-tight block">CarbonTrack</span>
          <span className="text-[10px] text-[#0f0f10] font-semibold">Super Admin</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">

        {/* ── Platforma ── */}
        <CollapsibleSection label="Platforma" open={true} onToggle={() => {}}>
          {[
            { label: 'Nadzorna plošča', href: '/app/super-admin', icon: LayoutDashboard, exact: true },
            { label: 'Podjetja', href: '/app/super-admin/companies', icon: Building2 },
            { label: 'Uporabniki', href: '/app/super-admin/users', icon: Users },
          ].map(item => (
            <NavItem key={item.href} {...item} />
          ))}
        </CollapsibleSection>

        {/* ── Company name + year ── */}
        <div className="pt-3 pb-1 px-2">
          <p className="text-sm font-bold text-[#031f18] truncate">{selectedOrg?.name ?? '—'}</p>
        </div>
        <div className="px-2 pb-1">
          <div className="relative">
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="appearance-none w-full pl-2.5 pr-6 py-1.5 text-xs font-semibold text-[#031f18] bg-[#f9f9f9] border border-[#ececec] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#767676] pointer-events-none" />
          </div>
        </div>

        {/* ── Moja organizacija ── */}
        <CollapsibleSection label="Moja organizacija" open={openOrg} onToggle={() => setOpenOrg(v => !v)}>
          <NavItem href="/app/super-admin/company-view/locations" label="Lokacije" icon={MapPin}
            counter={counters['/app/super-admin/company-view/locations']} entityOnly />
          <NavItem href="/app/super-admin/company-view/vehicles" label="Vozila" icon={Car}
            counter={counters['/app/super-admin/company-view/vehicles']} entityOnly />
          <NavItem href="/app/super-admin/company-view/equipment" label="Oprema" icon={Wrench}
            counter={counters['/app/super-admin/company-view/equipment']} entityOnly />
        </CollapsibleSection>

        {/* ── Obseg 1 ── */}
        <CollapsibleSection label="Obseg 1" open={openScope1} onToggle={() => setOpenScope1(v => !v)}>
          <NavItem href={`${base}/scope1/stationary`} label="Zemeljski plin" icon={Flame} counter={counters[`${base}/scope1/stationary`]} />
          <NavItem href={`${base}/scope1/mobile`} label="Poraba vozil" icon={Car} counter={counters[`${base}/scope1/mobile`]} />
          <NavItem href={`${base}/scope1/equipment-fuel`} label="Gorivo opreme" icon={Wrench} counter={counters[`${base}/scope1/equipment-fuel`]} />
          <NavItem href={`${base}/scope1/refrigerants`} label="Hladilni plini" icon={Thermometer} counter={counters[`${base}/scope1/refrigerants`]} />
          <NavItem href={`${base}/scope1/industrial-gases`} label="Industrijski plini" icon={FlaskConical} counter={counters[`${base}/scope1/industrial-gases`]} />
        </CollapsibleSection>

        {/* ── Obseg 2 ── */}
        <CollapsibleSection label="Obseg 2" open={openScope2} onToggle={() => setOpenScope2(v => !v)}>
          <NavItem href={`${base}/scope2/electricity`} label="Elektrika" icon={Zap} counter={counters[`${base}/scope2/electricity`]} />
          <NavItem href={`${base}/scope2/heat`} label="Toplota" icon={Flame} counter={counters[`${base}/scope2/heat`]} />
          <NavItem href={`${base}/scope2/steam`} label="Para" icon={Wind} counter={counters[`${base}/scope2/steam`]} />
          <NavItem href={`${base}/scope2/cooling`} label="Hlajenje" icon={Thermometer} counter={counters[`${base}/scope2/cooling`]} />
        </CollapsibleSection>

        {/* ── Obseg 3 ── */}
        <CollapsibleSection label="Obseg 3" open={openScope3} onToggle={() => setOpenScope3(v => !v)}>
          <NavItem href="/app/super-admin/scope3-review" label="Obseg 3" icon={Package} />
        </CollapsibleSection>

        {/* ── Poročila ── */}
        <CollapsibleSection label="Poročila" open={openReports} onToggle={() => setOpenReports(v => !v)}>
          <NavItem href="/app/super-admin/company-data" label="Analitika" icon={BarChart2} />
          <NavItem href="/app/super-admin/company-reports" label="Poročila" icon={FileText} />
        </CollapsibleSection>

      </nav>

      {/* Bottom — same as regular sidebar */}
      <div className="border-t border-[#ececec] px-3 py-3 space-y-1 shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-[#f9f9f9] transition-colors">
          <div className="w-7 h-7 rounded-full bg-[#fafafa] border border-[#ececec] flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-[#767676]">{userMeta.initials}</span>
          </div>
          <span className="text-sm font-medium text-[#031f18] truncate flex-1">{userMeta.name}</span>
          <button onClick={handleLogout} className="p-1 text-[#767676] hover:text-[#031f18] transition-colors shrink-0">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

function CompanySelector() {
  const { orgs, selectedOrg, setSelectedOrg } = useSuperAdmin()
  if (orgs.length === 0) return null
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#767676] font-medium shrink-0">Podjetje:</span>
      <div className="relative">
        <select
          value={selectedOrg?.id ?? ''}
          onChange={e => setSelectedOrg(orgs.find(o => o.id === e.target.value) ?? null)}
          className="appearance-none pl-3 pr-7 py-1.5 text-sm font-semibold text-[#031f18] bg-white border border-[#ececec] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#767676] pointer-events-none" />
      </div>
    </div>
  )
}

function SuperAdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#f7f8fa] overflow-hidden">
      <SuperAdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-[#ececec] flex items-center px-6 shrink-0">
          <CompanySelector />
        </header>
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SuperAdminProvider>
      <SuperAdminShell>{children}</SuperAdminShell>
    </SuperAdminProvider>
  )
}
