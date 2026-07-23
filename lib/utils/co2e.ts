export function calculateCo2e(quantity: number, factorKgCo2e: number): number {
  return quantity * factorKgCo2e
}

export function kgToTonnes(kg: number): number {
  return kg / 1000
}

export function formatCo2e(kg: number): string {
  const tonnes = kgToTonnes(kg)
  if (tonnes >= 1000) return `${(tonnes / 1000).toFixed(2)} ktCO₂e`
  if (tonnes >= 1) return `${tonnes.toFixed(2)} tCO₂e`
  return `${kg.toFixed(2)} kg CO₂e`
}
