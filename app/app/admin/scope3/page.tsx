'use client'

import { useState, useEffect } from 'react'
import { Check, Clock, FileText, ExternalLink, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

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
  reporting_period_id: string
  org_name?: string
  period_year?: number
}

export default function AdminScope3Page() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [co2eInput, setCo2eInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_review' | 'done'>('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Ni prijave'); setLoading(false); return }

      const { data: sa } = await supabase.from('super_admins').select('user_id').eq('user_id', user.id).single()
      if (!sa) { setIsSuperAdmin(false); setLoading(false); return }
      setIsSuperAdmin(true)

      const { data: subs, error: subsErr } = await supabase
        .from('scope3_submissions')
        .select('*, reporting_periods(year, organizations(name))')
        .order('created_at', { ascending: false })

      if (subsErr) { setError(subsErr.message); setLoading(false); return }

      const mapped = (subs ?? []).map((s: any) => ({
        ...s,
        org_name: s.reporting_periods?.organizations?.name ?? '—',
        period_year: s.reporting_periods?.year ?? '—',
      }))
      setSubmissions(mapped)
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
      await load()
    } catch (e: any) { setError(String(e)) }
    setSaving(false)
  }

  async function reopen(sub: Submission) {
    const supabase = createClient()
    await supabase.from('scope3_submissions').update({ status: 'in_review', co2e_kg: null }).eq('id', sub.id)
    await load()
  }

  const filtered = submissions.filter(s => filterStatus === 'all' || s.status === filterStatus)
  const inReviewCount = submissions.filter(s => s.status === 'in_review').length
  const doneCount = submissions.filter(s => s.status === 'done').length

  if (isSuperAdmin === false) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-gray-500">Nimate dostopa do tega področja.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 border-b border-gray-200 h-[57px] shrink-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 shrink-0">Scope 3 — Oddane datoteke</h1>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-6">
      <div className="max-w-5xl mx-auto space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">V pregledu</p>
            <p className="text-lg font-bold text-gray-900">{inReviewCount}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
            <Check className="h-4 w-4 text-gray-900" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Zaključeno</p>
            <p className="text-lg font-bold text-gray-900">{doneCount}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'in_review', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilterStatus(f)}
            className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
              filterStatus === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            )}>
            {f === 'all' ? 'Vse' : f === 'in_review' ? 'V pregledu' : 'Zaključeno'}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-sm text-gray-500">Nalaganje...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-sm text-gray-500">Ni oddanih podatkov.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {filtered.map((sub, i) => (
            <div key={sub.id} className={cn('px-5 py-4', i !== 0 && 'border-t border-gray-200')}>
              <div className="flex items-center gap-4">
                {/* Category number */}
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                  sub.status === 'done' ? 'bg-gray-100 text-gray-900' : 'bg-amber-50 text-amber-600'
                )}>
                  {sub.category_number}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900">{CATEGORY_LABELS[sub.category_number]}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{sub.org_name} · {sub.period_year}</p>
                </div>

                {/* File link */}
                {sub.file_name && (
                  <a href={sub.file_url ?? '#'} target="_blank" rel="noopener noreferrer"
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-900 hover:underline shrink-0 max-w-[180px]">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sub.file_name}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                )}

                {/* Badge */}
                {sub.status === 'done' ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md shrink-0" style={{backgroundColor:'#e0fced',border:'1px solid #d4f8e6',color:'#098259'}}>
                    Zaključeno
                    {sub.co2e_kg != null && <span className="ml-1 font-normal">· {(sub.co2e_kg / 1000).toFixed(2).replace('.', ',')} t</span>}
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md shrink-0" style={{backgroundColor:'#fff3bf',border:'1px solid #ffe066',color:'#e67700'}}>
                    V pregledu
                  </span>
                )}

                {/* Actions */}
                {sub.status === 'in_review' && editing !== sub.id && (
                  <button onClick={() => { setEditing(sub.id); setCo2eInput('') }}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0">
                    Zaključi
                  </button>
                )}
                {sub.status === 'done' && (
                  <button onClick={() => reopen(sub)}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors shrink-0">
                    Znova odpri
                  </button>
                )}
              </div>

              {/* CO2e input row */}
              {editing === sub.id && (
                <div className="mt-3 ml-12 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <input
                      type="text"
                      value={co2eInput}
                      onChange={e => setCo2eInput(e.target.value)}
                      placeholder="0,00"
                      className="w-24 text-sm bg-transparent outline-none text-gray-900 font-medium"
                      autoFocus
                    />
                    <span className="text-xs text-gray-500">tCO₂e</span>
                  </div>
                  <button onClick={() => markDone(sub)} disabled={saving || !co2eInput}
                    className="px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {saving ? 'Shranjujem...' : 'Potrdi'}
                  </button>
                  <button onClick={() => { setEditing(null); setCo2eInput('') }}
                    className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
                    Prekliči
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
      </div>
    </div>
  )
}
