'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

const T = {
  EN: {
    title: 'Welcome back',
    subtitle: 'Sign in to CarbonTrack',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    submitting: 'Signing in...',
    noAccount: 'No account yet?',
    createOne: 'Create one',
    placeholder_email: 'you@company.com',
    placeholder_password: '••••••••••',
  },
  SL: {
    title: 'Dobrodošli nazaj',
    subtitle: 'Prijavite se v svoj račun',
    email: 'E-pošta',
    password: 'Geslo',
    submit: 'Prijavite se',
    submitting: 'Prijavljanje...',
    noAccount: 'Nimate računa?',
    createOne: 'Registrirajte se',
    placeholder_email: 'vi@podjetje.si',
    placeholder_password: '••••••••••',
  },
}

function getCookieLocale(): 'EN' | 'SL' {
  if (typeof document === 'undefined') return 'EN'
  const m = document.cookie.match(/locale=([^;]+)/)
  return (m?.[1]?.toUpperCase() === 'SL') ? 'SL' : 'EN'
}

export default function LoginPage() {
  const router = useRouter()
  const [locale, setLocale] = useState<'EN' | 'SL'>(() =>
    typeof document !== 'undefined' ? getCookieLocale() : 'EN'
  )
  const t = T[locale]

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function switchLocale(l: 'EN' | 'SL') {
    document.cookie = `locale=${l.toLowerCase()}; path=/; max-age=31536000`
    setLocale(l)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (IS_MOCK) {
      await new Promise(r => setTimeout(r, 500))
      router.push('/app/dashboard')
      return
    }

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError(signInError.message); setLoading(false); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).maybeSingle()
        if (!org) { router.push('/onboarding'); return }
      }
      router.push('/app/dashboard')
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex flex-col items-center justify-center p-4">

      {/* Logo */}
      <div className="mb-6">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            {/* top face */}
            <polygon points="16,4 28,10 16,16 4,10" fill="white" fillOpacity="0.95"/>
            {/* left face */}
            <polygon points="4,10 16,16 16,28 4,22" fill="white" fillOpacity="0.55"/>
            {/* right face */}
            <polygon points="28,10 16,16 16,28 28,22" fill="white" fillOpacity="0.75"/>
          </svg>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-[360px] bg-white rounded-2xl border border-gray-200 px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">{t.title}</h1>
        <p className="text-sm text-gray-400 text-center mb-7">{t.subtitle}</p>

        {IS_MOCK && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700 text-center">
            Demo — {locale === 'SL' ? 'katerikoli email in geslo deluje' : 'any email & password works'}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.email}</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder={t.placeholder_email}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] focus:bg-white placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.password}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)} required
                placeholder={t.placeholder_password}
                className="w-full px-3 py-2 pr-10 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] focus:bg-white placeholder:text-gray-300"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end -mt-1">
            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
              {locale === 'SL' ? 'Pozabljeno geslo?' : 'Forgot password?'}
            </Link>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                {t.submitting}
              </span>
            ) : t.submit}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between w-full max-w-[360px]">
        <p className="text-sm text-gray-400">
          {t.noAccount}{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-semibold">{t.createOne}</Link>
        </p>
        <div className="flex gap-1">
          {(['EN', 'SL'] as const).map(l => (
            <button key={l} onClick={() => switchLocale(l)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                locale === l ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
