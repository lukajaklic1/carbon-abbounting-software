'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganizationStore } from '@/stores/organization'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { Check, AlertCircle, Building2, User } from 'lucide-react'

const INPUT = 'w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] placeholder:text-gray-300 transition-shadow'
const SELECT = 'w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] transition-shadow'

const INDUSTRIES = [
  { value: 'manufacturing', sl: 'Predelovalna industrija', en: 'Manufacturing' },
  { value: 'retail',        sl: 'Trgovina',                en: 'Retail & Wholesale' },
  { value: 'transport',     sl: 'Transport in logistika',  en: 'Transport & Logistics' },
  { value: 'energy',        sl: 'Energetika',              en: 'Energy & Utilities' },
  { value: 'finance',       sl: 'Finance',                 en: 'Finance & Insurance' },
  { value: 'construction',  sl: 'Gradbeništvo',            en: 'Construction' },
  { value: 'agriculture',   sl: 'Kmetijstvo',              en: 'Agriculture' },
  { value: 'hospitality',   sl: 'Gostinstvo',              en: 'Hospitality' },
  { value: 'healthcare',    sl: 'Zdravstvo',               en: 'Healthcare' },
  { value: 'it',            sl: 'Informacijska tehnologija', en: 'Information Technology' },
  { value: 'education',     sl: 'Izobraževanje',           en: 'Education' },
  { value: 'public',        sl: 'Javna uprava',            en: 'Public Administration' },
  { value: 'other',         sl: 'Drugo',                   en: 'Other' },
]

const COUNTRIES = [
  { value: 'SI', label: 'Slovenija' }, { value: 'HR', label: 'Hrvaška' },
  { value: 'AT', label: 'Avstrija' }, { value: 'DE', label: 'Nemčija' },
  { value: 'IT', label: 'Italija' },  { value: 'FR', label: 'Francija' },
  { value: 'GB', label: 'Združeno kraljestvo' }, { value: 'OTHER', label: 'Drugo' },
]

const EMPLOYEES = [
  { value: '1-10', label: '1–10' }, { value: '11-50', label: '11–50' },
  { value: '51-250', label: '51–250' }, { value: '251-1000', label: '251–1000' },
  { value: '1000+', label: '1000+' },
]

type Toast = { type: 'success' | 'error'; msg: string } | null

function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [toast, onClose])

  if (!toast) return null
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
      toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'
    }`}>
      {toast.type === 'success' ? <Check className="h-4 w-4 text-green-400 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      {toast.msg}
    </div>
  )
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-8 py-6">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { t, locale } = useLocale()
  const { organization, memberRole, setOrganization } = useOrganizationStore()
  const isAdmin = memberRole === 'admin'

  const [orgName, setOrgName] = useState('')
  const [industry, setIndustry] = useState('manufacturing')
  const [country, setCountry] = useState('SI')
  const [employees, setEmployees] = useState('11-50')
  const [savingOrg, setSavingOrg] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name ?? '')
      setIndustry(organization.industry ?? 'manufacturing')
      setCountry(organization.country_code ?? 'SI')
      setEmployees((organization as any).employees_range ?? '11-50')
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setFirstName(user.user_metadata?.first_name ?? '')
        setLastName(user.user_metadata?.last_name ?? '')
        setEmail(user.email ?? '')
      }
    })
  }, [organization])

  async function saveOrg() {
    if (!organization) return
    setSavingOrg(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('organizations')
        .update({ name: orgName, industry, country_code: country, employees_range: employees })
        .eq('id', organization.id)
      if (error) { setToast({ type: 'error', msg: error.message }); return }
      setOrganization({ ...organization, name: orgName, industry, country_code: country })
      setToast({ type: 'success', msg: t('Shranjeno!', 'Saved!') })
    } catch (err: any) { setToast({ type: 'error', msg: err.message }) }
    setSavingOrg(false)
  }

  async function saveProfile() {
    setSavingProfile(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName } })
      if (error) { setToast({ type: 'error', msg: error.message }); return }
      setToast({ type: 'success', msg: t('Shranjeno!', 'Saved!') })
    } catch (err: any) { setToast({ type: 'error', msg: err.message }) }
    setSavingProfile(false)
  }

  const disabled = (base: string) => base + (!isAdmin ? ' bg-gray-50 text-gray-400 cursor-not-allowed' : '')

  return (
    <div className="min-h-full py-10 px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('Nastavitve', 'Settings')}</h1>

        {/* Company */}
        <Card title={t('Profil podjetja', 'Company profile')} icon={Building2}>
          {!isAdmin && (
            <div className="mb-5 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2.5 rounded-xl">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {t('Nastavitve podjetja lahko spreminja samo admin.', 'Only admins can change company settings.')}
            </div>
          )}
          <div className="space-y-4">
            <Field label={t('Ime podjetja', 'Company name')}>
              <input value={orgName} onChange={e => setOrgName(e.target.value)}
                disabled={!isAdmin} className={disabled(INPUT)} />
            </Field>
            <Field label={t('Panoga', 'Industry')}>
              <select value={industry} onChange={e => setIndustry(e.target.value)}
                disabled={!isAdmin} className={disabled(SELECT)}>
                {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{locale === 'EN' ? i.en : i.sl}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('Država', 'Country')}>
                <select value={country} onChange={e => setCountry(e.target.value)}
                  disabled={!isAdmin} className={disabled(SELECT)}>
                  {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <Field label={t('Število zaposlenih', 'Employees')}>
                <select value={employees} onChange={e => setEmployees(e.target.value)}
                  disabled={!isAdmin} className={disabled(SELECT)}>
                  {EMPLOYEES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </Field>
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-1">
                <button onClick={saveOrg} disabled={savingOrg || !orgName.trim()}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-xl transition-colors">
                  {savingOrg ? t('Shranjevanje...', 'Saving...') : t('Shrani', 'Save')}
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Profile */}
        <Card title={t('Vaš profil', 'Your profile')} icon={User}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('Ime', 'First name')}>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jana" className={INPUT} />
              </Field>
              <Field label={t('Priimek', 'Last name')}>
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Novak" className={INPUT} />
              </Field>
            </div>
            <Field label="Email">
              <input value={email} disabled className={INPUT + ' bg-gray-50 text-gray-400 cursor-not-allowed'} />
            </Field>

            <div className="flex justify-end pt-1">
              <button onClick={saveProfile} disabled={savingProfile}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-xl transition-colors">
                {savingProfile ? t('Shranjevanje...', 'Saving...') : t('Shrani', 'Save')}
              </button>
            </div>
          </div>
        </Card>
      </div>
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
