import { createI18n } from 'vue-i18n'
import type { AppLocale } from '../utils/appLocale'
import { resolveAppLocale } from '../utils/appLocale'
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
