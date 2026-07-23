'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
    <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center max-w-sm w-full">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-100">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <polygon points="16,4 28,10 16,16 4,10" fill="white" fillOpacity="0.95"/>
            <polygon points="4,10 16,16 16,28 4,22" fill="white" fillOpacity="0.55"/>
            <polygon points="28,10 16,16 16,28 28,22" fill="white" fillOpacity="0.75"/>
          </svg>
        </div>
        {status === 'loading' && <p className="text-sm text-gray-500">Sprejemam povabilo...</p>}
        {status === 'done' && (
          <>
            <p className="text-lg font-bold text-gray-900 mb-1">Dobrodošli!</p>
            <p className="text-sm text-gray-400">Preusmeritev na nadzorno ploščo...</p>
          </>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-600">Napaka pri sprejemanju povabila. Poskusite znova ali se obrnite na admina.</p>
        )}
      </div>
    </div>
  )
}
