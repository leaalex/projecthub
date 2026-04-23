<script setup lang="ts">
import {
  CalendarDaysIcon,
  ClockIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  LinkIcon,
  ListBulletIcon,
  PencilSquareIcon,
  PlusIcon,
  UserCircleIcon,
} from '@heroicons/vue/24/outline'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiDetailPanelShell from '../ui/UiDetailPanelShell.vue'
import Modal from '../ui/UiModal.vue'
import Button from '../ui/UiButton.vue'
import Skeleton from '../ui/UiSkeleton.vue'
import UiInput from '../ui/UiInput.vue'
import UiBadge from '../ui/UiBadge.vue'
import UiAvatar from '../ui/UiAvatar.vue'
import NoteCard from '../notes/NoteCard.vue'
import TaskSubtasksPanel from './TaskSubtasksPanel.vue'
import { useDetailPanelStore } from '@app/detailPanel.store'
import { useTaskDetail } from '@app/composables/useTaskDetail'
import { formatDateShort, timeAgo } from '@infra/formatters/date'

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

const subtaskProgress = computed(() => {
  const list = task.value?.subtasks ?? []
  const total = list.length
  const done = list.filter(s => s.done).length
  return { total, done }
})

type DueInfo = { text: string; overdue: boolean }

const dueInfo = computed<DueInfo | null>(() => {
  const raw = task.value?.due_date
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startDue = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const overdue = task.value?.status !== 'done' && startDue < startToday
  return { text: formatDateShort(raw, locale.value), overdue }
})
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
  <UiDetailPanelShell
    class="min-h-0 flex-1"
    :title="t('taskDetailModal.sidebarTitle')"
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

    <div v-if="loading" class="space-y-3">
      <Skeleton variant="line" />
      <Skeleton variant="line" :lines="3" />
    </div>
    <p v-else-if="loadError" class="text-sm text-destructive">{{ loadError }}</p>

    <template v-else-if="task">
      <!-- HERO: title + priority meta row -->
      <section class="space-y-2.5">
        <h3
          class="break-words text-base font-semibold leading-snug text-foreground"
        >
          {{ task.title }}
        </h3>
        <div class="flex flex-wrap items-center gap-1.5">
          <UiBadge kind="status" :value="task.status" />
          <UiBadge kind="priority" :value="task.priority" />
          <span
            v-if="dueInfo"
            class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
            :class="dueInfo.overdue
              ? 'border-red-300 bg-red-100 text-red-800 dark:border-red-900/60 dark:bg-red-950 dark:text-red-200'
              : 'border-border bg-surface-muted text-foreground'"
            :title="dueInfo.overdue ? t('taskDetailModal.labels.overdue') : t('taskDetailModal.labels.dueDate')"
          >
            <CalendarDaysIcon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{{ dueInfo.text }}</span>
          </span>
        </div>
      </section>

      <!-- META: project / section / assignee (icon rows) -->
      <section class="mt-3 space-y-1.5">
        <div class="flex min-w-0 items-center gap-2 text-xs">
          <FolderOpenIcon class="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <span class="min-w-0 truncate text-foreground">
            {{ task.project?.name ?? t('taskCard.meta.projectNum', { n: task.project_id }) }}
          </span>
          <template v-if="task.section?.name">
            <span class="shrink-0 text-muted" aria-hidden="true">·</span>
            <span class="min-w-0 truncate text-muted">{{ task.section.name }}</span>
          </template>
        </div>
        <div class="flex min-w-0 items-center gap-2 text-xs">
          <template v-if="task.assignee">
            <UiAvatar
              class="!h-5 !w-5 text-[9px]"
              :name="task.assignee.name"
              :email="task.assignee.email"
            />
            <span class="min-w-0 truncate text-foreground">{{
              task.assignee.name || task.assignee.email
            }}</span>
          </template>
          <template v-else>
            <UserCircleIcon class="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <span class="text-muted">{{ t('common.unassigned') }}</span>
          </template>
        </div>
      </section>

      <!-- DESCRIPTION -->
      <section class="mt-5 space-y-2">
        <div class="flex min-w-0 items-center gap-2">
          <DocumentTextIcon class="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
          <span class="shrink-0 text-xs font-medium text-muted">
            {{ t('taskDetailModal.labels.description') }}
          </span>
          <div class="h-px min-h-px flex-1 bg-border" aria-hidden="true" />
        </div>
        <p
          v-if="task.description"
          class="whitespace-pre-wrap break-words pl-5 text-sm leading-relaxed text-foreground"
        >
          {{ task.description }}
        </p>
        <p v-else class="pl-5 text-xs italic text-muted">
          {{ t('taskDetailModal.labels.noDescription') }}
        </p>
      </section>

      <!-- SUBTASKS -->
      <section class="mt-5 space-y-2">
        <div class="flex min-w-0 items-center gap-2">
          <ListBulletIcon class="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
          <span class="shrink-0 text-xs font-medium text-muted">
            {{ t('taskDetailModal.labels.subtasks') }}
          </span>
          <span
            v-if="subtaskProgress.total > 0"
            class="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted"
          >
            {{ subtaskProgress.done }}/{{ subtaskProgress.total }}
          </span>
          <div class="h-px min-h-px flex-1 bg-border" aria-hidden="true" />
        </div>
        <TaskSubtasksPanel
          :task="task"
          hide-heading
          :readonly="!canEdit"
          @updated="refresh"
        />
      </section>

      <!-- LINKED NOTES -->
      <section class="mt-5 space-y-2">
        <div class="flex min-w-0 items-center gap-2">
          <LinkIcon class="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
          <span class="shrink-0 text-xs font-medium text-muted">
            {{ t('taskDetailModal.linkedNotes.heading') }}
          </span>
          <span
            v-if="linkedNotes.length > 0"
            class="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted"
          >
            {{ linkedNotes.length }}
          </span>
          <div class="h-px min-h-px flex-1 bg-border" aria-hidden="true" />
          <button
            v-if="canManageNotes"
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
            v-if="linkedNotes.length > 0"
            class="divide-y divide-border overflow-hidden rounded-md border border-border bg-surface"
          >
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
            class="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted"
          >
            {{ t('taskDetailModal.linkedNotes.empty') }}
          </p>
        </div>
      </section>

      <!-- TIMELINE (updated / created) -->
      <section class="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
        <ClockIcon class="h-3 w-3 shrink-0" aria-hidden="true" />
        <span>{{ t('taskDetailModal.meta.updated', { date: timeAgo(task.updated_at, t, locale) }) }}</span>
        <span class="opacity-60" aria-hidden="true">·</span>
        <span>{{ t('taskDetailModal.meta.created', { date: formatDateShort(task.created_at, locale) }) }}</span>
      </section>
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
              <DocumentCheckIcon
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
