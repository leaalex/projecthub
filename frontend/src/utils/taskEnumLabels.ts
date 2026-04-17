import type { TaskPriority, TaskStatus } from '../types/task'

type TFn = (key: string, ...args: unknown[]) => string

export function taskStatusLabel(t: TFn, status: TaskStatus | string): string {
  return t(`enums.taskStatus.${String(status)}`)
}

export function taskPriorityLabel(t: TFn, priority: TaskPriority | string): string {
  return t(`enums.taskPriority.${String(priority)}`)
}
