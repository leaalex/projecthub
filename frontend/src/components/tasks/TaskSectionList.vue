<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TaskGroup } from '../../composables/useTaskListPresentation'
import type { Task } from '../../types/task'
import { taskSectionHeaderStats } from '../../utils/taskSectionStats'
import TaskCard from './TaskCard.vue'

const props = withDefaults(
  defineProps<{
    groups: TaskGroup[]
    canEditTask?: (task: Task) => boolean
    canChangeStatusTask?: (task: Task) => boolean
    projects?: { id: number; name: string }[]
    assignableUsers?: { id: number; email: string; name: string }[]
    emptyMessage?: string
  }>(),
  { projects: () => [], assignableUsers: () => [], emptyMessage: '' },
)

const emit = defineEmits<{
  complete: [id: number]
  reopen: [id: number]
  info: [id: number]
  taskUpdated: []
  move: [payload: { taskId: number; sectionId: number | null; position: number }]
}>()

const dragTaskId = ref<number | null>(null)
const dragOver = ref<string | null>(null)
/** Task ids with inline editor expanded — no drag on those rows. */
const expandedTaskIds = ref<Set<number>>(new Set())

const allTasks = computed(() => props.groups.flatMap((g) => g.tasks))

function parseSectionId(groupKey: string): number | null {
  if (groupKey === 'unsectioned') return null
  if (groupKey.startsWith('s-')) {
    const n = Number(groupKey.slice(2))
    return Number.isFinite(n) ? n : null
  }
  return null
}

function canDragTask(task: Task): boolean {
  if (!(props.canEditTask?.(task) ?? false)) return false
  if (expandedTaskIds.value.has(task.id)) return false
  return true
}

function onTaskExpandedChange(taskId: number, open: boolean) {
  const next = new Set(expandedTaskIds.value)
  if (open) next.add(taskId)
  else next.delete(taskId)
  expandedTaskIds.value = next
}

function onDragStart(e: DragEvent, task: Task) {
  if (!canDragTask(task)) {
    e.preventDefault()
    return
  }
  dragTaskId.value = task.id
  e.dataTransfer?.setData('text/plain', String(task.id))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  dragTaskId.value = null
  dragOver.value = null
}

function draggedTask(): Task | undefined {
  if (dragTaskId.value == null) return undefined
  return allTasks.value.find((t) => t.id === dragTaskId.value)
}

function onDropAt(sectionKey: string, position: number) {
  const task = draggedTask()
  if (!task) return
  const sectionId = parseSectionId(sectionKey)
  emit('move', { taskId: task.id, sectionId, position })
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="g in groups"
      :key="g.key"
      class="space-y-2"
    >
      <h2 class="text-sm font-semibold text-foreground">
        {{ g.label }}
        <span class="font-normal text-muted">{{
          taskSectionHeaderStats(g.tasks)
        }}</span>
      </h2>

      <div
        class="overflow-hidden rounded-lg border border-border bg-surface"
        :class="dragOver === `section:${g.key}` ? 'ring-1 ring-primary/40 border-primary' : ''"
        @dragover.prevent="dragOver = `section:${g.key}`"
        @dragleave="dragOver = null"
        @drop.prevent="onDropAt(g.key, g.tasks.length)"
      >
        <div class="divide-y divide-border">
          <div
            v-for="(t, idx) in g.tasks"
            :key="t.id"
            :draggable="canDragTask(t)"
            class="relative"
            @dragstart="onDragStart($event, t)"
            @dragend="onDragEnd"
            @dragover.prevent="dragOver = `task:${t.id}`"
            @dragleave="dragOver = null"
            @drop.stop.prevent="onDropAt(g.key, idx)"
          >
            <div
              v-if="dragOver === `task:${t.id}`"
              class="absolute inset-x-0 top-0 z-10 h-0.5 bg-primary"
            />
            <div class="min-w-0">
              <TaskCard
                class="px-3"
                :task="t"
                :can-edit="canEditTask?.(t) ?? false"
                :can-change-status="canChangeStatusTask?.(t) ?? canEditTask?.(t) ?? false"
                :projects="projects"
                :assignable-users="assignableUsers"
                @complete="emit('complete', $event)"
                @reopen="emit('reopen', $event)"
                @info="emit('info', $event)"
                @updated="emit('taskUpdated')"
                @expanded-change="onTaskExpandedChange(t.id, $event)"
              />
            </div>
          </div>
          <p
            v-if="g.tasks.length === 0"
            class="px-3 py-8 text-center text-sm text-muted"
          >
            {{ emptyMessage || 'No tasks in this section.' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
