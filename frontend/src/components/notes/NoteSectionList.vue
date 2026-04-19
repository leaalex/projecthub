<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NoteSection } from '@domain/note/types'
import { useNoteStore, extractNoteAxiosError } from '@app/note.store'
import Button from '../ui/UiButton.vue'
import UiInput from '../ui/UiInput.vue'
import { useToast } from '@app/composables/useToast'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{
  projectId: number
  canManage: boolean
}>()

const emit = defineEmits<{
  updated: []
}>()

const noteStore = useNoteStore()

const adding = ref(false)
const newName = ref('')
const saving = ref(false)
const renamingId = ref<number | null>(null)
const renameDraft = ref('')

const dragSectionId = ref<number | null>(null)
const dragOver = ref<number | null>(null)

const sorted = computed(() =>
  [...noteStore.sections].sort((a, b) => a.position - b.position || a.id - b.id),
)

watch(
  () => props.projectId,
  id => {
    if (id > 0) void noteStore.fetchSections(id, { quiet: true })
  },
  { immediate: true },
)

async function createSection() {
  const name = newName.value.trim()
  if (!name || !props.canManage) return
  saving.value = true
  try {
    await noteStore.createSection(props.projectId, name)
    newName.value = ''
    adding.value = false
    toast.success(t('notes.section.created'))
    emit('updated')
  } catch (e) {
    toast.error(extractNoteAxiosError(e, t('notes.section.createFailed')))
  } finally {
    saving.value = false
  }
}

function startRename(s: NoteSection) {
  renamingId.value = s.id
  renameDraft.value = s.name
}

async function commitRename() {
  const id = renamingId.value
  if (id == null) return
  const name = renameDraft.value.trim()
  if (!name) return
  try {
    await noteStore.renameSection(props.projectId, id, name)
    renamingId.value = null
    toast.success(t('notes.section.renamed'))
    emit('updated')
  } catch (e) {
    toast.error(extractNoteAxiosError(e, t('notes.section.renameFailed')))
  }
}

async function removeSection(s: NoteSection) {
  if (!props.canManage) return
  try {
    await noteStore.removeSection(props.projectId, s.id)
    toast.success(t('notes.section.removed'))
    emit('updated')
  } catch (e) {
    toast.error(extractNoteAxiosError(e, t('notes.section.removeFailed')))
  }
}

function onDragStart(e: DragEvent, s: NoteSection) {
  if (!props.canManage) {
    e.preventDefault()
    return
  }
  dragSectionId.value = s.id
  e.dataTransfer?.setData('text/plain', String(s.id))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  dragSectionId.value = null
  dragOver.value = null
}

async function onDropAt(targetIndex: number) {
  const id = dragSectionId.value
  if (id == null || !props.canManage) {
    onDragEnd()
    return
  }
  const order = sorted.value.map(s => s.id)
  const from = order.indexOf(id)
  if (from < 0) {
    onDragEnd()
    return
  }
  order.splice(from, 1)
  const insertAt = Math.max(0, Math.min(targetIndex, order.length))
  order.splice(insertAt, 0, id)
  try {
    await noteStore.reorderSections(props.projectId, order)
    emit('updated')
  } catch (e) {
    toast.error(extractNoteAxiosError(e, t('notes.section.reorderFailed')))
  } finally {
    onDragEnd()
  }
}
</script>

<template>
  <div class="rounded-lg border border-border bg-surface p-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-sm font-semibold text-foreground">
        {{ t('notes.section.heading') }}
      </h3>
      <Button
        v-if="canManage"
        type="button"
        variant="secondary"
        @click="adding = !adding"
      >
        {{ adding ? t('common.cancel') : t('notes.section.add') }}
      </Button>
    </div>
    <div
      v-if="adding && canManage"
      class="mt-3 flex flex-wrap items-center gap-2"
    >
      <UiInput
        v-model="newName"
        class="min-w-[12rem] flex-1"
        :placeholder="t('notes.section.namePlaceholder')"
        @keydown.enter.prevent="createSection"
      />
      <Button type="button" :loading="saving" @click="createSection">
        {{ t('common.create') }}
      </Button>
    </div>
    <ul class="mt-3 divide-y divide-border rounded-md border border-border">
      <li
        v-for="(s, idx) in sorted"
        :key="s.id"
        :draggable="canManage"
        class="flex flex-wrap items-center gap-2 bg-surface px-2 py-2"
        @dragstart="onDragStart($event, s)"
        @dragend="onDragEnd"
        @dragover.prevent="dragOver = s.id"
        @drop.prevent="onDropAt(idx)"
      >
        <div
          v-if="dragOver === s.id && dragSectionId != null && dragSectionId !== s.id"
          class="h-0.5 w-full bg-primary"
        />
        <template v-if="renamingId === s.id">
          <UiInput
            v-model="renameDraft"
            class="min-w-[8rem] flex-1"
            @keydown.enter.prevent="commitRename"
          />
          <Button type="button" @click="commitRename">
            {{ t('common.save') }}
          </Button>
          <Button
            type="button"
            variant="secondary"
            @click="renamingId = null"
          >
            {{ t('common.cancel') }}
          </Button>
        </template>
        <template v-else>
          <span class="min-w-0 flex-1 truncate text-sm text-foreground">{{
            s.name
          }}</span>
          <div v-if="canManage" class="flex shrink-0 gap-1">
            <Button type="button" variant="ghost" @click="startRename(s)">
              {{ t('common.edit') }}
            </Button>
            <Button
              type="button"
              variant="ghost-danger"
              @click="removeSection(s)"
            >
              {{ t('common.delete') }}
            </Button>
          </div>
        </template>
      </li>
      <li
        v-if="sorted.length === 0"
        class="px-3 py-4 text-center text-sm text-muted"
      >
        {{ t('notes.section.empty') }}
      </li>
    </ul>
  </div>
</template>
