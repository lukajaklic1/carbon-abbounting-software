'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Check } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase sets the session from the URL hash on PASSWORD_RECOVERY
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // Also check if already in session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Gesli se ne ujemata.'); return }
    if (password.length < 6) { setError('Geslo mora imeti vsaj 6 znakov.'); return }
    setLoading(true); setError('')
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) { setError(err.message); return }
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: any) { setError(err.message) }
    setLoading(false)
  }

  const INPUT = 'w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] placeholder:text-gray-300 transition-shadow'

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
          {done ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Geslo posodobljeno</h2>
              <p className="text-sm text-gray-400">Preusmerjamo vas na prijavo...</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Novo geslo</h1>
              <p className="text-sm text-gray-400 mb-6">Vnesite novo geslo za vaš račun.</p>

              {!ready && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg mb-4">
                  Čakanje na potrditev povezave... Odprite to stran iz e-poštnega sporočila.
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Novo geslo</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••" required minLength={6}
                      className={INPUT + ' pr-10'}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Potrdi geslo</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••••" required
                    className={INPUT}
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button type="submit" disabled={loading || !password || !confirm || !ready}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
                  {loading ? 'Shranjevanje...' : 'Nastavi novo geslo'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
