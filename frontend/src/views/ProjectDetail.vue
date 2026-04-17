<script setup lang="ts">
import { FunnelIcon, UsersIcon } from '@heroicons/vue/24/outline'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '../components/ui/UiBreadcrumb.vue'
import Button from '../components/ui/UiButton.vue'
import EmptyState from '../components/ui/UiEmptyState.vue'
import UiInput from '../components/ui/UiInput.vue'
import Modal from '../components/ui/UiModal.vue'
import Skeleton from '../components/ui/UiSkeleton.vue'
import TaskDetailModal from '../components/tasks/TaskDetailModal.vue'
import TaskFiltersPanel from '../components/tasks/TaskFiltersPanel.vue'
import TaskForm from '../components/tasks/TaskForm.vue'
import TaskInlineComposer from '../components/tasks/TaskInlineComposer.vue'
import TaskList from '../components/tasks/TaskList.vue'
import TaskSectionList from '../components/tasks/TaskSectionList.vue'
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
import { useProjectScopedAssignableUsers } from '../composables/useAdminAssignableUsers'
import { useTaskEditPermission } from '../composables/useCanEditTask'
import ProjectMembers from '../components/projects/ProjectMembers.vue'
import { useToast } from '../composables/useToast'
import type { TaskPriority, TaskStatus } from '../types/task'

const toast = useToast()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()

const canCreateTasks = computed(() => {
  const u = auth.user
  if (!u) return false
  if (u.role === 'admin' || u.role === 'staff') return true
  const p = projectStore.current
  if (!p) return false
  if (p.owner_id === u.id) return true
  const r = p.caller_project_role
  return r === 'manager' || r === 'owner'
})
const { canManageTask, canChangeTaskStatus } = useTaskEditPermission()

const id = computed(() => {
  const raw = route.params.id
  const s = Array.isArray(raw) ? raw[0] : raw
  const n = typeof s === 'string' ? Number(s) : Number(s)
  return Number.isFinite(n) && n > 0 ? n : NaN
})

const { assignableUsers } = useProjectScopedAssignableUsers(() => id.value)

const projectOptions = computed(() =>
  projectStore.projects.map((p) => ({ id: p.id, name: p.name })),
)

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
const groupBy = ref<TaskGroupBy>('section')

const showModal = ref(false)
const modalTitle = ref('')
const modalDescription = ref('')
const modalProjectId = ref(0)
const modalStatus = ref<TaskStatus>('todo')
const modalPriority = ref<TaskPriority>('medium')
const modalSaving = ref(false)
const addingSection = ref(false)
const newSectionName = ref('')
const savingSection = ref(false)

const showAssigneeFilter = computed(() => assignableUsers.value.length > 0)

const presentation = computed(() =>
  presentTasks(projectStore.tasks, {
    search: searchQuery.value,
    priority: clientPriority.value,
    assignee: assigneeFilter.value,
    sortKey: sortKey.value,
    sortDir: sortDir.value,
    groupBy: groupBy.value,
    sections: projectStore.sections,
    status: filterStatus.value,
  }),
)

const displayFlat = computed(() => presentation.value.flat)
const displayGroups = computed(() => presentation.value.groups)
const sectionGroupsForList = computed(() => {
  const map = new Map<
    string,
    { key: string; label: string; order: number; tasks: typeof displayFlat.value }
  >()
  map.set('unsectioned', {
    key: 'unsectioned',
    label: 'Unsectioned',
    order: -1,
    tasks: [],
  })
  for (const s of [...projectStore.sections].sort((a, b) => a.position - b.position || a.id - b.id)) {
    map.set(`s-${s.id}`, {
      key: `s-${s.id}`,
      label: s.name,
      order: s.position,
      tasks: [],
    })
  }
  for (const t of displayFlat.value) {
    const key = t.section_id == null ? 'unsectioned' : `s-${t.section_id}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: t.section?.name ?? `Section #${t.section_id}`,
        order: t.section?.position ?? Number.MAX_SAFE_INTEGER,
        tasks: [],
      })
    }
    map.get(key)!.tasks.push(t)
  }
  return [...map.values()]
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map(({ key, label, tasks }) => ({ key, label, tasks }))
})

function resetTaskFilters() {
  filtersOpen.value = false
  searchQuery.value = ''
  clientPriority.value = []
  assigneeFilter.value = []
  sortKey.value = 'updated_at'
  sortDir.value = 'desc'
  groupBy.value = 'section'
  filterProject.value = ''
  filterStatus.value = []
}

const pageLoading = ref(true)
const loadError = ref<string | null>(null)
const membersModalOpen = ref(false)

/** Bumps on each load so stale async work never leaves the UI stuck loading. */
let loadGeneration = 0

async function load() {
  const gen = ++loadGeneration
  pageLoading.value = true
  loadError.value = null

  const finishIfCurrent = () => {
    if (gen === loadGeneration) {
      pageLoading.value = false
    }
  }

  try {
    projectStore.resetProjectDetailView()

    if (!Number.isFinite(id.value) || id.value <= 0) {
      finishIfCurrent()
      void router.replace('/projects')
      return
    }

    await projectStore.fetchList().catch(() => {})
    if (gen !== loadGeneration) return

    await projectStore.fetchOne(id.value)
    if (gen !== loadGeneration) return

    await projectStore.fetchMembers(id.value).catch(() => {
      projectStore.members = []
      // Keep id so assignableUsers can still use owner from `current` (e.g. members request failed).
      projectStore.membersProjectId = id.value
    })
    if (gen !== loadGeneration) return

    await projectStore.fetchTasks(id.value).catch(() => {
      projectStore.tasks = []
      toast.error('Could not load tasks for this project')
    })
    await projectStore.fetchSections(id.value).catch(() => {
      projectStore.sections = []
    })
  } catch (e: unknown) {
    if (gen !== loadGeneration) return

    const ax = e as {
      response?: { status?: number; data?: { error?: string } }
    }
    const status = ax.response?.status
    const apiMsg = ax.response?.data?.error
    let msg = 'Could not load project'
    if (typeof apiMsg === 'string') msg = apiMsg
    else if (e instanceof Error && e.message) msg = e.message

    if (status === 404 || status === 403) {
      void router.replace('/projects')
      return
    }
    loadError.value = msg
    toast.error(msg)
  } finally {
    finishIfCurrent()
  }
}

watch(
  () => route.params.id,
  () => {
    showTaskComposer.value = false
    resetTaskFilters()
    void load()
  },
  { immediate: true },
)

watch(showModal, (open) => {
  if (open && Number.isFinite(id.value) && id.value > 0) {
    modalProjectId.value = id.value
  }
})

watch(membersModalOpen, (open) => {
  if (open && Number.isFinite(id.value) && id.value > 0) {
    void projectStore.fetchMembers(id.value).catch(() => {})
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

async function onSectionMove(payload: {
  taskId: number
  sectionId: number | null
  position: number
}) {
  try {
    await taskStore.moveTask(id.value, {
      task_id: payload.taskId,
      section_id: payload.sectionId,
      position: payload.position,
    })
    await refreshProjectTasks()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : 'Could not move task')
  }
}

async function createSection() {
  const name = newSectionName.value.trim()
  if (!name) {
    toast.error('Enter section name')
    return
  }
  savingSection.value = true
  try {
    await projectStore.createSection(id.value, name)
    newSectionName.value = ''
    addingSection.value = false
    toast.success('Section created')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : 'Could not create section')
  } finally {
    savingSection.value = false
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
    <div
      class="flex flex-wrap items-start justify-between gap-4"
    >
      <div class="min-w-0 flex-1">
        <h1 class="text-2xl font-semibold text-foreground">
          {{ projectStore.current.name }}
        </h1>
        <p class="mt-1 text-sm text-muted">
          {{ projectStore.current.description || 'No description' }}
        </p>
      </div>
      <Button
        v-if="projectStore.current?.kind === 'team'"
        type="button"
        variant="secondary"
        class="inline-flex shrink-0 items-center"
        @click="membersModalOpen = true"
      >
        <UsersIcon class="inline h-4 w-4 shrink-0" aria-hidden="true" />
        <span class="ml-1.5">Members</span>
      </Button>
    </div>

    <Modal
      v-if="projectStore.current?.kind === 'team'"
      v-model="membersModalOpen"
      title="Members"
      wide
    >
      <ProjectMembers :project-id="id" />
    </Modal>

    <div class="mt-6 space-y-4">
      <div
        class="flex w-full flex-wrap items-center justify-between gap-2"
      >
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
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
          @click="showTaskComposer = true"
        >
          New task
        </Button>
        <Button
          v-if="canCreateTasks"
          type="button"
          variant="secondary"
          class="shrink-0"
          @click="addingSection = !addingSection"
        >
          {{ addingSection ? 'Cancel' : 'Add section' }}
        </Button>
      </div>

      <div
        v-if="addingSection && canCreateTasks"
        class="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-3"
      >
        <UiInput
          id="new-section-name"
          v-model="newSectionName"
          class="min-w-[14rem] flex-1"
          placeholder="Section name..."
        />
        <Button type="button" :loading="savingSection" @click="createSection">
          Create
        </Button>
      </div>

      <div
        v-show="filtersOpen"
        id="project-task-filters-panel"
        role="region"
        aria-label="Task filters and sort"
      >
        <TaskFiltersPanel
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
          @reset="resetTaskFilters"
        />
      </div>

      <template v-if="!displayFlat.length && projectStore.tasks.length > 0">
        <EmptyState
          class="mt-6"
          title="No tasks match filters"
          description="Try clearing search or filters, or reset."
        >
          <Button variant="secondary" type="button" @click="resetTaskFilters">
            Reset filters
          </Button>
        </EmptyState>
      </template>
      <template v-else-if="!displayFlat.length">
        <EmptyState
          class="mt-6"
          title="No tasks yet"
          :description="
            canCreateTasks
              ? 'Create a task to get started.'
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
      </template>
      <template v-else>
        <div class="mt-6 space-y-4">
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

          <TaskSectionList
          :groups="sectionGroupsForList"
          :can-edit-task="canManageTask"
          :can-change-status-task="canChangeTaskStatus"
          :projects="projectOptions"
          :assignable-users="assignableUsers"
          empty-message="No tasks in this section."
          @complete="onComplete"
          @reopen="onReopen"
          @info="openTaskDetail"
          @task-updated="refreshProjectTasks"
          @move="onSectionMove"
        />
          <template v-if="groupBy !== 'section' && groupBy !== 'none'">
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
                :can-edit-task="canManageTask"
                :can-change-status-task="canChangeTaskStatus"
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
        </div>
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
  <div v-else-if="loadError" class="space-y-4">
    <Breadcrumb
      class="mb-4"
      :items="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Projects', to: '/projects' },
        { label: 'Project' },
      ]"
    />
    <EmptyState
      title="Project unavailable"
      :description="loadError"
    >
      <div class="mt-4 flex flex-wrap gap-2">
        <Button type="button" @click="load">Retry</Button>
        <Button
          type="button"
          variant="secondary"
          @click="router.push('/projects')"
        >
          All projects
        </Button>
      </div>
    </EmptyState>
  </div>
</template>
