import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import {
  LOCALE_STORAGE_KEY,
  resolveAppLocale,
  type AppLocale,
} from '@domain/session/locale'
import { setI18nLocale } from '@infra/i18n'

const SIDEBAR_COLLAPSED_KEY = 'tm-ui-sidebar-collapsed'
const BOTTOM_NAV_COLLAPSED_KEY = 'tm-ui-bottom-nav-collapsed'
const THEME_KEY = 'tm-ui-theme'

export type ThemeMode = 'light' | 'dark' | 'system'

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeSidebarCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function readBottomNavCollapsed(): boolean {
  try {
    return localStorage.getItem(BOTTOM_NAV_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeBottomNavCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(BOTTOM_NAV_COLLAPSED_KEY, collapsed ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function readTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* ignore */
  }
  return 'system'
}

function writeTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_KEY, mode)
  } catch {
    /* ignore */
  }
}

function writeLocale(mode: AppLocale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
}

function applyThemeClass(mode: ThemeMode) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('light', 'dark')

  if (mode === 'light') {
    root.classList.add('light')
    return
  }
  if (mode === 'dark') {
    root.classList.add('dark')
    return
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (prefersDark) root.classList.add('dark')
}

export const useUiStore = defineStore('ui', () => {
  /** Desktop: true = narrow icon-only rail */
  const sidebarCollapsed = ref(readSidebarCollapsed())
  /** Mobile: overlay drawer open (< md breakpoint) */
  const mobileMenuOpen = ref(false)
  /** Mobile: true = floating bottom nav collapsed to a brand pill */
  const bottomNavCollapsed = ref(readBottomNavCollapsed())
  const theme = ref<ThemeMode>(readTheme())
  const locale = ref<AppLocale>(resolveAppLocale())

  watch(sidebarCollapsed, (v) => writeSidebarCollapsed(v))
  watch(bottomNavCollapsed, (v) => writeBottomNavCollapsed(v))
  watch(theme, (v) => {
    writeTheme(v)
    applyThemeClass(v)
  })
  watch(locale, (v) => {
    writeLocale(v)
    setI18nLocale(v)
  })

  if (typeof window !== 'undefined') {
    applyThemeClass(theme.value)
    setI18nLocale(locale.value)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', () => {
      if (theme.value === 'system') applyThemeClass('system')
    })
  }

  function toggleSidebarCollapsed() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleBottomNavCollapsed() {
    bottomNavCollapsed.value = !bottomNavCollapsed.value
  }

  function setBottomNavCollapsed(v: boolean) {
    bottomNavCollapsed.value = v
  }

  function toggleMobileMenu() {
    mobileMenuOpen.value = !mobileMenuOpen.value
  }

  function closeMobileMenu() {
    mobileMenuOpen.value = false
  }

  /** Cycle light → dark → system */
  function cycleTheme() {
    const order: ThemeMode[] = ['light', 'dark', 'system']
    const i = order.indexOf(theme.value)
    theme.value = order[(i + 1) % order.length]
  }

  function setTheme(mode: ThemeMode) {
    theme.value = mode
  }

  function setLocale(next: AppLocale) {
    locale.value = next
  }

  const commandPaletteOpen = ref(false)

  function openCommandPalette() {
    commandPaletteOpen.value = true
  }

  function closeCommandPalette() {
    commandPaletteOpen.value = false
  }

  function toggleCommandPalette() {
    commandPaletteOpen.value = !commandPaletteOpen.value
  }

  return {
    sidebarCollapsed,
    mobileMenuOpen,
    bottomNavCollapsed,
    theme,
    locale,
    commandPaletteOpen,
    toggleSidebarCollapsed,
    toggleMobileMenu,
    closeMobileMenu,
    toggleBottomNavCollapsed,
    setBottomNavCollapsed,
    cycleTheme,
    setTheme,
    setLocale,
    openCommandPalette,
    closeCommandPalette,
    toggleCommandPalette,
  }
})
