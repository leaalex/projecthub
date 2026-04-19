import type { ComposerTranslation } from 'vue-i18n'
import type { TaskSection } from '@domain/project/types'
import {
  filterTasks,
  groupTasks as groupTasksCore,
  presentTasks as presentTasksCore,
  sortTasks,
  type AssigneeFilterValue,
  type SortDir,
  type TaskGroup,
  type TaskGroupBy,
  type TaskGroupLabels,
  type TaskSortKey,
} from '@domain/task/presentation'
import type { Task, TaskPriority, TaskStatus } from '@domain/task/types'
import { taskPriorityLabel, taskStatusLabel } from '@infra/i18n/labels'

export type {
  AssigneeFilterValue,
  SortDir,
  TaskGroup,
  TaskGroupBy,
  TaskSortKey,
} from '@domain/task/presentation'

function makeGroupLabels(t: ComposerTranslation): TaskGroupLabels {
  return {
    status: (status) => taskStatusLabel(t, status),
    priority: (priority) => taskPriorityLabel(t, priority),
    unassigned: t('common.unassigned'),
    unsectioned: t('projectDetail.unsectioned'),
    projectNum: (n) => String(t('taskCard.meta.projectNum', { n })),
  }
}

export { filterTasks, sortTasks }

export function groupTasks(
  tasks: Task[],
  by: TaskGroupBy,
  t: ComposerTranslation,
  sections: TaskSection[] = [],
): TaskGroup[] {
  return groupTasksCore(tasks, by, makeGroupLabels(t), sections)
}

export function presentTasks(
  tasks: Task[],
  opts: {
    search: string
    priority: TaskPriority | '' | TaskPriority[]
    assignee: AssigneeFilterValue | AssigneeFilterValue[]
    sortKey: TaskSortKey
    sortDir: SortDir
    groupBy: TaskGroupBy
    sections?: TaskSection[]
    status?: TaskStatus | '' | TaskStatus[]
  },
  t: ComposerTranslation,
): { flat: Task[]; groups: TaskGroup[] } {
  return presentTasksCore(tasks, opts, makeGroupLabels(t))
}
