<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTrashTasksStore } from '@app/trashTasks.store'
import { useTrashNotesStore } from '@app/trashNotes.store'
import { useToast } from '@app/composables/useToast'
import { useConfirm } from '@app/composables/useConfirm'
import Button from '../ui/UiButton.vue'
import Skeleton from '../ui/UiSkeleton.vue'

const { t } = useI18n()
const toast = useToast()
const { confirm } = useConfirm()

const props = defineProps<{
  projectId: number
  canManage: boolean
}>()

const emit = defineEmits<{
  restored: []
}>()

const trashTasksStore = useTrashTasksStore()
const trashNotesStore = useTrashNotesStore()

watch(
  () => props.projectId,
  id => {
    if (id > 0) {
      void trashTasksStore.fetchTasks(id)
      void trashNotesStore.fetchNotes(id)
    }
  },
  { immediate: true },
)

async function restoreTask(taskId: number) {
  try {
    await trashTasksStore.restoreTask(props.projectId, taskId)
    toast.success(t('notes.trash.taskRestored'))
    emit('restored')
  } catch {
    toast.error(t('notes.trash.restoreFailed'))
  }
}

async function restoreNote(noteId: number) {
  try {
    await trashNotesStore.restoreNote(props.projectId, noteId)
    toast.success(t('notes.trash.noteRestored'))
    emit('restored')
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
    emit('restored')
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
    await trashNotesStore.permanentDeleteNote(props.projectId, noteId)
    toast.success(t('notes.trash.notePurged'))
    emit('restored')
  } catch {
    toast.error(t('notes.trash.purgeFailed'))
  }
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <section class="rounded-lg border border-border bg-surface p-4">
      <h3 class="text-sm font-semibold text-foreground">
        {{ t('notes.trash.tasksHeading') }}
      </h3>
      <div v-if="trashTasksStore.loading" class="mt-3 space-y-2">
        <Skeleton variant="line" />
        <Skeleton variant="line" />
      </div>
      <ul v-else class="mt-3 divide-y divide-border">
        <li
          v-for="task in trashTasksStore.tasks"
          :key="task.id"
          class="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
        >
          <span class="min-w-0 flex-1 truncate">{{ task.title }}</span>
          <div class="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="secondary"
              :disabled="!canManage"
              @click="restoreTask(task.id)"
            >
              {{ t('notes.restore') }}
            </Button>
            <Button
              type="button"
              variant="ghost-danger"
              :disabled="!canManage"
              @click="hardDeleteTask(task.id)"
            >
              {{ t('notes.trash.deleteForever') }}
            </Button>
          </div>
        </li>
        <li
          v-if="trashTasksStore.tasks.length === 0"
          class="py-6 text-center text-xs text-muted"
        >
          {{ t('notes.trash.emptyTasks') }}
        </li>
      </ul>
    </section>
    <section class="rounded-lg border border-border bg-surface p-4">
      <h3 class="text-sm font-semibold text-foreground">
        {{ t('notes.trash.notesHeading') }}
      </h3>
      <div v-if="trashNotesStore.loading" class="mt-3 space-y-2">
        <Skeleton variant="line" />
        <Skeleton variant="line" />
      </div>
      <ul v-else class="mt-3 divide-y divide-border">
        <li
          v-for="note in trashNotesStore.notes"
          :key="note.id"
          class="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
        >
          <span class="min-w-0 flex-1 truncate">{{ note.title }}</span>
          <div class="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="secondary"
              :disabled="!canManage"
              @click="restoreNote(note.id)"
            >
              {{ t('notes.restore') }}
            </Button>
            <Button
              type="button"
              variant="ghost-danger"
              :disabled="!canManage"
              @click="hardDeleteNote(note.id)"
            >
              {{ t('notes.trash.deleteForever') }}
            </Button>
          </div>
        </li>
        <li
          v-if="trashNotesStore.notes.length === 0"
          class="py-6 text-center text-xs text-muted"
        >
          {{ t('notes.trash.emptyNotes') }}
        </li>
      </ul>
    </section>
  </div>
</template>
