import type { ComposerTranslation } from 'vue-i18n'
import type { Note } from '@domain/note/types'
import type { ProjectSection } from '@domain/project/types'
import { noteBodyPlainPreview } from '@domain/note/preview'

export type NoteSortKey = 'updated_at' | 'title'
export type SortDir = 'asc' | 'desc'
export type NoteGroupBy = 'project' | 'section' | 'none'

export interface NoteGroup {
  key: string
  label: string
  order: number
  notes: Note[]
}

function matchesSearch(note: Note, q: string): boolean {
  const trimmed = q.trim()
  if (!trimmed) return true
  const needle = trimmed.toLowerCase()
  if (note.title.toLowerCase().includes(needle)) return true
  const plain = noteBodyPlainPreview(note.body ?? '', 4000).toLowerCase()
  return plain.includes(needle)
}

export function filterNotes(notes: Note[], search: string): Note[] {
  return notes.filter(n => matchesSearch(n, search))
}

function noteTimeMs(n: Note): number {
  return new Date(n.updated_at).getTime()
}

export function sortNotes(
  notes: Note[],
  sortKey: NoteSortKey,
  sortDir: SortDir,
): Note[] {
  const dir = sortDir === 'asc' ? 1 : -1
  const arr = [...notes]
  arr.sort((a, b) => {
    if (sortKey === 'title') {
      const c = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      return c * dir
    }
    const ta = noteTimeMs(a)
    const tb = noteTimeMs(b)
    if (ta !== tb) return (ta - tb) * dir
    return (a.id - b.id) * dir
  })
  return arr
}

function projectLabel(
  projectId: number,
  projectIdToName: Map<number, string>,
  t: ComposerTranslation,
): string {
  return projectIdToName.get(projectId) ?? t('notes.filters.unknownProject', { id: projectId })
}

/**
 * Клиентский поиск, сортировка и группировка для глобальной страницы заметок.
 */
export function presentNotes(
  notes: Note[],
  opts: {
    search: string
    sortKey: NoteSortKey
    sortDir: SortDir
    groupBy: NoteGroupBy
    projectIdToName: Map<number, string>
    sections: ProjectSection[]
    t: ComposerTranslation
  },
): { flat: Note[]; groups: NoteGroup[] } {
  let flat = filterNotes(notes, opts.search)
  flat = sortNotes(flat, opts.sortKey, opts.sortDir)

  if (opts.groupBy === 'none') {
    return {
      flat,
      groups: [{ key: 'all', label: '', order: 0, notes: flat }],
    }
  }

  if (opts.groupBy === 'project') {
    const byKey = new Map<string, NoteGroup>()
    for (const n of flat) {
      const key = `p-${n.project_id}`
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          label: projectLabel(n.project_id, opts.projectIdToName, opts.t),
          order: n.project_id,
          notes: [],
        })
      }
      byKey.get(key)!.notes.push(n)
    }
    const groups = [...byKey.values()].sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
    )
    return { flat, groups }
  }

  // section
  const map = new Map<string, NoteGroup>()
  map.set('unsectioned', {
    key: 'unsectioned',
    label: opts.t('notes.section.none'),
    order: -1,
    notes: [],
  })
  for (const s of [...opts.sections].sort(
    (a, b) => a.position - b.position || a.id - b.id,
  )) {
    map.set(`ns-${s.id}`, {
      key: `ns-${s.id}`,
      label: s.name,
      order: s.position,
      notes: [],
    })
  }
  for (const n of flat) {
    const key = n.section_id == null ? 'unsectioned' : `ns-${n.section_id}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: opts.t('notes.unknownSection', { id: n.section_id }),
        order: Number.MAX_SAFE_INTEGER,
        notes: [],
      })
    }
    map.get(key)!.notes.push(n)
  }
  const groups = [...map.values()]
    .filter(g => g.notes.length > 0)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
  return { flat, groups }
}
