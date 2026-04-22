import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Task } from '@domain/task/types'
import type { Note } from '@domain/note/types'
import { useTaskStore } from '@app/task.store'
import { useNoteStore, extractNoteAxiosError } from '@app/note.store'
import { useTrashNotesStore } from '@app/trashNotes.store'
import { useToast } from '@app/composables/useToast'
import { useConfirm } from '@app/composables/useConfirm'

export type UseNoteDetailOptions = {
  projectId: () => number
  noteId: () => number | null
  active: () => boolean
  projectTasks: () => { id: number; title: string }[]
  canManage: () => boolean
  trashed: () => boolean
  initialMode: () => 'view' | 'edit'
  allowInlineEdit: () => boolean
  onSaved?: () => void
  onDeleted?: () => void
  onClose?: () => void
  onOpenTask?: (taskId: number) => void
}

export function useNoteDetail(options: UseNoteDetailOptions) {
  const { t } = useI18n()
  const toast = useToast()
  const { confirm } = useConfirm()
  const noteStore = useNoteStore()
  const taskStore = useTaskStore()
  const trashNotesStore = useTrashNotesStore()

  const note = ref<Note | null>(null)
  const loading = ref(false)
  const editing = ref(false)
  const saving = ref(false)
  const removing = ref(false)
  const restoring = ref(false)
  const purging = ref(false)
  const linkBusy = ref(false)
  const linkManagerOpen = ref(false)

  const linkedIds = computed(() => note.value?.linked_task_ids ?? [])
  const linkedTaskObjects = ref<Task[]>([])

  async function refreshLinkedTasks() {
    const n = note.value
    if (!n) {
      linkedTaskObjects.value = []
      return
    }
    const ids = n.linked_task_ids ?? []
    if (ids.length === 0) {
      linkedTaskObjects.value = []
      return
    }
    try {
      const items = await Promise.all(ids.map(id => taskStore.fetchOne(id)))
      linkedTaskObjects.value = items
    } catch {
      linkedTaskObjects.value = []
    }
  }

  watch(
    () => note.value?.linked_task_ids,
    () => {
      void refreshLinkedTasks()
    },
    { immediate: true },
  )

  function openTask(id: number) {
    options.onOpenTask?.(id)
  }

  const availableTasks = computed(() =>
    options.projectTasks().filter(tk => !linkedIds.value.includes(tk.id)),
  )

  const formTitle = ref('')
  const formBody = ref('')
  const formSectionId = ref<number | null>(null)

  const noteModalDirty = computed(() => {
    const n = note.value
    if (!n || !editing.value || options.trashed()) return false
    return (
      formTitle.value.trim() !== n.title
      || formBody.value.trim() !== (n.body ?? '').trim()
      || formSectionId.value !== (n.section_id ?? null)
    )
  })

  const noteFooterVisible = computed(() => {
    if (!note.value || loading.value) return false
    if (options.trashed() && options.canManage()) return true
    if (
      options.canManage()
      && !options.trashed()
      && options.allowInlineEdit()
    ) {
      return true
    }
    return false
  })

  const showHeaderLinkedTasksButton = computed(
    () =>
      Boolean(
        note.value
        && options.canManage()
        && !options.trashed()
        && !loading.value,
      ),
  )

  function cancelEdit() {
    editing.value = false
    if (options.allowInlineEdit()) {
      options.onClose?.()
    }
  }

  watch(
    () => [note.value, editing.value] as const,
    ([n, ed]) => {
      if (!n || !ed) return
      formTitle.value = n.title
      formBody.value = n.body ?? ''
      formSectionId.value = n.section_id ?? null
    },
    { immediate: true },
  )

  watch(
    () =>
      [
        options.active(),
        options.noteId(),
        options.projectId(),
        options.trashed(),
      ] as const,
    async ([open, nid, pid, trashed]) => {
      if (!open || nid == null) {
        note.value = null
        editing.value = false
        linkManagerOpen.value = false
        return
      }
      loading.value = true
      try {
        if (trashed) {
          const n = await trashNotesStore.fetchOne(pid, nid)
          note.value = n
          editing.value = false
        } else {
          const n = await noteStore.fetchOne(pid, nid)
          note.value = n
          noteStore.patchNoteInList(n.id, { linked_task_ids: n.linked_task_ids })
          if (!options.canManage()) {
            toast.error(t('notes.detail.noManagePermission'))
            options.onClose?.()
            editing.value = false
          } else {
            editing.value =
              options.allowInlineEdit()
              && options.initialMode() === 'edit'
          }
        }
      } catch {
        toast.error(t('notes.detail.loadError'))
        note.value = null
      } finally {
        loading.value = false
      }
    },
    { immediate: true },
  )

  function close() {
    options.onClose?.()
  }

  async function saveFromForm(payload: {
    title: string
    body: string
    section_id: number | null
  }) {
    const n = note.value
    const pid = options.projectId()
    if (!n || !options.canManage()) return
    saving.value = true
    try {
      const prevSid = n.section_id ?? null
      const updated = await noteStore.update(pid, n.id, {
        title: payload.title,
        body: payload.body,
      })
      note.value = updated
      const sid = payload.section_id
      if (sid !== prevSid) {
        const moved = await noteStore.move(pid, n.id, {
          section_id: sid,
          position: updated.position,
        })
        note.value = moved
      }
      editing.value = false
      toast.success(t('notes.detail.saved'))
      options.onSaved?.()
      options.onClose?.()
    } catch (e: unknown) {
      toast.error(extractNoteAxiosError(e, 'notes.detail.saveFailed'))
    } finally {
      saving.value = false
    }
  }

  async function removeNote() {
    const n = note.value
    const pid = options.projectId()
    if (!n || removing.value) return
    const ok = await confirm({
      title: t('notes.confirm.deleteTitle'),
      message: t('notes.confirm.deleteMessage', { title: n.title }),
      confirmLabelKey: 'notes.confirm.deleteConfirm',
      danger: true,
    })
    if (!ok) return
    removing.value = true
    try {
      await noteStore.remove(pid, n.id)
      toast.success(t('notes.detail.deleted'))
      close()
      options.onDeleted?.()
    } catch (e: unknown) {
      toast.error(extractNoteAxiosError(e, 'notes.detail.deleteFailed'))
    } finally {
      removing.value = false
    }
  }

  async function onLinkTask(taskId: number) {
    const n = note.value
    const pid = options.projectId()
    if (!n || !options.canManage()) return
    linkBusy.value = true
    try {
      await noteStore.linkTask(pid, n.id, taskId)
      const ids = [...linkedIds.value, taskId]
      note.value = { ...n, linked_task_ids: ids }
      toast.success(t('notes.linkTask.linked'))
      options.onSaved?.()
    } catch (e: unknown) {
      toast.error(extractNoteAxiosError(e, 'notes.linkTask.linkFailed'))
    } finally {
      linkBusy.value = false
    }
  }

  async function onUnlinkTask(taskId: number) {
    const n = note.value
    const pid = options.projectId()
    if (!n || !options.canManage()) return
    linkBusy.value = true
    try {
      await noteStore.unlinkTask(pid, n.id, taskId)
      const ids = linkedIds.value.filter(x => x !== taskId)
      note.value = { ...n, linked_task_ids: ids }
      noteStore.invalidateTaskLinks(taskId)
      toast.success(t('notes.linkTask.unlinked'))
      options.onSaved?.()
    } catch (e: unknown) {
      toast.error(extractNoteAxiosError(e, 'notes.linkTask.unlinkFailed'))
    } finally {
      linkBusy.value = false
    }
  }

  async function restoreFromTrash() {
    const n = note.value
    const pid = options.projectId()
    if (!n || !options.canManage()) return
    restoring.value = true
    try {
      await trashNotesStore.restoreNote(pid, n.id)
      toast.success(t('notes.trash.noteRestored'))
      close()
      options.onSaved?.()
    } catch {
      toast.error(t('notes.trash.restoreFailed'))
    } finally {
      restoring.value = false
    }
  }

  async function purgeFromTrash() {
    const n = note.value
    const pid = options.projectId()
    if (!n || !options.canManage()) return
    const ok = await confirm({
      title: t('notes.trash.confirmPermanentTitle'),
      message: t('notes.trash.confirmPermanentNote'),
      confirmLabelKey: 'notes.trash.confirmPermanent',
      danger: true,
    })
    if (!ok) return
    purging.value = true
    try {
      await trashNotesStore.permanentDeleteNote(pid, n.id)
      toast.success(t('notes.trash.notePurged'))
      close()
      options.onSaved?.()
    } catch {
      toast.error(t('notes.trash.purgeFailed'))
    } finally {
      purging.value = false
    }
  }

  return {
    note,
    loading,
    editing,
    saving,
    removing,
    restoring,
    purging,
    linkBusy,
    linkManagerOpen,
    linkedIds,
    linkedTaskObjects,
    availableTasks,
    formTitle,
    formBody,
    formSectionId,
    noteModalDirty,
    noteFooterVisible,
    showHeaderLinkedTasksButton,
    cancelEdit,
    saveFromForm,
    removeNote,
    onLinkTask,
    onUnlinkTask,
    restoreFromTrash,
    purgeFromTrash,
    openTask,
    close,
  }
}
