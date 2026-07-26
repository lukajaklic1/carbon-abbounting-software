'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Building2, Users, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Nadzorna plošča', href: '/app/super-admin', icon: LayoutDashboard, exact: true },
  { label: 'Podjetja', href: '/app/super-admin/companies', icon: Building2 },
  { label: 'Uporabniki', href: '/app/super-admin/users', icon: Users },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-44 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-100 shrink-0">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
              <polygon points="16,4 28,10 16,16 4,10" fill="white" fillOpacity="0.95"/>
              <polygon points="4,10 16,16 16,28 4,22" fill="white" fillOpacity="0.55"/>
              <polygon points="28,10 16,16 16,28 28,22" fill="white" fillOpacity="0.75"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 leading-tight">CarbonTrack</p>
            <p className="text-[10px] text-blue-600 font-semibold">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}
                className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
                  active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}>
                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-blue-600' : 'text-gray-400')} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-2 py-3 border-t border-gray-100">
          <button onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors w-full">
            <LogOut className="h-4 w-4 shrink-0 text-gray-400" />
            Odjava
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
