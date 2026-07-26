'use client'

import {
  Document, Page, Text, View, StyleSheet, Font, pdf,
} from '@react-pdf/renderer'

const BLUE = '#1d4ed8'
const GRAY = '#6b7280'
const LIGHT = '#f3f4f6'
const BORDER = '#e5e7eb'
const BLACK = '#111827'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: BLACK, paddingTop: 48, paddingBottom: 48, paddingHorizontal: 48 },
  // Cover
  coverPage: { fontFamily: 'Helvetica', justifyContent: 'center', paddingHorizontal: 64, paddingVertical: 80 },
  coverAccent: { width: 48, height: 4, backgroundColor: BLUE, marginBottom: 32 },
  coverTitle: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: BLACK, marginBottom: 8 },
  coverSub: { fontSize: 13, color: GRAY, marginBottom: 48 },
  coverOrg: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: BLACK, marginBottom: 4 },
  coverYear: { fontSize: 11, color: GRAY, marginBottom: 64 },
  coverFooter: { fontSize: 8, color: GRAY, borderTop: `1 solid ${BORDER}`, paddingTop: 16 },
  // Section
  sectionTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: BLACK, marginBottom: 2 },
  sectionSub: { fontSize: 9, color: GRAY, marginBottom: 12 },
  scopeTotal: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: BLUE },
  // Summary table
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottom: `1 solid ${BORDER}` },
  summaryLabel: { fontSize: 9, color: GRAY },
  summaryValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: BLACK },
  // Source block
  sourceHeader: { backgroundColor: LIGHT, paddingHorizontal: 10, paddingVertical: 6, marginTop: 8 },
  sourceTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: BLACK },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 5, borderBottom: `1 solid ${BORDER}` },
  fieldLabel: { fontSize: 8, color: GRAY, flex: 1 },
  fieldValue: { fontSize: 8, color: BLACK, flex: 2, textAlign: 'right' },
  // Stat boxes
  statBox: { flex: 1, backgroundColor: LIGHT, padding: 12, marginRight: 8, borderRadius: 4 },
  statLabel: { fontSize: 7, color: GRAY, marginBottom: 4 },
  statValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: BLACK },
  statUnit: { fontSize: 7, color: GRAY },
  // Misc
  row: { flexDirection: 'row' },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  mb24: { marginBottom: 24 },
  pageNumber: { position: 'absolute', bottom: 24, right: 48, fontSize: 8, color: GRAY },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 12, borderBottom: `1 solid ${BORDER}` },
  pageHeaderLabel: { fontSize: 8, color: GRAY },
})

type SourceRow = { name: string; methodology: string; calcType: string; factorSet: string; co2e_kg: number }
type ScopeBlock = { total: number; sources: SourceRow[] }

function fmtT(kg: number) { return (kg / 1000).toFixed(4).replace('.', ',') }
function fmtDate() { return new Date().toLocaleDateString('sl-SI') }

function PageHeader({ org, year }: { org: string; year: number }) {
  return (
    <View style={s.pageHeader} fixed>
      <Text style={s.pageHeaderLabel}>{org} · GHG Poročilo {year}</Text>
      <Text style={s.pageHeaderLabel}>GHG Protocol · DEFRA {year}</Text>
    </View>
  )
}

function ScopeSection({ label, sub, data }: { label: string; sub: string; data: ScopeBlock }) {
  return (
    <View style={s.mb24} wrap={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
        <View>
          <Text style={s.sectionTitle}>{label}</Text>
          <Text style={s.sectionSub}>{sub}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.scopeTotal}>{fmtT(data.total)} tCO₂e</Text>
          <Text style={s.summaryLabel}>Bruto emisije</Text>
        </View>
      </View>

      {data.sources.length === 0 ? (
        <Text style={{ fontSize: 8, color: GRAY }}>Ni vnosov za to poročevalsko leto.</Text>
      ) : (
        data.sources.map((src, i) => (
          <View key={i} style={s.mb8}>
            <View style={s.sourceHeader}>
              <Text style={s.sourceTitle}>{src.name}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Metodologija izračuna GHG</Text>
              <Text style={s.fieldValue}>{src.methodology}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Vrsta izračuna</Text>
              <Text style={s.fieldValue}>{src.calcType}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Nabor emisijskih faktorjev</Text>
              <Text style={s.fieldValue}>{src.factorSet}</Text>
            </View>
            <View style={[s.fieldRow, { borderBottom: 0 }]}>
              <Text style={s.fieldLabel}>Emisije</Text>
              <Text style={[s.fieldValue, { fontFamily: 'Helvetica-Bold', color: BLUE }]}>{fmtT(src.co2e_kg)} tCO₂e</Text>
            </View>
          </View>
        ))
      )}
    </View>
  )
}

export function GhgPdfDocument({ orgName, year, period, scope1, scope2, scope3 }: {
  orgName: string; year: number
  period: { start: string; end: string } | null
  scope1: ScopeBlock; scope2: ScopeBlock; scope3: ScopeBlock
}) {
  const grandTotal = scope1.total + scope2.total + scope3.total

  return (
    <Document title={`GHG Poročilo ${orgName} ${year}`} author={orgName} creator="CarbonTrack">
      {/* Cover page */}
      <Page size="A4" style={[s.page, s.coverPage]}>
        <View style={s.coverAccent} />
        <Text style={s.coverTitle}>GHG Poročilo o emisijah</Text>
        <Text style={s.coverSub}>Poročilo o metodologiji in emisijah toplogrednih plinov</Text>
        <Text style={s.coverOrg}>{orgName}</Text>
        <Text style={s.coverYear}>Poročevalsko leto {year}</Text>

        {/* Summary boxes */}
        <View style={[s.row, s.mb24]}>
          {[
            { label: 'Skupne emisije', value: fmtT(grandTotal), unit: 'tCO₂e' },
            { label: 'Scope 1', value: fmtT(scope1.total), unit: 'tCO₂e' },
            { label: 'Scope 2', value: fmtT(scope2.total), unit: 'tCO₂e' },
            { label: 'Scope 3', value: fmtT(scope3.total), unit: 'tCO₂e' },
          ].map((box, i) => (
            <View key={i} style={[s.statBox, i === 3 && { marginRight: 0 }]}>
              <Text style={s.statLabel}>{box.label}</Text>
              <Text style={s.statValue}>{box.value}</Text>
              <Text style={s.statUnit}>{box.unit}</Text>
            </View>
          ))}
        </View>

        <View style={s.coverFooter}>
          <Text>Pripravljeno: {fmtDate()} · Standardu: GHG Protocol Corporate Standard · Emisijski faktorji: DEFRA {year}</Text>
        </View>
      </Page>

      {/* Detail page */}
      <Page size="A4" style={s.page}>
        <PageHeader org={orgName} year={year} />

        {/* Reporting period */}
        <View style={s.mb24}>
          <Text style={[s.sectionTitle, s.mb8]}>Poročevalsko obdobje</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Začetni datum</Text>
            <Text style={s.summaryValue}>{period?.start ?? '—'}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Končni datum</Text>
            <Text style={s.summaryValue}>{period?.end ?? '—'}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Skupne emisije</Text>
            <Text style={[s.summaryValue, { color: BLUE }]}>{fmtT(grandTotal)} tCO₂e</Text>
          </View>
        </View>

        <ScopeSection label="Scope 1 — Direktne emisije"
          sub="Neposredne emisije toplogrednih plinov iz virov v lasti ali pod nadzorom organizacije"
          data={scope1} />

        <ScopeSection label="Scope 2 — Posredne emisije iz energije"
          sub="Posredne emisije iz nakupa elektrike, toplote, pare in hlajenja"
          data={scope2} />

        <ScopeSection label="Scope 3 — Ostale posredne emisije"
          sub="Emisije vrednostne verige, ki niso vključene v Scope 1 ali 2"
          data={scope3} />

        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  )
}

export async function downloadGhgPdf(props: Parameters<typeof GhgPdfDocument>[0]) {
  const blob = await pdf(<GhgPdfDocument {...props} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `GHG-Porocilo-${props.orgName}-${props.year}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
