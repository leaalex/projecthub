/** UI locale; synced with user.locale on server when authenticated. */
export type AppLocale = 'ru' | 'en'

export const LOCALE_STORAGE_KEY = 'tm-ui-locale'

export function readStoredLocale(): AppLocale | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const v = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (v === 'ru' || v === 'en') return v
  } catch {
    /* ignore */
  }
  return null
}

/** localStorage wins; else browser language; default ru. */
export function resolveAppLocale(): AppLocale {
  const stored = readStoredLocale()
  if (stored) return stored
  if (
    typeof navigator !== 'undefined' &&
    navigator.language?.toLowerCase().startsWith('en')
  ) {
    return 'en'
  }
  return 'ru'
}

export function isAppLocale(v: string): v is AppLocale {
  return v === 'ru' || v === 'en'
}
