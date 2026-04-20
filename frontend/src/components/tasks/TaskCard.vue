<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/24/solid'
import { PencilSquareIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Task } from '@domain/task/types'
import { formatDate } from '@infra/formatters/date'

const { t, locale } = useI18n()

const props = withDefaults(
  defineProps<{
    task: Task
    canEdit?: boolean
    /** When false but canChangeStatus is true, modal handles permissions. */
    canChangeStatus?: boolean
  }>(),
  {
    canEdit: false,
    canChangeStatus: undefined,
  },
)

const canChangeStatusEff = computed(
  () => props.canChangeStatus ?? props.canEdit,
)

const canOpenEditModal = computed(
  () => props.canEdit || canChangeStatusEff.value,
)

const emit = defineEmits<{
  complete: [id: number]
  reopen: [id: number]
  /** Open task detail modal (read-only). */
  view: [id: number]
  /** Open task detail modal in edit mode. */
  edit: [id: number]
}>()

const updatedLabel = computed(() =>
  formatDate(props.task.updated_at, locale.value),
)
</script>

<template>
  <div
    class="group flex cursor-pointer items-center gap-2.5 rounded-md py-2 transition-colors hover:bg-surface-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    role="button"
    tabindex="0"
    :aria-label="task.title"
    @click="emit('view', task.id)"
    @keydown.enter.prevent="emit('view', task.id)"
    @keydown.space.prevent="emit('view', task.id)"
  >
    <div v-if="canChangeStatusEff" class="flex shrink-0 flex-col self-center">
      <button
        v-if="task.status !== 'done'"
        type="button"
        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/45 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-label="t('taskCard.aria.markDone')"
        @click.stop="emit('complete', task.id)"
      />
      <button
        v-else
        type="button"
        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-emerald-500"
        :aria-label="t('taskCard.aria.markNotDone')"
        @click.stop="emit('reopen', task.id)"
      >
        <CheckIcon class="h-3 w-3 text-white" aria-hidden="true" />
      </button>
    </div>

    <span
      class="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground"
      :class="task.status === 'done' && 'text-muted line-through'"
    >
      {{ task.title }}
    </span>

    <span class="shrink-0 text-xs text-muted">{{ updatedLabel }}</span>

    <div
      v-if="canOpenEditModal"
      class="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 has-[:focus-visible]:opacity-100"
      @click.stop
    >
      <button
        type="button"
        class="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-label="t('taskCard.aria.edit')"
        @click.stop="emit('edit', task.id)"
      >
        <PencilSquareIcon class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
