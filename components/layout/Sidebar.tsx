'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  MapPin, Car, BarChart2, FileText, Flame, Zap, Thermometer,
  FlaskConical, Settings, LogOut, Users, ChevronDown, ChevronRight,
  Wrench, Wind, Package, PanelLeft, Building2,
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

/* ─── Logo ─── */
function CarboniqIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 6L8 12L14 18" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 6L4 12L10 18" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
    <aside className={cn(
      'flex flex-col h-full shrink-0 overflow-hidden transition-all duration-200 bg-gray-50 border-r border-gray-200',
      collapsed ? 'w-[56px]' : 'w-64',
    )}>

      {/* ── Logo ── */}
      <div className="h-[57px] px-4 border-b border-gray-200 flex items-center justify-between shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <CarboniqIcon size={20} />
            <span className="font-semibold text-[15px] text-gray-900 tracking-tight">Carboniqdesk</span>
          </div>
        )}
        {collapsed && <CarboniqIcon size={20} />}
        {!collapsed && onToggleCollapse && (
          <button onClick={onToggleCollapse}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-[#f6f6f6] transition-colors">
            <PanelLeft className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>

      {/* ── Org ── */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-white rounded-md border border-gray-200">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            <p className="text-sm font-medium text-gray-900 truncate">{orgName}</p>
          </div>
        </div>
      )}

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">

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
      <div className="border-t border-gray-200 p-2">
        <NavItem href="/app/settings" label={t('Nastavitve', 'Settings')} icon={Settings} active={pathname.startsWith('/app/settings')} collapsed={collapsed} />
        {isAdmin && <NavItem href="/app/team" label={t('Uporabniki', 'Users')} icon={Users} active={pathname.startsWith('/app/team')} collapsed={collapsed} />}
        {isSuperAdmin && <NavItem href="/app/admin/scope3" label="Admin" icon={FileText} active={pathname.startsWith('/app/admin')} collapsed={collapsed} />}

        {/* Lang switcher */}
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <span className="text-xs text-gray-500 shrink-0">{locale === 'EN' ? 'Language' : 'Jezik'}:</span>
            <div className="flex gap-1">
              {(['SL', 'EN'] as const).map(l => (
                <button key={l} onClick={() => switchLocale(l)}
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                    locale === l ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-[#f6f6f6]',
                  )}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User row */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{displayName}</p>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-gray-900 transition-colors" title={t('Odjava', 'Sign out')}>
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

/* ─── Section label ─── */
function SectionLabel({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="w-full flex items-center gap-1.5 px-3 py-1 mt-2 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-[#f6f6f6] transition-colors">
      <span className="flex-1 text-left">{label}</span>
      {open
        ? <ChevronDown className="h-3 w-3 shrink-0" />
        : <ChevronRight className="h-3 w-3 shrink-0" />}
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
      className={cn(
        'flex items-center gap-2.5 px-3 py-1.5 rounded-lg mb-0.5 text-sm font-medium transition-colors',
        collapsed ? 'justify-center' : '',
        active ? 'bg-[#f1f1f1] text-gray-900' : 'text-gray-900 hover:bg-[#f6f6f6]',
      )}>
      <Icon className="w-4 h-4 shrink-0 text-gray-500" />
      {!collapsed && <span className="truncate flex-1">{label}</span>}
      {!collapsed && counter !== undefined && (
        <span className={cn('text-xs tabular-nums shrink-0 font-medium', allDone ? 'text-blue-600' : 'text-gray-400')}>
          {entityOnly ? counter.total : `${counter.done}/${counter.total}`}
        </span>
      )}
    </Link>
  )
}
