<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/24/solid'
import { InformationCircleIcon } from '@heroicons/vue/24/outline'
import { nextTick, ref, watch } from 'vue'
import type { Task, TaskPriority, TaskStatus } from '../../types/task'
import { useTaskStore } from '../../stores/task.store'
import { useToast } from '../../composables/useToast'
import { timeAgo } from '../../utils/formatters'
import Avatar from '../ui/UiAvatar.vue'
import Badge from '../ui/UiBadge.vue'

const controlClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60'

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

const expanded = ref(false)
const busy = ref(false)
/** Serialize PUT/assign calls so rapid blur+change don’t drop updates. */
let saveChain = Promise.resolve()

const draftTitle = ref('')
const draftDescription = ref('')
const draftStatus = ref<TaskStatus>('todo')
const draftPriority = ref<TaskPriority>('medium')
const draftProjectId = ref(0)
const draftDue = ref('')
const draftAssigneeId = ref<number | ''>('')

const titleInput = ref<HTMLInputElement | null>(null)
const skipBlurCommit = ref(false)

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

function collapseExpanded() {
  expanded.value = false
  syncDraftsFromTask()
}

function onInlineEscape(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  e.preventDefault()
  collapseExpanded()
}

function runSave(fn: () => Promise<void>) {
  saveChain = saveChain.then(async () => {
    busy.value = true
    try {
      await fn()
      emit('updated')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      const msg = err.response?.data?.error
      toast.error(typeof msg === 'string' ? msg : 'Could not update task')
      syncDraftsFromTask()
    } finally {
      busy.value = false
    }
  })
}

function guardedBlur(commit: () => void | Promise<void>) {
  if (skipBlurCommit.value) {
    skipBlurCommit.value = false
    return
  }
  void Promise.resolve(commit())
}

function commitTitle() {
  const trimmed = draftTitle.value.trim()
  if (!trimmed) {
    toast.error('Enter a task title')
    draftTitle.value = props.task.title
    return
  }
  if (trimmed === props.task.title) return
  runSave(async () => {
    await taskStore.update(props.task.id, { title: trimmed })
  })
}

function onTitleBlur() {
  guardedBlur(() => commitTitle())
}

function onTitleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    titleInput.value?.blur()
  }
  onInlineEscape(e)
}

function commitDescription() {
  const next = draftDescription.value.trim()
  const prev = (props.task.description ?? '').trim()
  if (next === prev) return
  runSave(async () => {
    await taskStore.update(props.task.id, { description: next })
  })
}

function onDescBlur() {
  guardedBlur(() => commitDescription())
}

function commitStatus() {
  if (draftStatus.value === props.task.status) return
  runSave(async () => {
    await taskStore.update(props.task.id, { status: draftStatus.value })
  })
}

function commitPriority() {
  if (draftPriority.value === props.task.priority) return
  runSave(async () => {
    await taskStore.update(props.task.id, { priority: draftPriority.value })
  })
}

function commitProject() {
  const pid = Number(draftProjectId.value)
  if (!pid || pid === props.task.project_id) return
  runSave(async () => {
    await taskStore.update(props.task.id, { project_id: pid })
  })
}

function commitDue() {
  const next = draftDue.value.trim()
  const prev = dueFromTask(props.task.due_date)
  if (next === prev) return
  runSave(async () => {
    await taskStore.update(props.task.id, { due_date: next })
  })
}

function onDueBlur() {
  guardedBlur(() => commitDue())
}

function commitAssignee() {
  const raw = draftAssigneeId.value
  const nextId = raw === '' ? 0 : Number(raw)
  const prev = props.task.assignee_id ?? 0
  if (nextId === prev) return
  runSave(async () => {
    await taskStore.assign(props.task.id, nextId)
  })
}

const showProjectPicker = () => props.projects.length > 0
const showAssigneePicker = () => props.assignableUsers.length > 0
</script>

<template>
  <div class="flex gap-2.5 py-2">
    <div class="flex shrink-0 flex-col pt-0.5">
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
          <button
            type="button"
            class="inline-flex shrink-0 items-center justify-center rounded-md p-1 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label="Task details"
            @click.stop="emit('info', task.id)"
          >
            <InformationCircleIcon class="h-4 w-4" />
          </button>
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
          <template v-if="task.assignee">
            <span class="shrink-0">·</span>
            <span class="inline-flex min-w-0 max-w-full items-center gap-1">
              <Avatar
                size="sm"
                :email="task.assignee.email"
                :name="task.assignee.name"
              />
              <span class="truncate">{{ task.assignee.email }}</span>
            </span>
          </template>
        </div>
      </template>

      <div
        v-else
        class="space-y-3 rounded-md border border-border bg-surface-muted/30 p-3"
        @click.stop
      >
        <div class="flex items-start gap-2">
          <input
            ref="titleInput"
            v-model="draftTitle"
            type="text"
            :class="controlClass"
            class="min-w-0 flex-1 !py-1.5 text-sm font-medium"
            :disabled="busy"
            @blur="onTitleBlur"
            @keydown="onTitleKeydown"
          />
          <button
            type="button"
            class="shrink-0 rounded-md border border-border bg-surface px-2 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted"
            @click="collapseExpanded"
          >
            Done
          </button>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-muted"
            >Description</label
          >
          <textarea
            v-model="draftDescription"
            rows="2"
            :class="controlClass"
            :disabled="busy"
            @blur="onDescBlur"
            @keydown="onInlineEscape"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-muted"
              >Status</label
            >
            <select
              v-model="draftStatus"
              :class="controlClass"
              :disabled="busy"
              @change="commitStatus"
              @keydown="onInlineEscape"
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-muted"
              >Priority</label
            >
            <select
              v-model="draftPriority"
              :class="controlClass"
              :disabled="busy"
              @change="commitPriority"
              @keydown="onInlineEscape"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div v-if="showProjectPicker()">
          <label class="mb-1 block text-xs font-medium text-muted"
            >Project</label
          >
          <select
            v-model.number="draftProjectId"
            :class="controlClass"
            :disabled="busy"
            @change="commitProject"
            @keydown="onInlineEscape"
          >
            <option v-for="p in projects" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-muted"
            >Due date</label
          >
          <input
            v-model="draftDue"
            type="date"
            :class="controlClass"
            :disabled="busy"
            @blur="onDueBlur"
            @keydown="onInlineEscape"
          />
        </div>

        <div v-if="showAssigneePicker()">
          <label class="mb-1 block text-xs font-medium text-muted"
            >Assignee</label
          >
          <select
            v-model="draftAssigneeId"
            :class="controlClass"
            :disabled="busy"
            @change="commitAssignee"
            @keydown="onInlineEscape"
          >
            <option value="">Unassigned</option>
            <option
              v-for="u in assignableUsers"
              :key="u.id"
              :value="u.id"
            >
              {{ u.name || u.email }}
            </option>
          </select>
        </div>
        <div v-else class="text-xs text-muted">
          <span class="font-medium text-foreground/80">Assignee</span>
          <span class="ml-1">{{
            task.assignee
              ? task.assignee.name || task.assignee.email
              : 'Unassigned'
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
