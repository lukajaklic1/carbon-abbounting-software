'use client'

import { useLocale } from '@/lib/i18n/LocaleProvider'
import { BarChart2 } from 'lucide-react'

export default function AnalyticsPage() {
  const { t } = useLocale()
  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('Analitika', 'Analytics')}</h1>
      <p className="text-sm text-gray-400 mb-8">{t('Grafi in trendi emisij CO₂e', 'CO₂e emissions charts and trends')}</p>
      <div className="bg-white border border-gray-200 rounded-xl py-20 text-center">
        <BarChart2 className="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 mb-1">{t('Analitika bo kmalu na voljo.', 'Analytics coming soon.')}</p>
        <p className="text-xs text-gray-400">{t('Grafi in trendi bodo prikazani tukaj.', 'Charts and trends will be displayed here.')}</p>
      </div>
    </div>
  )
}
