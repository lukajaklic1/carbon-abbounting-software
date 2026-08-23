'use client'

import { useState, useEffect } from 'react'
import { Wind, Plus, X, Leaf, Check, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { getCoolingFactors, calcCo2eKg } from '@/lib/emission-factors'
import { useParams } from 'next/navigation'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useEmissionCountersStore } from '@/stores/emissionCounters'
import { parseQty, fmtQty } from '@/lib/utils/format'

const PAGE_SIZE = 20
const INPUT = 'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] placeholder:text-gray-300 transition-shadow'
const SELECT = 'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] transition-shadow'

const COOLING_KEYS = Object.keys(getCoolingFactors(2024))
const EMPTY_FORM = { kwh: '', method: 'air_cooled' }
type EntryForm = typeof EMPTY_FORM

export default function Scope2CoolingPage() {
  const { t } = useLocale()
  const params = useParams()
  const year = Number(params.year)
  const COOLING_FACTORS = getCoolingFactors(year)
  const refreshCounters = useEmissionCountersStore(s => s.refresh)

  const [locations, setLocations] = useState<any[]>([])
  const [entriesMap, setEntriesMap] = useState<Record<string, any>>({})
  const [period, setPeriod] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeLocation, setActiveLocation] = useState<any>(null)
  const [form, setForm] = useState<EntryForm>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => { if (year) load() }, [year])

  async function load() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return
      const [{ data: pd }, { data: locs }, { data: ents }] = await Promise.all([
        supabase.from('reporting_periods').select('*').eq('organization_id', org.id).eq('year', year).single(),
        supabase.from('locations').select('id, name, address').eq('organization_id', org.id).eq('is_active', true).eq('uses_cooling', true).order('name'),
        supabase.from('scope2_cooling').select('*').eq('organization_id', org.id),
      ])
      setPeriod(pd)
      setLocations(locs ?? [])
      const map: Record<string, any> = {}
      if (pd && ents) ents.filter((e: any) => e.reporting_period_id === pd.id).forEach((e: any) => { map[e.location_id] = e })
      setEntriesMap(map)
    } catch {}
    setLoading(false)
  }

  function openAdd(loc: any) {
    setForm({ kwh: '', method: 'air_cooled' })
    setActiveLocation(loc); setError(''); setShowModal(true)
  }

  function openEdit(loc: any) {
    const e = entriesMap[loc.id]
    setForm({ kwh: fmtQty(e.quantity ?? 0), method: e.method ?? 'air_cooled' })
    setActiveLocation(loc); setError(''); setShowModal(true)
  }

  function co2ePreview(): number | null {
    const kwh = parseQty(form.kwh)
    const cf = COOLING_FACTORS[form.method]
    if (!kwh || !cf) return null
    return calcCo2eKg(kwh, cf.factor)
  }

  async function handleSave() {
    const kwh = parseQty(form.kwh)
    if (isNaN(kwh) || kwh < 0) { setError(t('Vnesite veljavno količino kWh.', 'Enter a valid kWh quantity.')); return }
    if (!period) { setError('Poročevalsko obdobje ni najdeno.'); return }
    const cf = COOLING_FACTORS[form.method]
    const co2e_kg = cf ? calcCo2eKg(kwh, cf.factor) : 0
    setSaving(true); setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return
      const payload = {
        location_id: activeLocation.id, quantity: kwh, unit: 'kWh',
        method: form.method, co2e_kg, factor_kg_co2e_per_kwh: cf?.factor ?? null,

        organization_id: org.id, reporting_period_id: period.id,
      }
      const existing = entriesMap[activeLocation.id]
      const { error: dbErr } = existing
        ? await supabase.from('scope2_cooling').update(payload).eq('id', existing.id)
        : await supabase.from('scope2_cooling').insert(payload)
      if (dbErr) { setError(dbErr.message); setSaving(false); return }
      await load(); refreshCounters(year); setShowModal(false)
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    const entry = entriesMap[confirmDelete]
    if (!entry) { setConfirmDelete(null); return }
    const supabase = createClient()
    await supabase.from('scope2_cooling').delete().eq('id', entry.id)
    setEntriesMap(prev => { const n = { ...prev }; delete n[confirmDelete!]; return n })
    setConfirmDelete(null); refreshCounters(year)
  }

  const f = (key: keyof EntryForm, val: any) => setForm(prev => ({ ...prev, [key]: val }))
  const preview = co2ePreview()
  const totalCo2e = Object.values(entriesMap).reduce((s: number, e: any) => s + (e.co2e_kg ?? 0), 0)
  const done = Object.keys(entriesMap).length
  const total = locations.length
  const paginated = locations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 border-b border-gray-200 min-h-[57px] py-3 sm:h-[57px] sm:py-0 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">{t('Hlajenje – lokacije', 'Purchased Cooling – locations')}</h1>
      </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-2 h-9 px-4 bg-white border border-gray-200 rounded-xl text-sm">
            <span className="font-medium text-gray-900">{(totalCo2e / 1000).toFixed(2).replace('.', ',')} tCO₂e</span>
          </div>
          <div className="inline-flex items-center gap-2 h-9 px-4 bg-white border border-gray-200 rounded-xl text-sm gap-2">
            <span className="text-gray-500">{t('Vneseno', 'Entered')}</span>
            <span className="font-medium text-gray-900">{done} / {total}</span>
          </div>
        </div>
      </div>
            <div className="flex-1 overflow-auto">
      {loading ? (
        <div className="p-12 text-center text-sm text-gray-500">{t('Nalaganje...', 'Loading...')}</div>
      ) : !locations.length ? (
        <EmptyState icon={Wind} title={t('Ni lokacij z daljinskim hlajenjem', 'No locations with purchased cooling')} subtitle={t('Dodajte lokacijo, ki uporablja daljinsko hlajenje.', 'Add a location that uses district cooling.')} />
      ) : (
        <>
            <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Lokacija', 'Location')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Metoda', 'Method')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Letna poraba', 'Annual consumption')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Emisije', 'Emissions')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Status', 'Status')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((loc, i) => {
                const entry = entriesMap[loc.id]
                return (
                  <tr key={loc.id} className={`hover:bg-gray-50 transition-colors ${i !== 0 ? 'border-t border-gray-200' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{backgroundColor:'#e5eeff',border:'1px solid #d6e5ff'}}>
                          <Building2 className="h-3.5 w-3.5" style={{color:'#215bcf'}} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">{loc.name}</p>
                          {loc.address && <p className="text-xs text-gray-400 mt-0.5">{loc.address}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{entry ? t(COOLING_FACTORS[entry.method]?.label_sl ?? entry.method, COOLING_FACTORS[entry.method]?.label_en ?? entry.method) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-700">{entry ? `${fmtQty(entry.quantity)} kWh` : <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5">{entry ? <span className="text-xs font-medium text-gray-500">{(entry.co2e_kg / 1000).toFixed(2).replace('.', ',')} tCO₂e</span> : <span className="text-gray-300 text-sm">—</span>}</td>
                    <td className="px-5 py-3.5">
                      {entry ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-900"><span className="w-1.5 h-1.5 rounded-full bg-gray-1000" />{t('Podatki vneseni', 'Data entered')}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{t('Potreben je vnos podatkov', 'Data entry required')}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        {entry ? (
                          <button onClick={() => openEdit(loc)} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            {t('Uredi podatke o emisijah', 'Edit emission data')}
                          </button>
                        ) : (
                          <button onClick={() => openAdd(loc)} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-900 hover:text-gray-900 px-3 py-1.5 bg-gray-100 hover:bg-[#d4eddf] rounded-lg transition-colors">
                            <Plus className="h-3 w-3" />{t('Dodaj emisije', 'Add emission data')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
            </div>
            <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} totalItems={total} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
      )}

      </div>
      <ConfirmDialog
        open={!!confirmDelete}
        title={t('Izbriši vnos', 'Delete entry')}
        message={t('Podatki o emisijah bodo trajno izbrisani.', 'Emission data will be permanently deleted.')}
        confirmLabel={t('Izbriši', 'Delete')}
        cancelLabel={t('Prekliči', 'Cancel')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {showModal && activeLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{entriesMap[activeLocation.id] ? t('Uredi vnos', 'Edit entry') : t('Dodaj porabo', 'Add consumption')}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Metoda hlajenja', 'Cooling method')}</label>
                <select value={form.method} onChange={e => f('method', e.target.value)} className={SELECT}>
                  {COOLING_KEYS.map(k => <option key={k} value={k}>{t(COOLING_FACTORS[k].label_sl, COOLING_FACTORS[k].label_en)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Letna poraba hlajenja', 'Annual cooling consumption')} <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <input value={form.kwh} onChange={e => f('kwh', e.target.value)} onBlur={e => f('kwh', fmtQty(e.target.value))} type="text" inputMode="decimal" placeholder="0" className={INPUT} autoFocus />
                  <div className="w-12 px-2 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500 flex items-center justify-center shrink-0 font-medium">kWh</div>
                </div>
              </div>
              {preview !== null && (
                <div className="bg-gray-100 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-3">
                  <Leaf className="h-4 w-4 text-gray-900 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-900">{t('Izračunane emisije', 'Calculated emissions')}</p>
                    <p className="text-base font-bold text-green-800">{(preview / 1000).toFixed(2).replace('.', ',')} tCO₂e</p>
                  </div>
                </div>
              )}
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-2xl">
              {entriesMap[activeLocation.id] && (
                <button onClick={() => { setShowModal(false); setConfirmDelete(activeLocation.id) }}
                  className="px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors">
                  {t('Izbriši podatke o porabi', 'Delete usage data')}
                </button>
              )}
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">{t('Prekliči', 'Cancel')}</button>
              <button onClick={handleSave} disabled={saving || !form.kwh || parseQty(form.kwh) < 0}
                className="flex-[2] px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed rounded-xl transition-colors">
                {saving ? t('Shranjevanje...', 'Saving...') : entriesMap[activeLocation.id] ? t('Shrani', 'Save') : t('Dodaj vnos', 'Add entry')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
