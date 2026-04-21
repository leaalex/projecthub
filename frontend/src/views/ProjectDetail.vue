<script setup lang="ts">
import { ArchiveBoxIcon, FunnelIcon, PencilSquareIcon, UsersIcon } from '@heroicons/vue/24/outline'
import { storeToRefs } from 'pinia'
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
import NoteForm from '../components/notes/NoteForm.vue'
import ProjectForm from '../components/projects/ProjectForm.vue'
import ProjectItemList from '../components/projects/ProjectItemList.vue'
import SectionEditModal from '../components/projects/SectionEditModal.vue'
import NoteDetailModal from '../components/notes/NoteDetailModal.vue'
import {
  presentProjectItems,
  type ProjectItemGroup,
  type ProjectItemKindFilter,
} from '@app/composables/useProjectItemsPresentation'
import {
  type AssigneeFilterValue,
  type SortDir,
  type TaskGroupBy,
  type TaskSortKey,
} from '@app/composables/useTaskListPresentation'
import { useAuthStore } from '@app/auth.store'
import { useDetailPanelStore } from '@app/detailPanel.store'
import { useProjectStore } from '@app/project.store'
import { useTaskStore } from '@app/task.store'
import { extractNoteAxiosError, useNoteStore } from '@app/note.store'
import { useProjectScopedAssignableUsers } from '@app/composables/useAdminAssignableUsers'
import { useConfirm } from '@app/composables/useConfirm'
import { useTaskEditPermission } from '@app/composables/useCanEditTask'
import { useToast } from '@app/composables/useToast'
import { isPrivilegedRole } from '@domain/user/role'
import type { TaskPriority, TaskStatus } from '@domain/task/types'
import type { NotePermissionContext } from '@domain/note/permissions'
import { canManageNote } from '@domain/note/permissions'
import { mapApiError } from '@infra/api/errorMap'

const toast = useToast()
const { t } = useI18n()
const { confirm } = useConfirm()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const noteStore = useNoteStore()
const detailPanel = useDetailPanelStore()
const { pendingTaskEditId, pendingNoteEdit, workspaceRefreshTick } =
  storeToRefs(detailPanel)

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

const taskEditModalOpen = ref(false)
const taskEditModalId = ref<number | null>(null)
const noteEditModalOpen = ref(false)
const noteEditModalId = ref<number | null>(null)
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

const sectionEditOpen = ref(false)
const sectionEditId = ref<number | null>(null)
const sectionEditName = ref('')
const showNoteModal = ref(false)
const savingNote = ref(false)
const noteCreateTitle = ref('')
const noteCreateBody = ref('')
const noteCreateSectionId = ref<number | null>(null)

const noteCreateModalDirty = computed(
  () =>
    showNoteModal.value
    && (noteCreateTitle.value.trim() !== ''
      || noteCreateBody.value.trim() !== ''
      || noteCreateSectionId.value !== null),
)
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
const modalTaskSectionId = ref<number | null>(null)
const modalStatus = ref<TaskStatus>('todo')
const modalPriority = ref<TaskPriority>('medium')
const modalSaving = ref(false)

const taskCreateModalDirty = computed(
  () =>
    showModal.value
    && (modalTitle.value.trim() !== ''
      || modalDescription.value.trim() !== ''
      || modalStatus.value !== 'todo'
      || modalPriority.value !== 'medium'
      || modalTaskSectionId.value !== null),
)

const editProjectModalOpen = ref(false)
const editName = ref('')
const editDescription = ref('')
const editSaving = ref(false)

const editProjectModalDirty = computed(() => {
  if (!editProjectModalOpen.value) return false
  const p = projectStore.current
  if (!p) return false
  return (
    editName.value.trim() !== p.name
    || editDescription.value.trim() !== (p.description ?? '').trim()
  )
})

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
    const msg = mapApiError(e, 'projectDetail.loadProjectFailed')

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
    showModal.value = false
    showNoteModal.value = false
    resetTaskFilters()
    void load()
  },
  { immediate: true },
)

watch(showModal, (open) => {
  if (!open) {
    modalTitle.value = ''
    modalDescription.value = ''
    modalTaskSectionId.value = null
    modalStatus.value = 'todo'
    modalPriority.value = 'medium'
    return
  }
  if (Number.isFinite(id.value) && id.value > 0) {
    modalProjectId.value = id.value
  }
})

watch(showNoteModal, open => {
  if (!open) {
    noteCreateTitle.value = ''
    noteCreateBody.value = ''
    noteCreateSectionId.value = null
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
    toast.error(mapApiError(e, 'projectDetail.updateProjectFailed'))
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
    toast.error(mapApiError(e, 'projectDetail.deleteProjectFailed'))
  }
}

function openTaskView(taskId: number) {
  detailPanel.openTask(taskId)
}

function openTaskEdit(taskId: number) {
  taskEditModalId.value = taskId
  taskEditModalOpen.value = true
}

function openLinkedNote(payload: { noteId: number; projectId: number }) {
  if (payload.projectId !== id.value) return
  detailPanel.openNote(payload.projectId, payload.noteId)
}

function openTaskFromNote(taskId: number) {
  detailPanel.openTask(taskId)
}

function openNoteView(noteId: number) {
  if (!Number.isFinite(id.value) || id.value <= 0) return
  detailPanel.openNote(id.value, noteId)
}

function openNoteEdit(noteId: number) {
  noteEditModalId.value = noteId
  noteEditModalOpen.value = true
}

function onEditSection(payload: { sectionId: number; name: string }) {
  sectionEditId.value = payload.sectionId
  sectionEditName.value = payload.name
  sectionEditOpen.value = true
}

function openSectionCreate() {
  sectionEditId.value = null
  sectionEditName.value = ''
  sectionEditOpen.value = true
}

function sectionKeyFromSectionId(sectionId: number | null): string {
  return sectionId == null ? 'unsectioned' : `s-${sectionId}`
}

function currentSectionIdForItem(
  kind: 'task' | 'note',
  itemId: number,
): number | null | undefined {
  if (kind === 'task') {
    const task = projectStore.tasks.find(t => t.id === itemId)
    return task ? task.section_id ?? null : undefined
  }
  const note = noteStore.notes.find(n => n.id === itemId)
  return note ? note.section_id ?? null : undefined
}

/**
 * Строит новый порядок kind+id в целевой секции по drop-индексу (как в ProjectItemList).
 */
function buildOrderedSectionItems(
  groups: ProjectItemGroup[],
  targetSectionId: number | null,
  payload: { kind: 'task' | 'note'; id: number; position: number },
): { kind: 'task' | 'note'; id: number }[] {
  const key = sectionKeyFromSectionId(targetSectionId)
  const g = groups.find(x => x.key === key)
  if (!g) return []

  const current = g.items.map((it): { kind: 'task' | 'note'; id: number } =>
    it.kind === 'task'
      ? { kind: 'task', id: it.task.id }
      : { kind: 'note', id: it.note.id },
  )
  const filtered = current.filter(
    x => !(x.kind === payload.kind && x.id === payload.id),
  )
  const oldIdx = current.findIndex(
    x => x.kind === payload.kind && x.id === payload.id,
  )
  let insertAt = payload.position
  if (oldIdx >= 0 && oldIdx < insertAt) {
    insertAt -= 1
  }
  insertAt = Math.max(0, Math.min(insertAt, filtered.length))
  filtered.splice(insertAt, 0, { kind: payload.kind, id: payload.id })
  return filtered
}

async function onItemMove(payload: {
  kind: 'task' | 'note'
  id: number
  sectionId: number | null
  position: number
}) {
  const pid = id.value
  if (!Number.isFinite(pid) || pid <= 0) return

  const currentSec = currentSectionIdForItem(payload.kind, payload.id)
  if (currentSec === undefined) return

  const targetSec = payload.sectionId

  try {
    if (currentSec !== targetSec) {
      if (payload.kind === 'task') {
        await taskStore.moveTask(pid, {
          task_id: payload.id,
          section_id: targetSec,
          position: payload.position,
        })
      } else {
        await noteStore.move(
          pid,
          payload.id,
          { section_id: targetSec, position: payload.position },
          { refetch: false },
        )
      }
    }

    const ordered = buildOrderedSectionItems(
      itemGroups.value,
      targetSec,
      payload,
    )
    if (ordered.length === 0) {
      await onNotesChanged()
      return
    }
    await projectStore.reorderSectionItems(pid, targetSec, ordered)
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, 'tasks.toasts.moveFailed'))
    await Promise.all([
      projectStore.fetchTasks(pid),
      noteStore.fetchList(pid, { quiet: true }),
    ])
  }
}

watch(taskEditModalOpen, open => {
  if (!open) taskEditModalId.value = null
})

watch(noteEditModalOpen, open => {
  if (!open) noteEditModalId.value = null
})

watch(pendingTaskEditId, tid => {
  if (tid == null) return
  openTaskEdit(tid)
  detailPanel.clearPendingTaskEdit()
})

watch(pendingNoteEdit, payload => {
  if (!payload) return
  if (payload.projectId !== id.value) {
    detailPanel.clearPendingNoteEdit()
    return
  }
  openNoteEdit(payload.noteId)
  detailPanel.clearPendingNoteEdit()
})

watch(workspaceRefreshTick, () => {
  void onWorkspaceRefreshed()
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

async function refreshProjectTasks() {
  await projectStore.fetchTasks(id.value)
}

async function createNoteFromModal(payload: {
  title: string
  body: string
  section_id: number | null
}) {
  if (!Number.isFinite(id.value) || id.value <= 0) return
  savingNote.value = true
  try {
    await noteStore.create(id.value, {
      title: payload.title,
      body: payload.body,
      section_id: payload.section_id ?? undefined,
    })
    showNoteModal.value = false
    await onNotesChanged()
    toast.success(t('notes.toasts.created'))
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, 'notes.toasts.createFailed'))
  } finally {
    savingNote.value = false
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
      section_id: modalTaskSectionId.value ?? undefined,
      status: modalStatus.value,
      priority: modalPriority.value,
    })
    showModal.value = false
    await refreshProjectTasks()
    toast.success(t('projectDetail.taskCreated'))
  } catch (e: unknown) {
    toast.error(mapApiError(e, 'projectDetail.createTaskFailed'))
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
    toast.error(mapApiError(e, 'projectDetail.updateTaskFailed'))
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
        <router-link
          v-if="Number.isFinite(id) && id > 0"
          :to="{ name: 'project-trash', params: { id } }"
          class="box-border inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-border/65 bg-surface-muted px-3 text-xs font-medium text-foreground transition-colors hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArchiveBoxIcon class="h-4 w-4" aria-hidden="true" />
          {{ t('projectDetail.tabs.trash') }}
        </router-link>
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
        <Button
          v-if="canCreateTasks"
          type="button"
          class="shrink-0"
          :disabled="!Number.isFinite(id) || id <= 0"
          @click="showModal = true"
        >
          {{ t('projectDetail.newTask') }}
        </Button>
        <Button
          v-if="canManageNoteOnProject"
          type="button"
          variant="secondary"
          class="shrink-0"
          @click="showNoteModal = true"
        >
          {{ t('projectDetail.newNote') }}
        </Button>
        <Button
          v-if="canManageNoteOnProject"
          type="button"
          variant="secondary"
          class="shrink-0"
          @click="openSectionCreate"
        >
          {{ t('projectDetail.addSection') }}
        </Button>
      </div>
    </div>

    <div
      v-show="filtersOpen"
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
        v-model:project-item-kind="itemKind"
        v-model:manual-section-order="manualOrder"
        :projects="projectOptions"
        :assignable-users="assignableUsers"
        :show-assignee-filter="showAssigneeFilter"
        hide-project-filter
        hide-group-by
        show-project-workspace-options
        @reset="resetTaskFilters"
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
    <ProjectItemList
      v-else
      class="mt-6"
      :groups="itemGroups"
      :project-id="Number.isFinite(id) ? id : 0"
      :can-manage-sections="canManageNoteOnProject"
      :can-manage-note="canManageNoteOnProject"
      :can-edit-task="canManageTask"
      :can-change-status-task="canChangeTaskStatus"
      @sections-updated="onNotesChanged"
      @move="onItemMove"
      @complete="onComplete"
      @reopen="onReopen"
      @view-task="openTaskView"
      @edit-task="openTaskEdit"
      @view-note="openNoteView"
      @edit-note="openNoteEdit"
      @edit-section="onEditSection"
    />

    <TaskDetailModal
      v-model="taskEditModalOpen"
      :task-id="taskEditModalId"
      initial-mode="edit"
      @saved="refreshProjectTasks"
      @open-note="openLinkedNote"
    />

    <NoteDetailModal
      v-model="noteEditModalOpen"
      :project-id="id"
      :note-id="noteEditModalId"
      :sections="projectStore.sections"
      :project-tasks="projectTasksForNotes"
      :can-manage="canManageNoteOnProject"
      initial-mode="edit"
      @saved="onNotesChanged"
      @deleted="onNotesChanged"
      @open-task="openTaskFromNote"
    />

    <SectionEditModal
      v-model="sectionEditOpen"
      :project-id="Number.isFinite(id) ? id : 0"
      :section-id="sectionEditId"
      :initial-name="sectionEditName"
      @saved="onNotesChanged"
      @deleted="onNotesChanged"
    />

    <Modal
      v-model="editProjectModalOpen"
      :title="t('projectDetail.modalEditTitle')"
      :dirty="editProjectModalDirty"
    >
      <ProjectForm
        v-model:name="editName"
        v-model:description="editDescription"
        form-id="project-edit-form"
        hide-footer
        :submit-label="t('common.save')"
        :loading="editSaving"
        @submit="saveEditProject"
      />
      <template #footer>
        <div class="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost-danger"
            type="button"
            @click="removeProjectFromEdit"
          >
            {{ t('projects.deleteButton') }}
          </Button>
          <div class="ml-auto flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              :disabled="editSaving"
              @click="editProjectModalOpen = false"
            >
              {{ t('projectForm.cancel') }}
            </Button>
            <Button
              type="submit"
              form="project-edit-form"
              :loading="editSaving"
            >
              {{ t('common.save') }}
            </Button>
          </div>
        </div>
      </template>
    </Modal>

    <Modal
      v-if="canCreateTasks"
      v-model="showModal"
      :title="t('projectDetail.modalNewTaskTitle')"
      :dirty="taskCreateModalDirty"
    >
      <TaskForm
        v-model:title="modalTitle"
        v-model:description="modalDescription"
        v-model:project-id="modalProjectId"
        v-model:section-id="modalTaskSectionId"
        v-model:status="modalStatus"
        v-model:priority="modalPriority"
        form-id="project-new-task"
        hide-footer
        hide-project-select
        :sections="projectStore.sections"
        :projects="projectOptions"
        :loading="modalSaving"
        :submit-label="t('projectDetail.submitCreate')"
        @submit="createTaskFromModal"
      />
      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" :disabled="modalSaving" @click="showModal = false">
            {{ t('taskForm.cancel') }}
          </Button>
          <Button
            type="submit"
            form="project-new-task"
            :loading="modalSaving"
          >
            {{ t('projectDetail.submitCreate') }}
          </Button>
        </div>
      </template>
    </Modal>

    <Modal
      v-if="canManageNoteOnProject"
      v-model="showNoteModal"
      :title="t('notes.create')"
      :dirty="noteCreateModalDirty"
    >
      <NoteForm
        v-model:title="noteCreateTitle"
        v-model:body="noteCreateBody"
        v-model:section-id="noteCreateSectionId"
        :sections="projectStore.sections"
        form-id="project-new-note"
        hide-footer
        :loading="savingNote"
        :submit-label="t('notes.create')"
        @submit="createNoteFromModal"
      />
      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            :disabled="savingNote"
            @click="showNoteModal = false"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button
            type="submit"
            form="project-new-note"
            :loading="savingNote"
          >
            {{ t('notes.create') }}
          </Button>
        </div>
      </template>
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
