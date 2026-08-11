'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  MapPin, Car, BarChart2, FileText,
  Flame, Zap, Thermometer, FlaskConical, Settings, LogOut, Users, ChevronDown, Wrench, Wind, Package, Calendar,
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

export function Sidebar() {
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

  useEffect(() => {
    if (selectedYear) refresh(selectedYear)
  }, [selectedYear, pathname])

  const [openOrg, setOpenOrg] = useState(true)
  const [openScope1, setOpenScope1] = useState(true)
  const [openScope2, setOpenScope2] = useState(true)
  const [openScope3, setOpenScope3] = useState(true)
  const [openReports, setOpenReports] = useState(true)

  const orgName = organization?.name ?? (IS_MOCK ? mockOrg.name : '—')

  useEffect(() => {
    if (!IS_MOCK) {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUserMeta({
            firstName: user.user_metadata?.first_name,
            lastName: user.user_metadata?.last_name,
            email: user.email,
          })
          supabase.from('super_admins').select('user_id').eq('user_id', user.id).single()
            .then(({ data }) => { if (data) setIsSuperAdmin(true) })
        }
      })
    } else {
      setUserMeta({ firstName: 'Luka', lastName: 'Novak', email: 'luka@demo.com' })
    }
  }, [])

  async function handleLogout() {
    if (!IS_MOCK) {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    router.push('/login')
  }

  function handleSelectYear(year: number) {
    const period = availablePeriods.find(p => p.year === year)
    setSelectedYear(year)
    setCurrentPeriod(period ?? null)
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
    { label: t('Vozila', 'Vehicles'), href: '/app/vehicles', icon: Car },
    { label: t('Oprema', 'Equipment'), href: '/app/equipment', icon: Wrench },
  ]

  const scope1Items = [
    { label: t('Zemeljski plin', 'Natural gas'), href: `/app/periods/${selectedYear}/scope1/stationary`, icon: Flame },
    { label: t('Poraba vozil', 'Vehicle fuel'), href: `/app/periods/${selectedYear}/scope1/mobile`, icon: Car },
    { label: t('Gorivo opreme', 'Equipment fuel'), href: `/app/periods/${selectedYear}/scope1/equipment-fuel`, icon: Wrench },
    { label: t('Hladilni plini', 'Refrigerants'), href: `/app/periods/${selectedYear}/scope1/refrigerants`, icon: Thermometer },
    { label: t('Industrijski plini', 'Industrial gases'), href: `/app/periods/${selectedYear}/scope1/industrial-gases`, icon: FlaskConical },
  ]

  const scope2Items = [
    { label: t('Elektrika', 'Electricity'), href: `/app/periods/${selectedYear}/scope2/electricity`, icon: Zap },
    { label: t('Toplota', 'Heat'), href: `/app/periods/${selectedYear}/scope2/heat`, icon: Flame },
    { label: t('Para', 'Steam'), href: `/app/periods/${selectedYear}/scope2/steam`, icon: Wind },
    { label: t('Hlajenje', 'Cooling'), href: `/app/periods/${selectedYear}/scope2/cooling`, icon: Thermometer },
  ]

  const scope3Items = [
    { label: t('Obseg 3', 'Scope 3'), href: `/app/periods/${selectedYear}/scope3`, icon: Package },
  ]

  const reportItems = [
    { label: t('Analitika', 'Analytics'), href: '/app/analytics', icon: BarChart2 },
    { label: t('Poročila', 'Reports'), href: '/app/reports', icon: FileText },
  ]

  return (
    <aside className="flex flex-col h-full w-[220px] shrink-0" style={{ background: '#0a1b11' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#22c55e' }}>
          <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
            <polygon points="16,4 28,10 16,16 4,10" fill="white" fillOpacity="0.95"/>
            <polygon points="4,10 16,16 16,28 4,22" fill="white" fillOpacity="0.55"/>
            <polygon points="28,10 16,16 16,28 28,22" fill="white" fillOpacity="0.75"/>
          </svg>
        </div>
        <span className="font-bold text-base tracking-tight" style={{ color: '#ffffff' }}>CarbonTrack</span>
      </div>

      {/* Org name + year selector */}
      <div className="px-4 pt-3 pb-2 space-y-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{orgName}</p>

        {/* Year dropdown */}
        <div className="relative">
          <button
            onClick={() => setYearOpen(v => !v)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)' }}
          >
            <Calendar className="h-3 w-3 shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>{t('Leto', 'Year')}</span>
            <span className="ml-auto font-bold" style={{ color: '#ffffff' }}>{selectedYear ?? '—'}</span>
            <ChevronDown className="h-3 w-3 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </button>
          {yearOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 rounded-xl py-1 z-50 shadow-xl" style={{ background: '#0f2416', border: '1px solid rgba(255,255,255,0.1)' }}>
              {IS_MOCK
                ? [2024, 2025].map(y => (
                  <button key={y} onClick={() => handleSelectYear(y)}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{ color: y === selectedYear ? '#22c55e' : 'rgba(255,255,255,0.65)', background: y === selectedYear ? 'rgba(34,197,94,0.1)' : 'transparent' }}>
                    {y}
                  </button>
                ))
                : availablePeriods.map(p => (
                  <button key={p.year} onClick={() => handleSelectYear(p.year)}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{ color: p.year === selectedYear ? '#22c55e' : 'rgba(255,255,255,0.65)', background: p.year === selectedYear ? 'rgba(34,197,94,0.1)' : 'transparent' }}>
                    {p.year}
                  </button>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {/* Moja organizacija */}
        <CollapsibleSection label={t('Moja organizacija', 'My organisation')} open={openOrg} onToggle={() => setOpenOrg(v => !v)}>
          {mainItems.map(item => (
            <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon}
              active={pathname.startsWith(item.href)} counter={counters[item.href]} entityOnly />
          ))}
        </CollapsibleSection>

        <CollapsibleSection label={t('Obseg 1', 'Scope 1')} open={openScope1} onToggle={() => setOpenScope1(v => !v)}>
          {scope1Items.map(item => (
            <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon}
              active={pathname.startsWith(item.href)} counter={counters[item.href]} />
          ))}
        </CollapsibleSection>

        <CollapsibleSection label={t('Obseg 2', 'Scope 2')} open={openScope2} onToggle={() => setOpenScope2(v => !v)}>
          {scope2Items.map(item => (
            <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon}
              active={pathname.startsWith(item.href)} counter={counters[item.href]} />
          ))}
        </CollapsibleSection>

        <CollapsibleSection label={t('Obseg 3', 'Scope 3')} open={openScope3} onToggle={() => setOpenScope3(v => !v)}>
          {scope3Items.map(item => (
            <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon}
              active={pathname.startsWith(item.href)} />
          ))}
        </CollapsibleSection>

        <CollapsibleSection label={t('Poročila', 'Reports')} open={openReports} onToggle={() => setOpenReports(v => !v)}>
          {reportItems.map(item => (
            <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon}
              active={pathname === item.href} />
          ))}
        </CollapsibleSection>
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <NavItem href="/app/settings" label={t('Nastavitve', 'Settings')} icon={Settings}
          active={pathname.startsWith('/app/settings')} />
        {isAdmin && (
          <NavItem href="/app/team" label={t('Uporabniki', 'Users')} icon={Users}
            active={pathname.startsWith('/app/team')} />
        )}

        {/* Language */}
        <div className="flex items-center gap-1.5 px-2.5 py-1">
          {(['SL', 'EN'] as const).map(l => (
            <button key={l} onClick={() => switchLocale(l)}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors"
              style={{
                background: locale === l ? 'rgba(34,197,94,0.2)' : 'transparent',
                color: locale === l ? '#22c55e' : 'rgba(255,255,255,0.3)',
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* User row */}
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors group"
          style={{ background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
            style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>
            {initials}
          </div>
          <span className="text-xs font-medium truncate flex-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{displayName}</span>
          <button onClick={handleLogout} className="shrink-0 p-0.5 rounded transition-colors"
            style={{ color: 'rgba(255,255,255,0.25)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)')}>
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function CollapsibleSection({ label, open, onToggle, children }: {
  label: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="pt-3">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-1 rounded transition-colors group mb-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.30)', letterSpacing: '0.08em' }}>
          {label}
        </p>
        <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', open ? 'rotate-0' : '-rotate-90')}
          style={{ color: 'rgba(255,255,255,0.20)' }} />
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  )
}

function NavItem({ href, label, icon: Icon, active, counter, entityOnly }: {
  href: string; label: string; icon: React.ElementType; active: boolean
  counter?: { done: number; total: number }
  entityOnly?: boolean
}) {
  const allDone = !entityOnly && counter && counter.total > 0 && counter.done === counter.total
  const showCount = counter !== undefined

  return (
    <Link href={href}
      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors group"
      style={{
        background: active ? 'rgba(34,197,94,0.12)' : 'transparent',
        color: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
        fontWeight: active ? 600 : 400,
        fontSize: '13px',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0"
        style={{ color: active ? '#22c55e' : 'rgba(255,255,255,0.30)' }} />
      <span className="truncate flex-1">{label}</span>
      {showCount && (
        <span className="text-[10px] shrink-0 tabular-nums"
          style={{ color: allDone ? '#22c55e' : 'rgba(255,255,255,0.25)', fontWeight: allDone ? 600 : 400 }}>
          {entityOnly ? counter!.total : `${counter!.done}/${counter!.total}`}
        </span>
      )}
      {active && <div className="w-1 h-1 rounded-full shrink-0" style={{ background: '#22c55e' }} />}
    </Link>
  )
}
