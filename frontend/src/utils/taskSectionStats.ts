import type { ComposerTranslation } from 'vue-i18n'
import type { Task } from '../types/task'

/** Section / group header: total count, completed count, completion %. */
export function taskSectionHeaderStats(
  tasks: Task[],
  t: ComposerTranslation,
): string {
  if (tasks.length === 0) return '(0)'
  const done = tasks.filter((task) => task.status === 'done').length
  const pct = Math.round((done / tasks.length) * 100)
  return `(${tasks.length}) · ${done} ${t('taskSectionList.doneLabel')} · ${pct}%`
}
