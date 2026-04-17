import type { TaskSection } from '../types/project'
import type { Task, TaskPriority, TaskStatus } from '../types/task'
import { formatTaskStatus } from '../utils/formatters'

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
  const t = Date.parse(s)
  return Number.isFinite(t) ? t : 0
}

function matchesStatus(
  t: Task,
  status: TaskStatus | '' | TaskStatus[] | undefined,
): boolean {
  const st = status ?? ''
  if (Array.isArray(st)) {
    if (st.length === 0) return true
    return st.includes(t.status)
  }
  if (st === '') return true
  return t.status === st
}

function matchesPriority(
  t: Task,
  priority: TaskPriority | '' | TaskPriority[],
): boolean {
  const pr = priority
  if (Array.isArray(pr)) {
    if (pr.length === 0) return true
    return pr.includes(t.priority)
  }
  if (pr === '') return true
  return t.priority === pr
}

function matchesAssignee(
  t: Task,
  assignee: AssigneeFilterValue | AssigneeFilterValue[],
): boolean {
  if (Array.isArray(assignee)) {
    if (assignee.length === 0) return true
    return assignee.some((opt) => {
      if (opt === '') return false
      if (opt === 'unassigned') return t.assignee_id == null
      return t.assignee_id === opt
    })
  }
  if (assignee === 'unassigned') return t.assignee_id == null
  if (assignee === '') return true
  return t.assignee_id === assignee
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
  return tasks.filter((t) => {
    if (!matchesStatus(t, opts.status)) return false
    if (!matchesPriority(t, opts.priority)) return false
    if (!matchesAssignee(t, opts.assignee)) return false
    if (q) {
      const title = t.title.toLowerCase()
      const desc = (t.description ?? '').toLowerCase()
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

function projectLabel(t: Task): string {
  return t.project?.name ?? `Project #${t.project_id}`
}

function assigneeLabel(t: Task): string {
  if (!t.assignee_id || !t.assignee) return 'Unassigned'
  const u = t.assignee
  return u.name || u.email
}

function sectionLabel(t: Task): string {
  return t.section?.name || 'Unsectioned'
}

export function groupTasks(
  tasks: Task[],
  by: TaskGroupBy,
  sections: TaskSection[] = [],
): TaskGroup[] {
  if (by === 'none') return []
  if (tasks.length === 0 && by !== 'section') return []

  if (by === 'status') {
    return STATUS_ORDER.map((st) => {
      const groupTasksList = tasks.filter((t) => t.status === st)
      return {
        key: st,
        label: formatTaskStatus(st),
        tasks: groupTasksList,
      }
    })
  }

  if (by === 'priority') {
    return PRIORITY_ORDER.map((pr) => {
      const groupTasksList = tasks.filter((t) => t.priority === pr)
      return {
        key: pr,
        label: pr,
        tasks: groupTasksList,
      }
    })
  }

  if (by === 'project') {
    const map = new Map<number, Task[]>()
    for (const t of tasks) {
      const id = t.project_id
      if (!map.has(id)) map.set(id, [])
      map.get(id)!.push(t)
    }
    const keys = [...map.keys()].sort((a, b) =>
      projectLabel(
        map.get(a)![0],
      ).localeCompare(projectLabel(map.get(b)![0]), undefined, {
        sensitivity: 'base',
      }),
    )
    return keys.map((id) => {
      const list = map.get(id)!
      const t0 = list[0]
      return {
        key: `p-${id}`,
        label: projectLabel(t0),
        tasks: list,
      }
    })
  }

  if (by === 'assignee') {
    const map = new Map<string, { label: string; tasks: Task[] }>()
    for (const t of tasks) {
      const key =
        t.assignee_id != null && t.assignee
          ? `u-${t.assignee_id}`
          : 'unassigned'
      if (!map.has(key)) {
        map.set(key, { label: assigneeLabel(t), tasks: [] })
      }
      map.get(key)!.tasks.push(t)
    }
    const entries = [...map.entries()].sort(([, a], [, b]) => {
      if (a.label === 'Unassigned') return -1
      if (b.label === 'Unassigned') return 1
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
    map.set('unsectioned', { label: 'Unsectioned', tasks: [], order: -1 })
    for (const s of sections) {
      map.set(`s-${s.id}`, { label: s.name, tasks: [], order: s.position })
    }
    for (const t of tasks) {
      const key = t.section_id == null ? 'unsectioned' : `s-${t.section_id}`
      if (!map.has(key)) {
        map.set(key, {
          label: sectionLabel(t),
          tasks: [],
          order: t.section?.position ?? 0,
        })
      }
      map.get(key)!.tasks.push(t)
    }
    const entries = [...map.entries()].sort(([, a], [, b]) => {
      if (a.label === 'Unsectioned') return -1
      if (b.label === 'Unsectioned') return 1
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
    groups: groupTasks(sorted, opts.groupBy, opts.sections ?? []),
  }
}
