export function formatNumber(n: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

// Parse a number string that may use SI (dot=thousands, comma=decimal)
// or US (comma=thousands, dot=decimal) formatting
export function parseQty(val: any): number {
  const s = String(val).trim()
  // SI format: "100.000" or "1.000.000,50"
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(s)) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.'))
  }
  // US format: "100,000" or "1,000,000.50"
  if (/^\d{1,3}(,\d{3})*(\.\d+)?$/.test(s)) {
    return parseFloat(s.replace(/,/g, ''))
  }
  // Fallback: comma as decimal separator
  return parseFloat(s.replace(',', '.'))
}

export function fmtQty(val: any): string {
  const n = parseQty(val)
  if (isNaN(n)) return String(val)
  return n.toLocaleString('sl-SI', { maximumFractionDigits: 6 })
}

export function formatPercent(n: number): string {
  return `${Math.round(n)}%`
}
