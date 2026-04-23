import type { ComposerTranslation } from 'vue-i18n'
import type { Note } from '@domain/note/types'
import type { ProjectSection, SectionDisplayMode } from '@domain/project/types'
import {
  filterTasks,
  type AssigneeFilterValue,
  type SortDir,
  type TaskSortKey,
} from '@domain/task/presentation'
import type { Task, TaskPriority, TaskStatus } from '@domain/task/types'

export type WorkspaceItem =
  | { kind: 'task'; task: Task }
  | { kind: 'note'; note: Note }

export type ProjectItemKindFilter = 'all' | 'tasks' | 'notes'

export interface ProjectItemGroup {
  key: string
  label: string
  order: number
  /** Режим отображения; для `unsectioned` / неизвестных — plain. */
  displayMode: SectionDisplayMode
  items: WorkspaceItem[]
}

function sectionDisplayMode(m: ProjectSection['display_mode'] | undefined): SectionDisplayMode {
  return m === 'progress' ? 'progress' : 'plain'
}

function parseIso(s: string): number {
  const ms = Date.parse(s)
  return Number.isFinite(ms) ? ms : 0
}

function noteMatchesSearch(n: Note, q: string): boolean {
  const s = q.trim().toLowerCase()
  if (!s) return true
  return (
    n.title.toLowerCase().includes(s)
    || (n.body ?? '').toLowerCase().includes(s)
  )
}

function filterNotes(notes: Note[], search: string): Note[] {
  return notes.filter(n => noteMatchesSearch(n, search))
}

function sortKeyValue(
  item: WorkspaceItem,
  sortKey: TaskSortKey | 'position',
): string | number {
  if (item.kind === 'task') {
    const t = item.task
    switch (sortKey) {
      case 'position':
        return t.position
      case 'title':
        return t.title.toLowerCase()
      case 'priority':
        return t.priority
      case 'due_date':
        return t.due_date ? parseIso(t.due_date) : 0
      case 'created_at':
        return parseIso(t.created_at)
      case 'updated_at':
      default:
        return parseIso(t.updated_at)
    }
  }
  const n = item.note
  switch (sortKey) {
    case 'position':
      return n.position
    case 'title':
      return n.title.toLowerCase()
    case 'priority':
      return 0
    case 'due_date':
      return 0
    case 'created_at':
      return parseIso(n.created_at)
    case 'updated_at':
    default:
      return parseIso(n.updated_at)
  }
}

function compareItems(
  a: WorkspaceItem,
  b: WorkspaceItem,
  sortKey: TaskSortKey | 'position',
  sortDir: SortDir,
): number {
  const va = sortKeyValue(a, sortKey)
  const vb = sortKeyValue(b, sortKey)
  let cmp = 0
  if (typeof va === 'number' && typeof vb === 'number') {
    cmp = va - vb
  } else {
    cmp = String(va).localeCompare(String(vb))
  }
  if (cmp !== 0) return sortDir === 'asc' ? cmp : -cmp
  const ida = a.kind === 'task' ? a.task.id : a.note.id
  const idb = b.kind === 'task' ? b.task.id : b.note.id
  return ida - idb
}

/**
 * Смешанный список задач и заметок, сгруппированный по секциям проекта.
 */
export function presentProjectItems(
  tasks: Task[],
  notes: Note[],
  sections: ProjectSection[],
  opts: {
    kindFilter: ProjectItemKindFilter
    search: string
    priority: TaskPriority[] | TaskPriority | ''
    assignee: AssigneeFilterValue | AssigneeFilterValue[]
    status: TaskStatus[]
    sortKey: TaskSortKey | 'position'
    sortDir: SortDir
    manualSectionOrder: boolean
  },
  t: ComposerTranslation,
): ProjectItemGroup[] {
  let ft = filterTasks(tasks, {
    search: opts.search,
    priority: opts.priority,
    assignee: opts.assignee,
    status: opts.status,
  })
  let fn = filterNotes(notes, opts.search)

  if (opts.kindFilter === 'tasks') fn = []
  if (opts.kindFilter === 'notes') ft = []

  const map = new Map<
    string,
    { key: string; label: string; order: number; displayMode: SectionDisplayMode; items: WorkspaceItem[] }
  >()

  map.set('unsectioned', {
    key: 'unsectioned',
    label: t('projectDetail.unsectioned'),
    order: -1,
    displayMode: 'plain',
    items: [],
  })

  for (const s of [...sections].sort(
    (a, b) => a.position - b.position || a.id - b.id,
  )) {
    map.set(`s-${s.id}`, {
      key: `s-${s.id}`,
      label: s.name,
      order: s.position,
      displayMode: sectionDisplayMode(s.display_mode),
      items: [],
    })
  }

  const sectionById = new Map(sections.map(s => [s.id, s]))

  for (const task of ft) {
    const key
      = task.section_id == null ? 'unsectioned' : `s-${task.section_id}`
    if (!map.has(key)) {
      const sid = task.section_id
      const meta = sid != null ? sectionById.get(sid) : undefined
      map.set(key, {
        key,
        label:
          meta?.name
          ?? task.section?.name
          ?? (sid != null
            ? t('tasks.unknownSection', { id: sid })
            : t('projectDetail.unsectioned')),
        order: meta?.position ?? task.section?.position ?? 9999,
        displayMode: sectionDisplayMode(
          meta?.display_mode ?? task.section?.display_mode,
        ),
        items: [],
      })
    }
    map.get(key)!.items.push({ kind: 'task', task })
  }

  for (const note of fn) {
    const key
      = note.section_id == null ? 'unsectioned' : `s-${note.section_id}`
    if (!map.has(key)) {
      const sid = note.section_id
      const meta = sid != null ? sectionById.get(sid) : undefined
      map.set(key, {
        key,
        label:
          note.section_id != null
            ? t('notes.unknownSection', { id: note.section_id })
            : t('projectDetail.unsectioned'),
        order: 9999,
        displayMode: sectionDisplayMode(meta?.display_mode),
        items: [],
      })
    }
    map.get(key)!.items.push({ kind: 'note', note })
  }

  const sk
    = opts.manualSectionOrder ? ('position' as const) : opts.sortKey

  for (const g of map.values()) {
    g.items.sort((a, b) => compareItems(a, b, sk, opts.sortDir))
  }

  return [...map.values()]
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map(({ key, label, order, displayMode, items }) => ({
      key,
      label,
      order,
      displayMode,
      items,
    }))
}
