'use client'

import { useState, useEffect } from 'react'
import { Building2, Plus, Pencil, X, Leaf, Check, Settings2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { getFuelFactors, calcCo2eKg } from '@/lib/emission-factors'
import { useParams } from 'next/navigation'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useEmissionCountersStore } from '@/stores/emissionCounters'
import { parseQty, fmtQty } from '@/lib/utils/format'

const PAGE_SIZE = 20
const INPUT = 'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] placeholder:text-gray-300 transition-shadow'
const SELECT = 'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] transition-shadow'

const STATIONARY_FUELS = ['natural_gas', 'heating_oil', 'lpg', 'diesel', 'wood_chips'] as const
const EMPTY_FORM = { fuel_type: 'natural_gas', quantity: '' }
type EntryForm = typeof EMPTY_FORM

export default function Scope1StationaryPage() {
  const { t } = useLocale()
  const params = useParams()
  const year = Number(params.year)
  const FUEL_FACTORS = getFuelFactors(year)
  const refreshCounters = useEmissionCountersStore(s => s.refresh)

  const [allLocations, setAllLocations] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [periodLocMap, setPeriodLocMap] = useState<Record<string, string>>({})
  const [orgId, setOrgId] = useState<string | null>(null)
  const [showSelect, setShowSelect] = useState(false)
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set())
  const [selectSaving, setSelectSaving] = useState(false)
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

  function openSelect() { setDraftIds(new Set(selectedIds)); setShowSelect(true) }
  function toggleDraft(id: string) {
    if (draftIds.has(id) && entriesMap[id]) return
    setDraftIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  async function saveSelection() {
    if (!period || !orgId) return
    setSelectSaving(true)
    const sup = createClient()
    const toAdd = [...draftIds].filter(id => !selectedIds.has(id))
    const toRemove = [...selectedIds].filter(id => !draftIds.has(id))
    if (toAdd.length) await sup.from('period_locations').insert(toAdd.map(location_id => ({ reporting_period_id: period.id, location_id, organization_id: orgId, scope_type: 'stationary' })))
    if (toRemove.length) { const ids = toRemove.map(id => periodLocMap[id]).filter(Boolean); if (ids.length) await sup.from('period_locations').delete().in('id', ids) }
    await load(); refreshCounters(year); setSelectSaving(false); setShowSelect(false)
  }

  async function load() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return

      const [{ data: pd }, { data: locs }, { data: plRows }, { data: ents }] = await Promise.all([
        supabase.from('reporting_periods').select('*').eq('organization_id', org.id).eq('year', year).single(),
        supabase.from('locations').select('id, name, address').eq('organization_id', org.id).eq('is_active', true).eq('uses_natural_gas', true).order('name'),
        supabase.from('period_locations').select('id, location_id, reporting_period_id').eq('organization_id', org.id).eq('scope_type', 'stationary'),
        supabase.from('scope1_stationary').select('*').eq('organization_id', org.id),
      ])

      setOrgId(org.id)
      setPeriod(pd)
      setAllLocations(locs ?? [])
      const thisPl = (plRows ?? []).filter((r: any) => r.reporting_period_id === pd?.id)
      const plMap: Record<string, string> = {}
      thisPl.forEach((r: any) => { plMap[r.location_id] = r.id })
      setPeriodLocMap(plMap)
      setSelectedIds(new Set(Object.keys(plMap)))
      const map: Record<string, any> = {}
      if (pd && ents) ents.filter((e: any) => e.reporting_period_id === pd.id).forEach((e: any) => { map[e.location_id] = e })
      setEntriesMap(map)
    } catch {}
    setLoading(false)
  }

  function openAdd(location: any) {
    setForm({ fuel_type: 'natural_gas', quantity: '' })
    setActiveLocation(location); setError(''); setShowModal(true)
  }

  function openEdit(location: any) {
    const e = entriesMap[location.id]
    setForm({ fuel_type: e.fuel_type ?? 'natural_gas', quantity: fmtQty(e.quantity ?? 0) })
    setActiveLocation(location); setError(''); setShowModal(true)
  }

  function co2ePreview(): number | null {
    const qty = parseQty(form.quantity)
    const ff = FUEL_FACTORS[form.fuel_type]
    if (!qty || !ff) return null
    return calcCo2eKg(qty, ff.factor)
  }

  async function handleSave() {
    const qty = parseQty(form.quantity)
    if (isNaN(qty) || qty < 0) { setError(t('Vnesite veljavno količino.', 'Enter a valid quantity.')); return }
    if (!period) { setError('Poročevalsko obdobje ni najdeno.'); return }
    const ff = FUEL_FACTORS[form.fuel_type]
    const co2e_kg = ff ? calcCo2eKg(qty, ff.factor) : 0
    setSaving(true); setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return
      const unit = FUEL_FACTORS[form.fuel_type]?.unit ?? 'L'
      const payload = {
        location_id: activeLocation.id, fuel_type: form.fuel_type, quantity: qty, unit,
        co2e_kg, factor_kg_co2e_per_unit: ff?.factor ?? null,

        organization_id: org.id, reporting_period_id: period.id,
      }
      const existing = entriesMap[activeLocation.id]
      const { error: dbErr } = existing
        ? await supabase.from('scope1_stationary').update(payload).eq('id', existing.id)
        : await supabase.from('scope1_stationary').insert(payload)
      if (dbErr) { setError(dbErr.message); setSaving(false); return }
      await load()
      refreshCounters(year)
      setShowModal(false)
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    const entry = entriesMap[confirmDelete]
    if (!entry) { setConfirmDelete(null); return }
    const supabase = createClient()
    await supabase.from('scope1_stationary').delete().eq('id', entry.id)
    setEntriesMap(prev => { const n = { ...prev }; delete n[confirmDelete]; return n })
    setConfirmDelete(null)
    refreshCounters(year)
  }

  const f = (key: keyof EntryForm, val: any) => setForm(prev => ({ ...prev, [key]: val }))
  const preview = co2ePreview()
  const reportLocations = allLocations.filter(l => selectedIds.has(l.id))
  const totalCo2e = reportLocations.reduce((s: number, l: any) => s + (entriesMap[l.id]?.co2e_kg ?? 0), 0)
  const done = reportLocations.filter(l => entriesMap[l.id]).length
  const total = reportLocations.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const paginated = reportLocations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 border-b border-gray-200 min-h-[57px] py-3 sm:h-[57px] sm:py-0 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">{t('Stacionarno zgorevanje – lokacije', 'Stationary combustion – locations')}</h1>
      </div>
        <div className="flex items-center gap-2 shrink-0">
          {total > 0 && <>
            <div className="inline-flex items-center gap-2 h-9 px-4 bg-white border border-gray-200 rounded-xl text-sm">
              <span className="font-medium text-gray-900">{(totalCo2e / 1000).toFixed(2).replace('.', ',')} tCO₂e</span>
            </div>
            <div className="inline-flex items-center gap-2 h-9 px-4 bg-white border border-gray-200 rounded-xl text-sm">
              <span className="text-gray-500">{t('Vneseno', 'Entered')}</span>
              <span className="font-medium text-gray-900">{done} / {total}</span>
            </div>
          </>}
          <button onClick={openSelect} className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#215bcf] hover:bg-[#1a4ab5] rounded-xl text-sm font-medium text-white transition-colors">
            <Settings2 className="h-3.5 w-3.5" />
            {t('Izberi lokacije', 'Select locations')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
      {loading ? (
        <div className="p-12 text-center text-sm text-gray-500">{t('Nalaganje...', 'Loading...')}</div>
      ) : allLocations.length === 0 ? (
        <EmptyState icon={Building2} title={t('Ni aktivnih lokacij', 'No active locations')} subtitle={t('Dodajte lokacijo, ki uporablja zemeljski plin.', 'Add a location that uses natural gas.')} />
      ) : reportLocations.length === 0 ? (
        <EmptyState icon={Settings2} title={t('Ni izbranih lokacij', 'No locations selected')} subtitle={t('Kliknite »Izberi lokacije« da dodate lokacije v poročilo.', 'Click "Select locations" to add locations to the report.')} />
      ) : (
        <>
            <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Lokacija', 'Location')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Gorivo', 'Fuel')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Letna poraba', 'Annual consumption')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Emisije', 'Emissions')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Status', 'Status')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 border-b border-gray-200">
              {paginated.map((loc, i) => {
                const entry = entriesMap[loc.id]
                return (
                  <tr key={loc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{backgroundColor:'#e5eeff',border:'1px solid #d6e5ff'}}>
                          <Building2 className="h-3.5 w-3.5" style={{color:'#215bcf'}} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">{loc.name}</p>
                          {loc.address && <p className="text-sm text-gray-500">{loc.address}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">
                      {entry ? t(FUEL_FACTORS[entry.fuel_type]?.label_sl ?? entry.fuel_type, FUEL_FACTORS[entry.fuel_type]?.label_en ?? entry.fuel_type) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
                      {entry ? `${fmtQty(entry.quantity)} ${entry.unit}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {entry
                        ? <span className="text-xs font-medium text-gray-500">{(entry.co2e_kg / 1000).toFixed(2).replace('.', ',')} tCO₂e</span>
                        : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {entry ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{backgroundColor:'#e0fced',border:'1px solid #d4f8e6',color:'#098259'}}>{t('Podatki vneseni', 'Data entered')}
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{backgroundColor:'#fff3bf',border:'1px solid #ffe066',color:'#e67700'}}>{t('Potreben je vnos podatkov', 'Data entry required')}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        {entry ? (
                          <button onClick={() => openEdit(loc)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            {t('Uredi podatke o emisijah', 'Edit emission data')}
                          </button>
                        ) : (
                          <button onClick={() => openAdd(loc)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-900 hover:text-gray-900 px-3 py-1.5 bg-gray-100 hover:bg-[#d4eddf] rounded-lg transition-colors">
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
            <Pagination page={page} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
      )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title={t('Izbriši vnos', 'Delete entry')}
        message={t('Podatki o emisijah bodo trajno izbrisani. Tega dejanja ni mogoče razveljaviti.', 'Emission data will be permanently deleted. This action cannot be undone.')}
        confirmLabel={t('Izbriši', 'Delete')}
        cancelLabel={t('Prekliči', 'Cancel')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      {showSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSelect(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">{t('Izberi lokacije', 'Select locations')}</h2>
              <button onClick={() => setShowSelect(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5">
              {allLocations.length === 0 ? (
                <p className="px-6 py-8 text-sm text-center text-gray-500">{t('Ni lokacij.', 'No locations.')}</p>
              ) : allLocations.map(loc => {
                const checked = draftIds.has(loc.id)
                const hasData = !!entriesMap[loc.id]
                const locked = checked && hasData
                return (
                  <div key={loc.id} className="rounded-xl border transition-all overflow-hidden" style={{ borderColor: checked ? '#215bcf' : '#e5e7eb' }}>
                    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer" style={{ backgroundColor: checked ? '#f0f5ff' : '#fff' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleDraft(loc.id)} disabled={locked} className="w-4 h-4 rounded border-gray-300 accent-[#215bcf] cursor-pointer shrink-0 disabled:cursor-not-allowed" />
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border" style={{ backgroundColor: checked ? '#e5eeff' : '#f3f4f6', borderColor: checked ? '#c7d9ff' : '#e5e7eb' }}>
                        <Building2 className={`w-3.5 h-3.5 ${checked ? 'text-[#215bcf]' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{loc.name}</p>
                        {loc.address && <p className="text-xs text-gray-500 truncate">{loc.address}</p>}
                      </div>
                    </label>
                    {locked && (
                      <div className="px-4 py-2 border-t flex items-center gap-1.5" style={{ borderColor: '#dbeafe', backgroundColor: '#eff6ff' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#215bcf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <p className="text-xs text-[#215bcf]">{t('Lokacija ima vnesene emisije. Najprej izbrišite podatke o emisijah.', 'Location has emission data. Delete it first.')}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">{draftIds.size} {t('izbranih', 'selected')}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowSelect(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">{t('Prekliči', 'Cancel')}</button>
                <button onClick={saveSelection} disabled={selectSaving} className="px-4 py-2 text-sm font-semibold text-white bg-[#215bcf] hover:bg-[#1a4ab5] disabled:opacity-60 rounded-xl">{selectSaving ? t('Shranjevanje...', 'Saving...') : t('Potrdi', 'Confirm')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
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
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Vrsta goriva', 'Fuel type')}</label>
                <select value={form.fuel_type} onChange={e => f('fuel_type', e.target.value)} className={SELECT}>
                  {STATIONARY_FUELS.map(k => <option key={k} value={k}>{t(FUEL_FACTORS[k]?.label_sl ?? k, FUEL_FACTORS[k]?.label_en ?? k)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Letna poraba', 'Annual consumption')} <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <input value={form.quantity} onChange={e => f('quantity', e.target.value)} onBlur={e => f('quantity', fmtQty(e.target.value))} type="text" inputMode="decimal" placeholder="0" className={INPUT} autoFocus />
                  <div className="w-14 px-2 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500 flex items-center justify-center shrink-0 font-medium">
                    {FUEL_FACTORS[form.fuel_type]?.unit ?? 'L'}
                  </div>
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
              <button onClick={handleSave} disabled={saving || !form.quantity || parseQty(form.quantity) < 0}
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
