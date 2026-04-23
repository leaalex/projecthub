<script setup lang="ts">
import { PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DraftSubtask, Subtask, Task } from '@domain/task/types'
import { useTaskStore } from '@app/task.store'
import { useToast } from '@app/composables/useToast'
import { mapApiError } from '@infra/api/errorMap'
import UiInput from '../ui/UiInput.vue'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    task: Task
    /** When true, show list only (no add / toggle / delete). */
    readonly?: boolean
    /** Hide the "Subtasks" label (e.g. when wrapped in `<dl>`). */
    hideHeading?: boolean
    /**
     * Compact list in collapsed task row: no add/delete; checkboxes only if `allowToggle`.
     */
    compact?: boolean
    /** Allow marking subtasks done (owner or assignee). Ignored when `readonly`. */
    allowToggle?: boolean
    /**
     * Allow renaming subtasks (project owner). Defaults to true in full panel, false in `compact` unless set.
     */
    allowRename?: boolean
    /**
     * Черновой режим: список из v-model:draft, без API; изменения сбрасываются снаружи.
     */
    draftMode?: boolean
    /**
     * Снимок с сервера по id подзадачи — для визуала «изменённых» строк (опционально).
     */
    subtaskOriginal?: Map<number, { title: string; done: boolean }>
  }>(),
  { readonly: false, hideHeading: false, compact: false, allowToggle: true, draftMode: false },
)

const emit = defineEmits<{
  updated: []
}>()

const draft = defineModel<DraftSubtask[]>('draft', { default: () => [] })
const removedIds = defineModel<number[]>('removedIds', { default: () => [] })

const taskStore = useTaskStore()
const toast = useToast()

const newTitle = ref('')
const newInputRef = useTemplateRef<{ focus: () => void }>('newInputRef')
const busyAdd = ref(false)
const busyId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const editingClientKey = ref<string | null>(null)
const editDraft = ref('')

function toastSubtaskError(e: unknown, fallbackI18nKey: string) {
  toast.error(mapApiError(e, fallbackI18nKey))
}

const sortedSubtasks = computed(() =>
  sortSubtasks(props.task.subtasks ?? []),
)

const sortedDraft = computed(() => sortDrafts(draft.value))

const sorted = computed((): Subtask[] | DraftSubtask[] => {
  if (props.draftMode) return sortedDraft.value
  return sortedSubtasks.value
})

const showAsReadonlyMarkers = computed(
  () =>
    props.readonly || (props.compact && !props.allowToggle),
)

const effectiveAllowRename = computed(() => {
  if (props.readonly || showAsReadonlyMarkers.value) return false
  if (props.allowRename != null) return props.allowRename
  return !props.compact
})

function sortSubtasks(list: Subtask[]): Subtask[] {
  return [...list].sort(
    (a, b) => a.position - b.position || a.id - b.id,
  )
}

function sortDrafts(list: DraftSubtask[]): DraftSubtask[] {
  return [...list].sort(
    (a, b) => a.position - b.position
      || (a.id != null && b.id != null ? a.id - b.id : 0)
      || a.clientKey.localeCompare(b.clientKey),
  )
}

function isDraft(s: Subtask | DraftSubtask): s is DraftSubtask {
  return props.draftMode && 'clientKey' in s
}

function itemKey(s: Subtask | DraftSubtask) {
  return isDraft(s) ? s.clientKey : s.id
}

function isEditingItem(s: Subtask | DraftSubtask) {
  if (isDraft(s)) {
    return editingClientKey.value === s.clientKey
  }
  return editingId.value === s.id
}

function isSubtaskRowDirty(s: Subtask | DraftSubtask): boolean {
  if (!isDraft(s)) return false
  if (s.id == null) return true
  const o = props.subtaskOriginal?.get(s.id)
  if (!o) return false
  return o.title !== s.title || o.done !== s.done
}

function newClientKey() {
  return typeof globalThis !== 'undefined'
    && typeof globalThis.crypto !== 'undefined'
    && typeof globalThis.crypto.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `n-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

async function addSubtask() {
  const title = newTitle.value.trim()
  if (!title || busyAdd.value) return

  if (props.draftMode) {
    const list = draft.value
    const maxPos = list.length ? Math.max(...list.map((x) => x.position)) : -1
    const position = maxPos + 1
    draft.value = [
      ...list,
      {
        clientKey: newClientKey(),
        id: null,
        title,
        done: false,
        position,
      },
    ]
    newTitle.value = ''
    return
  }

  busyAdd.value = true
  try {
    await taskStore.createSubtask(props.task.id, title)
    newTitle.value = ''
    emit('updated')
    toast.success(t('taskSubtasks.toasts.added'))
  } catch (e: unknown) {
    toastSubtaskError(e, 'taskSubtasks.toasts.addFailed')
  } finally {
    busyAdd.value = false
    // Chromium: после `disabled` + `emit/refresh` фокус не возвращается в input сам
    void nextTick(() => {
      focusNewInput()
    })
  }
}

async function toggle(s: Subtask | DraftSubtask) {
  if (isDraft(s)) {
    const i = draft.value.findIndex((x) => x.clientKey === s.clientKey)
    if (i < 0) return
    const next = { ...draft.value[i]! }
    next.done = !next.done
    const copy = [...draft.value]
    copy[i] = next
    draft.value = copy
    return
  }
  if (busyId.value != null) return
  busyId.value = s.id
  try {
    await taskStore.toggleSubtask(props.task.id, s.id)
    emit('updated')
  } catch (e: unknown) {
    toastSubtaskError(e, 'taskSubtasks.toasts.updateFailed')
  } finally {
    busyId.value = null
  }
}

async function remove(s: Subtask | DraftSubtask) {
  if (isDraft(s)) {
    if (s.id != null) {
      const id = s.id
      if (!removedIds.value.includes(id)) {
        removedIds.value = [...removedIds.value, id]
      }
    }
    draft.value = draft.value.filter((x) => x.clientKey !== s.clientKey)
    return
  }
  if (busyId.value != null) return
  busyId.value = s.id
  try {
    await taskStore.deleteSubtask(props.task.id, s.id)
    emit('updated')
    toast.success(t('taskSubtasks.toasts.removed'))
  } catch (e: unknown) {
    toastSubtaskError(e, 'taskSubtasks.toasts.removeFailed')
  } finally {
    busyId.value = null
  }
}

function onNewKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    addSubtask()
  }
}

function startEdit(s: Subtask | DraftSubtask) {
  if (!effectiveAllowRename.value || busyId.value != null) return
  if (isDraft(s)) {
    editingClientKey.value = s.clientKey
  } else {
    editingId.value = s.id
  }
  editDraft.value = s.title
}

function cancelEdit() {
  editingId.value = null
  editingClientKey.value = null
  editDraft.value = ''
}

function commitEdit(s: Subtask | DraftSubtask) {
  if (isDraft(s)) {
    if (editingClientKey.value !== s.clientKey) return
    const title = editDraft.value.trim()
    if (!title) {
      toast.error(t('taskSubtasks.toasts.enterTitle'))
      editDraft.value = s.title
      return
    }
    if (title === s.title) {
      cancelEdit()
      return
    }
    const i = draft.value.findIndex((x) => x.clientKey === s.clientKey)
    if (i >= 0) {
      const next = { ...draft.value[i]!, title }
      const copy = [...draft.value]
      copy[i] = next
      draft.value = copy
    }
    cancelEdit()
    return
  }
  if (editingId.value !== s.id) return
  const title = editDraft.value.trim()
  if (!title) {
    toast.error(t('taskSubtasks.toasts.enterTitle'))
    editDraft.value = s.title
    return
  }
  if (title === s.title) {
    cancelEdit()
    return
  }
  doCommitSubtaskTitle(s, title)
}

async function doCommitSubtaskTitle(s: Subtask, title: string) {
  busyId.value = s.id
  try {
    await taskStore.updateSubtask(props.task.id, s.id, { title })
    emit('updated')
    cancelEdit()
  } catch (e: unknown) {
    toastSubtaskError(e, 'taskSubtasks.toasts.updateFailed')
  } finally {
    busyId.value = null
  }
}

function onEditKeydown(s: Subtask | DraftSubtask, e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    commitEdit(s)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    cancelEdit()
  }
}

function focusNewInput() {
  newInputRef.value?.focus()
}

defineExpose({ focusNewInput })
</script>

<template>
  <div class="space-y-2">
    <div
      v-if="!hideHeading"
      class="flex min-w-0 items-center gap-2"
    >
      <div
        class="h-px w-1.5 shrink-0 bg-border sm:w-2"
        aria-hidden="true"
      />
      <span class="shrink-0 text-xs font-medium text-muted">{{
        t('taskSubtasks.heading')
      }}</span>
      <div
        class="h-px min-h-px flex-1 bg-border"
        aria-hidden="true"
      />
    </div>

    <div class="min-w-0 space-y-2 pl-2 sm:pl-3">
    <ul
      v-if="sorted.length > 0"
      :class="compact ? 'space-y-1' : 'space-y-1.5'"
    >
      <li
        v-for="s in sorted"
        :key="itemKey(s)"
        class="flex min-w-0 items-center gap-2"
        :class="compact ? 'py-1' : 'py-1.5'"
      >
        <div
          v-if="draftMode && isDraft(s) && isSubtaskRowDirty(s)"
          class="w-0.5 shrink-0 self-stretch rounded-full"
          :class="s.id == null ? 'bg-amber-500' : 'bg-sky-500'"
          aria-hidden="true"
        />
        <template v-if="showAsReadonlyMarkers">
          <span
            class="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border text-[10px]"
            :class="s.done ? 'border-emerald-600 bg-emerald-600 text-white' : ''"
            aria-hidden="true"
          >
            {{ s.done ? '✓' : '' }}
          </span>
          <span
            class="min-w-0 flex-1 leading-snug"
            :class="[
              compact ? 'text-xs' : 'text-sm',
              s.done ? 'text-muted line-through' : 'text-foreground',
            ]"
          >
            {{ s.title }}
          </span>
        </template>
        <template v-else>
          <input
            type="checkbox"
            class="h-3.5 w-3.5 shrink-0 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring sm:h-4 sm:w-4"
            :checked="s.done"
            :disabled="(busyId != null && !isDraft(s) && busyId === s.id) || isEditingItem(s)"
            :aria-label="t('taskSubtasks.aria.done', { title: s.title })"
            @change="toggle(s)"
          />
          <div class="flex min-w-0 flex-1 items-center gap-0.5">
            <UiInput
              v-if="isEditingItem(s)"
              :id="`subtask-edit-${task.id}-${isDraft(s) ? s.clientKey : s.id}`"
              v-model="editDraft"
              class="w-full min-w-0"
              :class="compact ? 'text-xs' : ''"
              :disabled="busyId != null && !isDraft(s) && busyId === s.id"
              :aria-label="t('taskSubtasks.aria.editSubtask', { title: s.title })"
              autofocus
              @keydown="onEditKeydown(s, $event)"
              @blur="commitEdit(s)"
            />
            <template v-else>
              <button
                v-if="effectiveAllowRename && !compact"
                type="button"
                class="min-w-0 flex-1 rounded px-0.5 text-left leading-snug transition-colors hover:bg-surface-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :class="[
                  'pt-0.5 text-sm',
                  s.done ? 'text-muted line-through' : 'text-foreground',
                ]"
                :title="t('taskSubtasks.clickToEdit')"
                :disabled="busyId != null && !isDraft(s) && busyId === s.id"
                @click="startEdit(s)"
              >
                {{ s.title }}
              </button>
              <template v-else-if="effectiveAllowRename && compact">
                <span
                  class="min-w-0 flex-1 leading-snug"
                  :class="[
                    'pt-0 text-xs',
                    s.done ? 'text-muted line-through' : 'text-foreground',
                  ]"
                >
                  {{ s.title }}
                </span>
                <button
                  type="button"
                  class="shrink-0 rounded p-1 text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  :aria-label="t('taskSubtasks.aria.editSubtaskTitle')"
                  :title="t('taskSubtasks.editTitle')"
                  :disabled="busyId != null && !isDraft(s) && busyId === s.id"
                  @mousedown.prevent
                  @click.stop="startEdit(s)"
                >
                  <PencilSquareIcon class="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </template>
              <span
                v-else
                class="min-w-0 flex-1 leading-snug"
                :class="[
                  compact ? 'pt-0 text-xs' : 'pt-0.5 text-sm',
                  s.done ? 'text-muted line-through' : 'text-foreground',
                ]"
              >
                {{ s.title }}
              </span>
            </template>
          </div>
          <button
            v-if="!compact"
            type="button"
            class="shrink-0 rounded p-1 text-muted transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            :aria-label="t('taskSubtasks.aria.removeSubtask')"
            :disabled="(busyId != null && !isDraft(s) && busyId === s.id) || isEditingItem(s)"
            @mousedown.prevent
            @click="remove(s)"
          >
            <TrashIcon class="h-4 w-4" aria-hidden="true" />
          </button>
        </template>
      </li>
    </ul>

    <p
      v-else-if="readonly"
      class="text-xs text-muted"
    >
      {{ t('taskSubtasks.emptyReadonly') }}
    </p>

    <div
      v-if="!readonly && !compact"
      class="flex min-w-0 items-center gap-2 py-1.5"
    >
      <input
        type="checkbox"
        disabled
        tabindex="-1"
        class="pointer-events-none h-3.5 w-3.5 shrink-0 cursor-default rounded border-border opacity-45 text-primary sm:h-4 sm:w-4"
        aria-hidden="true"
        title=""
      />
      <div class="flex min-w-0 flex-1 items-center">
        <label class="sr-only" :for="`subtask-new-${task.id}`">{{
          t('taskSubtasks.srNew')
        }}</label>
        <UiInput
          ref="newInputRef"
          :id="`subtask-new-${task.id}`"
          v-model="newTitle"
          :placeholder="t('taskSubtasks.placeholder')"
          :disabled="!draftMode && busyAdd"
          class="w-full min-w-0"
          @keydown="onNewKeydown"
        />
      </div>
      <div
        class="shrink-0 p-1"
        aria-hidden="true"
      >
        <div class="h-4 w-4" />
      </div>
    </div>
    </div>
  </div>
</template>
