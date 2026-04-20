<script setup lang="ts">
import {
  DocumentCheckIcon,
  LinkIcon,
  PencilSquareIcon,
} from '@heroicons/vue/24/outline'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Task } from '@domain/task/types'
import type { Note } from '@domain/note/types'
import type { ProjectSection } from '@domain/project/types'
import { useTaskStore } from '@app/task.store'
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
import TaskCard from '../tasks/TaskCard.vue'

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
  openTask: [taskId: number]
}>()

const noteStore = useNoteStore()
const taskStore = useTaskStore()
const trashNotesStore = useTrashNotesStore()

const note = ref<Note | null>(null)
const loading = ref(false)
const editing = ref(false)
const saving = ref(false)
const removing = ref(false)
const restoring = ref(false)
const purging = ref(false)
const linkBusy = ref(false)
const linkManagerOpen = ref(false)

const linkedIds = computed(() => note.value?.linked_task_ids ?? [])

const linkedTaskObjects = ref<Task[]>([])

async function refreshLinkedTasks() {
  const n = note.value
  if (!n) {
    linkedTaskObjects.value = []
    return
  }
  const ids = n.linked_task_ids ?? []
  if (ids.length === 0) {
    linkedTaskObjects.value = []
    return
  }
  try {
    const items = await Promise.all(ids.map(id => taskStore.fetchOne(id)))
    linkedTaskObjects.value = items
  } catch {
    linkedTaskObjects.value = []
  }
}

watch(
  () => note.value?.linked_task_ids,
  () => {
    void refreshLinkedTasks()
  },
  { immediate: true },
)

function openTask(id: number) {
  emit('openTask', id)
}

const availableTasks = computed(() =>
  props.projectTasks.filter(t => !linkedIds.value.includes(t.id)),
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

const showHeaderLinkedTasksButton = computed(
  () =>
    Boolean(
      note.value
      && props.canManage
      && editing.value
      && !props.trashed
      && !loading.value,
    ),
)

function cancelEdit() {
  editing.value = false
}

/** Заполняем поля до монтирования NoteForm — иначе NoteMarkdownEditor стартует с пустым body. */
watch(
  () => [note.value, editing.value] as const,
  ([n, ed]) => {
    if (!n || !ed) return
    formTitle.value = n.title
    formBody.value = n.body ?? ''
    formSectionId.value = n.section_id ?? null
  },
  { immediate: true },
)

watch(
  () =>
    [props.modelValue, props.noteId, props.projectId, props.trashed] as const,
  async ([open, nid, , trashed]) => {
    if (!open || nid == null) {
      note.value = null
      editing.value = false
      linkManagerOpen.value = false
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
        <Button
          v-if="showHeaderEditButton"
          type="button"
          variant="secondary"
          @click="editing = true"
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
            <div class="text-xs font-medium text-foreground">
              {{ t('notes.form.body') }}
            </div>
            <NoteMarkdownView :source="note.body ?? ''" />
          </div>
        </div>

        <div v-if="!trashed" class="mt-6 border-t border-border pt-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
              <LinkIcon class="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <span class="truncate">{{ t('notes.detail.linkedTasks') }}</span>
            </h3>
            <Button
              v-if="canManage"
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
