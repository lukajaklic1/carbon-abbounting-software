'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, Check, Clock, FileText, X, Download, Lock } from 'lucide-react'
import { useOrganizationStore } from '@/stores/organization'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { useParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const SCOPE3_CATEGORIES = [
  { number: 1,  label_sl: 'Nabavljeno blago in storitve',         label_en: 'Purchased Goods & Services',              desc_sl: 'Emisije pri proizvodnji kupljenih materialov in storitev',         desc_en: 'Emissions from production of purchased materials and services' },
  { number: 2,  label_sl: 'Kapitalsko blago',                     label_en: 'Capital Goods',                           desc_sl: 'Emisije pri proizvodnji kupljene opreme in infrastrukture',        desc_en: 'Emissions from production of purchased capital equipment' },
  { number: 3,  label_sl: 'Gorivo in energija (posredno)',        label_en: 'Fuel & Energy Related Activities',        desc_sl: 'Emisije pri pridobivanju goriv in energije (ni obseg 1/2)',        desc_en: 'Upstream emissions from fuels and energy not in Scope 1/2' },
  { number: 4,  label_sl: 'Vhodni transport in distribucija',     label_en: 'Upstream Transport & Distribution',       desc_sl: 'Emisije pri prevozu blaga do vaše organizacije',                  desc_en: 'Emissions from transport of goods to your organization' },
  { number: 5,  label_sl: 'Odpadki iz poslovanja',                label_en: 'Waste Generated in Operations',           desc_sl: 'Emisije pri odlaganju in obdelavi odpadkov',                      desc_en: 'Emissions from disposal and treatment of operational waste' },
  { number: 6,  label_sl: 'Poslovna potovanja',                   label_en: 'Business Travel',                         desc_sl: 'Emisije pri potovanjih zaposlenih (letala, vlaki, hoteli…)',      desc_en: 'Emissions from employee business travel' },
  { number: 7,  label_sl: 'Prevoz zaposlenih na delo',            label_en: 'Employee Commuting',                      desc_sl: 'Emisije pri vsakodnevnih potovanjih zaposlenih',                  desc_en: 'Emissions from employee commuting to work' },
  { number: 8,  label_sl: 'Najeta sredstva (vhodna)',             label_en: 'Upstream Leased Assets',                  desc_sl: 'Emisije iz sredstev, ki jih najema vaša organizacija',            desc_en: 'Emissions from assets leased by your organization' },
  { number: 9,  label_sl: 'Izhodni transport in distribucija',    label_en: 'Downstream Transport & Distribution',    desc_sl: 'Emisije pri prevozu prodanih izdelkov do kupcev',                 desc_en: 'Emissions from transport of sold products to customers' },
  { number: 10, label_sl: 'Predelava prodanih izdelkov',          label_en: 'Processing of Sold Products',             desc_sl: 'Emisije pri nadaljnji predelavi vaših prodanih izdelkov',         desc_en: 'Emissions from further processing of your sold products' },
  { number: 11, label_sl: 'Uporaba prodanih izdelkov',            label_en: 'Use of Sold Products',                    desc_sl: 'Emisije pri uporabi vaših izdelkov pri kupcih',                   desc_en: 'Emissions from customers using your products' },
  { number: 12, label_sl: 'Odlaganje prodanih izdelkov',          label_en: 'End of Life Treatment',                   desc_sl: 'Emisije pri odlaganju vaših izdelkov po koncu življenjske dobe', desc_en: 'Emissions from disposal of your products at end of life' },
  { number: 13, label_sl: 'Najeta sredstva (izhodna)',            label_en: 'Downstream Leased Assets',                desc_sl: 'Emisije iz sredstev, ki jih oddajate v najem',                    desc_en: 'Emissions from assets leased out to others' },
  { number: 14, label_sl: 'Franšize',                             label_en: 'Franchises',                              desc_sl: 'Emisije pri poslovanju franšiznih partnerjev',                    desc_en: 'Emissions from franchise operations' },
  { number: 15, label_sl: 'Naložbe',                              label_en: 'Investments',                             desc_sl: 'Emisije pri financiranih podjetjih in projektih',                 desc_en: 'Emissions from financed companies and projects' },
]

type Submission = {
  id: string
  category_number: number
  status: 'in_review' | 'done'
  file_name: string | null
  file_url: string | null
  co2e_kg: number | null
}

type ModalState = {
  catNumber: number
  catLabel: string
  existing: Submission | null
  selectedFile: File | null
  uploading: boolean
  error: string | null
}

export default function Scope3Page() {
  const { t } = useLocale()
  const params = useParams()
  const year = Number(params.year)
  const { organization } = useOrganizationStore()
  const isPaid = organization?.is_active ?? false

  const [submissions, setSubmissions] = useState<Record<number, Submission>>({})
  const [deleting, setDeleting] = useState<Set<number>>(new Set())
  const [orgId, setOrgId] = useState<string | null>(null)
  const [periodId, setPeriodId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [upgradeToast, setUpgradeToast] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (year) load() }, [year])

  async function load() {
    setLoading(true)
    setLoadError(null)
    try {
      const supabase = createClient()
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) { setLoadError('Ni prijave'); setLoading(false); return }

      const { data: org, error: orgErr } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (orgErr || !org) { setLoadError(`Org ni najdena: ${orgErr?.message}`); setLoading(false); return }
      setOrgId(org.id)

      const { data: pd, error: pdErr } = await supabase.from('reporting_periods').select('id').eq('organization_id', org.id).eq('year', year).single()
      if (pdErr || !pd) { setLoadError(`Obdobje ${year} ne obstaja: ${pdErr?.message}`); setLoading(false); return }
      setPeriodId(pd.id)

      const { data: subs, error: subsErr } = await supabase.from('scope3_submissions')
        .select('*').eq('organization_id', org.id).eq('reporting_period_id', pd.id)
      if (subsErr) { setLoadError(`Napaka pri nalaganju: ${subsErr.message}`); setLoading(false); return }

      const map: Record<number, Submission> = {}
      if (subs) subs.forEach((s: Submission) => { map[s.category_number] = s })
      setSubmissions(map)
    } catch (e: any) { setLoadError(String(e)) }
    setLoading(false)
  }

  function openModal(cat: typeof SCOPE3_CATEGORIES[0]) {
    setModal({
      catNumber: cat.number,
      catLabel: t(cat.label_sl, cat.label_en),
      existing: submissions[cat.number] ?? null,
      selectedFile: null,
      uploading: false,
      error: null,
    })
  }

  function handleModalFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !modal) return
    e.target.value = ''
    setModal(m => m ? { ...m, selectedFile: file, error: null } : m)
  }

  async function handleSubmit() {
    if (!modal?.selectedFile || !orgId || !periodId) return
    setModal(m => m ? { ...m, uploading: true, error: null } : m)

    try {
      const supabase = createClient()
      const file = modal.selectedFile
      const catNum = modal.catNumber
      const path = `${orgId}/${year}/cat_${catNum}/${Date.now()}_${file.name}`

      const { error: uploadErr } = await supabase.storage.from('scope3-uploads').upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('scope3-uploads').getPublicUrl(path)

      const existing = modal.existing
      if (existing) {
        // Delete old file from storage before replacing
        if (existing.file_url) {
          try {
            const oldUrl = new URL(existing.file_url)
            const oldPath = oldUrl.pathname.split('/object/public/scope3-uploads/')[1]
            if (oldPath) await supabase.storage.from('scope3-uploads').remove([decodeURIComponent(oldPath)])
          } catch {}
        }
        const { error: updErr } = await supabase.from('scope3_submissions').update({
          file_url: publicUrl, file_name: file.name, status: 'in_review', updated_at: new Date().toISOString()
        }).eq('id', existing.id)
        if (updErr) throw updErr
      } else {
        const { error: insErr } = await supabase.from('scope3_submissions').insert({
          organization_id: orgId, reporting_period_id: periodId,
          category_number: catNum, status: 'in_review',
          file_url: publicUrl, file_name: file.name,
        })
        if (insErr) throw insErr
      }

      setModal(null)
      await load()
    } catch (err: any) {
      setModal(m => m ? { ...m, uploading: false, error: err.message ?? String(err) } : m)
    }
  }

  async function handleDelete(catNum: number) {
    const sub = submissions[catNum]
    if (!sub) return
    setDeleting(prev => new Set(prev).add(catNum))
    try {
      const supabase = createClient()
      await supabase.from('scope3_submissions').delete().eq('id', sub.id)
      if (sub.file_url) {
        const url = new URL(sub.file_url)
        const pathParts = url.pathname.split('/object/public/scope3-uploads/')
        if (pathParts[1]) await supabase.storage.from('scope3-uploads').remove([decodeURIComponent(pathParts[1])])
      }
      await load()
    } catch (err) { console.error(err) }
    setDeleting(prev => { const n = new Set(prev); n.delete(catNum); return n })
  }

  const totalCo2e = Object.values(submissions).reduce((s, sub) => s + (sub.co2e_kg ?? 0), 0)
  const doneCount = Object.values(submissions).filter(s => s.status === 'done').length
  const inReviewCount = Object.values(submissions).filter(s => s.status === 'in_review').length

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 border-b border-gray-200 h-[57px] shrink-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 shrink-0">{t('Obseg 3', 'Scope 3')}</h1>
          <p className="text-sm text-gray-500 truncate">{t('Posredne emisije vrednostne verige.', 'Value chain indirect emissions.')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-2 h-9 px-4 bg-white border border-gray-200 rounded-xl text-sm">
            <span className="font-medium text-gray-900">{(totalCo2e / 1000).toFixed(2).replace('.', ',')} tCO₂e</span>
          </div>
          <div className="inline-flex items-center gap-2 h-9 px-4 bg-white border border-gray-200 rounded-xl text-sm">
            <span className="text-gray-500">{t('Zaključeno', 'Completed')}</span>
            <span className="font-medium text-gray-900">{doneCount} / 15</span>
          </div>
          <div className="inline-flex items-center gap-2 h-9 px-4 bg-white border border-gray-200 rounded-xl text-sm">
            <span className="text-gray-500">{t('V pregledu', 'In review')}</span>
            <span className="font-medium text-gray-900">{inReviewCount}</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-6">

      {loadError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{loadError}</div>
      )}

      {/* Categories */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-sm text-gray-500">{t('Nalaganje...', 'Loading...')}</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {SCOPE3_CATEGORIES.map((cat, i) => {
            const sub = submissions[cat.number]
            const isDone = sub?.status === 'done'
            const isInReview = sub?.status === 'in_review'

            return (
              <div key={cat.number} className={cn('flex items-center gap-4 px-5 py-3.5', i !== 0 && 'border-t border-gray-100', 'hover:bg-gray-50/50 transition-colors')}>
                {/* Number */}
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold',
                  isDone ? 'bg-gray-100 text-gray-700' : isInReview ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'
                )}>
                  {cat.number}
                </div>

                {/* Name + file inline */}
                <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 shrink-0">{t(cat.label_sl, cat.label_en)}</p>
                  {sub?.file_name && (
                    <a href={sub.file_url ?? '#'} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors shrink min-w-0 max-w-[200px]">
                      <Download className="h-3 w-3 shrink-0" />
                      <span className="text-xs font-medium truncate">{sub.file_name}</span>
                    </a>
                  )}
                </div>

                {/* CO2e value */}
                {isDone && sub?.co2e_kg != null ? (
                  <span className="text-sm font-medium text-gray-900 shrink-0 tabular-nums">
                    {(sub.co2e_kg / 1000).toFixed(2).replace('.', ',')}
                    <span className="text-xs font-normal text-gray-500 ml-1">tCO₂e</span>
                  </span>
                ) : sub ? (
                  <span className="text-sm text-gray-300 shrink-0 tabular-nums">— tCO₂e</span>
                ) : null}

                {/* Badge */}
                <div className="shrink-0">
                  {isDone && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                      <Check className="h-3 w-3" />
                      {t('Zaključeno', 'Done')}
                    </span>
                  )}
                  {isInReview && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="h-3 w-3" />
                      {t('V pregledu', 'In review')}
                    </span>
                  )}
                </div>

                {/* Upload button */}
                {!sub && (
                  isPaid ? (
                    <button
                      onClick={() => openModal(cat)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {t('Naloži podatke', 'Upload data')}
                    </button>
                  ) : (
                    <button
                      onClick={() => { setUpgradeToast(true); setTimeout(() => setUpgradeToast(false), 4000) }}
                      className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0 border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      {t('Nadgradi za nalaganje', 'Upgrade to upload')}
                    </button>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{t('Kategorija', 'Category')} {modal.catNumber}</p>
                <h2 className="text-base font-semibold text-gray-900">{modal.catLabel}</h2>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5">
              {modal.selectedFile ? (
                <div className="border-2 border-dashed border-green-300 bg-gray-50 rounded-xl p-6 text-center">
                  <FileText className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 mb-0.5">{modal.selectedFile.name}</p>
                  <p className="text-xs text-gray-500 mb-4">{(modal.selectedFile.size / 1024).toFixed(0)} KB</p>
                  <div className="flex items-center justify-center gap-2">
                    <button type="button" onClick={() => modalFileRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                      {t('Zamenjaj datoteko', 'Replace file')}
                    </button>
                    <button type="button" onClick={() => setModal(m => m ? { ...m, selectedFile: null } : m)}
                      className="px-3 py-1.5 text-xs font-medium bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                      {t('Odstrani', 'Remove')}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => modalFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-gray-50 rounded-xl p-8 text-center transition-colors">
                  <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">{t('Kliknite za izbiro datoteke', 'Click to select file')}</p>
                  <p className="text-xs text-gray-400 mt-1">Excel, CSV, PDF · max 50 MB</p>
                </button>
              )}

              {modal.existing?.file_name && (
                <div className="mt-3 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-500 truncate">{t('Obstoječa', 'Existing')}: {modal.existing.file_name}</span>
                  </div>
                  <a href={modal.existing.file_url ?? '#'} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gray-700 hover:underline shrink-0 ml-2">
                    {t('Prenesi', 'Download')}
                  </a>
                </div>
              )}

              {modal.error && (
                <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{modal.error}</p>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-0">
              <button onClick={() => setModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                {t('Prekliči', 'Cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!modal.selectedFile || modal.uploading}
                className={cn(
                  'px-5 py-2 text-sm font-medium rounded-lg transition-colors',
                  !modal.selectedFile || modal.uploading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                {modal.uploading ? t('Pošiljanje...', 'Submitting...') : t('Pošlji v pregled', 'Submit for Review')}
              </button>
            </div>
          </div>

          <input ref={modalFileRef} type="file" accept=".xlsx,.xls,.csv,.pdf" className="hidden" onChange={handleModalFileSelect} />
        </div>
      )}
      </div>

      {/* Upgrade toast */}
      {upgradeToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-400" />
          {t('Zahteva za nadgradnjo je bila poslana.', 'Upgrade request sent.')}
        </div>
      )}
    </div>
  )
}
