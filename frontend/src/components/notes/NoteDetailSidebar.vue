<script setup lang="ts">
import {
  ClockIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  LinkIcon,
  PencilSquareIcon,
  PlusIcon,
} from '@heroicons/vue/24/outline'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NotePermissionContext } from '@domain/note/permissions'
import { canManageNote } from '@domain/note/permissions'
import { useAuthStore } from '@app/auth.store'
import { useProjectStore } from '@app/project.store'
import { useTaskStore } from '@app/task.store'
import { useDetailPanelStore } from '@app/detailPanel.store'
import { useNoteDetail } from '@app/composables/useNoteDetail'
import UiDetailPanelShell from '../ui/UiDetailPanelShell.vue'
import Modal from '../ui/UiModal.vue'
import Button from '../ui/UiButton.vue'
import Skeleton from '../ui/UiSkeleton.vue'
import NoteMarkdownView from './NoteMarkdownView.vue'
import NoteLinkedTasksPicker from './NoteLinkedTasksPicker.vue'
import TaskCard from '../tasks/TaskCard.vue'
import { formatDateShort, timeAgo } from '@infra/formatters/date'

const props = defineProps<{
  projectId: number
  noteId: number
}>()

const { t, locale } = useI18n()
const auth = useAuthStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const detailPanel = useDetailPanelStore()

const permCtx = computed(
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

const canManageThisProject = computed(() =>
  canManageNote(
    auth.user?.id,
    auth.user?.role,
    permCtx.value,
    props.projectId,
  ),
)

const projectTasksForPicker = computed(() =>
  taskStore.tasks
    .filter(tk => tk.project_id === props.projectId)
    .map(tk => ({ id: tk.id, title: tk.title })),
)

watch(
  () => props.projectId,
  async pid => {
    if (!Number.isFinite(pid) || pid <= 0) return
    try {
      await projectStore.fetchOne(pid).catch(() => {})
      await projectStore.fetchSections(pid).catch(() => {})
      await taskStore.fetchList({ project_id: pid }).catch(() => {})
    } catch {
      /* ignore */
    }
  },
  { immediate: true },
)

const {
  note,
  loading,
  linkBusy,
  linkManagerOpen,
  linkedTaskObjects,
  availableTasks,
  onLinkTask,
  onUnlinkTask,
  openTask,
  refresh,
} = useNoteDetail({
  projectId: () => props.projectId,
  noteId: () => props.noteId,
  active: () => true,
  projectTasks: () => projectTasksForPicker.value,
  canManage: () => canManageThisProject.value,
  trashed: () => false,
  initialMode: () => 'view',
  allowInlineEdit: () => false,
  onSaved: () => detailPanel.requestWorkspaceRefresh(),
  onDeleted: () => detailPanel.requestWorkspaceRefresh(),
  onClose: () => {},
  onOpenTask: id => detailPanel.openTask(id),
})

watch(
  () => detailPanel.workspaceRefreshTick,
  () => {
    void refresh()
  },
)

const showEditButton = computed(
  () =>
    Boolean(
      note.value
      && canManageThisProject.value
      && !loading.value,
    ),
)

const projectName = computed(() => {
  const fromCurrent = projectStore.current?.id === props.projectId
    ? projectStore.current?.name
    : null
  if (fromCurrent) return fromCurrent
  const p = projectStore.projects.find(pr => pr.id === props.projectId)
  return p?.name ?? t('taskCard.meta.projectNum', { n: props.projectId })
})

const sectionName = computed(() => {
  const sid = note.value?.section_id
  if (sid == null) return null
  return projectStore.sections.find(s => s.id === sid)?.name ?? null
})

function onEdit() {
  detailPanel.requestNoteEdit(props.projectId, props.noteId)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
  <UiDetailPanelShell
    class="min-h-0 flex-1"
    :title="t('notes.detail.sidebarTitle')"
    :collapse-aria-label="t('detailPanel.collapse')"
    @toggle-collapsed="detailPanel.toggleCollapsed()"
  >
    <template #header-actions>
      <Button
        v-if="showEditButton"
        type="button"
        variant="secondary"
        @click="onEdit"
      >
        <PencilSquareIcon class="h-4 w-4" />
        <span class="ml-1">{{ t('common.edit') }}</span>
      </Button>
    </template>

    <div v-if="loading" class="space-y-2">
      <Skeleton variant="line" />
      <Skeleton variant="line" :lines="4" />
    </div>

    <template v-else-if="note">
      <!-- HERO: title + project/section chip row -->
      <section class="space-y-2.5">
        <h3
          class="break-words text-base font-semibold leading-snug text-foreground"
        >
          {{ note.title }}
        </h3>
        <div class="flex min-w-0 items-center gap-2 text-xs">
          <FolderOpenIcon class="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <span class="min-w-0 truncate text-foreground">{{ projectName }}</span>
          <template v-if="sectionName">
            <span class="shrink-0 text-muted" aria-hidden="true">·</span>
            <span class="min-w-0 truncate text-muted">{{ sectionName }}</span>
          </template>
          <template v-else>
            <span class="shrink-0 text-muted" aria-hidden="true">·</span>
            <span class="min-w-0 truncate text-muted">{{ t('notes.section.none') }}</span>
          </template>
        </div>
      </section>

      <!-- BODY -->
      <section class="mt-5 space-y-2">
        <div class="flex min-w-0 items-center gap-2">
          <DocumentTextIcon class="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
          <span class="shrink-0 text-xs font-medium text-muted">
            {{ t('notes.form.body') }}
          </span>
          <div class="h-px min-h-px flex-1 bg-border" aria-hidden="true" />
        </div>
        <div v-if="note.body" class="pl-5">
          <NoteMarkdownView :source="note.body" />
        </div>
        <p v-else class="pl-5 text-xs italic text-muted">
          {{ t('notes.detail.emptyBody') }}
        </p>
      </section>

      <!-- LINKED TASKS -->
      <section class="mt-5 space-y-2">
        <div class="flex min-w-0 items-center gap-2">
          <LinkIcon class="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
          <span class="shrink-0 text-xs font-medium text-muted">
            {{ t('notes.detail.linkedTasks') }}
          </span>
          <span
            v-if="linkedTaskObjects.length > 0"
            class="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted"
          >
            {{ linkedTaskObjects.length }}
          </span>
          <div class="h-px min-h-px flex-1 bg-border" aria-hidden="true" />
          <button
            v-if="canManageThisProject"
            type="button"
            class="shrink-0 rounded p-1 text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            :disabled="linkBusy"
            :aria-label="t('taskDetailModal.linkedNotes.addLink')"
            :title="t('taskDetailModal.linkedNotes.addLink')"
            @click="linkManagerOpen = true"
          >
            <PlusIcon class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        <div class="pl-5">
          <div
            v-if="linkedTaskObjects.length > 0"
            class="divide-y divide-border overflow-hidden rounded-md border border-border bg-surface"
          >
            <TaskCard
              v-for="tk in linkedTaskObjects"
              :key="tk.id"
              class="px-3"
              :task="tk"
              :can-edit="false"
              @view="openTask"
            />
          </div>
          <p
            v-else
            class="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted"
          >
            {{ t('notes.detail.noLinkedTasks') }}
          </p>
        </div>
      </section>

      <!-- TIMELINE -->
      <section class="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
        <ClockIcon class="h-3 w-3 shrink-0" aria-hidden="true" />
        <span>{{ t('taskDetailModal.meta.updated', { date: timeAgo(note.updated_at, t, locale) }) }}</span>
        <span class="opacity-60" aria-hidden="true">·</span>
        <span>{{ t('taskDetailModal.meta.created', { date: formatDateShort(note.created_at, locale) }) }}</span>
      </section>
    </template>
  </UiDetailPanelShell>

  <Modal
    v-if="note"
    v-model="linkManagerOpen"
    :title="t('notes.detail.linkedTasks')"
  >
    <div class="space-y-4">
      <section>
        <div class="overflow-hidden rounded-lg border border-border bg-surface">
          <ul v-if="linkedTaskObjects.length > 0" class="divide-y divide-border">
            <li
              v-for="task in linkedTaskObjects"
              :key="task.id"
              class="flex items-center gap-2.5 px-3 py-2 text-sm"
            >
              <DocumentCheckIcon
                class="h-5 w-5 shrink-0 text-muted"
                aria-hidden="true"
              />
              <span class="min-w-0 flex-1 truncate font-medium text-foreground">{{
                task.title
              }}</span>
              <Button
                v-if="canManageThisProject"
                type="button"
                variant="ghost-danger"
                class="shrink-0"
                :disabled="linkBusy"
                @click="onUnlinkTask(task.id)"
              >
                {{ t('notes.linkTask.unlink') }}
              </Button>
            </li>
          </ul>
          <p
            v-else
            class="px-3 py-6 text-center text-xs text-muted"
          >
            {{ t('notes.detail.noLinkedTasks') }}
          </p>
        </div>
      </section>
      <section v-if="canManageThisProject">
        <NoteLinkedTasksPicker
          :tasks="availableTasks"
          :disabled="linkBusy"
          @link="onLinkTask"
        />
      </section>
    </div>
  </Modal>
  </div>
</template>
