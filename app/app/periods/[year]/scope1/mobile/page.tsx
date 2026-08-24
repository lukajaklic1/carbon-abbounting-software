'use client'

import React, { useState, useEffect } from 'react'
import { Car, Plus, X, Leaf, Truck, Bus, Bike, Settings2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { getFuelFactors, calcCo2eKg } from '@/lib/emission-factors'
import { useParams } from 'next/navigation'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useEmissionCountersStore } from '@/stores/emissionCounters'
import { parseQty, fmtQty } from '@/lib/utils/format'

const INPUT = 'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] placeholder:text-gray-300 transition-shadow'
const VEHICLE_ICON: Record<string, React.ElementType> = { car: Car, van: Truck, truck: Truck, bus: Bus, motorcycle: Bike, other: Car }
const EMPTY_FORM = { fuel_type: 'diesel', quantity: '', unit: 'L' }
type EntryForm = typeof EMPTY_FORM

export default function Scope1MobilePage() {
  const { t } = useLocale()
  const params = useParams()
  const year = Number(params.year)
  const FUEL_FACTORS = getFuelFactors(year)
  const refreshCounters = useEmissionCountersStore(s => s.refresh)

  const [allVehicles, setAllVehicles] = useState<any[]>([])
  const [reportVehiclesAll, setReportVehiclesAll] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())   // in report
  const [periodVehicleMap, setPeriodVehicleMap] = useState<Record<string, string>>({}) // vehicle_id → period_vehicles.id
  const [entriesMap, setEntriesMap] = useState<Record<string, any>>({})
  const [period, setPeriod] = useState<any>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Select vehicles modal
  const [showSelect, setShowSelect] = useState(false)
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  // Emission data modal
  const [showModal, setShowModal] = useState(false)
  const [activeVehicle, setActiveVehicle] = useState<any>(null)
  const [form, setForm] = useState<EntryForm>({ ...EMPTY_FORM })
  const [modalSaving, setModalSaving] = useState(false)
  const [error, setError] = useState('')
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
      setOrgId(org.id)

      const [{ data: pd }, { data: vehs }, { data: pvRows }, { data: ents }] = await Promise.all([
        supabase.from('reporting_periods').select('*').eq('organization_id', org.id).eq('year', year).single(),
        supabase.from('vehicles').select('id, name, make, model, fuel_type, vehicle_type, year_of_manufacture').eq('organization_id', org.id).eq('is_active', true).order('name'),
        supabase.from('period_vehicles').select('id, vehicle_id, reporting_period_id').eq('organization_id', org.id),
        supabase.from('scope1_mobile').select('*').eq('organization_id', org.id),
      ])

      setPeriod(pd)
      setAllVehicles(vehs ?? [])

      const thisPv = (pvRows ?? []).filter((r: any) => r.reporting_period_id === pd?.id)
      const pvMap: Record<string, string> = {}
      thisPv.forEach((r: any) => { pvMap[r.vehicle_id] = r.id })
      setPeriodVehicleMap(pvMap)
      setSelectedIds(new Set(Object.keys(pvMap)))

      // Fetch all report vehicles (including inactive) separately
      const reportVehIds = thisPv.map((r: any) => r.vehicle_id)
      if (reportVehIds.length > 0) {
        const { data: reportVehs } = await supabase.from('vehicles').select('id, name, make, model, fuel_type, vehicle_type, year_of_manufacture, is_active').in('id', reportVehIds)
        setReportVehiclesAll(reportVehs ?? [])
      } else {
        setReportVehiclesAll([])
      }

      const entMap: Record<string, any> = {}
      if (pd && ents) ents.filter((e: any) => e.reporting_period_id === pd.id).forEach((e: any) => { entMap[e.vehicle_id] = e })
      setEntriesMap(entMap)
    } catch {}
    setLoading(false)
  }

  // Open select modal — prefill with current selection
  function openSelect() {
    setDraftIds(new Set(selectedIds))
    setShowSelect(true)
  }

  function toggleDraft(id: string) {
    const hasData = !!entriesMap[id]
    if (draftIds.has(id) && hasData) return // blocked — has emission data
    setDraftIds(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  async function saveSelection() {
    if (!period || !orgId) return
    setSaving(true)
    const supabase = createClient()

    const toAdd = [...draftIds].filter(id => !selectedIds.has(id))
    const toRemove = [...selectedIds].filter(id => !draftIds.has(id))

    if (toAdd.length) {
      await supabase.from('period_vehicles').insert(
        toAdd.map(vehicle_id => ({ reporting_period_id: period.id, vehicle_id, organization_id: orgId }))
      )
    }
    if (toRemove.length) {
      const pvIds = toRemove.map(vid => periodVehicleMap[vid]).filter(Boolean)
      if (pvIds.length) await supabase.from('period_vehicles').delete().in('id', pvIds)
    }

    await load()
    refreshCounters(year)
    setSaving(false)
    setShowSelect(false)
  }

  // Emission modal
  function openModal(vehicle: any) {
    const entry = entriesMap[vehicle.id]
    if (entry) {
      setForm({ fuel_type: entry.fuel_type ?? 'diesel', quantity: fmtQty(entry.quantity ?? 0), unit: entry.unit ?? 'L' })
    } else {
      const ft = vehicle.fuel_type && FUEL_FACTORS[vehicle.fuel_type] ? vehicle.fuel_type : 'diesel'
      setForm({ fuel_type: ft, quantity: '', unit: FUEL_FACTORS[ft]?.unit ?? 'L' })
    }
    setActiveVehicle(vehicle); setError(''); setShowModal(true)
  }

  function co2ePreview(): number | null {
    const qty = parseQty(form.quantity)
    const ff = FUEL_FACTORS[form.fuel_type]
    if (!qty || !ff) return null
    return calcCo2eKg(qty, ff.factor)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    const entry = entriesMap[confirmDelete]
    if (!entry) { setConfirmDelete(null); return }
    const supabase = createClient()
    await supabase.from('scope1_mobile').delete().eq('id', entry.id)
    setEntriesMap(prev => { const n = { ...prev }; delete n[confirmDelete]; return n })
    refreshCounters(year)
    setConfirmDelete(null)
  }

  async function handleSave() {
    const qty = parseQty(form.quantity)
    if (isNaN(qty) || qty < 0) { setError(t('Vnesite veljavno količino.', 'Enter a valid quantity.')); return }
    if (!period || !orgId) return
    const ff = FUEL_FACTORS[form.fuel_type]
    const co2e_kg = ff ? calcCo2eKg(qty, ff.factor) : 0
    setModalSaving(true); setError('')
    try {
      const supabase = createClient()
      const payload = {
        vehicle_id: activeVehicle.id, fuel_type: form.fuel_type, quantity: qty,
        unit: form.unit, co2e_kg, factor_kg_co2e_per_unit: ff?.factor ?? null,
        organization_id: orgId, reporting_period_id: period.id,
      }
      const existing = entriesMap[activeVehicle.id]
      const { error: dbErr } = existing
        ? await supabase.from('scope1_mobile').update(payload).eq('id', existing.id)
        : await supabase.from('scope1_mobile').insert(payload)
      if (dbErr) { setError(dbErr.message); setModalSaving(false); return }
      await load()
      refreshCounters(year)
      setShowModal(false)
    } catch (err: any) { setError(err.message) }
    setModalSaving(false)
  }

  const preview = co2ePreview()
  const reportVehicles = reportVehiclesAll
  const totalCo2e = reportVehicles.reduce((s, v) => s + (entriesMap[v.id]?.co2e_kg ?? 0), 0)
  const done = reportVehicles.filter(v => entriesMap[v.id]).length
  const total = reportVehicles.length

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 border-b border-gray-200 min-h-[57px] py-3 sm:h-[57px] sm:py-0 shrink-0">
        <h1 className="text-base font-semibold text-gray-900">{t('Poraba goriva – vozila', 'Vehicle fuel consumption')}</h1>
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
          <button onClick={openSelect}
            className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#215bcf] hover:bg-[#1a4ab5] rounded-xl text-sm font-medium text-white transition-colors">
            <Settings2 className="h-3.5 w-3.5" />
            {t('Izberi vozila', 'Select vehicles')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">{t('Nalaganje...', 'Loading...')}</div>
        ) : reportVehicles.length === 0 && allVehicles.length === 0 ? (
          <EmptyState icon={Car}
            title={t('Ni aktivnih vozil', 'No active vehicles')}
            subtitle={t('Dodajte vozilo v razdelku Vozila.', 'Add a vehicle in the Vehicles section.')} />
        ) : reportVehicles.length === 0 ? (
          <EmptyState icon={Car}
            title={t('Ni izbranih vozil', 'No vehicles selected')}
            subtitle={t('Kliknite »Izberi vozila« in dodajte vozila v poročilo.', 'Click "Select vehicles" to add vehicles to this report.')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Vozilo', 'Vehicle')}</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Gorivo', 'Fuel')}</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Letna poraba', 'Annual consumption')}</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Emisije', 'Emissions')}</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Status', 'Status')}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 border-b border-gray-200">
                {reportVehicles.map(v => {
                  const entry = entriesMap[v.id]
                  const Icon = VEHICLE_ICON[v.vehicle_type] ?? Car
                  return (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#e5eeff', border: '1px solid #d6e5ff' }}>
                            <Icon className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700">
                        {t(FUEL_FACTORS[entry?.fuel_type ?? v.fuel_type]?.label_sl ?? '—', FUEL_FACTORS[entry?.fuel_type ?? v.fuel_type]?.label_en ?? '—')}
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
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: '#e0fced', border: '1px solid #d4f8e6', color: '#098259' }}>
                            {t('Podatki vneseni', 'Data entered')}
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: '#fff3bf', border: '1px solid #ffe066', color: '#e67700' }}>
                            {t('Čaka vnos', 'Awaiting data')}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end">
                          <button onClick={() => openModal(v)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-gray-900 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
                            {entry ? (
                              <><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>{t('Uredi podatke o porabi', 'Edit consumption data')}</>
                            ) : (
                              <><Plus className="h-3 w-3" />{t('Dodaj podatke o porabi', 'Add consumption data')}</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SELECT VEHICLES MODAL */}
      {showSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSelect(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">{t('Izberi vozila', 'Select vehicles')}</h2>
              <button onClick={() => setShowSelect(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            {/* Vehicle list */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5">
              {(() => {
                const inactiveSelected = reportVehiclesAll.filter(v => v.is_active === false && draftIds.has(v.id))
                const inactiveIds = new Set(inactiveSelected.map((v: any) => v.id))
                const modalList = [...inactiveSelected, ...allVehicles.filter(v => !inactiveIds.has(v.id))]
                if (modalList.length === 0) return <p className="px-6 py-8 text-sm text-center text-gray-500">{t('Ni aktivnih vozil.', 'No active vehicles.')}</p>
                return modalList.map(v => {
                  const Icon = VEHICLE_ICON[v.vehicle_type] ?? Car
                  const checked = draftIds.has(v.id)
                  const hasData = !!entriesMap[v.id]
                  const locked = checked && hasData
                  const inactive = inactiveIds.has(v.id)
                  const fuelLabel = t(FUEL_FACTORS[v.fuel_type]?.label_sl ?? v.fuel_type, FUEL_FACTORS[v.fuel_type]?.label_en ?? v.fuel_type)
                  const subtitle = [v.make, v.model].filter(Boolean).join(' ') || null
                  return (
                    <div key={v.id} className={`rounded-xl border transition-all overflow-hidden ${inactive ? 'opacity-60' : ''}`}
                        style={{ borderColor: checked ? '#215bcf' : '#e5e7eb' }}>
                      <label className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                        style={{ backgroundColor: checked ? '#f0f5ff' : '#fff' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleDraft(v.id)}
                        disabled={locked}
                        className="w-4 h-4 rounded border-gray-300 accent-[#215bcf] cursor-pointer shrink-0 disabled:cursor-not-allowed" />
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{ backgroundColor: checked ? '#e5eeff' : '#f3f4f6', borderColor: checked ? '#c7d9ff' : '#e5e7eb' }}>
                        <Icon className={`w-4 h-4 ${checked ? 'text-[#215bcf]' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{v.name}</p>
                        {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}{v.year_of_manufacture ? ` · ${v.year_of_manufacture}` : ''}</p>}
                        {inactive && <p className="text-xs text-amber-600 font-medium">{t('Neaktivno', 'Inactive')}</p>}
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md shrink-0"
                        style={{ backgroundColor: checked ? '#e5eeff' : '#f3f4f6', color: checked ? '#215bcf' : '#6b7280' }}>
                        {fuelLabel}
                      </span>
                    </label>
                    {locked && (
                      <div className="px-4 py-2 border-t flex items-center gap-1.5" style={{ borderColor: '#dbeafe', backgroundColor: '#eff6ff' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#215bcf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <p className="text-xs text-[#215bcf]">{t('Vozilo ima vnesene podatke o emisijah. Če želite odstraniti vozilo iz poročila, najprej izbrišite podatke o emisijah.', 'Vehicle has emission data. To remove it from the report, first delete the emission data.')}</p>
                      </div>
                    )}
                    </div>
                  )
                })
              })()}
            </div>
            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">{draftIds.size} {t('izbranih', 'selected')}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowSelect(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  {t('Prekliči', 'Cancel')}
                </button>
                <button onClick={saveSelection} disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#215bcf] hover:bg-[#1a4ab5] disabled:opacity-60 rounded-xl transition-colors">
                  {saving ? t('Shranjevanje...', 'Saving...') : t('Potrdi', 'Confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMISSION DATA MODAL */}
      {showModal && activeVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {entriesMap[activeVehicle.id] ? t('Uredi vnos', 'Edit entry') : t('Vnesi porabo', 'Enter consumption')}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">{activeVehicle.name}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Vrsta goriva', 'Fuel type')}</label>
                <div className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                  {t(FUEL_FACTORS[form.fuel_type]?.label_sl ?? form.fuel_type, FUEL_FACTORS[form.fuel_type]?.label_en ?? form.fuel_type)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Letna poraba', 'Annual consumption')} <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <input value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                    onBlur={e => setForm(p => ({ ...p, quantity: fmtQty(e.target.value) }))}
                    type="text" inputMode="decimal" placeholder="0" className={INPUT} autoFocus />
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
              {entriesMap[activeVehicle.id] && (
                <button onClick={() => { setShowModal(false); setConfirmDelete(activeVehicle.id) }}
                  className="px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors">
                  {t('Izbriši podatke o porabi', 'Delete usage data')}
                </button>
              )}
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                {t('Prekliči', 'Cancel')}
              </button>
              <button onClick={handleSave} disabled={modalSaving || !form.quantity || parseQty(form.quantity) < 0}
                className="flex-[2] px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed rounded-xl transition-colors">
                {modalSaving ? t('Shranjevanje...', 'Saving...') : entriesMap[activeVehicle.id] ? t('Shrani', 'Save') : t('Dodaj vnos', 'Add entry')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title={t('Izbriši vnos', 'Delete entry')}
        message={t('Podatki o emisijah bodo trajno izbrisani. Tega dejanja ni mogoče razveljaviti.', 'Emission data will be permanently deleted. This action cannot be undone.')}
        confirmLabel={t('Izbriši', 'Delete')}
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
