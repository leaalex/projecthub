<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/24/solid'
import {
  InformationCircleIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import { computed, nextTick, ref, watch } from 'vue'
import type { Task, TaskPriority, TaskStatus } from '../../types/task'
import { useTaskStore } from '../../stores/task.store'
import { useConfirm } from '../../composables/useConfirm'
import { useToast } from '../../composables/useToast'
import { timeAgo } from '../../utils/formatters'
import Badge from '../ui/UiBadge.vue'
import UiSelect, { type UiSelectModelValue } from '../ui/UiSelect.vue'

const controlClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60'

/** Compact controls for the inline edit toolbar row */
const rowControlClass =
  'min-h-8 min-w-0 rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60'

const props = withDefaults(
  defineProps<{
    task: Task
    canEdit?: boolean
    projects?: { id: number; name: string }[]
    assignableUsers?: { id: number; email: string; name: string }[]
  }>(),
  {
    canEdit: false,
    projects: () => [],
    assignableUsers: () => [],
  },
)

const emit = defineEmits<{
  complete: [id: number]
  reopen: [id: number]
  info: [id: number]
  updated: []
}>()

const taskStore = useTaskStore()
const toast = useToast()
const { confirm } = useConfirm()

const expanded = ref(false)
const busy = ref(false)
const deleting = ref(false)

const draftTitle = ref('')
const draftDescription = ref('')
const draftStatus = ref<TaskStatus>('todo')
const draftPriority = ref<TaskPriority>('medium')
const draftProjectId = ref(0)
const draftDue = ref('')
const draftAssigneeId = ref<number | ''>('')

const titleInput = ref<HTMLInputElement | null>(null)

/** Исполнитель в правой колонке (колонка скрыта при развёрнутом редактировании). */
const assigneeLabel = computed(() => {
  if (props.task.assignee) {
    return props.task.assignee.name || props.task.assignee.email
  }
  return 'Unassigned'
})

const assigneeTitle = computed(() => {
  const a = props.task.assignee
  if (!a?.email) return undefined
  return a.name ? `${a.name} (${a.email})` : a.email
})

const isAssigneePlaceholder = computed(() => assigneeLabel.value === 'Unassigned')

function dueFromTask(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function syncDraftsFromTask() {
  const t = props.task
  draftTitle.value = t.title
  draftDescription.value = t.description ?? ''
  draftStatus.value = t.status
  draftPriority.value = t.priority
  draftProjectId.value = t.project_id
  draftDue.value = dueFromTask(t.due_date)
  draftAssigneeId.value = t.assignee_id ?? ''
}

watch(
  () => props.task,
  () => {
    if (!expanded.value) syncDraftsFromTask()
  },
  { deep: true },
)

function openExpanded() {
  if (!props.canEdit) return
  syncDraftsFromTask()
  expanded.value = true
  nextTick(() => titleInput.value?.focus())
}

function onBodyClick() {
  if (!props.canEdit || expanded.value) return
  openExpanded()
}

/** Закрыть без сохранения. */
function collapseExpanded() {
  expanded.value = false
  syncDraftsFromTask()
}

async function requestDelete() {
  if (!props.canEdit || deleting.value) return
  const t = props.task
  const ok = await confirm({
    title: 'Delete task',
    message: `Remove “${t.title}”? This cannot be undone.`,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  deleting.value = true
  try {
    await taskStore.remove(t.id)
    toast.success('Task deleted')
    collapseExpanded()
    emit('updated')
  } catch {
    toast.error('Could not delete task')
  } finally {
    deleting.value = false
  }
}

function onInlineEscape(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  e.preventDefault()
  collapseExpanded()
}

/** Сохранить изменения одной кнопкой Done. */
async function saveAndCollapse() {
  const t = props.task
  const title = draftTitle.value.trim()
  if (!title) {
    toast.error('Enter a task title')
    return
  }

  const desc = draftDescription.value.trim()
  const descPrev = (t.description ?? '').trim()
  const pid = Number(draftProjectId.value)
  const due = draftDue.value.trim()
  const duePrev = dueFromTask(t.due_date)
  const rawAssignee = draftAssigneeId.value
  const nextAssignee = rawAssignee === '' ? 0 : Number(rawAssignee)
  const prevAssignee = t.assignee_id ?? 0

  const patch: Partial<{
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    project_id: number
    due_date: string
  }> = {}

  if (title !== t.title) patch.title = title
  if (desc !== descPrev) patch.description = desc
  if (draftStatus.value !== t.status) patch.status = draftStatus.value
  if (draftPriority.value !== t.priority) patch.priority = draftPriority.value
  if (pid && pid !== t.project_id) patch.project_id = pid
  if (due !== duePrev) patch.due_date = due

  const assigneeChanged = nextAssignee !== prevAssignee
  const hasPatch = Object.keys(patch).length > 0

  if (!hasPatch && !assigneeChanged) {
    expanded.value = false
    syncDraftsFromTask()
    return
  }

  busy.value = true
  try {
    if (hasPatch) {
      await taskStore.update(t.id, patch)
    }
    if (assigneeChanged) {
      await taskStore.assign(t.id, nextAssignee)
    }
    emit('updated')
    expanded.value = false
    syncDraftsFromTask()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : 'Could not update task')
    syncDraftsFromTask()
  } finally {
    busy.value = false
  }
}

function onTitleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
  }
  onInlineEscape(e)
}

const showProjectPicker = () => props.projects.length > 0
const showAssigneePicker = () => props.assignableUsers.length > 0

const STATUS_OPTIONS = [
  { value: 'todo' as const, label: 'To do' },
  { value: 'in_progress' as const, label: 'In progress' },
  { value: 'review' as const, label: 'Review' },
  { value: 'done' as const, label: 'Done' },
]

const PRIORITY_OPTIONS = [
  { value: 'low' as const, label: 'Low' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'high' as const, label: 'High' },
  { value: 'critical' as const, label: 'Critical' },
]

const projectSelectOptions = computed(() =>
  props.projects.map((p) => ({ value: p.id, label: p.name })),
)

const assigneeSelectOptions = computed(() => [
  { value: '', label: 'Unassigned' },
  ...props.assignableUsers.map((u) => ({
    value: u.id,
    label: u.name || u.email,
  })),
])

function setDraftAssignee(v: UiSelectModelValue) {
  if (Array.isArray(v)) return
  draftAssigneeId.value = v === '' ? '' : Number(v)
}
</script>

<template>
  <div class="flex items-stretch gap-2.5 py-2">
    <div class="flex shrink-0 flex-col self-start pt-0.5">
      <button
        v-if="task.status !== 'done'"
        type="button"
        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/45 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Mark done"
        @click.stop="emit('complete', task.id)"
      />
      <button
        v-else
        type="button"
        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-emerald-500"
        aria-label="Mark as not done"
        @click.stop="emit('reopen', task.id)"
      >
        <CheckIcon class="h-3 w-3 text-white" aria-hidden="true" />
      </button>
    </div>

    <div
      class="min-w-0 flex-1"
      :class="canEdit && !expanded && 'cursor-pointer rounded-md transition-colors hover:bg-surface-muted/60'"
      @click="onBodyClick"
    >
      <template v-if="!expanded">
        <div class="flex items-center gap-2">
          <h3
            class="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
            :class="task.status === 'done' && 'text-muted line-through'"
          >
            {{ task.title }}
          </h3>
          <div class="flex shrink-0 items-center gap-1" @click.stop>
            <Badge kind="status" :value="task.status" />
            <Badge kind="priority" :value="task.priority" />
          </div>
        </div>
        <p
          v-if="task.description"
          class="mt-1 line-clamp-1 text-xs text-muted"
        >
          {{ task.description }}
        </p>
        <div
          class="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0 text-xs text-muted"
        >
          <span class="shrink-0">{{
            task.project?.name ?? `Project #${task.project_id}`
          }}</span>
          <span class="shrink-0">·</span>
          <span class="shrink-0">Updated {{ timeAgo(task.updated_at) }}</span>
          <template v-if="task.due_date">
            <span class="shrink-0">·</span>
            <span class="shrink-0">Due {{ dueFromTask(task.due_date) }}</span>
          </template>
        </div>
      </template>

      <div
        v-else
        class="space-y-2 rounded-md border border-border bg-surface-muted/30 p-2"
        @click.stop
      >
        <div class="flex items-center gap-1.5">
          <input
            ref="titleInput"
            v-model="draftTitle"
            type="text"
            placeholder="Title"
            :class="controlClass"
            class="min-w-0 flex-1 py-1.5 text-sm font-medium"
            :disabled="busy"
            @keydown="onTitleKeydown"
          />
        </div>

        <textarea
          v-model="draftDescription"
          rows="2"
          placeholder="Description (optional)"
          :class="controlClass"
          class="py-1.5 text-sm leading-snug"
          :disabled="busy"
          @keydown="onInlineEscape"
        />

        <div
          class="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            class="min-w-[6.25rem] shrink-0 sm:min-w-0 sm:flex-1"
          >
            <UiSelect
              :model-value="draftStatus"
              size="sm"
              :block="false"
              class="w-full min-w-0"
              placeholder="Status"
              :options="STATUS_OPTIONS"
              :disabled="busy"
              @update:model-value="(v) => (draftStatus = v as TaskStatus)"
              @escape="collapseExpanded"
            />
          </div>
          <div
            class="min-w-[5.5rem] shrink-0 sm:min-w-0 sm:flex-1"
          >
            <UiSelect
              :model-value="draftPriority"
              size="sm"
              :block="false"
              class="w-full min-w-0"
              placeholder="Priority"
              :options="PRIORITY_OPTIONS"
              :disabled="busy"
              @update:model-value="(v) => (draftPriority = v as TaskPriority)"
              @escape="collapseExpanded"
            />
          </div>
          <div
            v-if="showProjectPicker()"
            class="min-w-[5rem] max-w-[9rem] shrink-0 sm:max-w-none sm:flex-1 sm:min-w-0"
          >
            <UiSelect
              :model-value="draftProjectId"
              size="sm"
              :block="false"
              class="w-full min-w-0"
              placeholder="Project"
              :options="projectSelectOptions"
              :disabled="busy"
              @update:model-value="(v) => (draftProjectId = Number(v))"
              @escape="collapseExpanded"
            />
          </div>
          <div
            v-if="showAssigneePicker()"
            class="min-w-[6rem] max-w-[10rem] shrink-0 sm:max-w-none sm:flex-1 sm:min-w-0"
          >
            <UiSelect
              :model-value="draftAssigneeId === '' ? '' : draftAssigneeId"
              size="sm"
              :block="false"
              class="w-full min-w-0"
              placeholder="Assignee"
              :options="assigneeSelectOptions"
              :disabled="busy"
              @update:model-value="setDraftAssignee"
              @escape="collapseExpanded"
            />
          </div>
          <span
            v-else
            class="inline-flex min-h-8 min-w-[6rem] max-w-[10rem] shrink-0 items-center truncate rounded-md border border-dashed border-border/70 bg-surface/50 px-2 text-xs text-muted"
            :title="
              task.assignee
                ? task.assignee.name || task.assignee.email
                : 'Unassigned'
            "
          >
            {{
              task.assignee
                ? task.assignee.name || task.assignee.email
                : 'No assignee'
            }}
          </span>
          <input
            v-model="draftDue"
            type="date"
            aria-label="Due date"
            :class="rowControlClass"
            class="w-auto min-w-[9.25rem] shrink-0 sm:flex-1 sm:min-w-[9.25rem]"
            :disabled="busy"
            @keydown="onInlineEscape"
          />
        </div>
        <div
          class="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2"
        >
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted disabled:opacity-50"
              :disabled="busy"
              @click="collapseExpanded"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              :disabled="busy"
              @click="saveAndCollapse"
            >
              Save
            </button>
          </div>
          <button
            type="button"
            class="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
            :disabled="busy || deleting"
            @click="requestDelete"
          >
            Delete task
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="!expanded"
      class="flex shrink-0 flex-row items-stretch self-stretch"
    >
      <div
        class="flex w-40 shrink-0 flex-col justify-center overflow-hidden border-l border-border/50 px-2"
        :title="assigneeTitle"
      >
        <span
          class="min-w-0 truncate text-xs leading-tight"
          :class="isAssigneePlaceholder ? 'text-muted' : 'text-foreground'"
        >
          {{ assigneeLabel }}
        </span>
      </div>
      <div
        class="flex shrink-0 flex-row items-center justify-center gap-0.5 self-stretch border-l border-border/50 pl-2"
        @click.stop
      >
        <button
          type="button"
          class="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Task details"
          @click="emit('info', task.id)"
        >
          <InformationCircleIcon class="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          v-if="canEdit"
          type="button"
          class="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          aria-label="Delete task"
          :disabled="deleting"
          @click="requestDelete"
        >
          <TrashIcon class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>
