import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const COLLAPSED_KEY = 'tm-ui-detail-panel-collapsed'

export type DetailPanelEntity =
  | { kind: 'task'; taskId: number }
  | { kind: 'note'; projectId: number; noteId: number }

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeCollapsed(v: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, v ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export const useDetailPanelStore = defineStore('detailPanel', () => {
  const entity = ref<DetailPanelEntity | null>(null)
  const collapsed = ref(readCollapsed())
  const pendingTaskEditId = ref<number | null>(null)
  const pendingNoteEdit = ref<{ projectId: number; noteId: number } | null>(
    null,
  )

  /** Incremented when the detail panel mutates data; views may watch and refetch. */
  const workspaceRefreshTick = ref(0)

  watch(collapsed, v => writeCollapsed(v))

  function openTask(taskId: number) {
    entity.value = { kind: 'task', taskId }
    collapsed.value = false
  }

  function openNote(projectId: number, noteId: number) {
    entity.value = { kind: 'note', projectId, noteId }
    collapsed.value = false
  }

  function close() {
    entity.value = null
  }

  function toggleCollapsed() {
    collapsed.value = !collapsed.value
  }

  function requestTaskEdit(taskId: number) {
    pendingTaskEditId.value = taskId
  }

  function requestNoteEdit(projectId: number, noteId: number) {
    pendingNoteEdit.value = { projectId, noteId }
  }

  function clearPendingTaskEdit() {
    pendingTaskEditId.value = null
  }

  function clearPendingNoteEdit() {
    pendingNoteEdit.value = null
  }

  function requestWorkspaceRefresh() {
    workspaceRefreshTick.value += 1
  }

  return {
    entity,
    collapsed,
    pendingTaskEditId,
    pendingNoteEdit,
    openTask,
    openNote,
    close,
    toggleCollapsed,
    requestTaskEdit,
    requestNoteEdit,
    clearPendingTaskEdit,
    clearPendingNoteEdit,
    workspaceRefreshTick,
    requestWorkspaceRefresh,
  }
})
