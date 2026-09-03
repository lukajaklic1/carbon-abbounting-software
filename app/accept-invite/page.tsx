'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'

export default function AcceptInvitePage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')

  useEffect(() => {
    async function accept() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        // Link user to org via invited_email
        const { data: pending } = await supabase
          .from('organization_members')
          .select('id, organization_id')
          .eq('invited_email', user.email!)
          .eq('status', 'invited')
          .single()

        if (pending) {
          await supabase.from('organization_members')
            .update({ user_id: user.id, status: 'active', accepted_at: new Date().toISOString() })
            .eq('id', pending.id)
        }

        setStatus('done')
        setTimeout(() => router.push('/app/dashboard'), 1500)
      } catch {
        setStatus('error')
      }
    }
    accept()
  }, [router])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo */}
      <div className="flex justify-center pt-10">
        <Link href="/" className="flex items-center gap-2 text-gray-900 hover:opacity-80 transition-opacity">
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
            <polyline points="26,6 10,20 26,34" stroke="#111" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="33,6 17,20 33,34" stroke="#111" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
          </svg>
          <span className="text-lg font-semibold tracking-tight">Carboniqdesk</span>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-10">
        <div className="w-full max-w-sm text-center">

          {status === 'loading' && (
            <>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Sprejemam povabilo</h1>
              <p className="text-sm text-gray-400">Prosimo počakajte...</p>
            </>
          )}

          {status === 'done' && (
            <>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Dobrodošli!</h1>
              <p className="text-sm text-gray-400">Preusmeritev na nadzorno ploščo...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="text-red-500 text-xl">!</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Napaka</h1>
              <p className="text-sm text-gray-400 mb-6">Napaka pri sprejemanju povabila. Poskusite znova ali se obrnite na admina.</p>
              <Link href="/login" className="text-sm text-blue-600 hover:underline font-medium">
                Nazaj na prijavo
              </Link>
            </>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-center px-8 py-5">
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} Carboniqdesk</p>
      </div>
    </div>
  )
}
