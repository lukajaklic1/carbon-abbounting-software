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

export default function TermsPage() {
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
          {sl ? 'Splošni pogoji uporabe' : 'Terms of Service'}
        </h1>
        <div className="bg-gray-50 rounded-xl p-4 mb-8 text-sm text-gray-600 space-y-1 border border-gray-100">
          <div><strong>{sl ? 'Različica:' : 'Version:'}</strong> Beta</div>
          <div><strong>{sl ? 'Datum veljavnosti:' : 'Effective date:'}</strong> {sl ? '21. avgust 2026' : '21 August 2026'}</div>
          <div><strong>{sl ? 'Ponudnik:' : 'Provider:'}</strong> Bimetric</div>
          <div><strong>{sl ? 'Kontakt:' : 'Contact:'}</strong> info@bimetric.si</div>
        </div>

        <H2>{sl ? '1. Splošno' : '1. General'}</H2>
        <P>{sl
          ? 'Carboniqdesk je spletna aplikacija za merjenje in poročanje o emisijah toplogrednih plinov v skladu z GHG Protokolom. Aplikacijo razvija in upravlja podjetje Bimetric.'
          : 'Carboniqdesk is a web application for measuring and reporting greenhouse gas emissions in accordance with the GHG Protocol. The application is developed and managed by Bimetric.'
        }</P>
        <P>{sl
          ? 'Z registracijo in uporabo aplikacije se strinjate s temi pogoji. Če se ne strinjate, prosimo, ne uporabljajte aplikacije.'
          : 'By registering and using the application, you agree to these terms. If you do not agree, please do not use the application.'
        }</P>

        <H2>{sl ? '2. Beta različica' : '2. Beta version'}</H2>
        <P>{sl
          ? 'Aplikacija je trenutno v beta fazi testiranja. Med beta testiranjem je dostop do aplikacije brezplačen. Funkcionalnosti, cene in pogoji se lahko spremenijo pred uradno objavo.'
          : 'The application is currently in beta testing. During beta testing, access to the application is free. Features, pricing and terms may change before the official launch.'
        }</P>

        <H2>{sl ? '3. Registracija in račun' : '3. Registration and account'}</H2>
        <P>{sl
          ? 'Za uporabo aplikacije je potrebna registracija. Zagotovite, da so podatki, ki jih vnesete ob registraciji, točni in ažurni. Za varnost svojega računa ste odgovorni sami.'
          : 'Registration is required to use the application. Ensure the information you provide is accurate. You are responsible for the security of your account.'
        }</P>
        {sl
          ? <Ul items={['Gesla ne smete deliti z drugimi', 'O kakršni koli nepooblaščeni uporabi nas takoj obvestite', 'Vsak račun je namenjen enemu podjetju']} />
          : <Ul items={['Do not share your password with others', 'Notify us immediately of any unauthorized use', 'Each account is intended for one company']} />
        }

        <H2>{sl ? '4. Dovoljena uporaba' : '4. Permitted use'}</H2>
        <P>{sl
          ? 'Aplikacijo smete uporabljati zgolj za zakonite namene – evidentiranje in poročanje o emisijah toplogrednih plinov. Prepovedano je:'
          : 'You may use the application only for lawful purposes – tracking and reporting greenhouse gas emissions. It is prohibited to:'
        }</P>
        {sl
          ? <Ul items={['Vnašati lažne ali zavajajoče podatke', 'Dostopati do podatkov drugih podjetij', 'Poskušati vdreti ali obremeniti infrastrukturo', 'Aplikacijo preprodajati brez pisnega dovoljenja']} />
          : <Ul items={['Enter false or misleading data', 'Access data of other companies', 'Attempt to breach or overload the infrastructure', 'Resell the application without written permission']} />
        }

        <H2>{sl ? '5. Lastnina nad podatki' : '5. Data ownership'}</H2>
        <P>{sl
          ? 'Vsi podatki, ki jih vnesete v aplikacijo (lokacije, vozila, oprema, poraba energije, emisije), ostanejo vaša last. Bimetric ne zahteva lastništva nad vašimi podatki.'
          : 'All data you enter into the application (locations, vehicles, equipment, energy consumption, emissions) remains your property. Bimetric does not claim ownership of your data.'
        }</P>
        <P>{sl
          ? 'Bimetric ima pravico do uporabe anonimnih, agregiranih statističnih podatkov za izboljšanje storitve.'
          : 'Bimetric has the right to use anonymous, aggregated statistical data to improve the service.'
        }</P>

        <H2>{sl ? '6. Razpoložljivost in vzdrževanje' : '6. Availability and maintenance'}</H2>
        <P>{sl
          ? 'Prizadevamo si za čim višjo razpoložljivost aplikacije, vendar med beta testiranjem ne zagotavljamo SLA. Aplikacija je lahko nedostopna med vzdrževanjem ali ob tehničnih težavah.'
          : 'We strive for the highest possible availability, but during beta testing we do not guarantee an SLA. The application may be unavailable during maintenance or technical issues.'
        }</P>

        <H2>{sl ? '7. Omejitev odgovornosti' : '7. Limitation of liability'}</H2>
        <P>{sl
          ? 'Bimetric ne odgovarja za napake v izračunih emisij, ki izhajajo iz napačno vnesenih podatkov. Aplikacija je orodje za pomoč pri poročanju in ne nadomešča strokovnega svetovanja.'
          : 'Bimetric is not liable for errors in emission calculations arising from incorrectly entered data. The application is a reporting tool and does not replace professional advice.'
        }</P>

        <H2>{sl ? '8. Spremembe pogojev' : '8. Changes to terms'}</H2>
        <P>{sl
          ? 'Pridružujemo si pravico do spremembe teh pogojev. O bistvenih spremembah vas bomo obvestili po e-pošti vsaj 14 dni vnaprej. Nadaljnja uporaba po obvestilu pomeni sprejetje novih pogojev.'
          : 'We reserve the right to modify these terms. We will notify you of material changes by email at least 14 days in advance. Continued use after notice constitutes acceptance of the new terms.'
        }</P>

        <H2>{sl ? '9. Veljavno pravo' : '9. Governing law'}</H2>
        <P>{sl
          ? 'Za te pogoje velja slovensko pravo. Morebitni spori se rešujejo pred pristojnim sodiščem v Republiki Sloveniji.'
          : 'These terms are governed by Slovenian law. Any disputes shall be resolved before the competent court in the Republic of Slovenia.'
        }</P>

        <H2>{sl ? '10. Kontakt' : '10. Contact'}</H2>
        <P>info@bimetric.si</P>
      </div>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>© {new Date().getFullYear()} Carboniqdesk · Bimetric</span>
          <div className="flex gap-4">
            <Link href="/terms" className="font-medium text-gray-900">{sl ? 'Pogoji' : 'Terms'}</Link>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">{sl ? 'Zasebnost' : 'Privacy'}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
