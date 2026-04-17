<script setup lang="ts">
import { BoltIcon, FolderIcon, TagIcon } from '@heroicons/vue/24/outline'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TaskPriority, TaskStatus } from '../../types/task'
import Button from '../ui/UiButton.vue'
import Input from '../ui/UiInput.vue'
import UiMenuButton from '../ui/UiMenuButton.vue'
import UiTextarea from '../ui/UiTextarea.vue'
import { useTaskStore } from '../../stores/task.store'
import { useToast } from '../../composables/useToast'
import { taskPriorityLabel, taskStatusLabel } from '../../utils/taskEnumLabels'

const { t } = useI18n()

const STATUS_OPTIONS = computed(() =>
  (['todo', 'in_progress', 'review', 'done'] as const).map((value) => ({
    value,
    label: taskStatusLabel(t, value),
  })),
)

const PRIORITY_OPTIONS = computed(() =>
  (['low', 'medium', 'high', 'critical'] as const).map((value) => ({
    value,
    label: taskPriorityLabel(t, value),
  })),
)

const props = withDefaults(
  defineProps<{
    /** When set, tasks are created in this project only (no project select). */
    projectId?: number
    /** Required when `projectId` is not set: options for the project dropdown. */
    projects?: { id: number; name: string }[]
    disabled?: boolean
    /** No outer border — use inside TaskList panel. */
    variant?: 'card' | 'plain'
  }>(),
  { variant: 'card' },
)

const emit = defineEmits<{
  created: []
  dismiss: []
}>()

const taskStore = useTaskStore()
const toast = useToast()

const title = ref('')
const description = ref('')
const status = ref<TaskStatus>('todo')
const priority = ref<TaskPriority>('medium')
const selectedProjectId = ref<number>(0)
const saving = ref(false)
const titleInputRef = ref<{ focus: () => void } | null>(null)

onMounted(() => {
  nextTick(() => titleInputRef.value?.focus())
})

const statusMenuLabel = computed(
  () =>
    STATUS_OPTIONS.value.find((o) => o.value === status.value)?.label ?? '',
)
const priorityMenuLabel = computed(
  () =>
    PRIORITY_OPTIONS.value.find((o) => o.value === priority.value)?.label ?? '',
)

const needsProjectSelect = computed(
  () => props.projectId == null && (props.projects?.length ?? 0) > 0,
)

watch(
  () => [props.projectId, props.projects] as const,
  () => {
    if (props.projectId != null && props.projectId > 0) {
      selectedProjectId.value = props.projectId
      return
    }
    const first = props.projects?.[0]
    selectedProjectId.value = first?.id ?? 0
  },
  { immediate: true },
)

const effectiveProjectId = computed(() => {
  if (props.projectId != null && props.projectId > 0) return props.projectId
  return selectedProjectId.value
})

const inlineProjectOptions = computed(() =>
  (props.projects ?? []).map((p) => ({ value: p.id, label: p.name })),
)

const selectedProjectName = computed(
  () =>
    inlineProjectOptions.value.find((o) => o.value === selectedProjectId.value)
      ?.label ?? t('taskInlineComposer.projectFallback'),
)

function syncProjectFromProps() {
  if (props.projectId != null && props.projectId > 0) {
    selectedProjectId.value = props.projectId
    return
  }
  const first = props.projects?.[0]
  selectedProjectId.value = first?.id ?? 0
}

function resetSecondaryFields() {
  description.value = ''
  status.value = 'todo'
  priority.value = 'medium'
  syncProjectFromProps()
}

function resetForm() {
  title.value = ''
  resetSecondaryFields()
}

function cancelForm() {
  resetForm()
  emit('dismiss')
}

async function submit() {
  const trimmedTitle = title.value.trim()
  if (!trimmedTitle) {
    toast.error(t('taskInlineComposer.toasts.enterTitle'))
    return
  }
  const pid = Math.trunc(Number(effectiveProjectId.value))
  if (!pid) {
    toast.error(t('taskInlineComposer.toasts.selectProject'))
    return
  }
  saving.value = true
  try {
    const desc = description.value.trim()
    await taskStore.create({
      title: trimmedTitle,
      ...(desc ? { description: desc } : {}),
      project_id: pid,
      status: status.value,
      priority: priority.value,
    })
    resetForm()
    emit('created')
    toast.success(t('taskInlineComposer.toasts.created'))
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(
      typeof msg === 'string' ? msg : t('taskInlineComposer.toasts.createFailed'),
    )
  } finally {
    saving.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}
</script>

<template>
  <div
    :class="[
      'flex flex-col gap-3',
      variant === 'card' &&
        'rounded-lg border border-border bg-surface p-3',
      variant === 'plain' && 'py-1',
    ]"
  >
    <div class="min-w-0">
      <label class="sr-only" for="inline-task-title">{{
        t('taskInlineComposer.srTitle')
      }}</label>
      <Input
        id="inline-task-title"
        ref="titleInputRef"
        v-model="title"
        type="text"
        :placeholder="t('taskInlineComposer.titlePlaceholder')"
        autocomplete="off"
        :disabled="disabled || saving"
        @keydown="onKeydown"
      />
    </div>

    <div class="min-w-0">
      <label class="sr-only" for="inline-task-desc">{{
        t('taskInlineComposer.srDescription')
      }}</label>
      <UiTextarea
        id="inline-task-desc"
        v-model="description"
        :rows="2"
        :placeholder="t('taskInlineComposer.descriptionPlaceholder')"
        :disabled="disabled || saving"
      />
    </div>

    <div
      class="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-2"
    >
      <div
        v-if="needsProjectSelect"
        class="flex shrink-0 items-center"
      >
        <label class="sr-only">{{ t('taskInlineComposer.srProject') }}</label>
        <UiMenuButton
          v-model="selectedProjectId"
          :summary="selectedProjectName"
          :ariaLabel="
            t('taskInlineComposer.projectForNewTask', {
              name: selectedProjectName,
            })
          "
          :title="
            t('taskInlineComposer.projectLabel', { name: selectedProjectName })
          "
          :options="inlineProjectOptions"
          :disabled="disabled || saving"
        >
          <FolderIcon class="h-5 w-5" aria-hidden="true" />
        </UiMenuButton>
      </div>
      <UiMenuButton
        v-model="status"
        :summary="statusMenuLabel"
        :ariaLabel="t('taskInlineComposer.statusLabel', { name: statusMenuLabel })"
        :title="t('taskInlineComposer.statusLabel', { name: statusMenuLabel })"
        :options="STATUS_OPTIONS"
        :disabled="disabled || saving"
      >
        <TagIcon class="h-5 w-5" aria-hidden="true" />
      </UiMenuButton>
      <UiMenuButton
        v-model="priority"
        :summary="priorityMenuLabel"
        :ariaLabel="
          t('taskInlineComposer.priorityLabel', { name: priorityMenuLabel })
        "
        :title="
          t('taskInlineComposer.priorityLabel', { name: priorityMenuLabel })
        "
        :options="PRIORITY_OPTIONS"
        :disabled="disabled || saving"
      >
        <BoltIcon class="h-5 w-5" aria-hidden="true" />
      </UiMenuButton>
      <div class="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          :disabled="disabled || saving"
          @click="cancelForm"
        >
          {{ t('taskInlineComposer.cancel') }}
        </Button>
        <Button
          type="button"
          :disabled="disabled || saving"
          :loading="saving"
          @click="submit"
        >
          {{ t('taskInlineComposer.add') }}
        </Button>
      </div>
    </div>
  </div>
</template>
