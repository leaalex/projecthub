import type { ComposerTranslation } from 'vue-i18n'
import type { TaskPriority, TaskStatus } from '../types/task'

export function taskStatusLabel(
  t: ComposerTranslation,
  status: TaskStatus | string,
): string {
  return t(`enums.taskStatus.${String(status)}`)
}

export function taskPriorityLabel(
  t: ComposerTranslation,
  priority: TaskPriority | string,
): string {
  return t(`enums.taskPriority.${String(priority)}`)
}
