'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Pencil, Trash2, Building2, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { mockLocations } from '@/lib/mock-data'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { Pagination } from '@/components/ui/Pagination'
import { useEmissionCountersStore } from '@/stores/emissionCounters'
import { usePeriodStore } from '@/stores/period'

const PAGE_SIZE = 20

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

const COUNTRIES = [
  { value: 'SI', label: 'Slovenija' }, { value: 'HR', label: 'Hrvaška' },
  { value: 'AT', label: 'Avstrija' }, { value: 'DE', label: 'Nemčija' },
  { value: 'IT', label: 'Italija' }, { value: 'FR', label: 'Francija' },
  { value: 'GB', label: 'Združeno kraljestvo' }, { value: 'OTHER', label: 'Drugo' },
]

const LOCATION_TYPES = [
  { value: 'office',          sl: 'Pisarna',                      en: 'Office',               emoji: '🏢' },
  { value: 'manufacturing',   sl: 'Proizvodnja',                  en: 'Manufacturing',         emoji: '🏭' },
  { value: 'warehouse',       sl: 'Skladišče',                    en: 'Warehouse',             emoji: '🏗️' },
  { value: 'retail',          sl: 'Prodajalna',                   en: 'Retail store',          emoji: '🏪' },
  { value: 'restaurant_cafe', sl: 'Restavracija / kavarna',       en: 'Restaurant / café',     emoji: '🍽️' },
  { value: 'hotel',           sl: 'Hotel',                        en: 'Hotel',                 emoji: '🏨' },
  { value: 'healthcare',      sl: 'Zdravstveni objekt',           en: 'Healthcare facility',   emoji: '🏥' },
  { value: 'education',       sl: 'Šola / izobraževalni center',  en: 'School / education',    emoji: '🏫' },
  { value: 'sports',          sl: 'Športni objekt',               en: 'Sports facility',       emoji: '🏟️' },
  { value: 'datacenter',      sl: 'Podatkovni center',            en: 'Data center',           emoji: '🖥️' },
  { value: 'logistics',       sl: 'Logistično središče',          en: 'Logistics hub',         emoji: '🚚' },
  { value: 'public',          sl: 'Javna zgradba',                en: 'Public building',       emoji: '🏛️' },
  { value: 'mixed_use',       sl: 'Večnamenska stavba',           en: 'Mixed use',             emoji: '🏘️' },
  { value: 'other',           sl: 'Drugo',                        en: 'Other',                 emoji: '📍' },
]

const UTILITIES = [
  { key: 'uses_electricity', label: 'Ta lokacija uporablja elektriko', desc: 'Elektrika je najpogostejši vir energije v stavbah po vsem svetu, ki se uporablja za razsvetljavo, ogrevanje, hlajenje in opremo.' },
  { key: 'uses_natural_gas', label: 'Ta lokacija uporablja zemeljski plin', desc: 'Zemeljski plin je pogosto gorivo v stavbah po vsem svetu, ki se uporablja za ogrevanje.' },
  { key: 'uses_heat', label: 'Ta lokacija uporablja daljinsko toploto', desc: 'Toplota, kupljena od zunanjega dobavitelja in dostavljena prek omrežja daljinskega ogrevanja.' },
  { key: 'uses_steam', label: 'Ta lokacija uporablja paro', desc: 'Para, kupljena od zunanjega dobavitelja in dostavljena prek omrežja.' },
  { key: 'uses_cooling', label: 'Ta lokacija uporablja daljinsko hlajenje', desc: 'Daljinsko hlajenje je redko (< 2 % lokacij). Gre za nakup hladne vode od zunanjega dobavitelja in NI enako navadni klimatski napravi, ki deluje na elektriko in hladilne plina.' },
]

const EMPTY_FORM = {
  name: '', address: '', city: '', postal_code: '', country_code: 'SI',
  location_type: 'office', floor_area_m2: '',
  uses_natural_gas: false, uses_electricity: true, uses_heat: false, uses_steam: false, uses_cooling: false,
  notes: '',
  is_active: true,
}

type LocationForm = typeof EMPTY_FORM

export default function LocationsPage() {
  const { t } = useLocale()
  const refreshCounters = useEmissionCountersStore(s => s.refresh)
  const { selectedYear } = usePeriodStore()
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [linkedCounts, setLinkedCounts] = useState<Record<string, number>>({})
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<LocationForm>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => { loadLocations() }, [])

  async function loadLocations() {
    setLoading(true)
    if (IS_MOCK) { setLocations(mockLocations); setLoading(false); return }
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return
      const { data } = await supabase.from('locations').select('*')
        .eq('organization_id', org.id).order('created_at')
      setLocations(data ?? [])

      const ids = (data ?? []).map((l: any) => l.id)
      if (ids.length > 0) {
        const [{ data: d1 }, { data: d2 }, { data: d3 }, { data: d4 }] = await Promise.all([
          supabase.from('scope1_stationary').select('location_id').in('location_id', ids),
          supabase.from('scope2_electricity').select('location_id').in('location_id', ids),
          supabase.from('equipment').select('location_id').in('location_id', ids).eq('is_active', true),
          supabase.from('vehicles').select('location_id').in('location_id', ids).eq('is_active', true),
        ])
        const counts: Record<string, number> = {}
        ;[...(d1 ?? []), ...(d2 ?? []), ...(d3 ?? []), ...(d4 ?? [])].forEach((r: any) => {
          if (r.location_id) counts[r.location_id] = (counts[r.location_id] ?? 0) + 1
        })
        setLinkedCounts(counts)
      }
    } catch { setLocations(mockLocations) }
    setLoading(false)
  }

  function openNew() {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setError('')
    setShowModal(true)
  }

  function openEdit(loc: any) {
    setForm({
      name: loc.name ?? '',
      address: loc.address ?? '',
      city: loc.city ?? '',
      postal_code: loc.postal_code ?? '',
      country_code: loc.country_code ?? 'SI',
      location_type: loc.location_type ?? 'office',
      floor_area_m2: loc.floor_area_m2 ?? '',
      uses_natural_gas: loc.uses_natural_gas ?? false,
      uses_electricity: loc.uses_electricity ?? true,
      uses_heat: loc.uses_heat ?? false,
      uses_steam: loc.uses_steam ?? false,
      uses_cooling: loc.uses_cooling ?? false,
      notes: loc.notes ?? '',
      is_active: loc.is_active ?? true,
    })
    setEditingId(loc.id)
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError(t('Ime lokacije je obvezno.', 'Location name is required.')); return }
    setSaving(true); setError('')
    if (IS_MOCK) {
      if (editingId) {
        setLocations(prev => prev.map(l => l.id === editingId ? { ...l, ...form } : l))
      } else {
        setLocations(prev => [...prev, { ...form, id: crypto.randomUUID(), is_active: true }])
      }
      setSaving(false); setShowModal(false); return
    }
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return

      const payload = {
        name: form.name.trim(),
        address: form.address || null,
        city: form.city || null,
        postal_code: form.postal_code || null,
        country_code: form.country_code,
        location_type: form.location_type,
        floor_area_m2: form.floor_area_m2 ? Number(form.floor_area_m2) : null,
        floor_area_unit: 'm2',
        uses_natural_gas: form.uses_natural_gas,
        uses_electricity: form.uses_electricity,
        uses_heat: form.uses_heat,
        uses_steam: form.uses_steam,
        uses_cooling: form.uses_cooling,
        notes: form.notes || null,
        is_active: form.is_active,
      }

      let dbError
      if (editingId) {
        const { error } = await supabase.from('locations').update(payload).eq('id', editingId)
        dbError = error
      } else {
        const { error } = await supabase.from('locations').insert({ ...payload, organization_id: org.id })
        dbError = error
      }
      if (dbError) { setError(dbError.message); setSaving(false); return }
      await loadLocations()
      if (selectedYear) refreshCounters(selectedYear)
      setShowModal(false)
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  async function confirmAndDelete() {
    if (!confirmDelete) return
    const { id } = confirmDelete
    setConfirmDelete(null)
    if (IS_MOCK) { setLocations(prev => prev.filter(l => l.id !== id)); return }
    try {
      const supabase = createClient()
      await supabase.from('locations').update({ is_active: false }).eq('id', id)
      setLocations(prev => prev.filter(l => l.id !== id))
      setLinkedCounts(prev => { const n = { ...prev }; delete n[id]; return n })
    } catch {}
  }

  const f = (key: keyof LocationForm, val: any) => setForm(prev => ({ ...prev, [key]: val }))

  const totalPages = Math.ceil(locations.length / PAGE_SIZE)
  const paginatedLocations = locations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Lokacije', 'Locations')}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{locations.length} {t(locations.length === 1 ? 'lokacija' : 'lokacij', locations.length === 1 ? 'location' : 'locations')} · {t('Pisarne, tovarne, skladišča in druge nepremičnine', 'Offices, factories, warehouses and other premises')}</p>
        </div>
        <button onClick={openNew}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="h-4 w-4" />
          {t('Nova lokacija', 'New location')}
        </button>
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{t('Izbriši lokacijo', 'Delete location')}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t(`Ali ste prepričani, da želite izbrisati "${confirmDelete.name}"? Tega dejanja ni mogoče razveljaviti.`,
                     `Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.`)}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                {t('Prekliči', 'Cancel')}
              </button>
              <button onClick={confirmAndDelete}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">
                {t('Izbriši', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-sm text-gray-400">{t('Nalaganje...', 'Loading...')}</div>
      ) : !locations.length ? (
        <div className="bg-white border border-gray-200 rounded-xl py-14 text-center">
          <MapPin className="h-7 w-7 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-2">{t('Ni lokacij.', 'No locations.')}</p>
          <button onClick={openNew}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            {t('Dodajte prvo lokacijo →', 'Add your first location →')}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{t('Ime lokacije', 'Location name')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{t('Naslov', 'Address')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{t('Tip', 'Type')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{t('Površina', 'Floor area')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{t('Status', 'Status')}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedLocations.map((loc, i) => (
                <tr key={loc.id} className={`hover:bg-gray-50 transition-colors ${i !== 0 ? 'border-t border-gray-100' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-lg leading-none">
                        {LOCATION_TYPES.find(lt => lt.value === loc.location_type)?.emoji ?? '📍'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{loc.name}</p>
                        <p className="text-xs text-gray-400">{COUNTRIES.find(c => c.value === loc.country_code)?.label ?? loc.country_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {[loc.address, loc.city, loc.postal_code].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                      {(() => { const lt = LOCATION_TYPES.find(lt => lt.value === loc.location_type); return lt ? t(lt.sl, lt.en) : '—' })()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {loc.floor_area_m2 ? `${loc.floor_area_m2} m²` : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${loc.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${loc.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {loc.is_active ? t('Aktivno', 'Active') : t('Neaktivno', 'Inactive')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(loc)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: loc.id, name: loc.name })}
                        disabled={!!(linkedCounts[loc.id])}
                        title={linkedCounts[loc.id] ? t(`Ni možno izbrisati – ${linkedCounts[loc.id]} vezanih zapisov`, `Cannot delete – ${linkedCounts[loc.id]} linked records`) : undefined}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} totalItems={locations.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId ? t('Uredi lokacijo', 'Edit location') : t('Dodaj lokacijo', 'Add location')}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editingId ? t('Posodobite podatke lokacije', 'Update location details') : t('Fizično mesto, pisarna ali skladišče', 'Physical place, office or warehouse')}
                </p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Ime lokacije', 'Location name')} <span className="text-red-400">*</span>
                </label>
                <input value={form.name} onChange={e => f('name', e.target.value)}
                  placeholder={t('npr. Centralna pisarna Ljubljana', 'e.g. Main Office Ljubljana')}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] placeholder:text-gray-300"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Ulica in hišna številka', 'Street address')}</label>
                <input value={form.address} onChange={e => f('address', e.target.value)}
                  placeholder={t('npr. Dunajska cesta 5', 'e.g. Main Street 5')}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] placeholder:text-gray-300"
                />
              </div>

              {/* City + Postal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Mesto', 'City')}</label>
                  <input value={form.city} onChange={e => f('city', e.target.value)}
                    placeholder={t('Ljubljana', 'Ljubljana')}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Poštna številka', 'Postal code')}</label>
                  <input value={form.postal_code} onChange={e => f('postal_code', e.target.value)}
                    placeholder="1000"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Country + Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Država', 'Country')}</label>
                  <select value={form.country_code} onChange={e => f('country_code', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb]">
                    {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Tip lokacije', 'Location type')}</label>
                  <select value={form.location_type} onChange={e => f('location_type', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb]">
                    {LOCATION_TYPES.map(lt => <option key={lt.value} value={lt.value}>{t(lt.sl, lt.en)}</option>)}
                  </select>
                </div>
              </div>

              {/* Floor area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Površina', 'Floor area')} <span className="text-gray-400 font-normal">({t('neobvezno', 'optional')})</span></label>
                <div className="flex gap-2">
                  <input value={form.floor_area_m2} onChange={e => f('floor_area_m2', e.target.value)}
                    type="number" placeholder={t('npr. 500', 'e.g. 500')}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] placeholder:text-gray-300"
                  />
                  <div className="w-16 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500 flex items-center justify-center">
                    m²
                  </div>
                </div>
              </div>

              {/* Utilities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Energenti na tej lokaciji', 'Utilities at this location')}</label>
                <div className="space-y-2">
                  {UTILITIES.map(u => (
                    <label key={u.key} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-colors group">
                      <div className="relative mt-0.5 shrink-0">
                        <input type="checkbox"
                          checked={!!(form as any)[u.key]}
                          onChange={e => f(u.key as keyof LocationForm, e.target.checked)}
                          className="sr-only" />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          (form as any)[u.key] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                        }`}>
                          {(form as any)[u.key] && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{u.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{u.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status (edit only) */}
              {editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Status', 'Status')}</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => f('is_active', true)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${form.is_active ? 'bg-green-50 border-green-400 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {t('Aktivno', 'Active')}
                    </button>
                    <button type="button" onClick={() => f('is_active', false)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${!form.is_active ? 'bg-gray-100 border-gray-400 text-gray-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {t('Neaktivno', 'Inactive')}
                    </button>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Opombe', 'Notes')} <span className="text-gray-400 font-normal">({t('neobvezno', 'optional')})</span></label>
                <textarea value={form.notes} onChange={e => f('notes', e.target.value)}
                  rows={2} placeholder={t('Dodatne informacije o lokaciji...', 'Additional information about this location...')}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2563eb] placeholder:text-gray-300 resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                {t('Prekliči', 'Cancel')}
              </button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="flex-[2] px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-xl transition-colors">
                {saving ? t('Shranjevanje...', 'Saving...') : editingId ? t('Shrani spremembe', 'Save changes') : t('Dodaj lokacijo', 'Add location')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
