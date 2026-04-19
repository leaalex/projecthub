<script setup lang="ts">
import { PencilSquareIcon } from '@heroicons/vue/24/outline'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ProjectItemGroup, WorkspaceItem } from '@app/composables/useProjectItemsPresentation'
import { useProjectStore } from '@app/project.store'
import { extractNoteAxiosError } from '@app/note.store'
import { taskSectionHeaderStats } from '@domain/task/stats'
import type { Note } from '@domain/note/types'
import type { Task } from '@domain/task/types'
import Button from '../ui/UiButton.vue'
import { useToast } from '@app/composables/useToast'
import ProjectItemCard from './ProjectItemCard.vue'

const { t } = useI18n()
const toast = useToast()
const projectStore = useProjectStore()

const props = withDefaults(
  defineProps<{
    groups: ProjectItemGroup[]
    canManageNote: boolean
    canEditTask?: (task: Task) => boolean
    canChangeStatusTask?: (task: Task) => boolean
    emptyMessage?: string
    /** Включает DnD задач и заметок между секциями / позициями. */
    enableItemDrag?: boolean
    /** Управление разделами проекта в заголовках групп (только страница проекта). */
    canManageSections?: boolean
    projectId?: number
  }>(),
  {
    emptyMessage: '',
    enableItemDrag: true,
    canManageSections: false,
    projectId: 0,
  },
)

const emit = defineEmits<{
  complete: [id: number]
  reopen: [id: number]
  viewTask: [id: number]
  editTask: [id: number]
  viewNote: [id: number]
  editNote: [id: number]
  move: [
    payload: {
      kind: 'task' | 'note'
      id: number
      sectionId: number | null
      position: number
    },
  ]
  sectionsUpdated: []
  editSection: [payload: { sectionId: number; name: string }]
}>()

const dragItem = ref<{ kind: 'task' | 'note'; id: number } | null>(null)
const dragOver = ref<string | null>(null)

const dragSectionId = ref<number | null>(null)

const manageSectionsActive = computed(
  () =>
    props.canManageSections
    && Number.isFinite(props.projectId)
    && props.projectId > 0,
)

function parseSectionKey(key: string): number | null {
  if (key === 'unsectioned') return null
  if (key.startsWith('s-')) {
    const n = Number(key.slice(2))
    return Number.isFinite(n) ? n : null
  }
  return null
}

function sectionIdsInDisplayOrder(): number[] {
  return props.groups
    .map(g => g.key)
    .filter(k => k.startsWith('s-'))
    .map(k => Number(k.slice(2)))
}

function canDragTask(task: Task): boolean {
  if (!props.enableItemDrag) return false
  return props.canEditTask?.(task) ?? false
}

function canDragNote(_note: Note): boolean {
  if (!props.enableItemDrag) return false
  return props.canManageNote
}

function onTaskDragStart(e: DragEvent, task: Task) {
  if (!canDragTask(task)) {
    e.preventDefault()
    return
  }
  dragItem.value = { kind: 'task', id: task.id }
  dragSectionId.value = null
  e.dataTransfer?.setData('text/plain', `task:${task.id}`)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onNoteDragStart(e: DragEvent, note: Note) {
  if (!canDragNote(note)) {
    e.preventDefault()
    return
  }
  dragItem.value = { kind: 'note', id: note.id }
  dragSectionId.value = null
  e.dataTransfer?.setData('text/plain', `note:${note.id}`)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  dragItem.value = null
  dragOver.value = null
}

function onDropAt(sectionKey: string, position: number) {
  const item = dragItem.value
  if (!item) return
  const sectionId = parseSectionKey(sectionKey)
  emit('move', {
    kind: item.kind,
    id: item.id,
    sectionId,
    position,
  })
}

function tasksInGroup(items: WorkspaceItem[]) {
  return items
    .filter((x): x is { kind: 'task'; task: Task } => x.kind === 'task')
    .map((x) => x.task)
}

function onSectionDragStart(e: DragEvent, sectionId: number) {
  if (!manageSectionsActive.value) {
    e.preventDefault()
    return
  }
  dragSectionId.value = sectionId
  dragItem.value = null
  e.dataTransfer?.setData('text/plain', String(sectionId))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onSectionDragEnd() {
  dragSectionId.value = null
  dragOver.value = null
}

function onSectionHeaderDragOver(e: DragEvent, g: ProjectItemGroup) {
  if (dragSectionId.value == null) return
  e.preventDefault()
  dragOver.value = `sec-head:${g.key}`
}

function onSectionHeaderDrop(e: DragEvent, g: ProjectItemGroup) {
  if (dragSectionId.value == null) return
  e.preventDefault()
  void onSectionDropOnHeader(sectionIdForGroup(g)!)
}

async function onSectionDropOnHeader(targetSectionId: number) {
  const dragged = dragSectionId.value
  const pid = props.projectId
  if (!manageSectionsActive.value || dragged == null || pid <= 0) {
    onSectionDragEnd()
    return
  }
  if (dragged === targetSectionId) {
    onSectionDragEnd()
    return
  }
  const ids = sectionIdsInDisplayOrder()
  const next = ids.filter(id => id !== dragged)
  const insertAt = next.indexOf(targetSectionId)
  if (insertAt < 0) {
    onSectionDragEnd()
    return
  }
  next.splice(insertAt, 0, dragged)
  try {
    await projectStore.reorderSections(pid, next)
    emit('sectionsUpdated')
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, t('project.section.reorderFailed')))
  } finally {
    onSectionDragEnd()
  }
}

function openSectionEdit(g: ProjectItemGroup) {
  const sid = sectionIdForGroup(g)
  if (sid == null) return
  emit('editSection', { sectionId: sid, name: g.label })
}

function sectionIdForGroup(g: ProjectItemGroup): number | null {
  return parseSectionKey(g.key)
}

function rowDragOverKey(item: WorkspaceItem): string {
  return item.kind === 'task' ? `task:${item.task.id}` : `note:${item.note.id}`
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="g in groups"
      :key="g.key"
      class="space-y-2"
    >
      <template
        v-if="manageSectionsActive && sectionIdForGroup(g) != null"
      >
        <div
          class="group flex flex-wrap items-center gap-2 rounded-md px-0.5 py-0.5"
          :class="dragOver === `sec-head:${g.key}` ? 'bg-surface-muted/40' : ''"
          @dragover="onSectionHeaderDragOver($event, g)"
          @dragleave="dragOver = null"
          @drop="onSectionHeaderDrop($event, g)"
        >
          <div
            class="flex min-w-0 flex-1 cursor-grab items-baseline gap-1.5 text-sm font-semibold text-foreground active:cursor-grabbing"
            draggable="true"
            @dragstart="onSectionDragStart($event, sectionIdForGroup(g)!)"
            @dragend="onSectionDragEnd"
          >
            <span class="shrink-0 select-none text-muted" aria-hidden="true">⠿</span>
            <h2 class="min-w-0 flex-1">
              {{ g.label }}
              <span class="font-normal text-muted">{{
                taskSectionHeaderStats(tasksInGroup(g.items))
              }}</span>
            </h2>
          </div>
          <div
            class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            @mousedown.stop
          >
            <Button
              type="button"
              variant="ghost"
              class="h-8 min-h-8 w-8 min-w-8 !px-0"
              :aria-label="t('project.section.editSectionAria')"
              :title="t('common.edit')"
              @click="openSectionEdit(g)"
            >
              <PencilSquareIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </template>
      <h2
        v-else
        class="text-sm font-semibold text-foreground"
      >
        {{ g.label }}
        <span class="font-normal text-muted">{{
          taskSectionHeaderStats(tasksInGroup(g.items))
        }}</span>
      </h2>

      <div
        class="overflow-hidden rounded-lg border border-border bg-surface"
        :class="dragOver === `section:${g.key}` ? 'ring-1 ring-primary/40 border-primary' : ''"
        @dragover.prevent="enableItemDrag ? (dragOver = `section:${g.key}`) : undefined"
        @dragleave="enableItemDrag ? (dragOver = null) : undefined"
        @drop.prevent="enableItemDrag ? onDropAt(g.key, g.items.length) : undefined"
      >
        <div class="divide-y divide-border">
          <div
            v-for="(item, idx) in g.items"
            :key="item.kind === 'task' ? `t-${item.task.id}` : `n-${item.note.id}`"
            :draggable="
              item.kind === 'task'
                ? canDragTask(item.task)
                : canDragNote(item.note)
            "
            class="relative"
            @dragstart="
              item.kind === 'task'
                ? onTaskDragStart($event, item.task)
                : onNoteDragStart($event, item.note)
            "
            @dragend="enableItemDrag ? onDragEnd() : undefined"
            @dragover.prevent="
              enableItemDrag ? (dragOver = rowDragOverKey(item)) : undefined
            "
            @dragleave="enableItemDrag ? (dragOver = null) : undefined"
            @drop.stop.prevent="enableItemDrag ? onDropAt(g.key, idx) : undefined"
          >
            <div
              v-if="enableItemDrag && dragOver === rowDragOverKey(item)"
              class="absolute inset-x-0 top-0 z-10 h-0.5 bg-primary"
            />
            <ProjectItemCard
              :item="item"
              :can-edit-task="canEditTask"
              :can-change-status-task="canChangeStatusTask"
              :can-manage-note="canManageNote"
              @complete="emit('complete', $event)"
              @reopen="emit('reopen', $event)"
              @view-task="emit('viewTask', $event)"
              @edit-task="emit('editTask', $event)"
              @view-note="emit('viewNote', $event)"
              @edit-note="emit('editNote', $event)"
            />
          </div>
          <p
            v-if="g.items.length === 0"
            class="px-3 py-8 text-center text-sm text-muted"
          >
            {{ emptyMessage || t('tasks.emptySection') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
