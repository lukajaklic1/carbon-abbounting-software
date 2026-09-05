// Emission factors by reporting year
// Fuel combustion: DEFRA (gov.uk/government/collections/government-conversion-factors-for-company-reporting)
//   Source files used:
//     2023: ghg-conversion-factors-2023-condensed-set-update.xlsx
//     2024: ghg-conversion-factors-2024-condensed_set__for_most_users__v1_1.xlsx
//     2025: ghg-conversion-factors-2025-condensed-set.xlsx
//   Fuel used: 100% mineral diesel/petrol (most conservative; forecourt avg biofuel blend is lower)
//   CNG/LNG/LPG: "Gaseous fuels" sheet, litres column
//   Note: CNG is measured in litres (compressed at delivery), NOT in kg
// Electricity SI: ARSO (arso.gov.si)
// Electricity other: IEA national averages
// Refrigerants / industrial gases: IPCC AR6 GWP (stable — not year-dependent)

// ─── Fuel combustion (DEFRA) ─────────────────────────────────────────────────
// Per-gas factors: kg of actual gas emitted per unit of fuel
// DEFRA columns give CH4 and N2O in kg CO2e — divide by GWP to get raw kg:
//   GWP100 (IPCC AR6): CO2=1, CH4=28, N2O=265
// factor = co2 + ch4×28 + n2o×265
type FuelEntry = {
  factor: number      // kg CO2e / unit
  co2: number         // kg CO2 / unit
  ch4: number         // kg CH4 / unit  (raw gas, not CO2e)
  n2o: number         // kg N2O / unit  (raw gas, not CO2e)
  unit: string
  label_sl: string
  label_en: string
}

// ── All fuels by year (DEFRA condensed set, exact values) ────────────────────
// Sources by sheet:
//   Transport (diesel/petrol/LPG/CNG/LNG): "Fuels" → 100% mineral / gaseous fuels, litres
//   Stationary liquid/gas: "Fuels" → litres or m³
//   Natural gas: DEFRA kWh (Net CV) × 10.55 kWh/m³ (DEFRA standard UK net CV conversion)
//   Coal: "Fuels" → tonnes ÷ 1000 = per kg
//     coal_anthracite → DEFRA "Coking coal" (closest hard-coal equivalent)
//     coal_bituminous → DEFRA "Coal (industrial)" (year-specific, changes slightly)
//     coal_lignite    → IPCC 2006 (no DEFRA condensed-set equivalent for brown coal)
//   Bioenergy (wood/biodiesel): "Bioenergy" → tonnes ÷ 1000 = per kg
//     NOTE: wood and biodiesel CO2 is biogenic → classified "outside of scopes"
//           per GHG Protocol ch.9. Only CH4/N2O are Scope 1 (not in condensed set).
//   Biogas: biogenic combustion — only trace CH4/N2O count as Scope 1; CO2 outside of scopes.
//   MSW: UK/EU average; not in DEFRA condensed-set yearly; stable value used.
// CNG note: DEFRA measures CNG in litres (compressed at delivery), NOT in kg.
// Component raw gas: ch4 = ch4_CO2e / 28, n2o = n2o_CO2e / 265  (IPCC AR6 GWP100)

const FUEL_2023: Record<string, FuelEntry> = {
  // ── Transport ──────────────────────────────────────────────────────────────
  diesel:          { factor: 2.65937, co2: 2.62600, ch4: 0.0000104, n2o: 0.0001248, unit: 'L',  label_sl: 'Dizel',               label_en: 'Diesel' },
  petrol:          { factor: 2.34503, co2: 2.33086, ch4: 0.0002928, n2o: 0.0000225, unit: 'L',  label_sl: 'Bencin',              label_en: 'Petrol' },
  lpg:             { factor: 1.55713, co2: 1.55491, ch4: 0.0000484, n2o: 0.0000033, unit: 'L',  label_sl: 'LPG',                 label_en: 'LPG' },
  cng:             { factor: 0.44842, co2: 0.44757, ch4: 0.0000240, n2o: 0.0000008, unit: 'L',  label_sl: 'CNG',                 label_en: 'CNG' },
  lng:             { factor: 1.16833, co2: 1.16604, ch4: 0.0000624, n2o: 0.0000020, unit: 'L',  label_sl: 'LNG',                 label_en: 'LNG' },
  // ── Stationary ─────────────────────────────────────────────────────────────
  natural_gas:     { factor: 2.13816, co2: 2.13384, ch4: 0.0001182, n2o: 0.0000039, unit: 'm³', label_sl: 'Zemeljski plin',      label_en: 'Natural gas' },
  heating_oil:     { factor: 2.75541, co2: 2.72417, ch4: 0.0001125, n2o: 0.0001060, unit: 'L',  label_sl: 'Kurilno olje',        label_en: 'Heating oil' },
  heavy_fuel_oil:  { factor: 3.10202, co2: 3.06194, ch4: 0.0000500, n2o: 0.0001460, unit: 'L',  label_sl: 'Težko kurilno olje',  label_en: 'Heavy fuel oil' },
  kerosene:        { factor: 2.54016, co2: 2.52782, ch4: 0.0002407, n2o: 0.0000211, unit: 'L',  label_sl: 'Kerozin',             label_en: 'Kerosene' },
  propane:         { factor: 1.54358, co2: 1.54140, ch4: 0.0000475, n2o: 0.0000032, unit: 'L',  label_sl: 'Propan',              label_en: 'Propane' },
  butane:          { factor: 1.74533, co2: 1.74296, ch4: 0.0000514, n2o: 0.0000035, unit: 'L',  label_sl: 'Butan',               label_en: 'Butane' },
  // ── Coal ───────────────────────────────────────────────────────────────────
  coal_anthracite: { factor: 3.16465, co2: 3.14416, ch4: 0.0003024, n2o: 0.0000454, unit: 'kg', label_sl: 'Premog – antracit',   label_en: 'Coal – Anthracite' },
  coal_bituminous: { factor: 2.39648, co2: 2.37191, ch4: 0.0002728, n2o: 0.0000639, unit: 'kg', label_sl: 'Premog – bituminozni', label_en: 'Coal – Bituminous' },
  coal_lignite:    { factor: 1.01500, co2: 1.00200, ch4: 0.0000430, n2o: 0.0000453, unit: 'kg', label_sl: 'Premog – lignit',     label_en: 'Coal – Lignite' },
  coke:            { factor: 3.38657, co2: 3.37705, ch4: 0.0001368, n2o: 0.0000215, unit: 'kg', label_sl: 'Koks',                label_en: 'Coke' },
  // ── Bioenergy (biogenic CO2 = outside of scopes; Scope 1 = CH4+N2O only) ──
  wood:            { factor: 0.04389, co2: 0.04389, ch4: 0.0000000, n2o: 0.0000000, unit: 'kg', label_sl: 'Les / polena',        label_en: 'Wood / logs' },
  wood_chips:      { factor: 0.04058, co2: 0.04058, ch4: 0.0000000, n2o: 0.0000000, unit: 'kg', label_sl: 'Les / biomasa',       label_en: 'Wood / biomass' },
  wood_pellets:    { factor: 0.05156, co2: 0.05156, ch4: 0.0000000, n2o: 0.0000000, unit: 'kg', label_sl: 'Lesne pelete',        label_en: 'Wood pellets' },
  biodiesel:       { factor: 0.16751, co2: 0.16751, ch4: 0.0000000, n2o: 0.0000000, unit: 'L',  label_sl: 'Biodizel',            label_en: 'Biodiesel' },
  biogas:          { factor: 0.00142, co2: 0.00000, ch4: 0.0000050, n2o: 0.0000000, unit: 'm³', label_sl: 'Bioplin',             label_en: 'Biogas' },
  // ── Other ──────────────────────────────────────────────────────────────────
  msw:             { factor: 0.52430, co2: 0.52000, ch4: 0.0000286, n2o: 0.0002264, unit: 'kg', label_sl: 'Komunalni odpadki',   label_en: 'Municipal solid waste' },
}

const FUEL_2024: Record<string, FuelEntry> = {
  // ── Transport ──────────────────────────────────────────────────────────────
  diesel:          { factor: 2.66155, co2: 2.62818, ch4: 0.0000104, n2o: 0.0001248, unit: 'L',  label_sl: 'Dizel',               label_en: 'Diesel' },
  petrol:          { factor: 2.35372, co2: 2.33955, ch4: 0.0002929, n2o: 0.0000225, unit: 'L',  label_sl: 'Bencin',              label_en: 'Petrol' },
  lpg:             { factor: 1.55713, co2: 1.55491, ch4: 0.0000486, n2o: 0.0000033, unit: 'L',  label_sl: 'LPG',                 label_en: 'LPG' },
  cng:             { factor: 0.44942, co2: 0.44855, ch4: 0.0000239, n2o: 0.0000008, unit: 'L',  label_sl: 'CNG',                 label_en: 'CNG' },
  lng:             { factor: 1.17216, co2: 1.16987, ch4: 0.0000625, n2o: 0.0000020, unit: 'L',  label_sl: 'LNG',                 label_en: 'LNG' },
  // ── Stationary ─────────────────────────────────────────────────────────────
  natural_gas:     { factor: 2.13785, co2: 2.13353, ch4: 0.0001168, n2o: 0.0000040, unit: 'm³', label_sl: 'Zemeljski plin',      label_en: 'Natural gas' },
  heating_oil:     { factor: 2.75541, co2: 2.72417, ch4: 0.0001125, n2o: 0.0001060, unit: 'L',  label_sl: 'Kurilno olje',        label_en: 'Heating oil' },
  heavy_fuel_oil:  { factor: 3.10202, co2: 3.06194, ch4: 0.0000500, n2o: 0.0001460, unit: 'L',  label_sl: 'Težko kurilno olje',  label_en: 'Heavy fuel oil' },
  kerosene:        { factor: 2.54015, co2: 2.52782, ch4: 0.0002407, n2o: 0.0000211, unit: 'L',  label_sl: 'Kerozin',             label_en: 'Kerosene' },
  propane:         { factor: 1.54357, co2: 1.54140, ch4: 0.0000475, n2o: 0.0000032, unit: 'L',  label_sl: 'Propan',              label_en: 'Propane' },
  butane:          { factor: 1.74532, co2: 1.74296, ch4: 0.0000514, n2o: 0.0000035, unit: 'L',  label_sl: 'Butan',               label_en: 'Butane' },
  // ── Coal ───────────────────────────────────────────────────────────────────
  coal_anthracite: { factor: 3.16465, co2: 3.14416, ch4: 0.0003024, n2o: 0.0000454, unit: 'kg', label_sl: 'Premog – antracit',   label_en: 'Coal – Anthracite' },
  coal_bituminous: { factor: 2.39944, co2: 2.37487, ch4: 0.0002728, n2o: 0.0000639, unit: 'kg', label_sl: 'Premog – bituminozni', label_en: 'Coal – Bituminous' },
  coal_lignite:    { factor: 1.01500, co2: 1.00200, ch4: 0.0000430, n2o: 0.0000453, unit: 'kg', label_sl: 'Premog – lignit',     label_en: 'Coal – Lignite' },
  coke:            { factor: 3.38657, co2: 3.37705, ch4: 0.0001368, n2o: 0.0000215, unit: 'kg', label_sl: 'Koks',                label_en: 'Coke' },
  // ── Bioenergy ──────────────────────────────────────────────────────────────
  wood:            { factor: 0.04626, co2: 0.04626, ch4: 0.0000000, n2o: 0.0000000, unit: 'kg', label_sl: 'Les / polena',        label_en: 'Wood / logs' },
  wood_chips:      { factor: 0.04276, co2: 0.04276, ch4: 0.0000000, n2o: 0.0000000, unit: 'kg', label_sl: 'Les / biomasa',       label_en: 'Wood / biomass' },
  wood_pellets:    { factor: 0.05434, co2: 0.05434, ch4: 0.0000000, n2o: 0.0000000, unit: 'kg', label_sl: 'Lesne pelete',        label_en: 'Wood pellets' },
  biodiesel:       { factor: 0.16751, co2: 0.16751, ch4: 0.0000000, n2o: 0.0000000, unit: 'L',  label_sl: 'Biodizel',            label_en: 'Biodiesel' },
  biogas:          { factor: 0.00145, co2: 0.00000, ch4: 0.0000050, n2o: 0.0000000, unit: 'm³', label_sl: 'Bioplin',             label_en: 'Biogas' },
  // ── Other ──────────────────────────────────────────────────────────────────
  msw:             { factor: 0.52430, co2: 0.52000, ch4: 0.0000286, n2o: 0.0002264, unit: 'kg', label_sl: 'Komunalni odpadki',   label_en: 'Municipal solid waste' },
}

const FUEL_2025: Record<string, FuelEntry> = {
  // ── Transport ──────────────────────────────────────────────────────────────
  diesel:          { factor: 2.66155, co2: 2.62818, ch4: 0.0000104, n2o: 0.0001248, unit: 'L',  label_sl: 'Dizel',               label_en: 'Diesel' },
  petrol:          { factor: 2.33984, co2: 2.32567, ch4: 0.0002929, n2o: 0.0000225, unit: 'L',  label_sl: 'Bencin',              label_en: 'Petrol' },
  lpg:             { factor: 1.55713, co2: 1.55491, ch4: 0.0000486, n2o: 0.0000033, unit: 'L',  label_sl: 'LPG',                 label_en: 'LPG' },
  cng:             { factor: 0.45070, co2: 0.44982, ch4: 0.0000239, n2o: 0.0000008, unit: 'L',  label_sl: 'CNG',                 label_en: 'CNG' },
  lng:             { factor: 1.17797, co2: 1.17568, ch4: 0.0000625, n2o: 0.0000020, unit: 'L',  label_sl: 'LNG',                 label_en: 'LNG' },
  // ── Stationary ─────────────────────────────────────────────────────────────
  natural_gas:     { factor: 2.13849, co2: 2.13416, ch4: 0.0001168, n2o: 0.0000040, unit: 'm³', label_sl: 'Zemeljski plin',      label_en: 'Natural gas' },
  heating_oil:     { factor: 2.75541, co2: 2.72417, ch4: 0.0001125, n2o: 0.0001060, unit: 'L',  label_sl: 'Kurilno olje',        label_en: 'Heating oil' },
  heavy_fuel_oil:  { factor: 3.10202, co2: 3.06194, ch4: 0.0000500, n2o: 0.0001460, unit: 'L',  label_sl: 'Težko kurilno olje',  label_en: 'Heavy fuel oil' },
  kerosene:        { factor: 2.54016, co2: 2.52782, ch4: 0.0002407, n2o: 0.0000211, unit: 'L',  label_sl: 'Kerozin',             label_en: 'Kerosene' },
  propane:         { factor: 1.54358, co2: 1.54140, ch4: 0.0000475, n2o: 0.0000032, unit: 'L',  label_sl: 'Propan',              label_en: 'Propane' },
  butane:          { factor: 1.74533, co2: 1.74296, ch4: 0.0000514, n2o: 0.0000035, unit: 'L',  label_sl: 'Butan',               label_en: 'Butane' },
  // ── Coal ───────────────────────────────────────────────────────────────────
  coal_anthracite: { factor: 3.16465, co2: 3.14416, ch4: 0.0003024, n2o: 0.0000454, unit: 'kg', label_sl: 'Premog – antracit',   label_en: 'Coal – Anthracite' },
  coal_bituminous: { factor: 2.39529, co2: 2.37072, ch4: 0.0002728, n2o: 0.0000639, unit: 'kg', label_sl: 'Premog – bituminozni', label_en: 'Coal – Bituminous' },
  coal_lignite:    { factor: 1.01500, co2: 1.00200, ch4: 0.0000430, n2o: 0.0000453, unit: 'kg', label_sl: 'Premog – lignit',     label_en: 'Coal – Lignite' },
  coke:            { factor: 3.38657, co2: 3.37705, ch4: 0.0001368, n2o: 0.0000215, unit: 'kg', label_sl: 'Koks',                label_en: 'Coke' },
  // ── Bioenergy ──────────────────────────────────────────────────────────────
  wood:            { factor: 0.04699, co2: 0.04699, ch4: 0.0000000, n2o: 0.0000000, unit: 'kg', label_sl: 'Les / polena',        label_en: 'Wood / logs' },
  wood_chips:      { factor: 0.04344, co2: 0.04344, ch4: 0.0000000, n2o: 0.0000000, unit: 'kg', label_sl: 'Les / biomasa',       label_en: 'Wood / biomass' },
  wood_pellets:    { factor: 0.05519, co2: 0.05519, ch4: 0.0000000, n2o: 0.0000000, unit: 'kg', label_sl: 'Lesne pelete',        label_en: 'Wood pellets' },
  biodiesel:       { factor: 0.16751, co2: 0.16751, ch4: 0.0000000, n2o: 0.0000000, unit: 'L',  label_sl: 'Biodizel',            label_en: 'Biodiesel' },
  biogas:          { factor: 0.00143, co2: 0.00000, ch4: 0.0000050, n2o: 0.0000000, unit: 'm³', label_sl: 'Bioplin',             label_en: 'Biogas' },
  // ── Other ──────────────────────────────────────────────────────────────────
  msw:             { factor: 0.52430, co2: 0.52000, ch4: 0.0000286, n2o: 0.0002264, unit: 'kg', label_sl: 'Komunalni odpadki',   label_en: 'Municipal solid waste' },
}

const FUEL_BY_YEAR: Record<number, Record<string, FuelEntry>> = {
  2023: FUEL_2023,
  2024: FUEL_2024,
  2025: FUEL_2025,
}

export function getFuelFactors(year: number): Record<string, FuelEntry> {
  if (year <= 2023) return FUEL_BY_YEAR[2023]
  if (year >= 2025) return FUEL_BY_YEAR[2025]
  return FUEL_BY_YEAR[year] ?? FUEL_BY_YEAR[2024]
}

// Backwards-compat export — uses 2024 values
export const FUEL_FACTORS = FUEL_BY_YEAR[2024]
// Legacy alias kept for existing imports
const FUEL_BASE = FUEL_BY_YEAR[2024]

// ─── Electricity grid (kg CO2e / kWh) ───────────────────────────────────────
// Source: ARSO (SI), IEA national averages (other)
// Years before 2023 are disabled — reporting periods start at 2023.
type ElecEntry = { factor: number; label: string }
const ELECTRICITY_BY_YEAR: Record<number, Record<string, ElecEntry>> = {
  2023: {
    SI: { factor: 0.2630, label: 'Slovenija (ARSO 2023)' },
    HR: { factor: 0.2280, label: 'Hrvaška (2023)' },
    AT: { factor: 0.1450, label: 'Avstrija (2023)' },
    DE: { factor: 0.3800, label: 'Nemčija (2023)' },
    IT: { factor: 0.3450, label: 'Italija (2023)' },
    EU: { factor: 0.2840, label: 'EU povprečje (2023)' },
  },
  2024: {
    SI: { factor: 0.2578, label: 'Slovenija (ARSO 2024)' },
    HR: { factor: 0.2190, label: 'Hrvaška (2024)' },
    AT: { factor: 0.1260, label: 'Avstrija (2024)' },
    DE: { factor: 0.3640, label: 'Nemčija (2024)' },
    IT: { factor: 0.3330, label: 'Italija (2024)' },
    EU: { factor: 0.2760, label: 'EU povprečje (2024)' },
  },
  2025: {
    SI: { factor: 0.2578, label: 'Slovenija (ARSO 2025)' },
    HR: { factor: 0.2190, label: 'Hrvaška (2025)' },
    AT: { factor: 0.1260, label: 'Avstrija (2025)' },
    DE: { factor: 0.3640, label: 'Nemčija (2025)' },
    IT: { factor: 0.3330, label: 'Italija (2025)' },
    EU: { factor: 0.2760, label: 'EU povprečje (2025)' },
  },
  2026: {
    SI: { factor: 0.2578, label: 'Slovenija (ARSO 2026)' },
    HR: { factor: 0.2190, label: 'Hrvaška (2026)' },
    AT: { factor: 0.1260, label: 'Avstrija (2026)' },
    DE: { factor: 0.3640, label: 'Nemčija (2026)' },
    IT: { factor: 0.3330, label: 'Italija (2026)' },
    EU: { factor: 0.2760, label: 'EU povprečje (2026)' },
  },
}

export function getElectricityFactors(year: number): Record<string, ElecEntry> {
  return ELECTRICITY_BY_YEAR[year] ?? ELECTRICITY_BY_YEAR[2026]
}

export const ELECTRICITY_FACTORS = ELECTRICITY_BY_YEAR[2024]

// ─── District heat (kg CO2e / kWh) ──────────────────────────────────────────
type HeatEntry = { factor: number; label: string }
const HEAT_BY_YEAR: Record<number, Record<string, HeatEntry>> = {
  2023: {
    SI: { factor: 0.0730, label: 'Slovenija (2023)' },
    HR: { factor: 0.1250, label: 'Hrvaška (2023)' },
    AT: { factor: 0.0840, label: 'Avstrija (2023)' },
    DE: { factor: 0.1500, label: 'Nemčija (2023)' },
    IT: { factor: 0.1140, label: 'Italija (2023)' },
    EU: { factor: 0.1240, label: 'EU povprečje (2023)' },
  },
  2024: {
    SI: { factor: 0.0701, label: 'Slovenija (2024)' },
    HR: { factor: 0.1200, label: 'Hrvaška (2024)' },
    AT: { factor: 0.0800, label: 'Avstrija (2024)' },
    DE: { factor: 0.1440, label: 'Nemčija (2024)' },
    IT: { factor: 0.1100, label: 'Italija (2024)' },
    EU: { factor: 0.1200, label: 'EU povprečje (2024)' },
  },
  2025: {
    SI: { factor: 0.0701, label: 'Slovenija (2025)' },
    HR: { factor: 0.1200, label: 'Hrvaška (2025)' },
    AT: { factor: 0.0800, label: 'Avstrija (2025)' },
    DE: { factor: 0.1440, label: 'Nemčija (2025)' },
    IT: { factor: 0.1100, label: 'Italija (2025)' },
    EU: { factor: 0.1200, label: 'EU povprečje (2025)' },
  },
  2026: {
    SI: { factor: 0.0701, label: 'Slovenija (2026)' },
    HR: { factor: 0.1200, label: 'Hrvaška (2026)' },
    AT: { factor: 0.0800, label: 'Avstrija (2026)' },
    DE: { factor: 0.1440, label: 'Nemčija (2026)' },
    IT: { factor: 0.1100, label: 'Italija (2026)' },
    EU: { factor: 0.1200, label: 'EU povprečje (2026)' },
  },
}

export function getHeatFactors(year: number): Record<string, HeatEntry> {
  return HEAT_BY_YEAR[year] ?? HEAT_BY_YEAR[2026]
}

export const HEAT_FACTORS = HEAT_BY_YEAR[2024]

// ─── District steam (kg CO2e / kWh) ─────────────────────────────────────────
type SteamEntry = { factor: number; label: string }
const STEAM_BY_YEAR: Record<number, Record<string, SteamEntry>> = {
  2023: {
    SI: { factor: 0.0855, label: 'Slovenija (2023)' },
    HR: { factor: 0.1400, label: 'Hrvaška (2023)' },
    AT: { factor: 0.0990, label: 'Avstrija (2023)' },
    DE: { factor: 0.1650, label: 'Nemčija (2023)' },
    IT: { factor: 0.1310, label: 'Italija (2023)' },
    EU: { factor: 0.1400, label: 'EU povprečje (2023)' },
  },
  2024: {
    SI: { factor: 0.0820, label: 'Slovenija (2024)' },
    HR: { factor: 0.1350, label: 'Hrvaška (2024)' },
    AT: { factor: 0.0950, label: 'Avstrija (2024)' },
    DE: { factor: 0.1580, label: 'Nemčija (2024)' },
    IT: { factor: 0.1250, label: 'Italija (2024)' },
    EU: { factor: 0.1350, label: 'EU povprečje (2024)' },
  },
  2025: {
    SI: { factor: 0.0820, label: 'Slovenija (2025)' },
    HR: { factor: 0.1350, label: 'Hrvaška (2025)' },
    AT: { factor: 0.0950, label: 'Avstrija (2025)' },
    DE: { factor: 0.1580, label: 'Nemčija (2025)' },
    IT: { factor: 0.1250, label: 'Italija (2025)' },
    EU: { factor: 0.1350, label: 'EU povprečje (2025)' },
  },
  2026: {
    SI: { factor: 0.0820, label: 'Slovenija (2026)' },
    HR: { factor: 0.1350, label: 'Hrvaška (2026)' },
    AT: { factor: 0.0950, label: 'Avstrija (2026)' },
    DE: { factor: 0.1580, label: 'Nemčija (2026)' },
    IT: { factor: 0.1250, label: 'Italija (2026)' },
    EU: { factor: 0.1350, label: 'EU povprečje (2026)' },
  },
}

export function getSteamFactors(year: number): Record<string, SteamEntry> {
  return STEAM_BY_YEAR[year] ?? STEAM_BY_YEAR[2026]
}

export const STEAM_FACTORS = STEAM_BY_YEAR[2024]

// ─── Purchased cooling (kg CO2e / kWh) ──────────────────────────────────────
// Method-based, not country-based — stable year to year
type CoolingEntry = { factor: number; label_sl: string; label_en: string }
export const COOLING_FACTORS: Record<string, CoolingEntry> = {
  air_cooled:    { factor: 0.2800, label_sl: 'Zrakom hlajeno',    label_en: 'Air-Cooled' },
  water_cooled:  { factor: 0.2200, label_sl: 'Vodo hlajeno',      label_en: 'Water-Cooled' },
  absorption:    { factor: 0.1500, label_sl: 'Absorpcijsko',       label_en: 'Absorption' },
  district_cool: { factor: 0.1800, label_sl: 'Daljinsko hlajenje', label_en: 'District Cooling' },
}

export function getCoolingFactors(_year: number): Record<string, CoolingEntry> {
  return COOLING_FACTORS
}

// ─── Refrigerant GWP (kg CO2e / kg leaked) — DEFRA condensed set ────────────
// Source: DEFRA "Refrigerant & other" sheet — same values 2023/2024/2025 (IPCC AR5 basis).
// Blends use the DEFRA "Total emissions including non-Kyoto products" column.
// R-22 is a Montreal Protocol (non-Kyoto) gas → Scope 1 reportable separately.
// R-290 (propane): DEFRA non-Kyoto GWP = 0.06 (effectively negligible).
// R-452A: not in DEFRA condensed set; ASHRAE/EU F-gas value used (2140).
// GWP values do not change annually — they change only with a new IPCC assessment report.
export const REFRIGERANT_FACTORS: Record<string, { factor: number; label: string; unit: string }> = {
  'R-410A':  { factor: 1924,  label: 'R-410A',              unit: 'kg' },
  'R-134a':  { factor: 1300,  label: 'R-134a',              unit: 'kg' },
  'R-404A':  { factor: 3943,  label: 'R-404A',              unit: 'kg' },
  'R-407C':  { factor: 1624,  label: 'R-407C',              unit: 'kg' },
  'R-32':    { factor: 677,   label: 'R-32',                unit: 'kg' },
  'R-22':    { factor: 1760,  label: 'R-22 (HCFC)',         unit: 'kg' },
  'R-507A':  { factor: 3985,  label: 'R-507A',              unit: 'kg' },
  'R-452A':  { factor: 2140,  label: 'R-452A',              unit: 'kg' },
  'R-290':   { factor: 0.06,  label: 'R-290 (propan)',      unit: 'kg' },
  'R-744':   { factor: 1,     label: 'R-744 (CO₂)',         unit: 'kg' },
  'custom':  { factor: 0,     label: 'Po meri / Custom',    unit: 'kg' },
}

// ─── Industrial gas GWP (kg CO2e / kg) — IPCC AR6 ───────────────────────────
export const INDUSTRIAL_GAS_FACTORS: Record<string, { factor: number; label: string; unit: string }> = {
  'CO2':    { factor: 1,     label: 'CO₂ – ogljikov dioksid',        unit: 'kg' },
  'CH4':    { factor: 28,    label: 'CH₄ – metan',                   unit: 'kg' },
  'N2O':    { factor: 265,   label: 'N₂O – didušikov oksid',         unit: 'kg' },
  'SF6':    { factor: 23500, label: 'SF₆ – žveplov heksafluorid',    unit: 'kg' },
  'HFC-23': { factor: 12400, label: 'HFC-23 (CHF₃)',                 unit: 'kg' },
  'NF3':    { factor: 16100, label: 'NF₃ – dušikov trifluorid',      unit: 'kg' },
  'PFC-14': { factor: 6630,  label: 'PFC-14 (CF₄)',                  unit: 'kg' },
}

// ─── Shared helpers ──────────────────────────────────────────────────────────
export function calcCo2eKg(quantity: number, factorKgPerUnit: number): number {
  return parseFloat((quantity * factorKgPerUnit).toFixed(4))
}

/** Compute individual gas amounts (kg) from fuel quantity, fuel key, and reporting year.
 *  Uses year-specific DEFRA factors (2023/2024/2025). Defaults to 2024 if year not provided. */
export function calcFuelGases(quantity: number, fuelKey: string, year?: number): {
  co2_kg: number; ch4_kg: number; n2o_kg: number
} {
  const factors = year ? getFuelFactors(year) : FUEL_BASE
  const f = factors[fuelKey]
  if (!f) return { co2_kg: 0, ch4_kg: 0, n2o_kg: 0 }
  return {
    co2_kg: parseFloat((quantity * f.co2).toFixed(6)),
    ch4_kg: parseFloat((quantity * f.ch4).toFixed(8)),
    n2o_kg: parseFloat((quantity * f.n2o).toFixed(8)),
  }
}

/** Map industrial gas type to the per-gas column it belongs to. */
export function industrialGasColumn(gasType: string): 'co2_kg' | 'ch4_kg' | 'n2o_kg' | 'sf6_kg' | 'hfc_kg' | 'pfc_kg' {
  if (gasType === 'CO2') return 'co2_kg'
  if (gasType === 'CH4') return 'ch4_kg'
  if (gasType === 'N2O') return 'n2o_kg'
  if (gasType === 'SF6') return 'sf6_kg'
  if (gasType.startsWith('HFC') || gasType === 'HFC-23') return 'hfc_kg'
  if (gasType.startsWith('PFC') || gasType === 'NF3') return 'pfc_kg'
  return 'hfc_kg' // fallback
}
