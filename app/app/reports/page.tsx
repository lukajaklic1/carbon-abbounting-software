'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { usePeriodStore } from '@/stores/period'
import { useOrganizationStore } from '@/stores/organization'
import { ChevronDown, Download, FileText, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { downloadGhgPdf } from '@/components/reports/GhgPdf'

const CATEGORY_LABELS: Record<number, string> = {
  1: 'Nabavljeno blago in storitve', 2: 'Kapitalsko blago',
  3: 'Gorivo in energija (posredno)', 4: 'Vhodni transport in distribucija',
  5: 'Odpadki iz poslovanja', 6: 'Poslovna potovanja',
  7: 'Prevoz zaposlenih na delo', 8: 'Najeta sredstva (vhodna)',
  9: 'Izhodni transport in distribucija', 10: 'Predelava prodanih izdelkov',
  11: 'Uporaba prodanih izdelkov', 12: 'Odlaganje prodanih izdelkov',
  13: 'Najeta sredstva (izhodna)', 14: 'Franšize', 15: 'Naložbe',
}

type SourceRow = {
  name: string
  methodology: string
  calcType: string
  factorSet: string
  co2e_kg: number
}

type GasBreakdown = {
  co2_kg: number; ch4_kg: number; n2o_kg: number
  hfc_kg: number; pfc_kg: number; sf6_kg: number
}

type ReportData = {
  period: { start: string; end: string } | null
  scope1: { total: number; sources: SourceRow[]; gases: GasBreakdown }
  scope2: { total: number; sources: SourceRow[] }
  scope3: { total: number; sources: SourceRow[] }
  baseYear: { year: number; scope1: number; scope2: number; scope3: number } | null
}

function fmtT(kg: number) {
  return (kg / 1000).toFixed(2).replace('.', ',')
}

function ScopeSection({ scope, label, sub, data, defaultOpen }: {
  scope: string; label: string; sub: string
  data: { total: number; sources: SourceRow[] }
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen ?? true)
  const [openSources, setOpenSources] = useState<Set<string>>(new Set())

  function toggleSource(name: string) {
    setOpenSources(prev => {
      const n = new Set(prev)
      n.has(name) ? n.delete(name) : n.add(name)
      return n
    })
  }

  const fields = [
    { label: 'Metodologija izračuna GHG', key: 'methodology' },
    { label: 'Vrsta izračuna', key: 'calcType' },
    { label: 'Nabor emisijskih faktorjev', key: 'factorSet' },
    { label: 'Emisije', key: 'co2e_kg', isEmission: true },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors">
        <div className="text-left">
          <p className="text-xl font-bold text-gray-900">{label}</p>
          <p className="text-sm text-gray-500">{sub}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 tabular-nums">{fmtT(data.total)}</p>
            <p className="text-xs text-gray-500">Bruto tCO₂e</p>
          </div>
          <ChevronDown className={cn('h-5 w-5 text-gray-500 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && data.sources.length > 0 && (
        <div className="border-t border-gray-200 px-6 py-4 space-y-4">
          {data.sources.map(src => (
            <div key={src.name} className="rounded-xl bg-gray-50 overflow-hidden">
              <button onClick={() => toggleSource(src.name)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <p className="text-sm font-semibold text-gray-900 text-left">{src.name}</p>
                <ChevronDown className={cn('h-4 w-4 text-gray-500 shrink-0 transition-transform', openSources.has(src.name) && 'rotate-180')} />
              </button>
              {openSources.has(src.name) && (
                <div className="border-t border-gray-200">
                  {fields.map(f => (
                    <div key={f.key} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 last:border-0 bg-white">
                      <p className="text-sm text-gray-500">{f.label}</p>
                      <p className="text-sm font-medium text-gray-900 text-right max-w-[60%]">
                        {f.isEmission
                          ? `${fmtT(src.co2e_kg)} tCO₂e`
                          : (src as any)[f.key]}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {open && data.sources.length === 0 && (
        <div className="border-t border-gray-200 px-6 py-8 text-center text-sm text-gray-500">
          Ni vnosov za to poročevalsko leto.
        </div>
      )}
    </div>
  )
}

const INDUSTRY_LABELS: Record<string, { sl: string; en: string }> = {
  manufacturing: { sl: 'Predelovalna industrija', en: 'Manufacturing' },
  retail:        { sl: 'Trgovina',                en: 'Retail & Wholesale' },
  transport:     { sl: 'Transport in logistika',  en: 'Transport & Logistics' },
  energy:        { sl: 'Energetika',              en: 'Energy & Utilities' },
  finance:       { sl: 'Finance',                 en: 'Finance & Insurance' },
  construction:  { sl: 'Gradbeništvo',            en: 'Construction' },
  agriculture:   { sl: 'Kmetijstvo',              en: 'Agriculture' },
  hospitality:   { sl: 'Gostinstvo',              en: 'Hospitality' },
  healthcare:    { sl: 'Zdravstvo',               en: 'Healthcare' },
  it:            { sl: 'Informacijska tehnologija', en: 'Information Technology' },
  education:     { sl: 'Izobraževanje',           en: 'Education' },
  public:        { sl: 'Javna uprava',            en: 'Public Administration' },
  other:         { sl: 'Drugo',                   en: 'Other' },
}

const COUNTRY_LABELS: Record<string, { sl: string; en: string }> = {
  SI: { sl: 'Slovenija', en: 'Slovenia' },
  HR: { sl: 'Hrvaška', en: 'Croatia' },
  AT: { sl: 'Avstrija', en: 'Austria' },
  DE: { sl: 'Nemčija', en: 'Germany' },
  IT: { sl: 'Italija', en: 'Italy' },
  FR: { sl: 'Francija', en: 'France' },
  GB: { sl: 'Združeno kraljestvo', en: 'United Kingdom' },
  OTHER: { sl: 'Drugo', en: 'Other' },
}

const INPUT = 'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] placeholder:text-gray-300 transition-shadow'
const TEXTAREA = INPUT + ' resize-none'
const SELECT = 'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_#3b82f633] transition-shadow'

type ReportSettings = {
  company_description: string
  consolidation_approach: string
  organizational_boundary: string
  scope3_included: string
  excluded_activities: string
  base_year: string
  base_year_rationale: string
  recalculation_policy: string
  methodology_notes: string
}

const EMPTY_SETTINGS: ReportSettings = {
  company_description: '',
  consolidation_approach: 'operational_control',
  organizational_boundary: '',
  scope3_included: '',
  excluded_activities: '',
  base_year: '',
  base_year_rationale: '',
  recalculation_policy: '',
  methodology_notes: '',
}

export default function ReportsPage() {
  const { t, locale } = useLocale()
  const { selectedYear } = usePeriodStore()
  const { organization } = useOrganizationStore()
  const year = selectedYear ?? new Date().getFullYear()

  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [settings, setSettings] = useState<ReportSettings>({ ...EMPTY_SETTINGS })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [periodId, setPeriodId] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => { loadReport() }, [year])

  async function loadReport() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return
      setOrgId(org.id)

      const { data: pd } = await supabase.from('reporting_periods').select('*').eq('organization_id', org.id).eq('year', year).single()
      if (!pd) { setReport({ period: null, scope1: { total: 0, sources: [] }, scope2: { total: 0, sources: [] }, scope3: { total: 0, sources: [] } }); setLoading(false); return }
      setPeriodId(pd.id)

      // Load report settings
      const { data: rs } = await supabase.from('report_settings').select('*').eq('organization_id', org.id).eq('reporting_period_id', pd.id).single()
      if (rs) {
        setSettings({
          company_description: rs.company_description ?? '',
          consolidation_approach: rs.consolidation_approach ?? 'operational_control',
          organizational_boundary: rs.organizational_boundary ?? '',
          scope3_included: rs.scope3_included ?? '',
          excluded_activities: rs.excluded_activities ?? '',
          base_year: rs.base_year ? String(rs.base_year) : '',
          base_year_rationale: rs.base_year_rationale ?? '',
          recalculation_policy: rs.recalculation_policy ?? '',
          methodology_notes: rs.methodology_notes ?? '',
        })
      } else {
        setSettings({ ...EMPTY_SETTINGS })
      }

      const DEFRA = `DEFRA UK Gov. Conversion Factors ${year}`

      const [stationary, mobile, equipFuel, refrigerants, gases, electricity, heat, steam, cooling, scope3subs, allPeriods] = await Promise.all([
        supabase.from('scope1_stationary').select('co2e_kg, fuel_type').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope1_mobile').select('co2e_kg, fuel_type').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope1_equipment_fuel').select('co2e_kg, fuel_type').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope1_refrigerants').select('co2e_kg, refrigerant_type').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope1_industrial_gases').select('co2e_kg, gas_type').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope2_electricity').select('co2e_kg, country_code').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope2_heat').select('co2e_kg, country_code').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope2_steam').select('co2e_kg, country_code').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope2_cooling').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id),
        supabase.from('scope3_submissions').select('co2e_kg, category_number').eq('organization_id', org.id).eq('reporting_period_id', pd.id).eq('status', 'done'),
        supabase.from('reporting_periods').select('id, year').eq('organization_id', org.id).order('year', { ascending: true }),
      ])

      // Per-gas stolpci — na voljo šele po SQL migraciji; če stolpci ne obstajajo, fallback na []
      const EMPTY = { data: [] as any[] }
      const [gasStationary, gasMobile, gasEquip, gasRef, gasInd] = await Promise.all([
        supabase.from('scope1_stationary').select('co2_kg, ch4_kg, n2o_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id).then(r => r.error ? EMPTY : r),
        supabase.from('scope1_mobile').select('co2_kg, ch4_kg, n2o_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id).then(r => r.error ? EMPTY : r),
        supabase.from('scope1_equipment_fuel').select('co2_kg, ch4_kg, n2o_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id).then(r => r.error ? EMPTY : r),
        supabase.from('scope1_refrigerants').select('hfc_kg, co2_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id).then(r => r.error ? EMPTY : r),
        supabase.from('scope1_industrial_gases').select('co2_kg, ch4_kg, n2o_kg, sf6_kg, hfc_kg, pfc_kg').eq('organization_id', org.id).eq('reporting_period_id', pd.id).then(r => r.error ? EMPTY : r),
      ])

      const sum = (rows: any) => (rows.data ?? []).reduce((s: number, r: any) => s + (r.co2e_kg ?? 0), 0)
      const sumCol = (rows: any, col: string) => (rows.data ?? []).reduce((s: number, r: any) => s + (r[col] ?? 0), 0)

      // Per-gas breakdown for Scope 1 (iz ločenih per-gas queryjev)
      const scope1Gases: GasBreakdown = {
        co2_kg: sumCol(gasStationary, 'co2_kg') + sumCol(gasMobile, 'co2_kg') + sumCol(gasEquip, 'co2_kg') + sumCol(gasRef, 'co2_kg') + sumCol(gasInd, 'co2_kg'),
        ch4_kg: sumCol(gasStationary, 'ch4_kg') + sumCol(gasMobile, 'ch4_kg') + sumCol(gasEquip, 'ch4_kg') + sumCol(gasInd, 'ch4_kg'),
        n2o_kg: sumCol(gasStationary, 'n2o_kg') + sumCol(gasMobile, 'n2o_kg') + sumCol(gasEquip, 'n2o_kg') + sumCol(gasInd, 'n2o_kg'),
        hfc_kg: sumCol(gasRef, 'hfc_kg') + sumCol(gasInd, 'hfc_kg'),
        pfc_kg: sumCol(gasInd, 'pfc_kg'),
        sf6_kg: sumCol(gasInd, 'sf6_kg'),
      }

      // GHG Protocol zahteva VSE vire, tudi z 0
      const scope1Sources: SourceRow[] = [
        { name: t('Stacionarno zgorevanje', 'Stationary combustion'), methodology: `DEFRA ${year}`, calcType: t('Aktivnostna metoda', 'Activity-based method'), factorSet: DEFRA, co2e_kg: sum(stationary) },
        { name: t('Mobilno zgorevanje — vozila', 'Mobile combustion — vehicles'), methodology: `DEFRA ${year}`, calcType: t('Aktivnostna metoda', 'Activity-based method'), factorSet: DEFRA, co2e_kg: sum(mobile) },
        { name: t('Mobilno zgorevanje — oprema', 'Mobile combustion — equipment'), methodology: `DEFRA ${year}`, calcType: t('Aktivnostna metoda', 'Activity-based method'), factorSet: DEFRA, co2e_kg: sum(equipFuel) },
        { name: t('Fugitivne emisije — hladilni plini', 'Fugitive emissions — refrigerants'), methodology: 'IPCC AR6 GWP100', calcType: t('Masna metoda', 'Mass-based method'), factorSet: 'IPCC AR6', co2e_kg: sum(refrigerants) },
        { name: t('Fugitivne emisije — industrijski plini', 'Fugitive emissions — industrial gases'), methodology: 'IPCC AR6 GWP100', calcType: t('Masna metoda', 'Mass-based method'), factorSet: 'IPCC AR6', co2e_kg: sum(gases) },
      ]

      const scope2Sources: SourceRow[] = [
        { name: t('Kupljena elektrika', 'Purchased electricity'), methodology: `DEFRA ${year}`, calcType: t('Lokacijska metoda', 'Location-based method'), factorSet: DEFRA, co2e_kg: sum(electricity) },
        { name: t('Kupljena toplota', 'Purchased heat'), methodology: `DEFRA ${year}`, calcType: t('Lokacijska metoda', 'Location-based method'), factorSet: DEFRA, co2e_kg: sum(heat) },
        { name: t('Kupljena para', 'Purchased steam'), methodology: `DEFRA ${year}`, calcType: t('Lokacijska metoda', 'Location-based method'), factorSet: DEFRA, co2e_kg: sum(steam) },
        { name: t('Kupljeno hlajenje', 'Purchased cooling'), methodology: `DEFRA ${year}`, calcType: t('Lokacijska metoda', 'Location-based method'), factorSet: DEFRA, co2e_kg: sum(cooling) },
      ]

      // Scope 3: vse kategorije 1-15 po vrstnem redu, tudi tiste z 0
      const sc3map: Record<number, number> = {}
      ;(scope3subs.data ?? []).forEach((s: any) => { sc3map[s.category_number] = s.co2e_kg ?? 0 })
      const scope3Sources: SourceRow[] = Array.from({ length: 15 }, (_, i) => i + 1).map(num => ({
        name: `${t('Kategorija', 'Category')} ${num}: ${CATEGORY_LABELS[num] ?? ''}`,
        methodology: t('Poročila stranke', 'Customer-reported'),
        calcType: t('Poročana vrednost', 'Reported value'),
        factorSet: 'N/A',
        co2e_kg: sc3map[num] ?? 0,
      }))

      // Base year = earliest reporting period (not current year)
      const periods = allPeriods.data ?? []
      const earliestPd = periods.find(p => p.year < year) ?? (periods[0]?.year !== year ? periods[0] : null)
      let baseYear: ReportData['baseYear'] = null
      if (earliestPd && earliestPd.id !== pd.id) {
        const [byStat, byMob, byEquip, byRef, byGas, byElec, byHeat, bySteam, byCool, bySc3] = await Promise.all([
          supabase.from('scope1_stationary').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', earliestPd.id),
          supabase.from('scope1_mobile').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', earliestPd.id),
          supabase.from('scope1_equipment_fuel').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', earliestPd.id),
          supabase.from('scope1_refrigerants').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', earliestPd.id),
          supabase.from('scope1_industrial_gases').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', earliestPd.id),
          supabase.from('scope2_electricity').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', earliestPd.id),
          supabase.from('scope2_heat').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', earliestPd.id),
          supabase.from('scope2_steam').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', earliestPd.id),
          supabase.from('scope2_cooling').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', earliestPd.id),
          supabase.from('scope3_submissions').select('co2e_kg').eq('organization_id', org.id).eq('reporting_period_id', earliestPd.id).eq('status', 'done'),
        ])
        baseYear = {
          year: earliestPd.year,
          scope1: sum(byStat) + sum(byMob) + sum(byEquip) + sum(byRef) + sum(byGas),
          scope2: sum(byElec) + sum(byHeat) + sum(bySteam) + sum(byCool),
          scope3: sum(bySc3),
        }
      }

      const s1total = sum(stationary) + sum(mobile) + sum(equipFuel) + sum(refrigerants) + sum(gases)
      const s2total = sum(electricity) + sum(heat) + sum(steam) + sum(cooling)
      const s3total = (scope3subs.data ?? []).reduce((s: number, r: any) => s + (r.co2e_kg ?? 0), 0)
      setReport({
        period: { start: `1. 1. ${year}`, end: `31. 12. ${year}` },
        scope1: { total: s1total, sources: scope1Sources, gases: scope1Gases },
        scope2: { total: s2total, sources: scope2Sources },
        scope3: { total: s3total, sources: scope3Sources },
        baseYear,
      })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function saveSettings() {
    if (!orgId || !periodId) return
    setSettingsSaving(true)
    const supabase = createClient()
    const payload = {
      organization_id: orgId,
      reporting_period_id: periodId,
      company_description: settings.company_description || null,
      consolidation_approach: settings.consolidation_approach,
      organizational_boundary: settings.organizational_boundary || null,
      scope3_included: settings.scope3_included || null,
      excluded_activities: settings.excluded_activities || null,
      base_year: settings.base_year ? parseInt(settings.base_year) : null,
      base_year_rationale: settings.base_year_rationale || null,
      recalculation_policy: settings.recalculation_policy || null,
      methodology_notes: settings.methodology_notes || null,
      updated_at: new Date().toISOString(),
    }
    await supabase.from('report_settings').upsert(payload, { onConflict: 'organization_id,reporting_period_id' })
    setSettingsSaving(false)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  async function copyFromPreviousYear() {
    if (!orgId) return
    const supabase = createClient()
    const { data: prevPd } = await supabase.from('reporting_periods').select('id').eq('organization_id', orgId).eq('year', year - 1).single()
    if (!prevPd) return
    const { data: rs } = await supabase.from('report_settings').select('*').eq('organization_id', orgId).eq('reporting_period_id', prevPd.id).single()
    if (rs) {
      setSettings({
        company_description: rs.company_description ?? '',
        consolidation_approach: rs.consolidation_approach ?? 'operational_control',
        organizational_boundary: rs.organizational_boundary ?? '',
        scope3_included: rs.scope3_included ?? '',
        excluded_activities: rs.excluded_activities ?? '',
        base_year: rs.base_year ? String(rs.base_year) : '',
        base_year_rationale: rs.base_year_rationale ?? '',
        recalculation_policy: rs.recalculation_policy ?? '',
        methodology_notes: rs.methodology_notes ?? '',
      })
    }
  }

  const grandTotal = (report?.scope1.total ?? 0) + (report?.scope2.total ?? 0) + (report?.scope3.total ?? 0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 border-b border-gray-200 min-h-[57px] py-3 sm:h-[57px] sm:py-0 shrink-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 shrink-0">Poročila</h1>
          <p className="text-sm text-gray-500 truncate">Metodološko poročilo GHG.</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>

          <p className="text-sm text-gray-500 mt-1 max-w-lg">
            {t('Pregled metodologij in emisijskih faktorjev za izračun ogljičnega odtisa po GHG protokolu.', 'Overview of methodologies and emission factors used to calculate your carbon footprint per GHG Protocol.')}
          </p>
        </div>
        <button
          onClick={async () => {
            if (!report) return
            setExporting(true)
            await downloadGhgPdf({
              orgName: organization?.name ?? 'Organizacija',
              year,
              period: report.period,
              scope1: report.scope1,
              scope2: report.scope2,
              scope3: report.scope3,
            })
            setExporting(false)
          }}
          disabled={!report || exporting || !organization?.is_active}
          title={!organization?.is_active ? t('Funkcija je na voljo za plačnike', 'Available for paid accounts') : undefined}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors shrink-0',
            organization?.is_active
              ? 'bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}>
          {organization?.is_active ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {exporting ? t('Generiranje...', 'Generating...') : t('Izvozi PDF', 'Export PDF')}
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-sm text-gray-500">{t('Nalaganje...', 'Loading...')}</div>
      ) : (
        <div className="space-y-4">
          {/* Descriptive info form */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <p className="text-base font-bold text-gray-900">{t('Opisni podatki', 'Descriptive information')}</p>
              <p className="text-sm text-gray-500 mt-0.5">{t('GHG Protocol – Del 1', 'GHG Protocol – Part 1')}</p>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Pre-filled from org — frozen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-gray-100">
                {[
                  { label: t('Ime podjetja', 'Company name'), value: organization?.name },
                  { label: t('Poročevalsko leto', 'Reporting year'), value: String(year) },
                  { label: t('Poročevalsko obdobje', 'Reporting period'), value: `1. 1. ${year} – 31. 12. ${year}` },
                  { label: t('Dejavnost', 'Industry'), value: organization?.industry ? (locale === 'EN' ? INDUSTRY_LABELS[organization.industry]?.en : INDUSTRY_LABELS[organization.industry]?.sl) ?? organization.industry : undefined },
                  { label: t('Država', 'Country'), value: organization?.country_code ? (locale === 'EN' ? COUNTRY_LABELS[organization.country_code]?.en : COUNTRY_LABELS[organization.country_code]?.sl) ?? organization.country_code : undefined },
                  { label: t('Št. zaposlenih', 'Employees'), value: organization?.employees_range },
                ].map(({ label, value }) => value ? (
                  <div key={label}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                    <div className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500">{value}</div>
                  </div>
                ) : null)}
              </div>
              {/* 2. Opis podjetja */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Opis podjetja in dejavnosti', 'Description of the company')}</label>
                <textarea rows={3} className={TEXTAREA} placeholder={t('Opišite dejavnost, velikost in obseg organizacije...', 'Describe the organisation\'s activities, size and scope...')}
                  value={settings.company_description} onChange={e => setSettings(s => ({ ...s, company_description: e.target.value }))} />
              </div>
              {/* 3. Konsolidacijski pristop */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Konsolidacijski pristop', 'Chosen consolidation approach')}</label>
                <select className={SELECT} value={settings.consolidation_approach} onChange={e => setSettings(s => ({ ...s, consolidation_approach: e.target.value }))}>
                  <option value="operational_control">{t('Operativni nadzor', 'Operational control')}</option>
                  <option value="financial_control">{t('Finančni nadzor', 'Financial control')}</option>
                  <option value="equity_share">{t('Lastniški delež', 'Equity share')}</option>
                </select>
              </div>
              {/* 4. Organizacijska meja */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Opis organizacijske meje', 'Description of the organisational boundary')}</label>
                <textarea rows={2} className={TEXTAREA} placeholder={t('Katere poslovne enote, lokacije in operacije so vključene...', 'Which business units, locations and operations are included...')}
                  value={settings.organizational_boundary} onChange={e => setSettings(s => ({ ...s, organizational_boundary: e.target.value }))} />
              </div>
              {/* 5. Poročevalsko obdobje — prikazano v zamrznjenih poljih zgoraj */}
              {/* 6. Vključene aktivnosti Obsega 3 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Seznam vključenih aktivnosti Obsega 3', 'List of Scope 3 activities included in the report')}</label>
                <textarea rows={2} className={TEXTAREA} placeholder={t('Npr. Kategorija 1 (nabavljeno blago), Kategorija 6 (poslovna potovanja), Kategorija 7 (prevoz zaposlenih)...', 'E.g. Category 1 (purchased goods), Category 6 (business travel), Category 7 (employee commuting)...')}
                  value={settings.scope3_included} onChange={e => setSettings(s => ({ ...s, scope3_included: e.target.value }))} />
              </div>
              {/* 7. Izključene aktivnosti (obseg 1, 2, 3) z utemeljitvijo */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Seznam izključenih aktivnosti (obseg 1, 2 in 3) z utemeljitvijo', 'List of Scope 1, 2 and 3 activities excluded from the report, with justification')}</label>
                <textarea rows={3} className={TEXTAREA} placeholder={t('Npr. Obseg 3, Kat. 11 – podjetje ne prodaja fizičnih izdelkov; Obseg 1 – brez lastnih vozil...', 'E.g. Scope 3, Cat. 11 – company does not sell physical products; Scope 1 – no owned vehicles...')}
                  value={settings.excluded_activities} onChange={e => setSettings(s => ({ ...s, excluded_activities: e.target.value }))} />
              </div>
              {/* 8. Bazno leto + utemeljitev */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Bazno leto', 'Base year chosen')}</label>
                  <input type="number" className={INPUT} placeholder="npr. 2023" min={2000} max={2100}
                    value={settings.base_year} onChange={e => setSettings(s => ({ ...s, base_year: e.target.value }))} />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('Utemeljitev baznega leta', 'Rationale for choosing the base year')}</label>
                  <textarea rows={2} className={TEXTAREA} placeholder={t('Zakaj ste izbrali to bazno leto?', 'Why was this base year chosen?')}
                    value={settings.base_year_rationale} onChange={e => setSettings(s => ({ ...s, base_year_rationale: e.target.value }))} />
                </div>
              </div>
              {/* 9. Politika ponovnega izračuna */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Politika ponovnega izračuna emisij baznega leta', 'Base year emissions recalculation policy')}</label>
                <textarea rows={2} className={TEXTAREA} placeholder={t('Pod katerimi pogoji se emisije baznega leta ponovno izračunajo in kontekst morebitnih sprememb...', 'Under what conditions base year emissions will be recalculated and context for any significant changes...')}
                  value={settings.recalculation_policy} onChange={e => setSettings(s => ({ ...s, recalculation_policy: e.target.value }))} />
              </div>
              {/* Dodatno: metodološke opombe */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('Metodološke opombe', 'Methodology notes')}</label>
                <textarea rows={2} className={TEXTAREA} placeholder={t('Morebitne spremembe metodologije, emisijski faktorji, opombe...', 'Any methodology changes, emission factor sources, notes...')}
                  value={settings.methodology_notes} onChange={e => setSettings(s => ({ ...s, methodology_notes: e.target.value }))} />
              </div>
              <div className="flex justify-end pt-1">
                <button onClick={saveSettings} disabled={settingsSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {settingsSaved ? t('Shranjeno ✓', 'Saved ✓') : settingsSaving ? t('Shranjevanje...', 'Saving...') : t('Shrani', 'Save')}
                </button>
              </div>
            </div>
          </div>

          {/* Reporting period */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <p className="text-base font-bold text-gray-900 mb-4">{t('Poročevalsko obdobje', 'Reporting Period')}</p>
            <div className="space-y-0">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <p className="text-sm text-gray-500">{t('Začetni datum', 'Start date')}</p>
                <p className="text-sm font-medium text-gray-900">{report?.period?.start ?? '—'}</p>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <p className="text-sm text-gray-500">{t('Končni datum', 'End date')}</p>
                <p className="text-sm font-medium text-gray-900">{report?.period?.end ?? '—'}</p>
              </div>
              <div className="flex items-center justify-between py-3">
                <p className="text-sm text-gray-500">{t('Skupne emisije', 'Total emissions')}</p>
                <p className="text-sm font-bold text-gray-900 tabular-nums">{fmtT(grandTotal)} tCO₂e</p>
              </div>
            </div>
          </div>

          {/* Scope 1 */}
          {report && (
            <ScopeSection scope="1" label={t('Obseg 1', 'Scope 1')}
              sub={t('Direktne emisije toplogrednih plinov', 'Direct GHG Emissions')}
              data={report.scope1} defaultOpen />
          )}

          {/* Scope 2 */}
          {report && (
            <ScopeSection scope="2" label={t('Obseg 2', 'Scope 2')}
              sub={t('Posredne emisije iz kupljene energije', 'Electricity Indirect GHG Emissions')}
              data={report.scope2} defaultOpen />
          )}

          {/* Scope 3 */}
          {report && (
            <ScopeSection scope="3" label={t('Obseg 3', 'Scope 3')}
              sub={t('Ostale posredne emisije vrednostne verige', 'Other Indirect GHG Emissions')}
              data={report.scope3} defaultOpen />
          )}

          {/* Part 2 (nadaljevanje) — Per-gas breakdown Scope 1 */}
          {report && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <p className="text-base font-bold text-gray-900">{t('Emisije po plinih — Obseg 1', 'Greenhouse gas emissions by gas — Scope 1')}</p>
                <p className="text-sm text-gray-500 mt-0.5">{t('GHG Protocol – Del 2 (nadaljevanje) · GWP100 IPCC AR6', 'GHG Protocol – Part 2 (continued) · GWP100 IPCC AR6')}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">{t('Plin', 'Gas')}</th>
                      <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">{t('Masa (t)', 'Mass (t)')}</th>
                      <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">tCO₂e</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      { label: 'CO₂', kg: report.scope1.gases?.co2_kg ?? 0, gwp: 1 },
                      { label: 'CH₄', kg: report.scope1.gases?.ch4_kg ?? 0, gwp: 28 },
                      { label: 'N₂O', kg: report.scope1.gases?.n2o_kg ?? 0, gwp: 265 },
                      { label: 'HFC', kg: report.scope1.gases?.hfc_kg ?? 0, gwp: null },
                      { label: 'PFC', kg: report.scope1.gases?.pfc_kg ?? 0, gwp: null },
                      { label: 'SF₆', kg: report.scope1.gases?.sf6_kg ?? 0, gwp: 23500 },
                    ].map(({ label, kg, gwp }) => (
                      <tr key={label} className="hover:bg-[#f6f6f6]">
                        <td className="px-6 py-3 text-sm text-gray-900">{label}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 tabular-nums">{(kg / 1000).toFixed(4).replace('.', ',')}</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-900 tabular-nums font-medium">
                          {gwp !== null ? (kg * gwp / 1000).toFixed(4).replace('.', ',') : '—'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900">{t('Skupaj Obseg 1', 'Total Scope 1')}</td>
                      <td className="px-4 py-3" />
                      <td className="px-6 py-3 text-sm text-right font-bold text-gray-900 tabular-nums">{fmtT(report.scope1.total)}</td>
                    </tr>
                    <tr className="hover:bg-[#f6f6f6]">
                      <td className="px-6 py-3 text-sm text-gray-700">{t('Obseg 2 (skupaj CO₂e)', 'Scope 2 (total CO₂e)')}</td>
                      <td className="px-4 py-3" />
                      <td className="px-6 py-3 text-sm text-right text-gray-900 tabular-nums font-medium">{fmtT(report.scope2.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Part 5 — Emisije baznega leta */}
          {report?.baseYear && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <p className="text-base font-bold text-gray-900">{t('Emisije baznega leta', 'Base year emissions')}</p>
                <p className="text-sm text-gray-500 mt-0.5">{t(`GHG Protocol – Del 5 · Bazno leto: ${report.baseYear.year}`, `GHG Protocol – Part 5 · Base year: ${report.baseYear.year}`)}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">{t('Obseg / kategorija', 'Scope / category')}</th>
                      <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">tCO₂e</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-[#f6f6f6]">
                      <td className="px-6 py-3 text-sm text-gray-700">{t('Obseg 1', 'Scope 1')}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-900 tabular-nums font-medium">{fmtT(report.baseYear.scope1)}</td>
                    </tr>
                    <tr className="hover:bg-[#f6f6f6]">
                      <td className="px-6 py-3 text-sm text-gray-700">{t('Obseg 2', 'Scope 2')}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-900 tabular-nums font-medium">{fmtT(report.baseYear.scope2)}</td>
                    </tr>
                    {report.baseYear.scope3 > 0 && (
                      <tr className="hover:bg-[#f6f6f6]">
                        <td className="px-6 py-3 text-sm text-gray-700">{t('Obseg 3', 'Scope 3')}</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-900 tabular-nums font-medium">{fmtT(report.baseYear.scope3)}</td>
                      </tr>
                    )}
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900">{t('Skupaj', 'Total')}</td>
                      <td className="px-6 py-3 text-sm text-right font-bold text-gray-900 tabular-nums">{fmtT(report.baseYear.scope1 + report.baseYear.scope2 + report.baseYear.scope3)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
      </div>
    </div>
  )
}
