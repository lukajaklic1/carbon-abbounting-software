'use client'

import { useState, useEffect } from 'react'
import { FlaskConical, Plus, Pencil, X, Leaf, Check, Settings2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { INDUSTRIAL_GAS_FACTORS, calcCo2eKg } from '@/lib/emission-factors'
import { useParams } from 'next/navigation'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconFireExtinguisher } from '@tabler/icons-react'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useEmissionCountersStore } from '@/stores/emissionCounters'
import { parseQty, fmtQty } from '@/lib/utils/format'

const PAGE_SIZE = 20
const INPUT = 'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] placeholder:text-gray-300 transition-shadow'
const SELECT = 'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] transition-shadow'

const GAS_KEYS = Object.keys(INDUSTRIAL_GAS_FACTORS)

const EMPTY_FORM = { gas_type: GAS_KEYS[0] ?? 'SF6', quantity_kg: '' }
type EntryForm = typeof EMPTY_FORM

export default function Scope1IndustrialGasesPage() {
  const { t } = useLocale()
  const params = useParams()
  const year = Number(params.year)
  const refreshCounters = useEmissionCountersStore(s => s.refresh)

  const [allEquipment, setAllEquipment] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [periodEquMap, setPeriodEquMap] = useState<Record<string, string>>({})
  const [orgId, setOrgId] = useState<string | null>(null)
  const [showSelect, setShowSelect] = useState(false)
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set())
  const [selectSaving, setSelectSaving] = useState(false)
  const [entriesMap, setEntriesMap] = useState<Record<string, any>>({})
  const [period, setPeriod] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeItem, setActiveItem] = useState<any>(null)
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
    if (toAdd.length) await sup.from('period_equipment').insert(toAdd.map(equipment_id => ({ reporting_period_id: period.id, equipment_id, organization_id: orgId, scope_type: 'industrial_gases' })))
    if (toRemove.length) { const ids = toRemove.map(id => periodEquMap[id]).filter(Boolean); if (ids.length) await sup.from('period_equipment').delete().in('id', ids) }
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

      const [{ data: pd }, { data: equip }, { data: peRows }, { data: ents }] = await Promise.all([
        supabase.from('reporting_periods').select('*').eq('organization_id', org.id).eq('year', year).single(),
        supabase.from('equipment').select('id, name, industrial_gas_type').eq('organization_id', org.id).eq('is_active', true).eq('uses_industrial_gases', true).order('name'),
        supabase.from('period_equipment').select('id, equipment_id, reporting_period_id').eq('organization_id', org.id).eq('scope_type', 'industrial_gases'),
        supabase.from('scope1_industrial_gases').select('*').eq('organization_id', org.id),
      ])

      setOrgId(org.id)
      setPeriod(pd)
      setAllEquipment(equip ?? [])
      const thisPe = (peRows ?? []).filter((r: any) => r.reporting_period_id === pd?.id)
      const peMap: Record<string, string> = {}
      thisPe.forEach((r: any) => { peMap[r.equipment_id] = r.id })
      setPeriodEquMap(peMap)
      setSelectedIds(new Set(Object.keys(peMap)))
      const map: Record<string, any> = {}
      if (pd && ents) ents.filter((e: any) => e.reporting_period_id === pd.id).forEach((e: any) => { map[e.equipment_id] = e })
      setEntriesMap(map)
    } catch {}
    setLoading(false)
  }

  function openAdd(item: any) {
    const gt = item.industrial_gas_type && GAS_KEYS.includes(item.industrial_gas_type.toUpperCase?.() ?? item.industrial_gas_type)
      ? item.industrial_gas_type : GAS_KEYS[0]
    setForm({ gas_type: GAS_KEYS.includes(gt) ? gt : GAS_KEYS[0], quantity_kg: '' })
    setActiveItem(item); setError(''); setShowModal(true)
  }

  function openEdit(item: any) {
    const e = entriesMap[item.id]
    setForm({ gas_type: e.gas_type ?? GAS_KEYS[0], quantity_kg: String(e.quantity ?? '') })
    setActiveItem(item); setError(''); setShowModal(true)
  }

  function co2ePreview(): number | null {
    const qty = parseQty(form.quantity_kg)
    const gf = INDUSTRIAL_GAS_FACTORS[form.gas_type]
    if (!qty || !gf) return null
    return calcCo2eKg(qty, gf.factor)
  }

  async function handleSave() {
    const qty = parseQty(form.quantity_kg)
    if (isNaN(qty) || qty < 0) { setError(t('Vnesite veljavno količino.', 'Enter a valid quantity.')); return }
    if (!period) { setError('Poročevalsko obdobje ni najdeno.'); return }
    const gf = INDUSTRIAL_GAS_FACTORS[form.gas_type]
    const co2e_kg = gf ? calcCo2eKg(qty, gf.factor) : 0
    setSaving(true); setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return
      const payload = {
        equipment_id: activeItem.id, gas_type: form.gas_type,
        quantity: qty, unit: 'kg', co2e_kg,

        organization_id: org.id, reporting_period_id: period.id,
      }
      const existing = entriesMap[activeItem.id]
      const { error: dbErr } = existing
        ? await supabase.from('scope1_industrial_gases').update(payload).eq('id', existing.id)
        : await supabase.from('scope1_industrial_gases').insert(payload)
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
    await supabase.from('scope1_industrial_gases').delete().eq('id', entry.id)
    setEntriesMap(prev => { const n = { ...prev }; delete n[confirmDelete]; return n })
    setConfirmDelete(null)
    refreshCounters(year)
  }

  const f = (key: keyof EntryForm, val: any) => setForm(prev => ({ ...prev, [key]: val }))
  const preview = co2ePreview()
  const reportEquipment = allEquipment.filter(e => selectedIds.has(e.id))
  const totalCo2e = reportEquipment.reduce((s: number, e: any) => s + (entriesMap[e.id]?.co2e_kg ?? 0), 0)
  const done = reportEquipment.filter(e => entriesMap[e.id]).length
  const total = reportEquipment.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const paginated = reportEquipment.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 border-b border-gray-200 min-h-[57px] py-3 sm:h-[57px] sm:py-0 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">{t('Industrijski plini – oprema', 'Industrial gases – equipment')}</h1>
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
            {t('Izberi opremo', 'Select equipment')}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
      {loading ? (
        <div className="p-12 text-center text-sm text-gray-500">{t('Nalaganje...', 'Loading...')}</div>
      ) : allEquipment.length === 0 ? (
        <EmptyState iconNode={<IconFireExtinguisher size={32} />} title={t('Ni opreme z industrijskimi plini', 'No industrial gas equipment')} subtitle={t('Dodajte opremo, ki vsebuje industrijske pline.', 'Add equipment that contains industrial gases.')} />
      ) : reportEquipment.length === 0 ? (
        <EmptyState icon={Settings2} title={t('Ni izbrane opreme', 'No equipment selected')} subtitle={t('Kliknite »Izberi opremo« da dodate opremo v poročilo.', 'Click "Select equipment" to add equipment to the report.')} />
      ) : (
        <>
            <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Oprema', 'Equipment')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Plin', 'Gas')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Količina', 'Quantity')} (kg)</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Emisije', 'Emissions')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Status', 'Status')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 border-b border-gray-200">
              {paginated.map((item, i) => {
                const entry = entriesMap[item.id]
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{backgroundColor:'#e5eeff',border:'1px solid #d6e5ff'}}>
                          <FlaskConical className="h-3.5 w-3.5" style={{color:'#215bcf'}} />
                        </div>
                        <p className="text-xs font-medium text-gray-500">{item.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">
                      {entry ? entry.gas_type : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
                      {entry ? `${fmtQty(entry.quantity)} kg` : <span className="text-gray-300">—</span>}
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
                          <button onClick={() => openEdit(item)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            {t('Uredi podatke o emisijah', 'Edit emission data')}
                          </button>
                        ) : (
                          <button onClick={() => openAdd(item)}
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
              <h2 className="text-base font-semibold text-gray-900">{t('Izberi opremo', 'Select equipment')}</h2>
              <button onClick={() => setShowSelect(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5">
              {allEquipment.length === 0 ? (
                <p className="px-6 py-8 text-sm text-center text-gray-500">{t('Ni opreme.', 'No equipment.')}</p>
              ) : allEquipment.map(item => {
                const checked = draftIds.has(item.id)
                const hasData = !!entriesMap[item.id]
                const locked = checked && hasData
                return (
                  <div key={item.id} className="rounded-xl border transition-all overflow-hidden" style={{ borderColor: checked ? '#215bcf' : '#e5e7eb' }}>
                    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer" style={{ backgroundColor: checked ? '#f0f5ff' : '#fff' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleDraft(item.id)} disabled={locked} className="w-4 h-4 rounded border-gray-300 accent-[#215bcf] cursor-pointer shrink-0 disabled:cursor-not-allowed" />
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border" style={{ backgroundColor: checked ? '#e5eeff' : '#f3f4f6', borderColor: checked ? '#c7d9ff' : '#e5e7eb' }}>
                        <FlaskConical className={`w-3.5 h-3.5 ${checked ? 'text-[#215bcf]' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                        {item.industrial_gas_type && <p className="text-xs text-gray-500 truncate">{item.industrial_gas_type}</p>}
                      </div>
                    </label>
                    {locked && (
                      <div className="px-4 py-2 border-t flex items-center gap-1.5" style={{ borderColor: '#dbeafe', backgroundColor: '#eff6ff' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#215bcf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <p className="text-xs text-[#215bcf]">{t('Oprema ima vnesene emisije. Najprej izbrišite podatke o emisijah.', 'Equipment has emission data. Delete it first.')}</p>
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
      {showModal && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{entriesMap[activeItem.id] ? t('Uredi vnos', 'Edit entry') : t('Dodaj plin', 'Add gas')}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Vrsta plina', 'Gas type')}</label>
                <select value={form.gas_type} onChange={e => f('gas_type', e.target.value)} className={SELECT}>
                  {GAS_KEYS.map(k => <option key={k} value={k}>{k} — GWP {INDUSTRIAL_GAS_FACTORS[k]?.factor}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Letna količina', 'Annual quantity')} (kg) <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <input value={form.quantity_kg} onChange={e => f('quantity_kg', e.target.value)} onBlur={e => f('quantity_kg', fmtQty(e.target.value))} type="text" inputMode="decimal" placeholder="0" className={INPUT} autoFocus />
                  <div className="w-10 px-2 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500 flex items-center justify-center shrink-0 font-medium">kg</div>
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
              {entriesMap[activeItem.id] && (
                <button onClick={() => { setShowModal(false); setConfirmDelete(activeItem.id) }}
                  className="px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors">
                  {t('Izbriši podatke o porabi', 'Delete usage data')}
                </button>
              )}
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">{t('Prekliči', 'Cancel')}</button>
              <button onClick={handleSave} disabled={saving || !form.quantity_kg || parseQty(form.quantity_kg) < 0}
                className="flex-[2] px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed rounded-xl transition-colors">
                {saving ? t('Shranjevanje...', 'Saving...') : entriesMap[activeItem.id] ? t('Shrani', 'Save') : t('Dodaj vnos', 'Add entry')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
