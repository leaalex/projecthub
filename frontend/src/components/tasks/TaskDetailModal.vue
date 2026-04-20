<script setup lang="ts">
import {
  DocumentTextIcon,
  LinkIcon,
  PencilSquareIcon,
} from '@heroicons/vue/24/outline'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '../ui/UiModal.vue'
import Button from '../ui/UiButton.vue'
import Skeleton from '../ui/UiSkeleton.vue'
import UiInput from '../ui/UiInput.vue'
import NoteCard from '../notes/NoteCard.vue'
import TaskForm from './TaskForm.vue'
import TaskSubtasksPanel from './TaskSubtasksPanel.vue'
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
import { formatDate } from '@infra/formatters/date'
import { taskPriorityLabel, taskStatusLabel } from '@infra/i18n/labels'

const { t, locale } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    taskId: number | null
    /** When user opened modal via Edit on the card. */
    initialMode?: 'view' | 'edit'
    /** Загрузка из корзины проекта (GET .../trash/tasks/:id). */
    trashed?: boolean
    /** project_id для корзины; обязателен при `trashed`. */
    trashProjectId?: number | null
    /** Restore / удалить навсегда в корзине (как права на заметки в проекте). */
    canManageTrash?: boolean
  }>(),
  { initialMode: 'view', trashed: false, trashProjectId: null, canManageTrash: true },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
  openNote: [payload: { noteId: number; projectId: number }]
}>()

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
/** Edit form vs read-only dl (only when `canEdit`). */
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
    toast.error(extractNoteAxiosError(e, t('taskDetailModal.linkedNotes.loadFailed')))
  }
}

watch(
  () =>
    [props.modelValue, props.taskId, props.trashed, props.trashProjectId] as const,
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
    editing.value = props.initialMode === 'edit'
    try {
      task.value = await taskStore.fetchOne(id)
      await refreshLinkedNotes()
      await nextTick()
      editing.value = canEdit.value && props.initialMode === 'edit'
      if (!canEdit.value) editing.value = false
    } catch {
      loadError.value = t('taskDetailModal.loadError')
    } finally {
      loading.value = false
    }
  },
)

watch(linkManagerOpen, async open => {
  if (!open || !task.value) return
  noteSearch.value = ''
  try {
    await noteStore.fetchList(task.value.project_id, { quiet: true })
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, t('taskDetailModal.linkedNotes.loadFailed')))
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
    emit('saved')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(
      typeof msg === 'string' ? msg : t('taskDetailModal.toasts.updateFailed'),
    )
    try {
      task.value = await taskStore.fetchOne(cur.id)
    } catch {
      /* keep stale task */
    }
  } finally {
    saving.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}

async function refreshTask() {
  const id = props.taskId
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
    emit('saved')
  } catch (e: unknown) {
    toast.error(
      extractNoteAxiosError(e, t('taskDetailModal.linkedNotes.linkFailed')),
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
    emit('saved')
  } catch (e: unknown) {
    toast.error(
      extractNoteAxiosError(e, t('taskDetailModal.linkedNotes.unlinkFailed')),
    )
  } finally {
    linkBusy.value = false
  }
}

function openLinkedNote(noteId: number) {
  const cur = task.value
  if (!cur) return
  emit('openNote', { noteId, projectId: cur.project_id })
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
    emit('saved')
  } catch {
    toast.error(t('taskDetailModal.toasts.deleteFailed'))
  } finally {
    removing.value = false
  }
}

async function restoreFromTrash() {
  const cur = task.value
  const pid = props.trashProjectId
  if (!cur || pid == null) return
  restoring.value = true
  try {
    await trashTasksStore.restoreTask(pid, cur.id)
    toast.success(t('notes.trash.taskRestored'))
    close()
    emit('saved')
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
  if (!cur || !editing.value || props.trashed) return false
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
  if (props.trashed && props.canManageTrash) return true
  if (canEdit.value && editing.value && !props.trashed) return true
  return false
})

const showHeaderEditButton = computed(
  () =>
    Boolean(
      task.value
      && canEdit.value
      && !editing.value
      && !props.trashed
      && !loading.value
      && !loadError.value,
    ),
)

const showHeaderLinkedNotesButton = computed(
  () =>
    Boolean(
      task.value
      && canEdit.value
      && editing.value
      && !props.trashed
      && canManageNotes.value
      && !loading.value
      && !loadError.value,
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
    emit('saved')
  } catch {
    toast.error(t('notes.trash.purgeFailed'))
  } finally {
    purging.value = false
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="t('taskDetailModal.title')"
    :dirty="taskModalDirty"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <Button
          v-if="showHeaderLinkedNotesButton"
          type="button"
          variant="secondary"
          :disabled="linkBusy"
          :title="t('taskDetailModal.linkedNotes.heading')"
          @click="linkManagerOpen = true"
        >
          <LinkIcon class="h-4 w-4" />
          <span class="ml-1">{{ t('taskDetailModal.linkedNotes.heading') }}</span>
          <span
            v-if="linkedNotes.length"
            class="ml-1 inline-flex min-w-4 items-center justify-center rounded bg-surface-muted px-1 text-[10px] leading-none text-muted"
          >{{ linkedNotes.length }}</span>
        </Button>
        <Button
          v-if="showHeaderEditButton"
          type="button"
          variant="secondary"
          @click="editing = true"
        >
          <PencilSquareIcon class="h-4 w-4" />
          <span class="ml-1">{{ t('common.edit') }}</span>
        </Button>
      </div>
    </template>
    <div v-if="loading" class="space-y-3">
      <Skeleton variant="line" />
      <Skeleton variant="line" :lines="3" />
    </div>
    <p v-else-if="loadError" class="text-sm text-destructive">{{ loadError }}</p>
    <template v-else-if="task">
      <dl
        v-if="!canEdit || !editing || trashed"
        class="space-y-4"
      >
        <div>
          <dt class="text-xs font-medium text-muted">{{ t('taskDetailModal.labels.title') }}</dt>
          <dd class="mt-1 text-sm text-foreground">{{ task.title }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium text-muted">{{
            t('taskDetailModal.labels.description')
          }}</dt>
          <dd class="mt-1 whitespace-pre-wrap text-sm text-foreground">
            {{ task.description || t('common.dash') }}
          </dd>
        </div>
        <div>
          <dt class="text-xs font-medium text-muted">{{
            t('taskDetailModal.labels.subtasks')
          }}</dt>
          <dd class="mt-1">
            <TaskSubtasksPanel :task="task" hide-heading readonly />
          </dd>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-xs font-medium text-muted">{{ t('taskDetailModal.labels.status') }}</dt>
            <dd class="mt-1 text-sm text-foreground">
              {{ taskStatusLabel(t, task.status) }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-muted">{{
              t('taskDetailModal.labels.priority')
            }}</dt>
            <dd class="mt-1 text-sm text-foreground">{{
              taskPriorityLabel(t, task.priority)
            }}</dd>
          </div>
        </div>
        <div>
          <dt class="text-xs font-medium text-muted">{{ t('taskDetailModal.labels.project') }}</dt>
          <dd class="mt-1 text-sm text-foreground">
            {{
              task.project?.name ??
              t('taskCard.meta.projectNum', { n: task.project_id })
            }}
          </dd>
        </div>
        <div>
          <dt class="text-xs font-medium text-muted">{{
            t('taskDetailModal.labels.assignee')
          }}</dt>
          <dd class="mt-1 text-sm text-foreground">
            <template v-if="task.assignee">
              {{ task.assignee.name || task.assignee.email }}
              <span class="text-muted">({{ task.assignee.email }})</span>
            </template>
            <template v-else>{{ t('common.unassigned') }}</template>
          </dd>
        </div>
        <div>
          <dt class="text-xs font-medium text-muted">{{
            t('taskDetailModal.labels.dueDate')
          }}</dt>
          <dd class="mt-1 text-sm text-foreground">
            {{ task.due_date ? formatDate(task.due_date, locale) : t('common.dash') }}
          </dd>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-xs font-medium text-muted">{{
              t('taskDetailModal.labels.created')
            }}</dt>
            <dd class="mt-1 text-sm text-foreground">{{ formatDate(task.created_at, locale) }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-muted">{{
              t('taskDetailModal.labels.updated')
            }}</dt>
            <dd class="mt-1 text-sm text-foreground">{{ formatDate(task.updated_at, locale) }}</dd>
          </div>
        </div>
      </dl>

      <div v-else-if="canEdit && editing && !trashed" class="space-y-4">
        <TaskForm
          v-model:title="formTitle"
          v-model:description="formDescription"
          v-model:project-id="formProjectId"
          v-model:section-id="formSectionId"
          v-model:assignee-id="formAssigneeId"
          v-model:status="formStatus"
          v-model:priority="formPriority"
          form-id="task-detail-edit"
          hide-footer
          :projects="projectStore.projects.map(p => ({ id: p.id, name: p.name }))"
          :sections="projectStore.sections"
          :assignable-users="assignableUsers"
          :submit-label="t('common.save')"
          :loading="saving"
          @submit="save"
        >
          <template #before-extra>
            <TaskSubtasksPanel :task="task" @updated="refreshTask" />
          </template>
        </TaskForm>
      </div>

      <div
        v-if="!trashed && (!editing || !canManageNotes)"
        class="mt-6 border-t border-border pt-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
            <LinkIcon class="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <span class="truncate">{{ t('taskDetailModal.linkedNotes.heading') }}</span>
          </h3>
          <Button
            v-if="canManageNotes"
            type="button"
            variant="secondary"
            :disabled="linkBusy"
            @click="linkManagerOpen = true"
          >
            {{ t('taskDetailModal.linkedNotes.addLink') }}
          </Button>
        </div>
        <div
          class="mt-3 overflow-hidden rounded-lg border border-border bg-surface"
        >
          <div v-if="linkedNotes.length > 0" class="divide-y divide-border">
            <NoteCard
              v-for="n in linkedNotes"
              :key="n.id"
              class="px-3"
              :note="n"
              :can-manage="false"
              @view="openLinkedNote"
            />
          </div>
          <p
            v-else
            class="px-3 py-6 text-center text-xs text-muted"
          >
            {{ t('taskDetailModal.linkedNotes.empty') }}
          </p>
        </div>
      </div>
    </template>
    <template v-if="taskFooterVisible" #footer>
      <div
        v-if="trashed && canManageTrash"
        class="flex flex-wrap justify-end gap-2"
      >
        <Button
          type="button"
          variant="secondary"
          :loading="restoring"
          :disabled="purging"
          @click="restoreFromTrash"
        >
          {{ t('notes.restore') }}
        </Button>
        <Button
          type="button"
          variant="ghost-danger"
          :loading="purging"
          :disabled="restoring"
          @click="purgeFromTrash"
        >
          {{ t('notes.trash.deleteForever') }}
        </Button>
      </div>
      <div
        v-else-if="canEdit && editing && !trashed"
        class="flex flex-wrap items-center gap-2"
      >
        <Button
          variant="ghost-danger"
          type="button"
          :loading="removing"
          :disabled="saving"
          @click="removeTask"
        >
          {{ t('taskDetailModal.buttons.deleteTask') }}
        </Button>
        <div class="ml-auto flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            :disabled="saving || removing"
            @click="cancelEdit"
          >
            {{ t('taskForm.cancel') }}
          </Button>
          <Button
            type="submit"
            form="task-detail-edit"
            :loading="saving"
            :disabled="removing"
          >
            {{ t('common.save') }}
          </Button>
        </div>
      </div>
    </template>
  </Modal>

  <Modal
    v-if="task && !trashed"
    v-model="linkManagerOpen"
    :title="t('taskDetailModal.linkedNotes.pickTitle')"
  >
    <div class="space-y-4">
      <section>
        <h4 class="text-xs font-medium text-muted">{{ t('taskDetailModal.linkedNotes.heading') }}</h4>
        <div
          class="mt-1 overflow-hidden rounded-lg border border-border bg-surface"
        >
          <ul v-if="linkedNotes.length > 0" class="divide-y divide-border">
            <li
              v-for="n in linkedNotes"
              :key="n.id"
              class="flex items-center gap-2.5 px-3 py-2 text-sm"
            >
              <DocumentTextIcon
                class="h-5 w-5 shrink-0 text-muted"
                aria-hidden="true"
              />
              <button
                type="button"
                class="min-w-0 flex-1 truncate text-left font-medium text-foreground transition-colors hover:text-primary"
                @click="openLinkedNote(n.id)"
              >
                {{ n.title }}
              </button>
              <Button
                v-if="canManageNotes"
                type="button"
                variant="ghost-danger"
                class="shrink-0"
                :disabled="linkBusy"
                @click="unlinkNote(n.id)"
              >
                {{ t('notes.linkTask.unlink') }}
              </Button>
            </li>
          </ul>
          <p
            v-else
            class="px-3 py-6 text-center text-xs text-muted"
          >
            {{ t('taskDetailModal.linkedNotes.empty') }}
          </p>
        </div>
      </section>
      <section v-if="canManageNotes">
        <h4 class="text-xs font-medium text-muted">{{ t('taskDetailModal.linkedNotes.addLink') }}</h4>
        <UiInput
          class="mt-1"
          v-model="noteSearch"
          :placeholder="t('notes.linkTask.searchPlaceholder')"
        />
        <ul
          class="mt-2 max-h-56 divide-y divide-border overflow-auto rounded-lg border border-border bg-surface"
        >
          <li
            v-for="n in pickerCandidates"
            :key="n.id"
            class="flex items-center justify-between gap-2 px-3 py-2 text-sm"
          >
            <span class="min-w-0 truncate">{{ n.title }}</span>
            <Button
              type="button"
              variant="secondary"
              :disabled="linkBusy"
              @click="linkNoteFromPicker(n.id)"
            >
              {{ t('notes.linkTask.link') }}
            </Button>
          </li>
          <li
            v-if="pickerCandidates.length === 0"
            class="px-2 py-4 text-center text-xs text-muted"
          >
            {{ t('notes.linkTask.empty') }}
          </li>
        </ul>
      </section>
    </div>
  </Modal>
</template>
