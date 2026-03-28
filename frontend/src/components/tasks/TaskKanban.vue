<script setup lang="ts">
import { ref } from 'vue'
import { useTaskStore } from '../../stores/task.store'
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

const columns: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To do' },
  { status: 'in_progress', title: 'In progress' },
  { status: 'review', title: 'Review' },
  { status: 'done', title: 'Done' },
]

const dragOverColumn = ref<TaskStatus | null>(null)

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
          <Button
            v-if="task.status !== 'done'"
            class="mt-2"
            variant="secondary"
            @click="markDone(task.id)"
          >
            Mark done
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
