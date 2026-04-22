import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Note, CreateNotePayload, UpdateNotePayload } from '@domain/note/types'
import { notesApi } from '@infra/api/notes'
import { mapApiError } from '@infra/api/errorMap'

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
    listLinks,
    linkTask,
    unlinkTask,
    fetchLinkedByTask,
    invalidateTaskLinks,
    patchNoteInList,
  }
})
