<script setup lang="ts">
import type { Task } from '../../types/task'
import TaskCard from './TaskCard.vue'

defineProps<{
  tasks: Task[]
}>()

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
    </div>
  </div>
</template>
