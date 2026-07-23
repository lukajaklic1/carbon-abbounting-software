'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

const T = {
  EN: {
    title: 'Create account',
    subtitle: 'Get started with CarbonTrack',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    passwordHint: 'Min. 8 characters',
    terms1: 'I agree to the',
    termsLink: 'terms of service',
    terms2: 'and',
    privacyLink: 'privacy policy',
    submit: 'Create account',
    submitting: 'Creating account...',
    hasAccount: 'Already have an account?',
    signIn: 'Sign in',
    errorMatch: 'Passwords do not match',
    errorTerms: 'You must accept the terms to continue',
    placeholder_email: 'you@company.com',
    placeholder_password: 'Min. 8 characters',
    placeholder_confirm: '••••••••••',
  },
  SL: {
    title: 'Ustvarite račun',
    subtitle: 'Začnite z merjenjem emisij',
    email: 'E-pošta',
    password: 'Geslo',
    confirmPassword: 'Potrdite geslo',
    passwordHint: 'Vsaj 8 znakov',
    terms1: 'Strinjam se s',
    termsLink: 'pogoji uporabe',
    terms2: 'in',
    privacyLink: 'politiko zasebnosti',
    submit: 'Ustvarite račun',
    submitting: 'Ustvarjanje računa...',
    hasAccount: 'Že imate račun?',
    signIn: 'Prijavite se',
    errorMatch: 'Gesli se ne ujemata',
    errorTerms: 'Za nadaljevanje morate sprejeti pogoje',
    placeholder_email: 'vi@podjetje.si',
    placeholder_password: 'Vsaj 8 znakov',
    placeholder_confirm: '••••••••••',
  },
}

function getCookieLocale(): 'EN' | 'SL' {
  if (typeof document === 'undefined') return 'EN'
  const m = document.cookie.match(/locale=([^;]+)/)
  return (m?.[1]?.toUpperCase() === 'SL') ? 'SL' : 'EN'
}

export default function RegisterPage() {
  const router = useRouter()
  const [locale, setLocale] = useState<'EN' | 'SL'>(() =>
    typeof document !== 'undefined' ? getCookieLocale() : 'EN'
  )
  const t = T[locale]

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function switchLocale(l: 'EN' | 'SL') {
    document.cookie = `locale=${l.toLowerCase()}; path=/; max-age=31536000`
    setLocale(l)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) { setError(t.errorMatch); return }
    if (!agreed) { setError(t.errorTerms); return }

    setLoading(true)

    if (IS_MOCK) {
      await new Promise(r => setTimeout(r, 500))
      router.push('/onboarding')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false) }
      else router.push('/onboarding')
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong')
      setLoading(false)
    }
  }

  const canSubmit = email && password.length >= 8 && confirm && agreed && !loading

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

        <form onSubmit={handleRegister} className="space-y-4">
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
                value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                placeholder={t.placeholder_password}
                className="w-full px-3 py-2 pr-10 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] focus:bg-white placeholder:text-gray-300"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.confirmPassword}</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm} onChange={e => setConfirm(e.target.value)} required
                placeholder={t.placeholder_confirm}
                className="w-full px-3 py-2 pr-10 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] focus:bg-white placeholder:text-gray-300"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 shrink-0">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                className="sr-only" />
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                agreed ? 'bg-blue-600 border-blue-600' : 'border-gray-200 group-hover:border-blue-400'
              }`}>
                {agreed && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-600 leading-snug">
              {t.terms1}{' '}
              <a href="#" className="text-blue-600 font-semibold hover:underline">{t.termsLink}</a>
              {' '}{t.terms2}{' '}
              <a href="#" className="text-blue-600 font-semibold hover:underline">{t.privacyLink}</a>
            </span>
          </label>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={!canSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors">
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
          {t.hasAccount}{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-semibold">{t.signIn}</Link>
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
