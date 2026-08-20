'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  MapPin, Car, BarChart2, FileText, Flame, Zap, Thermometer,
  FlaskConical, Settings, LogOut, Users, ChevronDown, ChevronRight,
  Wrench, Wind, Package, PanelLeft, ChevronLeft, Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrganizationStore } from '@/stores/organization'
import { usePeriodStore } from '@/stores/period'
import { mockOrg } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { useEmissionCountersStore } from '@/stores/emissionCounters'

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

/* ─── Logo icon — two chevrons (grey back, black front) ─── */
function CarboniqIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Grey chevron — behind */}
      <path d="M14 6L8 12L14 18" stroke="#c0c0c0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Black chevron — front */}
      <path d="M10 6L4 12L10 18" stroke="#0f0f10" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Sidebar({ collapsed = false, onToggleCollapse }: { collapsed?: boolean; onToggleCollapse?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { organization, memberRole } = useOrganizationStore()
  const isAdmin = memberRole === 'admin'
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const { selectedYear, availablePeriods, setSelectedYear, setCurrentPeriod } = usePeriodStore()
  const { locale, switchLocale } = useLocale()
  const [userMeta, setUserMeta] = useState<{ firstName?: string; lastName?: string; email?: string } | null>(null)
  const [yearOpen, setYearOpen] = useState(false)

  const { counters, refresh } = useEmissionCountersStore()
  useEffect(() => { if (selectedYear) refresh(selectedYear) }, [selectedYear, pathname])

  const [openOrg, setOpenOrg]       = useState(true)
  const [openScope1, setOpenScope1] = useState(true)
  const [openScope2, setOpenScope2] = useState(true)
  const [openScope3, setOpenScope3] = useState(true)
  const [openReports, setOpenReports] = useState(true)

  const orgName = organization?.name ?? (IS_MOCK ? mockOrg.name : '—')

  useEffect(() => {
    if (IS_MOCK) { setUserMeta({ firstName: 'Luka', lastName: 'Novak', email: 'luka@demo.com' }); return }
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserMeta({ firstName: user.user_metadata?.first_name, lastName: user.user_metadata?.last_name, email: user.email })
      supabase.from('super_admins').select('user_id').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setIsSuperAdmin(true) })
    })
  }, [])

  async function handleLogout() {
    if (!IS_MOCK) { const s = createClient(); await s.auth.signOut() }
    router.push('/login')
  }

  function handleSelectYear(y: number) {
    setSelectedYear(y)
    setCurrentPeriod(availablePeriods.find(p => p.year === y) ?? null)
    setYearOpen(false)
  }

  const initials = userMeta
    ? `${userMeta.firstName?.[0] ?? ''}${userMeta.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?'
  const displayName = userMeta?.firstName && userMeta?.lastName
    ? `${userMeta.firstName} ${userMeta.lastName}`
    : userMeta?.email ?? '—'

  const t = (sl: string, en: string) => locale === 'EN' ? en : sl

  const mainItems = [
    { label: t('Lokacije', 'Locations'), href: '/app/locations', icon: MapPin },
    { label: t('Vozila', 'Vehicles'),    href: '/app/vehicles',  icon: Car },
    { label: t('Oprema', 'Equipment'),   href: '/app/equipment', icon: Wrench },
  ]
  const scope1Items = [
    { label: t('Zemeljski plin', 'Natural gas'),      href: `/app/periods/${selectedYear}/scope1/stationary`,       icon: Flame },
    { label: t('Poraba vozil', 'Vehicle fuel'),        href: `/app/periods/${selectedYear}/scope1/mobile`,           icon: Car },
    { label: t('Gorivo opreme', 'Equipment fuel'),     href: `/app/periods/${selectedYear}/scope1/equipment-fuel`,   icon: Wrench },
    { label: t('Hladilni plini', 'Refrigerants'),      href: `/app/periods/${selectedYear}/scope1/refrigerants`,     icon: Thermometer },
    { label: t('Industrijski plini', 'Industrial gas'),href: `/app/periods/${selectedYear}/scope1/industrial-gases`, icon: FlaskConical },
  ]
  const scope2Items = [
    { label: t('Elektrika', 'Electricity'), href: `/app/periods/${selectedYear}/scope2/electricity`, icon: Zap },
    { label: t('Toplota', 'Heat'),          href: `/app/periods/${selectedYear}/scope2/heat`,        icon: Flame },
    { label: t('Para', 'Steam'),            href: `/app/periods/${selectedYear}/scope2/steam`,       icon: Wind },
    { label: t('Hlajenje', 'Cooling'),      href: `/app/periods/${selectedYear}/scope2/cooling`,     icon: Thermometer },
  ]
  const scope3Items = [
    { label: t('Obseg 3', 'Scope 3'), href: `/app/periods/${selectedYear}/scope3`, icon: Package },
  ]
  const reportItems = [
    { label: t('Analitika', 'Analytics'), href: '/app/analytics', icon: BarChart2 },
    { label: t('Poročila', 'Reports'),    href: '/app/reports',   icon: FileText },
  ]

  return (
    <aside className={`flex flex-col h-full shrink-0 transition-all duration-200 ${collapsed ? 'w-[56px]' : 'w-[264px]'}`}
      style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)' }}>

      {/* ── Logo ── */}
      <div className="flex items-center h-12 lg:h-14 shrink-0 px-3 gap-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}>
        {/* Icon always visible */}
        <div className="shrink-0">
          <CarboniqIcon size={32} />
        </div>
        {/* Name — hidden when collapsed */}
        {!collapsed && (
          <span className="font-semibold text-[18px] flex-1 truncate"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
            Carboniqdesk
          </span>
        )}
        {/* Toggle button — only visible when expanded */}
        {!collapsed && onToggleCollapse && (
          <button onClick={onToggleCollapse}
            className="shrink-0 p-1 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Org + year ── */}
      {!collapsed && <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center w-full px-3 py-1.5 rounded-xl text-[14px] font-medium truncate"
          style={{ background: '#ffffff', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
          {orgName}
        </div>
      </div>}

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto flex flex-col gap-0.5">

        {!collapsed && <SectionLabel label={t('Moja organizacija', 'My organisation')} open={openOrg} onToggle={() => setOpenOrg(v => !v)} />}
        {(collapsed || openOrg) && mainItems.map(i => (
          <NavItem key={i.href} {...i} active={pathname.startsWith(i.href)} counter={counters[i.href]} entityOnly collapsed={collapsed} />
        ))}

        {!collapsed && <SectionLabel label={t('Obseg 1', 'Scope 1')} open={openScope1} onToggle={() => setOpenScope1(v => !v)} />}
        {(collapsed || openScope1) && scope1Items.map(i => (
          <NavItem key={i.href} {...i} active={pathname.startsWith(i.href)} counter={counters[i.href]} collapsed={collapsed} />
        ))}

        {!collapsed && <SectionLabel label={t('Obseg 2', 'Scope 2')} open={openScope2} onToggle={() => setOpenScope2(v => !v)} />}
        {(collapsed || openScope2) && scope2Items.map(i => (
          <NavItem key={i.href} {...i} active={pathname.startsWith(i.href)} counter={counters[i.href]} collapsed={collapsed} />
        ))}

        {!collapsed && <SectionLabel label={t('Obseg 3', 'Scope 3')} open={openScope3} onToggle={() => setOpenScope3(v => !v)} />}
        {(collapsed || openScope3) && scope3Items.map(i => (
          <NavItem key={i.href} {...i} active={pathname.startsWith(i.href)} collapsed={collapsed} />
        ))}

        {!collapsed && <SectionLabel label={t('Poročila', 'Reports')} open={openReports} onToggle={() => setOpenReports(v => !v)} />}
        {(collapsed || openReports) && reportItems.map(i => (
          <NavItem key={i.href} {...i} active={pathname === i.href} collapsed={collapsed} />
        ))}

      </nav>

      {/* ── Bottom ── */}
      <div className="px-3 pb-3 pt-2 space-y-0.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <NavItem href="/app/settings" label={t('Nastavitve', 'Settings')} icon={Settings} active={pathname.startsWith('/app/settings')} collapsed={collapsed} />
        {isAdmin && <NavItem href="/app/team" label={t('Uporabniki', 'Users')} icon={Users} active={pathname.startsWith('/app/team')} collapsed={collapsed} />}
        {isSuperAdmin && <NavItem href="/app/admin/scope3" label="Admin" icon={FileText} active={pathname.startsWith('/app/admin')} collapsed={collapsed} />}

        {/* Lang — hidden when collapsed */}
        {!collapsed && (
          <div className="flex items-center gap-1 px-2 py-1">
            {(['SL', 'EN'] as const).map(l => (
              <button key={l} onClick={() => switchLocale(l)}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors"
                style={locale === l
                  ? { background: 'var(--brand)', color: '#fff' }
                  : { color: 'var(--text-muted)' }}>
                {l}
              </button>
            ))}
          </div>
        )}

        {/* User row */}
        <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors text-left"
          style={{ color: 'var(--text-primary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
            style={{ background: 'var(--bg-selected)', color: 'var(--text-secondary)' }}>
            {initials}
          </div>
          {!collapsed && (
            <>
              <span className="text-[13px] font-medium truncate flex-1" style={{ color: 'var(--text-primary)' }}>
                {displayName}
              </span>
              <button onClick={e => { e.stopPropagation(); handleLogout() }}
                className="shrink-0 p-0.5 rounded transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}>
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

/* ─── Section label (ElevenLabs "Pinned" style) ─── */
function SectionLabel({ label, open, onToggle, icon: Icon }: {
  label: string; open: boolean; onToggle: () => void; icon?: React.ElementType
}) {
  return (
    <button onClick={onToggle}
      className="w-full flex items-center gap-2.5 px-2 py-[7px] mt-1 mx-1 rounded-xl transition-colors group"
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      {Icon && <Icon className="h-[17px] w-[17px] shrink-0" style={{ color: 'var(--text-muted)' }} />}
      <span className="text-[14px] font-medium flex-1 text-left" style={{ color: 'var(--text-primary)' }}>{label}</span>
      {open
        ? <ChevronDown className="h-3 w-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
        : <ChevronRight className="h-3 w-3 shrink-0" style={{ color: 'var(--text-muted)' }} />}
    </button>
  )
}

/* ─── Nav item ─── */
function NavItem({ href, label, icon: Icon, active, counter, entityOnly, collapsed }: {
  href: string; label: string; icon: React.ElementType; active: boolean
  counter?: { done: number; total: number }; entityOnly?: boolean; collapsed?: boolean
}) {
  const allDone = !entityOnly && counter && counter.total > 0 && counter.done === counter.total
  return (
    <Link href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-2.5 px-2 py-[5px] mx-1 rounded-xl text-[14px] transition-colors group ${collapsed ? 'justify-center' : ''}`}
      style={active
        ? { background: 'var(--bg-selected)', color: 'var(--text-primary)', fontWeight: 500 }
        : { color: 'var(--text-primary)', fontWeight: 500 }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
      <Icon className="h-[17px] w-[17px] shrink-0"
        style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }} />
      {!collapsed && <span className="truncate flex-1">{label}</span>}
      {!collapsed && counter !== undefined && (
        <span className="text-[12px] tabular-nums shrink-0"
          style={{ color: allDone ? 'var(--brand)' : 'var(--text-muted)', fontWeight: 500 }}>
          {entityOnly ? counter.total : `${counter.done}/${counter.total}`}
        </span>
      )}
    </Link>
  )
}
