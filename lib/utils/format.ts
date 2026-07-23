export function formatNumber(n: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export function parseQty(val: any): number {
  const s = String(val).trim().replace(/\s/g, '')
  if (!s) return NaN

  const dotCount = (s.match(/\./g) || []).length
  const commaCount = (s.match(/,/g) || []).length

  // Multiple dots → SI thousands: "1.000.000" or "1.000.000,50"
  if (dotCount > 1) return parseFloat(s.replace(/\./g, '').replace(',', '.'))

  // Multiple commas → US thousands: "1,000,000"
  if (commaCount > 1) return parseFloat(s.replace(/,/g, ''))

  // Both dot and comma → whichever comes first is thousands
  if (dotCount === 1 && commaCount === 1) {
    return s.indexOf('.') < s.indexOf(',')
      ? parseFloat(s.replace('.', '').replace(',', '.'))  // "1.000,50" SI
      : parseFloat(s.replace(',', ''))                    // "1,000.50" US
  }

  // Only comma
  if (commaCount === 1) {
    const [intPart, decPart] = s.split(',')
    // exactly 3 digits after comma = thousands separator ("100,000" → 100000)
    if (decPart.length === 3 && /^\d+$/.test(intPart) && /^\d+$/.test(decPart)) {
      return parseFloat(s.replace(',', ''))
    }
    return parseFloat(s.replace(',', '.'))
  }

  // Only dot
  if (dotCount === 1) {
    const [intPart, decPart] = s.split('.')
    // exactly 3 digits after dot = thousands separator ("100.000" → 100000)
    if (decPart.length === 3 && /^\d+$/.test(intPart) && /^\d+$/.test(decPart)) {
      return parseFloat(s.replace('.', ''))
    }
    return parseFloat(s)
  }

  return parseFloat(s)
}

export function fmtQty(val: any): string {
  const n = parseQty(val)
  if (isNaN(n)) return String(val)
  return n.toLocaleString('sl-SI', { maximumFractionDigits: 6 })
}

export function formatPercent(n: number): string {
  return `${Math.round(n)}%`
}
