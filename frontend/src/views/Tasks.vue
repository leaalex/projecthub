<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
} from '@app/composables/useTaskListPresentation'
import { useAuthStore } from '@app/auth.store'
import { useProjectStore } from '@app/project.store'
import { useTaskStore } from '@app/task.store'
import { useTasksPageAssignableUsers } from '@app/composables/useAdminAssignableUsers'
import { useTaskEditPermission } from '@app/composables/useCanEditTask'
import { useToast } from '@app/composables/useToast'
import { isPrivilegedRole } from '@domain/user/role'
import { taskSectionHeaderStats } from '@domain/task/stats'
import type { TaskPriority, TaskStatus } from '@domain/task/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const taskStore = useTaskStore()
const projectStore = useProjectStore()
const canCreateTasks = computed(() => {
  const u = auth.user
  if (!u) return false
  if (isPrivilegedRole(u.role)) return true
  return projectStore.projects.some((p) => {
    if (p.owner_id === u.id) return true
    const r = p.caller_project_role
    return r === 'manager' || r === 'owner'
  })
})
const toast = useToast()
const { canManageTask, canChangeTaskStatus } = useTaskEditPermission()

const filterProject = ref<number | ''>('')
const filterStatus = ref<TaskStatus[]>([])

const { assignableUsers } = useTasksPageAssignableUsers(() => filterProject.value)

const searchQuery = ref('')
const clientPriority = ref<TaskPriority[]>([])
const assigneeFilter = ref<AssigneeFilterValue[]>([])
const sortKey = ref<TaskSortKey>('updated_at')
const sortDir = ref<SortDir>('desc')
const groupBy = ref<TaskGroupBy>('section')
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
  presentTasks(
    taskStore.tasks,
    {
      search: searchQuery.value,
      priority: clientPriority.value,
      assignee: assigneeFilter.value,
      sortKey: sortKey.value,
      sortDir: sortDir.value,
      groupBy: groupBy.value,
      sections:
        filterProject.value !== '' && Number.isFinite(Number(filterProject.value))
          ? projectStore.sections
          : [],
      status: filterStatus.value,
    },
    t,
  ),
)

const displayFlat = computed(() => presentation.value.flat)
const displayGroups = computed(() => presentation.value.groups)
const sectionGroupsForList = computed(() => {
  const sourceSections =
    filterProject.value !== '' && Number.isFinite(Number(filterProject.value))
      ? projectStore.sections
      : []
  const map = new Map<
    string,
    { key: string; label: string; order: number; tasks: typeof displayFlat.value }
  >()
  map.set('unsectioned', {
    key: 'unsectioned',
    label: t('tasks.unsectioned'),
    order: -1,
    tasks: [],
  })
  for (const s of [...sourceSections].sort((a, b) => a.position - b.position || a.id - b.id)) {
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
    .map(({ key, label, tasks }) => ({
      key,
      label,
      tasks: [...tasks].sort(
        (a, b) => a.position - b.position || a.id - b.id,
      ),
    }))
})

const tasksBreadcrumbItems = computed(() => [
  { label: t('common.home'), to: '/dashboard' },
  { label: t('tasks.breadcrumb') },
])

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

watch(
  filterProject,
  async (pid) => {
    if (pid === '') {
      projectStore.sections = []
      return
    }
    const n = Number(pid)
    if (!Number.isFinite(n) || n <= 0) {
      projectStore.sections = []
      return
    }
    await projectStore.fetchSections(n).catch(() => {
      projectStore.sections = []
    })
  },
  { immediate: true },
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
  groupBy.value = 'section'
  filterProject.value = ''
  filterStatus.value = []
  router.replace({ path: route.path, query: {} })
}

async function createTask() {
  const pid = Math.trunc(Number(projectId.value))
  const trimmedTitle = title.value.trim()
  if (!trimmedTitle) {
    toast.error(t('tasks.toasts.enterTitle'))
    return
  }
  if (!pid) {
    toast.error(t('tasks.toasts.selectProject'))
    return
  }
  saving.value = true
  try {
    await taskStore.create({
      title: trimmedTitle,
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
    toast.success(t('tasks.toasts.created'))
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : t('tasks.toasts.createFailed'))
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
    toast.success(t('tasks.toasts.reopened'))
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : t('tasks.toasts.updateFailed'))
  }
}

async function onSectionMove(payload: {
  taskId: number
  sectionId: number | null
  position: number
}) {
  const task = taskStore.tasks.find((t) => t.id === payload.taskId)
  if (!task) return
  try {
    await taskStore.moveTask(task.project_id, {
      task_id: payload.taskId,
      section_id: payload.sectionId,
      position: payload.position,
    })
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : t('tasks.toasts.moveFailed'))
  }
}
</script>

<template>
  <div>
    <Breadcrumb class="mb-4" :items="tasksBreadcrumbItems" />
    <div class="min-w-0">
      <h1 class="text-2xl font-semibold text-foreground">{{ t('tasks.title') }}</h1>
      <p class="mt-1 text-sm text-muted">
        {{
          isPrivilegedRole(auth.user?.role)
            ? t('tasks.subtitleAdmin')
            : t('tasks.subtitleDefault')
        }}
      </p>
    </div>

    <div
      class="mt-6 flex w-full flex-wrap items-center justify-between gap-2"
    >
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <div class="min-w-[8rem] max-w-md flex-1">
          <UiInput
            id="tasks-search"
            v-model="searchQuery"
            :placeholder="t('tasks.searchPlaceholder')"
            autocomplete="off"
            :aria-label="t('common.search')"
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
          <span class="sr-only">{{ t('common.filters') }}</span>
        </Button>
      </div>
      <Button
        v-if="canCreateTasks"
        class="shrink-0"
        :disabled="!projectStore.projects.length"
        @click="showListComposer = true"
      >
        {{ t('tasks.newTask') }}
      </Button>
    </div>

    <div
      v-show="filtersOpen"
      id="task-filters-panel"
      class="mt-4"
      role="region"
      :aria-label="t('tasks.taskFiltersRegion')"
    >
      <TaskFiltersPanel
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
        @reset="resetToolbar"
      />
    </div>

    <div v-if="taskStore.loading" class="mt-6 space-y-3">
      <Skeleton v-for="i in 5" :key="i" variant="card" />
    </div>
    <template v-else>
      <EmptyState
        v-if="!displayFlat.length && taskStore.tasks.length > 0"
        class="mt-6"
        :title="t('tasks.emptyNoMatchTitle')"
        :description="t('tasks.emptyNoMatchDescription')"
      >
        <Button variant="secondary" type="button" @click="resetToolbar">
          {{ t('tasks.resetFilters') }}
        </Button>
      </EmptyState>
      <EmptyState
        v-else-if="!displayFlat.length"
        class="mt-6"
        :title="t('tasks.emptyNoTasksTitle')"
        :description="
          canCreateTasks
            ? t('tasks.emptyNoTasksCanCreate')
            : t('tasks.emptyNoTasksGuest')
        "
      >
        <Button
          v-if="canCreateTasks"
          :disabled="!projectStore.projects.length"
          @click="showModal = true"
        >
          {{ t('tasks.createTask') }}
        </Button>
      </EmptyState>
      <div v-else class="mt-6 space-y-4">
        <div
          v-if="canCreateTasks && showListComposer"
          class="overflow-hidden rounded-lg border border-border bg-surface"
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

        <TaskSectionList
          :groups="sectionGroupsForList"
          :can-edit-task="canManageTask"
          :can-change-status-task="canChangeTaskStatus"
          :projects="inlineComposerProjects"
          :assignable-users="assignableUsers"
          :empty-message="t('tasks.emptySection')"
          @complete="onComplete"
          @reopen="onReopen"
          @info="openTaskDetail"
          @task-updated="load"
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
              <span class="font-normal text-muted">{{
                taskSectionHeaderStats(g.tasks)
              }}</span>
            </h2>
            <TaskList
              :tasks="g.tasks"
              :can-edit-task="canManageTask"
              :can-change-status-task="canChangeTaskStatus"
              :projects="inlineComposerProjects"
              :assignable-users="assignableUsers"
              :empty-message="t('tasks.emptyGroup')"
              @complete="onComplete"
              @reopen="onReopen"
              @info="openTaskDetail"
              @task-updated="load"
            />
          </div>
        </template>
      </div>
    </template>

    <Modal v-if="canCreateTasks" v-model="showModal" :title="t('tasks.modalNewTitle')">
      <TaskForm
        v-model:title="title"
        v-model:description="description"
        v-model:project-id="projectId"
        v-model:status="status"
        v-model:priority="priority"
        :projects="projectStore.projects.map((p) => ({ id: p.id, name: p.name }))"
        :loading="saving"
        :submit-label="t('tasks.submitCreate')"
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
