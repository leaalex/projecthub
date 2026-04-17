<script setup lang="ts">
import { PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Subtask, Task } from '../../types/task'
import { useTaskStore } from '../../stores/task.store'
import { useToast } from '../../composables/useToast'
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
  }>(),
  { readonly: false, hideHeading: false, compact: false, allowToggle: true },
)

const emit = defineEmits<{
  updated: []
}>()

const taskStore = useTaskStore()
const toast = useToast()

const newTitle = ref('')
const newInputRef = useTemplateRef<{ focus: () => void }>('newInputRef')
const busyAdd = ref(false)
const busyId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const editDraft = ref('')

const sorted = computed(() =>
  sortSubtasks(props.task.subtasks ?? []),
)

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

async function addSubtask() {
  const title = newTitle.value.trim()
  if (!title || busyAdd.value) return
  busyAdd.value = true
  try {
    await taskStore.createSubtask(props.task.id, title)
    newTitle.value = ''
    emit('updated')
    toast.success(t('taskSubtasks.toasts.added'))
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(
      typeof msg === 'string' ? msg : t('taskSubtasks.toasts.addFailed'),
    )
  } finally {
    busyAdd.value = false
  }
}

async function toggle(st: Subtask) {
  if (busyId.value != null) return
  busyId.value = st.id
  try {
    await taskStore.toggleSubtask(props.task.id, st.id)
    emit('updated')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(
      typeof msg === 'string' ? msg : t('taskSubtasks.toasts.updateFailed'),
    )
  } finally {
    busyId.value = null
  }
}

async function remove(st: Subtask) {
  if (busyId.value != null) return
  busyId.value = st.id
  try {
    await taskStore.deleteSubtask(props.task.id, st.id)
    emit('updated')
    toast.success(t('taskSubtasks.toasts.removed'))
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(
      typeof msg === 'string' ? msg : t('taskSubtasks.toasts.removeFailed'),
    )
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

function startEdit(s: Subtask) {
  if (!effectiveAllowRename.value || busyId.value != null) return
  editingId.value = s.id
  editDraft.value = s.title
}

function cancelEdit() {
  editingId.value = null
  editDraft.value = ''
}

async function commitEdit(s: Subtask) {
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
  busyId.value = s.id
  try {
    await taskStore.updateSubtask(props.task.id, s.id, { title })
    emit('updated')
    cancelEdit()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(
      typeof msg === 'string' ? msg : t('taskSubtasks.toasts.updateFailed'),
    )
  } finally {
    busyId.value = null
  }
}

function onEditKeydown(s: Subtask, e: KeyboardEvent) {
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
        :key="s.id"
        class="flex items-center gap-2"
        :class="compact ? 'py-1' : 'py-1.5'"
      >
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
            :disabled="busyId === s.id || editingId === s.id"
            :aria-label="t('taskSubtasks.aria.done', { title: s.title })"
            @change="toggle(s)"
          />
          <div class="flex min-w-0 flex-1 items-center gap-0.5">
            <UiInput
              v-if="editingId === s.id"
              :id="`subtask-edit-${task.id}-${s.id}`"
              v-model="editDraft"
              class="w-full min-w-0"
              :class="compact ? 'text-xs' : ''"
              :disabled="busyId === s.id"
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
                :disabled="busyId === s.id"
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
                  :disabled="busyId === s.id"
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
            :disabled="busyId === s.id || editingId === s.id"
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
          :disabled="busyAdd"
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
