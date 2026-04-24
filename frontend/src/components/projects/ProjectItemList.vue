<script setup lang="ts">
import { PencilSquareIcon } from '@heroicons/vue/24/outline'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DraggableEvent } from 'vue-draggable-plus'
import { VueDraggable } from 'vue-draggable-plus'
import type { ProjectItemGroup, WorkspaceItem } from '@app/composables/useProjectItemsPresentation'
import type { SectionDisplayMode } from '@domain/project/types'
import { useProjectStore } from '@app/project.store'
import { extractNoteAxiosError } from '@app/note.store'
import type { Note } from '@domain/note/types'
import type { Task } from '@domain/task/types'
import { COMMON_DND_OPTIONS } from '@/shared/dnd/draggableDefaults'
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

const manageSectionsActive = computed(
  () =>
    props.canManageSections
    && Number.isFinite(props.projectId)
    && props.projectId > 0,
)

/** Копия элементов по ключу группы; Sortable кросс-листовый v-model. */
const localItems = ref<Record<string, WorkspaceItem[]>>({})

/** Только `s-*`, порядок = порядок секций на экране (при canManageSections). */
const sectionOrder = ref<ProjectItemGroup[]>([])

function rebuildLocalItemsFromProps() {
  const groups = props.groups
  const li: Record<string, WorkspaceItem[]> = {}
  for (const g of groups) {
    li[g.key] = g.items.slice()
  }
  localItems.value = li
  sectionOrder.value = groups
    .filter((g) => g.key.startsWith('s-'))
    .map((g) => ({ ...g }))
}

watch(
  () => props.groups,
  () => {
    rebuildLocalItemsFromProps()
  },
  { immediate: true, deep: true },
)

const unsectionedGroup = computed(() =>
  props.groups.find((g) => g.key === 'unsectioned'),
)

const itemGroup = {
  name: 'projectItems' as const,
  pull: ['projectItems' as const],
  put: ['projectItems' as const],
}
const sectionGroup = {
  name: 'projectSections' as const,
  pull: ['projectSections' as const],
  put: ['projectSections' as const],
}

const sectionDndOptions = {
  ...COMMON_DND_OPTIONS,
  /** Без dnd-chosen: не показывать primary ring при выборе секции (только reorder заголовков). */
  chosenClass: 'dnd-chosen-section',
  handle: '.section-drag-handle',
  group: sectionGroup,
  onMove(e: { to: HTMLElement }) {
    return (e.to as HTMLElement).dataset.dndList === 'sections'
  },
}

const itemDndOptions = {
  ...COMMON_DND_OPTIONS,
  handle: '.item-drag-handle',
  group: itemGroup,
  onMove(e: { to: HTMLElement }) {
    return (e.to as HTMLElement).dataset.dndList === 'items'
  },
}

function parseSectionKey(key: string): number | null {
  if (key === 'unsectioned') {
    return null
  }
  if (key.startsWith('s-')) {
    const n = Number(key.slice(2))
    return Number.isFinite(n) ? n : null
  }
  return null
}

function canDragTask(task: Task): boolean {
  if (!props.enableItemDrag) {
    return false
  }
  return props.canEditTask?.(task) ?? false
}

function canDragNote(_note: Note): boolean {
  if (!props.enableItemDrag) {
    return false
  }
  return props.canManageNote
}

function itemRowIsDraggable(item: WorkspaceItem): boolean {
  return item.kind === 'task'
    ? canDragTask(item.task)
    : canDragNote(item.note)
}

function listForGroup(g: ProjectItemGroup): WorkspaceItem[] {
  return localItems.value[g.key] ?? []
}

function setGroupItems(key: string, v: WorkspaceItem[]) {
  localItems.value = { ...localItems.value, [key]: v }
}

async function onSectionsEnd(evt: DraggableEvent<ProjectItemGroup>) {
  if (evt.oldIndex === evt.newIndex) {
    return
  }
  const pid = props.projectId
  if (!manageSectionsActive.value || pid <= 0) {
    return
  }
  const ids = sectionOrder.value
    .map((g) => sectionIdForGroup(g))
    .filter((x): x is number => x != null)
  try {
    await projectStore.reorderSections(pid, ids)
    emit('sectionsUpdated')
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, 'project.section.reorderFailed'))
  }
}

function onItemEnd(evt: DraggableEvent<WorkspaceItem>) {
  if (!props.enableItemDrag) {
    return
  }
  if (evt.from === evt.to && evt.oldIndex === evt.newIndex) {
    return
  }
  if ((evt.to as HTMLElement).dataset.dndList !== 'items') {
    void nextTick(rebuildLocalItemsFromProps)
    return
  }
  const el = evt.item
  const kind = el.dataset.itemKind as 'task' | 'note' | undefined
  const idRaw = el.dataset.itemId
  if (kind == null || idRaw == null) {
    void nextTick(rebuildLocalItemsFromProps)
    return
  }
  const id = Number(idRaw)
  const to = (evt.to as Element).closest?.('[data-section-key]') as
    | HTMLElement
    | null
  const sectionKey = to?.dataset.sectionKey
  if (sectionKey == null) {
    void nextTick(rebuildLocalItemsFromProps)
    return
  }
  const sectionId = parseSectionKey(sectionKey)
  const position = evt.newIndex ?? 0
  emit('move', { kind, id, sectionId, position })
}

function openSectionEdit(g: ProjectItemGroup) {
  const sid = sectionIdForGroup(g)
  if (sid == null) {
    return
  }
  emit('editSection', { sectionId: sid, name: g.label, displayMode: g.displayMode })
}

function sectionTaskProgress(g: ProjectItemGroup): { done: number, total: number } {
  const items = listForGroup(g)
  const tasks = items.filter((i): i is { kind: 'task', task: Task } => i.kind === 'task')
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

function showGroupBody(g: ProjectItemGroup): boolean {
  return g.key !== 'unsectioned'
    || listForGroup(g).length > 0
    || props.enableItemDrag
}
</script>

<template>
  <div class="space-y-4">
    <template v-if="manageSectionsActive">
      <div
        v-if="unsectionedGroup"
        :key="unsectionedGroup.key"
        class="relative space-y-2"
      >
        <div
          v-show="showGroupBody(unsectionedGroup)"
          class="overflow-hidden rounded-lg bg-surface"
          :class="[
            unsectionedGroup.key === 'unsectioned' && listForGroup(unsectionedGroup).length === 0
              ? 'border border-dashed border-border'
              : 'border border-border',
          ]"
        >
          <div
            :data-section-key="unsectionedGroup.key"
            class="relative min-h-12"
          >
            <VueDraggable
              :model-value="listForGroup(unsectionedGroup)"
              data-dnd-list="items"
              tag="div"
              class="min-h-12 divide-y divide-border"
              v-bind="itemDndOptions"
              :disabled="!enableItemDrag"
              @update:model-value="setGroupItems(unsectionedGroup.key, $event)"
              @end="onItemEnd"
            >
              <div
                v-for="item in listForGroup(unsectionedGroup)"
                :key="item.kind === 'task' ? `t-${item.task.id}` : `n-${item.note.id}`"
                class="relative"
                :data-item-kind="item.kind"
                :data-item-id="item.kind === 'task' ? item.task.id : item.note.id"
              >
                <div
                  :class="itemRowIsDraggable(item) ? 'item-drag-handle' : ''"
                  class="relative"
                >
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
              </div>
            </VueDraggable>
          </div>
        </div>
      </div>

      <VueDraggable
        v-model="sectionOrder"
        data-dnd-list="sections"
        v-bind="sectionDndOptions"
        :disabled="!manageSectionsActive"
        tag="div"
        class="space-y-4"
        @end="onSectionsEnd"
      >
        <div
          v-for="g in sectionOrder"
          :key="g.key"
          class="relative space-y-2"
          :data-section-key="g.key"
        >
          <div
            v-if="sectionIdForGroup(g) != null"
            class="group relative flex flex-wrap items-center gap-2 rounded-md px-0.5 py-0.5"
          >
            <div
              class="section-drag-handle flex min-w-0 flex-1 touch-none cursor-grab items-baseline gap-1.5 text-sm font-semibold text-foreground active:cursor-grabbing"
            >
              <span
                class="shrink-0 select-none text-muted"
                aria-hidden="true"
              >⠿</span>
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
              data-no-dnd
            >
              <Button
                type="button"
                variant="ghost"
                class="h-8 min-h-8 w-8 min-w-8 !px-0"
                :aria-label="t('project.section.editSectionAria')"
                :title="t('common.edit')"
                @click="openSectionEdit(g)"
              >
                <PencilSquareIcon
                  class="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>

          <div
            v-show="showGroupBody(g)"
            class="overflow-hidden rounded-lg border border-border bg-surface"
          >
            <div
              :data-section-key="g.key"
              class="relative min-h-12"
            >
              <VueDraggable
                :model-value="listForGroup(g)"
                data-dnd-list="items"
                tag="div"
                class="min-h-12 divide-y divide-border"
                v-bind="itemDndOptions"
                :disabled="!enableItemDrag"
                @update:model-value="setGroupItems(g.key, $event)"
                @end="onItemEnd"
              >
                <div
                  v-for="item in listForGroup(g)"
                  :key="item.kind === 'task' ? `t-${item.task.id}` : `n-${item.note.id}`"
                  class="relative"
                  :data-item-kind="item.kind"
                  :data-item-id="item.kind === 'task' ? item.task.id : item.note.id"
                >
                  <div
                    :class="itemRowIsDraggable(item) ? 'item-drag-handle' : ''"
                    class="relative"
                  >
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
                </div>
              </VueDraggable>
              <div
                v-if="listForGroup(g).length === 0"
                class="pointer-events-none absolute inset-0 flex items-center justify-center px-3 text-center text-sm text-muted"
              >
                {{ emptyMessage || t('tasks.emptySection') }}
              </div>
            </div>
          </div>
        </div>
      </VueDraggable>
    </template>

    <template v-else>
      <div
        v-for="g in groups"
        :key="g.key"
        class="relative space-y-2"
      >
        <div
          v-if="g.key !== 'unsectioned'"
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
          v-show="showGroupBody(g)"
          class="overflow-hidden rounded-lg bg-surface"
          :class="[
            g.key === 'unsectioned' && listForGroup(g).length === 0
              ? 'border border-dashed border-border'
              : 'border border-border',
          ]"
        >
          <div
            :data-section-key="g.key"
            class="relative min-h-12"
          >
            <VueDraggable
              :model-value="listForGroup(g)"
              data-dnd-list="items"
              tag="div"
              class="min-h-12 divide-y divide-border"
              v-bind="itemDndOptions"
              :disabled="!enableItemDrag"
              @update:model-value="setGroupItems(g.key, $event)"
              @end="onItemEnd"
            >
              <div
                v-for="item in listForGroup(g)"
                :key="item.kind === 'task' ? `t-${item.task.id}` : `n-${item.note.id}`"
                class="relative"
                :data-item-kind="item.kind"
                :data-item-id="item.kind === 'task' ? item.task.id : item.note.id"
              >
                <div
                  :class="itemRowIsDraggable(item) ? 'item-drag-handle' : ''"
                  class="relative"
                >
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
              </div>
            </VueDraggable>
            <div
              v-if="listForGroup(g).length === 0 && g.key !== 'unsectioned'"
              class="pointer-events-none absolute inset-0 flex items-center justify-center px-3 text-center text-sm text-muted"
            >
              {{ emptyMessage || t('tasks.emptySection') }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
