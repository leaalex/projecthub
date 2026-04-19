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
import NoteCard from '../components/notes/NoteCard.vue'
import NoteDetailModal from '../components/notes/NoteDetailModal.vue'
import NoteForm from '../components/notes/NoteForm.vue'
import NoteFiltersPanel from '../components/notes/NoteFiltersPanel.vue'
import {
  presentNotes,
  type NoteGroupBy,
  type NoteSortKey,
  type SortDir,
} from '@app/composables/useNoteListPresentation'
import { useAuthStore } from '@app/auth.store'
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

const notesBreadcrumbItems = computed(() => [
  { label: t('common.home'), to: '/dashboard' },
  { label: t('notes.breadcrumb') },
])

const showCreateModal = ref(false)
const createProjectIdPrefill = ref<number | null>(null)
const createSaving = ref(false)

const detailOpen = ref(false)
const detailNoteId = ref<number | null>(null)
const detailProjectId = ref(0)

const projectTasksForNoteModal = computed(() => {
  const pid = detailProjectId.value
  return taskStore.tasks
    .filter(tk => tk.project_id === pid)
    .map(tk => ({ id: tk.id, title: tk.title }))
})

const canManageDetailNote = computed(() =>
  canManageNoteForProject(detailProjectId.value),
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

function openNoteDetail(noteId: number, projectId: number) {
  detailProjectId.value = projectId
  detailNoteId.value = noteId
  detailOpen.value = true
}

async function prepareNoteModalContext(projectId: number) {
  await projectStore.fetchOne(projectId).catch(() => {})
  await projectStore.fetchSections(projectId)
  await noteStore.fetchList(projectId, { quiet: true })
  await taskStore.fetchList({ project_id: projectId }).catch(() => {})
}

watch(detailOpen, async open => {
  if (!open) {
    detailNoteId.value = null
    return
  }
  const pid = detailProjectId.value
  if (pid > 0) await prepareNoteModalContext(pid)
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

watch([filterProject], async () => {
  if (!allowServerFilterWatch.value) return
  await load()
})

watch(
  filterProject,
  async pid => {
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

watch(showCreateModal, async open => {
  if (!open) return
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
    if (Number.isFinite(n) && n > 0) params.project_id = n
  }
  try {
    await noteStore.fetchAll(params)
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, t('notes.toasts.loadFailed')))
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
    await load()
    toast.success(t('notes.toasts.created'))
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, t('notes.toasts.createFailed')))
  } finally {
    createSaving.value = false
  }
}

async function onRemoveNote(noteId: number, projectId: number) {
  if (!canManageNoteForProject(projectId)) return
  try {
    await noteStore.remove(projectId, noteId)
    await load()
    toast.success(t('notes.toasts.deleted'))
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, t('notes.toasts.deleteFailed')))
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
          class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
        >
          <NoteCard
            v-for="n in displayFlat"
            :key="n.id"
            variant="list"
            :note="n"
            :can-manage="canManageNoteForProject(n.project_id)"
            @open="openNoteDetail(n.id, n.project_id)"
            @edit="openNoteDetail(n.id, n.project_id)"
            @remove="onRemoveNote(n.id, n.project_id)"
          />
        </div>
        <template v-else>
          <div v-for="g in displayGroups" :key="g.key" class="space-y-2">
            <h2 v-if="g.label" class="text-sm font-semibold text-foreground">
              {{ g.label }}
            </h2>
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <NoteCard
                v-for="n in g.notes"
                :key="n.id"
                variant="list"
                :note="n"
                :can-manage="canManageNoteForProject(n.project_id)"
                @open="openNoteDetail(n.id, n.project_id)"
                @edit="openNoteDetail(n.id, n.project_id)"
                @remove="onRemoveNote(n.id, n.project_id)"
              />
            </div>
          </div>
        </template>
      </div>
    </template>

    <Modal
      v-if="canCreateNotes"
      v-model="showCreateModal"
      :title="t('notes.modalNewTitle')"
    >
      <NoteForm
        :sections="projectStore.sections"
        :projects="inlineComposerProjects"
        :default-project-id="createProjectIdPrefill"
        :loading="createSaving"
        :submit-label="t('notes.submitCreate')"
        @project-picked="onCreateFormProjectPicked"
        @submit="onCreateSubmit"
        @cancel="showCreateModal = false"
      />
    </Modal>

    <NoteDetailModal
      v-model="detailOpen"
      :project-id="detailProjectId"
      :note-id="detailNoteId"
      :sections="projectStore.sections"
      :project-tasks="projectTasksForNoteModal"
      :can-manage="canManageDetailNote"
      @saved="load"
      @deleted="load"
    />
  </div>
</template>
