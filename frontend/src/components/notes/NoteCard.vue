<script setup lang="ts">
import { DocumentTextIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/outline'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Note } from '@domain/note/types'
import { noteBodyPlainPreview } from '@domain/note/preview'
import { formatDate } from '@infra/formatters/date'
import UiMenuButton from '../ui/UiMenuButton.vue'

const { t, locale } = useI18n()

const props = withDefaults(
  defineProps<{
    note: Note
    canManage: boolean
    /** Вертикальный список: без скругления и без контура (рамки). */
    variant?: 'card' | 'list'
  }>(),
  { variant: 'card' },
)

const rootClass = computed(() =>
  props.variant === 'list'
    ? 'flex gap-3 rounded-none border-0 bg-transparent px-3 py-2.5 shadow-none transition-colors hover:bg-surface-muted/25'
    : 'flex gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors hover:bg-surface-muted/30',
)

const emit = defineEmits<{
  open: [id: number]
  edit: [id: number]
  remove: [id: number]
}>()

const preview = computed(() => noteBodyPlainPreview(props.note.body ?? '', 140))

const linkedCount = computed(
  () => props.note.linked_task_ids?.length ?? 0,
)

const updatedLabel = computed(() =>
  formatDate(props.note.updated_at, locale.value),
)

const menuVal = ref<string | number>('')
const menuOptions = computed(() => [
  { value: 'edit', label: t('common.edit') },
  { value: 'delete', label: t('common.delete') },
])

function onMenuSelect(v: string | number) {
  if (v === 'edit') emit('edit', props.note.id)
  if (v === 'delete') emit('remove', props.note.id)
  menuVal.value = ''
}
</script>

<template>
  <div :class="rootClass">
    <button
      type="button"
      class="min-w-0 flex-1 text-left"
      @click="emit('open', note.id)"
    >
      <div class="flex items-start justify-between gap-2">
        <span class="line-clamp-2 font-medium text-foreground">{{ note.title }}</span>
        <span class="shrink-0 text-xs text-muted">{{ updatedLabel }}</span>
      </div>
      <p v-if="preview" class="mt-1 line-clamp-2 text-xs text-muted">
        {{ preview }}
      </p>
      <div
        v-if="linkedCount > 0"
        class="mt-1.5 inline-flex items-center gap-1 text-xs text-muted"
      >
        <DocumentTextIcon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{{ t('notes.card.linkedTasks', { n: linkedCount }) }}</span>
      </div>
    </button>
    <div v-if="canManage" class="flex shrink-0 items-start">
      <UiMenuButton
        v-model="menuVal"
        :options="menuOptions"
        :ariaLabel="t('notes.card.noteActions')"
        placement="bottom-end"
        @select="onMenuSelect"
      >
        <EllipsisVerticalIcon class="h-5 w-5 text-muted" aria-hidden="true" />
      </UiMenuButton>
    </div>
  </div>
</template>
