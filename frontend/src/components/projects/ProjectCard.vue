<script setup lang="ts">
import { PencilSquareIcon } from '@heroicons/vue/24/outline'
import type { Project } from '../../types/project'
import { timeAgo } from '../../utils/formatters'
import Button from '../ui/UiButton.vue'

defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  open: [id: number]
  edit: [id: number]
}>()
</script>

<template>
  <div
    class="flex flex-col justify-between rounded-lg border border-border bg-surface p-4"
  >
    <div>
      <div class="flex flex-wrap items-center gap-2">
        <h3 class="font-semibold text-foreground">{{ project.name }}</h3>
        <span
          v-if="project.kind === 'personal' || project.kind === 'team'"
          class="inline-flex rounded-md border border-border bg-surface-muted/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted"
        >
          {{ project.kind === 'personal' ? 'Personal' : 'Team' }}
        </span>
      </div>
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
    <div class="mt-4 flex items-center gap-2">
      <Button
        type="button"
        class="min-w-0 flex-1"
        variant="secondary"
        @click="emit('open', project.id)"
      >
        Open
      </Button>
      <Button
        type="button"
        variant="secondary"
        class="shrink-0 px-2.5"
        :aria-label="`Edit project ${project.name}`"
        @click="emit('edit', project.id)"
      >
        <PencilSquareIcon class="h-4 w-4" aria-hidden="true" />
        <span class="sr-only">Edit project</span>
      </Button>
    </div>
  </div>
</template>
