<script setup lang="ts">
import type { Project } from '../../types/project'
import ProjectCard from './ProjectCard.vue'

defineProps<{
  projects: Project[]
}>()

const emit = defineEmits<{
  open: [id: number]
  edit: [id: number]
}>()
</script>

<template>
  <div
    class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
  >
    <ProjectCard
      v-for="p in projects"
      :key="p.id"
      :project="p"
      @open="emit('open', $event)"
      @edit="emit('edit', $event)"
    />
  </div>
</template>
