import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Note, NoteTrashItem } from '@domain/note/types'
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

  async function fetchOne(projectId: number, noteId: number): Promise<Note> {
    const { data } = await projectsApi.trash.getNote(projectId, noteId)
    const n = data.note
    if (!n) {
      throw new Error('no note')
    }
    return n
  }

  return {
    notes,
    loading,
    error,
    fetchNotes,
    fetchOne,
    restoreNote,
    permanentDeleteNote,
  }
})
