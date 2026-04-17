<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/24/solid'
import {
  BoltIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  InformationCircleIcon,
  RectangleStackIcon,
  TagIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/vue/24/outline'
import { computed, nextTick, ref, watch } from 'vue'
import type { Task, TaskPriority, TaskStatus } from '../../types/task'
import { useAuthStore } from '../../stores/auth.store'
import { useTaskStore } from '../../stores/task.store'
import { useConfirm } from '../../composables/useConfirm'
import { useToast } from '../../composables/useToast'
import { timeAgo } from '../../utils/formatters'
import Badge from '../ui/UiBadge.vue'
import Button from '../ui/UiButton.vue'
import UiDateMenuButton from '../ui/UiDateMenuButton.vue'
import UiInput from '../ui/UiInput.vue'
import UiMenuButton from '../ui/UiMenuButton.vue'
import UiTextarea from '../ui/UiTextarea.vue'
import TaskSubtasksPanel from './TaskSubtasksPanel.vue'

const props = withDefaults(
  defineProps<{
    task: Task
    canEdit?: boolean
    /** When false but canChangeStatus is true, only status can be edited in expanded mode. */
    canChangeStatus?: boolean
    projects?: { id: number; name: string }[]
    assignableUsers?: { id: number; email: string; name: string }[]
  }>(),
  {
    canEdit: false,
    canChangeStatus: undefined,
    projects: () => [],
    assignableUsers: () => [],
  },
)

const canChangeStatusEff = computed(
  () => props.canChangeStatus ?? props.canEdit,
)

const emit = defineEmits<{
  complete: [id: number]
  reopen: [id: number]
  info: [id: number]
  updated: []
  /** Inline editor open/closed; parent may disable drag while expanded. */
  expandedChange: [expanded: boolean]
}>()

const authStore = useAuthStore()
const taskStore = useTaskStore()
const toast = useToast()
const { confirm } = useConfirm()

const expanded = ref(false)
/** Collapsed row: show subtasks list without opening full editor. */
const subtasksExpanded = ref(false)
const busy = ref(false)
const deleting = ref(false)
/** Quick assignee change from collapsed row (UiMenuButton); avoids opening expanded editor. */
const assigningQuick = ref(false)

const draftTitle = ref('')
const draftDescription = ref('')
const draftStatus = ref<TaskStatus>('todo')
const draftPriority = ref<TaskPriority>('medium')
const draftProjectId = ref(0)
const draftDue = ref('')
const draftAssigneeId = ref<number | ''>('')

const titleInputRef = ref<{ focus: () => void } | null>(null)
/** Full subtasks editor in expanded card: hidden until + or when task already has subtasks. */
const subtasksBlockVisible = ref(false)
const subtasksPanelRef = ref<{ focusNewInput: () => void } | null>(null)

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

const subtaskSummary = computed(() => {
  const list = props.task.subtasks ?? []
  if (list.length === 0) return null
  const done = list.filter((s) => s.done).length
  return `${done}/${list.length}`
})

const hasSubtasks = computed(() => (props.task.subtasks?.length ?? 0) > 0)

/** Owner can toggle; assignee can toggle (matches API). */
const canToggleSubtasks = computed(() => {
  if (props.canEdit) return true
  const uid = authStore.user?.id
  return uid != null && props.task.assignee_id === uid
})

watch(expanded, (v) => {
  emit('expandedChange', v)
  if (v) {
    subtasksExpanded.value = false
    subtasksBlockVisible.value = (props.task.subtasks?.length ?? 0) > 0
  }
})

function dueFromTask(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

/** Stable numeric id for menus; API/JSON may use string or number. */
function normalizeAssigneeId(raw: unknown): number {
  if (raw === null || raw === undefined || raw === '') return 0
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Prefer assignee_id; fall back to nested assignee.id if IDs were ever out of sync. */
function effectiveAssigneeId(t: Task): number {
  const fromField = normalizeAssigneeId(t.assignee_id)
  if (fromField > 0) return fromField
  return normalizeAssigneeId(t.assignee?.id)
}

function syncDraftsFromTask() {
  const t = props.task
  draftTitle.value = t.title
  draftDescription.value = t.description ?? ''
  draftStatus.value = t.status
  draftPriority.value = t.priority
  draftProjectId.value = t.project_id
  draftDue.value = dueFromTask(t.due_date)
  const eid = effectiveAssigneeId(t)
  draftAssigneeId.value = eid > 0 ? eid : ''
}

watch(
  () => props.task,
  () => {
    if (!expanded.value) syncDraftsFromTask()
  },
  { deep: true },
)

function openExpanded() {
  if (!props.canEdit && !canChangeStatusEff.value) return
  syncDraftsFromTask()
  expanded.value = true
  subtasksBlockVisible.value =
    props.canEdit && (props.task.subtasks?.length ?? 0) > 0
  if (props.canEdit) {
    nextTick(() => titleInputRef.value?.focus())
  }
}

function revealSubtasksAndFocus() {
  subtasksBlockVisible.value = true
  nextTick(() => subtasksPanelRef.value?.focusNewInput())
}

function onBodyClick() {
  if (expanded.value) return
  if (props.canEdit || canChangeStatusEff.value) {
    openExpanded()
    return
  }
  // Viewers (and others without inline edit): open task detail modal.
  emit('info', props.task.id)
}

/** Закрыть без сохранения. */
function collapseExpanded() {
  expanded.value = false
  syncDraftsFromTask()
}

async function saveStatusOnly() {
  const t = props.task
  if (draftStatus.value === t.status) {
    collapseExpanded()
    return
  }
  busy.value = true
  try {
    await taskStore.update(t.id, { status: draftStatus.value })
    emit('updated')
    collapseExpanded()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : 'Could not update status')
    syncDraftsFromTask()
  } finally {
    busy.value = false
  }
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
  const nextAssignee =
    rawAssignee === '' ? 0 : normalizeAssigneeId(rawAssignee)
  const prevAssignee = effectiveAssigneeId(t)

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
const showAssigneePicker = () =>
  props.canEdit &&
  (props.assignableUsers.length > 0 || effectiveAssigneeId(props.task) > 0)

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

const assigneeSelectOptions = computed(() => {
  const users = props.assignableUsers.map((u) => ({
    value: normalizeAssigneeId(u.id),
    label: u.name || u.email,
  }))
  const ids = new Set(
    users.map((o) => normalizeAssigneeId(o.value)).filter((id) => id > 0),
  )
  const aid = effectiveAssigneeId(props.task)
  const extra: { value: number; label: string }[] = []
  if (aid > 0 && !ids.has(aid) && props.task.assignee) {
    const a = props.task.assignee
    extra.push({ value: aid, label: a.name || a.email })
  }
  return [{ value: '', label: 'Unassigned' }, ...extra, ...users]
})

/** Matches option `value` types so UiMenuButton selection/highlight works. */
const collapsedAssigneeMenuValue = computed(() => {
  const n = effectiveAssigneeId(props.task)
  return n > 0 ? n : ''
})

const draftStatusMenuLabel = computed(
  () => STATUS_OPTIONS.find((o) => o.value === draftStatus.value)?.label ?? '',
)
const draftPriorityMenuLabel = computed(
  () => PRIORITY_OPTIONS.find((o) => o.value === draftPriority.value)?.label ?? '',
)
const draftProjectMenuLabel = computed(
  () =>
    projectSelectOptions.value.find((o) => o.value === draftProjectId.value)
      ?.label ?? '',
)
const draftAssigneeMenuLabel = computed(() => {
  const v = draftAssigneeId.value
  const key: string | number = v === '' ? '' : v
  return (
    assigneeSelectOptions.value.find((o) => o.value === key)?.label ?? ''
  )
})

function setDraftAssigneeFromMenu(v: string | number) {
  draftAssigneeId.value = v === '' ? '' : Number(v)
}

async function onAssigneeMenuSelect(v: string | number) {
  if (!props.canEdit || assigningQuick.value) return
  const next =
    v === '' || v === null || v === undefined
      ? 0
      : normalizeAssigneeId(v)
  if (v !== '' && v !== null && v !== undefined && next === 0) {
    toast.error('Invalid assignee')
    return
  }
  const prev = effectiveAssigneeId(props.task)
  if (next === prev) return
  assigningQuick.value = true
  try {
    await taskStore.assign(props.task.id, next)
    emit('updated')
    toast.success('Assignee updated')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : 'Could not update assignee')
  } finally {
    assigningQuick.value = false
  }
}
</script>

<template>
  <div class="flex items-stretch gap-2.5 py-2">
    <div class="flex shrink-0 flex-col self-start pt-0.5">
      <button
        v-if="task.status !== 'done'"
        type="button"
        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/45 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      :class="
        !expanded &&
          'cursor-pointer rounded-md transition-colors hover:bg-surface-muted/60'
      "
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
        <button
          v-if="hasSubtasks && subtaskSummary"
          type="button"
          class="mt-1 flex w-full min-w-0 items-center gap-1 rounded-md py-0.5 text-left text-xs text-muted transition-colors hover:bg-surface-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :aria-expanded="subtasksExpanded"
          :aria-controls="`task-subtasks-${task.id}`"
          @click.stop="subtasksExpanded = !subtasksExpanded"
        >
          <ChevronRightIcon
            v-if="!subtasksExpanded"
            class="h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
          <ChevronDownIcon
            v-else
            class="h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
          <span class="min-w-0">
            Subtasks
            <span class="font-medium text-foreground">{{ subtaskSummary }}</span>
          </span>
        </button>
        <div
          v-if="subtasksExpanded && hasSubtasks"
          :id="`task-subtasks-${task.id}`"
          class="mt-1.5"
          @click.stop
        >
          <TaskSubtasksPanel
            :task="task"
            compact
            hide-heading
            :allow-toggle="canToggleSubtasks"
            :allow-rename="canEdit"
            @updated="emit('updated')"
          />
        </div>
      </template>

      <div
        v-else-if="canEdit"
        class="space-y-2 rounded-md border border-border bg-surface-muted/30 p-2"
        @click.stop
      >
        <div class="min-w-0 flex-1">
          <UiInput
            ref="titleInputRef"
            v-model="draftTitle"
            placeholder="Title"
            class="font-medium"
            :disabled="busy"
            @keydown="onTitleKeydown"
          />
        </div>

        <UiTextarea
          v-model="draftDescription"
          :rows="2"
          placeholder="Description (optional)"
          :disabled="busy"
          @keydown="onInlineEscape"
        />

        <div
          v-if="subtasksBlockVisible"
          class="mt-2"
        >
          <TaskSubtasksPanel
            ref="subtasksPanelRef"
            :task="task"
            @updated="emit('updated')"
          />
        </div>

        <div
          class="flex w-full min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          :class="
            subtasksBlockVisible && 'border-t border-border pt-2'
          "
        >
          <div class="flex shrink-0 items-center gap-1.5">
            <div class="flex shrink-0 items-center">
              <UiMenuButton
                v-model="draftStatus"
                :summary="draftStatusMenuLabel"
                :ariaLabel="`Status: ${draftStatusMenuLabel}`"
                :title="`Status: ${draftStatusMenuLabel}`"
                :options="STATUS_OPTIONS"
                :disabled="busy"
                @escape="collapseExpanded"
              >
                <TagIcon class="h-5 w-5" aria-hidden="true" />
              </UiMenuButton>
            </div>
            <div class="flex shrink-0 items-center">
              <UiMenuButton
                v-model="draftPriority"
                :summary="draftPriorityMenuLabel"
                :ariaLabel="`Priority: ${draftPriorityMenuLabel}`"
                :title="`Priority: ${draftPriorityMenuLabel}`"
                :options="PRIORITY_OPTIONS"
                :disabled="busy"
                @escape="collapseExpanded"
              >
                <BoltIcon class="h-5 w-5" aria-hidden="true" />
              </UiMenuButton>
            </div>
            <div
              v-if="showProjectPicker()"
              class="flex shrink-0 items-center"
            >
              <UiMenuButton
                v-model="draftProjectId"
                :summary="draftProjectMenuLabel"
                :ariaLabel="`Project: ${draftProjectMenuLabel}`"
                :title="`Project: ${draftProjectMenuLabel}`"
                :options="projectSelectOptions"
                :disabled="busy"
                @escape="collapseExpanded"
              >
                <FolderIcon class="h-5 w-5" aria-hidden="true" />
              </UiMenuButton>
            </div>
          </div>

          <div
            class="ml-auto flex shrink-0 items-center gap-1.5"
          >
            <div
              v-if="showAssigneePicker()"
              class="flex shrink-0 items-center"
            >
              <UiMenuButton
                :model-value="draftAssigneeId === '' ? '' : draftAssigneeId"
                :summary="
                  draftAssigneeId === '' ? '' : draftAssigneeMenuLabel
                "
                :show-clear="draftAssigneeId !== ''"
                clear-aria-label="Remove assignee"
                :ariaLabel="`Assignee: ${draftAssigneeMenuLabel}`"
                :title="`Assignee: ${draftAssigneeMenuLabel}`"
                :options="assigneeSelectOptions"
                :disabled="busy"
                @update:model-value="setDraftAssigneeFromMenu"
                @clear="draftAssigneeId = ''"
                @escape="collapseExpanded"
              >
                <UserPlusIcon class="h-5 w-5" aria-hidden="true" />
              </UiMenuButton>
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
            <div class="flex shrink-0 items-center">
              <UiDateMenuButton
                v-model="draftDue"
                :ariaLabel="
                  draftDue.trim()
                    ? `Due date ${draftDue.slice(0, 10)}`
                    : 'Due date'
                "
                :disabled="busy"
                @escape="collapseExpanded"
              />
            </div>
            <div
              v-if="!hasSubtasks && !subtasksBlockVisible"
              class="flex shrink-0 items-center"
            >
              <button
                type="button"
                class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                aria-label="Add subtask"
                title="Add subtask"
                :disabled="busy"
                @click.stop="revealSubtasksAndFocus"
              >
                <RectangleStackIcon class="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div
          class="flex flex-wrap items-center gap-2 border-t border-border pt-2"
        >
          <Button
            variant="ghost-danger"
            type="button"
            :disabled="busy || deleting"
            @click="requestDelete"
          >
            Delete task
          </Button>
          <div class="ml-auto flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              :disabled="busy"
              @click="collapseExpanded"
            >
              Cancel
            </Button>
            <Button type="button" :disabled="busy" @click="saveAndCollapse">
              Save
            </Button>
          </div>
        </div>
      </div>

      <div
        v-else
        class="space-y-3 rounded-md border border-border bg-surface-muted/30 p-2"
        @click.stop
      >
        <p class="text-sm font-medium text-foreground">{{ task.title }}</p>
        <div class="flex shrink-0 items-center gap-2">
          <UiMenuButton
            v-model="draftStatus"
            :summary="draftStatusMenuLabel"
            :ariaLabel="`Status: ${draftStatusMenuLabel}`"
            :title="`Status: ${draftStatusMenuLabel}`"
            :options="STATUS_OPTIONS"
            :disabled="busy"
            @escape="collapseExpanded"
          >
            <TagIcon class="h-5 w-5" aria-hidden="true" />
          </UiMenuButton>
        </div>
        <div class="flex flex-wrap justify-end gap-2 border-t border-border pt-2">
          <Button
            type="button"
            variant="secondary"
            :disabled="busy"
            @click="collapseExpanded"
          >
            Cancel
          </Button>
          <Button type="button" :disabled="busy" @click="saveStatusOnly">
            Save
          </Button>
        </div>
      </div>
    </div>

    <div
      v-if="!expanded"
      class="flex shrink-0 flex-row items-stretch self-stretch"
    >
      <div
        class="flex w-44 min-w-0 shrink-0 flex-col justify-center overflow-visible border-l border-border/50 px-2"
        :title="assigneeTitle"
        @click.stop
      >
        <div class="flex min-w-0 items-center gap-1">
          <span
            class="min-w-0 flex-1 truncate text-xs leading-tight"
            :class="isAssigneePlaceholder ? 'text-muted' : 'text-foreground'"
          >
            {{ assigneeLabel }}
          </span>
          <UiMenuButton
            v-if="canEdit && showAssigneePicker()"
            class="shrink-0"
            :model-value="collapsedAssigneeMenuValue"
            ariaLabel="Change assignee"
            title="Change assignee"
            placement="bottom-end"
            :options="assigneeSelectOptions"
            :disabled="assigningQuick"
            :min-panel-width="200"
            @select="onAssigneeMenuSelect"
          >
            <UserPlusIcon class="h-4 w-4" aria-hidden="true" />
          </UiMenuButton>
        </div>
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
          class="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
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
