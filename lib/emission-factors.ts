// DEFRA 2024 emission factors (kg CO2e per unit)

export const FUEL_FACTORS: Record<string, { factor: number; unit: string; label_sl: string; label_en: string }> = {
  diesel:      { factor: 2.68713, unit: 'L',  label_sl: 'Dizel',           label_en: 'Diesel' },
  petrol:      { factor: 2.31376, unit: 'L',  label_sl: 'Bencin',          label_en: 'Petrol' },
  lpg:         { factor: 1.63396, unit: 'L',  label_sl: 'LPG',             label_en: 'LPG' },
  cng:         { factor: 2.06964, unit: 'kg', label_sl: 'CNG',             label_en: 'CNG' },
  natural_gas: { factor: 2.02230, unit: 'm³', label_sl: 'Zemeljski plin',  label_en: 'Natural gas' },
  heating_oil: { factor: 2.51963, unit: 'L',  label_sl: 'Kurilno olje',    label_en: 'Heating oil' },
  wood_chips:  { factor: 0.01530, unit: 'kg', label_sl: 'Les / biomasa',   label_en: 'Wood / biomass' },
}

// kg CO2e per kWh — country-specific electricity grid factor
export const ELECTRICITY_FACTORS: Record<string, { factor: number; label: string }> = {
  SI: { factor: 0.2578, label: 'Slovenija (ARSO 2024)' },
  HR: { factor: 0.2190, label: 'Hrvaška' },
  AT: { factor: 0.1260, label: 'Avstrija' },
  DE: { factor: 0.3640, label: 'Nemčija' },
  IT: { factor: 0.3330, label: 'Italija' },
  EU: { factor: 0.2760, label: 'EU povprečje' },
}

// kg CO2e per kWh — district heat factors (DEFRA 2024 + EU averages)
export const HEAT_FACTORS: Record<string, { factor: number; label: string }> = {
  SI: { factor: 0.0701, label: 'Slovenija' },
  HR: { factor: 0.1200, label: 'Hrvaška' },
  AT: { factor: 0.0800, label: 'Avstrija' },
  DE: { factor: 0.1440, label: 'Nemčija' },
  IT: { factor: 0.1100, label: 'Italija' },
  EU: { factor: 0.1200, label: 'EU povprečje' },
}

// kg CO2e per kWh — district steam factors (DEFRA 2024 + EU averages)
export const STEAM_FACTORS: Record<string, { factor: number; label: string }> = {
  SI: { factor: 0.0820, label: 'Slovenija' },
  HR: { factor: 0.1350, label: 'Hrvaška' },
  AT: { factor: 0.0950, label: 'Avstrija' },
  DE: { factor: 0.1580, label: 'Nemčija' },
  IT: { factor: 0.1250, label: 'Italija' },
  EU: { factor: 0.1350, label: 'EU povprečje' },
}

// kg CO2e per kWh — purchased cooling methods
export const COOLING_FACTORS: Record<string, { factor: number; label_sl: string; label_en: string }> = {
  air_cooled:    { factor: 0.2800, label_sl: 'Zrakom hlajeno',    label_en: 'Air-Cooled' },
  water_cooled:  { factor: 0.2200, label_sl: 'Vodo hlajeno',      label_en: 'Water-Cooled' },
  absorption:    { factor: 0.1500, label_sl: 'Absorpcijsko',       label_en: 'Absorption' },
  district_cool: { factor: 0.1800, label_sl: 'Daljinsko hlajenje', label_en: 'District Cooling' },
}

// Refrigerant GWP factors (kg CO2e per kg leaked) – AR6 / IPCC 2021
export const REFRIGERANT_FACTORS: Record<string, { factor: number; label: string; unit: string }> = {
  'R-410A':  { factor: 2088,  label: 'R-410A',  unit: 'kg' },
  'R-134a':  { factor: 1430,  label: 'R-134a',  unit: 'kg' },
  'R-404A':  { factor: 3922,  label: 'R-404A',  unit: 'kg' },
  'R-407C':  { factor: 1774,  label: 'R-407C',  unit: 'kg' },
  'R-32':    { factor: 675,   label: 'R-32',    unit: 'kg' },
  'R-22':    { factor: 1810,  label: 'R-22 (HCFC)', unit: 'kg' },
  'R-507A':  { factor: 3985,  label: 'R-507A',  unit: 'kg' },
  'R-452A':  { factor: 2140,  label: 'R-452A',  unit: 'kg' },
  'R-290':   { factor: 3,     label: 'R-290 (propan)', unit: 'kg' },
  'R-744':   { factor: 1,     label: 'R-744 (CO₂)', unit: 'kg' },
  'custom':  { factor: 0,     label: 'Po meri / Custom', unit: 'kg' },
}

// Industrial process gas GWP factors (kg CO2e per kg)
export const INDUSTRIAL_GAS_FACTORS: Record<string, { factor: number; label: string; unit: string }> = {
  'CO2':    { factor: 1,     label: 'CO₂ – ogljikov dioksid', unit: 'kg' },
  'CH4':    { factor: 28,    label: 'CH₄ – metan', unit: 'kg' },
  'N2O':    { factor: 265,   label: 'N₂O – didušikov oksid', unit: 'kg' },
  'SF6':    { factor: 23500, label: 'SF₆ – žveplov heksafluorid', unit: 'kg' },
  'HFC-23': { factor: 12400, label: 'HFC-23 (CHF₃)', unit: 'kg' },
  'NF3':    { factor: 16100, label: 'NF₃ – dušikov trifluorid', unit: 'kg' },
  'PFC-14': { factor: 6630,  label: 'PFC-14 (CF₄)', unit: 'kg' },
}

export function calcCo2eKg(quantity: number, factorKgPerUnit: number): number {
  return parseFloat((quantity * factorKgPerUnit).toFixed(4))
}
