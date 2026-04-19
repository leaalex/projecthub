import { createI18n } from 'vue-i18n'
import type { AppLocale } from '@domain/session/locale'
import { resolveAppLocale } from '@domain/session/locale'
import en from './locales/en.json'
import ru from './locales/ru.json'

export const i18n = createI18n({
  legacy: false,
  locale: resolveAppLocale(),
  fallbackLocale: 'en',
  messages: {
    ru,
    en,
  },
})

export function setI18nLocale(code: AppLocale) {
  i18n.global.locale.value = code
  document.documentElement.setAttribute('lang', code)
}
