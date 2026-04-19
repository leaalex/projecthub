<script setup lang="ts">
import { DocumentTextIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Note } from '@domain/note/types'
import { formatDate } from '@infra/formatters/date'

const { t, locale } = useI18n()

const props = defineProps<{
  note: Note
  canManage: boolean
}>()

const emit = defineEmits<{
  view: [id: number]
  edit: [id: number]
}>()

const updatedLabel = computed(() =>
  formatDate(props.note.updated_at, locale.value),
)
</script>

<template>
  <div class="group flex items-center gap-2.5 py-2">
    <DocumentTextIcon
      class="h-5 w-5 shrink-0 text-muted"
      aria-hidden="true"
    />
    <button
      type="button"
      class="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-muted/60 rounded-md px-0.5 -mx-0.5"
      @click="emit('view', note.id)"
    >
      {{ note.title }}
    </button>
    <span class="shrink-0 text-xs text-muted">{{ updatedLabel }}</span>
    <div
      v-if="canManage"
      class="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      @click.stop
    >
      <button
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
