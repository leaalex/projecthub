<script setup lang="ts">
import type { Task } from '../../types/task'
import TaskCard from './TaskCard.vue'

withDefaults(
  defineProps<{
    tasks: Task[]
    /** Shown when `tasks` is empty (list mode panel). */
    emptyMessage?: string
    /** Per-task edit permission (e.g. project owner), same rules as task detail modal. */
    canEditTask?: (task: Task) => boolean
    /** Owned projects for inline “move task” (optional). */
    projects?: { id: number; name: string }[]
    /** Users shown in assignee dropdown (e.g. admin-loaded); empty = read-only assignee. */
    assignableUsers?: { id: number; email: string; name: string }[]
  }>(),
  { emptyMessage: '', projects: () => [], assignableUsers: () => [] },
)

const emit = defineEmits<{
  complete: [id: number]
  reopen: [id: number]
  info: [id: number]
  taskUpdated: []
}>()
</script>

<template>
  <div
    class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
  >
    <div
      v-if="$slots.header"
      class="border-b border-border px-3 py-3"
    >
      <slot name="header" />
    </div>
    <div class="divide-y divide-border">
      <TaskCard
        v-for="t in tasks"
        :key="t.id"
        class="px-3"
        :task="t"
        :can-edit="canEditTask?.(t) ?? false"
        :projects="projects"
        :assignable-users="assignableUsers"
        @complete="emit('complete', $event)"
        @reopen="emit('reopen', $event)"
        @info="emit('info', $event)"
        @updated="emit('taskUpdated')"
      />
      <p
        v-if="tasks.length === 0"
        class="px-3 py-8 text-center text-sm text-muted"
      >
        {{ emptyMessage || 'No tasks yet.' }}
      </p>
    </div>
  </div>
</template>
