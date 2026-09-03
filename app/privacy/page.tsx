'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Loc = 'SL' | 'EN'
function getCookieLocale(): Loc {
  if (typeof document === 'undefined') return 'SL'
  const m = document.cookie.match(/locale=([^;]+)/)
  return m?.[1]?.toUpperCase() === 'EN' ? 'EN' : 'SL'
}

function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-xl font-bold mt-10 mb-3 text-gray-900 border-b border-gray-200 pb-2">{children}</h1>
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold mt-7 mb-2 text-gray-800">{children}</h2>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-700 leading-relaxed mb-3">{children}</p>
}
function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside mb-3 space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-gray-700 leading-relaxed">{item}</li>
      ))}
    </ul>
  )
}
function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full text-sm border border-gray-200 rounded">
        <thead className="bg-gray-50">
          <tr>{headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-200">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100">
              {row.map((cell, j) => <td key={j} className="px-3 py-2 text-gray-700 align-top">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const sl = {
  nav_signin: 'Prijava',
  nav_start: 'Začnite brezplačno',
  page_title: 'POLITIKA ZASEBNOSTI CARBONIQDESK',
  intro: 'Ta politika zasebnosti opisuje, katere osebne podatke zbira in obdeluje Bimetric (»Ponudnik«, »mi«), ko upravljate račun Carboniqdesk ali ga izkoriščate, in kako te podatke varujemo ter kakšne so vaše pravice v skladu z Uredbo (EU) 2016/679 (GDPR) in veljavno zakonodajo.',
  note_b2b: 'Carboniqdesk je namenjen poslovni (B2B) uporabi. Fizična oseba, ki ga uporablja kot potrošnik za zasebne ali gospodinjske namene, bi morala ta dokumenta prebrati skupaj s Splošnimi pogoji, ki opredeljujejo pričakovano vrsto razmerja.',
  last_updated: 'Zadnja posodobitev',
  last_date: '8. avgusta 2026',
  contact_label: 'Kontakt',

  s1_title: '1. UPRAVLJAVEC IN KONTAKTNI PODATKI',
  s1_body: 'Upravljavec osebnih podatkov je Bimetric, kontakt info@bimetric.si. Za vprašanja glede varstva podatkov ali uveljavljanje vaših pravic nam pišite na info@bimetric.si.',

  s2_title: '2. KATERI PODATKI SE ZBIRAJO',
  s2_subtitle: 'Kategorije podatkov, ki jih obdelujemo, ko nastopamo kot upravljavec:',
  s2_table_headers: ['Kategorija podatkov', 'Primeri'],
  s2_table_rows: [
    ['Račun podatki', 'Ime, e-poštni naslov, geslo (hashirano), vloga v organizaciji'],
    ['Emisijski podatki in inventure', 'GHG inventure, obseg 1/2/3 emisije, bazna leta, emisijski cilji'],
    ['Viri emisij – lokacije, naprave, vozila', 'Naslovi, tipi naprav, registrske oznake, kapacitete, goriva'],
    ['Podatki o energetski porabi in aktivnostnih podatkih', 'kWh, litrih goriva, tonah materiala, prevoženih km, potovanjih'],
    ['Emisijski faktorji', 'Privzeti ali prilagojeni faktorji v kg CO₂e na enoto'],
    ['Poročila in priponke', 'PDF poročila, CSV uvozi, Excel datoteke, specifikacije'],
    ['Tehnični podatki o uporabi', 'IP-naslov, brskalnik, naprava, URL, čas seje, napake'],
  ],
  s2_note: 'Carboniqdesk ni namenjen shranjevanju posebnih vrst osebnih podatkov v smislu čl. 9 GDPR (npr. zdravstveni podatki, podatki o rasnem ali etničnem izvoru) ali podatkov o kazenskih obsodbah. Takih podatkov ne vnašajte.',

  s3_title: '3. ZAKAJ OBDELUJEMO PODATKE, PRAVNA PODLAGA IN ROKI HRAMBE',
  s3_subtitle: 'Pregled namenov obdelave, pravnih podlag in okvirnih rokov hrambe:',
  s3_table_headers: ['Namen obdelave', 'Pravna podlaga', 'Okvirni rok hrambe'],
  s3_table_rows: [
    ['Ustvarjanje in upravljanje računa', 'Pogodbena nujnost (čl. 6(1)(b) GDPR)', 'Do izbrisa računa + 30 dni'],
    ['Zagotavljanje in delovanje Storitve (izračuni emisij, poročila, shranjevanje)', 'Pogodbena nujnost (čl. 6(1)(b))', 'Dokler je račun aktiven'],
    ['Varnost, zaznavanje zlorab, reševanje napak', 'Zakoniti interes (čl. 6(1)(f))', 'Tehnični dnevniki: do 90 dni, razen pri varnostnih incidentih'],
    ['Izpolnjevanje zakonskih obveznosti (davčni, računovodski predpisi)', 'Zakonska obveznost (čl. 6(1)(c))', 'Po veljavnih predpisih (npr. 5–10 let)'],
    ['Obveščanje o bistvenih spremembah Storitve', 'Zakoniti interes (čl. 6(1)(f))', 'Do odjave od komunikacij'],
    ['Statistika in razvoj Storitve (anonimizirani / agregirani)', 'Zakoniti interes (čl. 6(1)(f))', 'Anonimizirano: ni roka'],
  ],
  s3_note: 'Daljša hramba je mogoča, kadar jo zahteva zakon, zahtevek ali varnostni incident.',

  s4_title: '4. KDO PODATKE OBDELUJE – PODOBDELOVALCI IN TRETJE OSEBE',
  s4_body1: 'Za delovanje Carboniqdesk uporabljamo naslednje infrastrukturne ponudnike (podobdelovalci za obdelavo, ki jo opravljamo v imenu Naročnika):',
  s4_table_headers: ['Ponudnik', 'Vloga', 'Sedež / pravna oseba'],
  s4_table_rows: [
    ['Supabase', 'PostgreSQL podatkovna baza, avtentikacija in backend storitve', 'SUPABASE PTE. LTD., Singapore'],
    ['Vercel', 'Gostovanje, izvajanje in dostava spletne aplikacije', 'Vercel Inc., Delaware, ZDA'],
  ],
  s4_body2: 'Supabase in Vercel sta mednarodna ponudnika. Supabase navaja možno obdelavo v ZDA in drugih državah; Vercel ima primarne zmogljivosti v ZDA. Oba ponudnika vključujeta standardne pogodbene klavzule EU (SCCs) ali primerljive mehanizme, kadar je to zahtevano. Supabase vsak projekt namesti v eno primarno regijo; natančna regija konkretnega Carboniqdesk projekta iz javnih pogojev ni razvidna.',
  s4_body3: 'Podatkov ne prodajamo tretjim osebam in jih ne posredujemo za namen oglaševanja. Podatke smemo razkriti, kadar to zahteva zakon, sodišče ali pristojna oblast.',

  s5_title: '5. MEDNARODNI PRENOSI',
  s5_body1: 'Ker sta Supabase in Vercel ponudnika z infrastrukturo zunaj EGP, pri uporabi Carboniqdesk lahko pride do prenosa osebnih podatkov v tretje države (zlasti v ZDA). Prenosi se izvajajo na podlagi standardnih pogodbenih klavzul Evropske komisije (SCCs) ali primerljivih mehanizmov.',
  s5_body2: 'Več podrobnosti o lokacijah obdelave in mehanizmih za prenose je navedenih v Splošnih pogojih (XV. in XII. poglavje).',

  s6_title: '6. VARNOST',
  s6_body: 'Ponudnik izvaja razumne tehnične in organizacijske varnostne ukrepe, vključno z nadzorom dostopa, HTTPS/TLS šifriranjem, varnim upravljanjem skrivnosti, omejitvami dostopa in posodabljanjem kode. Natančni ukrepi so opisani v Splošnih pogojih (Priloga 2). Noben sistem ni absolutno varen; ob sumu zlorabe takoj kontaktirajte info@bimetric.si.',
  s6_backup_title: 'Opomba glede varnostnih kopij:',
  s6_backup: 'Carboniqdesk trenutno deluje na Supabase Free načrtu, ki ne vključuje samodejnih varnostnih kopij podatkovne baze. Hranite lastne kopije poslovnokritičnih emisijskih podatkov in poročil.',

  s7_title: '7. VAŠE PRAVICE',
  s7_body: 'V skladu z GDPR imate naslednje pravice:',
  s7_rights: [
    'Pravica do dostopa – pridobite potrdilo, ali obdelujemo vaše osebne podatke.',
    'Pravica do popravka – zahtevajte popravek netočnih ali dopolnitev nepopolnih podatkov.',
    'Pravica do izbrisa (»pravica do pozabe«) – zahtevajte izbris, kadar ni zakonskega razloga za nadaljnjo hrambo.',
    'Pravica do omejitve obdelave – zahtevajte začasno ustavitev obdelave v določenih primerih.',
    'Pravica do prenosljivosti podatkov – prejmite podatke v strukturirani, pogosto uporabljeni obliki, kadar obdelava temelji na soglasju ali pogodbi.',
    'Pravica do ugovora – ugovarjajte obdelavi, ki temelji na zakonitem interesu.',
    'Pravica do umika soglasja – kadar obdelava temelji na soglasju, ga kadarkoli brez posledic umaknite.',
    'Pravica do vložitve pritožbe – pritožbo vložite pri Informacijskem pooblaščencu RS (ip-rs.si) ali pristojnem nadzornem organu v vaši državi.',
  ],
  s7_contact: 'Zahteve in vprašanja pošljite na info@bimetric.si. Na zahteve bomo odgovorili v zakonsko določenem roku (praviloma v 30 dneh).',

  s8_title: '8. PIŠKOTKI IN PODOBNE TEHNOLOGIJE',
  s8_body1: 'Carboniqdesk uporablja samo tehnično nujne piškotke in mehanizme za shranjevanje seje, ki so potrebni za delovanje prijave, varnost in osnovno delovanje Storitve.',
  s8_body2: 'Trenutno ne uporabljamo neobveznih analitičnih orodij za sledenje vedenju končnih uporabnikov, session replay sistemov ali piškotkov za oglaševanje tretjih oseb.',
  s8_body3: 'Če v prihodnje uvedemo neobvezne piškotke ali sledenje, bomo to storili v skladu z veljavno zakonodajo in posodobili to politiko ter po potrebi pridobili soglasje.',

  s9_title: '9. SPREMEMBE TE POLITIKE',
  s9_body1: 'Politiko zasebnosti lahko posodobimo. Bistvene spremembe bomo sporočili po e-pošti ali z obvestilom v Storitvi, kadar je to izvedljivo, z razumnim predhodnim rokom.',
  s9_body2: 'Veljavna različica je vedno na voljo na tej strani. Priporočamo redno preverjanje.',

  s10_title: '10. KONTAKT',
  s10_body: 'Za vsa vprašanja o varstvu podatkov, uveljavljanje pravic ali pritožbe nas kontaktirajte:',
  s10_email: 'info@bimetric.si',
  s10_provider: 'Ponudnik: Bimetric',
  s10_service: 'Storitev: Carboniqdesk',
  footer_terms: 'Pogoji',
  footer_privacy: 'Zasebnost',
}

const en = {
  nav_signin: 'Sign in',
  nav_start: 'Get started free',
  page_title: 'CARBONIQDESK PRIVACY POLICY',
  intro: 'This Privacy Policy describes which personal data Bimetric ("Provider", "we") collects and processes when you create or use a Carboniqdesk account, how we protect that data, and what your rights are under Regulation (EU) 2016/679 (GDPR) and applicable law.',
  note_b2b: 'Carboniqdesk is intended for business (B2B) use. A natural person using it as a consumer for private or household purposes should read this document together with the Terms of Service, which define the expected type of relationship.',
  last_updated: 'Last updated',
  last_date: '8 August 2026',
  contact_label: 'Contact',

  s1_title: '1. CONTROLLER AND CONTACT DETAILS',
  s1_body: 'The controller of personal data is Bimetric, contact info@bimetric.si. For data-protection questions or to exercise your rights, write to info@bimetric.si.',

  s2_title: '2. WHAT DATA IS COLLECTED',
  s2_subtitle: 'Categories of data we process as controller:',
  s2_table_headers: ['Category', 'Examples'],
  s2_table_rows: [
    ['Account data', 'Name, email address, password (hashed), organisational role'],
    ['Emissions data and inventories', 'GHG inventories, Scope 1/2/3 emissions, base years, emission targets'],
    ['Emission sources – locations, equipment, vehicles', 'Addresses, equipment types, registration plates, capacities, fuels'],
    ['Energy and activity data', 'kWh, litres of fuel, tonnes of material, km driven, flights'],
    ['Emission factors', 'Default or custom factors in kg CO₂e per unit'],
    ['Reports and attachments', 'PDF reports, CSV imports, Excel files, specifications'],
    ['Technical usage data', 'IP address, browser, device, URL, session time, errors'],
  ],
  s2_note: 'Carboniqdesk is not intended for special-category data under Article 9 GDPR (e.g. health data, racial or ethnic origin) or criminal-conviction data. Do not submit such data.',

  s3_title: '3. WHY WE PROCESS DATA – LEGAL BASIS AND RETENTION',
  s3_subtitle: 'Overview of processing purposes, legal bases and approximate retention periods:',
  s3_table_headers: ['Purpose', 'Legal basis', 'Approximate retention'],
  s3_table_rows: [
    ['Creating and managing an account', 'Contractual necessity (Art. 6(1)(b) GDPR)', 'Until account deletion + 30 days'],
    ['Providing and operating the Service (emissions calculations, reports, storage)', 'Contractual necessity (Art. 6(1)(b))', 'While account is active'],
    ['Security, abuse detection, error resolution', 'Legitimate interest (Art. 6(1)(f))', 'Technical logs: up to 90 days, except for security incidents'],
    ['Fulfilling legal obligations (tax, accounting)', 'Legal obligation (Art. 6(1)(c))', 'As required by law (e.g. 5–10 years)'],
    ['Notifying about material Service changes', 'Legitimate interest (Art. 6(1)(f))', 'Until unsubscribed from communications'],
    ['Statistics and Service development (anonymised / aggregated)', 'Legitimate interest (Art. 6(1)(f))', 'Anonymised: indefinite'],
  ],
  s3_note: 'Longer retention may apply where required by law, a legal claim or a security incident.',

  s4_title: '4. WHO PROCESSES DATA – SUBPROCESSORS AND THIRD PARTIES',
  s4_body1: 'We use the following infrastructure providers to operate Carboniqdesk (subprocessors for processing carried out on behalf of the Customer):',
  s4_table_headers: ['Provider', 'Role', 'Location / legal entity'],
  s4_table_rows: [
    ['Supabase', 'PostgreSQL database, authentication and backend services', 'SUPABASE PTE. LTD., Singapore'],
    ['Vercel', 'Hosting, execution and delivery of the web application', 'Vercel Inc., Delaware, USA'],
  ],
  s4_body2: 'Supabase and Vercel are international providers. Supabase states that processing may occur in the USA and other countries; Vercel\'s primary facilities are in the USA. Both providers include EU Standard Contractual Clauses (SCCs) or equivalent transfer mechanisms where required. Supabase deploys each project to one primary region; the exact region of the specific Carboniqdesk project is not disclosed in their public legal terms.',
  s4_body3: 'We do not sell data to third parties or share it for advertising. Data may be disclosed where required by law, court order or a competent authority.',

  s5_title: '5. INTERNATIONAL TRANSFERS',
  s5_body1: 'Because Supabase and Vercel maintain infrastructure outside the EEA, using Carboniqdesk may involve transferring personal data to third countries (principally the USA). Transfers rely on Standard Contractual Clauses issued by the European Commission (SCCs) or equivalent mechanisms.',
  s5_body2: 'Further details on processing locations and transfer mechanisms are set out in the Terms of Service (Chapters XII and XV).',

  s6_title: '6. SECURITY',
  s6_body: 'The Provider implements reasonable technical and organisational security measures, including access controls, HTTPS/TLS encryption, secure secrets management, least-privilege access and code updates. Detailed measures are described in the Terms of Service (Schedule 2). No system is absolutely secure; if you suspect misuse, contact info@bimetric.si immediately.',
  s6_backup_title: 'Note on backups:',
  s6_backup: 'Carboniqdesk currently operates on the Supabase Free plan, which does not include automatic database backups. Maintain your own copies of business-critical emissions data and reports.',

  s7_title: '7. YOUR RIGHTS',
  s7_body: 'Under the GDPR you have the following rights:',
  s7_rights: [
    'Right of access – obtain confirmation of whether we process your personal data.',
    'Right to rectification – request correction of inaccurate or incomplete data.',
    'Right to erasure ("right to be forgotten") – request deletion where there is no lawful basis for continued retention.',
    'Right to restriction – request temporary suspension of processing in certain circumstances.',
    'Right to data portability – receive your data in a structured, commonly used format where processing is based on consent or contract.',
    'Right to object – object to processing based on legitimate interest.',
    'Right to withdraw consent – where processing is based on consent, withdraw it at any time without consequence.',
    'Right to lodge a complaint – with the Slovenian Information Commissioner (ip-rs.si) or the supervisory authority in your country of residence.',
  ],
  s7_contact: 'Send requests and questions to info@bimetric.si. We will respond within the legally required period (generally 30 days).',

  s8_title: '8. COOKIES AND SIMILAR TECHNOLOGIES',
  s8_body1: 'Carboniqdesk uses only strictly necessary cookies and session-storage mechanisms needed for login functionality, security and core operation.',
  s8_body2: 'We do not currently use optional analytics tools to track end-user behaviour, session-replay systems or third-party advertising cookies.',
  s8_body3: 'If we introduce optional cookies or tracking in the future, we will do so in accordance with applicable law, update this policy and obtain consent where required.',

  s9_title: '9. CHANGES TO THIS POLICY',
  s9_body1: 'We may update this Privacy Policy. Material changes will be communicated by email or in-app notice where practicable, with reasonable advance notice.',
  s9_body2: 'The current version is always available on this page. We recommend checking periodically.',

  s10_title: '10. CONTACT',
  s10_body: 'For all data-protection questions, rights requests or complaints, contact us:',
  s10_email: 'info@bimetric.si',
  s10_provider: 'Provider: Bimetric',
  s10_service: 'Service: Carboniqdesk',
  footer_terms: 'Terms',
  footer_privacy: 'Privacy',
}

export default function PrivacyPage() {
  const [locale, setLocale] = useState<Loc>('SL')
  useEffect(() => { setLocale(getCookieLocale()) }, [])
  function switchLocale(l: Loc) { document.cookie = `locale=${l.toLowerCase()}; path=/; max-age=31536000`; setLocale(l) }
  const t = locale === 'SL' ? sl : en

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:opacity-80 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <polyline points="26,6 10,20 26,34" stroke="#111" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="33,6 17,20 33,34" stroke="#111" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
            </svg>
            <span className="text-[15px] font-semibold">Carboniqdesk</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 mr-1">
              {(['SL', 'EN'] as Loc[]).map(l => (
                <button key={l} onClick={() => switchLocale(l)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${locale === l ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}>
                  {l}
                </button>
              ))}
            </div>
            <Link href="/login" className="hidden md:block text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200">
              {t.nav_signin}
            </Link>
            <Link href="/register" className="hidden sm:block bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap">
              {t.nav_start}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <H1>{t.page_title}</H1>
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-600 space-y-1">
          <div><strong>{t.last_updated}:</strong> {t.last_date}</div>
          <div><strong>{t.contact_label}:</strong> info@bimetric.si</div>
        </div>

        <P>{t.intro}</P>
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-blue-800">{t.note_b2b}</p>
        </div>

        {/* Section 1 */}
        <H1>{t.s1_title}</H1>
        <P>{t.s1_body}</P>

        {/* Section 2 */}
        <H1>{t.s2_title}</H1>
        <P>{t.s2_subtitle}</P>
        <Table headers={t.s2_table_headers} rows={t.s2_table_rows} />
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm text-amber-800">{t.s2_note}</p>
        </div>

        {/* Section 3 */}
        <H1>{t.s3_title}</H1>
        <P>{t.s3_subtitle}</P>
        <Table headers={t.s3_table_headers} rows={t.s3_table_rows} />
        <P>{t.s3_note}</P>

        {/* Section 4 */}
        <H1>{t.s4_title}</H1>
        <P>{t.s4_body1}</P>
        <Table headers={t.s4_table_headers} rows={t.s4_table_rows} />
        <P>{t.s4_body2}</P>
        <P>{t.s4_body3}</P>

        {/* Section 5 */}
        <H1>{t.s5_title}</H1>
        <P>{t.s5_body1}</P>
        <P>{t.s5_body2}</P>

        {/* Section 6 */}
        <H1>{t.s6_title}</H1>
        <P>{t.s6_body}</P>
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm font-medium text-yellow-900 mb-1">{t.s6_backup_title}</p>
          <p className="text-sm text-yellow-800">{t.s6_backup}</p>
        </div>

        {/* Section 7 */}
        <H1>{t.s7_title}</H1>
        <P>{t.s7_body}</P>
        <Ul items={t.s7_rights} />
        <P>{t.s7_contact}</P>

        {/* Section 8 */}
        <H1>{t.s8_title}</H1>
        <P>{t.s8_body1}</P>
        <P>{t.s8_body2}</P>
        <P>{t.s8_body3}</P>

        {/* Section 9 */}
        <H1>{t.s9_title}</H1>
        <P>{t.s9_body1}</P>
        <P>{t.s9_body2}</P>

        {/* Section 10 */}
        <H1>{t.s10_title}</H1>
        <P>{t.s10_body}</P>
        <div className="bg-gray-50 rounded-lg p-4 mt-2 mb-6 text-sm text-gray-700 space-y-1">
          <div><strong>{t.contact_label}:</strong> <a href="mailto:info@bimetric.si" className="text-blue-600 hover:underline">{t.s10_email}</a></div>
          <div>{t.s10_provider}</div>
          <div>{t.s10_service}</div>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>© {new Date().getFullYear()} Carboniqdesk · Bimetric</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-900 transition-colors">{t.footer_terms}</Link>
            <Link href="/privacy" className="font-medium text-gray-900">{t.footer_privacy}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
