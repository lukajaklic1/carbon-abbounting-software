'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (err) { setError(err.message); return }
      setSent(true)
    } catch (err: any) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <polygon points="16,4 28,10 16,16 4,10" fill="white" fillOpacity="0.95"/>
              <polygon points="4,10 16,16 16,28 4,22" fill="white" fillOpacity="0.55"/>
              <polygon points="28,10 16,16 16,28 28,22" fill="white" fillOpacity="0.75"/>
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          {!sent ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Pozabljeno geslo</h1>
              <p className="text-sm text-gray-400 mb-6">Vnesite e-poštni naslov in poslali vam bomo povezavo za ponastavitev gesla.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-pošta</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="vi@podjetje.si" required
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] placeholder:text-gray-300 transition-shadow"
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button type="submit" disabled={loading || !email}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
                  {loading ? 'Pošiljanje...' : 'Pošlji povezavo'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Preverite e-pošto</h2>
              <p className="text-sm text-gray-400 mb-1">Poslali smo povezavo za ponastavitev gesla na</p>
              <p className="text-sm font-semibold text-gray-700">{email}</p>
            </div>
          )}
        </div>

        <div className="flex justify-center mt-5">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Nazaj na prijavo
          </Link>
        </div>
      </div>
    </div>
  )
}
