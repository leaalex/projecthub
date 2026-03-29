<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '../components/ui/UiBreadcrumb.vue'
import { FunnelIcon } from '@heroicons/vue/24/outline'
import Button from '../components/ui/UiButton.vue'
import EmptyState from '../components/ui/UiEmptyState.vue'
import UiInput from '../components/ui/UiInput.vue'
import Skeleton from '../components/ui/UiSkeleton.vue'
import Modal from '../components/ui/UiModal.vue'
import TaskDetailModal from '../components/tasks/TaskDetailModal.vue'
import TaskFiltersPanel from '../components/tasks/TaskFiltersPanel.vue'
import UiSegmentedControl from '../components/ui/UiSegmentedControl.vue'
import TaskForm from '../components/tasks/TaskForm.vue'
import TaskInlineComposer from '../components/tasks/TaskInlineComposer.vue'
import TaskKanban from '../components/tasks/TaskKanban.vue'
import TaskList from '../components/tasks/TaskList.vue'
import {
  presentTasks,
  type AssigneeFilterValue,
  type SortDir,
  type TaskGroupBy,
  type TaskSortKey,
} from '../composables/useTaskListPresentation'
import { useProjectStore } from '../stores/project.store'
import { useTaskStore } from '../stores/task.store'
import { useAdminAssignableUsers } from '../composables/useAdminAssignableUsers'
import { useTaskEditPermission } from '../composables/useCanEditTask'
import { useToast } from '../composables/useToast'
import type { TaskPriority, TaskStatus } from '../types/task'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const projectStore = useProjectStore()
const toast = useToast()
const { canEditTask } = useTaskEditPermission()
const { assignableUsers } = useAdminAssignableUsers()

const filterProject = ref<number | ''>('')
const filterStatus = ref<TaskStatus[]>([])

const searchQuery = ref('')
const clientPriority = ref<TaskPriority[]>([])
const assigneeFilter = ref<AssigneeFilterValue[]>([])
const sortKey = ref<TaskSortKey>('updated_at')
const sortDir = ref<SortDir>('desc')
const groupBy = ref<TaskGroupBy>('none')
const filtersOpen = ref(false)

const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

function syncFiltersFromRoute() {
  const pid = route.query.project_id
  const st = route.query.status
  if (pid != null && pid !== '') {
    const n = Number(pid)
    filterProject.value = Number.isFinite(n) ? n : ''
  } else {
    filterProject.value = ''
  }
  if (typeof st === 'string' && validStatuses.includes(st as TaskStatus)) {
    filterStatus.value = [st as TaskStatus]
  } else {
    filterStatus.value = []
  }
}

const showModal = ref(false)
const title = ref('')
const description = ref('')
const projectId = ref(0)
const status = ref<TaskStatus>('todo')
const priority = ref<TaskPriority>('medium')
const saving = ref(false)
const taskView = ref<'list' | 'board'>('list')

const taskViewModeOptions = [
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board' },
]

const allowServerFilterWatch = ref(false)

const detailOpen = ref(false)
const detailTaskId = ref<number | null>(null)
/** List view: inline create form toggled by "New task". */
const showListComposer = ref(false)

const inlineComposerProjectId = computed(() => {
  if (filterProject.value === '') return undefined
  const n = Number(filterProject.value)
  return Number.isFinite(n) && n > 0 ? n : undefined
})

const inlineComposerProjects = computed(() =>
  projectStore.projects.map((p) => ({ id: p.id, name: p.name })),
)

const showAssigneeFilter = computed(() => assignableUsers.value.length > 0)

const presentation = computed(() =>
  presentTasks(taskStore.tasks, {
    search: searchQuery.value,
    priority: clientPriority.value,
    assignee: assigneeFilter.value,
    sortKey: sortKey.value,
    sortDir: sortDir.value,
    groupBy: groupBy.value,
    status: filterStatus.value,
  }),
)

const displayFlat = computed(() => presentation.value.flat)
const displayGroups = computed(() => presentation.value.groups)

const listEmptyMessage = computed(() =>
  taskStore.tasks.length > 0 && displayFlat.value.length === 0
    ? 'No tasks match your search or filters. Adjust the toolbar or reset.'
    : 'No tasks match these filters. Add a task above or adjust filters.',
)

function openTaskDetail(taskId: number) {
  detailTaskId.value = taskId
  detailOpen.value = true
}

watch(detailOpen, (open) => {
  if (!open) detailTaskId.value = null
})

onMounted(async () => {
  await projectStore.fetchList().catch(() => {})
  syncFiltersFromRoute()
  await load()
  allowServerFilterWatch.value = true
})

watch(
  () => route.query,
  () => {
    syncFiltersFromRoute()
  },
)

watch([filterProject, filterStatus], async () => {
  if (!allowServerFilterWatch.value) return
  await load()
}, { deep: true })

watch(taskView, (v) => {
  if (v === 'board') showListComposer.value = false
})

watch(showModal, (open) => {
  if (!open) return
  const filtered = Number(filterProject.value)
  if (filterProject.value !== '' && Number.isFinite(filtered) && filtered > 0) {
    projectId.value = filtered
    return
  }
  const first = projectStore.projects[0]
  if (first) projectId.value = first.id
})

async function load() {
  const params: { project_id?: number; status?: TaskStatus } = {}
  if (filterProject.value !== '') params.project_id = Number(filterProject.value)
  if (filterStatus.value.length === 1) params.status = filterStatus.value[0]!
  await taskStore.fetchList(params)
}

async function onListComposerCreated() {
  await load()
  showListComposer.value = false
}

function resetToolbar() {
  filtersOpen.value = false
  searchQuery.value = ''
  clientPriority.value = []
  assigneeFilter.value = []
  sortKey.value = 'updated_at'
  sortDir.value = 'desc'
  groupBy.value = 'none'
  filterProject.value = ''
  filterStatus.value = []
  router.replace({ path: route.path, query: {} })
}

async function createTask() {
  const pid = Math.trunc(Number(projectId.value))
  const t = title.value.trim()
  if (!t) {
    toast.error('Enter a task title')
    return
  }
  if (!pid) {
    toast.error('Select a project')
    return
  }
  saving.value = true
  try {
    await taskStore.create({
      title: t,
      description: description.value.trim(),
      project_id: pid,
      status: status.value,
      priority: priority.value,
    })
    showModal.value = false
    title.value = ''
    description.value = ''
    projectId.value = projectStore.projects[0]?.id ?? 0
    await load()
    toast.success('Task created')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : 'Could not create task')
  } finally {
    saving.value = false
  }
}

async function onComplete(id: number) {
  await taskStore.complete(id)
  await load()
}

async function onReopen(id: number) {
  try {
    await taskStore.update(id, { status: 'todo' })
    await load()
    toast.success('Task marked as not done')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : 'Could not update task')
  }
}
</script>

<template>
  <div>
    <Breadcrumb
      class="mb-4"
      :items="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Tasks' },
      ]"
    />
    <div class="min-w-0">
      <h1 class="text-2xl font-semibold text-foreground">Tasks</h1>
      <p class="mt-1 text-sm text-muted">Tasks in your projects or assigned to you</p>
    </div>

    <div
      class="mt-6 flex w-full flex-wrap items-center justify-between gap-2"
    >
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <UiSegmentedControl
          v-model="taskView"
          class="shrink-0"
          aria-label="Tasks view"
          :options="taskViewModeOptions"
        />
        <div class="min-w-[8rem] max-w-md flex-1">
          <UiInput
            id="tasks-search"
            v-model="searchQuery"
            placeholder="Search title or description…"
            autocomplete="off"
            aria-label="Search"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          class="shrink-0 px-2.5"
          :aria-expanded="filtersOpen"
          aria-controls="task-filters-panel"
          @click="filtersOpen = !filtersOpen"
        >
          <FunnelIcon class="h-4 w-4" aria-hidden="true" />
          <span class="sr-only">Filters</span>
        </Button>
      </div>
      <Button
        class="shrink-0"
        :disabled="!projectStore.projects.length"
        @click="
          taskView === 'board' ? (showModal = true) : (showListComposer = true)
        "
      >
        New task
      </Button>
    </div>

    <div
      v-show="filtersOpen"
      id="task-filters-panel"
      class="mt-4"
      role="region"
      aria-label="Task filters and sort"
    >
      <TaskFiltersPanel
        v-model:task-view="taskView"
        v-model:filter-project="filterProject"
        v-model:filter-status="filterStatus"
        v-model:client-priority="clientPriority"
        v-model:assignee-filter="assigneeFilter"
        v-model:sort-key="sortKey"
        v-model:sort-dir="sortDir"
        v-model:group-by="groupBy"
        :projects="inlineComposerProjects"
        :assignable-users="assignableUsers"
        :show-assignee-filter="showAssigneeFilter"
        :show-view-switcher="false"
        @reset="resetToolbar"
      />
    </div>

    <div v-if="taskStore.loading" class="mt-6 space-y-3">
      <Skeleton v-for="i in 5" :key="i" variant="card" />
    </div>
    <template v-else-if="taskView === 'list'">
      <div class="mt-6 space-y-4">
        <div
          v-if="showListComposer"
          class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
        >
          <div class="border-b border-border px-3 py-3">
            <TaskInlineComposer
              variant="plain"
              :project-id="inlineComposerProjectId"
              :projects="inlineComposerProjects"
              :disabled="!projectStore.projects.length"
              @created="onListComposerCreated"
              @dismiss="showListComposer = false"
            />
          </div>
        </div>

        <template v-if="groupBy === 'none'">
          <TaskList
            :tasks="displayFlat"
            :can-edit-task="canEditTask"
            :projects="inlineComposerProjects"
            :assignable-users="assignableUsers"
            :empty-message="listEmptyMessage"
            @complete="onComplete"
            @reopen="onReopen"
            @info="openTaskDetail"
            @task-updated="load"
          />
        </template>
        <TaskList
          v-else-if="!displayFlat.length"
          :tasks="[]"
          :can-edit-task="canEditTask"
          :projects="inlineComposerProjects"
          :assignable-users="assignableUsers"
          :empty-message="listEmptyMessage"
          @complete="onComplete"
          @reopen="onReopen"
          @info="openTaskDetail"
          @task-updated="load"
        />
        <template v-else>
          <div
            v-for="g in displayGroups"
            :key="g.key"
            class="space-y-2"
          >
            <h2 class="text-sm font-semibold text-foreground">
              {{ g.label }}
              <span class="font-normal text-muted">({{ g.tasks.length }})</span>
            </h2>
            <TaskList
              :tasks="g.tasks"
              :can-edit-task="canEditTask"
              :projects="inlineComposerProjects"
              :assignable-users="assignableUsers"
              empty-message="No tasks in this group."
              @complete="onComplete"
              @reopen="onReopen"
              @info="openTaskDetail"
              @task-updated="load"
            />
          </div>
        </template>
      </div>
    </template>
    <template v-else>
      <EmptyState
        v-if="!displayFlat.length && taskStore.tasks.length > 0"
        class="mt-6"
        title="No tasks match filters"
        description="Try clearing search, assignee, or priority filters, or reset the toolbar."
      >
        <Button variant="secondary" type="button" @click="resetToolbar">
          Reset filters
        </Button>
      </EmptyState>
      <EmptyState
        v-else-if="!displayFlat.length"
        class="mt-6"
        title="No tasks found"
        description="Create a task or adjust filters to see more."
      >
        <Button
          :disabled="!projectStore.projects.length"
          @click="showModal = true"
        >
          Create a task
        </Button>
      </EmptyState>
      <TaskKanban
        v-else
        class="mt-6"
        :tasks="displayFlat"
        @changed="load"
      />
    </template>

    <Modal v-model="showModal" title="New task">
      <TaskForm
        v-model:title="title"
        v-model:description="description"
        v-model:project-id="projectId"
        v-model:status="status"
        v-model:priority="priority"
        :projects="projectStore.projects.map((p) => ({ id: p.id, name: p.name }))"
        :loading="saving"
        submit-label="Create"
        @submit="createTask"
        @cancel="showModal = false"
      />
    </Modal>

    <TaskDetailModal
      v-model="detailOpen"
      :task-id="detailTaskId"
      @saved="load"
    />
  </div>
</template>
