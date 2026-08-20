'use client'

import { useState, useEffect } from 'react'
import { Wrench, Plus, Pencil, Trash2, X, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { mockEquipment, mockLocations } from '@/lib/mock-data'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { useEmissionCountersStore } from '@/stores/emissionCounters'
import { usePeriodStore } from '@/stores/period'

const PAGE_SIZE = 20

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

// GHG Protocol – stationary combustion fuel types
const FUEL_TYPES = [
  { value: 'natural_gas',       sl: 'Zemeljski plin',                          en: 'Natural Gas' },
  { value: 'diesel',            sl: 'Dizel / Plinsko olje',                    en: 'Diesel / Gas Oil' },
  { value: 'petrol',            sl: 'Bencin',                                  en: 'Gasoline / Petrol' },
  { value: 'lpg',               sl: 'Utekočinjeni naftni plin (LPG)',          en: 'LPG' },
  { value: 'heating_oil',       sl: 'Kurilno olje (ekstra lahko)',              en: 'Heating Oil (light)' },
  { value: 'heavy_fuel_oil',    sl: 'Težko kurilno olje',                      en: 'Heavy Fuel Oil' },
  { value: 'kerosene',          sl: 'Kerozin / Letalsko gorivo',               en: 'Kerosene / Jet Fuel' },
  { value: 'coal_anthracite',   sl: 'Premog – antracit',                       en: 'Coal – Anthracite' },
  { value: 'coal_bituminous',   sl: 'Premog – bituminozni',                    en: 'Coal – Bituminous' },
  { value: 'coal_lignite',      sl: 'Premog – lignit (rjavi premog)',          en: 'Coal – Lignite / Brown Coal' },
  { value: 'coke',              sl: 'Koks',                                    en: 'Coke' },
  { value: 'wood',              sl: 'Les / Polena',                            en: 'Wood / Logs' },
  { value: 'wood_chips',        sl: 'Lesni sekanci',                           en: 'Wood Chips' },
  { value: 'wood_pellets',      sl: 'Lesne pelete',                            en: 'Wood Pellets' },
  { value: 'biogas',            sl: 'Bioplin',                                 en: 'Biogas' },
  { value: 'biodiesel',         sl: 'Biodizel',                                en: 'Biodiesel (B100)' },
  { value: 'msw',               sl: 'Mešani komunalni odpadki',                en: 'Municipal Solid Waste' },
  { value: 'propane',           sl: 'Propan',                                  en: 'Propane' },
  { value: 'butane',            sl: 'Butan',                                   en: 'Butane' },
  { value: 'other',             sl: 'Drugo',                                   en: 'Other' },
]

// GHG Protocol – refrigerant substances (HFCs, PFCs, HFOs, other)
const REFRIGERANT_TYPES = [
  { group: 'HFC', value: 'r134a',   sl: 'R-134a (HFC-134a)',                  en: 'R-134a (HFC-134a)' },
  { group: 'HFC', value: 'r404a',   sl: 'R-404A (HFC blend)',                 en: 'R-404A (HFC blend)' },
  { group: 'HFC', value: 'r410a',   sl: 'R-410A (HFC blend)',                 en: 'R-410A (HFC blend)' },
  { group: 'HFC', value: 'r407c',   sl: 'R-407C (HFC blend)',                 en: 'R-407C (HFC blend)' },
  { group: 'HFC', value: 'r32',     sl: 'R-32 (HFC-32)',                      en: 'R-32 (HFC-32)' },
  { group: 'HFC', value: 'r125',    sl: 'R-125 (HFC-125)',                    en: 'R-125 (HFC-125)' },
  { group: 'HFC', value: 'r143a',   sl: 'R-143a (HFC-143a)',                  en: 'R-143a (HFC-143a)' },
  { group: 'HFC', value: 'r152a',   sl: 'R-152a (HFC-152a)',                  en: 'R-152a (HFC-152a)' },
  { group: 'HFC', value: 'r23',     sl: 'R-23 (HFC-23)',                      en: 'R-23 (HFC-23)' },
  { group: 'HFC', value: 'r227ea',  sl: 'R-227ea (HFC-227ea)',                en: 'R-227ea (HFC-227ea)' },
  { group: 'HFC', value: 'r236fa',  sl: 'R-236fa (HFC-236fa)',                en: 'R-236fa (HFC-236fa)' },
  { group: 'HFC', value: 'r22',     sl: 'R-22 (HCFC-22) – v izginotju',      en: 'R-22 (HCFC-22) – being phased out' },
  { group: 'HFO', value: 'r1234yf', sl: 'R-1234yf (HFO)',                     en: 'R-1234yf (HFO)' },
  { group: 'HFO', value: 'r1234ze', sl: 'R-1234ze (HFO)',                     en: 'R-1234ze (HFO)' },
  { group: 'PFC', value: 'r14',     sl: 'R-14 / CF₄ (PFC)',                   en: 'R-14 / CF₄ (PFC)' },
  { group: 'PFC', value: 'r116',    sl: 'R-116 / C₂F₆ (PFC)',                en: 'R-116 / C₂F₆ (PFC)' },
  { group: 'Other', value: 'sf6_r',   sl: 'SF₆ (žveplov heksafluorid)',       en: 'SF₆ (Sulfur Hexafluoride)' },
  { group: 'Other', value: 'r717',    sl: 'R-717 (amoniak NH₃)',              en: 'R-717 (Ammonia NH₃)' },
  { group: 'Other', value: 'r290',    sl: 'R-290 (propan)',                   en: 'R-290 (Propane)' },
  { group: 'Other', value: 'r600a',   sl: 'R-600a (izobutan)',                en: 'R-600a (Isobutane)' },
  { group: 'Other', value: 'r744',    sl: 'R-744 (CO₂)',                      en: 'R-744 (CO₂)' },
  { group: 'Other', value: 'other',   sl: 'Drugo',                            en: 'Other' },
]

// GHG Protocol – industrial gas substances
const INDUSTRIAL_GAS_TYPES = [
  { value: 'co2',    sl: 'CO₂ – ogljikov dioksid',                   en: 'CO₂ – Carbon Dioxide' },
  { value: 'ch4',    sl: 'CH₄ – metan',                              en: 'CH₄ – Methane' },
  { value: 'n2o',    sl: 'N₂O – didušikov oksid',                    en: 'N₂O – Nitrous Oxide' },
  { value: 'sf6',    sl: 'SF₆ – žveplov heksafluorid',              en: 'SF₆ – Sulfur Hexafluoride' },
  { value: 'nf3',    sl: 'NF₃ – dušikov trifluorid',                en: 'NF₃ – Nitrogen Trifluoride' },
  { value: 'cf4',    sl: 'CF₄ – tetrafluorometan (PFC-14)',         en: 'CF₄ – Tetrafluoromethane (PFC-14)' },
  { value: 'c2f6',   sl: 'C₂F₆ – heksafluoroetan (PFC-116)',       en: 'C₂F₆ – Hexafluoroethane (PFC-116)' },
  { value: 'c3f8',   sl: 'C₃F₈ – oktafluoropropan (PFC-218)',      en: 'C₃F₈ – Octafluoropropane (PFC-218)' },
  { value: 'hfc_mix',sl: 'Mešanica HFC',                            en: 'HFC mixture' },
  { value: 'other',  sl: 'Drugo',                                    en: 'Other' },
]

// Fuel combustion equipment types (per Persefoni)
const FUEL_EQUIPMENT_TYPES = [
  { value: 'boiler',     sl: 'Kotel',                               en: 'Boiler' },
  { value: 'burner',     sl: 'Gorilnik',                            en: 'Burner' },
  { value: 'dryer',      sl: 'Sušilnik',                            en: 'Dryer' },
  { value: 'flare',      sl: 'Bakla',                               en: 'Flare' },
  { value: 'furnace',    sl: 'Industrijska peč',                    en: 'Furnace' },
  { value: 'generator',  sl: 'Generator',                           en: 'Generator' },
  { value: 'heater',     sl: 'Grelnik',                             en: 'Heater' },
  { value: 'incinerator',sl: 'Sežigalnik',                          en: 'Incinerator' },
  { value: 'ice',        sl: 'Motor z notranjim izgorevanjem',      en: 'Internal Combustion Engine' },
  { value: 'kiln',       sl: 'Peč za žganje (kilna)',               en: 'Kiln' },
  { value: 'open_burning',sl: 'Odprto kurjenje',                    en: 'Open Burning' },
  { value: 'oven',       sl: 'Pečica / Kuhalna peč',               en: 'Oven' },
  { value: 'thermal_oxidizer', sl: 'Termalni oksidator',            en: 'Thermal Oxidizer' },
  { value: 'turbine',    sl: 'Turbina',                             en: 'Turbine' },
  { value: 'other',      sl: 'Drugo',                               en: 'Other' },
]

// Refrigerant equipment types
const REFRIGERANT_EQUIPMENT_TYPES = [
  { value: 'chillers',              sl: 'Hladilniki (chillerji)',                                    en: 'Chillers' },
  { value: 'domestic_refrigeration',sl: 'Gospodinjski hladilniki',                                  en: 'Domestic Refrigeration' },
  { value: 'industrial_refrigeration', sl: 'Industrijska hladilna tehnika in predelava hrane',      en: 'Industrial Refrigeration incl. Food Processing & Cold Storage' },
  { value: 'commercial_refrigeration', sl: 'Srednji in veliki komercialni hladilniki',              en: 'Medium & Large Commercial Refrigeration' },
  { value: 'mobile_ac',            sl: 'Mobilna klimatizacija',                                     en: 'Mobile Air Conditioning' },
  { value: 'residential_ac',       sl: 'Stanovanjske in poslovne klimatske naprave (toplotne črpalke)', en: 'Residential & Commercial A/C incl. Heat Pumps' },
  { value: 'standalone_commercial',sl: 'Samostojne komercialne hladilne naprave',                   en: 'Stand-alone Commercial Applications' },
  { value: 'transport_refrigeration', sl: 'Transportna hladilna tehnika',                           en: 'Transport Refrigeration' },
  { value: 'other',                sl: 'Drugo',                                                     en: 'Other' },
]

// Industrial gas equipment types
const INDUSTRIAL_GAS_EQUIPMENT_TYPES = [
  { value: 'fixed_fire_suppression',    sl: 'Fiksna oprema za gašenje požarov',    en: 'Fixed Fire Suppression Equipment' },
  { value: 'portable_fire_suppression', sl: 'Prenosna oprema za gašenje požarov',  en: 'Portable Fire Suppression Equipment' },
  { value: 'other',                     sl: 'Drugo',                               en: 'Other' },
]

const EMPTY_FORM = {
  name: '',
  uses_fuel: false,
  uses_refrigerants: false,
  uses_industrial_gases: false,
  fuel_equipment_type: 'boiler',
  fuel_type: 'natural_gas',
  refrigerant_equipment_type: 'chillers',
  refrigerant_type: 'r134a',
  industrial_gas_equipment_type: 'fixed_fire_suppression',
  industrial_gas_type: 'sf6',
  location_id: '',
  notes: '',
  is_active: true,
}

type EquipmentForm = typeof EMPTY_FORM

// Badge colors per primary category
const CATEGORY_COLORS: Record<string, string> = {
  fuel:           'bg-orange-50 text-orange-600',
  refrigerants:   'bg-cyan-50 text-cyan-600',
  industrial_gas: 'bg-purple-50 text-purple-600',
  multiple:       'bg-[#efefef] text-[#0f0f10]',
}

const INPUT = 'w-full px-3 py-2 text-sm bg-white border border-[#ececec] rounded-lg focus:outline-none focus:border-[#0f0f10] focus:shadow-[0_0_0_2px_#0f0f1033] placeholder:text-gray-300 transition-shadow'
const SELECT = 'w-full px-3 py-2 text-sm bg-white border border-[#ececec] rounded-lg focus:outline-none focus:border-[#0f0f10] focus:shadow-[0_0_0_2px_#0f0f1033] transition-shadow appearance-none cursor-pointer'

function getLabel(list: { value: string; sl: string; en: string }[], val: string, locale: string) {
  const item = list.find(x => x.value === val)
  return item ? (locale === 'EN' ? item.en : item.sl) : val
}

function getPrimaryCategory(eq: any) {
  const count = [eq.uses_fuel, eq.uses_refrigerants, eq.uses_industrial_gases].filter(Boolean).length
  if (count > 1) return 'multiple'
  if (eq.uses_fuel) return 'fuel'
  if (eq.uses_refrigerants) return 'refrigerants'
  if (eq.uses_industrial_gases) return 'industrial_gas'
  return 'fuel'
}

export default function EquipmentPage() {
  const { t, locale } = useLocale()
  const refreshCounters = useEmissionCountersStore(s => s.refresh)
  const { selectedYear } = usePeriodStore()
  const [equipment, setEquipment] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [linkedCounts, setLinkedCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EquipmentForm>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterFuelType, setFilterFuelType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    if (IS_MOCK) {
      setEquipment(mockEquipment)
      setLocations(mockLocations)
      setLoading(false)
      return
    }
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return
      const [{ data: eq }, { data: locs }] = await Promise.all([
        supabase.from('equipment').select('*, locations(name)').eq('organization_id', org.id).order('created_at'),
        supabase.from('locations').select('id, name').eq('organization_id', org.id).eq('is_active', true).order('name'),
      ])
      setEquipment(eq ?? [])
      setLocations(locs ?? [])

      const ids = (eq ?? []).map((e: any) => e.id)
      if (ids.length > 0) {
        const [{ data: d1 }, { data: d2 }, { data: d3 }] = await Promise.all([
          supabase.from('scope1_equipment_fuel').select('equipment_id').in('equipment_id', ids),
          supabase.from('scope1_refrigerants').select('equipment_id').in('equipment_id', ids),
          supabase.from('scope1_industrial_gases').select('equipment_id').in('equipment_id', ids),
        ])
        const counts: Record<string, number> = {}
        ;[...(d1 ?? []), ...(d2 ?? []), ...(d3 ?? [])].forEach((r: any) => {
          counts[r.equipment_id] = (counts[r.equipment_id] ?? 0) + 1
        })
        setLinkedCounts(counts)
      }
    } catch { setEquipment(mockEquipment); setLocations(mockLocations) }
    setLoading(false)
  }

  function openNew() {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setError('')
    setShowModal(true)
  }

  function openEdit(eq: any) {
    setForm({
      name: eq.name ?? '',
      uses_fuel: eq.uses_fuel ?? false,
      uses_refrigerants: eq.uses_refrigerants ?? false,
      uses_industrial_gases: eq.uses_industrial_gases ?? false,
      fuel_equipment_type: eq.fuel_equipment_type ?? 'boiler',
      fuel_type: eq.fuel_type ?? 'natural_gas',
      refrigerant_equipment_type: eq.refrigerant_equipment_type ?? 'chillers',
      refrigerant_type: eq.refrigerant_type ?? 'r134a',
      industrial_gas_equipment_type: eq.industrial_gas_equipment_type ?? 'fixed_fire_suppression',
      industrial_gas_type: eq.industrial_gas_type ?? 'sf6',
      location_id: eq.location_id ?? '',
      notes: eq.notes ?? '',
      is_active: eq.is_active ?? true,
    })
    setEditingId(eq.id)
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError(t('Naziv opreme je obvezen.', 'Equipment name is required.'))
      return
    }
    if (!form.uses_fuel && !form.uses_refrigerants && !form.uses_industrial_gases) {
      setError(t('Izberite vsaj eno kategorijo (gorivo, hladiva ali industrijski plini).', 'Select at least one category (fuel, refrigerants, or industrial gases).'))
      return
    }
    setSaving(true); setError('')

    if (IS_MOCK) {
      if (editingId) {
        setEquipment(prev => prev.map(e => e.id === editingId ? { ...e, ...form } : e))
      } else {
        setEquipment(prev => [...prev, { ...form, id: crypto.randomUUID(), is_active: true }])
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
        uses_fuel: form.uses_fuel,
        uses_refrigerants: form.uses_refrigerants,
        uses_industrial_gases: form.uses_industrial_gases,
        fuel_equipment_type: form.uses_fuel ? form.fuel_equipment_type : null,
        fuel_type: form.uses_fuel ? form.fuel_type : null,
        refrigerant_equipment_type: form.uses_refrigerants ? form.refrigerant_equipment_type : null,
        refrigerant_type: form.uses_refrigerants ? form.refrigerant_type : null,
        industrial_gas_equipment_type: form.uses_industrial_gases ? form.industrial_gas_equipment_type : null,
        industrial_gas_type: form.uses_industrial_gases ? form.industrial_gas_type : null,
        location_id: form.location_id || null,
        notes: form.notes || null,
        is_active: form.is_active,
      }

      let dbError
      if (editingId) {
        const { error } = await supabase.from('equipment').update(payload).eq('id', editingId)
        dbError = error
      } else {
        const { error } = await supabase.from('equipment').insert({ ...payload, organization_id: org.id })
        dbError = error
      }

      if (dbError) { setError(dbError.message); setSaving(false); return }
      await load()
      if (selectedYear) refreshCounters(selectedYear)
      setShowModal(false)
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  async function confirmAndDelete() {
    if (!confirmDelete) return
    const { id } = confirmDelete
    setConfirmDelete(null)
    if (IS_MOCK) { setEquipment(prev => prev.filter(e => e.id !== id)); return }
    try {
      const supabase = createClient()
      await supabase.from('equipment').update({ is_active: false }).eq('id', id)
      setEquipment(prev => prev.filter(e => e.id !== id))
      setLinkedCounts(prev => { const n = { ...prev }; delete n[id]; return n })
    } catch {}
  }

  const f = (key: keyof EquipmentForm, val: any) => setForm(prev => ({ ...prev, [key]: val }))

  const filtered = equipment
    .filter(eq => !search || eq.name?.toLowerCase().includes(search.toLowerCase()) || eq.locations?.name?.toLowerCase().includes(search.toLowerCase()))
    .filter(eq => !filterCategory || (filterCategory === 'fuel' && eq.uses_fuel) || (filterCategory === 'refrigerants' && eq.uses_refrigerants) || (filterCategory === 'industrial_gas' && eq.uses_industrial_gases))
    .filter(eq => !filterFuelType || eq.fuel_type === filterFuelType || eq.refrigerant_type === filterFuelType || eq.industrial_gas_type === filterFuelType)
    .filter(eq => filterStatus === '' ? true : filterStatus === 'active' ? eq.is_active : !eq.is_active)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginatedEquipment = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function getCategoryBadges(eq: any) {
    const badges = []
    if (eq.uses_fuel) badges.push({ key: 'fuel', sl: 'Gorivo', en: 'Fuel' })
    if (eq.uses_refrigerants) badges.push({ key: 'refrigerants', sl: 'Hladiva', en: 'Refrigerants' })
    if (eq.uses_industrial_gases) badges.push({ key: 'industrial_gas', sl: 'Ind. plini', en: 'Ind. gases' })
    return badges
  }

  function getEquipmentSubtitle(eq: any) {
    const parts: string[] = []
    if (eq.uses_fuel && eq.fuel_equipment_type)
      parts.push(getLabel(FUEL_EQUIPMENT_TYPES, eq.fuel_equipment_type, locale))
    if (eq.uses_refrigerants && eq.refrigerant_equipment_type)
      parts.push(getLabel(REFRIGERANT_EQUIPMENT_TYPES, eq.refrigerant_equipment_type, locale))
    if (eq.uses_industrial_gases && eq.industrial_gas_equipment_type)
      parts.push(getLabel(INDUSTRIAL_GAS_EQUIPMENT_TYPES, eq.industrial_gas_equipment_type, locale))
    return parts.join(' · ')
  }

  const badgeColors: Record<string, string> = {
    fuel: 'bg-orange-50 text-orange-600',
    refrigerants: 'bg-cyan-50 text-cyan-600',
    industrial_gas: 'bg-purple-50 text-purple-600',
  }

  function EquipmentEmoji({ eq }: { eq: any }) {
    const fuelEmoji: Record<string, string> = {
      boiler: '♨️',   // steam/boiler
      burner: '♨️',
      dryer: '🌀',    // spinning drum
      flare: '💨',
      furnace: '⚙️',
      generator: '⚡',
      heater: '🌡️',
      incinerator: '⚙️',
      ice: '⚙️',      // internal combustion engine = gear
      kiln: '⚙️',
      open_burning: '💨',
      oven: '⚙️',
      thermal_oxidizer: '⚙️',
      turbine: '🌀',
      other: '⚙️',
    }
    const refrigEmoji: Record<string, string> = {
      chillers: '❄️',
      domestic_refrigeration: '❄️',
      industrial_refrigeration: '❄️',
      commercial_refrigeration: '❄️',
      mobile_ac: '❄️',
      residential_ac: '❄️',
      standalone_commercial: '❄️',
      transport_refrigeration: '❄️',
      other: '❄️',
    }
    const gasEmoji: Record<string, string> = {
      fixed_fire_suppression: '🧯',
      portable_fire_suppression: '🧯',
      other: '⚗️',
    }
    const emoji = eq.uses_fuel
      ? (fuelEmoji[eq.fuel_equipment_type] ?? '⚙️')
      : eq.uses_refrigerants
      ? (refrigEmoji[eq.refrigerant_equipment_type] ?? '❄️')
      : eq.uses_industrial_gases
      ? (gasEmoji[eq.industrial_gas_equipment_type] ?? '⚗️')
      : '⚙️'
    return <span className="text-lg leading-none">{emoji}</span>
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#0f0f10]">{t('Oprema', 'Equipment')}</h1>
          <p className="text-sm text-[#767676] mt-1">{t('Kotli, generatorji, hladilniki in druga stacionarna oprema, ki porablja gorivo ali hladilne pline.', 'Boilers, generators, refrigeration units and other stationary equipment consuming fuel or refrigerants.')}</p>
        </div>
        <button onClick={openNew}
          className="inline-flex items-center gap-2 bg-[#0f0f10] hover:bg-[#2a2a2b] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Plus className="h-4 w-4" />
          {t('Nova oprema', 'New equipment')}
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
                <h3 className="text-base font-bold text-[#031f18]">{t('Izbriši opremo', 'Delete equipment')}</h3>
                <p className="text-sm text-[#767676] mt-0.5">
                  {t(`Ali ste prepričani, da želite izbrisati "${confirmDelete.name}"? Tega dejanja ni mogoče razveljaviti.`,
                     `Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.`)}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-[#031f18] bg-white border border-[#ececec] rounded-xl hover:bg-[#f9f9f9] transition-colors">
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
      {!loading && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="inline-flex items-center gap-2 h-9 px-3 bg-white border border-[#ececec] rounded-xl text-[13px] min-w-[180px] focus-within:border-[#0f0f10] transition-colors">
            <Search className="h-3.5 w-3.5 text-[#767676] shrink-0" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder={t('Iskanje...', 'Search...')}
              className="flex-1 bg-transparent focus:outline-none text-[#0f0f10] placeholder:text-[#767676] text-[13px]" />
          </div>
          <label className="inline-flex items-center gap-1.5 h-9 px-3 bg-white border border-[#ececec] rounded-xl text-[13px] cursor-pointer hover:bg-[#fafafa] has-[:focus]:border-[#0f0f10] transition-colors">
            <span className="text-[#767676]">{t('Kategorija:', 'Category:')}</span>
            <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
              className="font-medium text-[#0f0f10] bg-transparent focus:outline-none cursor-pointer">
              <option value="">{t('Vse', 'All')}</option>
              <option value="fuel">{t('Gorivo', 'Fuel')}</option>
              <option value="refrigerants">{t('Hladiva', 'Refrigerants')}</option>
              <option value="industrial_gas">{t('Ind. plini', 'Industrial gases')}</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-1.5 h-9 px-3 bg-white border border-[#ececec] rounded-xl text-[13px] cursor-pointer hover:bg-[#fafafa] has-[:focus]:border-[#0f0f10] transition-colors">
            <span className="text-[#767676]">{t('Energent:', 'Substance:')}</span>
            <select value={filterFuelType} onChange={e => { setFilterFuelType(e.target.value); setPage(1) }}
              className="font-medium text-[#0f0f10] bg-transparent focus:outline-none cursor-pointer">
              <option value="">{t('Vsi', 'All')}</option>
              {FUEL_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.sl}</option>)}
              {REFRIGERANT_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.sl}</option>)}
              {INDUSTRIAL_GAS_TYPES.map(gt => <option key={gt.value} value={gt.value}>{gt.sl}</option>)}
            </select>
          </label>
          <label className="inline-flex items-center gap-1.5 h-9 px-3 bg-white border border-[#ececec] rounded-xl text-[13px] cursor-pointer hover:bg-[#fafafa] has-[:focus]:border-[#0f0f10] transition-colors">
            <span className="text-[#767676]">{t('Status:', 'Status:')}</span>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
              className="font-medium text-[#0f0f10] bg-transparent focus:outline-none cursor-pointer">
              <option value="">{t('Vsi', 'All')}</option>
              <option value="active">{t('Aktivno', 'Active')}</option>
              <option value="inactive">{t('Neaktivno', 'Inactive')}</option>
            </select>
          </label>
          {(search || filterCategory || filterFuelType || filterStatus) && (
            <button onClick={() => { setSearch(''); setFilterCategory(''); setFilterFuelType(''); setFilterStatus(''); setPage(1) }}
              className="h-9 px-3 text-[13px] font-medium text-[#767676] bg-white border border-[#ececec] rounded-xl hover:bg-[#fafafa] transition-colors">
              {t('Počisti', 'Clear')}
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-[#ececec] rounded-xl p-12 text-center text-sm text-[#767676]">{t('Nalaganje...', 'Loading...')}</div>
      ) : !equipment.length ? (
        <div className="bg-white border border-[#ececec] rounded-xl">
          <EmptyState
            icon={Wrench}
            title={t('Ni opreme', 'No equipment')}
            subtitle={t('Dodajte prvi kos opreme', 'Add your first piece of equipment')}
          />
        </div>
      ) : !filtered.length ? (
        <div className="bg-white border border-[#ececec] rounded-xl">
          <EmptyState icon={Search} title={t('Ni zadetkov', 'No results')} subtitle={t('Poskusite spremeniti iskanje ali filtre', 'Try changing your search or filters')} />
        </div>
      ) : (
        <div className="bg-white border border-[#ececec] rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#fafafc]">
              <tr className="border-b border-[#ececec] bg-[#f9f9f9]/50">
                <th className="text-left text-xs font-semibold text-[#767676] uppercase tracking-wider px-5 py-3">{t('Naprava', 'Device')}</th>
                <th className="text-left text-xs font-semibold text-[#767676] uppercase tracking-wider px-5 py-3">{t('Kategorija', 'Category')}</th>
                <th className="text-left text-xs font-semibold text-[#767676] uppercase tracking-wider px-5 py-3">{t('Energent', 'Fuel / substance')}</th>
                <th className="text-left text-xs font-semibold text-[#767676] uppercase tracking-wider px-5 py-3">{t('Lokacija', 'Location')}</th>
                <th className="text-left text-xs font-semibold text-[#767676] uppercase tracking-wider px-5 py-3">{t('Status', 'Status')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginatedEquipment.map((eq, i) => {
                const badges = getCategoryBadges(eq)
                const subtitle = getEquipmentSubtitle(eq)
                return (
                  <tr key={eq.id} className={`hover:bg-[#f9f9f9] transition-colors ${i !== 0 ? 'border-t border-[#ececec]' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#fafafa] rounded-lg flex items-center justify-center shrink-0">
                          <EquipmentEmoji eq={eq} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#031f18]">{eq.name}</p>
                          {subtitle && <p className="text-xs text-[#767676] mt-0.5">{subtitle}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {badges.length === 0 ? (
                          <span className="text-xs text-[#767676]">—</span>
                        ) : badges.map(b => (
                          <span key={b.key} className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColors[b.key]}`}>
                            {locale === 'EN' ? b.en : b.sl}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#767676]">
                      {eq.uses_fuel && eq.fuel_type
                        ? getLabel(FUEL_TYPES, eq.fuel_type, locale)
                        : eq.uses_refrigerants && eq.refrigerant_type
                        ? getLabel(REFRIGERANT_TYPES, eq.refrigerant_type, locale)
                        : eq.uses_industrial_gases && eq.industrial_gas_type
                        ? getLabel(INDUSTRIAL_GAS_TYPES, eq.industrial_gas_type, locale)
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-[#767676]">{eq.locations?.name ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${eq.is_active ? 'bg-[#f5f5f5] text-[#0f0f10]' : 'bg-[#fafafa] text-[#767676]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${eq.is_active ? 'bg-[#f5f5f5]0' : 'bg-gray-400'}`} />
                        {eq.is_active ? t('Aktivno', 'Active') : t('Neaktivno', 'Inactive')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(eq)}
                          className="p-1.5 text-[#767676] hover:text-[#0f0f10] hover:bg-[#efefef] rounded-lg transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ id: eq.id, name: eq.name })}
                          disabled={!!(linkedCounts[eq.id])}
                          title={linkedCounts[eq.id] ? t(`Ni možno izbrisati – ${linkedCounts[eq.id]} vezanih emisij`, `Cannot delete – ${linkedCounts[eq.id]} linked emission records`) : undefined}
                          className="p-1.5 text-[#767676] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-[#767676] disabled:hover:bg-transparent">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            <div className="sticky top-0 bg-white border-b border-[#ececec] px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-[#031f18]">
                  {editingId ? t('Uredi opremo', 'Edit equipment') : t('Dodaj opremo', 'Add equipment')}
                </h2>
                <p className="text-xs text-[#767676] mt-0.5">
                  {t('Stacionarna oprema z neposrednimi emisijami (Obseg 1)', 'Stationary equipment with direct emissions (Scope 1)')}
                </p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="p-2 text-[#767676] hover:text-[#767676] hover:bg-[#fafafa] rounded-xl transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-[#031f18] mb-1">
                  {t('Kako se imenuje ta oprema ali naprava?', 'What is the name or ID of this equipment?')} <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={e => f('name', e.target.value)}
                  placeholder={t('npr. Plinski kotel – pisarna', 'e.g. Gas boiler – office')}
                  className={INPUT}
                  autoFocus
                />
                <p className="text-xs text-[#767676] mt-1">
                  {t('Dajte opremi ime ali ID za lažjo identifikacijo.', 'Give this equipment a name or ID to make it easier to identify later.')}
                </p>
              </div>

              {/* Category checkboxes */}
              <div>
                <label className="block text-sm font-semibold text-[#031f18] mb-1">
                  {t('Izberite ustrezno. Podatke lahko kadarkoli posodobite.', 'Please select the following that apply. You can always update these later.')} <span className="text-red-400">*</span>
                </label>
                <div className="space-y-3 mt-3">

                  {/* Fuel */}
                  <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${form.uses_fuel ? 'border-blue-500 bg-[#efefef]/40' : 'border-[#ececec] hover:border-[#ececec]'}`}>
                    <input
                      type="radio"
                      name="equipment_category"
                      checked={form.uses_fuel}
                      onChange={() => setForm(prev => ({ ...prev, uses_fuel: true, uses_refrigerants: false, uses_industrial_gases: false }))}
                      className="mt-0.5 h-4 w-4 accent-[#0f0f10] shrink-0"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#031f18]">{t('Ta oprema porablja gorivo', 'This equipment consumes fuel')}</p>
                      <p className="text-xs text-[#767676] mt-0.5 leading-relaxed">
                        {t(
                          'Izberite, če naprava deluje na gorivo (bencin, dizel, zemeljski plin itd.). Da bi se izognili dvojnemu štetju: če ste porabo zemeljskega plina že zajeli na ravni lokacije, sem kotlov na zemeljski plin ni treba dodajati.',
                          'Select this if your equipment runs on fuel (gasoline, diesel, etc.). To avoid double counting, if you\'ve already accounted for natural gas usage at the facility level, there\'s no need to add natural gas boilers as equipment here.'
                        )}
                      </p>
                    </div>
                  </label>

                  {/* Refrigerants */}
                  <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${form.uses_refrigerants ? 'border-blue-500 bg-[#efefef]/40' : 'border-[#ececec] hover:border-[#ececec]'}`}>
                    <input
                      type="radio"
                      name="equipment_category"
                      checked={form.uses_refrigerants}
                      onChange={() => setForm(prev => ({ ...prev, uses_fuel: false, uses_refrigerants: true, uses_industrial_gases: false }))}
                      className="mt-0.5 h-4 w-4 accent-[#0f0f10] shrink-0"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#031f18]">{t('Ta oprema uporablja hladiva', 'This equipment uses refrigerants')}</p>
                      <p className="text-xs text-[#767676] mt-0.5 leading-relaxed">
                        {t(
                          'Izberite, če vaše podjetje kupuje hladiva za opremo, ki je v lasti vaše organizacije, vključno z mobilno klimatizacijo, hladilniki, maloprodajno zamrzovalno opremo, hladilnim transportom itd.',
                          'Select this if your company purchases refrigerants used by equipment owned by your organization including mobile air conditioning, chillers, retail food refrigeration, refrigerated transport, etc.'
                        )}
                      </p>
                    </div>
                  </label>

                  {/* Industrial gases */}
                  <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${form.uses_industrial_gases ? 'border-blue-500 bg-[#efefef]/40' : 'border-[#ececec] hover:border-[#ececec]'}`}>
                    <input
                      type="radio"
                      name="equipment_category"
                      checked={form.uses_industrial_gases}
                      onChange={() => setForm(prev => ({ ...prev, uses_fuel: false, uses_refrigerants: false, uses_industrial_gases: true }))}
                      className="mt-0.5 h-4 w-4 accent-[#0f0f10] shrink-0"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#031f18]">{t('Ta oprema uporablja industrijske pline', 'This equipment uses industrial gases')}</p>
                      <p className="text-xs text-[#767676] mt-0.5 leading-relaxed">
                        {t(
                          'Izberite, če vaše podjetje kupuje industrijske pline, kot so ogljikov dioksid, metan, didušikov oksid, žveplov heksafluorid in dušikov trifluorid, ki se uporabljajo v proizvodnji, testiranju ali laboratorijskih aplikacijah.',
                          'Select this if your company purchases industrial gases, such as carbon dioxide, methane, nitrous oxide, sulfur hexafluoride, and nitrogen trifluoride, used in manufacturing, testing, or laboratory applications.'
                        )}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Electricity info box */}
              {!form.uses_fuel && !form.uses_refrigerants && !form.uses_industrial_gases && (
                <div className="bg-[#f9f9f9] border border-[#ececec] rounded-xl px-4 py-3">
                  <p className="text-xs text-[#767676] leading-relaxed">
                    {t(
                      'Iščete možnost sledenja porabe elektrike po opremi? Elektriko boste zajeli v razdelku za lokacije, ko dodate lokacijo.',
                      'Looking for the option to track electricity by equipment? You\'ll track your electricity usage in the utilities section when you add a location.'
                    )}
                  </p>
                </div>
              )}

              {/* Fuel: equipment type → then fuel substance */}
              {form.uses_fuel && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#031f18] mb-1.5">
                      {t('Katera vrsta opreme porablja gorivo?', 'What kind of fuel-burning equipment is this?')} <span className="text-red-400">*</span>
                    </label>
                    <select value={form.fuel_equipment_type} onChange={e => f('fuel_equipment_type', e.target.value)} className={SELECT}>
                      {FUEL_EQUIPMENT_TYPES.map(et => (
                        <option key={et.value} value={et.value}>{locale === 'EN' ? et.en : et.sl}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#031f18] mb-1.5">
                      {t('Kateri energent uporablja ta oprema?', 'What fuel does this equipment use?')} <span className="text-red-400">*</span>
                    </label>
                    <select value={form.fuel_type} onChange={e => f('fuel_type', e.target.value)} className={SELECT}>
                      {FUEL_TYPES.map(ft => (
                        <option key={ft.value} value={ft.value}>{locale === 'EN' ? ft.en : ft.sl}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Refrigerants: equipment type → then refrigerant substance */}
              {form.uses_refrigerants && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#031f18] mb-1.5">
                      {t('Katera vrsta hladilne opreme je to?', 'What kind of refrigerant-using equipment is this?')} <span className="text-red-400">*</span>
                    </label>
                    <select value={form.refrigerant_equipment_type} onChange={e => f('refrigerant_equipment_type', e.target.value)} className={SELECT}>
                      {REFRIGERANT_EQUIPMENT_TYPES.map(et => (
                        <option key={et.value} value={et.value}>{locale === 'EN' ? et.en : et.sl}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#031f18] mb-1.5">
                      {t('Katero hladivo uporablja ta oprema?', 'Which refrigerant does this equipment use?')} <span className="text-red-400">*</span>
                    </label>
                    <select value={form.refrigerant_type} onChange={e => f('refrigerant_type', e.target.value)} className={SELECT}>
                      {REFRIGERANT_TYPES.map(rt => (
                        <option key={rt.value} value={rt.value}>{locale === 'EN' ? rt.en : rt.sl}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Industrial gases: equipment type → then gas substance */}
              {form.uses_industrial_gases && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#031f18] mb-1.5">
                      {t('Katera vrsta opreme z industrijskimi plini je to?', 'What kind of industrial gas equipment is this?')} <span className="text-red-400">*</span>
                    </label>
                    <select value={form.industrial_gas_equipment_type} onChange={e => f('industrial_gas_equipment_type', e.target.value)} className={SELECT}>
                      {INDUSTRIAL_GAS_EQUIPMENT_TYPES.map(et => (
                        <option key={et.value} value={et.value}>{locale === 'EN' ? et.en : et.sl}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#031f18] mb-1.5">
                      {t('Kateri industrijski plin uporablja ta oprema?', 'Which industrial gas does this equipment use?')} <span className="text-red-400">*</span>
                    </label>
                    <select value={form.industrial_gas_type} onChange={e => f('industrial_gas_type', e.target.value)} className={SELECT}>
                      {INDUSTRIAL_GAS_TYPES.map(gt => (
                        <option key={gt.value} value={gt.value}>{locale === 'EN' ? gt.en : gt.sl}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="block text-sm font-semibold text-[#031f18]">
                    {t('Kje se nahaja ta oprema?', 'Where is this equipment located?')}
                    {' '}<span className="text-[#767676] font-normal text-xs">({t('neobvezno', 'optional')})</span>
                  </label>
                  <span className="text-xs font-medium text-amber-600 border border-amber-400 rounded-full px-2 py-0.5 shrink-0">
                    {t('Priporočeno', 'Recommended')}
                  </span>
                </div>
                <select value={form.location_id} onChange={e => f('location_id', e.target.value)} className={SELECT}>
                  <option value="">{t('— Brez lokacije —', '— No location —')}</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              {/* Status (edit only) */}
              {editingId && (
                <div>
                  <label className="block text-sm font-semibold text-[#031f18] mb-1.5">{t('Status', 'Status')}</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => f('is_active', true)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${form.is_active ? 'bg-[#f5f5f5] border-[#ececec] text-[#0f0f10]' : 'border-[#ececec] text-[#767676] hover:border-[#ececec]'}`}>
                      {t('Aktivno', 'Active')}
                    </button>
                    <button type="button" onClick={() => f('is_active', false)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${!form.is_active ? 'bg-[#fafafa] border-gray-400 text-[#031f18]' : 'border-[#ececec] text-[#767676] hover:border-[#ececec]'}`}>
                      {t('Neaktivno', 'Inactive')}
                    </button>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-[#031f18] mb-1.5">
                  {t('Opombe', 'Notes')} <span className="text-[#767676] font-normal text-xs">({t('neobvezno', 'optional')})</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => f('notes', e.target.value)}
                  rows={2}
                  placeholder={t('Dodatne informacije o napravi...', 'Additional device information...')}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#ececec] rounded-lg focus:outline-none focus:border-[#0f0f10] focus:shadow-[0_0_0_2px_#0f0f1033] placeholder:text-gray-300 resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-[#ececec] px-6 py-4 flex gap-3 rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-[#031f18] bg-white border border-[#ececec] rounded-xl hover:bg-[#f9f9f9] transition-colors">
                {t('Prekliči', 'Cancel')}
              </button>
              <button onClick={handleSave} disabled={saving || !form.name.trim() || (!form.uses_fuel && !form.uses_refrigerants && !form.uses_industrial_gases)}
                className="flex-[2] px-4 py-2.5 text-sm font-semibold text-white bg-[#0f0f10] hover:bg-[#2a2a2b] disabled:bg-[#efefef] disabled:text-[#767676] disabled:cursor-not-allowed rounded-xl transition-colors">
                {saving
                  ? t('Shranjevanje...', 'Saving...')
                  : editingId ? t('Shrani spremembe', 'Save changes') : t('Dodaj opremo', 'Add equipment')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
