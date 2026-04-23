<script setup lang="ts">
import { storeToRefs } from 'pinia'
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
import NoteCard from '../components/notes/NoteCard.vue'
import NoteDetailModal from '../components/notes/NoteDetailModal.vue'
import TaskDetailModal from '../components/tasks/TaskDetailModal.vue'
import NoteForm from '../components/notes/NoteForm.vue'
import NoteFiltersPanel from '../components/notes/NoteFiltersPanel.vue'
import ProjectItemList from '../components/projects/ProjectItemList.vue'
import {
  presentNotes,
  type NoteGroupBy,
  type NoteSortKey,
  type SortDir,
} from '@app/composables/useNoteListPresentation'
import {
  type ProjectItemGroup,
  sectionDisplayMode,
} from '@app/composables/useProjectItemsPresentation'
import type { Note } from '@domain/note/types'
import type { SectionDisplayMode } from '@domain/project/types'
import { useAuthStore } from '@app/auth.store'
import { useDetailPanelStore } from '@app/detailPanel.store'
import { useProjectStore } from '@app/project.store'
import { useNoteStore } from '@app/note.store'
import { useTaskStore } from '@app/task.store'
import { useToast } from '@app/composables/useToast'
import { isPrivilegedRole } from '@domain/user/role'
import type { NotePermissionContext } from '@domain/note/permissions'
import { canManageNote } from '@domain/note/permissions'
import { extractNoteAxiosError } from '@app/note.store'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const projectStore = useProjectStore()
const noteStore = useNoteStore()
const taskStore = useTaskStore()
const toast = useToast()
const detailPanel = useDetailPanelStore()
const { pendingTaskEditId, pendingNoteEdit, workspaceRefreshTick } =
  storeToRefs(detailPanel)

const filterProject = ref<number | ''>('')
const searchQuery = ref('')
const sortKey = ref<NoteSortKey>('updated_at')
const sortDir = ref<SortDir>('desc')
const groupBy = ref<NoteGroupBy>('project')
const filtersOpen = ref(false)
const allowServerFilterWatch = ref(false)

const canCreateNotes = computed(() => {
  const u = auth.user
  if (!u) return false
  if (isPrivilegedRole(u.role)) return true
  return projectStore.projects.some(p => {
    if (p.owner_id === u.id) return true
    const r = p.caller_project_role
    return r === 'manager' || r === 'owner'
  })
})

const notePermissionCtx = computed(
  (): NotePermissionContext => ({
    projects: projectStore.projects.map(p => ({
      id: p.id,
      owner_id: p.owner_id,
      caller_project_role: p.caller_project_role,
    })),
    current: projectStore.current
      ? {
          id: projectStore.current.id,
          owner_id: projectStore.current.owner_id,
          caller_project_role: projectStore.current.caller_project_role,
        }
      : null,
  }),
)

function canManageNoteForProject(projectId: number): boolean {
  return canManageNote(
    auth.user?.id,
    auth.user?.role,
    notePermissionCtx.value,
    projectId,
  )
}

const inlineComposerProjects = computed(() =>
  projectStore.projects.map(p => ({ id: p.id, name: p.name })),
)

const allowSectionGroup = computed(
  () => filterProject.value !== '' && Number.isFinite(Number(filterProject.value)),
)

const effectiveGroupBy = computed<NoteGroupBy>(() => {
  if (!allowSectionGroup.value && groupBy.value === 'section') return 'project'
  return groupBy.value
})

const projectIdToName = computed(() => {
  const m = new Map<number, string>()
  for (const p of projectStore.projects) m.set(p.id, p.name)
  return m
})

const presentation = computed(() =>
  presentNotes(noteStore.notes, {
    search: searchQuery.value,
    sortKey: sortKey.value,
    sortDir: sortDir.value,
    groupBy: effectiveGroupBy.value,
    projectIdToName: projectIdToName.value,
    sections: projectStore.sections,
    t,
  }),
)

const displayGroups = computed(() => presentation.value.groups)
const displayFlat = computed(() => presentation.value.flat)

const filteredProjectId = computed((): number | null => {
  const n = Number(filterProject.value)
  if (filterProject.value === '' || !Number.isFinite(n) || n <= 0) return null
  return n
})

/** DnD порядка заметок: один проект в фильтре, группировка по секциям, права на управление. */
const notesDnDEnabled = computed(() => {
  if (effectiveGroupBy.value !== 'section') return false
  const pid = filteredProjectId.value
  if (pid == null) return false
  return canManageNoteForProject(pid)
})

const sectionGroupsForNotesList = computed(() => {
  const sourceSections =
    filteredProjectId.value != null ? projectStore.sections : []
  const sectionById = new Map(sourceSections.map(s => [s.id, s]))
  const map = new Map<
    string,
    {
      key: string
      label: string
      order: number
      displayMode: SectionDisplayMode
      notes: Note[]
    }
  >()
  map.set('unsectioned', {
    key: 'unsectioned',
    label: t('tasks.unsectioned'),
    order: -1,
    displayMode: 'plain',
    notes: [],
  })
  for (const s of [...sourceSections].sort(
    (a, b) => a.position - b.position || a.id - b.id,
  )) {
    map.set(`s-${s.id}`, {
      key: `s-${s.id}`,
      label: s.name,
      order: s.position,
      displayMode: sectionDisplayMode(s.display_mode),
      notes: [],
    })
  }
  for (const n of displayFlat.value) {
    const key = n.section_id == null ? 'unsectioned' : `s-${n.section_id}`
    if (!map.has(key)) {
      const meta = n.section_id != null ? sectionById.get(n.section_id) : undefined
      map.set(key, {
        key,
        label: t('notes.unknownSection', { id: n.section_id }),
        order: Number.MAX_SAFE_INTEGER,
        displayMode: sectionDisplayMode(meta?.display_mode),
        notes: [],
      })
    }
    map.get(key)!.notes.push(n)
  }
  return [...map.values()]
    .filter(g => g.notes.length > 0)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map(
      ({ key, label, displayMode, notes: noteList }) => ({
        key,
        label,
        displayMode,
        notes: notesDnDEnabled.value
          ? [...noteList].sort(
              (a, b) => a.position - b.position || a.id - b.id,
            )
          : noteList,
      }),
    )
})

const sectionWorkspaceGroups = computed((): ProjectItemGroup[] =>
  sectionGroupsForNotesList.value.map((g, idx) => ({
    key: g.key,
    label: g.label,
    order: idx,
    displayMode: g.displayMode,
    items: g.notes.map(n => ({ kind: 'note' as const, note: n })),
  })),
)

const canManageNotesInCurrentFilter = computed(() => {
  const pid = filteredProjectId.value
  return pid != null && canManageNoteForProject(pid)
})

function sectionKeyFromSectionId(sectionId: number | null): string {
  return sectionId == null ? 'unsectioned' : `s-${sectionId}`
}

function sectionIdMatchesStore(
  sectionId: number | null,
  itemSectionId: number | null | undefined,
): boolean {
  return (itemSectionId ?? null) === sectionId
}

function currentSectionIdForNote(noteId: number): number | null | undefined {
  const n = noteStore.notes.find(x => x.id === noteId)
  return n ? n.section_id ?? null : undefined
}

async function onNoteMove(payload: {
  kind: 'task' | 'note'
  id: number
  sectionId: number | null
  position: number
}) {
  if (payload.kind !== 'note') return
  const pid = filteredProjectId.value
  if (pid == null) return

  const currentSec = currentSectionIdForNote(payload.id)
  if (currentSec === undefined) return
  const targetSec = payload.sectionId

  const key = sectionKeyFromSectionId(targetSec)
  const grp = sectionWorkspaceGroups.value.find(x => x.key === key)

  const tasks = taskStore.tasks
    .filter(
      t =>
        t.project_id === pid
        && sectionIdMatchesStore(targetSec, t.section_id),
    )
    .map(t => ({ kind: 'task' as const, id: t.id, position: t.position }))
  const notes = noteStore.notes
    .filter(
      n =>
        n.project_id === pid
        && sectionIdMatchesStore(targetSec, n.section_id),
    )
    .map(n => ({ kind: 'note' as const, id: n.id, position: n.position }))
  const mixed = [...tasks, ...notes].sort(
    (a, b) => a.position - b.position || a.id - b.id,
  )

  /** Индекс вставки в смешанном списке: ProjectItemList даёт позицию только среди заметок группы. */
  let mixedInsertAt: number
  if (!grp || payload.position >= grp.items.length) {
    mixedInsertAt = mixed.length
  } else {
    const targetItem = grp.items[payload.position]
    if (targetItem.kind !== 'note') {
      mixedInsertAt = mixed.length
    } else {
      const idx = mixed.findIndex(
        m => m.kind === 'note' && m.id === targetItem.note.id,
      )
      mixedInsertAt = idx >= 0 ? idx : mixed.length
    }
  }

  try {
    const filtered = mixed.filter(
      x => !(x.kind === 'note' && x.id === payload.id),
    )
    const oldIdx = mixed.findIndex(
      x => x.kind === 'note' && x.id === payload.id,
    )
    let insertAt = mixedInsertAt
    if (oldIdx >= 0 && oldIdx < insertAt) insertAt -= 1
    insertAt = Math.max(0, Math.min(insertAt, filtered.length))
    const before = filtered[insertAt - 1] ?? null
    const after = filtered[insertAt] ?? null

    await projectStore.moveItem(pid, {
      kind: 'note',
      id: payload.id,
      sectionId: targetSec,
      beforeRef: before ? { kind: before.kind, id: before.id } : null,
      afterRef: after ? { kind: after.kind, id: after.id } : null,
    })
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, 'tasks.toasts.moveFailed'))
    await Promise.all([
      projectStore.fetchTasks(pid).catch(() => {}),
      noteStore.fetchList(pid, { quiet: true }).catch(() => {}),
    ])
  } finally {
    await load()
  }
}

function onSectionListViewNote(noteId: number) {
  const pid = filteredProjectId.value
  if (pid == null) return
  openNoteView(noteId, pid)
}

function onSectionListEditNote(noteId: number) {
  const pid = filteredProjectId.value
  if (pid == null) return
  void openNoteEdit(noteId, pid)
}

const notesBreadcrumbItems = computed(() => [
  { label: t('common.home'), to: '/dashboard' },
  { label: t('notes.breadcrumb') },
])

const showCreateModal = ref(false)
const createProjectIdPrefill = ref<number | null>(null)
const createSaving = ref(false)
const createTitle = ref('')
const createBody = ref('')
const createSectionId = ref<number | null>(null)

const createModalDirty = computed(
  () =>
    showCreateModal.value
    && (createTitle.value.trim() !== ''
      || createBody.value.trim() !== ''
      || createSectionId.value !== null),
)

const noteEditModalOpen = ref(false)
const noteEditModalId = ref<number | null>(null)
const noteEditProjectId = ref(0)

const taskEditModalOpen = ref(false)
const taskEditModalId = ref<number | null>(null)

const projectTasksForNoteModal = computed(() => {
  const pid = noteEditProjectId.value
  return taskStore.tasks
    .filter(tk => tk.project_id === pid)
    .map(tk => ({ id: tk.id, title: tk.title }))
})

const canManageDetailNote = computed(() =>
  canManageNoteForProject(noteEditProjectId.value),
)

function syncFiltersFromRoute() {
  const pid = route.query.project_id
  if (pid != null && pid !== '') {
    const n = Number(pid)
    filterProject.value = Number.isFinite(n) ? n : ''
  } else {
    filterProject.value = ''
  }
}

function openNoteView(noteId: number, projectId: number) {
  detailPanel.openNote(projectId, noteId)
}

async function openNoteEdit(noteId: number, projectId: number) {
  noteEditProjectId.value = projectId
  noteEditModalId.value = noteId
  await prepareNoteModalContext(projectId)
  noteEditModalOpen.value = true
}

function openTaskFromNote(taskId: number) {
  detailPanel.openTask(taskId)
}

function openNoteFromTask(payload: { noteId: number; projectId: number }) {
  detailPanel.openNote(payload.projectId, payload.noteId)
}

async function prepareNoteModalContext(projectId: number) {
  await projectStore.fetchOne(projectId).catch(() => {})
  await projectStore.fetchSections(projectId)
  await noteStore.fetchList(projectId, { quiet: true })
  await taskStore.fetchList({ project_id: projectId }).catch(() => {})
}

watch(noteEditModalOpen, open => {
  if (!open) {
    noteEditModalId.value = null
    noteEditProjectId.value = 0
  }
})

watch(taskEditModalOpen, open => {
  if (!open) taskEditModalId.value = null
})

watch(pendingTaskEditId, tid => {
  if (tid == null) return
  taskEditModalId.value = tid
  taskEditModalOpen.value = true
  detailPanel.clearPendingTaskEdit()
})

watch(pendingNoteEdit, async payload => {
  if (!payload) return
  noteEditProjectId.value = payload.projectId
  noteEditModalId.value = payload.noteId
  await prepareNoteModalContext(payload.projectId)
  noteEditModalOpen.value = true
  detailPanel.clearPendingNoteEdit()
})

watch(workspaceRefreshTick, () => {
  void load()
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

watch(
  filterProject,
  async pid => {
    if (pid === '') {
      projectStore.clearSections()
    } else {
      const n = Number(pid)
      if (!Number.isFinite(n) || n <= 0) {
        projectStore.clearSections()
      } else {
        await projectStore.fetchSections(n).catch(() => {
          projectStore.clearSections()
        })
      }
    }
    if (!allowServerFilterWatch.value) return
    await load()
  },
  { immediate: true },
)

watch(showCreateModal, async open => {
  if (!open) {
    createTitle.value = ''
    createBody.value = ''
    createSectionId.value = null
    return
  }
  const filtered = Number(filterProject.value)
  if (filterProject.value !== '' && Number.isFinite(filtered) && filtered > 0) {
    createProjectIdPrefill.value = filtered
  } else {
    createProjectIdPrefill.value = projectStore.projects[0]?.id ?? null
  }
  const pid = createProjectIdPrefill.value
  if (pid != null && pid > 0) {
    await projectStore.fetchSections(pid).catch(() => {})
  }
})

async function onCreateFormProjectPicked(projectId: number) {
  await projectStore.fetchSections(projectId).catch(() => {})
}

async function load() {
  const params: { project_id?: number } = {}
  if (filterProject.value !== '') {
    const n = Number(filterProject.value)
    if (Number.isFinite(n) && n > 0) {
      params.project_id = n
      await taskStore.fetchList({ project_id: n }).catch(() => {})
    }
  }
  try {
    await noteStore.fetchAll(params)
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, 'notes.toasts.loadFailed'))
  }
}

function resetToolbar() {
  filtersOpen.value = false
  searchQuery.value = ''
  sortKey.value = 'updated_at'
  sortDir.value = 'desc'
  groupBy.value = 'project'
  filterProject.value = ''
  router.replace({ path: route.path, query: {} })
}

async function onCreateSubmit(payload: {
  title: string
  body: string
  section_id: number | null
  project_id?: number
}) {
  const pid = Math.trunc(Number(payload.project_id ?? 0))
  if (!pid) {
    toast.error(t('tasks.toasts.selectProject'))
    return
  }
  createSaving.value = true
  try {
    await noteStore.create(pid, {
      title: payload.title,
      body: payload.body,
      section_id: payload.section_id ?? undefined,
    })
    showCreateModal.value = false
    toast.success(t('notes.toasts.created'))
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, 'notes.toasts.createFailed'))
  } finally {
    createSaving.value = false
  }
}

</script>

<template>
  <div>
    <Breadcrumb class="mb-4" :items="notesBreadcrumbItems" />
    <div class="min-w-0">
      <h1 class="text-2xl font-semibold text-foreground">{{ t('notes.pageTitle') }}</h1>
      <p class="mt-1 text-sm text-muted">
        {{
          isPrivilegedRole(auth.user?.role)
            ? t('notes.subtitleAdmin')
            : t('notes.subtitleDefault')
        }}
      </p>
    </div>

    <div
      class="mt-6 flex w-full flex-wrap items-center justify-between gap-2"
    >
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <div class="min-w-[8rem] max-w-md flex-1">
          <UiInput
            id="notes-search"
            v-model="searchQuery"
            :placeholder="t('notes.searchPlaceholder')"
            autocomplete="off"
            :aria-label="t('common.search')"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          class="shrink-0 px-2.5"
          :aria-expanded="filtersOpen"
          aria-controls="note-filters-panel"
          @click="filtersOpen = !filtersOpen"
        >
          <FunnelIcon class="h-4 w-4" aria-hidden="true" />
          <span class="sr-only">{{ t('common.filters') }}</span>
        </Button>
      </div>
      <Button
        v-if="canCreateNotes"
        class="shrink-0"
        :disabled="!projectStore.projects.length"
        @click="showCreateModal = true"
      >
        {{ t('notes.newNote') }}
      </Button>
    </div>

    <div
      v-show="filtersOpen"
      id="note-filters-panel"
      class="mt-4"
      role="region"
      :aria-label="t('notes.noteFiltersRegion')"
    >
      <NoteFiltersPanel
        v-model:filter-project="filterProject"
        v-model:sort-key="sortKey"
        v-model:sort-dir="sortDir"
        v-model:group-by="groupBy"
        :projects="inlineComposerProjects"
        :allow-section-group="allowSectionGroup"
        @reset="resetToolbar"
      />
    </div>

    <div v-if="noteStore.loading" class="mt-6 space-y-3">
      <Skeleton v-for="i in 5" :key="i" variant="card" />
    </div>
    <template v-else>
      <EmptyState
        v-if="!displayFlat.length && noteStore.notes.length > 0"
        class="mt-6"
        :title="t('notes.emptyNoMatchTitle')"
        :description="t('notes.emptyNoMatchDescription')"
      >
        <Button variant="secondary" type="button" @click="resetToolbar">
          {{ t('notes.filters.reset') }}
        </Button>
      </EmptyState>
      <EmptyState
        v-else-if="!displayFlat.length"
        class="mt-6"
        :title="t('notes.emptyNoNotesTitle')"
        :description="
          canCreateNotes
            ? t('notes.emptyNoNotesCanCreate')
            : t('notes.emptyNoNotesGuest')
        "
      >
        <Button
          v-if="canCreateNotes"
          :disabled="!projectStore.projects.length"
          @click="showCreateModal = true"
        >
          {{ t('notes.newNote') }}
        </Button>
      </EmptyState>
      <div v-else class="mt-6 space-y-6">
        <div
          v-if="effectiveGroupBy === 'none'"
          class="overflow-hidden rounded-lg border border-border bg-surface"
        >
          <div class="divide-y divide-border">
            <NoteCard
              v-for="n in displayFlat"
              :key="n.id"
              class="px-3"
              :note="n"
              :can-manage="canManageNoteForProject(n.project_id)"
              @view="openNoteView(n.id, n.project_id)"
              @edit="openNoteEdit(n.id, n.project_id)"
            />
          </div>
        </div>
        <ProjectItemList
          v-else-if="effectiveGroupBy === 'section'"
          class="space-y-4"
          :groups="sectionWorkspaceGroups"
          :can-manage-note="canManageNotesInCurrentFilter"
          :can-edit-task="() => false"
          :enable-item-drag="notesDnDEnabled"
          :empty-message="t('tasks.emptySection')"
          @view-note="onSectionListViewNote"
          @edit-note="onSectionListEditNote"
          @move="onNoteMove"
        />
        <template v-else>
          <div v-for="g in displayGroups" :key="g.key" class="space-y-2">
            <h2 v-if="g.label" class="text-sm font-semibold text-foreground">
              {{ g.label }}
            </h2>
            <div
              class="overflow-hidden rounded-lg border border-border bg-surface"
            >
              <div class="divide-y divide-border">
                <NoteCard
                  v-for="n in g.notes"
                  :key="n.id"
                  class="px-3"
                  :note="n"
                  :can-manage="canManageNoteForProject(n.project_id)"
                  @view="openNoteView(n.id, n.project_id)"
                  @edit="openNoteEdit(n.id, n.project_id)"
                />
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>

    <Modal
      v-if="canCreateNotes"
      v-model="showCreateModal"
      :title="t('notes.modalNewTitle')"
      :dirty="createModalDirty"
    >
      <NoteForm
        v-model:title="createTitle"
        v-model:body="createBody"
        v-model:section-id="createSectionId"
        :sections="projectStore.sections"
        :projects="inlineComposerProjects"
        :default-project-id="createProjectIdPrefill"
        form-id="notes-inline-create"
        hide-footer
        :loading="createSaving"
        :submit-label="t('notes.submitCreate')"
        @project-picked="onCreateFormProjectPicked"
        @submit="onCreateSubmit"
      />
      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            :disabled="createSaving"
            @click="showCreateModal = false"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button
            type="submit"
            form="notes-inline-create"
            :loading="createSaving"
          >
            {{ t('notes.submitCreate') }}
          </Button>
        </div>
      </template>
    </Modal>

    <NoteDetailModal
      v-model="noteEditModalOpen"
      :project-id="noteEditProjectId"
      :note-id="noteEditModalId"
      :sections="projectStore.sections"
      :project-tasks="projectTasksForNoteModal"
      :can-manage="canManageDetailNote"
      @saved="load"
      @deleted="load"
      @open-task="openTaskFromNote"
    />

    <TaskDetailModal
      v-model="taskEditModalOpen"
      :task-id="taskEditModalId"
      @saved="load"
      @open-note="openNoteFromTask"
    />
  </div>
</template>
