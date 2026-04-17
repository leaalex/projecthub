<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  InformationCircleIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import { useTaskStore } from '../../stores/task.store'
import { useConfirm } from '../../composables/useConfirm'
import { useTaskEditPermission } from '../../composables/useCanEditTask'
import { useToast } from '../../composables/useToast'
import type { Task, TaskStatus } from '../../types/task'
import { formatTaskStatus } from '../../utils/formatters'
import Button from '../ui/UiButton.vue'

const props = defineProps<{
  tasks: Task[]
  sections?: { id: number; name: string; position: number }[]
}>()

const emit = defineEmits<{
  changed: []
  info: [id: number]
}>()

const taskStore = useTaskStore()
const toast = useToast()
const { confirm } = useConfirm()
const { canManageTask, canChangeTaskStatus } = useTaskEditPermission()

const columns: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To do' },
  { status: 'in_progress', title: 'In progress' },
  { status: 'review', title: 'Review' },
  { status: 'done', title: 'Done' },
]

const dragOverCell = ref<string | null>(null)
const draggedTaskId = ref<number | null>(null)
const removingId = ref<number | null>(null)

const sectionRows = computed(() => {
  const map = new Map<number | null, { id: number | null; name: string; order: number }>()
  map.set(null, { id: null, name: 'Unsectioned', order: -1 })
  for (const s of props.sections ?? []) {
    map.set(s.id, { id: s.id, name: s.name, order: s.position })
  }
  for (const t of props.tasks) {
    const key = t.section_id ?? null
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: t.section?.name || 'Unsectioned',
        order: t.section?.position ?? 0,
      })
    }
  }
  return [...map.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
})

function tasksIn(sectionId: number | null, status: TaskStatus) {
  return props.tasks
    .filter((t) => (t.section_id ?? null) === sectionId && t.status === status)
    .sort((a, b) => a.position - b.position || a.id - b.id)
}

function onDragStart(e: DragEvent, task: Task) {
  if (!canManageTask(task)) {
    e.preventDefault()
    return
  }
  draggedTaskId.value = task.id
  e.dataTransfer?.setData('text/plain', String(task.id))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function cellKey(sectionId: number | null, status: TaskStatus): string {
  return `${sectionId ?? 'null'}:${status}`
}

function onDragOver(e: DragEvent, sectionId: number | null, status: TaskStatus) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dragOverCell.value = cellKey(sectionId, status)
}

function onDragLeave(sectionId: number | null, status: TaskStatus) {
  const key = cellKey(sectionId, status)
  if (dragOverCell.value === key) dragOverCell.value = null
}

function currentDraggedTask(e: DragEvent): Task | undefined {
  const raw = e.dataTransfer?.getData('text/plain')
  const fromTransfer = raw ? Number(raw) : NaN
  const id = Number.isFinite(fromTransfer) ? fromTransfer : draggedTaskId.value
  if (!id) return undefined
  return props.tasks.find((t) => t.id === id)
}

async function moveTaskTo(e: DragEvent, sectionId: number | null, status: TaskStatus, position?: number) {
  e.preventDefault()
  dragOverCell.value = null
  const task = currentDraggedTask(e)
  if (!task) return
  if (!canManageTask(task)) return
  const sameSection = (task.section_id ?? null) === sectionId
  const sameStatus = task.status === status
  if (sameSection && sameStatus && position === undefined) return
  try {
    await taskStore.moveTask(task.project_id, {
      task_id: task.id,
      section_id: sectionId,
      status,
      ...(typeof position === 'number' ? { position } : {}),
    })
    emit('changed')
  } catch {
    toast.error('Could not move task')
  }
}

function onDragEnd() {
  dragOverCell.value = null
  draggedTaskId.value = null
}

async function markDone(taskId: number) {
  try {
    await taskStore.complete(taskId)
    emit('changed')
  } catch {
    toast.error('Could not complete task')
  }
}

async function removeTask(task: Task) {
  if (!canManageTask(task)) return
  const ok = await confirm({
    title: 'Delete task',
    message: `Remove “${task.title}”? This cannot be undone.`,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  removingId.value = task.id
  try {
    await taskStore.remove(task.id)
    toast.success('Task deleted')
    emit('changed')
  } catch {
    toast.error('Could not delete task')
  } finally {
    removingId.value = null
  }
}
</script>

<template>
  <div class="space-y-4" role="list" aria-label="Task board">
    <div
      v-for="section in sectionRows"
      :key="section.id ?? 'unsectioned'"
      class="space-y-2 rounded-lg border border-border bg-surface-muted/30 p-3"
    >
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-sm font-semibold text-foreground">{{ section.name }}</h2>
      </div>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="col in columns"
          :key="`${section.id ?? 'unsectioned'}:${col.status}`"
          class="flex min-h-[10rem] flex-col rounded-lg border border-border bg-surface p-2 transition-colors"
          :class="dragOverCell === cellKey(section.id, col.status) ? 'border-primary ring-1 ring-primary/40' : ''"
          @dragover="onDragOver($event, section.id, col.status)"
          @dragleave="onDragLeave(section.id, col.status)"
          @drop="moveTaskTo($event, section.id, col.status)"
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <h3 class="text-xs font-semibold text-muted">{{ col.title }}</h3>
            <span class="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted">
              {{ tasksIn(section.id, col.status).length }}
            </span>
          </div>
          <div class="flex flex-1 flex-col gap-2">
            <div
              v-for="(task, idx) in tasksIn(section.id, col.status)"
              :key="task.id"
              :draggable="canManageTask(task)"
              class="rounded-lg border border-border bg-surface p-3"
              :class="canManageTask(task) ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'"
              @dragstart="onDragStart($event, task)"
              @dragend="onDragEnd"
              @dragover.prevent="onDragOver($event, section.id, col.status)"
              @drop.prevent="moveTaskTo($event, section.id, col.status, idx)"
            >
              <p class="font-medium text-foreground">{{ task.title }}</p>
              <p class="mt-1 line-clamp-2 text-xs text-muted">
                {{ task.description || '—' }}
              </p>
              <p class="mt-2 text-xs text-muted">
                {{ formatTaskStatus(task.status) }} · {{ task.priority }}
              </p>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md p-1.5 text-xs text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Task details"
                  title="Open details"
                  @click.stop="emit('info', task.id)"
                >
                  <InformationCircleIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Open</span>
                </button>
                <Button
                  v-if="task.status !== 'done' && canChangeTaskStatus(task)"
                  variant="secondary"
                  @click.stop="markDone(task.id)"
                >
                  Mark done
                </Button>
                <button
                  v-if="canManageTask(task)"
                  type="button"
                  class="inline-flex items-center justify-center rounded-md p-1.5 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  aria-label="Delete task"
                  :disabled="removingId === task.id"
                  @click.stop="removeTask(task)"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
