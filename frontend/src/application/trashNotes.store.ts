import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { NoteTrashItem } from '@domain/note/types'
import { projectsApi } from '@infra/api/projects'

/** Удалённые заметки проекта (корзина). */
export const useTrashNotesStore = defineStore('trashNotes', () => {
  const notes = ref<NoteTrashItem[]>([])
  const loading = ref(false)
  const error = ref<unknown | null>(null)

  async function fetchNotes(projectId: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const { data } = await projectsApi.trash.notes(projectId)
      notes.value = data.notes ?? []
    } catch (e: unknown) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  async function restoreNote(projectId: number, noteId: number): Promise<void> {
    await projectsApi.trash.restoreNote(projectId, noteId)
    notes.value = notes.value.filter(n => n.id !== noteId)
  }

  async function permanentDeleteNote(projectId: number, noteId: number): Promise<void> {
    await projectsApi.trash.permanentDeleteNote(projectId, noteId)
    notes.value = notes.value.filter(n => n.id !== noteId)
  }

  return {
    notes,
    loading,
    error,
    fetchNotes,
    restoreNote,
    permanentDeleteNote,
  }
})
