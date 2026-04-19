<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '../ui/UiModal.vue'
import Button from '../ui/UiButton.vue'
import Skeleton from '../ui/UiSkeleton.vue'
import UiInput from '../ui/UiInput.vue'
import TaskForm from './TaskForm.vue'
import TaskSubtasksPanel from './TaskSubtasksPanel.vue'
import { useTaskStore } from '@app/task.store'
import { useAuthStore } from '@app/auth.store'
import { useProjectStore } from '@app/project.store'
import { useNoteStore, extractNoteAxiosError } from '@app/note.store'
import { useCanEditTask } from '@app/composables/useCanEditTask'
import { useConfirm } from '@app/composables/useConfirm'
import { useToast } from '@app/composables/useToast'
import type { Note } from '@domain/note/types'
import type { Task, TaskPriority, TaskStatus } from '@domain/task/types'
import { canManageNote } from '@domain/note/permissions'
import { formatDate } from '@infra/formatters/date'
import { taskPriorityLabel, taskStatusLabel } from '@infra/i18n/labels'

const { t, locale } = useI18n()

const props = defineProps<{
  modelValue: boolean
  taskId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
  openNote: [payload: { noteId: number; projectId: number }]
}>()

const taskStore = useTaskStore()
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

const formTitle = ref('')
const formDescription = ref('')
const formProjectId = ref(0)
const formStatus = ref<TaskStatus>('todo')
const formPriority = ref<TaskPriority>('medium')

const canEdit = useCanEditTask(() => task.value)

const linkedNotes = ref<Note[]>([])
const linkPickerOpen = ref(false)
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
  () => [props.modelValue, props.taskId] as const,
  async ([open, id]) => {
    if (!open || id == null) {
      task.value = null
      loadError.value = null
      linkedNotes.value = []
      return
    }
    loading.value = true
    loadError.value = null
    task.value = null
    try {
      task.value = await taskStore.fetchOne(id)
      await refreshLinkedNotes()
    } catch {
      loadError.value = t('taskDetailModal.loadError')
    } finally {
      loading.value = false
    }
  },
)

watch(linkPickerOpen, async open => {
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
    formStatus.value = cur.status
    formPriority.value = cur.priority
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
    const updated = await taskStore.update(cur.id, {
      title: trimmedTitle,
      description: formDescription.value.trim(),
      status: formStatus.value,
      priority: formPriority.value,
    })
    task.value = updated
    toast.success(t('taskDetailModal.toasts.updated'))
    emit('saved')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(
      typeof msg === 'string' ? msg : t('taskDetailModal.toasts.updateFailed'),
    )
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
    linkPickerOpen.value = false
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
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="t('taskDetailModal.title')"
    wide
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="loading" class="space-y-3">
      <Skeleton variant="line" />
      <Skeleton variant="line" :lines="3" />
    </div>
    <p v-else-if="loadError" class="text-sm text-destructive">{{ loadError }}</p>
    <template v-else-if="task">
      <dl
        v-if="!canEdit"
        class="space-y-4 text-sm"
      >
        <div>
          <dt class="font-medium text-muted">{{ t('taskDetailModal.labels.title') }}</dt>
          <dd class="mt-1 text-foreground">{{ task.title }}</dd>
        </div>
        <div>
          <dt class="font-medium text-muted">{{
            t('taskDetailModal.labels.description')
          }}</dt>
          <dd class="mt-1 whitespace-pre-wrap text-foreground">
            {{ task.description || t('common.dash') }}
          </dd>
        </div>
        <div>
          <dt class="font-medium text-muted">{{
            t('taskDetailModal.labels.subtasks')
          }}</dt>
          <dd class="mt-1">
            <TaskSubtasksPanel :task="task" hide-heading readonly />
          </dd>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="font-medium text-muted">{{ t('taskDetailModal.labels.status') }}</dt>
            <dd class="mt-1 text-foreground">
              {{ taskStatusLabel(t, task.status) }}
            </dd>
          </div>
          <div>
            <dt class="font-medium text-muted">{{
              t('taskDetailModal.labels.priority')
            }}</dt>
            <dd class="mt-1 text-foreground">{{
              taskPriorityLabel(t, task.priority)
            }}</dd>
          </div>
        </div>
        <div>
          <dt class="font-medium text-muted">{{ t('taskDetailModal.labels.project') }}</dt>
          <dd class="mt-1 text-foreground">
            {{
              task.project?.name ??
              t('taskCard.meta.projectNum', { n: task.project_id })
            }}
          </dd>
        </div>
        <div>
          <dt class="font-medium text-muted">{{
            t('taskDetailModal.labels.assignee')
          }}</dt>
          <dd class="mt-1 text-foreground">
            <template v-if="task.assignee">
              {{ task.assignee.name || task.assignee.email }}
              <span class="text-muted">({{ task.assignee.email }})</span>
            </template>
            <template v-else>{{ t('common.unassigned') }}</template>
          </dd>
        </div>
        <div>
          <dt class="font-medium text-muted">{{
            t('taskDetailModal.labels.dueDate')
          }}</dt>
          <dd class="mt-1 text-foreground">
            {{ task.due_date ? formatDate(task.due_date, locale) : t('common.dash') }}
          </dd>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="font-medium text-muted">{{
              t('taskDetailModal.labels.created')
            }}</dt>
            <dd class="mt-1 text-foreground">{{ formatDate(task.created_at, locale) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-muted">{{
              t('taskDetailModal.labels.updated')
            }}</dt>
            <dd class="mt-1 text-foreground">{{ formatDate(task.updated_at, locale) }}</dd>
          </div>
        </div>
      </dl>

      <div v-else class="space-y-4">
        <div class="rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-sm">
          <div class="text-muted">{{ t('taskDetailModal.labels.project') }}</div>
          <div class="font-medium text-foreground">
            {{
              task.project?.name ??
              t('taskCard.meta.projectNum', { n: task.project_id })
            }}
          </div>
          <div class="mt-2 text-muted">{{ t('taskDetailModal.labels.assignee') }}</div>
          <div class="text-foreground">
            <template v-if="task.assignee">
              {{ task.assignee.name || task.assignee.email }}
              <span class="text-muted">({{ task.assignee.email }})</span>
            </template>
            <template v-else>{{ t('common.unassigned') }}</template>
          </div>
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>{{
              t('taskDetailModal.meta.created', {
                date: formatDate(task.created_at, locale),
              })
            }}</span>
            <span>{{
              t('taskDetailModal.meta.updated', {
                date: formatDate(task.updated_at, locale),
              })
            }}</span>
            <span v-if="task.due_date">{{
              t('taskDetailModal.meta.due', {
                date: formatDate(task.due_date, locale),
              })
            }}</span>
          </div>
        </div>

        <TaskForm
          v-model:title="formTitle"
          v-model:description="formDescription"
          v-model:project-id="formProjectId"
          v-model:status="formStatus"
          v-model:priority="formPriority"
          hide-project-select
          :submit-label="t('common.save')"
          :loading="saving"
          @submit="save"
          @cancel="close"
        >
          <template #actions-start>
            <Button
              variant="ghost-danger"
              type="button"
              :loading="removing"
              :disabled="saving"
              @click="removeTask"
            >
              {{ t('taskDetailModal.buttons.deleteTask') }}
            </Button>
          </template>
        </TaskForm>
        <TaskSubtasksPanel :task="task" @updated="refreshTask" />
      </div>

      <div class="mt-6 border-t border-border pt-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-semibold text-foreground">
            {{ t('taskDetailModal.linkedNotes.heading') }}
          </h3>
          <Button
            v-if="canManageNotes"
            type="button"
            variant="secondary"
            :disabled="linkBusy"
            @click="linkPickerOpen = true"
          >
            {{ t('taskDetailModal.linkedNotes.addLink') }}
          </Button>
        </div>
        <ul class="mt-2 space-y-1">
          <li
            v-for="n in linkedNotes"
            :key="n.id"
            class="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <button
              type="button"
              class="min-w-0 truncate text-left font-medium text-primary underline"
              @click="openLinkedNote(n.id)"
            >
              {{ n.title }}
            </button>
            <Button
              v-if="canManageNotes"
              type="button"
              variant="ghost-danger"
              :disabled="linkBusy"
              @click="unlinkNote(n.id)"
            >
              {{ t('notes.linkTask.unlink') }}
            </Button>
          </li>
          <li
            v-if="linkedNotes.length === 0"
            class="text-xs text-muted"
          >
            {{ t('taskDetailModal.linkedNotes.empty') }}
          </li>
        </ul>
        <Modal
          v-model="linkPickerOpen"
          :title="t('taskDetailModal.linkedNotes.pickTitle')"
        >
          <UiInput
            v-model="noteSearch"
            :placeholder="t('notes.linkTask.searchPlaceholder')"
          />
          <ul
            class="mt-2 max-h-56 divide-y divide-border overflow-auto rounded-md border border-border"
          >
            <li
              v-for="n in filteredNotesForPicker"
              :key="n.id"
              class="flex items-center justify-between gap-2 px-2 py-1.5 text-sm"
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
              v-if="filteredNotesForPicker.length === 0"
              class="px-2 py-4 text-center text-xs text-muted"
            >
              {{ t('notes.linkTask.empty') }}
            </li>
          </ul>
        </Modal>
      </div>
    </template>
  </Modal>
</template>
