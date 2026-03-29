<script setup lang="ts">
import { FunnelIcon } from '@heroicons/vue/24/outline'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '../components/ui/UiBreadcrumb.vue'
import Button from '../components/ui/UiButton.vue'
import EmptyState from '../components/ui/UiEmptyState.vue'
import UiInput from '../components/ui/UiInput.vue'
import Modal from '../components/ui/UiModal.vue'
import Skeleton from '../components/ui/UiSkeleton.vue'
import UiSegmentedControl from '../components/ui/UiSegmentedControl.vue'
import TaskDetailModal from '../components/tasks/TaskDetailModal.vue'
import TaskFiltersPanel from '../components/tasks/TaskFiltersPanel.vue'
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
import { useAuthStore } from '../stores/auth.store'
import { useProjectStore } from '../stores/project.store'
import { useTaskStore } from '../stores/task.store'
import { useAdminAssignableUsers } from '../composables/useAdminAssignableUsers'
import { useTaskEditPermission } from '../composables/useCanEditTask'
import { useToast } from '../composables/useToast'
import type { TaskPriority, TaskStatus } from '../types/task'

const taskViewModeOptions = [
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board' },
]

const toast = useToast()
const auth = useAuthStore()
const canCreateTasks = computed(() => auth.user?.role !== 'user')
const { canEditTask } = useTaskEditPermission()
const { assignableUsers } = useAdminAssignableUsers()

const projectOptions = computed(() =>
  projectStore.projects.map((p) => ({ id: p.id, name: p.name })),
)

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()

const id = computed(() => Number(route.params.id))

const detailOpen = ref(false)
const detailTaskId = ref<number | null>(null)
const showTaskComposer = ref(false)
const filtersOpen = ref(false)
const filterProject = ref<number | ''>('')
const filterStatus = ref<TaskStatus[]>([])
const searchQuery = ref('')
const clientPriority = ref<TaskPriority[]>([])
const assigneeFilter = ref<AssigneeFilterValue[]>([])
const sortKey = ref<TaskSortKey>('updated_at')
const sortDir = ref<SortDir>('desc')
const groupBy = ref<TaskGroupBy>('none')
const projectTaskView = ref<'list' | 'board'>('list')

const showModal = ref(false)
const modalTitle = ref('')
const modalDescription = ref('')
const modalProjectId = ref(0)
const modalStatus = ref<TaskStatus>('todo')
const modalPriority = ref<TaskPriority>('medium')
const modalSaving = ref(false)

const showAssigneeFilter = computed(() => assignableUsers.value.length > 0)

const presentation = computed(() =>
  presentTasks(projectStore.tasks, {
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
  projectStore.tasks.length > 0 && displayFlat.value.length === 0
    ? 'No tasks match your search or filters. Adjust filters or reset.'
    : 'No tasks yet. Add one with New task.',
)

function resetTaskFilters() {
  filtersOpen.value = false
  searchQuery.value = ''
  clientPriority.value = []
  assigneeFilter.value = []
  sortKey.value = 'updated_at'
  sortDir.value = 'desc'
  groupBy.value = 'none'
  filterProject.value = ''
  filterStatus.value = []
}

const pageLoading = ref(true)

async function load() {
  pageLoading.value = true
  try {
    await projectStore.fetchList().catch(() => {})
    await projectStore.fetchOne(id.value)
    await projectStore.fetchTasks(id.value)
  } catch {
    router.replace('/projects')
    return
  } finally {
    pageLoading.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    showTaskComposer.value = false
    resetTaskFilters()
    load()
  },
  { immediate: true },
)

watch(projectTaskView, (v) => {
  if (v === 'board') showTaskComposer.value = false
})

watch(showModal, (open) => {
  if (open && Number.isFinite(id.value) && id.value > 0) {
    modalProjectId.value = id.value
  }
})

function openTaskDetail(taskId: number) {
  detailTaskId.value = taskId
  detailOpen.value = true
}

watch(detailOpen, (open) => {
  if (!open) detailTaskId.value = null
})

async function refreshProjectTasks() {
  await projectStore.fetchTasks(id.value)
}

async function onInlineComposerCreated() {
  await refreshProjectTasks()
  showTaskComposer.value = false
}

async function createTaskFromModal() {
  const t = modalTitle.value.trim()
  if (!t) {
    toast.error('Enter a task title')
    return
  }
  const pid = Math.trunc(Number(modalProjectId.value))
  if (!pid) {
    toast.error('Invalid project')
    return
  }
  modalSaving.value = true
  try {
    await taskStore.create({
      title: t,
      description: modalDescription.value.trim(),
      project_id: pid,
      status: modalStatus.value,
      priority: modalPriority.value,
    })
    showModal.value = false
    modalTitle.value = ''
    modalDescription.value = ''
    modalStatus.value = 'todo'
    modalPriority.value = 'medium'
    await refreshProjectTasks()
    toast.success('Task created')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : 'Could not create task')
  } finally {
    modalSaving.value = false
  }
}

async function onComplete(taskId: number) {
  await taskStore.complete(taskId)
  await projectStore.fetchTasks(id.value)
}

async function onReopen(taskId: number) {
  try {
    await taskStore.update(taskId, { status: 'todo' })
    await projectStore.fetchTasks(id.value)
    toast.success('Task marked as not done')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : 'Could not update task')
  }
}
</script>

<template>
  <div v-if="pageLoading" class="space-y-4">
    <Skeleton variant="line" class="h-4 max-w-md" />
    <div class="space-y-3">
      <Skeleton variant="line" class="h-8 max-w-xs" />
      <Skeleton variant="line" :lines="2" />
    </div>
    <div
      class="mt-6 overflow-hidden rounded-lg border border-border bg-surface"
    >
      <div class="border-b border-border px-3 py-3">
        <Skeleton variant="line" class="max-w-lg" />
      </div>
      <div class="divide-y divide-border px-3 py-2">
        <div v-for="i in 4" :key="i" class="py-3">
          <Skeleton variant="line" />
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="projectStore.current">
    <Breadcrumb
      class="mb-4"
      :items="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Projects', to: '/projects' },
        { label: projectStore.current.name },
      ]"
    />
    <div>
      <h1 class="text-2xl font-semibold text-foreground">
        {{ projectStore.current.name }}
      </h1>
      <p class="mt-1 text-sm text-muted">
        {{ projectStore.current.description || 'No description' }}
      </p>
    </div>

    <div class="mt-6 space-y-4">
      <div
        class="flex w-full flex-wrap items-center justify-between gap-2"
      >
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <UiSegmentedControl
            v-model="projectTaskView"
            class="shrink-0"
            aria-label="Tasks view"
            :options="taskViewModeOptions"
          />
          <div class="min-w-[8rem] max-w-md flex-1">
            <UiInput
              id="project-tasks-search"
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
            aria-controls="project-task-filters-panel"
            @click="filtersOpen = !filtersOpen"
          >
            <FunnelIcon class="h-4 w-4" aria-hidden="true" />
            <span class="sr-only">Filters</span>
          </Button>
        </div>
        <Button
          v-if="canCreateTasks"
          type="button"
          class="shrink-0"
          :disabled="!Number.isFinite(id) || id <= 0"
          @click="
            projectTaskView === 'board'
              ? (showModal = true)
              : (showTaskComposer = true)
          "
        >
          New task
        </Button>
      </div>

      <div
        v-show="filtersOpen"
        id="project-task-filters-panel"
        role="region"
        aria-label="Task filters and sort"
      >
        <TaskFiltersPanel
          v-model:task-view="projectTaskView"
          v-model:filter-project="filterProject"
          v-model:filter-status="filterStatus"
          v-model:client-priority="clientPriority"
          v-model:assignee-filter="assigneeFilter"
          v-model:sort-key="sortKey"
          v-model:sort-dir="sortDir"
          v-model:group-by="groupBy"
          :projects="projectOptions"
          :assignable-users="assignableUsers"
          :show-assignee-filter="showAssigneeFilter"
          hide-project-filter
          :show-view-switcher="false"
          @reset="resetTaskFilters"
        />
      </div>

      <template v-if="projectTaskView === 'list'">
        <div
          v-if="canCreateTasks && showTaskComposer"
          class="overflow-hidden rounded-lg border border-border bg-surface"
        >
          <div class="border-b border-border px-3 py-3">
            <TaskInlineComposer
              variant="plain"
              :project-id="id"
              :disabled="!Number.isFinite(id) || id <= 0"
              @created="onInlineComposerCreated"
              @dismiss="showTaskComposer = false"
            />
          </div>
        </div>

        <template v-if="groupBy === 'none'">
          <TaskList
            :tasks="displayFlat"
            :can-edit-task="canEditTask"
            :projects="projectOptions"
            :assignable-users="assignableUsers"
            :empty-message="listEmptyMessage"
            @complete="onComplete"
            @reopen="onReopen"
            @info="openTaskDetail"
            @task-updated="refreshProjectTasks"
          />
        </template>
        <TaskList
          v-else-if="!displayFlat.length"
          :tasks="[]"
          :can-edit-task="canEditTask"
          :projects="projectOptions"
          :assignable-users="assignableUsers"
          :empty-message="listEmptyMessage"
          @complete="onComplete"
          @reopen="onReopen"
          @info="openTaskDetail"
          @task-updated="refreshProjectTasks"
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
              :projects="projectOptions"
              :assignable-users="assignableUsers"
              empty-message="No tasks in this group."
              @complete="onComplete"
              @reopen="onReopen"
              @info="openTaskDetail"
              @task-updated="refreshProjectTasks"
            />
          </div>
        </template>
      </template>
      <template v-else>
        <EmptyState
          v-if="!displayFlat.length && projectStore.tasks.length > 0"
          class="mt-6"
          title="No tasks match filters"
          description="Try clearing search or filters, or reset."
        >
          <Button variant="secondary" type="button" @click="resetTaskFilters">
            Reset filters
          </Button>
        </EmptyState>
        <EmptyState
          v-else-if="!displayFlat.length"
          class="mt-6"
          title="No tasks yet"
          :description="
            canCreateTasks
              ? 'Create a task to see it on the board.'
              : 'No tasks in this project yet.'
          "
        >
          <Button
            v-if="canCreateTasks"
            type="button"
            :disabled="!Number.isFinite(id) || id <= 0"
            @click="showModal = true"
          >
            New task
          </Button>
        </EmptyState>
        <TaskKanban
          v-else
          class="mt-6"
          :tasks="displayFlat"
          @changed="refreshProjectTasks"
        />
      </template>
    </div>

    <TaskDetailModal
      v-model="detailOpen"
      :task-id="detailTaskId"
      @saved="refreshProjectTasks"
    />

    <Modal v-if="canCreateTasks" v-model="showModal" title="New task">
      <TaskForm
        v-model:title="modalTitle"
        v-model:description="modalDescription"
        v-model:project-id="modalProjectId"
        v-model:status="modalStatus"
        v-model:priority="modalPriority"
        hide-project-select
        :projects="projectOptions"
        :loading="modalSaving"
        submit-label="Create"
        @submit="createTaskFromModal"
        @cancel="showModal = false"
      />
    </Modal>

  </div>
</template>
