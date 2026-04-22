<script setup lang="ts">
import {
  DocumentTextIcon,
  LinkIcon,
} from '@heroicons/vue/24/outline'
import { useI18n } from 'vue-i18n'
import Modal from '../ui/UiModal.vue'
import Button from '../ui/UiButton.vue'
import Skeleton from '../ui/UiSkeleton.vue'
import UiInput from '../ui/UiInput.vue'
import TaskForm from './TaskForm.vue'
import TaskSubtasksPanel from './TaskSubtasksPanel.vue'
import { useProjectStore } from '@app/project.store'
import { useDetailPanelStore } from '@app/detailPanel.store'
import { useTaskDetail } from '@app/composables/useTaskDetail'
import { formatDate } from '@infra/formatters/date'
import { taskPriorityLabel, taskStatusLabel } from '@infra/i18n/labels'

const { t, locale } = useI18n()
const projectStore = useProjectStore()
const detailPanel = useDetailPanelStore()

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    taskId: number | null
    /** Загрузка из корзины проекта (GET .../trash/tasks/:id). */
    trashed?: boolean
    /** project_id для корзины; обязателен при `trashed`. */
    trashProjectId?: number | null
    /** Restore / удалить навсегда в корзине (как права на заметки в проекте). */
    canManageTrash?: boolean
  }>(),
  { trashed: false, trashProjectId: null, canManageTrash: true },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
  openNote: [payload: { noteId: number; projectId: number }]
}>()

const {
  task,
  loading,
  loadError,
  saving,
  removing,
  restoring,
  purging,
  formTitle,
  formDescription,
  formProjectId,
  formSectionId,
  formAssigneeId,
  formStatus,
  formPriority,
  assignableUsers,
  canEdit,
  linkedNotes,
  linkManagerOpen,
  noteSearch,
  linkBusy,
  canManageNotes,
  pickerCandidates,
  taskModalDirty,
  taskFooterVisible,
  showHeaderLinkedNotesButton,
  save,
  refreshTask,
  linkNoteFromPicker,
  unlinkNote,
  openLinkedNote,
  removeTask,
  restoreFromTrash,
  cancelEdit,
  purgeFromTrash,
} = useTaskDetail({
  taskId: () => props.taskId,
  active: () => props.modelValue,
  trashed: () => props.trashed,
  trashProjectId: () => props.trashProjectId,
  canManageTrash: () => props.canManageTrash,
  initialMode: () => 'edit',
  allowInlineEdit: () => true,
  onSaved: () => {
    detailPanel.requestWorkspaceRefresh()
    emit('saved')
  },
  onOpenNote: p => emit('openNote', p),
  onClose: () => emit('update:modelValue', false),
})
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="t('taskDetailModal.title')"
    :dirty="taskModalDirty"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <Button
          v-if="showHeaderLinkedNotesButton"
          type="button"
          variant="secondary"
          :disabled="linkBusy"
          :title="t('taskDetailModal.linkedNotes.heading')"
          @click="linkManagerOpen = true"
        >
          <LinkIcon class="h-4 w-4" />
          <span class="ml-1">{{ t('taskDetailModal.linkedNotes.heading') }}</span>
          <span
            v-if="linkedNotes.length"
            class="ml-1 inline-flex min-w-4 items-center justify-center rounded bg-surface-muted px-1 text-[10px] leading-none text-muted"
          >{{ linkedNotes.length }}</span>
        </Button>
      </div>
    </template>
    <div v-if="loading" class="space-y-3">
      <Skeleton variant="line" />
      <Skeleton variant="line" :lines="3" />
    </div>
    <p v-else-if="loadError" class="text-sm text-destructive">{{ loadError }}</p>
    <template v-else-if="task">
      <dl
        v-if="trashed"
        class="space-y-4"
      >
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

      <div v-else-if="canEdit" class="space-y-4">
        <TaskForm
          v-model:title="formTitle"
          v-model:description="formDescription"
          v-model:project-id="formProjectId"
          v-model:section-id="formSectionId"
          v-model:assignee-id="formAssigneeId"
          v-model:status="formStatus"
          v-model:priority="formPriority"
          form-id="task-detail-edit"
          hide-footer
          :projects="projectStore.projects.map(p => ({ id: p.id, name: p.name }))"
          :sections="projectStore.sections"
          :assignable-users="assignableUsers"
          :submit-label="t('common.save')"
          :loading="saving"
          @submit="save"
        >
          <template #before-extra>
            <TaskSubtasksPanel :task="task" @updated="refreshTask" />
          </template>
        </TaskForm>
      </div>

      <p v-else class="text-sm text-muted">
        {{ t('taskDetailModal.toasts.noEditPermission') }}
      </p>
    </template>
    <template v-if="taskFooterVisible" #footer>
      <div
        v-if="trashed && canManageTrash"
        class="flex flex-wrap justify-end gap-2"
      >
        <Button
          type="button"
          variant="secondary"
          :loading="restoring"
          :disabled="purging"
          @click="restoreFromTrash"
        >
          {{ t('notes.restore') }}
        </Button>
        <Button
          type="button"
          variant="ghost-danger"
          :loading="purging"
          :disabled="restoring"
          @click="purgeFromTrash"
        >
          {{ t('notes.trash.deleteForever') }}
        </Button>
      </div>
      <div
        v-else-if="canEdit && !trashed"
        class="flex flex-wrap items-center gap-2"
      >
        <Button
          variant="ghost-danger"
          type="button"
          :loading="removing"
          :disabled="saving"
          @click="removeTask"
        >
          {{ t('taskDetailModal.buttons.deleteTask') }}
        </Button>
        <div class="ml-auto flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            :disabled="saving || removing"
            @click="cancelEdit"
          >
            {{ t('taskForm.cancel') }}
          </Button>
          <Button
            type="submit"
            form="task-detail-edit"
            :loading="saving"
            :disabled="removing"
          >
            {{ t('common.save') }}
          </Button>
        </div>
      </div>
    </template>
  </Modal>

  <Modal
    v-if="task && !trashed"
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
</template>
