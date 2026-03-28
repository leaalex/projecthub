<script setup lang="ts">
import type { Task } from '../../types/task'
import TaskCard from './TaskCard.vue'

withDefaults(
  defineProps<{
    tasks: Task[]
    /** Shown when `tasks` is empty (list mode panel). */
    emptyMessage?: string
  }>(),
  { emptyMessage: '' },
)

const emit = defineEmits<{
  complete: [id: number]
  reopen: [id: number]
  info: [id: number]
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
        @complete="emit('complete', $event)"
        @reopen="emit('reopen', $event)"
        @info="emit('info', $event)"
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
