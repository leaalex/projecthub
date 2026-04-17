import type { Task } from '../types/task'

/** Section / group header: total count, completed count, completion %. */
export function taskSectionHeaderStats(tasks: Task[]): string {
  if (tasks.length === 0) return '(0)'
  const done = tasks.filter((t) => t.status === 'done').length
  const pct = Math.round((done / tasks.length) * 100)
  return `(${tasks.length}) · ${done} done · ${pct}%`
}
