'use client'

import { useState, useEffect } from 'react'
import { Car, Plus, Pencil, Trash2, X, Truck, Bus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { mockVehicles } from '@/lib/mock-data'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { useEmissionCountersStore } from '@/stores/emissionCounters'
import { usePeriodStore } from '@/stores/period'

const PAGE_SIZE = 20

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

const fuelColors: Record<string, {bg:string,border:string,color:string}> = {
  gasoline: {bg:'#e5eeff',border:'#d6e5ff',color:'#215bcf'},
  diesel: {bg:'#e5eeff',border:'#d6e5ff',color:'#215bcf'},
  lpg: {bg:'#e5eeff',border:'#d6e5ff',color:'#215bcf'},
  cng: {bg:'#e5eeff',border:'#d6e5ff',color:'#215bcf'},
  lng: {bg:'#e5eeff',border:'#d6e5ff',color:'#215bcf'},
  electric: {bg:'#e5eeff',border:'#d6e5ff',color:'#215bcf'},
  hybrid: {bg:'#e5eeff',border:'#d6e5ff',color:'#215bcf'},
  hydrogen: {bg:'#e5eeff',border:'#d6e5ff',color:'#215bcf'},
  biodiesel: {bg:'#e5eeff',border:'#d6e5ff',color:'#215bcf'},
  biogas: {bg:'#e5eeff',border:'#d6e5ff',color:'#215bcf'},
  other: {bg:'#e5eeff',border:'#d6e5ff',color:'#215bcf'},
  unknown: {bg:'#f1f3f5',border:'#e9ecef',color:'#868e96'},
}

const FUEL_TYPES = [
  { value: 'diesel',   sl: 'Dizel',      en: 'Diesel' },
  { value: 'petrol',   sl: 'Bencin',     en: 'Petrol' },
  { value: 'electric', sl: 'Električno', en: 'Electric' },
  { value: 'hybrid',   sl: 'Hibrid',     en: 'Hybrid' },
  { value: 'lpg',      sl: 'LPG',        en: 'LPG' },
  { value: 'cng',      sl: 'CNG',        en: 'CNG' },
  { value: 'unknown',  sl: 'Neznano',    en: 'Unknown' },
]

const VEHICLE_TYPES = [
  { value: 'car',        sl: 'Osebni avto', en: 'Car' },
  { value: 'van',        sl: 'Kombi',       en: 'Van' },
  { value: 'truck',      sl: 'Tovornjak',   en: 'Truck' },
  { value: 'motorcycle', sl: 'Motor',        en: 'Motorcycle' },
  { value: 'bus',        sl: 'Avtobus',     en: 'Bus' },
  { value: 'other',      sl: 'Drugo',       en: 'Other' },
]

const OWNERSHIP_TYPES = [
  { value: 'owned',   sl: 'Lastniško',  en: 'Owned' },
  { value: 'leased',  sl: 'V leasingu', en: 'Leased' },
  { value: 'rented',  sl: 'V najemu',   en: 'Rented' },
]

const EMPTY_FORM = {
  name: '',
  make: '',
  model: '',
  vehicle_type: 'car',
  fuel_type: 'diesel',
  ownership_type: 'owned',
  registration_number: '',
  year_of_manufacture: '',
  location_id: '',
  notes: '',
  is_active: true,
}

type VehicleForm = typeof EMPTY_FORM

const INPUT = 'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] placeholder:text-gray-300 transition-shadow'
const SELECT = 'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] transition-shadow'

export default function VehiclesPage() {
  const { t, locale } = useLocale()
  const refreshCounters = useEmissionCountersStore(s => s.refresh)
  const { selectedYear } = usePeriodStore()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [filterLocation, setFilterLocation] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterFuel, setFilterFuel] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [linkedCounts, setLinkedCounts] = useState<Record<string, number>>({})
  const [inReportIds, setInReportIds] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<VehicleForm>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => { loadVehicles(); loadLocations() }, [])

  async function loadLocations() {
    if (IS_MOCK) return
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return
      const { data } = await supabase.from('locations').select('id, name').eq('organization_id', org.id).eq('is_active', true).order('name')
      setLocations(data ?? [])
    } catch {}
  }

  async function loadVehicles() {
    setLoading(true)
    if (IS_MOCK) { setVehicles(mockVehicles); setLoading(false); return }
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return
      const { data } = await supabase.from('vehicles').select('*')
        .eq('organization_id', org.id).order('created_at')
      setVehicles(data ?? [])

      const ids = (data ?? []).map((v: any) => v.id)
      if (ids.length > 0) {
        const [{ data: d1 }, { data: pvRows }] = await Promise.all([
          supabase.from('scope1_mobile').select('vehicle_id').in('vehicle_id', ids),
          supabase.from('period_vehicles').select('vehicle_id').in('vehicle_id', ids),
        ])
        const counts: Record<string, number> = {}
        ;(d1 ?? []).forEach((r: any) => { counts[r.vehicle_id] = (counts[r.vehicle_id] ?? 0) + 1 })
        setLinkedCounts(counts)
        setInReportIds(new Set((pvRows ?? []).map((r: any) => r.vehicle_id)))
      }
    } catch { setVehicles(mockVehicles) }
    setLoading(false)
  }

  function openNew() {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setError('')
    setShowModal(true)
  }

  function openEdit(v: any) {
    setForm({
      name: v.name ?? '',
      make: v.make ?? '',
      model: v.model ?? '',
      vehicle_type: v.vehicle_type ?? 'car',
      fuel_type: v.fuel_type ?? 'diesel',
      ownership_type: v.ownership_type ?? 'owned',
      registration_number: v.registration_number ?? '',
      year_of_manufacture: v.year_of_manufacture ? String(v.year_of_manufacture) : '',
      location_id: v.location_id ?? '',
      notes: v.notes ?? '',
      is_active: v.is_active ?? true,
    })
    setEditingId(v.id)
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError(t('Naziv vozila je obvezen.', 'Vehicle name is required.')); return }
    if (!form.location_id) { setError(t('Lokacija je obvezna.', 'Location is required.')); return }
    setSaving(true); setError('')

    if (IS_MOCK) {
      if (editingId) {
        setVehicles(prev => prev.map(v => v.id === editingId ? { ...v, ...form } : v))
      } else {
        setVehicles(prev => [...prev, { ...form, id: crypto.randomUUID(), is_active: true }])
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
        make: form.make.trim() || null,
        model: form.model.trim() || null,
        vehicle_type: form.vehicle_type,
        fuel_type: form.fuel_type,
        ownership_type: form.ownership_type || null,
        registration_number: form.registration_number || null,
        year_of_manufacture: form.year_of_manufacture ? Number(form.year_of_manufacture) : null,
        location_id: form.location_id || null,
        notes: form.notes || null,
        is_active: form.is_active,
      }

      let dbError
      if (editingId) {
        const { error } = await supabase.from('vehicles').update(payload).eq('id', editingId)
        dbError = error
      } else {
        const { error } = await supabase.from('vehicles').insert({ ...payload, organization_id: org.id })
        dbError = error
      }

      if (dbError) { setError(dbError.message); setSaving(false); return }
      await loadVehicles()
      if (selectedYear) refreshCounters(selectedYear)
      setShowModal(false)
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  async function confirmAndDelete() {
    if (!confirmDelete) return
    const { id } = confirmDelete
    setConfirmDelete(null)
    if (IS_MOCK) { setVehicles(prev => prev.filter(v => v.id !== id)); return }
    try {
      const supabase = createClient()
      await supabase.from('vehicles').update({ is_active: false }).eq('id', id)
      setVehicles(prev => prev.filter(v => v.id !== id))
      setLinkedCounts(prev => { const n = { ...prev }; delete n[id]; return n })
      if (selectedYear) refreshCounters(selectedYear)
    } catch {}
  }

  const f = (key: keyof VehicleForm, val: any) => setForm(prev => ({ ...prev, [key]: val }))

  const label = (list: { value: string; sl: string; en: string }[], val: string) => {
    const item = list.find(x => x.value === val)
    return item ? (locale === 'EN' ? item.en : item.sl) : val
  }

  const filteredVehicles = vehicles
    .filter(v => !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.make?.toLowerCase().includes(search.toLowerCase()) || v.model?.toLowerCase().includes(search.toLowerCase()) || v.registration_number?.toLowerCase().includes(search.toLowerCase()))
    .filter(v => !filterLocation || v.location_id === filterLocation)
    .filter(v => !filterType || v.vehicle_type === filterType)
    .filter(v => !filterFuel || v.fuel_type === filterFuel)
    .filter(v => filterStatus === '' ? true : filterStatus === 'active' ? v.is_active : !v.is_active)

  const totalPages = Math.ceil(filteredVehicles.length / PAGE_SIZE)
  const paginatedVehicles = filteredVehicles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function VehicleIcon({ type }: { type: string }) {
    return <Car className="h-3.5 w-3.5" style={{color:'#215bcf'}} />
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 border-b border-gray-200 h-[57px] shrink-0">
        <h1 className="text-base font-semibold text-gray-900">{t('Vozila', 'Vehicles')}</h1>
        <button onClick={openNew}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors shrink-0">
          <Plus className="h-4 w-4" />
          {t('Novo vozilo', 'New vehicle')}
        </button>
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">{t('Izbriši vozilo', 'Delete vehicle')}</h3>
                <p className="text-sm text-[#767676] mt-0.5">
                  {t(`Ali ste prepričani, da želite izbrisati "${confirmDelete.name}"? Tega dejanja ni mogoče razveljaviti.`,
                     `Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.`)}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-[#031f18] bg-white border border-gray-200 rounded-xl hover:bg-[#f9f9f9] transition-colors">
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-6 py-3.5 border-b border-gray-200">
        <div className="inline-flex items-center gap-2 h-9 px-3 bg-white border border-gray-200 rounded-xl text-[13px] min-w-[180px] focus-within:border-[#0f0f10] transition-colors">
          <Search className="h-3.5 w-3.5 text-[#767676] shrink-0" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder={t('Iskanje...', 'Search...')}
            className="flex-1 bg-transparent focus:outline-none text-[#0f0f10] placeholder:text-[#767676] text-[13px]" />
        </div>
        <label className="inline-flex items-center gap-1.5 h-9 px-3 bg-white border border-gray-200 rounded-xl text-[13px] cursor-pointer hover:bg-[#fafafa] has-[:focus]:border-[#0f0f10] transition-colors">
          <span className="text-[#767676]">{t('Tip:', 'Type:')}</span>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}
            className="font-medium text-[#0f0f10] bg-transparent focus:outline-none cursor-pointer">
            <option value="">{t('Vsi', 'All')}</option>
            {VEHICLE_TYPES.map(vt => <option key={vt.value} value={vt.value}>{locale === 'EN' ? vt.en : vt.sl}</option>)}
          </select>
        </label>
        <label className="inline-flex items-center gap-1.5 h-9 px-3 bg-white border border-gray-200 rounded-xl text-[13px] cursor-pointer hover:bg-[#fafafa] has-[:focus]:border-[#0f0f10] transition-colors">
          <span className="text-[#767676]">{t('Gorivo:', 'Fuel:')}</span>
          <select value={filterFuel} onChange={e => { setFilterFuel(e.target.value); setPage(1) }}
            className="font-medium text-[#0f0f10] bg-transparent focus:outline-none cursor-pointer">
            <option value="">{t('Vsi', 'All')}</option>
            {FUEL_TYPES.map(ft => <option key={ft.value} value={ft.value}>{locale === 'EN' ? ft.en : ft.sl}</option>)}
          </select>
        </label>
        {locations.length > 0 && (
          <label className="inline-flex items-center gap-1.5 h-9 px-3 bg-white border border-gray-200 rounded-xl text-[13px] cursor-pointer hover:bg-[#fafafa] has-[:focus]:border-[#0f0f10] transition-colors">
            <span className="text-[#767676]">{t('Lokacija:', 'Location:')}</span>
            <select value={filterLocation} onChange={e => { setFilterLocation(e.target.value); setPage(1) }}
              className="font-medium text-[#0f0f10] bg-transparent focus:outline-none cursor-pointer">
              <option value="">{t('Vse', 'All')}</option>
              {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
          </label>
        )}
        <label className="inline-flex items-center gap-1.5 h-9 px-3 bg-white border border-gray-200 rounded-xl text-[13px] cursor-pointer hover:bg-[#fafafa] has-[:focus]:border-[#0f0f10] transition-colors">
          <span className="text-[#767676]">{t('Status:', 'Status:')}</span>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            className="font-medium text-[#0f0f10] bg-transparent focus:outline-none cursor-pointer">
            <option value="">{t('Vsi', 'All')}</option>
            <option value="active">{t('Aktivno', 'Active')}</option>
            <option value="inactive">{t('Neaktivno', 'Inactive')}</option>
          </select>
        </label>
        {(search || filterType || filterFuel || filterLocation || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterType(''); setFilterFuel(''); setFilterLocation(''); setFilterStatus(''); setPage(1) }}
            className="h-9 px-3 text-[13px] font-medium text-[#767676] bg-white border border-gray-200 rounded-xl hover:bg-[#fafafa] transition-colors">
            {t('Počisti', 'Clear')}
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          {t('Nalaganje...', 'Loading...')}
        </div>
      ) : !vehicles.length ? (
        <div className="flex-1">
          <EmptyState
            icon={Car}
            title={t('Ni vozil', 'No vehicles')}
            subtitle={t('Dodajte prvo vozilo', 'Add your first vehicle')}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-auto"><div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Vozilo', 'Vehicle')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Tip', 'Type')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Gorivo', 'Fuel')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Lastništvo', 'Ownership')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Lokacija', 'Location')}</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Status', 'Status')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginatedVehicles.map((v, i) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{backgroundColor:'#e5eeff',border:'1px solid #d6e5ff'}}>
                        <VehicleIcon type={v.vehicle_type} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                        <p className="text-xs text-gray-500">
                          {[v.make, v.model].filter(Boolean).join(' ')}
                          {v.registration_number && <span className="ml-1 text-gray-300">·</span>}
                          {v.registration_number && <span className="ml-1">{v.registration_number}</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{label(VEHICLE_TYPES, v.vehicle_type)}</td>
                  <td className="px-5 py-3.5">
                    {(() => { const c = fuelColors[v.fuel_type] ?? fuelColors.unknown; return (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{backgroundColor:c.bg,border:`1px solid ${c.border}`,color:c.color}}>
                        {label(FUEL_TYPES, v.fuel_type)}
                      </span>
                    )})()}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{label(OWNERSHIP_TYPES, v.ownership_type ?? 'owned')}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">
                    {locations.find(l => l.id === v.location_id)?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={v.is_active ? {backgroundColor:'#e0fced',border:'1px solid #d4f8e6',color:'#098259'} : {backgroundColor:'#f1f3f5',border:'1px solid #e9ecef',color:'#868e96'}}>
                      {v.is_active ? t('Aktivno', 'Active') : t('Neaktivno', 'Inactive')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(v)}
                        className="p-1.5 text-[#767676] hover:text-[#0f0f10] hover:bg-[#efefef] rounded-lg transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: v.id, name: v.name })}
                        disabled={inReportIds.has(v.id) || !!(linkedCounts[v.id])}
                        title={inReportIds.has(v.id) ? t('Vozilo je dodano poročilu. Najprej ga odstranite iz poročila.', 'Vehicle is added to a report. Remove it from the report first.') : linkedCounts[v.id] ? t(`Ni možno izbrisati – ${linkedCounts[v.id]} vezanih emisij`, `Cannot delete – ${linkedCounts[v.id]} linked emission records`) : undefined}
                        className="p-1.5 text-[#767676] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-[#767676] disabled:hover:bg-transparent">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} totalItems={filteredVehicles.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div></div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-[#031f18]">
                  {editingId ? t('Uredi vozilo', 'Edit vehicle') : t('Dodaj vozilo', 'Add vehicle')}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t('Naziv / ID vozila', 'Vehicle name / ID')} <span className="text-red-400">*</span>
                </label>
                <input value={form.name} onChange={e => f('name', e.target.value)}
                  placeholder={t('npr. Službeni Golf, Dostava-1', 'e.g. Company Golf, Delivery-1')}
                  className={INPUT} autoFocus />
              </div>

              {/* Make + Model */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t('Znamka', 'Make')} <span className="text-[#767676] font-normal">({t('neobvezno', 'optional')})</span>
                  </label>
                  <input value={form.make} onChange={e => f('make', e.target.value)}
                    placeholder={t('npr. Volkswagen', 'e.g. Volkswagen')}
                    className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t('Model', 'Model')} <span className="text-[#767676] font-normal">({t('neobvezno', 'optional')})</span>
                  </label>
                  <input value={form.model} onChange={e => f('model', e.target.value)}
                    placeholder={t('npr. Golf 2.0 TDI', 'e.g. Golf 2.0 TDI')}
                    className={INPUT} />
                </div>
              </div>

              {/* Type + Fuel */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Tip vozila', 'Vehicle type')}</label>
                  <select value={form.vehicle_type} onChange={e => f('vehicle_type', e.target.value)} className={SELECT}>
                    {VEHICLE_TYPES.map(vt => (
                      <option key={vt.value} value={vt.value}>{locale === 'EN' ? vt.en : vt.sl}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Gorivo', 'Fuel type')}</label>
                  <select value={form.fuel_type} onChange={e => f('fuel_type', e.target.value)} className={SELECT}>
                    {FUEL_TYPES.map(ft => (
                      <option key={ft.value} value={ft.value}>{locale === 'EN' ? ft.en : ft.sl}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ownership + Registration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Lastništvo', 'Ownership')}</label>
                  <select value={form.ownership_type} onChange={e => f('ownership_type', e.target.value)} className={SELECT}>
                    {OWNERSHIP_TYPES.map(ot => (
                      <option key={ot.value} value={ot.value}>{locale === 'EN' ? ot.en : ot.sl}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t('Registrska označba', 'Registration number')} <span className="text-[#767676] font-normal">({t('neobvezno', 'optional')})</span>
                  </label>
                  <input value={form.registration_number} onChange={e => f('registration_number', e.target.value)}
                    placeholder="LJ AB-123"
                    className={INPUT} />
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t('Letnik', 'Year of manufacture')} <span className="text-[#767676] font-normal">({t('neobvezno', 'optional')})</span>
                </label>
                <input value={form.year_of_manufacture} onChange={e => f('year_of_manufacture', e.target.value)}
                  type="number" placeholder="2020" min="1990" max={new Date().getFullYear()}
                  className={INPUT} />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t('Lokacija vozila', 'Vehicle location')} <span className="text-red-500">*</span>
                </label>
                <select value={form.location_id} onChange={e => f('location_id', e.target.value)} className={SELECT}>
                  <option value="">{t('— Izberi lokacijo —', '— Select location —')}</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              {/* Status (edit only) */}
              {editingId && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Status', 'Status')}</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => f('is_active', true)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${form.is_active ? 'bg-[#f5f5f5] border-gray-200 text-[#0f0f10]' : 'border-gray-200 text-[#767676] hover:border-gray-200'}`}>
                      {t('Aktivno', 'Active')}
                    </button>
                    <button type="button" onClick={() => f('is_active', false)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${!form.is_active ? 'bg-[#fafafa] border-gray-400 text-[#031f18]' : 'border-gray-200 text-[#767676] hover:border-gray-200'}`}>
                      {t('Neaktivno', 'Inactive')}
                    </button>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t('Opombe', 'Notes')} <span className="text-[#767676] font-normal">({t('neobvezno', 'optional')})</span>
                </label>
                <textarea value={form.notes} onChange={e => f('notes', e.target.value)}
                  rows={2}
                  placeholder={t('Dodatne informacije o vozilu...', 'Additional vehicle information...')}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] placeholder:text-gray-300 resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
              )}
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-[#031f18] bg-white border border-gray-200 rounded-xl hover:bg-[#f9f9f9] transition-colors">
                {t('Prekliči', 'Cancel')}
              </button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="flex-[2] px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-[#efefef] disabled:text-[#767676] disabled:cursor-not-allowed rounded-xl transition-colors">
                {saving
                  ? t('Shranjevanje...', 'Saving...')
                  : editingId
                    ? t('Shrani spremembe', 'Save changes')
                    : t('Dodaj vozilo', 'Add vehicle')}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
