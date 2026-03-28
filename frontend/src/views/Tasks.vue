<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Breadcrumb from '../components/ui/UiBreadcrumb.vue'
import Button from '../components/ui/UiButton.vue'
import UiSegmentedControl from '../components/ui/UiSegmentedControl.vue'
import EmptyState from '../components/ui/UiEmptyState.vue'
import Skeleton from '../components/ui/UiSkeleton.vue'
import Modal from '../components/ui/UiModal.vue'
import TaskDetailModal from '../components/tasks/TaskDetailModal.vue'
import TaskForm from '../components/tasks/TaskForm.vue'
import TaskInlineComposer from '../components/tasks/TaskInlineComposer.vue'
import TaskKanban from '../components/tasks/TaskKanban.vue'
import TaskList from '../components/tasks/TaskList.vue'
import { useProjectStore } from '../stores/project.store'
import { useTaskStore } from '../stores/task.store'
import { useAdminAssignableUsers } from '../composables/useAdminAssignableUsers'
import { useTaskEditPermission } from '../composables/useCanEditTask'
import { useToast } from '../composables/useToast'
import type { TaskPriority, TaskStatus } from '../types/task'

const route = useRoute()
const taskStore = useTaskStore()
const projectStore = useProjectStore()
const toast = useToast()
const { canEditTask } = useTaskEditPermission()
const { assignableUsers } = useAdminAssignableUsers()

const filterProject = ref<number | ''>('')
const filterStatus = ref<TaskStatus | ''>('')

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
    filterStatus.value = st as TaskStatus
  } else {
    filterStatus.value = ''
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

const viewModeOptions = [
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board' },
]

const detailOpen = ref(false)
const detailTaskId = ref<number | null>(null)

const inlineComposerProjectId = computed(() => {
  if (filterProject.value === '') return undefined
  const n = Number(filterProject.value)
  return Number.isFinite(n) && n > 0 ? n : undefined
})

const inlineComposerProjects = computed(() =>
  projectStore.projects.map((p) => ({ id: p.id, name: p.name })),
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
})

watch(
  () => route.query,
  async () => {
    syncFiltersFromRoute()
    await load()
  },
)

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
  if (filterStatus.value !== '') params.status = filterStatus.value
  await taskStore.fetchList(params)
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
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Tasks</h1>
        <p class="mt-1 text-sm text-muted">Tasks in your projects or assigned to you</p>
      </div>
      <Button
        v-if="taskView === 'board'"
        :disabled="!projectStore.projects.length"
        @click="showModal = true"
      >
        New task
      </Button>
    </div>

    <UiSegmentedControl
      v-model="taskView"
      class="mt-4"
      aria-label="Tasks view"
      :options="viewModeOptions"
    />

    <div class="mt-4 flex flex-wrap gap-4">
      <div>
        <label class="mb-1 block text-xs font-medium text-muted">Project</label>
        <select
          v-model="filterProject"
          class="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          @change="load"
        >
          <option value="">All</option>
          <option v-for="p in projectStore.projects" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-muted">Status</label>
        <select
          v-model="filterStatus"
          class="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          @change="load"
        >
          <option value="">All</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>

    <div v-if="taskStore.loading" class="mt-6 space-y-3">
      <Skeleton v-for="i in 5" :key="i" variant="card" />
    </div>
    <template v-else>
      <TaskList
        v-if="taskView === 'list'"
        class="mt-6"
        :tasks="taskStore.tasks"
        :can-edit-task="canEditTask"
        :projects="inlineComposerProjects"
        :assignable-users="assignableUsers"
        empty-message="No tasks match these filters. Add one above or adjust filters."
        @complete="onComplete"
        @reopen="onReopen"
        @info="openTaskDetail"
        @task-updated="load"
      >
        <template #header>
          <TaskInlineComposer
            variant="plain"
            :project-id="inlineComposerProjectId"
            :projects="inlineComposerProjects"
            :disabled="!projectStore.projects.length"
            @created="load"
          />
        </template>
      </TaskList>
      <EmptyState
        v-else-if="!taskStore.tasks.length"
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
        :tasks="taskStore.tasks"
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
