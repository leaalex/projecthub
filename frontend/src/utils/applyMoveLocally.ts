import type { TaskMovePayload } from '../types/project'
import type { Task } from '../types/task'

function normSection(s: number | null | undefined): number | null {
  if (s === undefined || s === null) return null
  return s
}

/**
 * Mirrors backend Move: reorder within target section, renumber positions 1..N,
 * rebalance old section when section changes. Scoped by moved task's project_id.
 */
export function applyMoveLocally(
  tasks: Task[],
  payload: TaskMovePayload,
): Task[] {
  const moved = tasks.find((t) => t.id === payload.task_id)
  if (!moved) return tasks

  const next = tasks.map((t) => ({ ...t }))
  const movedIdx = next.findIndex((t) => t.id === payload.task_id)
  if (movedIdx < 0) return tasks

  const projectId = moved.project_id
  const currentSection = normSection(moved.section_id)
  const targetSection =
    payload.section_id !== undefined
      ? normSection(payload.section_id)
      : currentSection

  const siblings = next
    .filter(
      (t) =>
        t.project_id === projectId &&
        normSection(t.section_id) === targetSection &&
        t.id !== payload.task_id,
    )
    .sort((a, b) => a.position - b.position || a.id - b.id)

  let insertPos = siblings.length
  if (payload.position !== undefined && payload.position >= 0) {
    insertPos = Math.min(payload.position, siblings.length)
  }

  const orderedIds = [
    ...siblings.slice(0, insertPos).map((t) => t.id),
    payload.task_id,
    ...siblings.slice(insertPos).map((t) => t.id),
  ]

  const sameSection = currentSection === targetSection

  // Rebalance old section after moving task out (when section changes).
  if (!sameSection) {
    const oldStay = next
      .filter(
        (t) =>
          t.project_id === projectId &&
          normSection(t.section_id) === currentSection &&
          t.id !== payload.task_id,
      )
      .sort((a, b) => a.position - b.position || a.id - b.id)
    oldStay.forEach((t, i) => {
      const idx = next.findIndex((x) => x.id === t.id)
      if (idx >= 0) {
        next[idx] = { ...next[idx], position: i + 1 }
      }
    })
  }

  const sectionMeta =
    targetSection === null
      ? null
      : next.find(
          (t) =>
            normSection(t.section_id) === targetSection &&
            t.section?.id === targetSection,
        )?.section ??
        moved.section ??
        null

  orderedIds.forEach((id, i) => {
    const idx = next.findIndex((x) => x.id === id)
    if (idx < 0) return
    next[idx] = {
      ...next[idx],
      section_id: targetSection,
      position: i + 1,
      section:
        targetSection === null
          ? null
          : sectionMeta && sectionMeta.id === targetSection
            ? sectionMeta
            : next[idx].section,
    }
  })

  return next
}
