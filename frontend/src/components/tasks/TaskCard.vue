<script setup lang="ts">
import type { Task } from '../../types/task'
import { timeAgo } from '../../utils/formatters'
import Avatar from '../common/Avatar.vue'
import Badge from '../common/Badge.vue'
import Button from '../common/Button.vue'

defineProps<{
  task: Task
  canAssign?: boolean
}>()

const emit = defineEmits<{
  complete: [id: number]
}>()
</script>

<template>
  <div
    class="rounded-lg border border-border bg-surface p-4 shadow-sm"
  >
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h3 class="font-medium text-foreground">{{ task.title }}</h3>
        <p class="mt-1 text-sm text-muted">{{ task.description || '—' }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        <Badge kind="status" :value="task.status" />
        <Badge kind="priority" :value="task.priority" />
      </div>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
      <span>Project #{{ task.project_id }}</span>
      <span>·</span>
      <span>Updated {{ timeAgo(task.updated_at) }}</span>
      <template v-if="task.assignee">
        <span>·</span>
        <span class="inline-flex items-center gap-1.5">
          <Avatar
            size="sm"
            :email="task.assignee.email"
            :name="task.assignee.name"
          />
          {{ task.assignee.email }}
        </span>
      </template>
    </div>
    <Button
      v-if="task.status !== 'done'"
      class="mt-3"
      variant="secondary"
      @click="emit('complete', task.id)"
    >
      Mark done
    </Button>
  </div>
</template>
