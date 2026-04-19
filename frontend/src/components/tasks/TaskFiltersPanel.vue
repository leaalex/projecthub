<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiCard from '../ui/UiCard.vue'
import UiSegmentedControl from '../ui/UiSegmentedControl.vue'
import UiSelect from '../ui/UiSelect.vue'
import UiTextAction from '../ui/UiTextAction.vue'
import type { AssignableUserOption } from '@app/composables/useAdminAssignableUsers'
import type {
  AssigneeFilterValue,
  SortDir,
  TaskGroupBy,
  TaskSortKey,
} from '@app/composables/useTaskListPresentation'
import type { TaskPriority, TaskStatus } from '@domain/task/types'
import { taskPriorityLabel, taskStatusLabel } from '@infra/i18n/labels'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    projects: { id: number; name: string }[]
    assignableUsers: AssignableUserOption[]
    showAssigneeFilter?: boolean
    /** Hide project filter and “By project” grouping (single-project context). */
    hideProjectFilter?: boolean
    /** Hide “Group list only” (e.g. mixed project workspace is always by section). */
    hideGroupBy?: boolean
  }>(),
  {
    showAssigneeFilter: false,
    assignableUsers: () => [],
    hideProjectFilter: false,
    hideGroupBy: false,
  },
)

const emit = defineEmits<{
  reset: []
}>()

const filterProject = defineModel<number | ''>('filterProject', { default: '' })
const filterStatus = defineModel<TaskStatus[]>('filterStatus', { default: () => [] })
const clientPriority = defineModel<TaskPriority[]>('clientPriority', {
  default: () => [],
})
const assigneeFilter = defineModel<AssigneeFilterValue[]>('assigneeFilter', {
  default: () => [],
})
const sortKey = defineModel<TaskSortKey>('sortKey', {
  default: 'updated_at',
})
const sortDir = defineModel<SortDir>('sortDir', { default: 'desc' })
const groupBy = defineModel<TaskGroupBy>('groupBy', { default: 'none' })

watch(
  () => props.hideProjectFilter,
  (hide) => {
    if (hide && groupBy.value === 'project') groupBy.value = 'none'
  },
  { immediate: true },
)

const statusOptionsMulti = computed(() =>
  (['todo', 'in_progress', 'review', 'done'] as const).map((value) => ({
    value,
    label: taskStatusLabel(t, value),
  })),
)

const priorityOptionsMulti = computed(() =>
  (['low', 'medium', 'high', 'critical'] as const).map((value) => ({
    value,
    label: taskPriorityLabel(t, value),
  })),
)

const sortKeySegmented = computed<{ value: TaskSortKey; label: string }[]>(() =>
  (
    [
      'updated_at',
      'created_at',
      'title',
      'priority',
      'due_date',
    ] as const
  ).map((value) => ({
    value,
    label: t(`enums.sortKeys.${value}`),
  })),
)

const sortDirSegmented = computed<{ value: SortDir; label: string }[]>(() =>
  (['asc', 'desc'] as const).map((value) => ({
    value,
    label: t(`enums.sortDir.${value}`),
  })),
)

const groupByOptionsAll = computed<{ value: TaskGroupBy; label: string }[]>(() =>
  (
    [
      'none',
      'project',
      'section',
      'status',
      'priority',
      'assignee',
    ] as const
  ).map((value) => ({
    value,
    label: t(`enums.groupBy.${value}`),
  })),
)

const groupByOptions = computed(() =>
  props.hideProjectFilter
    ? groupByOptionsAll.value.filter((o) => o.value !== 'project')
    : groupByOptionsAll.value,
)

const projectSelectOptions = computed(() => [
  { value: '' as const, label: t('taskFiltersPanel.placeholders.allProjects') },
  ...props.projects.map((p) => ({ value: p.id, label: p.name })),
])

const assigneeSelectOptions = computed(() => {
  const base: { value: string | number; label: string }[] = [
    { value: 'unassigned', label: t('common.unassigned') },
  ]
  for (const u of props.assignableUsers) {
    base.push({
      value: u.id,
      label: u.name || u.email,
    })
  }
  return base
})

const filterGridClass = computed(() => {
  const cols =
    2 + (props.showAssigneeFilter ? 1 : 0) + (props.hideProjectFilter ? 0 : 1)
  if (cols >= 4) return 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4'
  if (cols === 3) return 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
  return 'grid gap-3 sm:grid-cols-2'
})

const clearBtnClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
</script>

<template>
  <UiCard padding="p-4 sm:p-5">
    <div class="space-y-4">
      <div :class="filterGridClass">
        <div v-if="!hideProjectFilter">
          <label class="mb-1 block text-xs font-medium text-foreground">{{
            t('taskFiltersPanel.labels.project')
          }}</label>
          <div class="flex min-w-0 items-start gap-1.5">
            <div class="min-w-0 flex-1">
              <UiSelect
                v-model="filterProject"
                filterable
                :placeholder="t('taskFiltersPanel.placeholders.allProjects')"
                :aria-label="t('taskFiltersPanel.aria.filterByProject')"
                :options="projectSelectOptions"
              />
            </div>
            <button
              v-if="filterProject !== ''"
              type="button"
              :class="clearBtnClass"
              :aria-label="t('taskFiltersPanel.aria.clearProject')"
              @click="filterProject = ''"
            >
              <XMarkIcon class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-foreground">{{
            t('taskFiltersPanel.labels.status')
          }}</label>
          <div class="flex min-w-0 items-start gap-1.5">
            <div class="min-w-0 flex-1">
              <UiSelect
                v-model="filterStatus"
                filterable
                multiple
                :placeholder="t('taskFiltersPanel.placeholders.allStatuses')"
                :aria-label="t('taskFiltersPanel.aria.filterByStatus')"
                :options="statusOptionsMulti"
              />
            </div>
            <button
              v-if="filterStatus.length > 0"
              type="button"
              :class="clearBtnClass"
              :aria-label="t('taskFiltersPanel.aria.clearStatus')"
              @click="filterStatus = []"
            >
              <XMarkIcon class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-foreground">{{
            t('taskFiltersPanel.labels.priority')
          }}</label>
          <div class="flex min-w-0 items-start gap-1.5">
            <div class="min-w-0 flex-1">
              <UiSelect
                v-model="clientPriority"
                filterable
                multiple
                :placeholder="t('taskFiltersPanel.placeholders.allPriorities')"
                :aria-label="t('taskFiltersPanel.aria.filterByPriority')"
                :options="priorityOptionsMulti"
              />
            </div>
            <button
              v-if="clientPriority.length > 0"
              type="button"
              :class="clearBtnClass"
              :aria-label="t('taskFiltersPanel.aria.clearPriority')"
              @click="clientPriority = []"
            >
              <XMarkIcon class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div v-if="showAssigneeFilter">
          <label class="mb-1 block text-xs font-medium text-foreground">{{
            t('taskFiltersPanel.labels.assignee')
          }}</label>
          <div class="flex min-w-0 items-start gap-1.5">
            <div class="min-w-0 flex-1">
              <UiSelect
                v-model="assigneeFilter"
                filterable
                multiple
                :placeholder="t('taskFiltersPanel.placeholders.allAssignees')"
                :aria-label="t('taskFiltersPanel.aria.filterByAssignee')"
                :options="assigneeSelectOptions"
              />
            </div>
            <button
              v-if="assigneeFilter.length > 0"
              type="button"
              :class="clearBtnClass"
              :aria-label="t('taskFiltersPanel.aria.clearAssignee')"
              @click="assigneeFilter = []"
            >
              <XMarkIcon class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div
        class="-mx-1 flex max-w-full flex-nowrap items-end gap-4 overflow-x-auto px-1 pb-0.5"
        role="group"
        :aria-label="t('taskFiltersPanel.aria.sortOrderGrouping')"
      >
        <div class="flex shrink-0 flex-col gap-1.5">
          <label class="block text-xs font-medium text-foreground">{{
            t('taskFiltersPanel.labels.sortBy')
          }}</label>
          <UiSegmentedControl
            v-model="sortKey"
            class="min-w-max"
            :aria-label="t('taskFiltersPanel.aria.sortTasksBy')"
            :options="sortKeySegmented"
          />
        </div>
        <div class="flex shrink-0 flex-col gap-1.5">
          <label class="block text-xs font-medium text-foreground">{{
            t('taskFiltersPanel.labels.order')
          }}</label>
          <UiSegmentedControl
            v-model="sortDir"
            :aria-label="t('taskFiltersPanel.aria.sortOrder')"
            :options="sortDirSegmented"
          />
        </div>
        <div v-if="!hideGroupBy" class="flex shrink-0 flex-col gap-1.5">
          <label class="block text-xs font-medium text-foreground">{{
            t('taskFiltersPanel.labels.groupListOnly')
          }}</label>
          <UiSegmentedControl
            v-model="groupBy"
            class="min-w-max"
            :aria-label="t('taskFiltersPanel.aria.groupTasks')"
            :options="groupByOptions"
          />
        </div>
      </div>

      <div class="flex justify-start pt-1">
        <UiTextAction type="button" @click="emit('reset')">
          {{ t('taskFiltersPanel.reset') }}
        </UiTextAction>
      </div>
    </div>
  </UiCard>
</template>
