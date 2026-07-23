'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Building2, User } from 'lucide-react'

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
    s1title: 'Set up your company', s1sub: 'This data will appear on your emissions reports.',
    companyName: 'Company name', companyPlaceholder: 'e.g. Acme d.o.o.',
    industry: 'Industry', country: 'Country', employees: 'Number of employees',
    s2title: 'Your profile', s2sub: (org: string) => `Who is responsible for emissions reporting at ${org}?`,
    firstName: 'First name', lastName: 'Last name',
    firstPh: 'Jana', lastPh: 'Novak',
    continue: 'Continue', back: 'Back', finish: 'Finish setup', finishing: 'Setting up...',
    footer: 'You can change all of this later in Settings',
  },
  SL: {
    steps: ['Podjetje', 'Vaš profil'] as string[],
    s1title: 'Nastavite vaše podjetje', s1sub: 'Ti podatki bodo prikazani na vaših poročilih o emisijah.',
    companyName: 'Ime podjetja', companyPlaceholder: 'npr. Acme d.o.o.',
    industry: 'Panoga', country: 'Država', employees: 'Število zaposlenih',
    s2title: 'Vaš profil', s2sub: (org: string) => `Kdo je odgovoren za poročanje o emisijah v ${org}?`,
    firstName: 'Ime', lastName: 'Priimek',
    firstPh: 'Jana', lastPh: 'Novak',
    continue: 'Nadaljuj', back: 'Nazaj', finish: 'Zaključi nastavitev', finishing: 'Nastavljanje...',
    footer: 'Vse to lahko pozneje spremenite v nastavitvah',
  },
}

function getCookieLocale(): 'EN' | 'SL' {
  if (typeof document === 'undefined') return 'SL'
  const m = document.cookie.match(/locale=([^;]+)/)
  return m?.[1]?.toUpperCase() === 'EN' ? 'EN' : 'SL'
}

const INPUT = 'w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] placeholder:text-gray-300 transition-shadow'
const SELECT = 'w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] transition-shadow'

export default function OnboardingPage() {
  const router = useRouter()
  const [locale, setLocale] = useState<'EN' | 'SL'>(() =>
    typeof document !== 'undefined' ? getCookieLocale() : 'SL'
  )
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

      router.push('/app/dashboard')
    } catch (err: any) {
      setError(err.message); setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <polygon points="16,4 28,10 16,16 4,10" fill="white" fillOpacity="0.95"/>
              <polygon points="4,10 16,16 16,28 4,22" fill="white" fillOpacity="0.55"/>
              <polygon points="28,10 16,16 16,28 28,22" fill="white" fillOpacity="0.75"/>
            </svg>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center mb-8">
          {[Building2, User].map((Icon, i) => {
            const num = i + 1
            const done = step > num
            const active = step === num
            return (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    done ? 'bg-green-500 text-white' :
                    active ? 'bg-blue-600 text-white shadow-md shadow-blue-200' :
                    'bg-white border-2 border-gray-200 text-gray-400'
                  }`}>
                    {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : num}
                  </div>
                  <span className={`text-xs font-semibold ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                    {t.steps[i]}
                  </span>
                </div>
                {i < 1 && <div className={`w-28 h-px mx-4 mb-5 ${step > num ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">

          {/* Step 1 */}
          {step === 1 && (
            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{t.s1title}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{t.s1sub}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.companyName} <span className="text-red-400">*</span>
                  </label>
                  <input value={orgName} onChange={e => setOrgName(e.target.value)}
                    placeholder={t.companyPlaceholder} className={INPUT} autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.industry}</label>
                  <select value={industry} onChange={e => setIndustry(e.target.value)} className={SELECT}>
                    {INDUSTRIES[locale].map(ind => <option key={ind.value} value={ind.value}>{ind.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.country}</label>
                    <select value={country} onChange={e => setCountry(e.target.value)} className={SELECT}>
                      {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.employees}</label>
                    <select value={employees} onChange={e => setEmployees(e.target.value)} className={SELECT}>
                      {EMPLOYEES[locale].map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button onClick={() => setStep(2)} disabled={!orgName.trim()}
                className="w-full mt-7 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors">
                {t.continue}
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{t.s2title}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{t.s2sub(orgName)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.firstName} <span className="text-red-400">*</span>
                  </label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder={t.firstPh} className={INPUT} autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.lastName} <span className="text-red-400">*</span>
                  </label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder={t.lastPh} className={INPUT} />
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 mt-7">
                <button onClick={() => setStep(1)}
                  className="px-5 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  {t.back}
                </button>
                <button onClick={handleComplete}
                  disabled={loading || !firstName.trim() || !lastName.trim()}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors">
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
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between px-1">
          <p className="text-xs text-gray-400">{t.footer}</p>
          <div className="flex gap-0.5">
            {(['SL', 'EN'] as const).map(l => (
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
    </div>
  )
}
