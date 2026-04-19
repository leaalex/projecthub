import type { ComposerTranslation } from 'vue-i18n'
import type { TaskPriority, TaskStatus } from '@domain/task/types'
import { i18n } from './index'

export function taskStatusLabel(
  t: ComposerTranslation,
  status: TaskStatus | string,
  fallback?: string,
): string {
  const key = `enums.taskStatus.${String(status)}`
  if (fallback !== undefined && !i18n.global.te(key)) return fallback
  return t(key)
}

export function taskPriorityLabel(
  t: ComposerTranslation,
  priority: TaskPriority | string,
  fallback?: string,
): string {
  const key = `enums.taskPriority.${String(priority)}`
  if (fallback !== undefined && !i18n.global.te(key)) return fallback
  return t(key)
}
