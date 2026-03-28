<script setup lang="ts">
import { computed } from 'vue'
import UiCard from '../ui/UiCard.vue'
import UiInput from '../ui/UiInput.vue'
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
  }>(),
  { showAssigneeFilter: false, assignableUsers: () => [] },
)

const emit = defineEmits<{
  reset: []
}>()

const taskView = defineModel<'list' | 'board'>('taskView', { default: 'list' })
const filterProject = defineModel<number | ''>('filterProject', { default: '' })
const filterStatus = defineModel<TaskStatus | ''>('filterStatus', { default: '' })
const searchQuery = defineModel<string>('searchQuery', { default: '' })
const clientPriority = defineModel<TaskPriority | ''>('clientPriority', {
  default: '',
})
const assigneeFilter = defineModel<AssigneeFilterValue>('assigneeFilter', {
  default: '',
})
const sortKey = defineModel<TaskSortKey>('sortKey', {
  default: 'updated_at',
})
const sortDir = defineModel<SortDir>('sortDir', { default: 'desc' })
const groupBy = defineModel<TaskGroupBy>('groupBy', { default: 'none' })

const viewModeOptions = [
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board' },
]

const statusOptions = [
  { value: '' as const, label: 'All statuses' },
  { value: 'todo' as const, label: 'To do' },
  { value: 'in_progress' as const, label: 'In progress' },
  { value: 'review' as const, label: 'Review' },
  { value: 'done' as const, label: 'Done' },
]

const priorityClientOptions = [
  { value: '' as const, label: 'All priorities' },
  { value: 'low' as const, label: 'Low' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'high' as const, label: 'High' },
  { value: 'critical' as const, label: 'Critical' },
]

const sortKeyOptions: { value: TaskSortKey; label: string }[] = [
  { value: 'updated_at', label: 'Updated' },
  { value: 'created_at', label: 'Created' },
  { value: 'title', label: 'Title' },
  { value: 'priority', label: 'Priority' },
  { value: 'due_date', label: 'Due date' },
]

const sortDirOptions: { value: SortDir; label: string }[] = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
]

const groupByOptions: { value: TaskGroupBy; label: string }[] = [
  { value: 'none', label: 'No grouping' },
  { value: 'project', label: 'By project' },
  { value: 'status', label: 'By status' },
  { value: 'priority', label: 'By priority' },
  { value: 'assignee', label: 'By assignee' },
]

const projectSelectOptions = computed(() => [
  { value: '' as const, label: 'All projects' },
  ...props.projects.map((p) => ({ value: p.id, label: p.name })),
])

const assigneeSelectOptions = computed(() => {
  const base: { value: string | number; label: string }[] = [
    { value: '', label: 'All assignees' },
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

const assigneeModel = computed({
  get(): string | number {
    const v = assigneeFilter.value
    if (v === '') return ''
    if (v === 'unassigned') return 'unassigned'
    return v
  },
  set(x: string | number) {
    if (x === '' || x === 'unassigned') {
      assigneeFilter.value = x === 'unassigned' ? 'unassigned' : ''
      return
    }
    assigneeFilter.value = Number(x)
  },
})
</script>

<template>
  <UiCard class="!p-4 sm:!p-5">
    <div class="space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <UiSegmentedControl
          v-model="taskView"
          class="w-full sm:w-auto"
          aria-label="Tasks view"
          :options="viewModeOptions"
        />
        <UiTextAction type="button" @click="emit('reset')">
          Reset filters
        </UiTextAction>
      </div>

      <div
        class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <UiSelect
          id="tasks-filter-project"
          v-model="filterProject"
          label="Project"
          placeholder="All projects"
          :options="projectSelectOptions"
        />
        <UiSelect
          id="tasks-filter-status"
          v-model="filterStatus"
          label="Status"
          placeholder="All statuses"
          :options="statusOptions"
        />
        <UiSelect
          id="tasks-client-priority"
          v-model="clientPriority"
          label="Priority"
          placeholder="All priorities"
          :options="priorityClientOptions"
        />
        <UiSelect
          v-if="showAssigneeFilter"
          id="tasks-filter-assignee"
          v-model="assigneeModel"
          label="Assignee"
          placeholder="All assignees"
          :options="assigneeSelectOptions"
        />
      </div>

      <UiInput
        id="tasks-search"
        v-model="searchQuery"
        label="Search"
        placeholder="Search title or description…"
        autocomplete="off"
      />

      <div
        class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <UiSelect
          id="tasks-sort-key"
          v-model="sortKey"
          label="Sort by"
          :options="sortKeyOptions"
        />
        <UiSelect
          id="tasks-sort-dir"
          v-model="sortDir"
          label="Order"
          :options="sortDirOptions"
        />
        <UiSelect
          id="tasks-group-by"
          v-model="groupBy"
          label="Group (list only)"
          :options="groupByOptions"
        />
      </div>
    </div>
  </UiCard>
</template>
