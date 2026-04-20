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
import TaskList from '../components/tasks/TaskList.vue'
import ProjectItemList from '../components/projects/ProjectItemList.vue'
import NoteDetailModal from '../components/notes/NoteDetailModal.vue'
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
import { useNoteStore } from '@app/note.store'
import { useTasksPageAssignableUsers } from '@app/composables/useAdminAssignableUsers'
import { useTaskEditPermission } from '@app/composables/useCanEditTask'
import { useToast } from '@app/composables/useToast'
import { isPrivilegedRole } from '@domain/user/role'
import type { TaskPriority, TaskStatus } from '@domain/task/types'
import type { NotePermissionContext } from '@domain/note/permissions'
import { canManageNote } from '@domain/note/permissions'
import { mapApiError } from '@infra/api/errorMap'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const taskStore = useTaskStore()
const projectStore = useProjectStore()
const noteStore = useNoteStore()
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
const taskSectionId = ref<number | null>(null)
const status = ref<TaskStatus>('todo')
const priority = ref<TaskPriority>('medium')
const saving = ref(false)

const taskCreateModalDirty = computed(
  () =>
    showModal.value
    && (title.value.trim() !== ''
      || description.value.trim() !== ''
      || status.value !== 'todo'
      || priority.value !== 'medium'
      || taskSectionId.value !== null),
)

const allowServerFilterWatch = ref(false)

const detailOpen = ref(false)
const detailTaskId = ref<number | null>(null)
const detailTaskModalMode = ref<'view' | 'edit'>('view')
const noteDetailModalMode = ref<'view' | 'edit'>('view')
const noteDetailOpen = ref(false)
const noteDetailId = ref<number | null>(null)
const noteDetailProjectId = ref(0)

const notePermissionCtx = computed(
  (): NotePermissionContext => ({
    projects: projectStore.projects.map(p => ({ id: p.id, owner_id: p.owner_id })),
    current: projectStore.current
      ? {
          id: projectStore.current.id,
          owner_id: projectStore.current.owner_id,
          caller_project_role: projectStore.current.caller_project_role,
        }
      : null,
  }),
)

const canManageNotesForNoteModal = computed(() =>
  canManageNote(
    auth.user?.id,
    auth.user?.role,
    notePermissionCtx.value,
    noteDetailProjectId.value,
  ),
)

const projectTasksForNoteModal = computed(() => {
  const pid = noteDetailProjectId.value
  return taskStore.tasks
    .filter(t => t.project_id === pid)
    .map(t => ({ id: t.id, title: t.title }))
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
  for (const task of displayFlat.value) {
    const key = task.section_id == null ? 'unsectioned' : `s-${task.section_id}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        label:
          task.section?.name ??
          t('tasks.unknownSection', { id: task.section_id }),
        order: task.section?.position ?? Number.MAX_SAFE_INTEGER,
        tasks: [],
      })
    }
    map.get(key)!.tasks.push(task)
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

const sectionWorkspaceGroups = computed(() =>
  sectionGroupsForList.value.map((g, idx) => ({
    key: g.key,
    label: g.label,
    order: idx,
    items: g.tasks.map((t) => ({ kind: 'task' as const, task: t })),
  })),
)

const tasksBreadcrumbItems = computed(() => [
  { label: t('common.home'), to: '/dashboard' },
  { label: t('tasks.breadcrumb') },
])

function openTaskView(taskId: number) {
  detailTaskId.value = taskId
  detailTaskModalMode.value = 'view'
  detailOpen.value = true
}

function openTaskEdit(taskId: number) {
  detailTaskId.value = taskId
  detailTaskModalMode.value = 'edit'
  detailOpen.value = true
}

async function openLinkedNote(payload: { noteId: number; projectId: number }) {
  detailOpen.value = false
  noteDetailProjectId.value = payload.projectId
  noteDetailId.value = payload.noteId
  noteDetailModalMode.value = 'view'
  noteDetailOpen.value = true
  try {
    await projectStore.fetchOne(payload.projectId).catch(() => {})
    await projectStore.fetchSections(payload.projectId)
    await noteStore.fetchList(payload.projectId, { quiet: true })
  } catch {
    toast.error(t('tasks.openLinkedNoteFailed'))
  }
}

function openTaskFromNote(taskId: number) {
  noteDetailOpen.value = false
  detailTaskId.value = taskId
  detailTaskModalMode.value = 'view'
  detailOpen.value = true
}

watch(detailOpen, (open) => {
  if (!open) detailTaskId.value = null
})

watch(noteDetailOpen, open => {
  if (!open) noteDetailId.value = null
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

async function prefetchTaskCreateSections(pid: number) {
  if (!Number.isFinite(pid) || pid <= 0) {
    projectStore.sections = []
    return
  }
  await projectStore.fetchSections(pid).catch(() => {
    projectStore.sections = []
  })
}

watch(showModal, async (open) => {
  if (!open) {
    title.value = ''
    description.value = ''
    taskSectionId.value = null
    status.value = 'todo'
    priority.value = 'medium'
    return
  }
  const filtered = Number(filterProject.value)
  if (filterProject.value !== '' && Number.isFinite(filtered) && filtered > 0) {
    projectId.value = filtered
  } else {
    const first = projectStore.projects[0]
    if (first) projectId.value = first.id
  }
  await prefetchTaskCreateSections(projectId.value)
})

async function load() {
  const params: { project_id?: number; status?: TaskStatus } = {}
  if (filterProject.value !== '') params.project_id = Number(filterProject.value)
  if (filterStatus.value.length === 1) params.status = filterStatus.value[0]!
  await taskStore.fetchList(params)
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
      section_id: taskSectionId.value ?? undefined,
      status: status.value,
      priority: priority.value,
    })
    showModal.value = false
    await load()
    toast.success(t('tasks.toasts.created'))
  } catch (e: unknown) {
    toast.error(mapApiError(e, 'tasks.toasts.createFailed'))
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
    toast.error(mapApiError(e, 'tasks.toasts.updateFailed'))
  }
}

async function onSectionMove(payload: {
  kind: 'task' | 'note'
  id: number
  sectionId: number | null
  position: number
}) {
  if (payload.kind !== 'task') return
  const task = taskStore.tasks.find((t) => t.id === payload.id)
  if (!task) return
  try {
    await taskStore.moveTask(task.project_id, {
      task_id: payload.id,
      section_id: payload.sectionId,
      position: payload.position,
    })
  } catch (e: unknown) {
    toast.error(mapApiError(e, 'tasks.toasts.moveFailed'))
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
        @click="showModal = true"
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
        <ProjectItemList
          :groups="sectionWorkspaceGroups"
          :can-manage-note="false"
          :can-edit-task="canManageTask"
          :can-change-status-task="canChangeTaskStatus"
          :empty-message="t('tasks.emptySection')"
          @complete="onComplete"
          @reopen="onReopen"
          @view-task="openTaskView"
          @edit-task="openTaskEdit"
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
            </h2>
            <TaskList
              :tasks="g.tasks"
              :can-edit-task="canManageTask"
              :can-change-status-task="canChangeTaskStatus"
              :empty-message="t('tasks.emptyGroup')"
              @complete="onComplete"
              @reopen="onReopen"
              @view-task="openTaskView"
              @edit-task="openTaskEdit"
            />
          </div>
        </template>
      </div>
    </template>

    <Modal
      v-if="canCreateTasks"
      v-model="showModal"
      :title="t('tasks.modalNewTitle')"
      :dirty="taskCreateModalDirty"
    >
      <TaskForm
        v-model:title="title"
        v-model:description="description"
        v-model:project-id="projectId"
        v-model:section-id="taskSectionId"
        v-model:status="status"
        v-model:priority="priority"
        form-id="tasks-new-task"
        hide-footer
        :sections="projectStore.sections"
        :projects="projectStore.projects.map((p) => ({ id: p.id, name: p.name }))"
        :loading="saving"
        :submit-label="t('tasks.submitCreate')"
        @project-picked="prefetchTaskCreateSections"
        @submit="createTask"
      />
      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" :disabled="saving" @click="showModal = false">
            {{ t('taskForm.cancel') }}
          </Button>
          <Button
            type="submit"
            form="tasks-new-task"
            :loading="saving"
          >
            {{ t('tasks.submitCreate') }}
          </Button>
        </div>
      </template>
    </Modal>

    <TaskDetailModal
      v-model="detailOpen"
      :task-id="detailTaskId"
      :initial-mode="detailTaskModalMode"
      @saved="load"
      @open-note="openLinkedNote"
    />

    <NoteDetailModal
      v-model="noteDetailOpen"
      :project-id="noteDetailProjectId"
      :note-id="noteDetailId"
      :sections="projectStore.sections"
      :project-tasks="projectTasksForNoteModal"
      :can-manage="canManageNotesForNoteModal"
      :initial-mode="noteDetailModalMode"
      @saved="load"
      @deleted="load"
      @open-task="openTaskFromNote"
    />
  </div>
</template>
