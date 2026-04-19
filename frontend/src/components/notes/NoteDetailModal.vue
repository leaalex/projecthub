<script setup lang="ts">
import { PencilSquareIcon } from '@heroicons/vue/24/outline'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Note } from '@domain/note/types'
import type { ProjectSection } from '@domain/project/types'
import { useNoteStore, extractNoteAxiosError } from '@app/note.store'
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

const props = defineProps<{
  modelValue: boolean
  projectId: number
  noteId: number | null
  sections: ProjectSection[]
  projectTasks: { id: number; title: string }[]
  canManage: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  saved: []
  deleted: []
}>()

const noteStore = useNoteStore()

const note = ref<Note | null>(null)
const loading = ref(false)
const editing = ref(false)
const saving = ref(false)
const linkBusy = ref(false)

const linkedIds = computed(() => note.value?.linked_task_ids ?? [])

const linkedTasks = computed(() =>
  props.projectTasks.filter(t => linkedIds.value.includes(t.id)),
)

watch(
  () => [props.modelValue, props.noteId, props.projectId] as const,
  async ([open, nid]) => {
    if (!open || nid == null) {
      note.value = null
      editing.value = false
      return
    }
    loading.value = true
    try {
      const n = await noteStore.fetchOne(props.projectId, nid)
      note.value = n
      noteStore.patchNoteInList(n.id, { linked_task_ids: n.linked_task_ids })
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
  if (!n) return
  const ok = await confirm({
    title: t('notes.confirm.deleteTitle'),
    message: t('notes.confirm.deleteMessage', { title: n.title }),
    confirmLabelKey: 'notes.confirm.deleteConfirm',
    danger: true,
  })
  if (!ok) return
  try {
    await noteStore.remove(props.projectId, n.id)
    toast.success(t('notes.detail.deleted'))
    close()
    emit('deleted')
  } catch (e) {
    toast.error(extractNoteAxiosError(e, t('notes.detail.deleteFailed')))
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
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="note?.title ?? t('notes.detail.title')"
    wide
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="loading" class="space-y-2">
      <Skeleton variant="line" />
      <Skeleton variant="line" :lines="4" />
    </div>
    <template v-else-if="note">
      <div v-if="editing" class="space-y-3">
        <NoteForm
          :initial="note"
          :sections="sections"
          :loading="saving"
          :submit-label="t('common.save')"
          @cancel="editing = false"
          @submit="saveFromForm"
        />
      </div>
      <template v-else>
        <div class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-semibold text-foreground">
              {{ note.title }}
            </h2>
            <div v-if="canManage" class="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                @click="editing = true"
              >
                <PencilSquareIcon class="h-4 w-4" />
                <span class="ml-1">{{ t('common.edit') }}</span>
              </Button>
              <Button type="button" variant="ghost-danger" @click="removeNote">
                {{ t('common.delete') }}
              </Button>
            </div>
          </div>
          <div class="space-y-1">
            <div class="text-xs font-medium text-muted">
              {{ t('notes.form.body') }}
            </div>
            <NoteMarkdownView :source="note.body ?? ''" />
          </div>
        </div>

        <div class="mt-6 border-t border-border pt-4">
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
  </Modal>
</template>
