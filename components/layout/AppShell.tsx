'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, ChevronDown, Plus } from 'lucide-react'
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

function TopBarContent() {
  const { selectedYear, setSelectedYear, setCurrentPeriod, currentPeriod, availablePeriods } = usePeriodStore()
  const router = useRouter()
  const { t } = useLocale()
  const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL
  const totalKg = currentPeriod?.total_co2e_kg ?? (IS_MOCK ? mockPeriod.total_co2e_kg : 0)
  const displayYear = selectedYear ?? (IS_MOCK ? new Date().getFullYear() : '—')

  function handleSelectYear(year: number) {
    const period = availablePeriods.find(p => p.year === year)
    setSelectedYear(year)
    setCurrentPeriod(period ?? null)
  }

  return (
    <div className="flex items-center justify-between flex-1">
      <div>
        <p className="text-xs text-gray-400">{t('Skupne emisije', 'Total emissions')}</p>
        <p className="text-sm font-bold text-blue-600">{formatCo2e(totalKg)}</p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors border border-gray-200 outline-none">
          <span className="text-xs text-gray-400 font-normal hidden sm:inline">{t('Leto poročanja', 'Reporting year')}</span>
          <span className="font-semibold text-gray-800">{displayYear}</span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px]">
          {IS_MOCK ? (
            [2024, 2025].map(y => (
              <DropdownMenuItem key={y} onClick={() => handleSelectYear(y)}
                className={y === selectedYear ? 'font-semibold text-blue-600' : ''}>
                {y}
              </DropdownMenuItem>
            ))
          ) : availablePeriods.length > 0 ? (
            availablePeriods.map(p => (
              <DropdownMenuItem key={p.year} onClick={() => handleSelectYear(p.year)}
                className={p.year === selectedYear ? 'font-semibold text-blue-600' : ''}>
                {p.year}
                {p.status === 'completed' && <span className="ml-auto text-xs text-green-500">✓</span>}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled className="text-gray-400 text-xs">
              {t('Ni obdobij', 'No periods')}
            </DropdownMenuItem>
          )}
          {!IS_MOCK && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/app/periods/new')}
                className="text-blue-600 font-medium">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                {t('Dodaj leto', 'Add year')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  return (
    <LocaleProvider>
      <div className="flex h-screen bg-[#f7f8fa] overflow-hidden">
        <OrgLoader />

        {/* Desktop sidebar */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full z-10">
              <Sidebar />
            </div>
          </div>
        )}

        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <header className="h-14 lg:h-16 bg-white border-b border-gray-200 flex items-center gap-3 px-4 lg:px-6 shrink-0">
            <button
              className="lg:hidden p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <TopBarContent />
          </header>

          <main className="flex-1 overflow-y-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    </LocaleProvider>
  )
}
