import type { ComposerTranslation } from 'vue-i18n'
import type { TaskSection } from '../types/project'
import type { Task, TaskPriority, TaskStatus } from '../types/task'
import { taskPriorityLabel, taskStatusLabel } from '../utils/taskEnumLabels'

export type TaskSortKey =
  | 'updated_at'
  | 'created_at'
  | 'title'
  | 'priority'
  | 'due_date'

export type SortDir = 'asc' | 'desc'

export type TaskGroupBy =
  | 'none'
  | 'project'
  | 'status'
  | 'priority'
  | 'assignee'
  | 'section'

export type AssigneeFilterValue = '' | 'unassigned' | number

export interface TaskGroup {
  key: string
  label: string
  tasks: Task[]
}

const PRIORITY_RANK: Record<TaskPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
}

const STATUS_ORDER: TaskStatus[] = [
  'todo',
  'in_progress',
  'review',
  'done',
]

const PRIORITY_ORDER: TaskPriority[] = [
  'low',
  'medium',
  'high',
  'critical',
]

function parseIso(s: string): number {
  const ms = Date.parse(s)
  return Number.isFinite(ms) ? ms : 0
}

function matchesStatus(
  task: Task,
  status: TaskStatus | '' | TaskStatus[] | undefined,
): boolean {
  const st = status ?? ''
  if (Array.isArray(st)) {
    if (st.length === 0) return true
    return st.includes(task.status)
  }
  if (st === '') return true
  return task.status === st
}

function matchesPriority(
  task: Task,
  priority: TaskPriority | '' | TaskPriority[],
): boolean {
  const pr = priority
  if (Array.isArray(pr)) {
    if (pr.length === 0) return true
    return pr.includes(task.priority)
  }
  if (pr === '') return true
  return task.priority === pr
}

function matchesAssignee(
  task: Task,
  assignee: AssigneeFilterValue | AssigneeFilterValue[],
): boolean {
  if (Array.isArray(assignee)) {
    if (assignee.length === 0) return true
    return assignee.some((opt) => {
      if (opt === '') return false
      if (opt === 'unassigned') return task.assignee_id == null
      return task.assignee_id === opt
    })
  }
  if (assignee === 'unassigned') return task.assignee_id == null
  if (assignee === '') return true
  return task.assignee_id === assignee
}

export function filterTasks(
  tasks: Task[],
  opts: {
    search: string
    priority: TaskPriority | '' | TaskPriority[]
    assignee: AssigneeFilterValue | AssigneeFilterValue[]
    /** Client-side status filter (e.g. project page; global tasks may use server filter). */
    status?: TaskStatus | '' | TaskStatus[]
  },
): Task[] {
  const q = opts.search.trim().toLowerCase()
  return tasks.filter((task) => {
    if (!matchesStatus(task, opts.status)) return false
    if (!matchesPriority(task, opts.priority)) return false
    if (!matchesAssignee(task, opts.assignee)) return false
    if (q) {
      const title = task.title.toLowerCase()
      const desc = (task.description ?? '').toLowerCase()
      if (!title.includes(q) && !desc.includes(q)) return false
    }
    return true
  })
}

export function sortTasks(
  tasks: Task[],
  key: TaskSortKey,
  dir: SortDir,
): Task[] {
  const mul = dir === 'asc' ? 1 : -1
  const out = [...tasks]
  out.sort((a, b) => {
    let c = 0
    switch (key) {
      case 'title':
        c = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
        break
      case 'priority':
        c = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
        break
      case 'due_date': {
        const ad = a.due_date
        const bd = b.due_date
        if (!ad && !bd) break
        if (!ad) return 1
        if (!bd) return -1
        c = ad.localeCompare(bd)
        break
      }
      case 'created_at':
        c = parseIso(a.created_at) - parseIso(b.created_at)
        break
      case 'updated_at':
      default:
        c = parseIso(a.updated_at) - parseIso(b.updated_at)
        break
    }
    if (c !== 0) return c * mul
    return a.id - b.id
  })
  return out
}

function projectLabel(task: Task, t: ComposerTranslation): string {
  return (
    task.project?.name ??
    t('taskCard.meta.projectNum', { n: task.project_id })
  )
}

function assigneeLabel(task: Task, t: ComposerTranslation): string {
  if (!task.assignee_id || !task.assignee) return t('common.unassigned')
  const u = task.assignee
  return u.name || u.email
}

function sectionLabel(task: Task, t: ComposerTranslation): string {
  return task.section?.name || t('projectDetail.unsectioned')
}

export function groupTasks(
  tasks: Task[],
  by: TaskGroupBy,
  t: ComposerTranslation,
  sections: TaskSection[] = [],
): TaskGroup[] {
  if (by === 'none') return []
  if (tasks.length === 0 && by !== 'section') return []

  if (by === 'status') {
    return STATUS_ORDER.map((st) => {
      const groupTasksList = tasks.filter((task) => task.status === st)
      return {
        key: st,
        label: taskStatusLabel(t, st),
        tasks: groupTasksList,
      }
    })
  }

  if (by === 'priority') {
    return PRIORITY_ORDER.map((pr) => {
      const groupTasksList = tasks.filter((task) => task.priority === pr)
      return {
        key: pr,
        label: taskPriorityLabel(t, pr),
        tasks: groupTasksList,
      }
    })
  }

  if (by === 'project') {
    const map = new Map<number, Task[]>()
    for (const task of tasks) {
      const id = task.project_id
      if (!map.has(id)) map.set(id, [])
      map.get(id)!.push(task)
    }
    const keys = [...map.keys()].sort((a, b) =>
      projectLabel(map.get(a)![0], t).localeCompare(
        projectLabel(map.get(b)![0], t),
        undefined,
        {
          sensitivity: 'base',
        },
      ),
    )
    return keys.map((id) => {
      const list = map.get(id)!
      const t0 = list[0]
      return {
        key: `p-${id}`,
        label: projectLabel(t0, t),
        tasks: list,
      }
    })
  }

  if (by === 'assignee') {
    const map = new Map<string, { label: string; tasks: Task[] }>()
    for (const task of tasks) {
      const key =
        task.assignee_id != null && task.assignee
          ? `u-${task.assignee_id}`
          : 'unassigned'
      if (!map.has(key)) {
        map.set(key, { label: assigneeLabel(task, t), tasks: [] })
      }
      map.get(key)!.tasks.push(task)
    }
    const entries = [...map.entries()].sort(([keyA, a], [keyB, b]) => {
      if (keyA === 'unassigned') return -1
      if (keyB === 'unassigned') return 1
      return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    })
    return entries.map(([key, { label, tasks: groupTasksList }]) => ({
      key,
      label,
      tasks: groupTasksList,
    }))
  }

  if (by === 'section') {
    const map = new Map<string, { label: string; tasks: Task[]; order: number }>()
    map.set('unsectioned', {
      label: t('projectDetail.unsectioned'),
      tasks: [],
      order: -1,
    })
    for (const s of sections) {
      map.set(`s-${s.id}`, { label: s.name, tasks: [], order: s.position })
    }
    for (const task of tasks) {
      const key = task.section_id == null ? 'unsectioned' : `s-${task.section_id}`
      if (!map.has(key)) {
        map.set(key, {
          label: sectionLabel(task, t),
          tasks: [],
          order: task.section?.position ?? 0,
        })
      }
      map.get(key)!.tasks.push(task)
    }
    const entries = [...map.entries()].sort(([keyA, a], [keyB, b]) => {
      if (keyA === 'unsectioned') return -1
      if (keyB === 'unsectioned') return 1
      return a.order - b.order || a.label.localeCompare(b.label)
    })
    return entries.map(([key, data]) => ({
      key,
      label: data.label,
      tasks: data.tasks,
    }))
  }

  return []
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
  const taskList = Array.isArray(tasks) ? tasks : []
  const filtered = filterTasks(taskList, {
    search: opts.search,
    priority: opts.priority,
    assignee: opts.assignee,
    status: opts.status,
  })
  const sorted =
    opts.groupBy === 'section'
      ? [...filtered].sort((a, b) => a.position - b.position || a.id - b.id)
      : sortTasks(filtered, opts.sortKey, opts.sortDir)
  if (opts.groupBy === 'none') {
    return { flat: sorted, groups: [] }
  }
  return {
    flat: sorted,
    groups: groupTasks(sorted, opts.groupBy, t, opts.sections ?? []),
  }
}
