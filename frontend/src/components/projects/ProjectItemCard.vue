<script setup lang="ts">
import type { WorkspaceItem } from '@app/composables/useProjectItemsPresentation'
import type { Task } from '@domain/task/types'
import TaskCard from '../tasks/TaskCard.vue'
import NoteCard from '../notes/NoteCard.vue'

defineProps<{
  item: WorkspaceItem
  canEditTask?: (task: Task) => boolean
  canChangeStatusTask?: (task: Task) => boolean
  canManageNote: boolean
}>()

const emit = defineEmits<{
  complete: [id: number]
  reopen: [id: number]
  viewTask: [id: number]
  editTask: [id: number]
  openNote: [payload: { noteId: number; projectId: number }]
  viewNote: [id: number]
  editNote: [id: number]
}>()
</script>

<template>
  <div class="min-w-0">
    <TaskCard
      v-if="item.kind === 'task'"
      class="px-3"
      :task="item.task"
      :can-edit="canEditTask?.(item.task) ?? false"
      :can-change-status="canChangeStatusTask?.(item.task) ?? canEditTask?.(item.task) ?? false"
      @complete="emit('complete', $event)"
      @reopen="emit('reopen', $event)"
      @view="emit('viewTask', $event)"
      @edit="emit('editTask', $event)"
      @open-note="emit('openNote', $event)"
    />
    <NoteCard
      v-else
      variant="list"
      class="px-3 py-1"
      :note="item.note"
      :can-manage="canManageNote"
      @view="emit('viewNote', $event)"
      @edit="emit('editNote', $event)"
    />
  </div>
</template>
