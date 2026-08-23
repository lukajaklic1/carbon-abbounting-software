'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ChevronRight, Leaf, BarChart2, FileText, Users, MapPin, Car, Wrench, TrendingUp, Globe, Shield, ChevronDown } from 'lucide-react'

/* ── Locale ── */
type Loc = 'SL' | 'EN'
function getCookieLocale(): Loc {
  if (typeof document === 'undefined') return 'SL'
  const m = document.cookie.match(/locale=([^;]+)/)
  return m?.[1]?.toUpperCase() === 'EN' ? 'EN' : 'SL'
}
function setCookieLocale(l: Loc) {
  document.cookie = `locale=${l.toLowerCase()}; path=/; max-age=31536000`
}

/* ── Animations ── */
function useInView(ref: React.RefObject<Element | null>, threshold = 0.1) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return inView
}
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  return (
    <div ref={ref} className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/* ── Logo ── */
function CarboniqLogo({ size = 28, showName = true }: { size?: number; showName?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center justify-center rounded-xl" style={{ width: size + 8, height: size + 8, background: '#0f0f10' }}>
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none">
          <path d="M14 6L8 12L14 18" stroke="#c0c0c0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 6L4 12L10 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {showName && <span className="text-[15px] font-semibold text-[#0f0f10] tracking-tight">Carboniqdesk</span>}
    </div>
  )
}

/* ── Hero Mockup ── */
type MockView = 'dashboard' | 'scope1' | 'analytics'

function HeroMockup({ isSl }: { isSl: boolean }) {
  const [view, setView] = useState<MockView>('dashboard')
  const [fading, setFading] = useState(false)
  const views: MockView[] = ['dashboard', 'scope1', 'analytics']

  useEffect(() => {
    let idx = 0
    const timer = setInterval(() => {
      setFading(true)
      setTimeout(() => { idx = (idx + 1) % views.length; setView(views[idx]); setFading(false) }, 320)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  const urls: Record<MockView, string> = {
    dashboard: 'carboniqdesk.com/dashboard',
    scope1: 'carboniqdesk.com/periods/2026/scope1/stationary',
    analytics: 'carboniqdesk.com/analytics',
  }

  // nav items
  const navIco = {
    dash: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    loc:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    car:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v7a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>,
    eq:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    s1:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
    s2:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    rep:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>,
    ana:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    set:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  }

  function NavRow({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
    return (
      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg mb-0.5 text-[9.5px] font-medium ${active ? 'bg-[#f1f1f1] text-gray-900' : 'text-gray-500'}`}>
        <span className="shrink-0">{icon}</span>{label}
      </div>
    )
  }

  function NavSection({ label }: { label: string }) {
    return <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider px-2.5 pt-3 pb-1">{label}</p>
  }

  const sl = isSl

  // Dashboard content
  function DashboardView() {
    const kpis = [
      { label: sl ? 'Scope 1' : 'Scope 1',      val: '12,4 t', unit: 'CO₂e', bg: '#fff7ed', dot: '#f97316' },
      { label: sl ? 'Scope 2' : 'Scope 2',      val: '8,7 t',  unit: 'CO₂e', bg: '#eff6ff', dot: '#3b82f6' },
      { label: sl ? 'Skupaj' : 'Total',         val: '21,1 t', unit: 'CO₂e', bg: '#f0fdf4', dot: '#22c55e' },
      { label: sl ? 'Dokončano' : 'Done',       val: '7/9',    unit: '',     bg: '#fafafa', dot: '#a1a1aa' },
    ]
    const bars = [
      { label: '01/26', s1: 38, s2: 24 },
      { label: '02/26', s1: 42, s2: 22 },
      { label: '03/26', s1: 35, s2: 28 },
      { label: '04/26', s1: 48, s2: 20 },
      { label: '05/26', s1: 44, s2: 26 },
      { label: '06/26', s1: 52, s2: 30 },
    ]
    return (
      <div className="p-3 flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between mb-0.5">
          <h1 className="text-[11px] font-semibold text-gray-900">{sl ? 'Nadzorna plošča · 2026' : 'Dashboard · 2026'}</h1>
          <div className="text-[9px] text-gray-400 bg-gray-100 rounded-md px-2 py-0.5">{sl ? 'Leto poročanja: 2026' : 'Reporting year: 2026'}</div>
        </div>
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-1.5">
          {kpis.map(k => (
            <div key={k.label} className="rounded-xl border border-gray-100 px-2 py-2" style={{ background: k.bg }}>
              <div className="flex items-center gap-1 mb-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: k.dot }} />
                <span className="text-[8px] text-gray-500">{k.label}</span>
              </div>
              <p className="text-[13px] font-bold text-gray-900">{k.val} <span className="text-[8px] font-normal text-gray-400">{k.unit}</span></p>
            </div>
          ))}
        </div>
        {/* Chart */}
        <div className="bg-white rounded-xl border border-gray-100 px-3 py-2">
          <p className="text-[9px] font-semibold text-gray-700 mb-2">{sl ? 'Mesečne emisije 2026' : 'Monthly emissions 2026'}</p>
          <svg width="100%" viewBox="0 0 340 80" style={{ overflow: 'visible' }}>
            {[60, 45, 30, 15].map((y, i) => (
              <g key={i}>
                <line x1="30" y1={y} x2="332" y2={y} stroke="#f3f4f6" strokeDasharray="3 3" strokeWidth="0.8" />
              </g>
            ))}
            <line x1="30" y1="63" x2="332" y2="63" stroke="#e5e7eb" strokeWidth="0.8" />
            {bars.map((b, bi) => {
              const cx = 50 + bi * 48
              return (
                <g key={bi}>
                  <rect x={cx - 14} y={63 - b.s1} width={12} height={b.s1} fill="#fed7aa" rx="2" />
                  <rect x={cx + 2}  y={63 - b.s2} width={12} height={b.s2} fill="#bfdbfe" rx="2" />
                  <text x={cx + 1} y={72} textAnchor="middle" fontSize="5.5" fill="#9ca3af">{b.label}</text>
                </g>
              )
            })}
            <rect x="60" y="73" width="6" height="3" fill="#fed7aa" rx="1" /><text x="68" y="77" fontSize="5.5" fill="#6b7280">Scope 1</text>
            <rect x="96" y="73" width="6" height="3" fill="#bfdbfe" rx="1" /><text x="104" y="77" fontSize="5.5" fill="#6b7280">Scope 2</text>
          </svg>
        </div>
        {/* Scope progress */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Scope 1', prog: 5, total: 6, co2: '12,4 t', color: '#f97316' },
            { label: 'Scope 2', prog: 2, total: 3, co2: '8,7 t',  color: '#3b82f6' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-3 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-semibold text-gray-800">{s.label}</span>
                <span className="text-[9px] text-gray-400">{s.prog}/{s.total}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${(s.prog/s.total)*100}%`, background: s.color }} />
              </div>
              <p className="text-[10px] font-bold text-gray-900 mt-1.5">{s.co2} <span className="text-[7.5px] font-normal text-gray-400">tCO₂e</span></p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Scope 1 stationary table
  function Scope1View() {
    const rows = [
      { name: 'Centralna pisarna Ljubljana', addr: 'Dunajska cesta 5', fuel: sl ? 'Zemeljski plin' : 'Natural gas', qty: '1.000,00 m³', co2: '2,02 tCO₂e', done: true },
      { name: 'Poslovna enota Kranj',        addr: 'Predoslje 50',     fuel: '—', qty: '—', co2: '—', done: false },
    ]
    return (
      <div className="p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[11px] font-semibold text-gray-900">{sl ? 'Stacionarno zgorevanje' : 'Stationary combustion'}</h1>
            <p className="text-[8.5px] text-gray-400 mt-0.5">{sl ? 'Zemeljski plin, kurilno olje in druga goriva' : 'Natural gas, heating oil and other fuels'}</p>
          </div>
          <div className="flex gap-1.5">
            <div className="inline-flex items-center gap-1 h-6 px-2.5 bg-white border border-gray-200 rounded-lg text-[8.5px]">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              <span className="font-semibold text-gray-900">2,02 tCO₂e</span>
            </div>
            <div className="inline-flex items-center gap-1 h-6 px-2.5 bg-white border border-gray-200 rounded-lg text-[8.5px]">
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="font-semibold text-gray-900">1 / 2</span>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#fafafa]">
              <tr className="border-b border-gray-100">
                {[sl ? 'Lokacija' : 'Location', sl ? 'Gorivo' : 'Fuel', sl ? 'Letna poraba' : 'Annual usage', 'CO₂e', 'Status'].map(h => (
                  <th key={h} className="text-left text-[8px] font-medium text-gray-500 px-2.5 py-2">{h}</th>
                ))}
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={`${i > 0 ? 'border-t border-gray-100' : ''} hover:bg-gray-50`}>
                  <td className="px-2.5 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/></svg>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-gray-900">{r.name}</p>
                        <p className="text-[8px] text-gray-400">{r.addr}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5 text-[8.5px] text-gray-600">{r.fuel}</td>
                  <td className="px-2.5 py-2.5 text-[8.5px] text-gray-600">{r.qty}</td>
                  <td className="px-2.5 py-2.5 text-[8.5px] font-medium text-gray-900">{r.co2}</td>
                  <td className="px-2.5 py-2.5">
                    {r.done
                      ? <span className="inline-flex items-center gap-1 text-[7.5px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />{sl ? 'Vneseno' : 'Done'}
                        </span>
                      : <span className="inline-flex items-center gap-1 text-[7.5px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />{sl ? 'Manjka' : 'Missing'}
                        </span>
                    }
                  </td>
                  <td className="px-2 py-2">
                    <button className="text-[7.5px] text-gray-400 border border-gray-200 rounded-md px-1.5 py-0.5 hover:bg-gray-50">
                      {r.done ? (sl ? 'Uredi' : 'Edit') : (sl ? '+ Dodaj' : '+ Add')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Analytics view
  function AnalyticsView() {
    const scopeData = [
      { label: 'Scope 1', pct: 59, co2: '12,4', color: '#f97316', bg: '#fff7ed' },
      { label: 'Scope 2', pct: 41, co2: '8,7',  color: '#3b82f6', bg: '#eff6ff' },
    ]
    const catRows = [
      { cat: sl ? 'Zemeljski plin' : 'Natural gas',    co2: '8,2 t',  pct: 39 },
      { cat: sl ? 'Gorivo vozil' : 'Vehicle fuel',     co2: '4,2 t',  pct: 20 },
      { cat: sl ? 'Električna energija' : 'Electricity', co2: '8,7 t', pct: 41 },
    ]
    return (
      <div className="p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-0.5">
          <h1 className="text-[11px] font-semibold text-gray-900">{sl ? 'Analitika emisij · 2026' : 'Emissions analytics · 2026'}</h1>
          <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">21,1 tCO₂e</span>
        </div>
        {/* Donut-style breakdown */}
        <div className="grid grid-cols-2 gap-2">
          {scopeData.map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-semibold text-gray-800">{s.label}</span>
                <span className="text-[8.5px] font-bold text-gray-900">{s.pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
              </div>
              <p className="text-[12px] font-bold" style={{ color: s.color }}>{s.co2} <span className="text-[7.5px] font-normal text-gray-400">tCO₂e</span></p>
            </div>
          ))}
        </div>
        {/* Category breakdown table */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 bg-[#fafafa]">
            <p className="text-[9px] font-semibold text-gray-700">{sl ? 'Po kategorijah' : 'By category'}</p>
          </div>
          {catRows.map((r, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
              <span className="text-[8.5px] text-gray-600 flex-1">{r.cat}</span>
              <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-300 rounded-full" style={{ width: `${r.pct}%` }} />
              </div>
              <span className="text-[8.5px] font-semibold text-gray-900 w-12 text-right">{r.co2}</span>
            </div>
          ))}
        </div>
        {/* Trend line hint */}
        <div className="bg-white border border-gray-100 rounded-xl px-3 py-2">
          <p className="text-[9px] font-semibold text-gray-700 mb-1.5">{sl ? 'Trend zmanjšanja' : 'Reduction trend'}</p>
          <svg width="100%" viewBox="0 0 260 40" style={{ overflow: 'visible' }}>
            <polyline points="10,32 55,28 100,22 145,18 190,12 240,8" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="3 2" />
            <polyline points="10,34 55,30 100,26 145,22 190,20 240,16" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="240" cy="16" r="3" fill="#22c55e" />
            {['01','02','03','04','05','06'].map((m, i) => (
              <text key={m} x={10 + i * 46} y={39} textAnchor="middle" fontSize="5.5" fill="#9ca3af">{m}/26</text>
            ))}
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-[0_24px_80px_rgba(0,0,0,.10)]">
      {/* Browser chrome */}
      <div className="bg-[#f6f6f6] border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 mx-2 bg-white rounded-md h-5 flex items-center px-3 border border-gray-200/60">
          <span className="text-[10px] text-gray-400">{urls[view]}</span>
        </div>
      </div>

      {/* App shell */}
      <div className="bg-[#fafafa] flex" style={{ height: 580 }}>
        {/* Sidebar */}
        <div className="w-[130px] shrink-0 bg-[#fafafa] border-r border-gray-200 flex flex-col pt-2 pb-3 px-1.5 overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-1.5 px-2 py-2 mb-1">
            <div className="w-5 h-5 bg-[#0f0f10] rounded-md flex items-center justify-center shrink-0">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M14 6L8 12L14 18" stroke="#c0c0c0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 6L4 12L10 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-gray-900">Carboniqdesk</span>
          </div>

          <NavSection label={sl ? 'Org.' : 'Org.'} />
          <NavRow icon={navIco.loc} label={sl ? 'Lokacije' : 'Locations'} />
          <NavRow icon={navIco.car} label={sl ? 'Vozila' : 'Vehicles'} />
          <NavRow icon={navIco.eq}  label={sl ? 'Oprema' : 'Equipment'} />

          <NavSection label="Obseg 1" />
          <NavRow icon={navIco.s1} label={sl ? 'Zemeljski plin' : 'Natural gas'} active={view === 'scope1'} />
          <NavRow icon={navIco.car} label={sl ? 'Poraba vozil' : 'Vehicle fuel'} />
          <NavRow icon={navIco.eq} label={sl ? 'Gorivo opreme' : 'Equip. fuel'} />

          <NavSection label="Obseg 2" />
          <NavRow icon={navIco.s2} label={sl ? 'Elektrika' : 'Electricity'} />
          <NavRow icon={navIco.s2} label={sl ? 'Toplota' : 'Heat'} />

          <div className="mt-auto">
            <NavRow icon={navIco.ana} label={sl ? 'Analitika' : 'Analytics'} active={view === 'analytics'} />
            <NavRow icon={navIco.rep} label={sl ? 'Poročila' : 'Reports'} />
            <NavRow icon={navIco.set} label={sl ? 'Nastavitve' : 'Settings'} />
          </div>
        </div>

        {/* Main */}
        <div className={`flex-1 bg-white overflow-hidden transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}>
          {view === 'dashboard' && <DashboardView />}
          {view === 'scope1'    && <Scope1View />}
          {view === 'analytics' && <AnalyticsView />}
        </div>
      </div>
    </div>
  )
}

/* ── Feature card ── */
function FeatureCard({ Icon, title, desc, delay }: { Icon: React.ElementType; title: string; desc: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  return (
    <div ref={ref}
      className={`p-7 border-b border-r border-gray-100 last:border-r-0 transition-all duration-600 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center mb-4">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
    </div>
  )
}

function ForWhomCard({ Icon, label, desc, delay }: { Icon: React.ElementType; label: string; desc: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  return (
    <div ref={ref}
      className={`group p-7 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center mb-4 transition-colors duration-300">
        <Icon className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors duration-300" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{label}</h3>
      <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
    </div>
  )
}

function StepCard({ num, title, desc, delay }: { num: string; title: string; desc: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  return (
    <div ref={ref} className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="text-5xl font-bold text-gray-100 mb-4 tabular-nums">{num}</div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
    </div>
  )
}

/* ═══════════════ MAIN ═══════════════ */
export default function LandingPage() {
  const [locale, setLocale] = useState<Loc>('SL')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => { setLocale(getCookieLocale()) }, [])

  function switchLocale(l: Loc) { setCookieLocale(l); setLocale(l) }

  const isSl = locale === 'SL'

  const L = {
    navFeatures:   isSl ? 'Funkcije'          : 'Features',
    navHowItWorks: isSl ? 'Kako deluje'       : 'How it works',
    navSignIn:     isSl ? 'Prijava'            : 'Sign in',
    navCta:        isSl ? 'Začnite brezplačno' : 'Get started free',
    heroBadge:     isSl ? 'BETA · Brezplačno med testiranjem' : 'BETA · Free during beta',
    heroTitle1:    isSl ? 'Meritve ogljičnega odtisa,' : 'Carbon footprint tracking,',
    heroTitle2:    isSl ? 'ki jih razumejo vsi.' : 'made simple.',
    heroSub:       isSl
      ? 'Evidentirajte emisije Scope 1, 2 in 3 po GHG Protokolu. Generirajte poročila za regulatorje in ESG zahteve.'
      : 'Track Scope 1, 2 and 3 emissions per GHG Protocol. Generate reports for regulators and ESG requirements.',
    heroCta1: isSl ? 'Začnite brezplačno' : 'Get started free',
    heroCta2: isSl ? 'Prijavite se' : 'Sign in',
    stat1Val: '3', stat1Label: isSl ? 'Področja emisij (Scope 1, 2, 3)' : 'Emission scopes tracked',
    stat2Val: '100+', stat2Label: isSl ? 'Emisijskih faktorjev' : 'Emission factors built-in',
    stat3Val: 'GHG', stat3Label: isSl ? 'Protokol – mednarodni standard' : 'Protocol – international standard',
    f1t: isSl ? 'Scope 1 – direktne emisije' : 'Scope 1 – Direct emissions',
    f1d: isSl ? 'Evidentirajte stacionarno zgorevanje (plin, kurilno olje), porabo goriv vozil in procesne emisije opreme.' : 'Track stationary combustion (gas, heating oil), vehicle fuel consumption and equipment process emissions.',
    f2t: isSl ? 'Scope 2 – posredne emisije' : 'Scope 2 – Indirect emissions',
    f2d: isSl ? 'Sledite porabi električne energije, toplote, pare in hlajenja po lokacijah z ustreznimi emisijskimi faktorji.' : 'Track electricity, heat, steam and cooling consumption per location with the right emission factors.',
    f3t: isSl ? 'Scope 3 – vrednostna veriga' : 'Scope 3 – Value chain',
    f3d: isSl ? 'Vprašalniki za dobavitelje, poslovne poti, službena potovanja in komunalne odpadke.' : 'Supplier questionnaires, business travel, commuting and waste data collection.',
    f4t: isSl ? 'Lokacije, vozila in oprema' : 'Locations, vehicles & equipment',
    f4d: isSl ? 'Centralni register vseh emisijskih virov. Vsak vir ima svojo vrsto goriva ali energenta.' : 'Central registry of all emission sources. Each source has its own fuel or energy carrier.',
    f5t: isSl ? 'PDF poročila in izvoz' : 'PDF reports & export',
    f5d: isSl ? 'Generirajte GHG poročila v PDF obliki. Primerna za revizorje, regulatorje in ESG razkritja.' : 'Generate GHG reports in PDF format. Suitable for auditors, regulators and ESG disclosures.',
    f6t: isSl ? 'Analitika in trendi' : 'Analytics & trends',
    f6d: isSl ? 'Pregledujte emisije po scopes, kategorijah in časovnih obdobjih. Opazujte napredek pri zmanjšanju.' : 'View emissions by scope, category and time period. Track progress on your reduction targets.',
    step1t: isSl ? 'Dodajte emisijske vire' : 'Add emission sources',
    step1d: isSl ? 'Registrirajte lokacije, vozila in opremo v vašem podjetju.' : 'Register your company locations, vehicles and equipment.',
    step2t: isSl ? 'Vnesite podatke' : 'Enter activity data',
    step2d: isSl ? 'Za vsako leto vnesite porabo goriva, energije in drugih snovi po viru.' : 'For each year, enter fuel, energy and substance consumption per source.',
    step3t: isSl ? 'Generirajte poročila' : 'Generate reports',
    step3d: isSl ? 'Aplikacija izračuna emisije in pripravi PDF poročilo za regulatorje in ESG razkritja.' : 'The app calculates emissions and prepares a PDF report for regulators and ESG disclosures.',
    faqLabel: 'FAQ',
    faqs: isSl ? [
      { q: 'Kaj je GHG Protokol?', a: 'GHG (Greenhouse Gas) Protokol je mednarodni standard za merjenje in upravljanje emisij toplogrednih plinov podjetij in organizacij. Definira tri področja (Scope 1, 2, 3), ki skupaj pokrijejo celoten ogljični odtis organizacije.' },
      { q: 'Kaj so Scope 1, 2 in 3 emisije?', a: 'Scope 1 so neposredne emisije iz lastnih virov (kurilne naprave, vozila). Scope 2 so posredne emisije iz kupljene energije (elektrika, toplota). Scope 3 so vse ostale posredne emisije v vrednostni verigi (dobavitelji, poti zaposlenih, odpadki).' },
      { q: 'Ali je Carboniqdesk primeren za mala podjetja?', a: 'Da. Aplikacija je zasnovana tako, da je preprosta za podjetja vseh velikosti. Začnete z vnosom lokacij in emisijskih virov, nato pa postopoma dopolnjujete podatke za vsako poročevalsko leto.' },
      { q: 'Kateri emisijski faktorji so vgrajeni?', a: 'Aplikacija vsebuje faktorje za zemeljski plin, kurilna olja, UNP, bioplin, električno energijo po državah (IEA/IPCC), hladilne medije in industrijske pline. Faktorji se posodabljajo vsako leto.' },
      { q: 'Ali je aplikacija varnostno skladna?', a: 'Da. Vsi podatki so shranjeni v EU (Supabase – Frankfurt). Dostop je zaščiten z dvostopenjsko avtentikacijo. Vsak račun vidi samo lastne podatke.' },
    ] : [
      { q: 'What is the GHG Protocol?', a: 'The GHG (Greenhouse Gas) Protocol is the international standard for measuring and managing corporate greenhouse gas emissions. It defines three scopes (Scope 1, 2, 3) that together cover an organization\'s full carbon footprint.' },
      { q: 'What are Scope 1, 2 and 3 emissions?', a: 'Scope 1 covers direct emissions from owned sources (boilers, vehicles). Scope 2 covers indirect emissions from purchased energy (electricity, heat). Scope 3 covers all other indirect emissions in the value chain (suppliers, employee commuting, waste).' },
      { q: 'Is Carboniqdesk suitable for small businesses?', a: 'Yes. The app is designed to be simple for companies of all sizes. You start by adding your locations and emission sources, then gradually fill in data for each reporting year.' },
      { q: 'Which emission factors are built in?', a: 'The app includes factors for natural gas, heating oil, LPG, biogas, electricity by country (IEA/IPCC), refrigerants and industrial gases. Factors are updated annually.' },
      { q: 'Is the app security-compliant?', a: 'Yes. All data is stored in the EU (Supabase – Frankfurt). Access is protected. Each account only sees its own data.' },
    ],
    forWhom: isSl ? [
      { Icon: Wrench,    label: 'Predelovalna industrija', desc: 'Sledite emisijam strojev, vozičkov in energije v vaši tovarni po lokacijah in opremah.' },
      { Icon: Car,       label: 'Transport in logistika',  desc: 'Evidentirajte porabo goriva voznega parka in izračunajte emisije po vozilu in trasi.' },
      { Icon: Globe,     label: 'Energetika',             desc: 'Poročajte o emisijah iz lastnih elektrarn, kotlovnic in distribucijskega omrežja.' },
      { Icon: MapPin,    label: 'Nepremičnine',           desc: 'Sledite energetski intenzivnosti stavb – plin, električna energija, ogrevanje po lokacijah.' },
      { Icon: FileText,  label: 'Finance in zavarovalstvo',desc: 'Pripravljajte ESG razkritja za regulatorje in vlagatelje z verodostojnimi podatki.' },
      { Icon: BarChart2, label: 'Javna uprava',           desc: 'Poročajte o ogljičnem odtisu javnih stavb, voznega parka in operacij v skladu z zahtevami EU.' },
    ] : [
      { Icon: Wrench,    label: 'Manufacturing & Industry', desc: 'Track emissions from machinery, forklifts and energy across your facilities per location and equipment.' },
      { Icon: Car,       label: 'Transport & Logistics',    desc: 'Log fleet fuel consumption and calculate emissions per vehicle and route.' },
      { Icon: Globe,     label: 'Energy & Utilities',       desc: 'Report emissions from owned power plants, boilers and distribution networks.' },
      { Icon: MapPin,    label: 'Real Estate',              desc: 'Track energy intensity of buildings — gas, electricity and heating per location.' },
      { Icon: FileText,  label: 'Finance & Insurance',      desc: 'Prepare ESG disclosures for regulators and investors with credible, auditable data.' },
      { Icon: BarChart2, label: 'Public Administration',   desc: 'Report the carbon footprint of public buildings, fleets and operations in line with EU requirements.' },
    ],
    footerTagline: isSl ? 'Merjenje emisij, ki ga razumejo vsi.' : 'Carbon tracking everyone can understand.',
    footerProduct: isSl ? 'Produkt' : 'Product',
    footerLegal:   isSl ? 'Pravno' : 'Legal',
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <CarboniqLogo showName />
          </a>
          <div className="hidden md:flex items-center gap-7">
            <a href="#features"      className="text-[15px] font-medium text-gray-700 hover:opacity-70 transition-opacity">{L.navFeatures}</a>
            <a href="#how-it-works"  className="text-[15px] font-medium text-gray-700 hover:opacity-70 transition-opacity">{L.navHowItWorks}</a>
            <a href="#faq"           className="text-[15px] font-medium text-gray-700 hover:opacity-70 transition-opacity">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 mr-1">
              {(['SL', 'EN'] as Loc[]).map(l => (
                <button key={l} onClick={() => switchLocale(l)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${locale === l ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}>
                  {l}
                </button>
              ))}
            </div>
            <Link href="/login"
              className="hidden md:block text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200">
              {L.navSignIn}
            </Link>
            <Link href="/register"
              className="hidden sm:block bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap">
              {L.navCta}
            </Link>
            <button className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5 text-gray-700"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5 text-gray-700"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
              }
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-1">
            <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 py-2.5 border-b border-gray-50 hover:text-gray-900">{L.navFeatures}</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 py-2.5 border-b border-gray-50 hover:text-gray-900">{L.navHowItWorks}</a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 py-2.5 border-b border-gray-50 hover:text-gray-900">FAQ</a>
            <div className="flex items-center gap-2 pt-2 pb-2.5 border-b border-gray-50">
              <span className="text-xs text-gray-400 mr-1">{isSl ? 'Jezik' : 'Language'}:</span>
              {(['SL', 'EN'] as Loc[]).map(l => (
                <button key={l} onClick={() => switchLocale(l)}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${locale === l ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm text-gray-600 font-medium text-center py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50">{L.navSignIn}</Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="text-sm text-white font-semibold text-center py-2.5 rounded-lg bg-gray-900 hover:bg-gray-700">{L.navCta}</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-10 md:pt-20 pb-16 text-center px-6 relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          <div className="absolute -top-32 -right-64 w-[280px] h-[280px] md:w-[600px] md:h-[600px] rounded-full"
            style={{ background: 'radial-gradient(ellipse at 70% 30%, rgba(34,197,94,0.14) 0%, rgba(59,130,246,0.08) 45%, transparent 72%)', filter: 'blur(40px)' }} />
          <div className="absolute top-56 -left-24 w-[240px] h-[240px] md:w-[500px] md:h-[500px] rounded-full"
            style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(34,197,94,0.12) 0%, transparent 65%)', filter: 'blur(36px)' }} />
        </div>
        <div className="relative" style={{ zIndex: 1 }}>
          <div className="animate-fade-up flex justify-center mb-10" style={{ animationDelay: '0.05s' }}>
            <a href="#features" className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 rounded-full px-[1px] py-[1px] transition-colors"
              style={{ background: 'linear-gradient(135deg, #bbf7d0, #86efac)' }}>
              <span className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 hover:bg-gray-50">
                {L.heroBadge}<ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </span>
            </a>
          </div>
          <div className="animate-fade-up max-w-[1000px] mx-auto mb-6" style={{ animationDelay: '0.12s' }}>
            <h1 className="font-semibold text-gray-900 tracking-tight" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)', lineHeight: 1.08 }}>
              {L.heroTitle1}<br />{L.heroTitle2}
            </h1>
          </div>
          <p className="animate-fade-up text-lg font-normal max-w-xl mx-auto mb-10 leading-relaxed text-gray-500" style={{ animationDelay: '0.2s' }}>
            {L.heroSub}
          </p>
          <div className="animate-fade-up flex flex-col sm:flex-row items-center justify-center gap-3 mb-16" style={{ animationDelay: '0.28s' }}>
            <Link href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors text-sm">
              {L.heroCta1} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login"
              className="w-full sm:w-auto text-sm text-gray-600 font-semibold px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              {L.heroCta2}
            </Link>
          </div>
          <div className="animate-fade-up max-w-[1280px] mx-auto" style={{ animationDelay: '0.38s' }}>
            <div className="min-w-[700px]">
              <HeroMockup isSl={isSl} />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="max-w-[1440px] mx-auto px-6 py-16">
        <div className="border border-gray-100 rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-3">
          {[
            { val: L.stat1Val, label: L.stat1Label },
            { val: L.stat2Val, label: L.stat2Label },
            { val: L.stat3Val, label: L.stat3Label },
          ].map(({ val, label }, i) => (
            <FadeUp key={i} delay={i * 60} className="px-10 py-12 border-b sm:border-b-0 sm:border-r border-gray-100 last:border-r-0 flex flex-col items-start">
              <p className="text-5xl font-semibold text-gray-900 mb-2 tracking-tight">{val}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="border-t border-gray-100">
        <div className="max-w-[1440px] mx-auto px-6 pt-20 pb-0">
          <FadeUp className="mb-14">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">{isSl ? 'Funkcije' : 'Features'}</p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1] max-w-xl">
                {isSl ? 'Vse za GHG poročanje.' : 'Everything for GHG reporting.'}
              </h2>
              <p className="text-gray-500 max-w-sm leading-relaxed text-sm sm:text-base">
                {isSl ? 'Od evidencije emisijskih virov do končnega poročila.' : 'From tracking emission sources to the final report.'}
              </p>
            </div>
          </FadeUp>
        </div>
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="border border-gray-100 rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard Icon={Leaf}     title={L.f1t} desc={L.f1d} delay={0}   />
            <FeatureCard Icon={TrendingUp} title={L.f2t} desc={L.f2d} delay={60}  />
            <FeatureCard Icon={Globe}    title={L.f3t} desc={L.f3d} delay={120} />
            <FeatureCard Icon={MapPin}   title={L.f4t} desc={L.f4d} delay={0}   />
            <FeatureCard Icon={FileText} title={L.f5t} desc={L.f5d} delay={60}  />
            <FeatureCard Icon={BarChart2} title={L.f6t} desc={L.f6d} delay={120} />
          </div>
        </div>
        <div className="h-20" />
      </section>

      {/* ── FOR WHOM ── */}
      <section className="border-t border-gray-100 py-24">
        <div className="max-w-[1440px] mx-auto px-6">
          <FadeUp className="mb-14">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">{isSl ? 'Za koga' : 'For whom'}</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1]">
              {isSl ? 'Za vsako panogo.' : 'For every industry.'}
            </h2>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {L.forWhom.map((fw, i) => (
              <ForWhomCard key={i} Icon={fw.Icon} label={fw.label} desc={fw.desc} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="border-t border-gray-100 py-24 bg-gray-50">
        <div className="max-w-[1440px] mx-auto px-6">
          <FadeUp className="mb-20">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">{isSl ? 'Kako deluje' : 'How it works'}</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1]">
              {isSl ? 'Trije koraki do poročila.' : 'Three steps to a report.'}
            </h2>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
            <StepCard num="01" title={L.step1t} desc={L.step1d} delay={0} />
            <StepCard num="02" title={L.step2t} desc={L.step2d} delay={100} />
            <StepCard num="03" title={L.step3t} desc={L.step3d} delay={200} />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-t border-gray-100 py-24">
        <div className="max-w-[860px] mx-auto px-6">
          <FadeUp className="mb-14 text-center">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">{isSl ? 'Pogosta vprašanja' : 'Frequently asked questions'}</h2>
          </FadeUp>
          <div className="divide-y divide-gray-100">
            {L.faqs.map((faq, i) => (
              <FadeUp key={i} delay={i * 40}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left group">
                  <span className="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="pb-5 -mt-1">
                    <p className="text-gray-500 leading-relaxed text-sm">{faq.a}</p>
                  </div>
                )}
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="border-t border-gray-100 py-24 bg-gray-900">
        <div className="max-w-[860px] mx-auto px-6 text-center">
          <FadeUp>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-5">
              {isSl ? 'Začnite z merjenjem danes.' : 'Start measuring today.'}
            </h2>
            <p className="text-gray-400 text-lg mb-10">
              {isSl ? 'Brezplačno med beta testiranjem. Ni potrebna kreditna kartica.' : 'Free during beta. No credit card required.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register"
                className="flex items-center gap-2 bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors text-sm">
                {L.heroCta1} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="text-sm text-gray-400 hover:text-white font-medium px-6 py-3 rounded-xl border border-gray-700 hover:border-gray-500 transition-colors">
                {L.navSignIn}
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-16">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-10 mb-12">
            <div className="sm:col-span-2">
              <CarboniqLogo showName />
              <p className="text-sm text-gray-400 mt-4 max-w-xs leading-relaxed">{L.footerTagline}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-4">{L.footerProduct}</p>
              <div className="flex flex-col gap-2">
                <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{L.navFeatures}</a>
                <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{L.navHowItWorks}</a>
                <Link href="/register" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{L.navCta}</Link>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-4">{L.footerLegal}</p>
              <div className="flex flex-col gap-2">
                <Link href="/terms"   className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{isSl ? 'Pogoji uporabe' : 'Terms of service'}</Link>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{isSl ? 'Politika zasebnosti' : 'Privacy policy'}</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Carboniqdesk · Bimetric</p>
            <div className="flex gap-1">
              {(['SL', 'EN'] as Loc[]).map(l => (
                <button key={l} onClick={() => switchLocale(l)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${locale === l ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
