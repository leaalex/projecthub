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
  projects?: { id: number; name: string }[]
  assignableUsers?: { id: number; email: string; name: string }[]
}>()

const emit = defineEmits<{
  complete: [id: number]
  reopen: [id: number]
  info: [id: number]
  openNote: [payload: { noteId: number; projectId: number }]
  taskUpdated: []
  taskExpandedChange: [expanded: boolean]
  openNoteDetail: [noteId: number]
  editNote: [noteId: number]
  removeNote: [noteId: number]
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
      :projects="projects"
      :assignable-users="assignableUsers"
      @complete="emit('complete', $event)"
      @reopen="emit('reopen', $event)"
      @info="emit('info', $event)"
      @open-note="emit('openNote', $event)"
      @updated="emit('taskUpdated')"
      @expanded-change="emit('taskExpandedChange', $event)"
    />
    <NoteCard
      v-else
      variant="list"
      class="px-3 py-1"
      :note="item.note"
      :can-manage="canManageNote"
      @open="emit('openNoteDetail', $event)"
      @edit="emit('editNote', $event)"
      @remove="emit('removeNote', $event)"
    />
  </div>
</template>
