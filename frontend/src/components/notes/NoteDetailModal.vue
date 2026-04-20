<script setup lang="ts">
import { PencilSquareIcon } from '@heroicons/vue/24/outline'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Note } from '@domain/note/types'
import type { ProjectSection } from '@domain/project/types'
import { useNoteStore, extractNoteAxiosError } from '@app/note.store'
import { useTrashNotesStore } from '@app/trashNotes.store'
import { useToast } from '@app/composables/useToast'
import { useConfirm } from '@app/composables/useConfirm'
import Modal from '../ui/UiModal.vue'
import Button from '../ui/UiButton.vue'
import Skeleton from '../ui/UiSkeleton.vue'
import NoteMarkdownView from './NoteMarkdownView.vue'
import NoteForm from './NoteForm.vue'
import NoteLinkedTasksPicker from './NoteLinkedTasksPicker.vue'

const { t } = useI18n()
const toast = useToast()
const { confirm } = useConfirm()

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    projectId: number
    noteId: number | null
    sections: ProjectSection[]
    projectTasks: { id: number; title: string }[]
    canManage: boolean
    /** Opens modal in edit form when true and `canManage`. */
    initialMode?: 'view' | 'edit'
    /** Загрузка из корзины (GET .../trash/notes/:id). */
    trashed?: boolean
  }>(),
  { initialMode: 'view', trashed: false },
)

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  saved: []
  deleted: []
}>()

const noteStore = useNoteStore()
const trashNotesStore = useTrashNotesStore()

const note = ref<Note | null>(null)
const loading = ref(false)
const editing = ref(false)
const saving = ref(false)
const removing = ref(false)
const restoring = ref(false)
const purging = ref(false)
const linkBusy = ref(false)

const linkedIds = computed(() => note.value?.linked_task_ids ?? [])

const linkedTasks = computed(() =>
  props.projectTasks.filter(p => linkedIds.value.includes(p.id)),
)

/** Состояние формы редактирования (v-model в NoteForm) — для `dirty` у модалки. */
const formTitle = ref('')
const formBody = ref('')
const formSectionId = ref<number | null>(null)

const noteModalDirty = computed(() => {
  const n = note.value
  if (!n || !editing.value || props.trashed) return false
  return (
    formTitle.value.trim() !== n.title
    || formBody.value.trim() !== (n.body ?? '').trim()
    || formSectionId.value !== (n.section_id ?? null)
  )
})

const noteFooterVisible = computed(() => {
  if (!note.value || loading.value) return false
  if (props.trashed && props.canManage) return true
  if (props.canManage && editing.value && !props.trashed) return true
  return false
})

const showHeaderEditButton = computed(
  () =>
    Boolean(
      note.value
      && props.canManage
      && !props.trashed
      && !editing.value
      && !loading.value,
    ),
)

function cancelEdit() {
  editing.value = false
}

watch(
  () =>
    [props.modelValue, props.noteId, props.projectId, props.trashed] as const,
  async ([open, nid, , trashed]) => {
    if (!open || nid == null) {
      note.value = null
      editing.value = false
      return
    }
    loading.value = true
    try {
      if (trashed) {
        const n = await trashNotesStore.fetchOne(props.projectId, nid)
        note.value = n
        editing.value = false
      } else {
        const n = await noteStore.fetchOne(props.projectId, nid)
        note.value = n
        noteStore.patchNoteInList(n.id, { linked_task_ids: n.linked_task_ids })
        editing.value = props.canManage && props.initialMode === 'edit'
      }
    } catch {
      toast.error(t('notes.detail.loadError'))
      note.value = null
    } finally {
      loading.value = false
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

async function saveFromForm(payload: {
  title: string
  body: string
  section_id: number | null
}) {
  const n = note.value
  if (!n || !props.canManage) return
  saving.value = true
  try {
    const prevSid = n.section_id ?? null
    const updated = await noteStore.update(props.projectId, n.id, {
      title: payload.title,
      body: payload.body,
    })
    note.value = updated
    const sid = payload.section_id
    if (sid !== prevSid) {
      const moved = await noteStore.move(props.projectId, n.id, {
        section_id: sid,
        position: updated.position,
      })
      note.value = moved
    }
    editing.value = false
    toast.success(t('notes.detail.saved'))
    emit('saved')
  } catch (e) {
    toast.error(extractNoteAxiosError(e, t('notes.detail.saveFailed')))
  } finally {
    saving.value = false
  }
}

async function removeNote() {
  const n = note.value
  if (!n || removing.value) return
  const ok = await confirm({
    title: t('notes.confirm.deleteTitle'),
    message: t('notes.confirm.deleteMessage', { title: n.title }),
    confirmLabelKey: 'notes.confirm.deleteConfirm',
    danger: true,
  })
  if (!ok) return
  removing.value = true
  try {
    await noteStore.remove(props.projectId, n.id)
    toast.success(t('notes.detail.deleted'))
    close()
    emit('deleted')
  } catch (e) {
    toast.error(extractNoteAxiosError(e, t('notes.detail.deleteFailed')))
  } finally {
    removing.value = false
  }
}

async function onLinkTask(taskId: number) {
  const n = note.value
  if (!n || !props.canManage) return
  linkBusy.value = true
  try {
    await noteStore.linkTask(props.projectId, n.id, taskId)
    const ids = [...linkedIds.value, taskId]
    note.value = { ...n, linked_task_ids: ids }
    toast.success(t('notes.linkTask.linked'))
    emit('saved')
  } catch (e) {
    toast.error(extractNoteAxiosError(e, t('notes.linkTask.linkFailed')))
  } finally {
    linkBusy.value = false
  }
}

async function onUnlinkTask(taskId: number) {
  const n = note.value
  if (!n || !props.canManage) return
  linkBusy.value = true
  try {
    await noteStore.unlinkTask(props.projectId, n.id, taskId)
    const ids = linkedIds.value.filter(x => x !== taskId)
    note.value = { ...n, linked_task_ids: ids }
    noteStore.invalidateTaskLinks(taskId)
    toast.success(t('notes.linkTask.unlinked'))
    emit('saved')
  } catch (e) {
    toast.error(extractNoteAxiosError(e, t('notes.linkTask.unlinkFailed')))
  } finally {
    linkBusy.value = false
  }
}

async function restoreFromTrash() {
  const n = note.value
  if (!n || !props.canManage) return
  restoring.value = true
  try {
    await trashNotesStore.restoreNote(props.projectId, n.id)
    toast.success(t('notes.trash.noteRestored'))
    close()
    emit('saved')
  } catch {
    toast.error(t('notes.trash.restoreFailed'))
  } finally {
    restoring.value = false
  }
}

async function purgeFromTrash() {
  const n = note.value
  if (!n || !props.canManage) return
  const ok = await confirm({
    title: t('notes.trash.confirmPermanentTitle'),
    message: t('notes.trash.confirmPermanentNote'),
    confirmLabelKey: 'notes.trash.confirmPermanent',
    danger: true,
  })
  if (!ok) return
  purging.value = true
  try {
    await trashNotesStore.permanentDeleteNote(props.projectId, n.id)
    toast.success(t('notes.trash.notePurged'))
    close()
    emit('saved')
  } catch {
    toast.error(t('notes.trash.purgeFailed'))
  } finally {
    purging.value = false
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="note?.title ?? t('notes.detail.title')"
    :dirty="noteModalDirty"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header-actions>
      <Button
        v-if="showHeaderEditButton"
        type="button"
        variant="secondary"
        @click="editing = true"
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
      <div v-if="editing && !trashed" class="space-y-3">
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
      <template v-else>
        <div class="space-y-3">
          <div class="space-y-1">
            <div class="text-xs font-medium text-muted">
              {{ t('notes.form.body') }}
            </div>
            <NoteMarkdownView :source="note.body ?? ''" />
          </div>
        </div>

        <div v-if="!trashed" class="mt-6 border-t border-border pt-4">
          <h3 class="text-sm font-semibold text-foreground">
            {{ t('notes.detail.linkedTasks') }}
          </h3>
          <ul class="mt-2 space-y-1">
            <li
              v-for="task in linkedTasks"
              :key="task.id"
              class="flex items-center justify-between gap-2 text-sm"
            >
              <span class="min-w-0 truncate">{{ task.title }}</span>
              <Button
                v-if="canManage"
                type="button"
                variant="ghost-danger"
                :disabled="linkBusy"
                @click="onUnlinkTask(task.id)"
              >
                {{ t('notes.linkTask.unlink') }}
              </Button>
            </li>
            <li
              v-if="linkedTasks.length === 0"
              class="text-xs text-muted"
            >
              {{ t('notes.detail.noLinkedTasks') }}
            </li>
          </ul>
          <div v-if="canManage" class="mt-3">
            <NoteLinkedTasksPicker
              :tasks="projectTasks"
              :disabled="linkBusy"
              @link="onLinkTask"
            />
          </div>
        </div>
      </template>
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
        v-else-if="canManage && editing && !trashed"
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
</template>
