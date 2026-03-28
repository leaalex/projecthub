<script setup lang="ts">
import type { Task } from '../../types/task'
import TaskCard from './TaskCard.vue'

defineProps<{
  tasks: Task[]
}>()

const emit = defineEmits<{
  complete: [id: number]
}>()
</script>

<template>
  <div class="space-y-3">
    <TaskCard
      v-for="t in tasks"
      :key="t.id"
      :task="t"
      @complete="emit('complete', $event)"
    />
  </div>
</template>
