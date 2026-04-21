<script setup lang="ts">
import {
  DocumentCheckIcon,
  LinkIcon,
  PencilSquareIcon,
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

const props = defineProps<{
  projectId: number
  noteId: number
}>()

const { t } = useI18n()
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

const showEditButton = computed(
  () =>
    Boolean(
      note.value
      && canManageThisProject.value
      && !loading.value,
    ),
)

function onEdit() {
  detailPanel.requestNoteEdit(props.projectId, props.noteId)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
  <UiDetailPanelShell
    class="min-h-0 flex-1"
    :collapse-aria-label="t('detailPanel.collapse')"
    @toggle-collapsed="detailPanel.toggleCollapsed()"
  >
    <template #title>
      <h2
        class="flex min-h-8 min-w-0 flex-1 items-center text-base font-semibold leading-snug text-foreground"
      >
        {{ note?.title ?? t('notes.detail.title') }}
      </h2>
    </template>
    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <Button
          v-if="showEditButton"
          type="button"
          variant="secondary"
          @click="onEdit"
        >
          <PencilSquareIcon class="h-4 w-4" />
          <span class="ml-1">{{ t('common.edit') }}</span>
        </Button>
      </div>
    </template>
    <div v-if="loading" class="space-y-2">
      <Skeleton variant="line" />
      <Skeleton variant="line" :lines="4" />
    </div>
    <template v-else-if="note">
      <div class="space-y-3">
        <div class="space-y-1">
          <div class="text-xs font-medium text-foreground">
            {{ t('notes.form.body') }}
          </div>
          <NoteMarkdownView :source="note.body ?? ''" />
        </div>
      </div>

      <div class="mt-6 border-t border-border pt-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
            <LinkIcon class="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <span class="truncate">{{ t('notes.detail.linkedTasks') }}</span>
          </h3>
          <Button
            v-if="canManageThisProject"
            type="button"
            variant="secondary"
            :disabled="linkBusy"
            @click="linkManagerOpen = true"
          >
            {{ t('taskDetailModal.linkedNotes.addLink') }}
          </Button>
        </div>
        <div
          class="mt-3 overflow-hidden rounded-lg border border-border bg-surface"
        >
          <div v-if="linkedTaskObjects.length > 0" class="divide-y divide-border">
            <div
              v-for="tk in linkedTaskObjects"
              :key="tk.id"
              class="flex items-center gap-2.5 px-3"
            >
              <DocumentCheckIcon
                class="h-5 w-5 shrink-0 text-muted"
                aria-hidden="true"
              />
              <TaskCard
                class="min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none"
                :task="tk"
                :can-edit="false"
                @view="openTask"
              />
            </div>
          </div>
          <p
            v-else
            class="px-3 py-6 text-center text-xs text-muted"
          >
            {{ t('notes.detail.noLinkedTasks') }}
          </p>
        </div>
      </div>
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
