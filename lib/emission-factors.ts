// Emission factors by reporting year
// Fuel combustion: DEFRA (gov.uk/government/collections/government-conversion-factors-for-company-reporting)
// Electricity SI: ARSO (arso.gov.si)
// Electricity other: IEA national averages
// Refrigerants / industrial gases: IPCC AR6 GWP (stable — not year-dependent)

// ─── Fuel combustion (DEFRA) ─────────────────────────────────────────────────
// Fuel calorific values change <0.5% year-to-year; 2024 values used for all years.
// Update from DEFRA spreadsheet each June/July.
type FuelEntry = { factor: number; unit: string; label_sl: string; label_en: string }
const FUEL_BASE: Record<string, FuelEntry> = {
  diesel:      { factor: 2.68713, unit: 'L',  label_sl: 'Dizel',          label_en: 'Diesel' },
  petrol:      { factor: 2.31376, unit: 'L',  label_sl: 'Bencin',         label_en: 'Petrol' },
  lpg:         { factor: 1.63396, unit: 'L',  label_sl: 'LPG',            label_en: 'LPG' },
  cng:         { factor: 2.06964, unit: 'kg', label_sl: 'CNG',            label_en: 'CNG' },
  natural_gas: { factor: 2.02230, unit: 'm³', label_sl: 'Zemeljski plin', label_en: 'Natural gas' },
  heating_oil: { factor: 2.51963, unit: 'L',  label_sl: 'Kurilno olje',   label_en: 'Heating oil' },
  wood_chips:  { factor: 0.01530, unit: 'kg', label_sl: 'Les / biomasa',  label_en: 'Wood / biomass' },
}

export function getFuelFactors(_year: number): Record<string, FuelEntry> {
  return FUEL_BASE
}

// Backwards-compat export (uses current year implicitly — prefer getFuelFactors)
export const FUEL_FACTORS = FUEL_BASE

// ─── Electricity grid (kg CO2e / kWh) ───────────────────────────────────────
type ElecEntry = { factor: number; label: string }
const ELECTRICITY_BY_YEAR: Record<number, Record<string, ElecEntry>> = {
  2021: {
    SI: { factor: 0.3100, label: 'Slovenija (ARSO 2021)' },
    HR: { factor: 0.2700, label: 'Hrvaška (2021)' },
    AT: { factor: 0.1750, label: 'Avstrija (2021)' },
    DE: { factor: 0.4500, label: 'Nemčija (2021)' },
    IT: { factor: 0.3800, label: 'Italija (2021)' },
    EU: { factor: 0.3200, label: 'EU povprečje (2021)' },
  },
  2022: {
    SI: { factor: 0.2890, label: 'Slovenija (ARSO 2022)' },
    HR: { factor: 0.2450, label: 'Hrvaška (2022)' },
    AT: { factor: 0.1580, label: 'Avstrija (2022)' },
    DE: { factor: 0.4200, label: 'Nemčija (2022)' },
    IT: { factor: 0.3590, label: 'Italija (2022)' },
    EU: { factor: 0.3020, label: 'EU povprečje (2022)' },
  },
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
  2021: {
    SI: { factor: 0.0810, label: 'Slovenija (2021)' },
    HR: { factor: 0.1380, label: 'Hrvaška (2021)' },
    AT: { factor: 0.0920, label: 'Avstrija (2021)' },
    DE: { factor: 0.1630, label: 'Nemčija (2021)' },
    IT: { factor: 0.1220, label: 'Italija (2021)' },
    EU: { factor: 0.1320, label: 'EU povprečje (2021)' },
  },
  2022: {
    SI: { factor: 0.0760, label: 'Slovenija (2022)' },
    HR: { factor: 0.1300, label: 'Hrvaška (2022)' },
    AT: { factor: 0.0870, label: 'Avstrija (2022)' },
    DE: { factor: 0.1560, label: 'Nemčija (2022)' },
    IT: { factor: 0.1180, label: 'Italija (2022)' },
    EU: { factor: 0.1280, label: 'EU povprečje (2022)' },
  },
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
  2021: {
    SI: { factor: 0.0960, label: 'Slovenija (2021)' },
    HR: { factor: 0.1550, label: 'Hrvaška (2021)' },
    AT: { factor: 0.1090, label: 'Avstrija (2021)' },
    DE: { factor: 0.1800, label: 'Nemčija (2021)' },
    IT: { factor: 0.1440, label: 'Italija (2021)' },
    EU: { factor: 0.1550, label: 'EU povprečje (2021)' },
  },
  2022: {
    SI: { factor: 0.0890, label: 'Slovenija (2022)' },
    HR: { factor: 0.1460, label: 'Hrvaška (2022)' },
    AT: { factor: 0.1030, label: 'Avstrija (2022)' },
    DE: { factor: 0.1720, label: 'Nemčija (2022)' },
    IT: { factor: 0.1360, label: 'Italija (2022)' },
    EU: { factor: 0.1460, label: 'EU povprečje (2022)' },
  },
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

// ─── Refrigerant GWP (kg CO2e / kg leaked) — IPCC AR6 ───────────────────────
export const REFRIGERANT_FACTORS: Record<string, { factor: number; label: string; unit: string }> = {
  'R-410A':  { factor: 2088,  label: 'R-410A',              unit: 'kg' },
  'R-134a':  { factor: 1430,  label: 'R-134a',              unit: 'kg' },
  'R-404A':  { factor: 3922,  label: 'R-404A',              unit: 'kg' },
  'R-407C':  { factor: 1774,  label: 'R-407C',              unit: 'kg' },
  'R-32':    { factor: 675,   label: 'R-32',                unit: 'kg' },
  'R-22':    { factor: 1810,  label: 'R-22 (HCFC)',         unit: 'kg' },
  'R-507A':  { factor: 3985,  label: 'R-507A',              unit: 'kg' },
  'R-452A':  { factor: 2140,  label: 'R-452A',              unit: 'kg' },
  'R-290':   { factor: 3,     label: 'R-290 (propan)',      unit: 'kg' },
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

// ─── Shared helper ───────────────────────────────────────────────────────────
export function calcCo2eKg(quantity: number, factorKgPerUnit: number): number {
  return parseFloat((quantity * factorKgPerUnit).toFixed(4))
}
