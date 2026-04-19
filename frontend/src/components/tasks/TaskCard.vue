<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/24/solid'
import { DocumentTextIcon, InformationCircleIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Task } from '@domain/task/types'
import { timeAgo } from '@infra/formatters/date'
import Badge from '../ui/UiBadge.vue'

const { t, locale } = useI18n()

const props = withDefaults(
  defineProps<{
    task: Task
    canEdit?: boolean
    /** When false but canChangeStatus is true, status-only was previously inline; modal handles permissions. */
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
  /** Открыть связанную заметку (первая из списка). */
  openNote: [payload: { noteId: number; projectId: number }]
}>()

const assigneeLabel = computed(() => {
  if (props.task.assignee) {
    return props.task.assignee.name || props.task.assignee.email
  }
  return t('common.unassigned')
})

const assigneeTitle = computed(() => {
  const a = props.task.assignee
  if (!a?.email) return undefined
  return a.name ? `${a.name} (${a.email})` : a.email
})

const isAssigneePlaceholder = computed(
  () => assigneeLabel.value === t('common.unassigned'),
)

const firstLinkedNote = computed(() => {
  const ln = props.task.linked_notes
  if (ln && ln.length > 0) return ln[0]
  return props.task.linked_note_preview ?? null
})

const extraLinkedNotes = computed(() => {
  const c = props.task.linked_notes_count
  if (typeof c === 'number' && c > 1) return c - 1
  const ln = props.task.linked_notes
  if (ln && ln.length > 1) return ln.length - 1
  return 0
})

function dueFromTask(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function onBodyClick() {
  emit('view', props.task.id)
}
</script>

<template>
  <div class="flex items-stretch gap-2.5 py-2">
    <div class="flex shrink-0 flex-col self-start pt-0.5">
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

    <div
      class="min-w-0 flex-1 cursor-pointer rounded-md transition-colors hover:bg-surface-muted/60"
      @click="onBodyClick"
    >
      <div class="flex items-center gap-2">
        <h3
          class="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
          :class="task.status === 'done' && 'text-muted line-through'"
        >
          {{ task.title }}
        </h3>
        <div class="flex shrink-0 items-center gap-1" @click.stop>
          <Badge kind="status" :value="task.status" />
          <Badge kind="priority" :value="task.priority" />
        </div>
      </div>
      <p
        v-if="task.description"
        class="mt-1 line-clamp-1 text-xs text-muted"
      >
        {{ task.description }}
      </p>
      <button
        v-if="firstLinkedNote"
        type="button"
        class="mt-1 flex max-w-full items-center gap-1.5 rounded-md py-0.5 text-left text-xs text-muted transition-colors hover:bg-surface-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-label="t('taskCard.linkedNotes.open', { title: firstLinkedNote.title })"
        @click.stop="
          emit('openNote', {
            noteId: firstLinkedNote.id,
            projectId: task.project_id,
          })
        "
      >
        <DocumentTextIcon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span class="min-w-0 truncate font-medium text-foreground">{{
          firstLinkedNote.title
        }}</span>
        <span
          v-if="extraLinkedNotes > 0"
          class="inline-flex shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-muted"
        >+{{ extraLinkedNotes }}</span>
      </button>
      <div
        class="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0 text-xs text-muted"
      >
        <span class="shrink-0">{{
          task.project?.name ??
            t('taskCard.meta.projectNum', { n: task.project_id })
        }}</span>
        <span class="shrink-0">·</span>
        <span class="shrink-0">{{
          t('taskCard.meta.updated', {
            time: timeAgo(task.updated_at, t, locale),
          })
        }}</span>
        <template v-if="task.due_date">
          <span class="shrink-0">·</span>
          <span class="shrink-0">{{
            t('taskCard.meta.due', { date: dueFromTask(task.due_date) })
          }}</span>
        </template>
      </div>
    </div>

    <div
      class="flex shrink-0 flex-row items-stretch self-stretch"
    >
      <div
        class="flex w-44 min-w-0 shrink-0 flex-col justify-center overflow-visible border-l border-border/50 px-2"
        :title="assigneeTitle"
        @click.stop
      >
        <span
          class="min-w-0 truncate text-xs leading-tight"
          :class="isAssigneePlaceholder ? 'text-muted' : 'text-foreground'"
        >
          {{ assigneeLabel }}
        </span>
      </div>
      <div
        class="flex shrink-0 flex-row items-center justify-center gap-0.5 self-stretch border-l border-border/50 pl-2"
        @click.stop
      >
        <button
          type="button"
          class="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :aria-label="t('taskCard.aria.view')"
          @click="emit('view', task.id)"
        >
          <InformationCircleIcon class="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          v-if="canOpenEditModal"
          type="button"
          class="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :aria-label="t('taskCard.aria.edit')"
          @click="emit('edit', task.id)"
        >
          <PencilSquareIcon class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>
