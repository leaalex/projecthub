<script setup lang="ts">
import { CheckCircleIcon } from '@heroicons/vue/24/solid'
import { InformationCircleIcon } from '@heroicons/vue/24/outline'
import type { Task } from '../../types/task'
import { timeAgo } from '../../utils/formatters'
import Avatar from '../common/Avatar.vue'
import Badge from '../common/Badge.vue'

defineProps<{
  task: Task
  canAssign?: boolean
}>()

const emit = defineEmits<{
  complete: [id: number]
  info: [id: number]
}>()
</script>

<template>
  <div class="flex gap-2.5 py-2">
    <div class="flex shrink-0 flex-col pt-0.5">
      <button
        v-if="task.status !== 'done'"
        type="button"
        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/45 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Mark done"
        @click="emit('complete', task.id)"
      />
      <CheckCircleIcon
        v-else
        class="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
        aria-hidden="true"
      />
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <h3
          class="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
          :class="task.status === 'done' && 'text-muted line-through'"
        >
          {{ task.title }}
        </h3>
        <div class="flex shrink-0 items-center gap-1">
          <Badge kind="status" :value="task.status" />
          <Badge kind="priority" :value="task.priority" />
        </div>
        <button
          type="button"
          class="inline-flex shrink-0 items-center justify-center rounded-md p-1 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          aria-label="Task details"
          @click="emit('info', task.id)"
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
        <span class="shrink-0">Project #{{ task.project_id }}</span>
        <span class="shrink-0">·</span>
        <span class="shrink-0">Updated {{ timeAgo(task.updated_at) }}</span>
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
    </div>
  </div>
</template>
