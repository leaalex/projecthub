import type { TaskStatus } from '../types/task'

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  review: 'Review',
  done: 'Done',
}

export function formatTaskStatus(s: TaskStatus): string {
  return statusLabels[s] ?? s
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString()
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

/** Relative time e.g. "2 hours ago", "Yesterday", "3 days ago" */
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

  const sec = Math.floor(diffMs / 1000)
  if (sec < 45) return 'Just now'

  const min = Math.floor(sec / 60)
  if (min < 60) {
    return `${min} ${min === 1 ? 'minute' : 'minutes'} ago`
  }

  const hr = Math.floor(min / 60)
  if (hr < 24 && sameCalendarDay(then, now)) {
    return `${hr} ${hr === 1 ? 'hour' : 'hours'} ago`
  }

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startThen = new Date(
    then.getFullYear(),
    then.getMonth(),
    then.getDate(),
  )
  const dayDiff = Math.round(
    (startToday.getTime() - startThen.getTime()) / 86400000,
  )
  if (dayDiff === 1) return 'Yesterday'
  if (dayDiff > 1 && dayDiff < 7) {
    return `${dayDiff} days ago`
  }
  return formatDateShort(iso)
}
