<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Note } from '@domain/note/types'
import type { ProjectSection } from '@domain/project/types'
import { useNoteStore, noteSectionGroupKey, extractNoteAxiosError } from '@app/note.store'
import { useToast } from '@app/composables/useToast'
import NoteCard from './NoteCard.vue'
import NoteInlineComposer from './NoteInlineComposer.vue'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{
  projectId: number
  sections: ProjectSection[]
  canManage: boolean
}>()

const emit = defineEmits<{
  view: [noteId: number]
  edit: [noteId: number]
  refreshed: []
}>()

const noteStore = useNoteStore()

type NoteGroup = { key: string; label: string; order: number; notes: Note[] }

const groups = computed((): NoteGroup[] => {
  const map = new Map<string, NoteGroup>()
  map.set('unsectioned', {
    key: 'unsectioned',
    label: t('notes.unsectioned'),
    order: -1,
    notes: [],
  })
  for (const s of [...props.sections].sort(
    (a, b) => a.position - b.position || a.id - b.id,
  )) {
    map.set(noteSectionGroupKey(s.id), {
      key: noteSectionGroupKey(s.id),
      label: s.name,
      order: s.position,
      notes: [],
    })
  }
  for (const n of noteStore.notes) {
    const key = noteSectionGroupKey(n.section_id)
    if (!map.has(key)) {
      map.set(key, {
        key,
        label:
          n.section_id != null
            ? t('notes.unknownSection', { id: n.section_id })
            : t('notes.unsectioned'),
        order: 9999,
        notes: [],
      })
    }
    map.get(key)!.notes.push(n)
  }
  return [...map.values()]
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map(g => ({
      ...g,
      notes: [...g.notes].sort(
        (a, b) => a.position - b.position || a.id - b.id,
      ),
    }))
})

const allNotes = computed(() => groups.value.flatMap(g => g.notes))

const dragNoteId = ref<number | null>(null)
const dragOver = ref<string | null>(null)
const dragSourceKey = ref<string | null>(null)

function canDragNote(_n: Note): boolean {
  return props.canManage
}

function onDragStart(e: DragEvent, n: Note, sourceKey: string) {
  if (!canDragNote(n)) {
    e.preventDefault()
    return
  }
  dragNoteId.value = n.id
  dragSourceKey.value = sourceKey
  e.dataTransfer?.setData('text/plain', String(n.id))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  dragNoteId.value = null
  dragOver.value = null
  dragSourceKey.value = null
}

function draggedNote(): Note | undefined {
  if (dragNoteId.value == null) return undefined
  return allNotes.value.find(n => n.id === dragNoteId.value)
}

async function onDropAt(destKey: string, destIndex: number) {
  const note = draggedNote()
  if (!note || !props.canManage) return

  const next = new Map<string, number[]>()
  for (const g of groups.value) {
    next.set(
      g.key,
      g.notes.map(n => n.id),
    )
  }

  const sourceKey = dragSourceKey.value ?? noteSectionGroupKey(note.section_id)
  const from = next.get(sourceKey)
  if (!from) return
  const i = from.indexOf(note.id)
  if (i >= 0) from.splice(i, 1)

  const to = next.get(destKey) ?? []
  const insertAt = Math.max(0, Math.min(destIndex, to.length))
  to.splice(insertAt, 0, note.id)
  next.set(destKey, to)

  const keys =
    sourceKey === destKey ? [destKey] : [destKey, sourceKey]

  try {
    await noteStore.reorderNotes(props.projectId, keys, next)
    emit('refreshed')
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, t('notes.reorderFailed')))
    await noteStore.fetchList(props.projectId, { quiet: true })
  } finally {
    onDragEnd()
  }
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="noteStore.loading" class="text-sm text-muted">
      {{ t('common.loading') }}
    </div>
    <template v-else>
      <div
        v-for="g in groups"
        :key="g.key"
        class="space-y-2"
      >
        <h2 class="text-sm font-semibold text-foreground">
          {{ g.label }}
          <span class="font-normal text-muted">({{ g.notes.length }})</span>
        </h2>

        <div
          class="overflow-hidden rounded-lg border border-border bg-surface"
          :class="
            dragOver === `section:${g.key}` ? 'ring-1 ring-primary/40 border-primary' : ''
          "
          @dragover.prevent="dragOver = `section:${g.key}`"
          @dragleave="dragOver = null"
          @drop.prevent="onDropAt(g.key, g.notes.length)"
        >
          <NoteInlineComposer
            v-if="canManage"
            :project-id="projectId"
            :sections="sections"
            :section-id="g.key === 'unsectioned' ? null : Number(g.key.slice(3))"
            :can-manage="canManage"
            @created="emit('refreshed')"
          />
          <div class="divide-y divide-border">
            <div
              v-for="(n, idx) in g.notes"
              :key="n.id"
              :draggable="canDragNote(n)"
              class="relative"
              @dragstart="onDragStart($event, n, g.key)"
              @dragend="onDragEnd"
              @dragover.prevent="dragOver = `note:${n.id}`"
              @dragleave="dragOver = null"
              @drop.stop.prevent="onDropAt(g.key, idx)"
            >
              <div
                v-if="dragOver === `note:${n.id}`"
                class="absolute inset-x-0 top-0 z-10 h-0.5 bg-primary"
              />
              <NoteCard
                variant="list"
                :note="n"
                :can-manage="canManage"
                @view="emit('view', $event)"
                @edit="emit('edit', $event)"
              />
            </div>
            <p
              v-if="g.notes.length === 0"
              class="px-3 py-6 text-center text-sm text-muted"
            >
              {{ t('notes.emptySection') }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
