<script setup lang="ts">
import { PencilSquareIcon } from '@heroicons/vue/24/outline'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ProjectItemGroup, WorkspaceItem } from '@app/composables/useProjectItemsPresentation'
import type { SectionDisplayMode } from '@domain/project/types'
import { useProjectStore } from '@app/project.store'
import { extractNoteAxiosError } from '@app/note.store'
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
  editSection: [payload: { sectionId: number; name: string; displayMode: SectionDisplayMode }]
}>()

const dragItem = ref<{ kind: 'task' | 'note'; id: number } | null>(null)
const dragOver = ref<string | null>(null)

const dragSectionId = ref<number | null>(null)

const isSectionDragging = computed(() => dragSectionId.value !== null)

/** Отложенный показ пустой unsectioned drop-зоны (после dragstart), чтобы не рвать native DnD. */
const showUnsectionedDropZone = ref(false)

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
  requestAnimationFrame(() => {
    if (dragItem.value !== null) showUnsectionedDropZone.value = true
  })
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
  requestAnimationFrame(() => {
    if (dragItem.value !== null) showUnsectionedDropZone.value = true
  })
}

function onDragEnd() {
  dragItem.value = null
  dragOver.value = null
  showUnsectionedDropZone.value = false
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
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const after = e.clientY >= rect.top + rect.height / 2
  dragOver.value = dragOverKeyFor(g, after)
}

function onSectionHeaderDragLeave(e: DragEvent) {
  if (dragSectionId.value == null) return
  const el = e.currentTarget as HTMLElement
  const related = e.relatedTarget as Node | null
  if (related && el.contains(related)) return
  const group = el.parentElement
  if (related && group && group.contains(related)) return
  dragOver.value = null
}

function onSectionHeaderDrop(e: DragEvent, g: ProjectItemGroup) {
  if (dragSectionId.value == null) return
  e.preventDefault()
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const placeAfter = e.clientY >= rect.top + rect.height / 2
  void onSectionDropAt(sectionIdForGroup(g)!, placeAfter)
}

async function onSectionDropAt(targetSectionId: number, placeAfter: boolean) {
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
  let insertAt = next.indexOf(targetSectionId)
  if (insertAt < 0) {
    onSectionDragEnd()
    return
  }
  if (placeAfter) insertAt += 1
  next.splice(insertAt, 0, dragged)
  try {
    await projectStore.reorderSections(pid, next)
    emit('sectionsUpdated')
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, 'project.section.reorderFailed'))
  } finally {
    onSectionDragEnd()
  }
}

function openSectionEdit(g: ProjectItemGroup) {
  const sid = sectionIdForGroup(g)
  if (sid == null) return
  emit('editSection', { sectionId: sid, name: g.label, displayMode: g.displayMode })
}

function sectionTaskProgress(g: ProjectItemGroup): { done: number; total: number } {
  const tasks = g.items.filter((i): i is { kind: 'task'; task: Task } => i.kind === 'task')
  const total = tasks.length
  const done = tasks.filter(i => i.task.status === 'done').length
  return { done, total }
}

function sectionProgressLabel(g: ProjectItemGroup): string {
  const { done, total } = sectionTaskProgress(g)
  return `${done}/${total}`
}

function sectionIdForGroup(g: ProjectItemGroup): number | null {
  return parseSectionKey(g.key)
}

/** Единый ключ индикатора: «до B» = `sec-after:A`, чтобы не было двух линий на границе. */
function dragOverKeyFor(g: ProjectItemGroup, placeAfter: boolean): string {
  if (placeAfter) return `sec-after:${g.key}`
  const groups = props.groups
  const idx = groups.findIndex(x => x.key === g.key)
  if (idx <= 0) return `sec-before:${g.key}`
  let prev: ProjectItemGroup | null = null
  for (let i = idx - 1; i >= 0; i--) {
    if (groups[i].key.startsWith('s-')) {
      prev = groups[i]
      break
    }
  }
  if (prev) return `sec-after:${prev.key}`
  return `sec-before:${g.key}`
}

function rowDragOverKey(item: WorkspaceItem): string {
  return item.kind === 'task' ? `task:${item.task.id}` : `note:${item.note.id}`
}

function onBodyDragOver(e: DragEvent, g: ProjectItemGroup) {
  if (dragSectionId.value != null) {
    const sid = sectionIdForGroup(g)
    if (sid == null) return
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    dragOver.value = dragOverKeyFor(g, true)
    return
  }
  if (!props.enableItemDrag) return
  e.preventDefault()
  dragOver.value = `section:${g.key}`
}

function onBodyDrop(e: DragEvent, g: ProjectItemGroup) {
  if (dragSectionId.value != null) {
    const sid = sectionIdForGroup(g)
    if (sid == null) return
    e.preventDefault()
    void onSectionDropAt(sid, true)
    return
  }
  if (!props.enableItemDrag) return
  e.preventDefault()
  onDropAt(g.key, g.items.length)
}

function onBodyDragLeave(e: DragEvent) {
  if (dragSectionId.value != null) {
    const el = e.currentTarget as HTMLElement
    const related = e.relatedTarget as Node | null
    if (related && el.contains(related)) return
    const group = el.parentElement
    if (related && group && group.contains(related)) return
    dragOver.value = null
    return
  }
  if (props.enableItemDrag) dragOver.value = null
}

function onRowDragOver(e: DragEvent, item: WorkspaceItem, g: ProjectItemGroup) {
  if (dragSectionId.value != null) {
    const sid = sectionIdForGroup(g)
    if (sid == null) return
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    dragOver.value = dragOverKeyFor(g, true)
    return
  }
  if (!props.enableItemDrag) return
  e.preventDefault()
  dragOver.value = rowDragOverKey(item)
}

function onRowDrop(e: DragEvent, g: ProjectItemGroup, idx: number) {
  if (dragSectionId.value != null) {
    const sid = sectionIdForGroup(g)
    if (sid == null) return
    e.preventDefault()
    e.stopPropagation()
    void onSectionDropAt(sid, true)
    return
  }
  if (!props.enableItemDrag) return
  e.preventDefault()
  e.stopPropagation()
  onDropAt(g.key, idx)
}

function onRowDragLeave(e: DragEvent) {
  if (dragSectionId.value != null) {
    const el = e.currentTarget as HTMLElement
    const related = e.relatedTarget as Node | null
    if (related && el.contains(related)) return
    const group = el.parentElement?.parentElement?.parentElement
    if (related && group && group.contains(related)) return
    dragOver.value = null
    return
  }
  if (props.enableItemDrag) dragOver.value = null
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="g in groups"
      :key="g.key"
      class="relative space-y-2"
    >
      <div
        v-if="isSectionDragging && dragOver === `sec-before:${g.key}`"
        class="pointer-events-none absolute inset-x-0 -top-4 z-10 h-0.5 bg-primary"
      />
      <div
        v-if="isSectionDragging && dragOver === `sec-after:${g.key}`"
        class="pointer-events-none absolute inset-x-0 -bottom-4 z-10 h-0.5 bg-primary"
      />
      <template
        v-if="manageSectionsActive && sectionIdForGroup(g) != null"
      >
        <div
          class="group relative flex flex-wrap items-center gap-2 rounded-md px-0.5 py-0.5"
          @dragover="onSectionHeaderDragOver($event, g)"
          @dragleave="onSectionHeaderDragLeave"
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
            </h2>
            <span
              v-if="g.displayMode === 'progress'"
              class="shrink-0 text-xs tabular-nums text-muted"
            >{{ sectionProgressLabel(g) }}</span>
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
      <div
        v-else-if="g.key !== 'unsectioned'"
        class="flex flex-wrap items-baseline gap-2"
      >
        <h2 class="text-sm font-semibold text-foreground">
          {{ g.label }}
        </h2>
        <span
          v-if="g.displayMode === 'progress'"
          class="text-xs tabular-nums text-muted"
        >{{ sectionProgressLabel(g) }}</span>
      </div>

      <div
        v-show="g.key !== 'unsectioned' || g.items.length > 0 || showUnsectionedDropZone"
        class="overflow-hidden rounded-lg bg-surface"
        :class="[
          g.key === 'unsectioned' && g.items.length === 0
            ? 'border border-dashed border-border min-h-16'
            : 'border border-border',
          dragOver === `section:${g.key}` ? 'ring-1 ring-primary/40 border-primary' : '',
        ]"
        @dragover="onBodyDragOver($event, g)"
        @dragleave="onBodyDragLeave"
        @drop="onBodyDrop($event, g)"
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
            @dragover="onRowDragOver($event, item, g)"
            @dragleave="onRowDragLeave"
            @drop="onRowDrop($event, g, idx)"
          >
            <div
              v-if="enableItemDrag && !isSectionDragging && dragOver === rowDragOverKey(item)"
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
            v-if="g.items.length === 0 && g.key !== 'unsectioned'"
            class="px-3 py-8 text-center text-sm text-muted"
          >
            {{ emptyMessage || t('tasks.emptySection') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
