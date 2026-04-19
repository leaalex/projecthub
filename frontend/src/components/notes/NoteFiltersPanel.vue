<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiCard from '../ui/UiCard.vue'
import UiSegmentedControl from '../ui/UiSegmentedControl.vue'
import UiSelect from '../ui/UiSelect.vue'
import UiTextAction from '../ui/UiTextAction.vue'
import type {
  NoteGroupBy,
  NoteSortKey,
  SortDir,
} from '@app/composables/useNoteListPresentation'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    projects: { id: number; name: string }[]
    /** Если false, убрать группировку по секции (не выбран один проект). */
    allowSectionGroup?: boolean
  }>(),
  { allowSectionGroup: true },
)

const emit = defineEmits<{
  reset: []
}>()

const filterProject = defineModel<number | ''>('filterProject', { default: '' })
const sortKey = defineModel<NoteSortKey>('sortKey', { default: 'updated_at' })
const sortDir = defineModel<SortDir>('sortDir', { default: 'desc' })
const groupBy = defineModel<NoteGroupBy>('groupBy', { default: 'project' })

watch(
  () => props.allowSectionGroup,
  allow => {
    if (!allow && groupBy.value === 'section') groupBy.value = 'project'
  },
  { immediate: true },
)

const projectSelectOptions = computed(() => [
  { value: '' as const, label: t('notes.filters.allProjects') },
  ...props.projects.map(p => ({ value: p.id, label: p.name })),
])

const sortKeySegmented = computed<{ value: NoteSortKey; label: string }[]>(() => [
  { value: 'updated_at', label: t('notes.filters.sortUpdated') },
  { value: 'title', label: t('notes.filters.sortTitle') },
])

const sortDirSegmented = computed<{ value: SortDir; label: string }[]>(() =>
  (['asc', 'desc'] as const).map(value => ({
    value,
    label: t(`enums.sortDir.${value}`),
  })),
)

const groupBySegmented = computed<{ value: NoteGroupBy; label: string }[]>(() => {
  const all: { value: NoteGroupBy; label: string }[] = [
    { value: 'none', label: t('notes.filters.groupNone') },
    { value: 'project', label: t('notes.filters.groupProject') },
    { value: 'section', label: t('notes.filters.groupSection') },
  ]
  return props.allowSectionGroup ? all : all.filter(o => o.value !== 'section')
})

const clearBtnClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
</script>

<template>
  <UiCard padding="p-4 sm:p-5">
    <div class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs font-medium text-foreground">{{
            t('notes.filters.project')
          }}</label>
          <div class="flex min-w-0 items-start gap-1.5">
            <div class="min-w-0 flex-1">
              <UiSelect
                v-model="filterProject"
                filterable
                :placeholder="t('notes.filters.allProjects')"
                :aria-label="t('notes.filters.aria.project')"
                :options="projectSelectOptions"
              />
            </div>
            <button
              v-if="filterProject !== ''"
              type="button"
              :class="clearBtnClass"
              :aria-label="t('notes.filters.aria.clearProject')"
              @click="filterProject = ''"
            >
              <XMarkIcon class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div
        class="-mx-1 flex max-w-full flex-nowrap items-end gap-4 overflow-x-auto px-1 pb-0.5"
        role="group"
        :aria-label="t('notes.filters.aria.sortGroup')"
      >
        <div class="flex shrink-0 flex-col gap-1.5">
          <label class="block text-xs font-medium text-foreground">{{
            t('notes.filters.sortBy')
          }}</label>
          <UiSegmentedControl
            v-model="sortKey"
            class="min-w-max"
            :aria-label="t('notes.filters.aria.sortBy')"
            :options="sortKeySegmented"
          />
        </div>
        <div class="flex shrink-0 flex-col gap-1.5">
          <label class="block text-xs font-medium text-foreground">{{
            t('taskFiltersPanel.labels.order')
          }}</label>
          <UiSegmentedControl
            v-model="sortDir"
            :aria-label="t('notes.filters.aria.sortDir')"
            :options="sortDirSegmented"
          />
        </div>
        <div class="flex shrink-0 flex-col gap-1.5">
          <label class="block text-xs font-medium text-foreground">{{
            t('notes.filters.groupBy')
          }}</label>
          <UiSegmentedControl
            v-model="groupBy"
            class="min-w-max"
            :aria-label="t('notes.filters.aria.groupBy')"
            :options="groupBySegmented"
          />
        </div>
      </div>

      <div class="flex justify-start pt-1">
        <UiTextAction type="button" @click="emit('reset')">
          {{ t('notes.filters.reset') }}
        </UiTextAction>
      </div>
    </div>
  </UiCard>
</template>
