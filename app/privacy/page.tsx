'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Loc = 'SL' | 'EN'
function getCookieLocale(): Loc {
  if (typeof document === 'undefined') return 'SL'
  const m = document.cookie.match(/locale=([^;]+)/)
  return m?.[1]?.toUpperCase() === 'EN' ? 'EN' : 'SL'
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 bg-[#0f0f10] rounded-xl flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M14 6L8 12L14 18" stroke="#c0c0c0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 6L4 12L10 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="text-[15px] font-semibold text-[#0f0f10]">Carboniqdesk</span>
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold mt-8 mb-2 text-gray-800">{children}</h2>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-700 leading-relaxed mb-3">{children}</p>
}
function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside mb-4 space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-gray-700 leading-relaxed">{item}</li>
      ))}
    </ul>
  )
}

export default function PrivacyPage() {
  const [locale, setLocale] = useState<Loc>('SL')
  useEffect(() => { setLocale(getCookieLocale()) }, [])
  function switchLocale(l: Loc) { document.cookie = `locale=${l.toLowerCase()}; path=/; max-age=31536000`; setLocale(l) }
  const sl = locale === 'SL'

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 mr-1">
              {(['SL', 'EN'] as Loc[]).map(l => (
                <button key={l} onClick={() => switchLocale(l)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${locale === l ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}>
                  {l}
                </button>
              ))}
            </div>
            <Link href="/login" className="hidden md:block text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200">
              {sl ? 'Prijava' : 'Sign in'}
            </Link>
            <Link href="/register" className="hidden sm:block bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
              {sl ? 'Začnite brezplačno' : 'Get started free'}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {sl ? 'Politika zasebnosti' : 'Privacy Policy'}
        </h1>
        <div className="bg-gray-50 rounded-xl p-4 mb-8 text-sm text-gray-600 space-y-1 border border-gray-100">
          <div><strong>{sl ? 'Datum veljavnosti:' : 'Effective date:'}</strong> {sl ? '21. avgust 2026' : '21 August 2026'}</div>
          <div><strong>{sl ? 'Upravljavec:' : 'Controller:'}</strong> Bimetric</div>
          <div><strong>{sl ? 'Kontakt:' : 'Contact:'}</strong> info@bimetric.si</div>
        </div>

        <H2>{sl ? '1. Kateri podatki se zbirajo' : '1. What data is collected'}</H2>
        <P>{sl ? 'Zbiramo naslednje kategorije osebnih podatkov:' : 'We collect the following categories of personal data:'}</P>
        {sl
          ? <Ul items={[
              'Podatki o računu: e-poštni naslov, ime, priimek',
              'Podatki o organizaciji: ime podjetja, panoga, število zaposlenih, država',
              'Podatki o emisijah: lokacije, vozila, oprema, poraba energentov, emisijski izračuni',
              'Tehnični podatki: IP naslov, tip brskalnika, čas prijav (za varnostne namene)',
            ]} />
          : <Ul items={[
              'Account data: email address, first name, last name',
              'Organization data: company name, industry, number of employees, country',
              'Emissions data: locations, vehicles, equipment, energy consumption, emission calculations',
              'Technical data: IP address, browser type, login timestamps (for security purposes)',
            ]} />
        }

        <H2>{sl ? '2. Namen in pravna podlaga obdelave' : '2. Purpose and legal basis of processing'}</H2>
        <P>{sl ? 'Podatke obdelujemo za naslednje namene:' : 'We process data for the following purposes:'}</P>
        {sl
          ? <Ul items={[
              'Zagotavljanje delovanja aplikacije (pogodba)',
              'Izračun in poročanje o emisijah CO₂ (pogodba)',
              'Tehnična podpora in odpravljanje napak (zakoniti interes)',
              'Izboljšanje produkta na podlagi anonimnih agregatnih podatkov (zakoniti interes)',
              'Pošiljanje obvestil o posodobitvah (privolitev)',
            ]} />
          : <Ul items={[
              'Providing application functionality (contract)',
              'Calculating and reporting CO₂ emissions (contract)',
              'Technical support and troubleshooting (legitimate interest)',
              'Product improvement based on anonymous aggregate data (legitimate interest)',
              'Sending update notifications (consent)',
            ]} />
        }

        <H2>{sl ? '3. Shranjevanje in varnost podatkov' : '3. Data storage and security'}</H2>
        <P>{sl
          ? 'Podatki so shranjeni pri ponudniku Supabase v podatkovnem centru v Frankfurtu (EU). Vsi prenosi podatkov so šifrirani (TLS). Dostop do baze je omejen z vlogami in pravilniki varnosti na ravni vrstic (RLS).'
          : 'Data is stored with Supabase in a data center in Frankfurt, EU. All data transfers are encrypted (TLS). Database access is restricted by roles and row-level security (RLS) policies.'
        }</P>

        <H2>{sl ? '4. Deljenje podatkov s tretjimi stranmi' : '4. Sharing data with third parties'}</H2>
        <P>{sl ? 'Vaših podatkov ne prodajamo. Podatke delimo samo z naslednjimi obdelovalci:' : 'We do not sell your data. We share data only with the following processors:'}</P>
        {sl
          ? <Ul items={[
              'Supabase Inc. – shranjevanje podatkov in avtentikacija (Frankfurt, EU)',
              'Vercel Inc. – gostovanje aplikacije (EU regija)',
            ]} />
          : <Ul items={[
              'Supabase Inc. – data storage and authentication (Frankfurt, EU)',
              'Vercel Inc. – application hosting (EU region)',
            ]} />
        }

        <H2>{sl ? '5. Vaše pravice (GDPR)' : '5. Your rights (GDPR)'}</H2>
        <P>{sl ? 'Kot posameznik imate naslednje pravice:' : 'As an individual, you have the following rights:'}</P>
        {sl
          ? <Ul items={[
              'Pravica do dostopa – zahtevate kopijo svojih podatkov',
              'Pravica do popravka – popravek netočnih podatkov',
              'Pravica do izbrisa – brisanje računa in vseh podatkov',
              'Pravica do prenosljivosti – izvoz podatkov v strojno berljivem formatu',
              'Pravica do ugovora – ugovor obdelavi za namene trženja',
            ]} />
          : <Ul items={[
              'Right of access – request a copy of your data',
              'Right to rectification – correction of inaccurate data',
              'Right to erasure – deletion of your account and all data',
              'Right to portability – export of data in machine-readable format',
              'Right to object – objection to processing for marketing purposes',
            ]} />
        }
        <P>{sl
          ? 'Zahteve pošljite na info@bimetric.si. Odgovorimo v 30 dneh.'
          : 'Send requests to info@bimetric.si. We respond within 30 days.'
        }</P>

        <H2>{sl ? '6. Piškotki' : '6. Cookies'}</H2>
        <P>{sl
          ? 'Aplikacija uporablja samo funkcionalni piškotek za shranjevanje izbrane jezikovne nastavitve. Ne uporabljamo analitičnih ali oglaševalskih piškotkov.'
          : 'The application uses only a functional cookie to store the selected language setting. We do not use analytics or advertising cookies.'
        }</P>

        <H2>{sl ? '7. Hramba podatkov' : '7. Data retention'}</H2>
        <P>{sl
          ? 'Podatke hranimo, dokler je vaš račun aktiven. Po brisanju računa so podatki izbrisani v 30 dneh. Varnostne kopije so avtomatsko izbrisane v 90 dneh.'
          : 'We retain data as long as your account is active. After account deletion, data is erased within 30 days. Backups are automatically deleted within 90 days.'
        }</P>

        <H2>{sl ? '8. Spremembe politike' : '8. Policy changes'}</H2>
        <P>{sl
          ? 'Pridružujemo si pravico do spremembe te politike. O bistvenih spremembah vas obvestimo po e-pošti vsaj 14 dni pred uveljavitvijo.'
          : 'We reserve the right to change this policy. We will notify you of material changes by email at least 14 days before they take effect.'
        }</P>

        <H2>{sl ? '9. Pritožba pri nadzornem organu' : '9. Complaint to supervisory authority'}</H2>
        <P>{sl
          ? 'Pritožbo v zvezi z obdelavo osebnih podatkov lahko vložite pri Informacijskem pooblaščencu RS (ip-rs.si).'
          : 'You may lodge a complaint regarding the processing of personal data with the Information Commissioner of the Republic of Slovenia (ip-rs.si).'
        }</P>
      </div>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>© {new Date().getFullYear()} Carboniqdesk · Bimetric</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-900 transition-colors">{sl ? 'Pogoji' : 'Terms'}</Link>
            <Link href="/privacy" className="font-medium text-gray-900">{sl ? 'Zasebnost' : 'Privacy'}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
