<script setup lang="ts">
import {
  ClipboardDocumentListIcon,
  DocumentTextIcon,
} from '@heroicons/vue/24/outline'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '../components/ui/UiBreadcrumb.vue'
import Button from '../components/ui/UiButton.vue'
import EmptyState from '../components/ui/UiEmptyState.vue'
import Skeleton from '../components/ui/UiSkeleton.vue'
import TaskDetailModal from '../components/tasks/TaskDetailModal.vue'
import NoteDetailModal from '../components/notes/NoteDetailModal.vue'
import { useAuthStore } from '@app/auth.store'
import { useProjectStore } from '@app/project.store'
import { useTrashTasksStore } from '@app/trashTasks.store'
import { useTrashNotesStore } from '@app/trashNotes.store'
import { useConfirm } from '@app/composables/useConfirm'
import { useToast } from '@app/composables/useToast'
import { canManageNote } from '@domain/note/permissions'
import type { NotePermissionContext } from '@domain/note/permissions'
import { formatDate } from '@infra/formatters/date'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { confirm } = useConfirm()
const auth = useAuthStore()
const projectStore = useProjectStore()
const trashTasksStore = useTrashTasksStore()
const trashNotesStore = useTrashNotesStore()

const id = computed(() => {
  const raw = route.params.id
  const s = Array.isArray(raw) ? raw[0] : raw
  const n = typeof s === 'string' ? Number(s) : Number(s)
  return Number.isFinite(n) && n > 0 ? n : NaN
})

const pageLoading = ref(true)
const loadError = ref<string | null>(null)

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

const canManageTrash = computed(() =>
  canManageNote(auth.user?.id, auth.user?.role, notePermissionCtx.value, id.value),
)

const taskTrashModalOpen = ref(false)
const taskTrashModalId = ref<number | null>(null)
const noteTrashModalOpen = ref(false)
const noteTrashModalId = ref<number | null>(null)

type TrashRow = {
  kind: 'task' | 'note'
  id: number
  title: string
  updatedAt: string
}

const mixedRows = computed((): TrashRow[] => {
  const tasks = trashTasksStore.tasks.map(t => ({
    kind: 'task' as const,
    id: t.id,
    title: t.title,
    updatedAt: t.updated_at,
  }))
  const notes = trashNotesStore.notes.map(n => ({
    kind: 'note' as const,
    id: n.id,
    title: n.title,
    updatedAt: n.updated_at,
  }))
  return [...tasks, ...notes].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
})

const breadcrumbItems = computed(() => {
  const p = projectStore.current
  if (!p) {
    return [
      { label: t('common.home'), to: '/dashboard' },
      { label: t('nav.projects'), to: '/projects' },
      { label: t('projectTrash.title') },
    ]
  }
  return [
    { label: t('common.home'), to: '/dashboard' },
    { label: t('nav.projects'), to: '/projects' },
    { label: p.name, to: `/projects/${id.value}` },
    { label: t('projectTrash.title') },
  ]
})

const loading = computed(
  () => trashTasksStore.loading || trashNotesStore.loading,
)

let loadGen = 0

async function loadTrashInternal() {
  if (!Number.isFinite(id.value) || id.value <= 0) return
  try {
    await trashTasksStore.fetchTasks(id.value)
    await trashNotesStore.fetchNotes(id.value)
  } catch {
    toast.error(t('notes.trash.loadFailed'))
  }
}

async function loadTrash() {
  ++loadGen
  await loadTrashInternal()
}

async function loadPage() {
  const gen = ++loadGen
  pageLoading.value = true
  loadError.value = null
  if (!Number.isFinite(id.value) || id.value <= 0) {
    pageLoading.value = false
    void router.replace('/projects')
    return
  }
  try {
    await projectStore.fetchList().catch(() => {})
    if (gen !== loadGen) return
    await projectStore.fetchOne(id.value)
    if (gen !== loadGen) return
    if (projectStore.current?.id !== id.value) {
      loadError.value = t('projectTrash.loadError')
      return
    }
    await loadTrashInternal()
  } catch {
    if (gen === loadGen) loadError.value = t('projectTrash.loadError')
  } finally {
    if (gen === loadGen) pageLoading.value = false
  }
}

watch(
  () => id.value,
  () => {
    void loadPage()
  },
  { immediate: true },
)

function openTaskRow(row: TrashRow) {
  if (row.kind !== 'task') return
  noteTrashModalOpen.value = false
  noteTrashModalId.value = null
  taskTrashModalId.value = row.id
  taskTrashModalOpen.value = true
}

function openNoteRow(row: TrashRow) {
  if (row.kind !== 'note') return
  taskTrashModalOpen.value = false
  taskTrashModalId.value = null
  noteTrashModalId.value = row.id
  noteTrashModalOpen.value = true
}

function openRow(row: TrashRow) {
  if (row.kind === 'task') openTaskRow(row)
  else openNoteRow(row)
}

async function restoreTask(taskId: number) {
  try {
    await trashTasksStore.restoreTask(id.value, taskId)
    toast.success(t('notes.trash.taskRestored'))
  } catch {
    toast.error(t('notes.trash.restoreFailed'))
  }
}

async function restoreNote(noteId: number) {
  try {
    await trashNotesStore.restoreNote(id.value, noteId)
    toast.success(t('notes.trash.noteRestored'))
  } catch {
    toast.error(t('notes.trash.restoreFailed'))
  }
}

async function hardDeleteTask(taskId: number) {
  const ok = await confirm({
    title: t('notes.trash.confirmPermanentTitle'),
    message: t('notes.trash.confirmPermanentTask'),
    confirmLabelKey: 'notes.trash.confirmPermanent',
    danger: true,
  })
  if (!ok) return
  try {
    await trashTasksStore.permanentDeleteTask(taskId)
    toast.success(t('notes.trash.taskPurged'))
  } catch {
    toast.error(t('notes.trash.purgeFailed'))
  }
}

async function hardDeleteNote(noteId: number) {
  const ok = await confirm({
    title: t('notes.trash.confirmPermanentTitle'),
    message: t('notes.trash.confirmPermanentNote'),
    confirmLabelKey: 'notes.trash.confirmPermanent',
    danger: true,
  })
  if (!ok) return
  try {
    await trashNotesStore.permanentDeleteNote(id.value, noteId)
    toast.success(t('notes.trash.notePurged'))
  } catch {
    toast.error(t('notes.trash.purgeFailed'))
  }
}

async function onModalSaved() {
  await loadTrash()
}
</script>

<template>
  <div v-if="pageLoading" class="space-y-4">
    <Skeleton variant="line" class="h-4 max-w-md" />
    <div class="space-y-3">
      <Skeleton variant="line" class="h-8 max-w-xs" />
      <Skeleton variant="line" :lines="3" />
    </div>
  </div>
  <div v-else-if="loadError">
    <EmptyState :title="t('projectTrash.loadError')" :description="loadError">
      <Button type="button" variant="secondary" @click="void loadPage()">
        {{ t('common.retry') }}
      </Button>
    </EmptyState>
  </div>
  <div v-else-if="projectStore.current">
    <Breadcrumb class="mb-4" :items="breadcrumbItems" />

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <h1 class="text-2xl font-semibold text-foreground">
          {{ t('projectTrash.title') }}
        </h1>
        <p class="mt-1 text-sm text-muted">
          {{ projectStore.current.name }}
        </p>
      </div>
      <router-link
        :to="{ name: 'project-detail', params: { id } }"
        class="text-sm font-medium text-primary underline"
      >
        {{ t('projectTrash.backToProject') }}
      </router-link>
    </div>

    <div class="mt-6 rounded-lg border border-border bg-surface p-4">
      <div v-if="loading" class="space-y-2">
        <Skeleton variant="line" />
        <Skeleton variant="line" />
      </div>
      <ul v-else class="divide-y divide-border">
        <li
          v-for="row in mixedRows"
          :key="`${row.kind}-${row.id}`"
          class="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
        >
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <ClipboardDocumentListIcon
              v-if="row.kind === 'task'"
              class="h-5 w-5 shrink-0 text-muted"
              aria-hidden="true"
            />
            <DocumentTextIcon
              v-else
              class="h-5 w-5 shrink-0 text-muted"
              aria-hidden="true"
            />
            <button
              type="button"
              class="min-w-0 truncate text-left font-medium text-foreground underline decoration-primary/80 hover:text-primary"
              @click="openRow(row)"
            >
              {{ row.title }}
            </button>
            <span class="shrink-0 text-xs text-muted">
              {{
                row.kind === 'task'
                  ? t('projectTrash.kindTask')
                  : t('projectTrash.kindNote')
              }}
            </span>
            <span class="shrink-0 text-xs text-muted">
              {{ formatDate(row.updatedAt, locale) }}
            </span>
          </div>
          <div class="flex shrink-0 gap-1">
            <Button
              v-if="row.kind === 'task'"
              type="button"
              variant="secondary"
              :disabled="!canManageTrash"
              @click="restoreTask(row.id)"
            >
              {{ t('notes.restore') }}
            </Button>
            <Button
              v-else
              type="button"
              variant="secondary"
              :disabled="!canManageTrash"
              @click="restoreNote(row.id)"
            >
              {{ t('notes.restore') }}
            </Button>
            <Button
              v-if="row.kind === 'task'"
              type="button"
              variant="ghost-danger"
              :disabled="!canManageTrash"
              @click="hardDeleteTask(row.id)"
            >
              {{ t('notes.trash.deleteForever') }}
            </Button>
            <Button
              v-else
              type="button"
              variant="ghost-danger"
              :disabled="!canManageTrash"
              @click="hardDeleteNote(row.id)"
            >
              {{ t('notes.trash.deleteForever') }}
            </Button>
          </div>
        </li>
        <li
          v-if="mixedRows.length === 0"
          class="py-8 text-center text-sm text-muted"
        >
          {{ t('projectTrash.empty') }}
        </li>
      </ul>
    </div>

    <TaskDetailModal
      v-model="taskTrashModalOpen"
      :task-id="taskTrashModalId"
      trashed
      :trash-project-id="id"
      :can-manage-trash="canManageTrash"
      @saved="onModalSaved"
    />
    <NoteDetailModal
      v-model="noteTrashModalOpen"
      :project-id="id"
      :note-id="noteTrashModalId"
      :sections="[]"
      :project-tasks="[]"
      :can-manage="canManageTrash"
      trashed
      @saved="onModalSaved"
    />
  </div>
</template>
