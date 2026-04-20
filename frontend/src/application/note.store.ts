import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Note, CreateNotePayload, UpdateNotePayload } from '@domain/note/types'
import { notesApi } from '@infra/api/notes'
import { mapApiError } from '@infra/api/errorMap'

/** Ключ группы: `unsectioned` | `ns-{sectionId}` */
export function parseNoteSectionGroupKey(key: string): number | null {
  if (key === 'unsectioned') return null
  if (key.startsWith('ns-')) {
    const n = Number(key.slice(3))
    return Number.isFinite(n) ? n : null
  }
  return null
}

export function noteSectionGroupKey(sectionId: number | null | undefined): string {
  if (sectionId == null) return 'unsectioned'
  return `ns-${sectionId}`
}

/** `fallbackKey` — ключ i18n (например `notes.toasts.loadFailed`). */
export function extractNoteAxiosError(e: unknown, fallbackKey: string): string {
  return mapApiError(e, fallbackKey)
}

export const useNoteStore = defineStore('note', () => {
  const notes = ref<Note[]>([])
  const currentProjectId = ref<number | null>(null)
  const loading = ref(false)
  /** Ошибка последней загрузки (сырой объект); в UI показывайте локализованный fallback. */
  const error = ref<unknown | null>(null)
  const savingId = ref<number | null>(null)
  const deletingId = ref<number | null>(null)
  /** Кэш связей задача → заметки (по необходимости). */
  const linksByTaskId = ref<Map<number, Note[]>>(new Map())

  async function fetchAll(
    params: { project_id?: number } = {},
    options: { quiet?: boolean } = {},
  ) {
    if (!options.quiet) loading.value = true
    error.value = null
    try {
      const { data } = await notesApi.listAll(
        params.project_id != null
          ? { project_id: params.project_id }
          : undefined,
      )
      notes.value = data.notes ?? []
      currentProjectId.value = null
    } catch (e: unknown) {
      error.value = e
      throw e
    } finally {
      if (!options.quiet) loading.value = false
    }
  }

  async function fetchList(projectId: number, options: { quiet?: boolean } = {}) {
    if (!options.quiet) loading.value = true
    error.value = null
    try {
      const { data } = await notesApi.list(projectId)
      notes.value = data.notes ?? []
      currentProjectId.value = projectId
    } catch (e: unknown) {
      error.value = e
      throw e
    } finally {
      if (!options.quiet) loading.value = false
    }
  }

  async function fetchOne(projectId: number, noteId: number): Promise<Note> {
    const { data } = await notesApi.get(projectId, noteId)
    return data.note
  }

  async function create(projectId: number, payload: CreateNotePayload): Promise<Note> {
    savingId.value = -1
    try {
      const { data } = await notesApi.create(projectId, payload)
      notes.value = [data.note, ...notes.value.filter(n => n.id !== data.note.id)]
      return data.note
    } finally {
      savingId.value = null
    }
  }

  async function update(
    projectId: number,
    noteId: number,
    payload: UpdateNotePayload,
  ): Promise<Note> {
    savingId.value = noteId
    try {
      const { data } = await notesApi.update(projectId, noteId, payload)
      const i = notes.value.findIndex(n => n.id === noteId)
      if (i >= 0) notes.value[i] = data.note
      return data.note
    } finally {
      savingId.value = null
    }
  }

  async function remove(projectId: number, noteId: number): Promise<void> {
    deletingId.value = noteId
    try {
      await notesApi.remove(projectId, noteId)
      notes.value = notes.value.filter(n => n.id !== noteId)
    } finally {
      deletingId.value = null
    }
  }

  async function restore(projectId: number, noteId: number): Promise<void> {
    await notesApi.restore(projectId, noteId)
  }

  async function permanentDelete(projectId: number, noteId: number): Promise<void> {
    await notesApi.permanentDelete(projectId, noteId)
  }

  async function move(
    projectId: number,
    noteId: number,
    payload: { section_id?: number | null; position: number },
    options: { refetch?: boolean } = {},
  ): Promise<Note> {
    const { data } = await notesApi.move(projectId, noteId, payload)
    const i = notes.value.findIndex(n => n.id === noteId)
    if (i >= 0) notes.value[i] = data.note
    else notes.value.push(data.note)
    if (options.refetch !== false) {
      await fetchList(projectId, { quiet: true })
    }
    return data.note
  }

  /**
   * Применить порядок после drag-n-drop: секции обрабатываются по порядку `keys`
   * (при переносе между секциями сначала целевая, затем исходная); позиции — снизу вверх,
   * чтобы не ломать уникальность порядка в БД между запросами.
   *
   * @deprecated Используйте `projectStore.reorderSectionItems` (POST `/sections/:sid/items/reorder`)
   * для смешанного порядка задач и заметок; этот путь остаётся для постепенной миграции UI.
   */
  async function reorderNotes(
    projectId: number,
    keys: string[],
    groupNoteIds: Map<string, number[]>,
  ): Promise<void> {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        '[noteStore.reorderNotes] deprecated: prefer projectStore.reorderSectionItems for unified section order',
      )
    }
    for (const key of keys) {
      const sectionId = parseNoteSectionGroupKey(key)
      const ids = groupNoteIds.get(key) ?? []
      for (let pos = ids.length - 1; pos >= 0; pos--) {
        const noteId = ids[pos]
        const n = notes.value.find(x => x.id === noteId)
        if (!n) continue
        if (n.section_id !== sectionId || n.position !== pos) {
          await move(
            projectId,
            noteId,
            { section_id: sectionId, position: pos },
            { refetch: false },
          )
        }
      }
    }
    await fetchList(projectId, { quiet: true })
  }

  async function listLinks(projectId: number, noteId: number): Promise<number[]> {
    return notesApi.links.list(projectId, noteId)
  }

  async function linkTask(
    projectId: number,
    noteId: number,
    taskId: number,
  ): Promise<void> {
    await notesApi.links.add(projectId, noteId, taskId)
    linksByTaskId.value.delete(taskId)
  }

  async function unlinkTask(
    projectId: number,
    noteId: number,
    taskId: number,
  ): Promise<void> {
    await notesApi.links.remove(projectId, noteId, taskId)
    linksByTaskId.value.delete(taskId)
  }

  async function fetchLinkedByTask(taskId: number): Promise<Note[]> {
    const { data } = await notesApi.linkedByTask(taskId)
    const list = data.notes ?? []
    linksByTaskId.value.set(taskId, list)
    return list
  }

  function invalidateTaskLinks(taskId: number) {
    linksByTaskId.value.delete(taskId)
  }

  function patchNoteInList(noteId: number, patch: Partial<Note>) {
    const i = notes.value.findIndex(n => n.id === noteId)
    if (i >= 0) {
      notes.value[i] = { ...notes.value[i], ...patch }
    }
  }

  return {
    notes,
    currentProjectId,
    loading,
    error,
    savingId,
    deletingId,
    linksByTaskId,
    fetchAll,
    fetchList,
    fetchOne,
    create,
    update,
    remove,
    restore,
    permanentDelete,
    move,
    reorderNotes,
    listLinks,
    linkTask,
    unlinkTask,
    fetchLinkedByTask,
    invalidateTaskLinks,
    patchNoteInList,
  }
})
