<script setup lang="ts">
import { ref } from 'vue'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { useTaskStore } from '../../stores/task.store'
import { useConfirm } from '../../composables/useConfirm'
import { useTaskEditPermission } from '../../composables/useCanEditTask'
import { useToast } from '../../composables/useToast'
import type { Task, TaskStatus } from '../../types/task'
import { formatTaskStatus } from '../../utils/formatters'
import Button from '../ui/UiButton.vue'

const props = defineProps<{
  tasks: Task[]
}>()

const emit = defineEmits<{
  changed: []
}>()

const taskStore = useTaskStore()
const toast = useToast()
const { confirm } = useConfirm()
const { canEditTask } = useTaskEditPermission()

const columns: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To do' },
  { status: 'in_progress', title: 'In progress' },
  { status: 'review', title: 'Review' },
  { status: 'done', title: 'Done' },
]

const dragOverColumn = ref<TaskStatus | null>(null)
const removingId = ref<number | null>(null)

/** Column order follows the order of tasks in the parent array (after client sort). */
function tasksIn(status: TaskStatus) {
  return props.tasks.filter((t) => t.status === status)
}

function onDragStart(e: DragEvent, task: Task) {
  e.dataTransfer?.setData('text/plain', String(task.id))
  e.dataTransfer!.effectAllowed = 'move'
}

function onDragOver(e: DragEvent, status: TaskStatus) {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'
  dragOverColumn.value = status
}

function onDragLeave(status: TaskStatus) {
  if (dragOverColumn.value === status) dragOverColumn.value = null
}

async function onDrop(e: DragEvent, status: TaskStatus) {
  e.preventDefault()
  dragOverColumn.value = null
  const raw = e.dataTransfer?.getData('text/plain')
  const id = raw ? Number(raw) : NaN
  if (!Number.isFinite(id)) return
  const task = props.tasks.find((t) => t.id === id)
  if (!task || task.status === status) return
  try {
    await taskStore.update(id, { status })
    emit('changed')
  } catch {
    toast.error('Could not move task')
  }
}

function onDragEnd() {
  dragOverColumn.value = null
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
  if (!canEditTask(task)) return
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
  <div
    class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    role="list"
    aria-label="Task board"
  >
    <div
      v-for="col in columns"
      :key="col.status"
      class="flex min-h-[12rem] flex-col rounded-lg border border-border bg-surface-muted/40 p-3 transition-colors"
      :class="
        dragOverColumn === col.status
          ? 'border-primary ring-2 ring-primary/30'
          : ''
      "
      @dragover="onDragOver($event, col.status)"
      @dragleave="onDragLeave(col.status)"
      @drop="onDrop($event, col.status)"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <h2 class="text-sm font-semibold text-foreground">
          {{ col.title }}
        </h2>
        <span
          class="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted"
        >
          {{ tasksIn(col.status).length }}
        </span>
      </div>
      <div class="flex flex-1 flex-col gap-2">
        <div
          v-for="task in tasksIn(col.status)"
          :key="task.id"
          draggable="true"
          class="cursor-grab rounded-lg border border-border bg-surface p-3 shadow-sm active:cursor-grabbing"
          @dragstart="onDragStart($event, task)"
          @dragend="onDragEnd"
        >
          <p class="font-medium text-foreground">{{ task.title }}</p>
          <p class="mt-1 line-clamp-2 text-xs text-muted">
            {{ task.description || '—' }}
          </p>
          <p class="mt-2 text-xs text-muted">
            {{ formatTaskStatus(task.status) }} · {{ task.priority }}
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <Button
              v-if="task.status !== 'done'"
              variant="secondary"
              @click="markDone(task.id)"
            >
              Mark done
            </Button>
            <button
              v-if="canEditTask(task)"
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
</template>
