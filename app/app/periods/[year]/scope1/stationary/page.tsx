'use client'

import { useState, useEffect } from 'react'
import { Building2, Plus, Pencil, X, Leaf, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { getFuelFactors, calcCo2eKg } from '@/lib/emission-factors'
import { useParams } from 'next/navigation'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useEmissionCountersStore } from '@/stores/emissionCounters'
import { parseQty, fmtQty } from '@/lib/utils/format'

const PAGE_SIZE = 20
const INPUT = 'w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] placeholder:text-gray-300 transition-shadow'
const SELECT = 'w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] transition-shadow'

const STATIONARY_FUELS = ['natural_gas', 'heating_oil', 'lpg', 'diesel', 'wood_chips'] as const
const EMPTY_FORM = { fuel_type: 'natural_gas', quantity: '' }
type EntryForm = typeof EMPTY_FORM

export default function Scope1StationaryPage() {
  const { t } = useLocale()
  const params = useParams()
  const year = Number(params.year)
  const FUEL_FACTORS = getFuelFactors(year)
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
  const [confirmDelete, setConfirmDelete] = useState(null)

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
        supabase.from('locations').select('id, name, address').eq('organization_id', org.id).eq('is_active', true).eq('uses_natural_gas', true).order('name'),
        supabase.from('scope1_stationary').select('*').eq('organization_id', org.id),
      ])

      setPeriod(pd)
      setLocations(locs ?? [])
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
  const totalCo2e = Object.values(entriesMap).reduce((s: number, e: any) => s + (e.co2e_kg ?? 0), 0)
  const done = Object.keys(entriesMap).length
  const total = locations.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const paginated = locations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Scope 1 · {year}</p>
        <h1 className="text-2xl font-bold text-gray-900">{t('Stacionarno zgorevanje – lokacije', 'Stationary combustion – locations')}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t('Direktne emisije iz ogrevanja in procesov', 'Direct emissions from heating and processes')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
            <Leaf className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">{t('Skupne emisije', 'Total emissions')} · {year}</p>
            <p className="text-lg font-bold text-gray-900">{(totalCo2e / 1000).toFixed(2).replace('.', ',')} <span className="text-xs font-normal text-gray-500">tCO₂e</span></p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${done === total && total > 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
            <Check className={`h-4 w-4 ${done === total && total > 0 ? 'text-green-600' : 'text-amber-500'}`} />
          </div>
          <div>
            <p className="text-xs text-gray-400">{t('Dokončano', 'Completed')}</p>
            <p className="text-lg font-bold text-gray-900">{done} <span className="text-xs font-normal text-gray-500">/ {total}</span></p>
          </div>
        </div>
        </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-sm text-gray-400">{t('Nalaganje...', 'Loading...')}</div>
      ) : !locations.length ? (
        <div className="bg-white border border-gray-200 rounded-xl py-14 text-center">
          <Building2 className="h-7 w-7 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">{t('Ni aktivnih lokacij.', 'No active locations.')}</p>
          <p className="text-xs text-gray-400">{t('Najprej dodajte lokacije v razdelku Lokacije.', 'First add locations in the Locations section.')}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{t('Lokacija', 'Location')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{t('Gorivo', 'Fuel')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{t('Letna poraba', 'Annual consumption')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{t('Emisije', 'Emissions')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{t('Status', 'Status')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((loc, i) => {
                const entry = entriesMap[loc.id]
                return (
                  <tr key={loc.id} className={`hover:bg-gray-50 transition-colors ${i !== 0 ? 'border-t border-gray-100' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{loc.name}</p>
                          {loc.address && <p className="text-xs text-gray-400">{loc.address}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {entry ? t(FUEL_FACTORS[entry.fuel_type]?.label_sl ?? entry.fuel_type, FUEL_FACTORS[entry.fuel_type]?.label_en ?? entry.fuel_type) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-700">
                      {entry ? `${fmtQty(entry.quantity)} ${entry.unit}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {entry
                        ? <span className="text-sm font-semibold text-green-700">{(entry.co2e_kg / 1000).toFixed(2).replace('.', ',')} tCO₂e</span>
                        : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {entry ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />{t('Podatki vneseni', 'Data entered')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{t('Potreben je vnos podatkov', 'Data entry required')}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        {entry ? (
                          <button onClick={() => openEdit(loc)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            {t('Uredi podatke o emisijah', 'Edit emission data')}
                          </button>
                        ) : (
                          <button onClick={() => openAdd(loc)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
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
          <Pagination page={page} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      )}


      <ConfirmDialog
        open={!!confirmDelete}
        title={t('Izbriši vnos', 'Delete entry')}
        message={t('Podatki o emisijah bodo trajno izbrisani. Tega dejanja ni mogoče razveljaviti.', 'Emission data will be permanently deleted. This action cannot be undone.')}
        confirmLabel={t('Izbriši', 'Delete')}
        cancelLabel={t('Prekliči', 'Cancel')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      {showModal && activeLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{entriesMap[activeLocation.id] ? t('Uredi vnos', 'Edit entry') : t('Dodaj porabo', 'Add consumption')}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{activeLocation.name} · Scope 1 · {year}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
              {entriesMap[activeLocation.id] && (
                <button onClick={() => { setShowModal(false); setConfirmDelete(activeLocation.id) }}
                  className="px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors">
                  {t('Izbriši podatke o porabi', 'Delete usage data')}
                </button>
              )}
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">{t('Prekliči', 'Cancel')}</button>
              <button onClick={handleSave} disabled={saving || !form.quantity || parseQty(form.quantity) < 0}
                className="flex-[2] px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-xl transition-colors">
                {saving ? t('Shranjevanje...', 'Saving...') : entriesMap[activeLocation.id] ? t('Shrani', 'Save') : t('Dodaj vnos', 'Add entry')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
