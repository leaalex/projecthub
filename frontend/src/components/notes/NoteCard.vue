<script setup lang="ts">
import {
  DocumentTextIcon,
  InformationCircleIcon,
  PencilSquareIcon,
} from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Note } from '@domain/note/types'
import { noteBodyPlainPreview } from '@domain/note/preview'
import { formatDate } from '@infra/formatters/date'

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
    ? 'flex items-stretch gap-2.5 py-2'
    : 'flex items-stretch gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors hover:bg-surface-muted/30',
)

const emit = defineEmits<{
  view: [id: number]
  edit: [id: number]
}>()

const preview = computed(() => noteBodyPlainPreview(props.note.body ?? '', 140))

const linkedCount = computed(
  () => props.note.linked_task_ids?.length ?? 0,
)

const updatedLabel = computed(() =>
  formatDate(props.note.updated_at, locale.value),
)
</script>

<template>
  <div :class="rootClass">
    <div class="flex shrink-0 flex-col self-start pt-0.5">
      <DocumentTextIcon
        class="h-5 w-5 shrink-0 text-muted"
        aria-hidden="true"
      />
    </div>
    <button
      type="button"
      class="min-w-0 flex-1 text-left"
      @click="emit('view', note.id)"
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
    <div
      class="flex shrink-0 flex-row items-center justify-center gap-0.5 self-stretch border-l border-border/50 pl-2"
      @click.stop
    >
      <button
        type="button"
        class="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-label="t('taskCard.aria.view')"
        @click="emit('view', note.id)"
      >
        <InformationCircleIcon class="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        v-if="canManage"
        type="button"
        class="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-label="t('taskCard.aria.edit')"
        @click="emit('edit', note.id)"
      >
        <PencilSquareIcon class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
