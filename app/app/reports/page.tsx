'use client'

import { useLocale } from '@/lib/i18n/LocaleProvider'
import { FileText } from 'lucide-react'

export default function ReportsPage() {
  const { t } = useLocale()
  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('Poročila', 'Reports')}</h1>
      <p className="text-sm text-gray-400 mb-8">{t('Izvoz poročil in skladnost s CSRD', 'Report export and CSRD compliance')}</p>
      <div className="bg-white border border-gray-200 rounded-xl py-20 text-center">
        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 mb-1">{t('Poročila bodo kmalu na voljo.', 'Reports coming soon.')}</p>
        <p className="text-xs text-gray-400">{t('PDF izvoz in CSRD poročanje bo prikazano tukaj.', 'PDF export and CSRD reporting will be displayed here.')}</p>
      </div>
    </div>
  )
}
