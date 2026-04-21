import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTaskStore } from '@app/task.store'
import { useTrashTasksStore } from '@app/trashTasks.store'
import { useAuthStore } from '@app/auth.store'
import { useProjectStore } from '@app/project.store'
import { useNoteStore, extractNoteAxiosError } from '@app/note.store'
import { useProjectScopedAssignableUsers } from '@app/composables/useAdminAssignableUsers'
import { useCanEditTask } from '@app/composables/useCanEditTask'
import { useConfirm } from '@app/composables/useConfirm'
import { useToast } from '@app/composables/useToast'
import type { Note } from '@domain/note/types'
import type { Task, TaskPriority, TaskStatus } from '@domain/task/types'
import { canManageNote } from '@domain/note/permissions'
import { mapApiError } from '@infra/api/errorMap'

export type TaskDetailOpenNotePayload = { noteId: number; projectId: number }

export type UseTaskDetailOptions = {
  taskId: () => number | null
  /** Load and show task when true */
  active: () => boolean
  trashed: () => boolean
  trashProjectId: () => number | null
  canManageTrash: () => boolean
  initialMode: () => 'view' | 'edit'
  /** When false, never enter inline edit form (sidebar) */
  allowInlineEdit: () => boolean
  onSaved?: () => void
  onOpenNote?: (payload: TaskDetailOpenNotePayload) => void
  onClose?: () => void
}

export function useTaskDetail(options: UseTaskDetailOptions) {
  const { t } = useI18n()
  const taskStore = useTaskStore()
  const trashTasksStore = useTrashTasksStore()
  const auth = useAuthStore()
  const projectStore = useProjectStore()
  const noteStore = useNoteStore()
  const toast = useToast()
  const { confirm } = useConfirm()

  const task = ref<Task | null>(null)
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const saving = ref(false)
  const removing = ref(false)
  const restoring = ref(false)
  const purging = ref(false)
  const editing = ref(false)

  const formTitle = ref('')
  const formDescription = ref('')
  const formProjectId = ref(0)
  const formSectionId = ref<number | null>(null)
  const formAssigneeId = ref(0)
  const formStatus = ref<TaskStatus>('todo')
  const formPriority = ref<TaskPriority>('medium')

  const { assignableUsers } = useProjectScopedAssignableUsers(() => formProjectId.value)

  const canEdit = useCanEditTask(() => task.value)

  const linkedNotes = ref<Note[]>([])
  const linkManagerOpen = ref(false)
  const noteSearch = ref('')
  const linkBusy = ref(false)

  const permCtx = computed(() => ({
    projects: projectStore.projects.map(p => ({ id: p.id, owner_id: p.owner_id })),
    current: projectStore.current
      ? {
          id: projectStore.current.id,
          owner_id: projectStore.current.owner_id,
          caller_project_role: projectStore.current.caller_project_role,
        }
      : null,
  }))

  const canManageNotes = computed(() => {
    const cur = task.value
    if (!cur) return false
    return canManageNote(auth.user?.id, auth.user?.role, permCtx.value, cur.project_id)
  })

  const filteredNotesForPicker = computed(() => {
    const q = noteSearch.value.trim().toLowerCase()
    const pid = task.value?.project_id
    const list = noteStore.notes.filter(n => n.project_id === pid)
    if (!q) return list
    return list.filter(n => n.title.toLowerCase().includes(q))
  })

  const pickerCandidates = computed(() => {
    const linked = new Set(linkedNotes.value.map(n => n.id))
    return filteredNotesForPicker.value.filter(n => !linked.has(n.id))
  })

  async function refreshLinkedNotes() {
    const cur = task.value
    if (!cur) {
      linkedNotes.value = []
      return
    }
    try {
      linkedNotes.value = await noteStore.fetchLinkedByTask(cur.id)
    } catch (e: unknown) {
      linkedNotes.value = []
      toast.error(extractNoteAxiosError(e, 'taskDetailModal.linkedNotes.loadFailed'))
    }
  }

  watch(
    () =>
      [
        options.active(),
        options.taskId(),
        options.trashed(),
        options.trashProjectId(),
      ] as const,
    async ([open, id, trashed, trashPid]) => {
      if (!open || id == null) {
        task.value = null
        loadError.value = null
        linkedNotes.value = []
        editing.value = false
        linkManagerOpen.value = false
        return
      }
      if (trashed) {
        if (trashPid == null || !Number.isFinite(trashPid) || trashPid <= 0) {
          task.value = null
          loadError.value = t('taskDetailModal.loadError')
          return
        }
        loading.value = true
        loadError.value = null
        task.value = null
        linkedNotes.value = []
        editing.value = false
        try {
          task.value = await trashTasksStore.fetchOne(trashPid, id)
        } catch {
          loadError.value = t('taskDetailModal.loadError')
        } finally {
          loading.value = false
        }
        return
      }
      loading.value = true
      loadError.value = null
      task.value = null
      editing.value =
        options.allowInlineEdit() && options.initialMode() === 'edit'
      try {
        task.value = await taskStore.fetchOne(id)
        await refreshLinkedNotes()
        await nextTick()
        editing.value =
          options.allowInlineEdit()
          && canEdit.value
          && options.initialMode() === 'edit'
        if (!canEdit.value) editing.value = false
      } catch {
        loadError.value = t('taskDetailModal.loadError')
      } finally {
        loading.value = false
      }
    },
    { immediate: true },
  )

  watch(linkManagerOpen, async open => {
    if (!open || !task.value) return
    noteSearch.value = ''
    try {
      await noteStore.fetchList(task.value.project_id, { quiet: true })
    } catch (e: unknown) {
      toast.error(extractNoteAxiosError(e, 'taskDetailModal.linkedNotes.loadFailed'))
    }
  })

  watch(
    () => [task.value, canEdit.value] as const,
    ([cur, edit]) => {
      if (!cur || !edit) return
      formTitle.value = cur.title
      formDescription.value = cur.description ?? ''
      formProjectId.value = cur.project_id
      formSectionId.value = cur.section_id ?? null
      formAssigneeId.value = cur.assignee_id ?? 0
      formStatus.value = cur.status
      formPriority.value = cur.priority
    },
    { immediate: true },
  )

  watch(
    () => [formProjectId.value, editing.value] as const,
    async ([pid, edit]) => {
      if (!edit || !task.value) return
      if (!Number.isFinite(pid) || pid <= 0) return
      try {
        await projectStore.fetchSections(pid)
      } catch {
        /* sections may be stale */
      }
    },
    { immediate: true },
  )

  function close() {
    options.onClose?.()
  }

  async function save() {
    const cur = task.value
    if (!cur) return
    const trimmedTitle = formTitle.value.trim()
    if (!trimmedTitle) {
      toast.error(t('taskDetailModal.toasts.enterTitle'))
      return
    }
    saving.value = true
    try {
      const projectChanged = formProjectId.value !== cur.project_id

      let updated = await taskStore.update(cur.id, {
        title: trimmedTitle,
        description: formDescription.value.trim(),
        status: formStatus.value,
        priority: formPriority.value,
        ...(projectChanged ? { project_id: formProjectId.value } : {}),
      })

      const desiredSid = formSectionId.value
      if (desiredSid !== (updated.section_id ?? null)) {
        updated = await taskStore.moveTask(updated.project_id, {
          task_id: updated.id,
          section_id: desiredSid,
        })
      }

      if (formAssigneeId.value !== (updated.assignee_id ?? 0)) {
        updated = await taskStore.assign(updated.id, formAssigneeId.value)
      }

      task.value = updated
      editing.value = false
      toast.success(t('taskDetailModal.toasts.updated'))
      options.onSaved?.()
    } catch (e: unknown) {
      toast.error(mapApiError(e, 'taskDetailModal.toasts.updateFailed'))
      try {
        task.value = await taskStore.fetchOne(cur.id)
      } catch {
        /* keep stale task */
      }
    } finally {
      saving.value = false
    }
  }

  async function refreshTask() {
    const id = options.taskId()
    if (id == null || !task.value) return
    try {
      task.value = await taskStore.fetchOne(id)
    } catch {
      /* keep existing task */
    }
  }

  async function linkNoteFromPicker(noteId: number) {
    const cur = task.value
    if (!cur || !canManageNotes.value) return
    linkBusy.value = true
    try {
      await noteStore.linkTask(cur.project_id, noteId, cur.id)
      await refreshLinkedNotes()
      noteStore.invalidateTaskLinks(cur.id)
      toast.success(t('taskDetailModal.linkedNotes.linked'))
      options.onSaved?.()
    } catch (e: unknown) {
      toast.error(
        extractNoteAxiosError(e, 'taskDetailModal.linkedNotes.linkFailed'),
      )
    } finally {
      linkBusy.value = false
    }
  }

  async function unlinkNote(noteId: number) {
    const cur = task.value
    if (!cur || !canManageNotes.value) return
    linkBusy.value = true
    try {
      await noteStore.unlinkTask(cur.project_id, noteId, cur.id)
      await refreshLinkedNotes()
      noteStore.invalidateTaskLinks(cur.id)
      toast.success(t('taskDetailModal.linkedNotes.unlinked'))
      options.onSaved?.()
    } catch (e: unknown) {
      toast.error(
        extractNoteAxiosError(e, 'taskDetailModal.linkedNotes.unlinkFailed'),
      )
    } finally {
      linkBusy.value = false
    }
  }

  function openLinkedNote(noteId: number) {
    const cur = task.value
    if (!cur) return
    options.onOpenNote?.({ noteId, projectId: cur.project_id })
  }

  async function removeTask() {
    const cur = task.value
    if (!cur) return
    const ok = await confirm({
      title: t('taskCard.confirm.deleteTitle'),
      message: t('taskCard.confirm.deleteMessage', { title: cur.title }),
      confirmLabelKey: 'taskCard.confirm.deleteConfirm',
      danger: true,
    })
    if (!ok) return
    removing.value = true
    try {
      await taskStore.remove(cur.id)
      toast.success(t('taskDetailModal.toasts.deleted'))
      close()
      options.onSaved?.()
    } catch {
      toast.error(t('taskDetailModal.toasts.deleteFailed'))
    } finally {
      removing.value = false
    }
  }

  async function restoreFromTrash() {
    const cur = task.value
    const pid = options.trashProjectId()
    if (!cur || pid == null) return
    restoring.value = true
    try {
      await trashTasksStore.restoreTask(pid, cur.id)
      toast.success(t('notes.trash.taskRestored'))
      close()
      options.onSaved?.()
    } catch {
      toast.error(t('notes.trash.restoreFailed'))
    } finally {
      restoring.value = false
    }
  }

  function cancelEdit() {
    const cur = task.value
    if (cur && canEdit.value) {
      formTitle.value = cur.title
      formDescription.value = cur.description ?? ''
      formProjectId.value = cur.project_id
      formSectionId.value = cur.section_id ?? null
      formAssigneeId.value = cur.assignee_id ?? 0
      formStatus.value = cur.status
      formPriority.value = cur.priority
    }
    editing.value = false
  }

  const taskModalDirty = computed(() => {
    const cur = task.value
    if (!cur || !editing.value || options.trashed()) return false
    return (
      formTitle.value.trim() !== cur.title
      || formDescription.value.trim() !== (cur.description ?? '').trim()
      || formStatus.value !== cur.status
      || formPriority.value !== cur.priority
      || formProjectId.value !== cur.project_id
      || formSectionId.value !== (cur.section_id ?? null)
      || formAssigneeId.value !== (cur.assignee_id ?? 0)
    )
  })

  const taskFooterVisible = computed(() => {
    if (!task.value || loading.value || loadError.value) return false
    if (options.trashed() && options.canManageTrash()) return true
    if (canEdit.value && editing.value && !options.trashed()) return true
    return false
  })

  const showHeaderEditButton = computed(
    () =>
      Boolean(
        task.value
        && canEdit.value
        && !editing.value
        && !options.trashed()
        && !loading.value
        && !loadError.value
        && options.allowInlineEdit(),
      ),
  )

  const showHeaderLinkedNotesButton = computed(
    () =>
      Boolean(
        task.value
        && canEdit.value
        && editing.value
        && !options.trashed()
        && canManageNotes.value
        && !loading.value
        && !loadError.value
        && options.allowInlineEdit(),
      ),
  )

  async function purgeFromTrash() {
    const cur = task.value
    if (!cur) return
    const ok = await confirm({
      title: t('notes.trash.confirmPermanentTitle'),
      message: t('notes.trash.confirmPermanentTask'),
      confirmLabelKey: 'notes.trash.confirmPermanent',
      danger: true,
    })
    if (!ok) return
    purging.value = true
    try {
      await trashTasksStore.permanentDeleteTask(cur.id)
      toast.success(t('notes.trash.taskPurged'))
      close()
      options.onSaved?.()
    } catch {
      toast.error(t('notes.trash.purgeFailed'))
    } finally {
      purging.value = false
    }
  }

  return {
    task,
    loading,
    loadError,
    saving,
    removing,
    restoring,
    purging,
    editing,
    formTitle,
    formDescription,
    formProjectId,
    formSectionId,
    formAssigneeId,
    formStatus,
    formPriority,
    assignableUsers,
    canEdit,
    linkedNotes,
    linkManagerOpen,
    noteSearch,
    linkBusy,
    canManageNotes,
    pickerCandidates,
    taskModalDirty,
    taskFooterVisible,
    showHeaderEditButton,
    showHeaderLinkedNotesButton,
    refreshLinkedNotes,
    save,
    refreshTask,
    linkNoteFromPicker,
    unlinkNote,
    openLinkedNote,
    removeTask,
    restoreFromTrash,
    cancelEdit,
    purgeFromTrash,
    close,
  }
}
