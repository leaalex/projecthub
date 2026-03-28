<script setup lang="ts">
import type { Project } from '../../types/project'
import { timeAgo } from '../../utils/formatters'
import Button from '../ui/UiButton.vue'

defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  open: [id: number]
}>()
</script>

<template>
  <div
    class="flex flex-col justify-between rounded-lg border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
  >
    <div>
      <h3 class="font-semibold text-foreground">{{ project.name }}</h3>
      <p class="mt-1 line-clamp-2 text-sm text-muted">
        {{ project.description || 'No description' }}
      </p>
      <p class="mt-2 text-xs text-muted">
        <span class="text-foreground/80">Owner</span>
        <span aria-hidden="true"> · </span>
        <span class="text-foreground">{{
          project.owner
            ? project.owner.name || project.owner.email
            : `User #${project.owner_id}`
        }}</span>
      </p>
      <p class="mt-1 text-xs text-muted">
        Updated {{ timeAgo(project.updated_at) }}
      </p>
    </div>
    <Button class="mt-4" variant="secondary" @click="emit('open', project.id)">
      Open
    </Button>
  </div>
</template>
