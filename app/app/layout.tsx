'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from 'sonner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <Toaster position="bottom-right" />
    </>
  )
}
