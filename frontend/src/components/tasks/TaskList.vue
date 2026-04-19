<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Task } from '@domain/task/types'
import TaskCard from './TaskCard.vue'

const { t } = useI18n()

withDefaults(
  defineProps<{
    tasks: Task[]
    /** Shown when `tasks` is empty (list mode panel). */
    emptyMessage?: string
    /** Full edit (manager/owner/admin/staff). */
    canEditTask?: (task: Task) => boolean
    /** Status changes (executors, managers, etc.). */
    canChangeStatusTask?: (task: Task) => boolean
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
  viewTask: [id: number]
  editTask: [id: number]
  openNote: [payload: { noteId: number; projectId: number }]
}>()
</script>

<template>
  <div
    class="overflow-hidden rounded-lg border border-border bg-surface"
  >
    <div
      v-if="$slots.header"
      class="border-b border-border px-3 py-3"
    >
      <slot name="header" />
    </div>
    <div class="divide-y divide-border">
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        class="px-3"
        :task="task"
        :can-edit="canEditTask?.(task) ?? false"
        :can-change-status="
          canChangeStatusTask?.(task) ?? canEditTask?.(task) ?? false
        "
        :projects="projects"
        :assignable-users="assignableUsers"
        @complete="emit('complete', $event)"
        @reopen="emit('reopen', $event)"
        @view="emit('viewTask', $event)"
        @edit="emit('editTask', $event)"
        @open-note="emit('openNote', $event)"
      />
      <p
        v-if="tasks.length === 0"
        class="px-3 py-8 text-center text-sm text-muted"
      >
        {{ emptyMessage || t('taskList.emptyDefault') }}
      </p>
    </div>
  </div>
</template>
