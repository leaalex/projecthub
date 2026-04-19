<script setup lang="ts">
import { ArchiveBoxIcon, FunnelIcon, PencilSquareIcon, UsersIcon } from '@heroicons/vue/24/outline'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
import NoteInlineComposer from '../components/notes/NoteInlineComposer.vue'
import ProjectForm from '../components/projects/ProjectForm.vue'
import ProjectItemList from '../components/projects/ProjectItemList.vue'
import NoteDetailModal from '../components/notes/NoteDetailModal.vue'
import ProjectTrashPanel from '../components/notes/ProjectTrashPanel.vue'
import UiSegmentedControl from '../components/ui/UiSegmentedControl.vue'
import { presentProjectItems, type ProjectItemKindFilter } from '@app/composables/useProjectItemsPresentation'
import {
  type AssigneeFilterValue,
  type SortDir,
  type TaskGroupBy,
  type TaskSortKey,
} from '@app/composables/useTaskListPresentation'
import { useAuthStore } from '@app/auth.store'
import { useProjectStore } from '@app/project.store'
import { useTaskStore } from '@app/task.store'
import { extractNoteAxiosError, useNoteStore } from '@app/note.store'
import { useTrashTasksStore } from '@app/trashTasks.store'
import { useTrashNotesStore } from '@app/trashNotes.store'
import { useProjectScopedAssignableUsers } from '@app/composables/useAdminAssignableUsers'
import { useConfirm } from '@app/composables/useConfirm'
import { useTaskEditPermission } from '@app/composables/useCanEditTask'
import { useToast } from '@app/composables/useToast'
import { isPrivilegedRole } from '@domain/user/role'
import type { TaskPriority, TaskStatus } from '@domain/task/types'
import type { NotePermissionContext } from '@domain/note/permissions'
import { canManageNote } from '@domain/note/permissions'

const toast = useToast()
const { t } = useI18n()
const { confirm } = useConfirm()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const noteStore = useNoteStore()
const trashTasksStore = useTrashTasksStore()
const trashNotesStore = useTrashNotesStore()

const canCreateTasks = computed(() => {
  const u = auth.user
  if (!u) return false
  if (isPrivilegedRole(u.role)) return true
  const p = projectStore.current
  if (!p) return false
  if (p.owner_id === u.id) return true
  const r = p.caller_project_role
  return r === 'manager' || r === 'owner'
})

const canEditProject = computed(() => {
  const u = auth.user
  if (!u) return false
  if (isPrivilegedRole(u.role)) return true
  const p = projectStore.current
  if (!p) return false
  if (p.owner_id === u.id) return true
  const r = p.caller_project_role
  return r === 'manager' || r === 'owner'
})
const { canManageTask, canChangeTaskStatus } = useTaskEditPermission()

const noteDetailOpen = ref(false)
const noteDetailId = ref<number | null>(null)
const trashModalOpen = ref(false)

const showSectionAdd = ref(false)
const newSectionName = ref('')
const savingSection = ref(false)

const itemKind = ref<ProjectItemKindFilter>('all')
const manualOrder = ref(true)

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

const canManageNoteOnProject = computed(() =>
  canManageNote(auth.user?.id, auth.user?.role, notePermissionCtx.value, id.value),
)

const projectTasksForNotes = computed(() =>
  projectStore.tasks.map(t => ({ id: t.id, title: t.title })),
)

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
const showNoteComposer = ref(false)
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

const editProjectModalOpen = ref(false)
const editName = ref('')
const editDescription = ref('')
const editSaving = ref(false)

const showAssigneeFilter = computed(() => assignableUsers.value.length > 0)

const itemGroups = computed(() =>
  presentProjectItems(
    projectStore.tasks,
    noteStore.notes,
    projectStore.sections,
    {
      kindFilter: itemKind.value,
      search: searchQuery.value,
      priority: clientPriority.value,
      assignee: assigneeFilter.value,
      status: filterStatus.value,
      sortKey: manualOrder.value ? 'position' : sortKey.value,
      sortDir: sortDir.value,
      manualSectionOrder: manualOrder.value,
    },
    t,
  ),
)

const totalItemCount = computed(() =>
  itemGroups.value.reduce((n, g) => n + g.items.length, 0),
)

const projectBreadcrumbItems = computed(() => {
  const p = projectStore.current
  if (!p) return []
  return [
    { label: t('common.home'), to: '/dashboard' },
    { label: t('nav.projects'), to: '/projects' },
    { label: p.name },
  ]
})

const projectErrorBreadcrumbItems = computed(() => [
  { label: t('common.home'), to: '/dashboard' },
  { label: t('nav.projects'), to: '/projects' },
  { label: t('projectDetail.errorBreadcrumbProject') },
])

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
  itemKind.value = 'all'
  manualOrder.value = true
}

const pageLoading = ref(true)
const loadError = ref<string | null>(null)
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

    // cheap cache warm for project list (sidebar / command palette)
    await projectStore.fetchList().catch(() => {})
    if (gen !== loadGeneration) return

    await projectStore.fetchOne(id.value)
    if (gen !== loadGeneration) return

    await projectStore.fetchMembers(id.value).catch(() => {
      projectStore.members = []
      projectStore.membersProjectId = id.value
    })
    if (gen !== loadGeneration) return

    await projectStore.fetchTasks(id.value).catch(() => {
      projectStore.tasks = []
      toast.error(t('projectDetail.loadTasksFailed'))
    })
    await projectStore.fetchSections(id.value).catch(() => {
      projectStore.sections = []
    })
    await noteStore.fetchList(id.value).catch(() => {
      noteStore.notes = []
    })
  } catch (e: unknown) {
    if (gen !== loadGeneration) return

    const ax = e as {
      response?: { status?: number; data?: { error?: string } }
    }
    const status = ax.response?.status
    const apiMsg = ax.response?.data?.error
    let msg = t('projectDetail.loadProjectFailed')
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
    showNoteComposer.value = false
    trashModalOpen.value = false
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

watch(editProjectModalOpen, (open) => {
  const p = projectStore.current
  if (open && p) {
    editName.value = p.name
    editDescription.value = p.description ?? ''
  }
})

async function saveEditProject() {
  if (!Number.isFinite(id.value) || id.value <= 0) return
  editSaving.value = true
  try {
    await projectStore.update(id.value, {
      name: editName.value,
      description: editDescription.value,
    })
    editProjectModalOpen.value = false
    toast.success(t('projectDetail.projectUpdated'))
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : t('projectDetail.updateProjectFailed'))
  } finally {
    editSaving.value = false
  }
}

async function removeProjectFromEdit() {
  if (!Number.isFinite(id.value) || id.value <= 0) return
  const ok = await confirm({
    title: t('projects.deleteTitle'),
    message: t('projects.deleteMessage'),
    confirmLabelKey: 'projects.deleteConfirm',
    danger: true,
  })
  if (!ok) return
  try {
    await projectStore.remove(id.value)
    editProjectModalOpen.value = false
    toast.success(t('projectDetail.projectDeleted'))
    await router.push('/projects')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : t('projectDetail.deleteProjectFailed'))
  }
}

function openTaskDetail(taskId: number) {
  detailTaskId.value = taskId
  detailOpen.value = true
}

function openLinkedNote(payload: { noteId: number; projectId: number }) {
  if (payload.projectId !== id.value) return
  noteDetailId.value = payload.noteId
  noteDetailOpen.value = true
}

function openNoteDetail(noteId: number) {
  noteDetailId.value = noteId
  noteDetailOpen.value = true
}

watch(detailOpen, (open) => {
  if (!open) detailTaskId.value = null
})

watch(noteDetailOpen, open => {
  if (!open) noteDetailId.value = null
})

async function onWorkspaceRefreshed() {
  if (!Number.isFinite(id.value) || id.value <= 0) return
  await noteStore.fetchList(id.value, { quiet: true })
  await projectStore.fetchTasks(id.value)
  await projectStore.fetchSections(id.value).catch(() => {})
}

async function onNotesChanged() {
  await onWorkspaceRefreshed()
}

async function onTrashRestored() {
  await onWorkspaceRefreshed()
}

async function onRemoveNote(noteId: number) {
  if (!Number.isFinite(id.value) || id.value <= 0) return
  const n = noteStore.notes.find(x => x.id === noteId)
  const ok = await confirm({
    title: t('notes.confirm.deleteTitle'),
    message: t('notes.confirm.deleteMessage', { title: n?.title ?? '' }),
    confirmLabelKey: 'notes.confirm.deleteConfirm',
    danger: true,
  })
  if (!ok) return
  try {
    await noteStore.remove(id.value, noteId)
    toast.success(t('notes.detail.deleted'))
    await onNotesChanged()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : t('notes.detail.deleteFailed'))
  }
}

async function refreshProjectTasks() {
  await projectStore.fetchTasks(id.value)
}

async function onInlineComposerCreated() {
  await refreshProjectTasks()
  showTaskComposer.value = false
}

async function onNoteInlineCreated() {
  await onNotesChanged()
  showNoteComposer.value = false
}

async function createSectionFromToolbar() {
  const name = newSectionName.value.trim()
  if (!name || !Number.isFinite(id.value) || id.value <= 0) return
  savingSection.value = true
  try {
    await projectStore.createSection(id.value, name)
    newSectionName.value = ''
    showSectionAdd.value = false
    toast.success(t('project.section.created'))
    await onNotesChanged()
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, t('project.section.createFailed')))
  } finally {
    savingSection.value = false
  }
}

async function createTaskFromModal() {
  const trimmedTitle = modalTitle.value.trim()
  if (!trimmedTitle) {
    toast.error(t('projectDetail.enterTaskTitle'))
    return
  }
  const pid = Math.trunc(Number(modalProjectId.value))
  if (!pid) {
    toast.error(t('projectDetail.invalidProject'))
    return
  }
  modalSaving.value = true
  try {
    await taskStore.create({
      title: trimmedTitle,
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
    toast.success(t('projectDetail.taskCreated'))
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : t('projectDetail.createTaskFailed'))
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
    toast.success(t('projectDetail.taskReopened'))
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : t('projectDetail.updateTaskFailed'))
  }
}

async function openTrashModal() {
  if (!Number.isFinite(id.value) || id.value <= 0) return
  trashModalOpen.value = true
  try {
    await trashTasksStore.fetchTasks(id.value)
    await trashNotesStore.fetchNotes(id.value)
  } catch {
    toast.error(t('notes.trash.loadFailed'))
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
    <Breadcrumb class="mb-4" :items="projectBreadcrumbItems" />
    <div
      class="flex flex-wrap items-start justify-between gap-4"
    >
      <div class="min-w-0 flex-1">
        <h1 class="text-2xl font-semibold text-foreground">
          {{ projectStore.current.name }}
        </h1>
        <p class="mt-1 text-sm text-muted">
          {{ projectStore.current.description || t('common.noDescription') }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <router-link
          v-if="projectStore.current?.kind === 'team'"
          :to="`/projects/${id}/settings`"
          class="box-border inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-border/65 bg-surface-muted px-3 text-xs font-medium text-foreground transition-colors hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UsersIcon class="inline h-4 w-4 shrink-0" aria-hidden="true" />
          <span class="ml-1.5">{{ t('projectDetail.members') }}</span>
        </router-link>
        <Button
          type="button"
          variant="secondary"
          class="inline-flex shrink-0 items-center gap-1"
          @click="openTrashModal"
        >
          <ArchiveBoxIcon class="h-4 w-4" aria-hidden="true" />
          {{ t('projectDetail.tabs.trash') }}
        </Button>
        <Button
          v-if="canEditProject"
          type="button"
          variant="secondary"
          class="inline-flex shrink-0 items-center"
          @click="editProjectModalOpen = true"
        >
          <PencilSquareIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
          <span class="ml-1.5">{{ t('projectDetail.editProject') }}</span>
        </Button>
      </div>
    </div>

    <div class="mt-6 flex w-full flex-wrap items-center justify-between gap-2">
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <div class="min-w-[8rem] max-w-md flex-1">
          <UiInput
            id="project-workspace-search"
            v-model="searchQuery"
            :placeholder="t('projectDetail.searchPlaceholder')"
            autocomplete="off"
            :aria-label="t('common.search')"
          />
        </div>
        <UiSegmentedControl
          v-model="itemKind"
          class="shrink-0"
          :aria-label="t('projectDetail.itemKind.region')"
          :options="[
            { value: 'all', label: t('project.itemKind.all') },
            { value: 'tasks', label: t('project.itemKind.tasks') },
            { value: 'notes', label: t('project.itemKind.notes') },
          ]"
        />
        <Button
          type="button"
          variant="secondary"
          class="shrink-0 px-2.5"
          :aria-expanded="filtersOpen"
          aria-controls="project-workspace-filters"
          @click="filtersOpen = !filtersOpen"
        >
          <FunnelIcon class="h-4 w-4" aria-hidden="true" />
          <span class="sr-only">{{ t('common.filters') }}</span>
        </Button>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <label v-if="itemKind !== 'notes'" class="flex items-center gap-2 text-xs text-muted">
          <input v-model="manualOrder" type="checkbox" class="rounded border-border" />
          {{ t('projectDetail.manualSectionOrder') }}
        </label>
        <Button
          v-if="canCreateTasks"
          type="button"
          class="shrink-0"
          :disabled="!Number.isFinite(id) || id <= 0"
          @click="showTaskComposer = true"
        >
          {{ t('projectDetail.newTask') }}
        </Button>
        <Button
          v-if="canManageNoteOnProject"
          type="button"
          variant="secondary"
          class="shrink-0"
          @click="showNoteComposer = !showNoteComposer"
        >
          {{ t('projectDetail.newNote') }}
        </Button>
        <Button
          v-if="canManageNoteOnProject"
          type="button"
          variant="secondary"
          class="shrink-0"
          @click="showSectionAdd = !showSectionAdd"
        >
          {{ showSectionAdd ? t('common.cancel') : t('projectDetail.addSection') }}
        </Button>
      </div>
    </div>

    <div
      v-if="canManageNoteOnProject && showSectionAdd"
      class="mt-3 flex flex-wrap items-center gap-2"
    >
      <UiInput
        v-model="newSectionName"
        class="min-w-[12rem] max-w-md flex-1"
        :placeholder="t('project.section.namePlaceholder')"
        @keydown.enter.prevent="createSectionFromToolbar"
      />
      <Button type="button" :loading="savingSection" @click="createSectionFromToolbar">
        {{ t('common.create') }}
      </Button>
    </div>

    <div
      v-show="filtersOpen && itemKind !== 'notes'"
      id="project-workspace-filters"
      role="region"
      class="mt-4"
      :aria-label="t('projectDetail.taskFiltersRegion')"
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
        hide-group-by
        @reset="resetTaskFilters"
      />
    </div>

    <div v-if="canCreateTasks && showTaskComposer" class="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
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

    <div v-if="canManageNoteOnProject && showNoteComposer" class="mt-6 overflow-hidden rounded-lg border border-border bg-surface p-3">
      <NoteInlineComposer
        :project-id="id"
        :sections="projectStore.sections"
        :section-id="null"
        :can-manage="canManageNoteOnProject"
        @created="onNoteInlineCreated"
      />
    </div>

    <template v-if="totalItemCount === 0 && (projectStore.tasks.length > 0 || noteStore.notes.length > 0)">
      <EmptyState
        class="mt-6"
        :title="t('projectDetail.emptyNoMatchTitle')"
        :description="t('projectDetail.emptyNoMatchDescription')"
      >
        <Button variant="secondary" type="button" @click="resetTaskFilters">
          {{ t('projectDetail.resetFilters') }}
        </Button>
      </EmptyState>
    </template>
    <template v-else-if="totalItemCount === 0">
      <EmptyState
        class="mt-6"
        :title="t('projectDetail.emptyWorkspaceTitle')"
        :description="t('projectDetail.emptyWorkspaceDescription')"
      />
    </template>
    <!-- TODO(items-reorder): wire task DnD to unified section items reorder endpoint -->
    <ProjectItemList
      v-else
      class="mt-6"
      :groups="itemGroups"
      :project-id="Number.isFinite(id) ? id : 0"
      :can-manage-sections="canManageNoteOnProject"
      :can-manage-note="canManageNoteOnProject"
      :can-edit-task="canManageTask"
      :can-change-status-task="canChangeTaskStatus"
      :projects="projectOptions"
      :assignable-users="assignableUsers"
      :enable-task-drag="false"
      @sections-updated="onNotesChanged"
      @complete="onComplete"
      @reopen="onReopen"
      @info="openTaskDetail"
      @open-note="openLinkedNote"
      @task-updated="refreshProjectTasks"
      @open-note-detail="openNoteDetail"
      @edit-note="openNoteDetail"
      @remove-note="onRemoveNote"
    />

    <TaskDetailModal
      v-model="detailOpen"
      :task-id="detailTaskId"
      @saved="refreshProjectTasks"
      @open-note="openLinkedNote"
    />

    <NoteDetailModal
      v-model="noteDetailOpen"
      :project-id="id"
      :note-id="noteDetailId"
      :sections="projectStore.sections"
      :project-tasks="projectTasksForNotes"
      :can-manage="canManageNoteOnProject"
      @saved="onNotesChanged"
      @deleted="onNotesChanged"
    />

    <Modal v-model="trashModalOpen" :title="t('projectDetail.tabs.trash')">
      <ProjectTrashPanel
        :project-id="id"
        :can-manage="canManageNoteOnProject"
        @restored="onTrashRestored"
      />
    </Modal>

    <Modal v-model="editProjectModalOpen" :title="t('projectDetail.modalEditTitle')">
      <ProjectForm
        v-model:name="editName"
        v-model:description="editDescription"
        :submit-label="t('common.save')"
        :loading="editSaving"
        @submit="saveEditProject"
        @cancel="editProjectModalOpen = false"
      >
        <template #actions-start>
          <Button
            variant="ghost-danger"
            type="button"
            @click="removeProjectFromEdit"
          >
            {{ t('projects.deleteButton') }}
          </Button>
        </template>
      </ProjectForm>
    </Modal>

    <Modal v-if="canCreateTasks" v-model="showModal" :title="t('projectDetail.modalNewTaskTitle')">
      <TaskForm
        v-model:title="modalTitle"
        v-model:description="modalDescription"
        v-model:project-id="modalProjectId"
        v-model:status="modalStatus"
        v-model:priority="modalPriority"
        hide-project-select
        :projects="projectOptions"
        :loading="modalSaving"
        :submit-label="t('projectDetail.submitCreate')"
        @submit="createTaskFromModal"
        @cancel="showModal = false"
      />
    </Modal>
  </div>
  <div v-else-if="loadError" class="space-y-4">
    <Breadcrumb class="mb-4" :items="projectErrorBreadcrumbItems" />
    <EmptyState
      :title="t('projectDetail.unavailableTitle')"
      :description="loadError"
    >
      <div class="mt-4 flex flex-wrap gap-2">
        <Button type="button" @click="load">{{ t('common.retry') }}</Button>
        <Button
          type="button"
          variant="secondary"
          @click="router.push('/projects')"
        >
          {{ t('projectDetail.allProjects') }}
        </Button>
      </div>
    </EmptyState>
  </div>
</template>
