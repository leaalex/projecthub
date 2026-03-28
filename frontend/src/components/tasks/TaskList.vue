<script setup lang="ts">
import type { Task } from '../../types/task'
import TaskCard from './TaskCard.vue'

defineProps<{
  tasks: Task[]
}>()

const emit = defineEmits<{
  complete: [id: number]
  info: [id: number]
}>()
</script>

<template>
  <div class="divide-y divide-border">
    <TaskCard
      v-for="t in tasks"
      :key="t.id"
      :task="t"
      @complete="emit('complete', $event)"
      @info="emit('info', $event)"
    />
  </div>
</template>
