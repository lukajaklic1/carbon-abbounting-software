'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'

export type Locale = 'SL' | 'EN'

interface LocaleContextValue {
  locale: Locale
  switchLocale: (l: Locale) => void
  t: (sl: string, en: string) => string
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: 'SL',
  switchLocale: () => {},
  t: (sl) => sl,
})

function readCookieLocale(): Locale {
  if (typeof document === 'undefined') return 'SL'
  const m = document.cookie.match(/locale=([^;]+)/)
  return m?.[1]?.toUpperCase() === 'EN' ? 'EN' : 'SL'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('SL')

  useEffect(() => {
    setLocale(readCookieLocale())
  }, [])

  const switchLocale = useCallback((l: Locale) => {
    document.cookie = `locale=${l.toLowerCase()}; path=/; max-age=31536000`
    setLocale(l)
  }, [])

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    switchLocale,
    t: (sl: string, en: string) => locale === 'EN' ? en : sl,
  }), [locale, switchLocale])

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
