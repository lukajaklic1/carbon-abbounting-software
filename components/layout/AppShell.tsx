'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, ChevronDown, Plus, PanelLeft, MapPin, Car, Wrench, Flame, Zap, Thermometer, FlaskConical, Wind, Package, BarChart2, FileText, Settings, Users, LayoutDashboard } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { OrgLoader } from './OrgLoader'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { usePeriodStore } from '@/stores/period'
import { formatCo2e } from '@/lib/utils/co2e'
import { mockPeriod } from '@/lib/mock-data'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { useEmissionCountersStore } from '@/stores/emissionCounters'

/* ─── Page meta map ─── */
function usePageMeta(pathname: string) {
  const { t } = useLocale()
  const { selectedYear } = usePeriodStore()
  const { counters } = useEmissionCountersStore()

  const pages: { match: (p: string) => boolean; label: string; icon: React.ElementType; counter?: { done: number; total: number } }[] = [
    { match: p => p === '/app/dashboard',                              label: t('Nadzorna plošča', 'Dashboard'),      icon: LayoutDashboard },
    { match: p => p.startsWith('/app/locations'),                      label: t('Lokacije', 'Locations'),             icon: MapPin,        counter: counters['/app/locations'] },
    { match: p => p.startsWith('/app/vehicles'),                       label: t('Vozila', 'Vehicles'),                icon: Car,           counter: counters['/app/vehicles'] },
    { match: p => p.startsWith('/app/equipment'),                      label: t('Oprema', 'Equipment'),               icon: Wrench,        counter: counters['/app/equipment'] },
    { match: p => p.includes('/scope1/stationary'),                    label: t('Zemeljski plin', 'Natural Gas'),     icon: Flame,         counter: counters[`/app/periods/${selectedYear}/scope1/stationary`] },
    { match: p => p.includes('/scope1/mobile'),                        label: t('Poraba vozil', 'Vehicle Fuel'),      icon: Car,           counter: counters[`/app/periods/${selectedYear}/scope1/mobile`] },
    { match: p => p.includes('/scope1/equipment-fuel'),                label: t('Gorivo opreme', 'Equipment Fuel'),   icon: Wrench,        counter: counters[`/app/periods/${selectedYear}/scope1/equipment-fuel`] },
    { match: p => p.includes('/scope1/refrigerants'),                  label: t('Hladilni plini', 'Refrigerants'),    icon: Thermometer,   counter: counters[`/app/periods/${selectedYear}/scope1/refrigerants`] },
    { match: p => p.includes('/scope1/industrial-gases'),              label: t('Industrijski plini', 'Industrial Gas'), icon: FlaskConical, counter: counters[`/app/periods/${selectedYear}/scope1/industrial-gases`] },
    { match: p => p.includes('/scope2/electricity'),                   label: t('Elektrika', 'Electricity'),          icon: Zap,           counter: counters[`/app/periods/${selectedYear}/scope2/electricity`] },
    { match: p => p.includes('/scope2/heat'),                          label: t('Toplota', 'Heat'),                   icon: Flame,         counter: counters[`/app/periods/${selectedYear}/scope2/heat`] },
    { match: p => p.includes('/scope2/steam'),                         label: t('Para', 'Steam'),                     icon: Wind,          counter: counters[`/app/periods/${selectedYear}/scope2/steam`] },
    { match: p => p.includes('/scope2/cooling'),                       label: t('Hlajenje', 'Cooling'),               icon: Thermometer,   counter: counters[`/app/periods/${selectedYear}/scope2/cooling`] },
    { match: p => p.includes('/scope3'),                               label: t('Obseg 3', 'Scope 3'),                icon: Package },
    { match: p => p.startsWith('/app/analytics'),                      label: t('Analitika', 'Analytics'),            icon: BarChart2 },
    { match: p => p.startsWith('/app/reports'),                        label: t('Poročila', 'Reports'),               icon: FileText },
    { match: p => p.startsWith('/app/settings'),                       label: t('Nastavitve', 'Settings'),            icon: Settings },
    { match: p => p.startsWith('/app/team'),                           label: t('Uporabniki', 'Users'),               icon: Users },
  ]

  return pages.find(p => p.match(pathname)) ?? null
}

function TopBarContent({ pathname }: { pathname: string }) {
  const { selectedYear, setSelectedYear, setCurrentPeriod, currentPeriod, availablePeriods } = usePeriodStore()
  const router = useRouter()
  const { t } = useLocale()
  const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL
  const totalKg = currentPeriod?.total_co2e_kg ?? (IS_MOCK ? mockPeriod.total_co2e_kg : 0)
  const displayYear = selectedYear ?? (IS_MOCK ? new Date().getFullYear() : '—')
  const pageMeta = usePageMeta(pathname)

  function handleSelectYear(year: number) {
    const period = availablePeriods.find(p => p.year === year)
    setSelectedYear(year)
    setCurrentPeriod(period ?? null)
  }

  return (
    <div className="flex items-center justify-between flex-1 min-w-0">
      {/* Page title + icon + counter */}
      <div className="flex items-center gap-1.5 min-w-0">
        {pageMeta && (
          <>
            <pageMeta.icon className="h-[18px] w-[18px] shrink-0 text-[#0f0f10]" />
            <span className="font-semibold text-[14px] text-[#0f0f10] truncate">{pageMeta.label}</span>
            {pageMeta.counter !== undefined && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md"
                style={{ background: '#efefef', color: '#767676' }}>
                {pageMeta.counter.total}
              </span>
            )}
          </>
        )}
      </div>

      {/* Emissions pill */}
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 h-8 px-3 rounded-xl border border-[#ececec] bg-white">
          <span className="text-[14px] text-[#767676] font-medium hidden sm:inline">{t('Skupne emisije', 'Total emissions')}</span>
          <span className="text-[14px] font-semibold text-[#0f0f10]">{formatCo2e(totalKg)}</span>
        </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-2 h-8 px-3 text-[13px] font-medium text-[#0f0f10] bg-white hover:bg-[#fafafa] rounded-xl cursor-pointer transition-colors border border-[#ececec] outline-none">
          <span className="text-[14px] text-[#767676] font-medium hidden sm:inline">{t('Leto poročanja', 'Reporting year')}</span>
          <span className="text-[14px] font-semibold text-[#0f0f10]">{displayYear}</span>
          <ChevronDown className="h-3 w-3 text-[#767676]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px]">
          {IS_MOCK ? (
            [2024, 2025].map(y => (
              <DropdownMenuItem key={y} onClick={() => handleSelectYear(y)}
                className={y === selectedYear ? 'font-semibold text-[#0f0f10]' : ''}>
                {y}
              </DropdownMenuItem>
            ))
          ) : availablePeriods.length > 0 ? (
            availablePeriods.map(p => (
              <DropdownMenuItem key={p.year} onClick={() => handleSelectYear(p.year)}
                className={p.year === selectedYear ? 'font-semibold text-[#0f0f10]' : ''}>
                {p.year}
                {p.status === 'completed' && <span className="ml-auto text-xs text-[#0f0f10]">✓</span>}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled className="text-[#767676] text-xs">
              {t('Ni obdobij', 'No periods')}
            </DropdownMenuItem>
          )}
          {!IS_MOCK && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/app/periods/new')}
                className="text-[#0f0f10] font-medium">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                {t('Dodaj leto', 'Add year')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  if (pathname.startsWith('/app/super-admin')) {
    return <>{children}</>
  }

  return (
    <LocaleProvider>
      <div className="flex h-screen bg-white overflow-hidden">
        <OrgLoader />

        {/* Desktop sidebar */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(v => !v)} />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full z-10">
              <Sidebar collapsed={false} onToggleCollapse={() => {}} />
            </div>
          </div>
        )}

        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <header className="h-12 lg:h-14 bg-white border-b border-[#ececec] flex items-center gap-3 px-4 lg:px-6 shrink-0">
            {/* Mobile: hamburger */}
            <button
              className="lg:hidden p-1.5 text-[#767676] hover:text-[#031f18] hover:bg-[#fafafa] rounded-lg transition-colors shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Desktop: show expand button only when collapsed */}
            {sidebarCollapsed && (
              <button
                className="hidden lg:flex p-1.5 text-[#767676] hover:text-[#0f0f10] hover:bg-[#efefef] rounded-lg transition-colors shrink-0"
                onClick={() => setSidebarCollapsed(false)}
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            )}
            <TopBarContent pathname={pathname} />
          </header>

          <main className="flex-1 overflow-y-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    </LocaleProvider>
  )
}
