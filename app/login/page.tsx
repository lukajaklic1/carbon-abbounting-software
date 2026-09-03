'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

const T = {
  EN: {
    title: 'Sign in',
    email: 'Email', password: 'Password',
    forgotPassword: 'Forgot password?',
    submit: 'Sign in', submitting: 'Signing in...',
    noAccount: "Don't have an account?", createOne: 'Create one',
    terms: <>By proceeding you acknowledge that you have read and agree to our <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.</>,
  },
  SL: {
    title: 'Prijavite se',
    email: 'E-pošta', password: 'Geslo',
    forgotPassword: 'Pozabili geslo?',
    submit: 'Prijavite se', submitting: 'Prijavljanje...',
    noAccount: 'Nimate računa?', createOne: 'Registrirajte se',
    terms: <>Z nadaljevanjem potrjujete, da ste prebrali in se strinjate z našimi <Link href="/terms" className="underline hover:text-gray-600">pogoji uporabe</Link> in <Link href="/privacy" className="underline hover:text-gray-600">politiko zasebnosti</Link>.</>,
  },
}

function getCookieLocale(): 'EN' | 'SL' {
  if (typeof document === 'undefined') return 'SL'
  const m = document.cookie.match(/locale=([^;]+)/)
  return m?.[1]?.toUpperCase() === 'EN' ? 'EN' : 'SL'
}

const INPUT = 'w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors'

export default function LoginPage() {
  const router = useRouter()
  const [locale, setLocale] = useState<'EN' | 'SL'>('SL')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { setLocale(getCookieLocale()) }, [])

  useEffect(() => {
    if (IS_MOCK) return
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/app/analytics')
    })
  }, [])

  const t = T[locale]

  function switchLocale(l: 'EN' | 'SL') {
    document.cookie = `locale=${l.toLowerCase()}; path=/; max-age=31536000`
    setLocale(l)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (IS_MOCK) {
      await new Promise(r => setTimeout(r, 500))
      router.push('/app/analytics')
      return
    }

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError(signInError.message); setLoading(false); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: sa } = await supabase.from('super_admins').select('user_id').eq('user_id', user.id).maybeSingle()
        if (sa) { router.push('/app/super-admin'); return }
        const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).maybeSingle()
        if (!org) { router.push('/onboarding'); return }
      }
      router.push('/app/analytics')
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo */}
      <div className="flex justify-center pt-10 pb-0">
        <Link href="/" className="flex items-center gap-2 text-gray-900 hover:opacity-80 transition-opacity">
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
            <polyline points="26,6 10,20 26,34" stroke="#111" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="33,6 17,20 33,34" stroke="#111" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
          </svg>
          <span className="text-lg font-semibold tracking-tight">Carboniqdesk</span>
        </Link>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-gray-900 text-center mb-8">{t.title}</h1>

          {IS_MOCK && (
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700 text-center">
              Demo — {locale === 'SL' ? 'katerikoli email in geslo deluje' : 'any email & password works'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t.email}</label>
              <input type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={INPUT}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{t.password}</label>
              <input type="password" required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={INPUT}
              />
            </div>

            <div className="flex justify-end -mt-1">
              <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                {t.forgotPassword}
              </Link>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-1">
              {loading ? t.submitting : t.submit}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t.noAccount}{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">{t.createOne}</Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-3 px-8 py-5">
        <p className="text-xs text-gray-400 text-center max-w-sm">{t.terms}</p>
        <div className="flex items-center gap-4">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Carboniqdesk</p>
          <div className="flex gap-1">
            {(['SL', 'EN'] as const).map(l => (
              <button key={l} onClick={() => switchLocale(l)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${locale === l ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
