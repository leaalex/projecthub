<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { computed, watch } from 'vue'
import UiCard from '../ui/UiCard.vue'
import UiSegmentedControl from '../ui/UiSegmentedControl.vue'
import UiSelect from '../ui/UiSelect.vue'
import UiTextAction from '../ui/UiTextAction.vue'
import type { AssignableUserOption } from '../../composables/useAdminAssignableUsers'
import type {
  AssigneeFilterValue,
  SortDir,
  TaskGroupBy,
  TaskSortKey,
} from '../../composables/useTaskListPresentation'
import type { TaskPriority, TaskStatus } from '../../types/task'

const props = withDefaults(
  defineProps<{
    projects: { id: number; name: string }[]
    assignableUsers: AssignableUserOption[]
    showAssigneeFilter?: boolean
    /** Hide project filter and “By project” grouping (single-project context). */
    hideProjectFilter?: boolean
  }>(),
  {
    showAssigneeFilter: false,
    assignableUsers: () => [],
    hideProjectFilter: false,
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

const statusOptionsMulti = [
  { value: 'todo' as const, label: 'To do' },
  { value: 'in_progress' as const, label: 'In progress' },
  { value: 'review' as const, label: 'Review' },
  { value: 'done' as const, label: 'Done' },
]

const priorityOptionsMulti = [
  { value: 'low' as const, label: 'Low' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'high' as const, label: 'High' },
  { value: 'critical' as const, label: 'Critical' },
]

const sortKeySegmented: { value: TaskSortKey; label: string }[] = [
  { value: 'updated_at', label: 'Updated' },
  { value: 'created_at', label: 'Created' },
  { value: 'title', label: 'Title' },
  { value: 'priority', label: 'Priority' },
  { value: 'due_date', label: 'Due date' },
]

const sortDirSegmented: { value: SortDir; label: string }[] = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
]

const groupByOptionsAll: { value: TaskGroupBy; label: string }[] = [
  { value: 'none', label: 'No grouping' },
  { value: 'project', label: 'By project' },
  { value: 'section', label: 'By section' },
  { value: 'status', label: 'By status' },
  { value: 'priority', label: 'By priority' },
  { value: 'assignee', label: 'By assignee' },
]

const groupByOptions = computed(() =>
  props.hideProjectFilter
    ? groupByOptionsAll.filter((o) => o.value !== 'project')
    : groupByOptionsAll,
)

const projectSelectOptions = computed(() => [
  { value: '' as const, label: 'All projects' },
  ...props.projects.map((p) => ({ value: p.id, label: p.name })),
])

const assigneeSelectOptions = computed(() => {
  const base: { value: string | number; label: string }[] = [
    { value: 'unassigned', label: 'Unassigned' },
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
          <label class="mb-1 block text-xs font-medium text-foreground">Project</label>
          <div class="flex min-w-0 items-start gap-1.5">
            <div class="min-w-0 flex-1">
              <UiSelect
                v-model="filterProject"
                filterable
                placeholder="All projects"
                aria-label="Filter by project"
                :options="projectSelectOptions"
              />
            </div>
            <button
              v-if="filterProject !== ''"
              type="button"
              :class="clearBtnClass"
              aria-label="Clear project filter"
              @click="filterProject = ''"
            >
              <XMarkIcon class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-foreground">Status</label>
          <div class="flex min-w-0 items-start gap-1.5">
            <div class="min-w-0 flex-1">
              <UiSelect
                v-model="filterStatus"
                filterable
                multiple
                placeholder="All statuses"
                aria-label="Filter by status"
                :options="statusOptionsMulti"
              />
            </div>
            <button
              v-if="filterStatus.length > 0"
              type="button"
              :class="clearBtnClass"
              aria-label="Clear status filter"
              @click="filterStatus = []"
            >
              <XMarkIcon class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-foreground">Priority</label>
          <div class="flex min-w-0 items-start gap-1.5">
            <div class="min-w-0 flex-1">
              <UiSelect
                v-model="clientPriority"
                filterable
                multiple
                placeholder="All priorities"
                aria-label="Filter by priority"
                :options="priorityOptionsMulti"
              />
            </div>
            <button
              v-if="clientPriority.length > 0"
              type="button"
              :class="clearBtnClass"
              aria-label="Clear priority filter"
              @click="clientPriority = []"
            >
              <XMarkIcon class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div v-if="showAssigneeFilter">
          <label class="mb-1 block text-xs font-medium text-foreground">Assignee</label>
          <div class="flex min-w-0 items-start gap-1.5">
            <div class="min-w-0 flex-1">
              <UiSelect
                v-model="assigneeFilter"
                filterable
                multiple
                placeholder="All assignees"
                aria-label="Filter by assignee"
                :options="assigneeSelectOptions"
              />
            </div>
            <button
              v-if="assigneeFilter.length > 0"
              type="button"
              :class="clearBtnClass"
              aria-label="Clear assignee filter"
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
        aria-label="Sort, order, and grouping"
      >
        <div class="flex shrink-0 flex-col gap-1.5">
          <label class="block text-xs font-medium text-foreground">Sort by</label>
          <UiSegmentedControl
            v-model="sortKey"
            class="min-w-max"
            aria-label="Sort tasks by"
            :options="sortKeySegmented"
          />
        </div>
        <div class="flex shrink-0 flex-col gap-1.5">
          <label class="block text-xs font-medium text-foreground">Order</label>
          <UiSegmentedControl
            v-model="sortDir"
            aria-label="Sort order"
            :options="sortDirSegmented"
          />
        </div>
        <div class="flex shrink-0 flex-col gap-1.5">
          <label class="block text-xs font-medium text-foreground">Group (list only)</label>
          <UiSegmentedControl
            v-model="groupBy"
            class="min-w-max"
            aria-label="Group tasks"
            :options="groupByOptions"
          />
        </div>
      </div>

      <div class="flex justify-start pt-1">
        <UiTextAction type="button" @click="emit('reset')">
          Reset filters
        </UiTextAction>
      </div>
    </div>
  </UiCard>
</template>
