'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Pencil, Trash2, Building2, X, Check, Search, Factory, Warehouse, ShoppingBag, UtensilsCrossed, Hotel, Cross, GraduationCap, Trophy, Server, Truck, Landmark, LayoutGrid } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { mockLocations } from '@/lib/mock-data'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { useEmissionCountersStore } from '@/stores/emissionCounters'
import { usePeriodStore } from '@/stores/period'

const PAGE_SIZE = 20

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

const COUNTRIES = [
  { value: 'SI', sl: 'Slovenija', en: 'Slovenia' }, { value: 'HR', sl: 'Hrvaška', en: 'Croatia' },
  { value: 'AT', sl: 'Avstrija', en: 'Austria' }, { value: 'DE', sl: 'Nemčija', en: 'Germany' },
  { value: 'IT', sl: 'Italija', en: 'Italy' }, { value: 'FR', sl: 'Francija', en: 'France' },
  { value: 'GB', sl: 'Združeno kraljestvo', en: 'United Kingdom' }, { value: 'OTHER', sl: 'Drugo', en: 'Other' },
]

const LOCATION_TYPES = [
  { value: 'office',          sl: 'Pisarna',                      en: 'Office',               icon: Building2 },
  { value: 'manufacturing',   sl: 'Proizvodnja',                  en: 'Manufacturing',         icon: Factory },
  { value: 'warehouse',       sl: 'Skladišče',                    en: 'Warehouse',             icon: Warehouse },
  { value: 'retail',          sl: 'Prodajalna',                   en: 'Retail store',          icon: ShoppingBag },
  { value: 'restaurant_cafe', sl: 'Restavracija / kavarna',       en: 'Restaurant / café',     icon: UtensilsCrossed },
  { value: 'hotel',           sl: 'Hotel',                        en: 'Hotel',                 icon: Hotel },
  { value: 'healthcare',      sl: 'Zdravstveni objekt',           en: 'Healthcare facility',   icon: Cross },
  { value: 'education',       sl: 'Šola / izobraževalni center',  en: 'School / education',    icon: GraduationCap },
  { value: 'sports',          sl: 'Športni objekt',               en: 'Sports facility',       icon: Trophy },
  { value: 'datacenter',      sl: 'Podatkovni center',            en: 'Data center',           icon: Server },
  { value: 'logistics',       sl: 'Logistično središče',          en: 'Logistics hub',         icon: Truck },
  { value: 'public',          sl: 'Javna zgradba',                en: 'Public building',       icon: Landmark },
  { value: 'mixed_use',       sl: 'Večnamenska stavba',           en: 'Mixed use',             icon: LayoutGrid },
  { value: 'other',           sl: 'Drugo',                        en: 'Other',                 icon: MapPin },
]

const UTILITIES = [
  { key: 'uses_electricity', sl: 'Ta lokacija uporablja elektriko', en: 'This location uses electricity', descSl: 'Elektrika je najpogostejši vir energije v stavbah po vsem svetu, ki se uporablja za razsvetljavo, ogrevanje, hlajenje in opremo.', descEn: 'Electricity is the most common energy source in buildings worldwide, used for lighting, heating, cooling and equipment.' },
  { key: 'uses_natural_gas', sl: 'Ta lokacija uporablja zemeljski plin', en: 'This location uses natural gas', descSl: 'Zemeljski plin je pogosto gorivo v stavbah po vsem svetu, ki se uporablja za ogrevanje.', descEn: 'Natural gas is a common fuel in buildings worldwide, used for heating.' },
  { key: 'uses_heat', sl: 'Ta lokacija uporablja daljinsko toploto', en: 'This location uses district heating', descSl: 'Toplota, kupljena od zunanjega dobavitelja in dostavljena prek omrežja daljinskega ogrevanja.', descEn: 'Heat purchased from an external supplier and delivered via a district heating network.' },
  { key: 'uses_steam', sl: 'Ta lokacija uporablja paro', en: 'This location uses steam', descSl: 'Para, kupljena od zunanjega dobavitelja in dostavljena prek omrežja.', descEn: 'Steam purchased from an external supplier and delivered via a network.' },
  { key: 'uses_cooling', sl: 'Ta lokacija uporablja daljinsko hlajenje', en: 'This location uses district cooling', descSl: 'Daljinsko hlajenje je redko (< 2 % lokacij). Gre za nakup hladne vode od zunanjega dobavitelja in NI enako navadni klimatski napravi, ki deluje na elektriko in hladilne plina.', descEn: 'District cooling is rare (< 2% of locations). It is the purchase of chilled water from an external supplier and is NOT the same as a regular air conditioner running on electricity and refrigerants.' },
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
  const { t, locale } = useLocale()
  const refreshCounters = useEmissionCountersStore(s => s.refresh)
  const { selectedYear } = usePeriodStore()
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [linkedCounts, setLinkedCounts] = useState<Record<string, number>>({})
  const [linkedDetail, setLinkedDetail] = useState<Record<string, { vehicles: number; equipment: number; emissions: number }>>({})
  const [lockedScopes, setLockedScopes] = useState<Record<string, string[]>>({})
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<LocationForm>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

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
        const [s1a, s1b, s1c, s1d, s1e, s2a, s2b, s2c, s2d, eqRes, vRes, plRes] = await Promise.all([
          supabase.from('scope1_stationary').select('location_id').in('location_id', ids),
          supabase.from('scope1_mobile').select('location_id').in('location_id', ids),
          supabase.from('scope1_equipment_fuel').select('location_id').in('location_id', ids),
          supabase.from('scope1_refrigerants').select('location_id').in('location_id', ids),
          supabase.from('scope1_industrial_gases').select('location_id').in('location_id', ids),
          supabase.from('scope2_electricity').select('location_id').in('location_id', ids),
          supabase.from('scope2_heat').select('location_id').in('location_id', ids),
          supabase.from('scope2_steam').select('location_id').in('location_id', ids),
          supabase.from('scope2_cooling').select('location_id').in('location_id', ids),
          supabase.from('equipment').select('location_id').in('location_id', ids),
          supabase.from('vehicles').select('location_id').in('location_id', ids),
          supabase.from('period_locations').select('location_id, scope_type').in('location_id', ids),
        ])
        const counts: Record<string, number> = {}
        const detail: Record<string, { vehicles: number; equipment: number; emissions: number }> = {}
        const bump = (id: string) => { counts[id] = (counts[id] ?? 0) + 1 }
        const d = (id: string) => detail[id] ?? (detail[id] = { vehicles: 0, equipment: 0, emissions: 0 })
        ;[s1a, s1b, s1c, s1d, s1e, s2a, s2b, s2c, s2d].flatMap(r => r.data ?? []).forEach((r: any) => {
          if (r.location_id) { bump(r.location_id); d(r.location_id).emissions++ }
        })
        ;(eqRes.data ?? []).forEach((r: any) => { if (r.location_id) { bump(r.location_id); d(r.location_id).equipment++ } })
        ;(vRes.data ?? []).forEach((r: any) => { if (r.location_id) { bump(r.location_id); d(r.location_id).vehicles++ } })
        setLinkedCounts(counts)
        setLinkedDetail(detail)
        const locked: Record<string, string[]> = {}
        ;(plRes.data ?? []).forEach((r: any) => {
          if (!locked[r.location_id]) locked[r.location_id] = []
          if (!locked[r.location_id].includes(r.scope_type)) locked[r.location_id].push(r.scope_type)
        })
        setLockedScopes(locked)
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
      await supabase.from('locations').delete().eq('id', id)
      setLocations(prev => prev.filter(l => l.id !== id))
      setLinkedCounts(prev => { const n = { ...prev }; delete n[id]; return n })
      if (selectedYear) refreshCounters(selectedYear)
    } catch {}
  }

  const f = (key: keyof LocationForm, val: any) => setForm(prev => ({ ...prev, [key]: val }))

  const filtered = locations
    .filter(l => !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.city?.toLowerCase().includes(search.toLowerCase()) || l.address?.toLowerCase().includes(search.toLowerCase()))
    .filter(l => !filterType || l.location_type === filterType)
    .filter(l => filterStatus === '' ? true : filterStatus === 'active' ? l.is_active : !l.is_active)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginatedLocations = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 border-b border-gray-200 h-[57px] shrink-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 shrink-0">{t('Lokacije', 'Locations')}</h1>
          <p className="text-sm text-gray-500 truncate">{t('Upravljajte lokacije, kjer vaše podjetje posluje.', 'Manage the locations where your company operates.')}</p>
        </div>
        <button onClick={openNew}
          className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors shrink-0">
          <Plus className="h-3.5 w-3.5" />
          {t('Nova lokacija', 'New location')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="inline-flex items-center gap-2 h-8 px-3 bg-white border border-gray-200 rounded-lg text-[13px] min-w-[180px] focus-within:border-blue-500 transition-colors">
          <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder={t('Iskanje...', 'Search...')}
            className="flex-1 bg-transparent focus:outline-none text-gray-900 placeholder:text-gray-400 text-[13px]"
          />
        </div>
        <label className="inline-flex items-center gap-1.5 h-8 px-3 bg-white border border-gray-200 rounded-lg text-[13px] cursor-pointer hover:bg-[#f6f6f6] transition-colors">
          <span className="text-gray-500">{t('Tip:', 'Type:')}</span>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}
            className="font-medium text-gray-900 bg-transparent focus:outline-none cursor-pointer">
            <option value="">{t('Vsi', 'All')}</option>
            {LOCATION_TYPES.map(lt => <option key={lt.value} value={lt.value}>{locale === 'EN' ? lt.en : lt.sl}</option>)}
          </select>
        </label>
        <label className="inline-flex items-center gap-1.5 h-8 px-3 bg-white border border-gray-200 rounded-lg text-[13px] cursor-pointer hover:bg-[#f6f6f6] transition-colors">
          <span className="text-gray-500">{t('Status:', 'Status:')}</span>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            className="font-medium text-gray-900 bg-transparent focus:outline-none cursor-pointer">
            <option value="">{t('Vsi', 'All')}</option>
            <option value="active">{t('Aktivno', 'Active')}</option>
            <option value="inactive">{t('Neaktivno', 'Inactive')}</option>
          </select>
        </label>
        {(search || filterType || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); setPage(1) }}
            className="h-8 px-3 text-[13px] font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-[#f6f6f6] transition-colors">
            {t('Počisti', 'Clear')}
          </button>
        )}
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
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">{t('Nalaganje...', 'Loading...')}</div>
        ) : !filtered.length ? (
          <>
            {locations.length === 0
              ? <EmptyState icon={MapPin} title={t('Ni lokacij', 'No locations')} subtitle={t('Dodajte prvo lokacijo', 'Add your first location')} />
              : <EmptyState icon={Search} title={t('Ni zadetkov', 'No results')} subtitle={t('Poskusite spremeniti iskanje ali filtre', 'Try changing your search or filters')} />
            }
          </>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Ime lokacije', 'Location name')}</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Naslov', 'Address')}</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Tip', 'Type')}</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Površina', 'Floor area')}</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">{t('Status', 'Status')}</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 border-b border-gray-200">
                  {paginatedLocations.map((loc, i) => (
                    <tr key={loc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{backgroundColor:'#e5eeff',border:'1px solid #d6e5ff'}}>
                            {(() => { const lt = LOCATION_TYPES.find(lt => lt.value === loc.location_type); const Icon = lt?.icon ?? MapPin; return <Icon className="w-3.5 h-3.5" style={{color:'#215bcf'}} /> })()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{loc.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700">
                        {[loc.address, loc.city, loc.postal_code].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{backgroundColor:'#e5eeff',border:'1px solid #d6e5ff',color:'#215bcf'}}>
                          {(() => { const lt = LOCATION_TYPES.find(lt => lt.value === loc.location_type); return lt ? t(lt.sl, lt.en) : '—' })()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700">
                        {loc.floor_area_m2 ? `${loc.floor_area_m2} m²` : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={loc.is_active ? {backgroundColor:'#e0fced',border:'1px solid #d4f8e6',color:'#098259'} : {backgroundColor:'#f1f3f5',border:'1px solid #e9ecef',color:'#868e96'}}>
                          {loc.is_active ? t('Aktivno', 'Active') : t('Neaktivno', 'Inactive')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(loc)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-[#f6f6f6] rounded-md transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ id: loc.id, name: loc.name })}
                            disabled={!!(linkedCounts[loc.id])}
                            title={linkedCounts[loc.id] ? (() => {
                              const d = linkedDetail[loc.id]
                              const parts: string[] = []
                              if (d?.vehicles) parts.push(locale === 'EN' ? `${d.vehicles} vehicle${d.vehicles > 1 ? 's' : ''}` : `${d.vehicles} vozil${d.vehicles === 1 ? 'o' : 'a'}`)
                              if (d?.equipment) parts.push(locale === 'EN' ? `${d.equipment} equipment` : `${d.equipment} oprem${d.equipment === 1 ? 'a' : 'e'}`)
                              if (d?.emissions) parts.push(locale === 'EN' ? `${d.emissions} emission record${d.emissions > 1 ? 's' : ''}` : `${d.emissions} emisijski${d.emissions === 1 ? ' vnos' : ' vnosi'}`)
                              return locale === 'EN' ? `Cannot delete – has ${parts.join(', ')}` : `Ni možno izbrisati – ima ${parts.join(', ')}`
                            })() : undefined}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {editingId ? t('Uredi lokacijo', 'Edit location') : t('Dodaj lokacijo', 'Add location')}
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
                  {t('Ime lokacije', 'Location name')} <span className="text-red-400">*</span>
                </label>
                <input value={form.name} onChange={e => f('name', e.target.value)}
                  placeholder={t('npr. Centralna pisarna Ljubljana', 'e.g. Main Office Ljubljana')}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] placeholder:text-gray-300"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Ulica in hišna številka', 'Street address')}</label>
                <input value={form.address} onChange={e => f('address', e.target.value)}
                  placeholder={t('npr. Dunajska cesta 5', 'e.g. Main Street 5')}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] placeholder:text-gray-300"
                />
              </div>

              {/* City + Postal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Mesto', 'City')}</label>
                  <input value={form.city} onChange={e => f('city', e.target.value)}
                    placeholder={t('Ljubljana', 'Ljubljana')}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Poštna številka', 'Postal code')}</label>
                  <input value={form.postal_code} onChange={e => f('postal_code', e.target.value)}
                    placeholder="1000"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Country + Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Država', 'Country')}</label>
                  <select value={form.country_code} onChange={e => f('country_code', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633]">
                    {COUNTRIES.map(c => <option key={c.value} value={c.value}>{locale === 'EN' ? c.en : c.sl}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Tip lokacije', 'Location type')}</label>
                  <select value={form.location_type} onChange={e => f('location_type', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633]">
                    {LOCATION_TYPES.map(lt => <option key={lt.value} value={lt.value}>{t(lt.sl, lt.en)}</option>)}
                  </select>
                </div>
              </div>

              {/* Floor area */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Površina', 'Floor area')} <span className="text-gray-500 font-normal">({t('neobvezno', 'optional')})</span></label>
                <div className="flex gap-2">
                  <input value={form.floor_area_m2} onChange={e => f('floor_area_m2', e.target.value)}
                    type="number" placeholder={t('npr. 500', 'e.g. 500')}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] placeholder:text-gray-300"
                  />
                  <div className="w-16 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500 flex items-center justify-center">
                    m²
                  </div>
                </div>
              </div>

              {/* Utilities */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">{t('Energenti na tej lokaciji', 'Utilities at this location')}</label>
                <div className="space-y-2">
                  {UTILITIES.map(u => {
                    const SCOPE_MAP: Record<string, string> = {
                      uses_natural_gas: 'stationary',
                      uses_electricity: 'electricity',
                      uses_heat: 'heat',
                      uses_steam: 'steam',
                      uses_cooling: 'cooling',
                    }
                    const isLocked = !!(editingId && lockedScopes[editingId]?.includes(SCOPE_MAP[u.key]))
                    return (
                      <div key={u.key}>
                        <label className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${isLocked ? 'border-blue-200 bg-blue-50/40 cursor-not-allowed' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-100/30 cursor-pointer'} group`}>
                          <div className="relative mt-0.5 shrink-0">
                            <input type="checkbox"
                              checked={!!(form as any)[u.key]}
                              onChange={e => { if (!isLocked) f(u.key as keyof LocationForm, e.target.checked) }}
                              disabled={isLocked}
                              className="sr-only" />
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              (form as any)[u.key] ? 'bg-blue-600 border-blue-600' : 'border-gray-200'
                            } ${isLocked ? 'opacity-60' : ''}`}>
                              {(form as any)[u.key] && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">{locale === 'EN' ? u.en : u.sl}</p>
                          </div>
                        </label>
                        {isLocked && (
                          <p className="mt-1 ml-1 text-xs text-[#215bcf] flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            {t('Ta lokacija ima že poročilo povezano s tem energentom, zato energenta ni več možno odstraniti.', 'This location already has a report linked to this utility and can no longer be removed.')}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Status (edit only) */}
              {editingId && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Status', 'Status')}</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => f('is_active', true)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${form.is_active ? 'bg-gray-100 border-gray-900 text-gray-900' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                      {t('Aktivno', 'Active')}
                    </button>
                    <button type="button" onClick={() => f('is_active', false)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${!form.is_active ? 'bg-gray-100 border-gray-900 text-gray-900' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                      {t('Neaktivno', 'Inactive')}
                    </button>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Opombe', 'Notes')} <span className="text-gray-500 font-normal">({t('neobvezno', 'optional')})</span></label>
                <textarea value={form.notes} onChange={e => f('notes', e.target.value)}
                  rows={2} placeholder={t('Dodatne informacije o lokaciji...', 'Additional information about this location...')}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] placeholder:text-gray-300 resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                {t('Prekliči', 'Cancel')}
              </button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="flex-[2] px-4 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed rounded-xl transition-colors">
                {saving ? t('Shranjevanje...', 'Saving...') : editingId ? t('Shrani spremembe', 'Save changes') : t('Dodaj lokacijo', 'Add location')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
