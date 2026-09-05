'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  getFuelFactors,
  getElectricityFactors,
  getHeatFactors,
  getSteamFactors,
  getCoolingFactors,
  REFRIGERANT_FACTORS,
  INDUSTRIAL_GAS_FACTORS,
} from '@/lib/emission-factors'
import { ExternalLink } from 'lucide-react'

const YEARS = [2023, 2024, 2025] as const
type Year = typeof YEARS[number]

const CATEGORY_TABS = [
  { key: 'fuels',       label: 'Goriva' },
  { key: 'electricity', label: 'Elektrika' },
  { key: 'heat',        label: 'Toplota' },
  { key: 'steam',       label: 'Para' },
  { key: 'cooling',     label: 'Hlajenje' },
  { key: 'refrigerants',label: 'Hladiva' },
  { key: 'gases',       label: 'Ind. plini' },
] as const
type CategoryKey = typeof CATEGORY_TABS[number]['key']

// Fuel groups for display
const FUEL_GROUPS: { label: string; keys: string[] }[] = [
  { label: 'Transport', keys: ['diesel', 'petrol', 'lpg', 'cng', 'lng'] },
  { label: 'Stacionarni', keys: ['natural_gas', 'heating_oil', 'heavy_fuel_oil', 'kerosene', 'propane', 'butane'] },
  { label: 'Premog & koks', keys: ['coal_anthracite', 'coal_bituminous', 'coal_lignite', 'coke'] },
  { label: 'Bioenergetika', keys: ['wood', 'wood_chips', 'wood_pellets', 'biodiesel', 'biogas'] },
  { label: 'Ostalo', keys: ['msw'] },
]

function fmt(n: number, d = 5) {
  if (n === 0) return '0'
  return n.toFixed(d).replace(/\.?0+$/, '')
}

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={cn(
      'px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap border-b border-gray-200 bg-gray-50',
      right ? 'text-right' : 'text-left',
    )}>
      {children}
    </th>
  )
}
function TD({ children, right, mono, dim }: { children: React.ReactNode; right?: boolean; mono?: boolean; dim?: boolean }) {
  return (
    <td className={cn(
      'px-3 py-2 text-sm border-b border-gray-100 whitespace-nowrap',
      right ? 'text-right' : 'text-left',
      mono ? 'font-mono' : '',
      dim ? 'text-gray-400' : 'text-gray-900',
    )}>
      {children}
    </td>
  )
}

function YearBadge({ changed }: { changed: boolean }) {
  if (!changed) return null
  return <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">↕</span>
}

export default function EmissionFactorsPage() {
  const [year, setYear] = useState<Year>(2024)
  const [category, setCategory] = useState<CategoryKey>('fuels')

  const fuels    = getFuelFactors(year)
  const fuels23  = getFuelFactors(2023)
  const fuels24  = getFuelFactors(2024)
  const fuels25  = getFuelFactors(2025)
  const elec     = getElectricityFactors(year)
  const heat     = getHeatFactors(year)
  const steam    = getSteamFactors(year)
  const cooling  = getCoolingFactors(year)

  const isYearChanged = (key: string, field: 'factor') => {
    const v23 = fuels23[key]?.[field]
    const v24 = fuels24[key]?.[field]
    const v25 = fuels25[key]?.[field]
    return !(v23 === v24 && v24 === v25)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Emisijski faktorji</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Vse vrednosti iz DEFRA GHG Conversion Factors (goriva, hladiva) ter ARSO/IEA (elektrika, toplota).
        </p>
        <div className="flex gap-3 mt-2 text-xs text-gray-400 flex-wrap">
          <a href="https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
            DEFRA GHG Factors <ExternalLink className="w-3 h-3" />
          </a>
          <a href="https://www.arso.gov.si/varstvo%20okolja/porocila/"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
            ARSO <ExternalLink className="w-3 h-3" />
          </a>
          <a href="https://www.iea.org/data-and-statistics/data-product/emissions-factors-2023"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
            IEA Emission Factors <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Year + Category tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">

        {/* Category tabs */}
        <div className="flex gap-0.5 bg-gray-100 rounded-xl p-1">
          {CATEGORY_TABS.map(tab => (
            <button key={tab.key} onClick={() => setCategory(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                category === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Year selector */}
        <div className="flex gap-1">
          {YEARS.map(y => (
            <button key={y} onClick={() => setYear(y)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-sm font-semibold border transition-all',
                year === y
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400',
              )}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <span className="px-1 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">↕</span>
        <span>vrednost se razlikuje med leti</span>
      </div>

      {/* ── FUELS ── */}
      {category === 'fuels' && (
        <div className="space-y-4">
          {FUEL_GROUPS.map(group => (
            <div key={group.label} className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{group.label}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <TH>Gorivo</TH>
                      <TH right>Faktor (kg CO₂e/enoto)</TH>
                      <TH right>CO₂ (kg/enoto)</TH>
                      <TH right>CH₄ (kg/enoto)</TH>
                      <TH right>N₂O (kg/enoto)</TH>
                      <TH>Enota</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {group.keys.map(key => {
                      const f = fuels[key]
                      if (!f) return null
                      const changed = isYearChanged(key, 'factor')
                      return (
                        <tr key={key} className="hover:bg-gray-50 transition-colors">
                          <TD>
                            <span className="font-medium">{f.label_sl}</span>
                            <span className="text-gray-400 text-xs ml-1.5">{f.label_en}</span>
                            {changed && <YearBadge changed />}
                          </TD>
                          <TD right mono>{fmt(f.factor)}</TD>
                          <TD right mono>{fmt(f.co2)}</TD>
                          <TD right mono>{f.ch4 === 0 ? <span className="text-gray-300">0</span> : fmt(f.ch4, 7)}</TD>
                          <TD right mono>{f.n2o === 0 ? <span className="text-gray-300">0</span> : fmt(f.n2o, 7)}</TD>
                          <TD dim>{f.unit}</TD>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400">
            Vir: DEFRA GHG Conversion Factors (Fuels + Bioenergy sheet). GWP100 IPCC AR5: CH₄=28, N₂O=265.
          </p>
        </div>
      )}

      {/* ── ELECTRICITY ── */}
      {category === 'electricity' && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <TH>Država</TH>
                  <TH right>Faktor (kg CO₂e/kWh)</TH>
                  <TH>Opis</TH>
                </tr>
              </thead>
              <tbody>
                {Object.entries(elec).map(([code, e]) => {
                  const vals = YEARS.map(y => getElectricityFactors(y)[code]?.factor)
                  const changed = !(vals[0] === vals[1] && vals[1] === vals[2])
                  return (
                    <tr key={code} className="hover:bg-gray-50 transition-colors">
                      <TD><span className="font-semibold">{code}</span>{changed && <YearBadge changed />}</TD>
                      <TD right mono>{fmt(e.factor, 4)}</TD>
                      <TD dim>{e.label}</TD>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            Vir: ARSO (Slovenija) · IEA Emission Factors · Umweltbundesamt (DE) · ISPRA (IT)
          </div>
        </div>
      )}

      {/* ── HEAT ── */}
      {category === 'heat' && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <TH>Država</TH>
                  <TH right>Faktor (kg CO₂e/kWh)</TH>
                  <TH>Opis</TH>
                </tr>
              </thead>
              <tbody>
                {Object.entries(heat).map(([code, h]) => {
                  const vals = YEARS.map(y => getHeatFactors(y)[code]?.factor)
                  const changed = !(vals[0] === vals[1] && vals[1] === vals[2])
                  return (
                    <tr key={code} className="hover:bg-gray-50 transition-colors">
                      <TD><span className="font-semibold">{code}</span>{changed && <YearBadge changed />}</TD>
                      <TD right mono>{fmt(h.factor, 4)}</TD>
                      <TD dim>{h.label}</TD>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            Vir: ARSO (Slovenija) · Eurostat · IEA. Ni enotnega EU vira za daljinsko toploto.
          </div>
        </div>
      )}

      {/* ── STEAM ── */}
      {category === 'steam' && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <TH>Država</TH>
                  <TH right>Faktor (kg CO₂e/kWh)</TH>
                  <TH>Opis</TH>
                </tr>
              </thead>
              <tbody>
                {Object.entries(steam).map(([code, s]) => {
                  const vals = YEARS.map(y => getSteamFactors(y)[code]?.factor)
                  const changed = !(vals[0] === vals[1] && vals[1] === vals[2])
                  return (
                    <tr key={code} className="hover:bg-gray-50 transition-colors">
                      <TD><span className="font-semibold">{code}</span>{changed && <YearBadge changed />}</TD>
                      <TD right mono>{fmt(s.factor, 4)}</TD>
                      <TD dim>{s.label}</TD>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            Vir: izpeljano iz faktorjev toplote (~117% toplote). Ni standardiziranega EU vira za daljinsko paro.
          </div>
        </div>
      )}

      {/* ── COOLING ── */}
      {category === 'cooling' && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <TH>Metoda hlajenja</TH>
                  <TH right>Faktor (kg CO₂e/kWh)</TH>
                </tr>
              </thead>
              <tbody>
                {Object.entries(cooling).map(([key, c]) => (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    <TD>
                      <span className="font-medium">{c.label_sl}</span>
                      <span className="text-gray-400 text-xs ml-1.5">{c.label_en}</span>
                    </TD>
                    <TD right mono>{fmt(c.factor, 4)}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            Vir: ASHRAE 90.1 / GHG Protocol Scope 2 Guidance. Vrednosti so stabilne — niso letno specifične.
          </div>
        </div>
      )}

      {/* ── REFRIGERANTS ── */}
      {category === 'refrigerants' && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <TH>Hladivo</TH>
                  <TH right>GWP100 (kg CO₂e/kg)</TH>
                  <TH>Opomba</TH>
                </tr>
              </thead>
              <tbody>
                {Object.entries(REFRIGERANT_FACTORS).filter(([k]) => k !== 'custom').map(([key, r]) => (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    <TD><span className="font-mono font-medium">{r.label}</span></TD>
                    <TD right mono>{r.factor.toLocaleString('sl-SI')}</TD>
                    <TD dim>
                      {key === 'R-452A' && 'Ni v DEFRA condensed setu; EU F-gas vrednost'}
                      {key === 'R-290'  && 'Non-Kyoto (propan), zanemarljivo'}
                      {key === 'R-744'  && 'CO₂, GWP=1 po definiciji'}
                      {key === 'R-22'   && 'Montreal protocol (non-Kyoto) — poroča se ločeno'}
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            Vir: DEFRA "Refrigerant &amp; other" sheet · IPCC AR5 GWP100 osnova. Vrednosti stabilne 2023–2025.
          </div>
        </div>
      )}

      {/* ── INDUSTRIAL GASES ── */}
      {category === 'gases' && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <TH>Plin</TH>
                  <TH right>GWP100 (kg CO₂e/kg)</TH>
                </tr>
              </thead>
              <tbody>
                {Object.entries(INDUSTRIAL_GAS_FACTORS).map(([key, g]) => (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    <TD>
                      <span className="font-mono font-medium">{key}</span>
                      <span className="text-gray-400 text-xs ml-1.5">{g.label}</span>
                    </TD>
                    <TD right mono>{g.factor.toLocaleString('sl-SI')}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            Vir: DEFRA "Refrigerant &amp; other" sheet · IPCC AR5 GWP100. Vrednosti stabilne 2023–2025.
          </div>
        </div>
      )}

    </div>
  )
}
