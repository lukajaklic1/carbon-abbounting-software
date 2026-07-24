'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  MapPin, Car, BarChart2, FileText,
  Flame, Zap, Thermometer, FlaskConical, Settings, LogOut, Users, ChevronDown, Wrench, Wind, Package,
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
  const { selectedYear } = usePeriodStore()
  const { locale, switchLocale } = useLocale()
  const [userMeta, setUserMeta] = useState<{ firstName?: string; lastName?: string; email?: string } | null>(null)

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
      createClient().auth.getUser().then(({ data: { user } }) => {
        if (user) setUserMeta({
          firstName: user.user_metadata?.first_name,
          lastName: user.user_metadata?.last_name,
          email: user.email,
        })
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
    <aside className="flex flex-col h-full w-[220px] bg-white border-r border-gray-200 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-200 shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <polygon points="16,4 28,10 16,16 4,10" fill="white" fillOpacity="0.95"/>
            <polygon points="4,10 16,16 16,28 4,22" fill="white" fillOpacity="0.55"/>
            <polygon points="28,10 16,16 16,28 28,22" fill="white" fillOpacity="0.75"/>
          </svg>
        </div>
        <span className="font-bold text-gray-900 text-base">CarbonTrack</span>
      </div>

      {/* Org name */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-800 truncate">{orgName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {/* Moja organizacija */}
        <CollapsibleSection
          label={t('Moja organizacija', 'My organisation')}
          open={openOrg}
          onToggle={() => setOpenOrg(v => !v)}
        >
          {mainItems.map(item => (
            <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon}
              active={pathname.startsWith(item.href)} counter={counters[item.href]} entityOnly />
          ))}
        </CollapsibleSection>

        {/* Scope 1 */}
        <CollapsibleSection
          label={t('Obseg 1', 'Scope 1')}
          open={openScope1}
          onToggle={() => setOpenScope1(v => !v)}
        >
          {scope1Items.map(item => (
            <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon}
              active={pathname.startsWith(item.href)} counter={counters[item.href]} />
          ))}
        </CollapsibleSection>

        {/* Scope 2 */}
        <CollapsibleSection
          label={t('Obseg 2', 'Scope 2')}
          open={openScope2}
          onToggle={() => setOpenScope2(v => !v)}
        >
          {scope2Items.map(item => (
            <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon}
              active={pathname.startsWith(item.href)} counter={counters[item.href]} />
          ))}
        </CollapsibleSection>

        {/* Scope 3 */}
        <CollapsibleSection
          label={t('Obseg 3', 'Scope 3')}
          open={openScope3}
          onToggle={() => setOpenScope3(v => !v)}
        >
          {scope3Items.map(item => (
            <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon}
              active={pathname.startsWith(item.href)} />
          ))}
        </CollapsibleSection>

        {/* Reports */}
        <CollapsibleSection
          label={t('Poročila', 'Reports')}
          open={openReports}
          onToggle={() => setOpenReports(v => !v)}
        >
          {reportItems.map(item => (
            <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon}
              active={pathname.startsWith(item.href)} />
          ))}
        </CollapsibleSection>

        {/* Dashboard at bottom of nav */}
        <div className="pt-2 border-t border-gray-100 mt-2">
          <NavItem href="/app/dashboard" label={t('Nadzorna plošča', 'Dashboard')} icon={BarChart2}
            active={pathname === '/app/dashboard'} />
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-200 px-3 py-3 space-y-1">
        <NavItem href="/app/settings" label={t('Nastavitve', 'Settings')} icon={Settings}
          active={pathname.startsWith('/app/settings')} />
        {isAdmin && (
          <NavItem href="/app/team" label={t('Uporabniki', 'Users')} icon={Users}
            active={pathname.startsWith('/app/team')} />
        )}

        {/* Language */}
        <div className="flex items-center gap-2 px-3 py-1.5">
          <span className="text-xs text-gray-400 mr-1">{t('Jezik', 'Language')}</span>
          {(['EN', 'SL'] as const).map(l => (
            <button key={l} onClick={() => switchLocale(l)}
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-md transition-colors',
                locale === l ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'
              )}>
              {l}
            </button>
          ))}
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-gray-500">{initials}</span>
          </div>
          <span className="text-sm font-medium text-gray-700 truncate flex-1">{displayName}</span>
          <button onClick={handleLogout}
            className="p-1 text-gray-400 hover:text-gray-700 transition-colors shrink-0">
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
    <div className="pt-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest group-hover:text-gray-500 transition-colors">
          {label}
        </p>
        <ChevronDown className={cn(
          'h-3 w-3 text-gray-400 transition-transform duration-200',
          open ? 'rotate-0' : '-rotate-90'
        )} />
      </button>
      {open && (
        <div className="space-y-0.5 mt-0.5">
          {children}
        </div>
      )}
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
    <Link href={href} className={cn(
      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
      active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    )}>
      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-blue-600' : 'text-gray-400')} />
      <span className="truncate flex-1">{label}</span>
      {showCount && (
        <span className={cn(
          'text-[10px] font-normal tabular-nums shrink-0 tracking-tight',
          allDone ? 'text-green-500' : active ? 'text-blue-400' : 'text-gray-400'
        )}>
          {entityOnly ? counter.total : `${counter.done}/${counter.total}`}
        </span>
      )}
    </Link>
  )
}
