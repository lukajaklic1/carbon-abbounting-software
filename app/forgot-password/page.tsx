'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail } from 'lucide-react'

const T = {
  EN: {
    title: 'Forgot password',
    subtitle: "Enter your email and we'll send you a reset link.",
    email: 'Email',
    submit: 'Send reset link',
    submitting: 'Sending...',
    backToLogin: 'Back to sign in',
    sentTitle: 'Check your email',
    sentDesc: 'We sent a password reset link to',
    terms: <>By proceeding you agree to our <Link href="/terms" className="underline hover:text-gray-600">Terms</Link> and <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.</>,
  },
  SL: {
    title: 'Pozabljeno geslo',
    subtitle: 'Vnesite e-poštni naslov in poslali vam bomo povezavo za ponastavitev.',
    email: 'E-pošta',
    submit: 'Pošlji povezavo',
    submitting: 'Pošiljanje...',
    backToLogin: 'Nazaj na prijavo',
    sentTitle: 'Preverite e-pošto',
    sentDesc: 'Poslali smo povezavo za ponastavitev gesla na',
    terms: <>Z nadaljevanjem se strinjate z našimi <Link href="/terms" className="underline hover:text-gray-600">pogoji</Link> in <Link href="/privacy" className="underline hover:text-gray-600">politiko zasebnosti</Link>.</>,
  },
}

function getCookieLocale(): 'EN' | 'SL' {
  if (typeof document === 'undefined') return 'SL'
  const m = document.cookie.match(/locale=([^;]+)/)
  return m?.[1]?.toUpperCase() === 'EN' ? 'EN' : 'SL'
}

const INPUT = 'w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors'

export default function ForgotPasswordPage() {
  const [locale, setLocale] = useState<'EN' | 'SL'>('SL')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setLocale(getCookieLocale()) }, [])

  const t = T[locale]

  function switchLocale(l: 'EN' | 'SL') {
    document.cookie = `locale=${l.toLowerCase()}; path=/; max-age=31536000`
    setLocale(l)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (err) { setError(err.message); setLoading(false); return }
      setSent(true)
    } catch (err: any) { setError(err.message); setLoading(false) }
  }

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
        <div className="w-full max-w-sm">

          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t.sentTitle}</h1>
              <p className="text-sm text-gray-400 mb-1">{t.sentDesc}</p>
              <p className="text-sm font-medium text-gray-700 mb-8">{email}</p>
              <Link href="/login" className="text-sm text-blue-600 hover:underline font-medium">
                {t.backToLogin}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">{t.title}</h1>
              <p className="text-sm text-gray-400 text-center mb-8">{t.subtitle}</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">{t.email}</label>
                  <input
                    type="email" required autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className={INPUT}
                  />
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

                <button type="submit" disabled={loading || !email}
                  className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-1">
                  {loading ? t.submitting : t.submit}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                <Link href="/login" className="text-blue-600 hover:underline font-medium">{t.backToLogin}</Link>
              </p>
            </>
          )}
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
