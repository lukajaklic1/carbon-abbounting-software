'use client'

import { useState, useEffect } from 'react'
import { Check, Clock, FileText, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useSuperAdmin } from '../SuperAdminContext'

const CATEGORY_LABELS: Record<number, string> = {
  1: 'Nabavljeno blago in storitve', 2: 'Kapitalsko blago',
  3: 'Gorivo in energija (posredno)', 4: 'Vhodni transport in distribucija',
  5: 'Odpadki iz poslovanja', 6: 'Poslovna potovanja',
  7: 'Prevoz zaposlenih na delo', 8: 'Najeta sredstva (vhodna)',
  9: 'Izhodni transport in distribucija', 10: 'Predelava prodanih izdelkov',
  11: 'Uporaba prodanih izdelkov', 12: 'Odlaganje prodanih izdelkov',
  13: 'Najeta sredstva (izhodna)', 14: 'Franšize', 15: 'Naložbe',
}

type Submission = {
  id: string
  category_number: number
  status: 'in_review' | 'done'
  file_name: string | null
  file_url: string | null
  co2e_kg: number | null
  organization_id: string
  period_year?: number
}

export default function Scope3ReviewPage() {
  const { selectedOrg } = useSuperAdmin()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [co2eInput, setCo2eInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_review' | 'done'>('all')

  useEffect(() => {
    if (selectedOrg) load(selectedOrg.id)
  }, [selectedOrg?.id])

  async function load(orgId: string) {
    setLoading(true)
    setError(null)
    setSubmissions([])
    try {
      const supabase = createClient()
      const { data: subs, error: subsErr } = await supabase
        .from('scope3_submissions')
        .select('*, reporting_periods(year)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })

      if (subsErr) { setError(subsErr.message); setLoading(false); return }

      setSubmissions((subs ?? []).map((s: any) => ({
        ...s,
        period_year: s.reporting_periods?.year ?? '—',
      })))
    } catch (e: any) { setError(String(e)) }
    setLoading(false)
  }

  async function markDone(sub: Submission) {
    const co2e = parseFloat(co2eInput.replace(',', '.'))
    if (isNaN(co2e) || co2e < 0) return
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('scope3_submissions').update({
        status: 'done', co2e_kg: co2e * 1000, updated_at: new Date().toISOString()
      }).eq('id', sub.id)
      setEditing(null)
      setCo2eInput('')
      if (selectedOrg) await load(selectedOrg.id)
    } catch (e: any) { setError(String(e)) }
    setSaving(false)
  }

  async function reopen(sub: Submission) {
    const supabase = createClient()
    await supabase.from('scope3_submissions').update({ status: 'in_review', co2e_kg: null }).eq('id', sub.id)
    if (selectedOrg) await load(selectedOrg.id)
  }

  const filtered = submissions.filter(s => filterStatus === 'all' || s.status === filterStatus)
  const inReviewCount = submissions.filter(s => s.status === 'in_review').length
  const doneCount = submissions.filter(s => s.status === 'done').length

  if (!selectedOrg) {
    return <div className="p-8 text-sm text-[#767676]">Izberite podjetje v zgornjem meniju.</div>
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl">
      <div className="mb-6">
        <p className="text-xs font-semibold text-[#767676] uppercase tracking-widest mb-1">Scope 3 · {selectedOrg.name}</p>
        <h1 className="text-2xl font-medium text-[#0f0f10]">Scope 3 — Pregled oddanih datotek</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-[#ececec] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-[#767676]">V pregledu</p>
            <p className="text-lg font-bold text-[#031f18]">{inReviewCount}</p>
          </div>
        </div>
        <div className="bg-white border border-[#ececec] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#f5f5f5] rounded-lg flex items-center justify-center shrink-0">
            <Check className="h-4 w-4 text-[#0f0f10]" />
          </div>
          <div>
            <p className="text-xs text-[#767676]">Zaključeno</p>
            <p className="text-lg font-bold text-[#031f18]">{doneCount}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'in_review', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilterStatus(f)}
            className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
              filterStatus === f ? 'bg-gray-900 text-white' : 'bg-white border border-[#ececec] text-[#767676] hover:bg-[#f9f9f9]'
            )}>
            {f === 'all' ? 'Vse' : f === 'in_review' ? 'V pregledu' : 'Zaključeno'}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="bg-white border border-[#ececec] rounded-xl p-12 text-center text-sm text-[#767676]">Nalaganje...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#ececec] rounded-xl p-12 text-center text-sm text-[#767676]">
          {submissions.length === 0 ? 'Podjetje še ni oddalo podatkov.' : 'Ni rezultatov.'}
        </div>
      ) : (
        <div className="bg-white border border-[#ececec] rounded-xl overflow-hidden">
          {filtered.map((sub, i) => (
            <div key={sub.id} className={cn('px-5 py-4', i !== 0 && 'border-t border-[#ececec]')}>
              <div className="flex items-center gap-4">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                  sub.status === 'done' ? 'bg-[#f5f5f5] text-[#0f0f10]' : 'bg-amber-50 text-amber-600'
                )}>
                  {sub.category_number}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#031f18]">{CATEGORY_LABELS[sub.category_number]}</p>
                  <p className="text-xs text-[#767676] mt-0.5">Leto {sub.period_year}</p>
                </div>

                {sub.file_name && (
                  <a href={sub.file_url ?? '#'} target="_blank" rel="noopener noreferrer"
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#0f0f10] hover:underline shrink-0 max-w-[180px]">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sub.file_name}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                )}

                {sub.status === 'done' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#efefef] text-[#0f0f10] border border-[#ececec] shrink-0">
                    <Check className="h-3 w-3" />
                    Zaključeno
                    {sub.co2e_kg != null && <span className="ml-1 font-normal">· {(sub.co2e_kg / 1000).toFixed(2).replace('.', ',')} t</span>}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                    <Clock className="h-3 w-3" />
                    V pregledu
                  </span>
                )}

                {sub.status === 'in_review' && editing !== sub.id && (
                  <button onClick={() => { setEditing(sub.id); setCo2eInput('') }}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#0f0f10] text-white rounded-lg hover:bg-[#2a2a2b] transition-colors shrink-0">
                    Zaključi
                  </button>
                )}
                {sub.status === 'done' && (
                  <button onClick={() => reopen(sub)}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#ececec] text-[#767676] rounded-lg hover:bg-[#f9f9f9] transition-colors shrink-0">
                    Znova odpri
                  </button>
                )}
              </div>

              {editing === sub.id && (
                <div className="mt-3 ml-12 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#f9f9f9] border border-[#ececec] rounded-lg px-3 py-2">
                    <input type="text" value={co2eInput} onChange={e => setCo2eInput(e.target.value)}
                      placeholder="0,00" autoFocus
                      className="w-24 text-sm bg-transparent outline-none text-[#031f18] font-medium" />
                    <span className="text-xs text-[#767676]">tCO₂e</span>
                  </div>
                  <button onClick={() => markDone(sub)} disabled={saving || !co2eInput}
                    className="px-3 py-2 text-xs font-semibold bg-[#0f0f10] text-white rounded-lg hover:bg-[#2a2a2b] disabled:opacity-50 transition-colors">
                    {saving ? 'Shranjujem...' : 'Potrdi'}
                  </button>
                  <button onClick={() => { setEditing(null); setCo2eInput('') }}
                    className="px-3 py-2 text-xs font-semibold text-[#767676] hover:text-[#031f18] rounded-lg hover:bg-[#fafafa] transition-colors">
                    Prekliči
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
