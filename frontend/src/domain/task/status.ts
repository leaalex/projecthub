import type { TaskStatus } from './types'

export const STATUS_ORDER: readonly TaskStatus[] = [
  'todo',
  'in_progress',
  'review',
  'done',
]
