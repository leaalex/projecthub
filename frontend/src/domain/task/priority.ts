import type { TaskPriority } from './types'

export const PRIORITY_RANK: Record<TaskPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
}

export const PRIORITY_ORDER: readonly TaskPriority[] = [
  'low',
  'medium',
  'high',
  'critical',
]
