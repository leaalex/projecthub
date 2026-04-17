import { i18n } from '../i18n'

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(i18n.global.locale.value)
  } catch {
    return iso
  }
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(i18n.global.locale.value)
  } catch {
    return iso
  }
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Relative time, localized via i18n. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—'
  let then: Date
  try {
    then = new Date(iso)
    if (Number.isNaN(then.getTime())) return formatDateShort(iso)
  } catch {
    return formatDateShort(iso)
  }
  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  if (diffMs < 0) return formatDateShort(iso)

  const t = i18n.global.t.bind(i18n.global)

  const sec = Math.floor(diffMs / 1000)
  if (sec < 45) return t('formatters.timeAgo.justNow')

  const min = Math.floor(sec / 60)
  if (min < 60) return t('formatters.timeAgo.minutesAgo', min)

  const hr = Math.floor(min / 60)
  if (hr < 24 && sameCalendarDay(then, now)) return t('formatters.timeAgo.hoursAgo', hr)

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startThen = new Date(then.getFullYear(), then.getMonth(), then.getDate())
  const dayDiff = Math.round((startToday.getTime() - startThen.getTime()) / 86400000)
  if (dayDiff === 1) return t('formatters.timeAgo.yesterday')
  if (dayDiff > 1 && dayDiff < 7) return t('formatters.timeAgo.daysAgo', dayDiff)
  return formatDateShort(iso)
}
