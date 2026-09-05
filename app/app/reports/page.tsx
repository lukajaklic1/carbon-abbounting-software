'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { useOrganizationStore } from '@/stores/organization'
import { Check, FileText, Lock, X } from 'lucide-react'

export default function ReportsPage() {
  const { t } = useLocale()
  const { organization } = useOrganizationStore()

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeState, setUpgradeState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [upgradeRequested, setUpgradeRequested] = useState(
    () => !!(organization as any)?.upgrade_requested_at
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 border-b border-gray-200 h-[57px] shrink-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 shrink-0">{t('Poročila', 'Reports')}</h1>
          <p className="text-sm text-gray-500 truncate">{t('Izvozite GHG poročilo za vaše obdobje.', 'Export your GHG report for the period.')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {upgradeRequested ? (
            <div className="inline-flex items-center gap-1.5 h-9 px-4 bg-green-50 border border-green-200 rounded-xl text-sm font-medium text-green-700">
              <Check className="h-3.5 w-3.5" />
              {t('Zahteva za nadgraditev poslana', 'Upgrade request sent')}
            </div>
          ) : (
            <button
              onClick={() => { setShowUpgradeModal(true); setUpgradeState('idle') }}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#215bcf] hover:bg-[#1a4ab5] rounded-xl text-sm font-medium text-white transition-colors">
              <Lock className="h-3.5 w-3.5" />
              {t('Nadgradi', 'Upgrade')}
            </button>
          )}
        </div>
      </div>

      {/* Locked content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#e5eeff' }}>
            <FileText className="h-7 w-7" style={{ color: '#215bcf' }} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {t('GHG Poročilo', 'GHG Report')}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {t('Dostopno z nadgradnjo.', 'Available with an upgrade.')}
          </p>
          {upgradeRequested ? (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm font-medium text-green-700">
              <Check className="h-4 w-4" />
              {t('Naša ekipa vas bo kmalu kontaktirala', 'Our team will contact you soon')}
            </div>
          ) : (
            <button
              onClick={() => { setShowUpgradeModal(true); setUpgradeState('idle') }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors">
              <Lock className="h-4 w-4" />
              {t('Nadgradi za dostop', 'Upgrade for access')}
            </button>
          )}
        </div>
      </div>

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => upgradeState !== 'sending' && setShowUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">

            {upgradeState === 'done' ? (
              <div className="px-8 py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-base font-semibold text-gray-900 mb-1">{t('Zahteva za nadgraditev poslana', 'Upgrade request sent')}</p>
                <p className="text-sm text-gray-500">{t('Naša ekipa vas bo v kratkem kontaktirala.', 'Our team will contact you shortly.')}</p>
                <button onClick={() => setShowUpgradeModal(false)}
                  className="mt-6 px-6 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors">
                  {t('Zapri', 'Close')}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">{t('Nadgradite Carboniqdesk', 'Upgrade Carboniqdesk')}</h2>
                  <button onClick={() => setShowUpgradeModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <p className="text-sm text-gray-500">{t('Z nadgradnjo pridobite:', 'With the upgrade you get:')}</p>
                  <ul className="space-y-2">
                    {[
                      t('PDF poročilo o ogljičnih emisijah (GHG Protocol)', 'PDF greenhouse gas report (GHG Protocol)'),
                      t('Nalaganje podatkov za Obseg 3 (15 kategorij)', 'Scope 3 data upload (15 categories)'),
                      t('Podpora pri izdelavi poročila (Obseg 1, 2 in 3)', 'Support for emissions report (Scope 1, 2 & 3)'),
                    ].map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#e0fced' }}>
                          <Check className="h-2.5 w-2.5" style={{ color: '#098259' }} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mx-6 mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                  {t('Po oddaji zahteve vas bo naša ekipa kontaktirala v 1–2 delovnih dneh.', 'After submitting the request, our team will contact you within 1–2 business days.')}
                </div>

                <div className="flex items-center justify-end gap-2 px-6 pb-5">
                  <button onClick={() => setShowUpgradeModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    {t('Prekliči', 'Cancel')}
                  </button>
                  <button
                    disabled={upgradeState === 'sending'}
                    onClick={async () => {
                      setUpgradeState('sending')
                      try {
                        const supabase = createClient()
                        await supabase.from('organizations').update({ upgrade_requested_at: new Date().toISOString() }).eq('id', organization!.id)
                      } catch {}
                      setUpgradeState('done')
                      setUpgradeRequested(true)
                    }}
                    className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors">
                    {upgradeState === 'sending' ? t('Pošiljanje...', 'Sending...') : t('Pošlji zahtevo', 'Send request')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
