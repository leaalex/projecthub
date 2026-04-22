<script setup lang="ts">
import {
  DocumentTextIcon,
  LinkIcon,
  PencilSquareIcon,
} from '@heroicons/vue/24/outline'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiDetailPanelShell from '../ui/UiDetailPanelShell.vue'
import Modal from '../ui/UiModal.vue'
import Button from '../ui/UiButton.vue'
import Skeleton from '../ui/UiSkeleton.vue'
import UiInput from '../ui/UiInput.vue'
import NoteCard from '../notes/NoteCard.vue'
import TaskSubtasksPanel from './TaskSubtasksPanel.vue'
import { useDetailPanelStore } from '@app/detailPanel.store'
import { useTaskDetail } from '@app/composables/useTaskDetail'
import { formatDate } from '@infra/formatters/date'
import { taskPriorityLabel, taskStatusLabel } from '@infra/i18n/labels'

const props = defineProps<{
  taskId: number
}>()

const { t, locale } = useI18n()
const detailPanel = useDetailPanelStore()

const {
  task,
  loading,
  loadError,
  canEdit,
  linkedNotes,
  linkManagerOpen,
  noteSearch,
  linkBusy,
  canManageNotes,
  pickerCandidates,
  linkNoteFromPicker,
  unlinkNote,
  openLinkedNote,
  refresh,
} = useTaskDetail({
  taskId: () => props.taskId,
  active: () => true,
  trashed: () => false,
  trashProjectId: () => null,
  canManageTrash: () => false,
  initialMode: () => 'view',
  allowInlineEdit: () => false,
  onSaved: () => detailPanel.requestWorkspaceRefresh(),
  onOpenNote: p => detailPanel.openNote(p.projectId, p.noteId),
  onClose: () => {},
})

watch(
  () => detailPanel.workspaceRefreshTick,
  () => {
    void refresh()
  },
)

const showEditButton = computed(
  () => Boolean(task.value && canEdit.value && !loading.value && !loadError.value),
)

function onEdit() {
  detailPanel.requestTaskEdit(props.taskId)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
  <UiDetailPanelShell
    class="min-h-0 flex-1"
    :title="t('taskDetailModal.title')"
    :collapse-aria-label="t('detailPanel.collapse')"
    @toggle-collapsed="detailPanel.toggleCollapsed()"
  >
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
    <div v-if="loading" class="space-y-3">
      <Skeleton variant="line" />
      <Skeleton variant="line" :lines="3" />
    </div>
    <p v-else-if="loadError" class="text-sm text-destructive">{{ loadError }}</p>
    <template v-else-if="task">
      <dl class="space-y-4">
        <div>
          <dt class="text-xs font-medium text-muted">{{ t('taskDetailModal.labels.title') }}</dt>
          <dd class="mt-1 text-sm text-foreground">{{ task.title }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium text-muted">{{
            t('taskDetailModal.labels.description')
          }}</dt>
          <dd class="mt-1 whitespace-pre-wrap text-sm text-foreground">
            {{ task.description || t('common.dash') }}
          </dd>
        </div>
        <div>
          <dt class="text-xs font-medium text-muted">{{
            t('taskDetailModal.labels.subtasks')
          }}</dt>
          <dd class="mt-1">
            <TaskSubtasksPanel :task="task" hide-heading readonly />
          </dd>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-xs font-medium text-muted">{{ t('taskDetailModal.labels.status') }}</dt>
            <dd class="mt-1 text-sm text-foreground">
              {{ taskStatusLabel(t, task.status) }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-muted">{{
              t('taskDetailModal.labels.priority')
            }}</dt>
            <dd class="mt-1 text-sm text-foreground">{{
              taskPriorityLabel(t, task.priority)
            }}</dd>
          </div>
        </div>
        <div>
          <dt class="text-xs font-medium text-muted">{{ t('taskDetailModal.labels.project') }}</dt>
          <dd class="mt-1 text-sm text-foreground">
            {{
              task.project?.name ??
              t('taskCard.meta.projectNum', { n: task.project_id })
            }}
          </dd>
        </div>
        <div>
          <dt class="text-xs font-medium text-muted">{{
            t('taskDetailModal.labels.assignee')
          }}</dt>
          <dd class="mt-1 text-sm text-foreground">
            <template v-if="task.assignee">
              {{ task.assignee.name || task.assignee.email }}
              <span class="text-muted">({{ task.assignee.email }})</span>
            </template>
            <template v-else>{{ t('common.unassigned') }}</template>
          </dd>
        </div>
        <div>
          <dt class="text-xs font-medium text-muted">{{
            t('taskDetailModal.labels.dueDate')
          }}</dt>
          <dd class="mt-1 text-sm text-foreground">
            {{ task.due_date ? formatDate(task.due_date, locale) : t('common.dash') }}
          </dd>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-xs font-medium text-muted">{{
              t('taskDetailModal.labels.created')
            }}</dt>
            <dd class="mt-1 text-sm text-foreground">{{ formatDate(task.created_at, locale) }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-muted">{{
              t('taskDetailModal.labels.updated')
            }}</dt>
            <dd class="mt-1 text-sm text-foreground">{{ formatDate(task.updated_at, locale) }}</dd>
          </div>
        </div>
      </dl>

      <div class="mt-6 border-t border-border pt-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
            <LinkIcon class="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <span class="truncate">{{ t('taskDetailModal.linkedNotes.heading') }}</span>
          </h3>
          <Button
            v-if="canManageNotes"
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
          <div v-if="linkedNotes.length > 0" class="divide-y divide-border">
            <NoteCard
              v-for="n in linkedNotes"
              :key="n.id"
              class="px-3"
              :note="n"
              :can-manage="false"
              @view="openLinkedNote"
            />
          </div>
          <p
            v-else
            class="px-3 py-6 text-center text-xs text-muted"
          >
            {{ t('taskDetailModal.linkedNotes.empty') }}
          </p>
        </div>
      </div>
    </template>
  </UiDetailPanelShell>

  <Modal
    v-if="task"
    v-model="linkManagerOpen"
    :title="t('taskDetailModal.linkedNotes.pickTitle')"
  >
    <div class="space-y-4">
      <section>
        <h4 class="text-xs font-medium text-muted">{{ t('taskDetailModal.linkedNotes.heading') }}</h4>
        <div
          class="mt-1 overflow-hidden rounded-lg border border-border bg-surface"
        >
          <ul v-if="linkedNotes.length > 0" class="divide-y divide-border">
            <li
              v-for="n in linkedNotes"
              :key="n.id"
              class="flex items-center gap-2.5 px-3 py-2 text-sm"
            >
              <DocumentTextIcon
                class="h-5 w-5 shrink-0 text-muted"
                aria-hidden="true"
              />
              <button
                type="button"
                class="min-w-0 flex-1 truncate text-left font-medium text-foreground transition-colors hover:text-primary"
                @click="openLinkedNote(n.id)"
              >
                {{ n.title }}
              </button>
              <Button
                v-if="canManageNotes"
                type="button"
                variant="ghost-danger"
                class="shrink-0"
                :disabled="linkBusy"
                @click="unlinkNote(n.id)"
              >
                {{ t('notes.linkTask.unlink') }}
              </Button>
            </li>
          </ul>
          <p
            v-else
            class="px-3 py-6 text-center text-xs text-muted"
          >
            {{ t('taskDetailModal.linkedNotes.empty') }}
          </p>
        </div>
      </section>
      <section v-if="canManageNotes">
        <h4 class="text-xs font-medium text-muted">{{ t('taskDetailModal.linkedNotes.addLink') }}</h4>
        <UiInput
          class="mt-1"
          v-model="noteSearch"
          :placeholder="t('notes.linkTask.searchPlaceholder')"
        />
        <ul
          class="mt-2 max-h-56 divide-y divide-border overflow-auto rounded-lg border border-border bg-surface"
        >
          <li
            v-for="n in pickerCandidates"
            :key="n.id"
            class="flex items-center justify-between gap-2 px-3 py-2 text-sm"
          >
            <span class="min-w-0 truncate">{{ n.title }}</span>
            <Button
              type="button"
              variant="secondary"
              :disabled="linkBusy"
              @click="linkNoteFromPicker(n.id)"
            >
              {{ t('notes.linkTask.link') }}
            </Button>
          </li>
          <li
            v-if="pickerCandidates.length === 0"
            class="px-2 py-4 text-center text-xs text-muted"
          >
            {{ t('notes.linkTask.empty') }}
          </li>
        </ul>
      </section>
    </div>
  </Modal>
  </div>
</template>
