<script setup lang="ts">
import {
  DocumentCheckIcon,
  LinkIcon,
} from '@heroicons/vue/24/outline'
import { useI18n } from 'vue-i18n'
import type { ProjectSection } from '@domain/project/types'
import { useNoteDetail } from '@app/composables/useNoteDetail'
import Modal from '../ui/UiModal.vue'
import Button from '../ui/UiButton.vue'
import Skeleton from '../ui/UiSkeleton.vue'
import NoteMarkdownView from './NoteMarkdownView.vue'
import NoteForm from './NoteForm.vue'
import NoteLinkedTasksPicker from './NoteLinkedTasksPicker.vue'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    projectId: number
    noteId: number | null
    sections: ProjectSection[]
    projectTasks: { id: number; title: string }[]
    canManage: boolean
    /** Загрузка из корзины (GET .../trash/notes/:id). */
    trashed?: boolean
  }>(),
  { trashed: false },
)

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  saved: []
  deleted: []
  openTask: [taskId: number]
}>()

const {
  note,
  loading,
  saving,
  removing,
  restoring,
  purging,
  linkBusy,
  linkManagerOpen,
  linkedIds,
  linkedTaskObjects,
  availableTasks,
  formTitle,
  formBody,
  formSectionId,
  noteModalDirty,
  noteFooterVisible,
  showHeaderLinkedTasksButton,
  cancelEdit,
  saveFromForm,
  removeNote,
  onLinkTask,
  onUnlinkTask,
  restoreFromTrash,
  purgeFromTrash,
} = useNoteDetail({
  projectId: () => props.projectId,
  noteId: () => props.noteId,
  active: () => props.modelValue,
  projectTasks: () => props.projectTasks,
  canManage: () => props.canManage,
  trashed: () => props.trashed,
  initialMode: () => 'edit',
  allowInlineEdit: () => true,
  onSaved: () => emit('saved'),
  onDeleted: () => emit('deleted'),
  onClose: () => emit('update:modelValue', false),
  onOpenTask: id => emit('openTask', id),
})
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="note?.title ?? t('notes.detail.title')"
    :dirty="noteModalDirty"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header-actions>
      <div class="flex flex-wrap items-center gap-2">
        <Button
          v-if="showHeaderLinkedTasksButton"
          type="button"
          variant="secondary"
          :disabled="linkBusy"
          @click="linkManagerOpen = true"
        >
          <LinkIcon class="h-4 w-4" />
          <span class="ml-1">{{ t('notes.detail.linkedTasks') }}</span>
          <span
            v-if="linkedIds.length"
            class="ml-1 inline-flex min-w-4 items-center justify-center rounded bg-surface-muted px-1 text-[10px] leading-none text-muted"
          >{{ linkedIds.length }}</span>
        </Button>
      </div>
    </template>
    <div v-if="loading" class="space-y-2">
      <Skeleton variant="line" />
      <Skeleton variant="line" :lines="4" />
    </div>
    <template v-else-if="note">
      <div v-if="!trashed && canManage" class="space-y-3">
        <NoteForm
          v-model:title="formTitle"
          v-model:body="formBody"
          v-model:section-id="formSectionId"
          :initial="note"
          :sections="sections"
          form-id="note-detail-edit"
          hide-footer
          :loading="saving"
          :submit-label="t('common.save')"
          @submit="saveFromForm"
        />
      </div>
      <div v-else-if="trashed" class="space-y-3">
        <div class="space-y-1">
          <div class="text-xs font-medium text-foreground">
            {{ t('notes.form.body') }}
          </div>
          <NoteMarkdownView :source="note.body ?? ''" />
        </div>
      </div>
      <p v-else class="text-sm text-muted">
        {{ t('notes.detail.noManagePermission') }}
      </p>
    </template>
    <template v-if="noteFooterVisible" #footer>
      <div
        v-if="trashed && canManage"
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
        v-else-if="canManage && !trashed"
        class="flex flex-wrap items-center gap-2"
      >
        <Button
          variant="ghost-danger"
          type="button"
          :loading="removing"
          :disabled="saving"
          @click="removeNote"
        >
          {{ t('common.delete') }}
        </Button>
        <div class="ml-auto flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            :disabled="saving || removing"
            @click="cancelEdit"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button
            type="submit"
            form="note-detail-edit"
            :loading="saving"
            :disabled="removing || !formTitle.trim()"
          >
            {{ t('common.save') }}
          </Button>
        </div>
      </div>
    </template>
  </Modal>

  <Modal
    v-if="note && !trashed"
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
                v-if="canManage"
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
      <section v-if="canManage">
        <NoteLinkedTasksPicker
          :tasks="availableTasks"
          :disabled="linkBusy"
          @link="onLinkTask"
        />
      </section>
    </div>
  </Modal>
</template>
