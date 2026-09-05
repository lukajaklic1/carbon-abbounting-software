'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'

const INDUSTRIES = {
  EN: [
    { value: 'manufacturing', label: 'Manufacturing & Industry' },
    { value: 'retail', label: 'Retail & Wholesale' },
    { value: 'transport', label: 'Transport & Logistics' },
    { value: 'energy', label: 'Energy & Utilities' },
    { value: 'finance', label: 'Finance & Insurance' },
    { value: 'construction', label: 'Construction & Real Estate' },
    { value: 'agriculture', label: 'Agriculture & Food' },
    { value: 'hospitality', label: 'Hospitality & Tourism' },
    { value: 'healthcare', label: 'Healthcare & Social Services' },
    { value: 'it', label: 'Information Technology' },
    { value: 'education', label: 'Education' },
    { value: 'public', label: 'Public Administration' },
    { value: 'other', label: 'Other' },
  ],
  SL: [
    { value: 'manufacturing', label: 'Predelovalna industrija' },
    { value: 'retail', label: 'Trgovina na drobno in debelo' },
    { value: 'transport', label: 'Transport in logistika' },
    { value: 'energy', label: 'Energetika in komunala' },
    { value: 'finance', label: 'Finance in zavarovalništvo' },
    { value: 'construction', label: 'Gradbeništvo in nepremičnine' },
    { value: 'agriculture', label: 'Kmetijstvo in živilska industrija' },
    { value: 'hospitality', label: 'Gostinstvo in turizem' },
    { value: 'healthcare', label: 'Zdravstvo in socialno varstvo' },
    { value: 'it', label: 'Informacijska tehnologija' },
    { value: 'education', label: 'Izobraževanje' },
    { value: 'public', label: 'Javna uprava' },
    { value: 'other', label: 'Drugo' },
  ],
}

const COUNTRIES = [
  { value: 'SI', label: 'Slovenija' },
  { value: 'HR', label: 'Hrvaška' },
  { value: 'AT', label: 'Avstrija' },
  { value: 'DE', label: 'Nemčija' },
  { value: 'IT', label: 'Italija' },
  { value: 'FR', label: 'Francija' },
  { value: 'GB', label: 'Združeno kraljestvo' },
  { value: 'OTHER', label: 'Drugo' },
]

const EMPLOYEES = {
  EN: [
    { value: '1-10', label: '1–10 employees' },
    { value: '11-50', label: '11–50 employees' },
    { value: '51-250', label: '51–250 employees' },
    { value: '251-1000', label: '251–1000 employees' },
    { value: '1000+', label: '1000+ employees' },
  ],
  SL: [
    { value: '1-10', label: '1–10 zaposlenih' },
    { value: '11-50', label: '11–50 zaposlenih' },
    { value: '51-250', label: '51–250 zaposlenih' },
    { value: '251-1000', label: '251–1000 zaposlenih' },
    { value: '1000+', label: '1000+ zaposlenih' },
  ],
}

const T = {
  EN: {
    steps: ['Company', 'Your profile'] as string[],
    s1title: 'Set up your company',
    s1sub: 'This data will appear on your emissions reports.',
    companyName: 'Company name', companyPlaceholder: 'e.g. Acme d.o.o.',
    industry: 'Industry', country: 'Country', employees: 'Number of employees',
    s2title: 'Your profile',
    s2sub: (org: string) => `Who is responsible for emissions reporting at ${org}?`,
    firstName: 'First name', lastName: 'Last name',
    firstPh: 'Jana', lastPh: 'Novak',
    continue: 'Continue', back: 'Back', finish: 'Finish setup', finishing: 'Setting up...',
    footer: 'You can change all of this later in Settings',
    terms: <>By signing up you agree to our <Link href="/terms" className="underline hover:text-gray-600">Terms</Link> and <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.</>,
  },
  SL: {
    steps: ['Podjetje', 'Vaš profil'] as string[],
    s1title: 'Nastavite vaše podjetje',
    s1sub: 'Ti podatki bodo prikazani na vaših poročilih o emisijah.',
    companyName: 'Ime podjetja', companyPlaceholder: 'npr. Acme d.o.o.',
    industry: 'Panoga', country: 'Država', employees: 'Število zaposlenih',
    s2title: 'Vaš profil',
    s2sub: (org: string) => `Kdo je odgovoren za poročanje o emisijah v ${org}?`,
    firstName: 'Ime', lastName: 'Priimek',
    firstPh: 'Jana', lastPh: 'Novak',
    continue: 'Nadaljuj', back: 'Nazaj', finish: 'Zaključi nastavitev', finishing: 'Nastavljanje...',
    footer: 'Vse to lahko pozneje spremenite v nastavitvah',
    terms: <>Z registracijo se strinjate z našimi <Link href="/terms" className="underline hover:text-gray-600">pogoji</Link> in <Link href="/privacy" className="underline hover:text-gray-600">politiko zasebnosti</Link>.</>,
  },
}

function getCookieLocale(): 'EN' | 'SL' {
  if (typeof document === 'undefined') return 'SL'
  const m = document.cookie.match(/locale=([^;]+)/)
  return m?.[1]?.toUpperCase() === 'EN' ? 'EN' : 'SL'
}

const INPUT = 'w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors'
const SELECT = 'w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors bg-white'

export default function OnboardingPage() {
  const router = useRouter()
  const [locale, setLocale] = useState<'EN' | 'SL'>('SL')
  const t = T[locale]

  const [step, setStep] = useState(1)
  const [orgName, setOrgName] = useState('')
  const [industry, setIndustry] = useState('manufacturing')
  const [country, setCountry] = useState('SI')
  const [employees, setEmployees] = useState('11-50')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setLocale(getCookieLocale()) }, [])

  function switchLocale(l: 'EN' | 'SL') {
    document.cookie = `locale=${l.toLowerCase()}; path=/; max-age=31536000`
    setLocale(l)
  }

  async function handleComplete() {
    setLoading(true); setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      await supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName } })

      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({ name: orgName, industry, country_code: country, employees_range: employees, owner_id: user.id })
        .select().single()

      if (orgErr) { setError(orgErr.message); setLoading(false); return }

      await supabase.from('reporting_periods').insert({
        organization_id: org.id, year: new Date().getFullYear(), status: 'draft'
      })

      router.push('/app/analytics')
    } catch (err: any) {
      setError(err.message); setLoading(false)
    }
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
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">

          {/* Step indicators */}
          <div className="flex items-center justify-center mb-8">
            {t.steps.map((label, i) => {
              const num = i + 1
              const done = step > num
              const active = step === num
              return (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      done ? 'bg-blue-600 text-white' :
                      active ? 'bg-blue-600 text-white' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : num}
                    </div>
                    <span className={`text-xs font-medium ${active || done ? 'text-gray-900' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                  {i < t.steps.length - 1 && (
                    <div className={`w-20 h-px mx-3 mb-5 ${step > num ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 text-center mb-1">{t.s1title}</h1>
              <p className="text-sm text-gray-400 text-center mb-8">{t.s1sub}</p>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    {t.companyName} <span className="text-red-400">*</span>
                  </label>
                  <input value={orgName} onChange={e => setOrgName(e.target.value)}
                    placeholder={t.companyPlaceholder} className={INPUT} autoFocus />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">{t.industry}</label>
                  <select value={industry} onChange={e => setIndustry(e.target.value)} className={SELECT}>
                    {INDUSTRIES[locale].map(ind => <option key={ind.value} value={ind.value}>{ind.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">{t.country}</label>
                    <select value={country} onChange={e => setCountry(e.target.value)} className={SELECT}>
                      {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">{t.employees}</label>
                    <select value={employees} onChange={e => setEmployees(e.target.value)} className={SELECT}>
                      {EMPLOYEES[locale].map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                  </div>
                </div>

                <button onClick={() => setStep(2)} disabled={!orgName.trim()}
                  className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-6">
                  {t.continue}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 text-center mb-1">{t.s2title}</h1>
              <p className="text-sm text-gray-400 text-center mb-8">{t.s2sub(orgName)}</p>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">
                      {t.firstName} <span className="text-red-400">*</span>
                    </label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)}
                      placeholder={t.firstPh} className={INPUT} autoFocus />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">
                      {t.lastName} <span className="text-red-400">*</span>
                    </label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)}
                      placeholder={t.lastPh} className={INPUT} />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex gap-2 mt-6">
                  <button onClick={() => setStep(1)}
                    className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    {t.back}
                  </button>
                  <button onClick={handleComplete}
                    disabled={loading || !firstName.trim() || !lastName.trim()}
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                        </svg>
                        {t.finishing}
                      </span>
                    ) : t.finish}
                  </button>
                </div>
              </div>
            </div>
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
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${locale === l ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
