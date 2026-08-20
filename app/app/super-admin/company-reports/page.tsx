'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSuperAdmin } from '../SuperAdminContext'
import { ChevronDown, Download } from 'lucide-react'
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

type SourceRow = { name: string; methodology: string; calcType: string; factorSet: string; co2e_kg: number }
type ReportData = {
  period: { start: string; end: string } | null
  scope1: { total: number; sources: SourceRow[] }
  scope2: { total: number; sources: SourceRow[] }
  scope3: { total: number; sources: SourceRow[] }
}

function fmtT(kg: number) { return (kg / 1000).toFixed(4).replace('.', ',') }

function ScopeSection({ label, sub, data }: { label: string; sub: string; data: { total: number; sources: SourceRow[] } }) {
  const [open, setOpen] = useState(true)
  const [openSources, setOpenSources] = useState<Set<string>>(new Set())
  const toggle = (name: string) => setOpenSources(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })

  return (
    <div className="bg-white border border-[#ececec] rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-[#f9f9f9] transition-colors">
        <div className="text-left">
          <p className="text-xl font-bold text-[#031f18]">{label}</p>
          <p className="text-sm text-[#767676]">{sub}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-[#031f18] tabular-nums">{fmtT(data.total)}</p>
            <p className="text-xs text-[#767676]">Bruto tCO₂e</p>
          </div>
          <ChevronDown className={cn('h-5 w-5 text-[#767676] transition-transform', open && 'rotate-180')} />
        </div>
      </button>
      {open && data.sources.length > 0 && (
        <div className="border-t border-[#ececec] px-6 py-4 space-y-4">
          {data.sources.map(src => (
            <div key={src.name} className="rounded-xl bg-[#f9f9f9] overflow-hidden">
              <button onClick={() => toggle(src.name)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fafafa] transition-colors">
                <p className="text-sm font-semibold text-[#031f18] text-left">{src.name}</p>
                <ChevronDown className={cn('h-4 w-4 text-[#767676] shrink-0 transition-transform', openSources.has(src.name) && 'rotate-180')} />
              </button>
              {openSources.has(src.name) && (
                <div className="border-t border-[#ececec]">
                  {[
                    { label: 'Metodologija izračuna GHG', val: src.methodology },
                    { label: 'Vrsta izračuna', val: src.calcType },
                    { label: 'Nabor emisijskih faktorjev', val: src.factorSet },
                    { label: 'Emisije', val: `${fmtT(src.co2e_kg)} tCO₂e` },
                  ].map(f => (
                    <div key={f.label} className="flex items-center justify-between px-4 py-2.5 border-b border-[#ececec] last:border-0 bg-white">
                      <p className="text-sm text-[#767676]">{f.label}</p>
                      <p className="text-sm font-medium text-[#031f18] text-right max-w-[60%]">{f.val}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {open && data.sources.length === 0 && (
        <div className="border-t border-[#ececec] px-6 py-8 text-center text-sm text-[#767676]">Ni vnosov za to leto.</div>
      )}
    </div>
  )
}

export default function AdminReportsPage() {
  const { selectedOrg, year } = useSuperAdmin()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => { if (selectedOrg) loadReport(selectedOrg.id, year) }, [selectedOrg?.id, year])

  async function loadReport(orgId: string, yr: number) {
    setLoading(true)
    setReport(null)
    try {
      const supabase = createClient()
      const { data: pd } = await supabase.from('reporting_periods').select('*').eq('organization_id', orgId).eq('year', yr).maybeSingle()
      if (!pd) { setReport({ period: null, scope1: { total: 0, sources: [] }, scope2: { total: 0, sources: [] }, scope3: { total: 0, sources: [] } }); setLoading(false); return }

      const DEFRA = `DEFRA UK Gov. Conversion Factors ${yr}`
      const [stationary, mobile, equipFuel, refrigerants, gases, electricity, heat, steam, cooling, scope3subs] = await Promise.all([
        supabase.from('scope1_stationary').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope1_mobile').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope1_equipment_fuel').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope1_refrigerants').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope1_industrial_gases').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope2_electricity').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope2_heat').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope2_steam').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope2_cooling').select('co2e_kg').eq('organization_id', orgId).eq('reporting_period_id', pd.id),
        supabase.from('scope3_submissions').select('co2e_kg, category_number').eq('organization_id', orgId).eq('reporting_period_id', pd.id).eq('status', 'done'),
      ])

      const sum = (r: any) => (r.data ?? []).reduce((s: number, x: any) => s + (x.co2e_kg ?? 0), 0)

      const scope1Sources = [
        { name: 'Stacionarno zgorevanje — Zemeljski plin', methodology: `DEFRA ${yr}`, calcType: 'Aktivnostna metoda', factorSet: DEFRA, co2e_kg: sum(stationary) },
        { name: 'Mobilno zgorevanje — Gorivo vozil', methodology: `DEFRA ${yr}`, calcType: 'Aktivnostna metoda', factorSet: DEFRA, co2e_kg: sum(mobile) },
        { name: 'Mobilno zgorevanje — Gorivo opreme', methodology: `DEFRA ${yr}`, calcType: 'Aktivnostna metoda', factorSet: DEFRA, co2e_kg: sum(equipFuel) },
        { name: 'Fugitivne emisije — Hladilni plini', methodology: 'IPCC AR6 GWP100', calcType: 'Masna metoda', factorSet: 'IPCC Sixth Assessment Report (AR6)', co2e_kg: sum(refrigerants) },
        { name: 'Fugitivne emisije — Industrijski plini', methodology: 'IPCC AR6 GWP100', calcType: 'Masna metoda', factorSet: 'IPCC Sixth Assessment Report (AR6)', co2e_kg: sum(gases) },
      ].filter(s => s.co2e_kg > 0)

      const scope2Sources = [
        { name: 'Kupljena elektrika', methodology: `DEFRA ${yr}`, calcType: 'Lokacijska metoda', factorSet: DEFRA, co2e_kg: sum(electricity) },
        { name: 'Kupljena toplota', methodology: `DEFRA ${yr}`, calcType: 'Lokacijska metoda', factorSet: DEFRA, co2e_kg: sum(heat) },
        { name: 'Kupljena para', methodology: `DEFRA ${yr}`, calcType: 'Lokacijska metoda', factorSet: DEFRA, co2e_kg: sum(steam) },
        { name: 'Kupljeno hlajenje', methodology: `DEFRA ${yr}`, calcType: 'Lokacijska metoda', factorSet: DEFRA, co2e_kg: sum(cooling) },
      ].filter(s => s.co2e_kg > 0)

      const scope3Sources = (scope3subs.data ?? [])
        .filter((s: any) => s.co2e_kg > 0)
        .map((s: any) => ({ name: `Kategorija ${s.category_number}: ${CATEGORY_LABELS[s.category_number] ?? ''}`, methodology: 'Poročila stranke', calcType: 'Poročana vrednost', factorSet: 'N/A', co2e_kg: s.co2e_kg }))

      setReport({
        period: { start: `1. 1. ${yr}`, end: `31. 12. ${yr}` },
        scope1: { total: scope1Sources.reduce((s, r) => s + r.co2e_kg, 0), sources: scope1Sources },
        scope2: { total: scope2Sources.reduce((s, r) => s + r.co2e_kg, 0), sources: scope2Sources },
        scope3: { total: scope3Sources.reduce((s, r) => s + r.co2e_kg, 0), sources: scope3Sources },
      })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const grandTotal = (report?.scope1.total ?? 0) + (report?.scope2.total ?? 0) + (report?.scope3.total ?? 0)

  if (!selectedOrg) return <div className="p-8 text-sm text-[#767676]">Izberite podjetje.</div>

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
        <div>
          <p className="text-xs font-semibold text-[#767676] uppercase tracking-widest mb-1">GHG · {selectedOrg.name} · {year}</p>
          <h1 className="text-2xl font-semibold text-[#0f0f10]">Poročilo o metodologiji GHG</h1>
          <p className="text-sm text-[#767676] mt-1">Pregled metodologij in emisijskih faktorjev za izračun ogljičnega odtisa.</p>
        </div>
        <button
          onClick={async () => {
            if (!report) return
            setExporting(true)
            await downloadGhgPdf({ orgName: selectedOrg.name, year, period: report.period, scope1: report.scope1, scope2: report.scope2, scope3: report.scope3 })
            setExporting(false)
          }}
          disabled={!report || exporting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors shrink-0">
          <Download className="h-4 w-4" />
          {exporting ? 'Generiranje...' : 'Izvozi PDF'}
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-[#ececec] rounded-2xl p-12 text-center text-sm text-[#767676]">Nalaganje...</div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-[#ececec] rounded-2xl p-6">
            <p className="text-base font-bold text-[#031f18] mb-4">Poročevalsko obdobje</p>
            <div>
              {[
                { label: 'Začetni datum', val: report?.period?.start ?? '—' },
                { label: 'Končni datum', val: report?.period?.end ?? '—' },
                { label: 'Skupne emisije', val: `${fmtT(grandTotal)} tCO₂e` },
              ].map((r, i) => (
                <div key={r.label} className={cn('flex items-center justify-between py-3', i < 2 && 'border-b border-[#ececec]')}>
                  <p className="text-sm text-[#767676]">{r.label}</p>
                  <p className="text-sm font-medium text-[#031f18]">{r.val}</p>
                </div>
              ))}
            </div>
          </div>
          {report && <ScopeSection label="Scope 1" sub="Direktne emisije toplogrednih plinov" data={report.scope1} />}
          {report && <ScopeSection label="Scope 2" sub="Posredne emisije iz kupljene energije" data={report.scope2} />}
          {report && <ScopeSection label="Scope 3" sub="Ostale posredne emisije vrednostne verige" data={report.scope3} />}
        </div>
      )}
    </div>
  )
}
