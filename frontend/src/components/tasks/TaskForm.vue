<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AssignableUserOption } from '@domain/project/membership'
import type { ProjectSection } from '@domain/project/types'
import type { TaskPriority, TaskStatus } from '@domain/task/types'
import Button from '../ui/UiButton.vue'
import Input from '../ui/UiInput.vue'
import UiIconSelect from '../ui/UiIconSelect.vue'
import UiSelect from '../ui/UiSelect.vue'
import UiTextarea from '../ui/UiTextarea.vue'
import {
  taskPriorityIconSelectOptions,
  taskStatusIconSelectOptions,
} from './taskIconSelectOptions'

const { t } = useI18n()

const title = defineModel<string>('title', { default: '' })
const description = defineModel<string>('description', { default: '' })
const projectId = defineModel<number>('projectId', { default: 0 })
const status = defineModel<TaskStatus>('status', { default: 'todo' })
const priority = defineModel<TaskPriority>('priority', { default: 'medium' })
const sectionId = defineModel<number | null>('sectionId', { default: null })
const assigneeId = defineModel<number>('assigneeId', { default: 0 })

const props = withDefaults(
  defineProps<{
    projects?: { id: number; name: string }[]
    sections?: ProjectSection[]
    assignableUsers?: AssignableUserOption[]
    loading?: boolean
    submitLabel?: string
    /** Hide project picker (e.g. creating a task from project page) */
    hideProjectSelect?: boolean
    /** id атрибута `<form>` — для кнопок в футере модалки (`form="..."`) */
    formId?: string
    /** Скрыть ряд кнопок (когда действия в `#footer` модалки) */
    hideFooter?: boolean
  }>(),
  {
    projects: () => [],
    sections: () => [],
    assignableUsers: () => [],
    hideProjectSelect: false,
    hideFooter: false,
  },
)

const emit = defineEmits<{
  submit: []
  cancel: []
  /** При смене проекта — подгрузить секции (как в NoteForm). */
  projectPicked: [projectId: number]
}>()

const statusOptions = computed(() => taskStatusIconSelectOptions(t))

const priorityOptions = computed(() => taskPriorityIconSelectOptions(t))

const projectSelectStr = computed({
  get: () => (projectId.value <= 0 ? '' : String(projectId.value)),
  set: (v: string) => {
    projectId.value = v === '' ? 0 : Number(v)
  },
})

const projectSelectOptions = computed(() =>
  props.projects.map(p => ({ value: String(p.id), label: p.name })),
)

const sectionChoiceStr = computed({
  get: () => (sectionId.value == null ? '' : String(sectionId.value)),
  set: (v: string) => {
    sectionId.value = v === '' ? null : Number(v)
  },
})

const sectionOptions = computed(() => {
  const base = [{ value: '', label: t('notes.section.none') }]
  const rest = [...props.sections]
    .sort((a, b) => a.position - b.position || a.id - b.id)
    .map(s => ({ value: String(s.id), label: s.name }))
  return [...base, ...rest]
})

const assigneeSelectStr = computed({
  get: () => (assigneeId.value <= 0 ? '0' : String(assigneeId.value)),
  set: (v: string) => {
    assigneeId.value = v === '' || v === '0' ? 0 : Number(v)
  },
})

const assigneeOptions = computed(() => [
  { value: '0', label: t('common.unassigned') },
  ...props.assignableUsers.map(u => ({
    value: String(u.id),
    label: u.name || u.email,
  })),
])

const statusMenuLabel = computed(
  () =>
    statusOptions.value.find((o) => o.value === status.value)?.label ??
    t('taskForm.fallbacks.status'),
)
const priorityMenuLabel = computed(
  () =>
    priorityOptions.value.find((o) => o.value === priority.value)?.label ??
    t('taskForm.fallbacks.priority'),
)

const showExtraBlock = computed(
  () => !props.hideProjectSelect || props.sections.length > 0,
)

const extraOpen = ref(true)

watch(
  () => projectId.value,
  (pid, oldPid) => {
    if (props.hideProjectSelect || !props.projects.length) return
    if (!Number.isFinite(pid) || pid <= 0) return
    if (oldPid !== undefined && oldPid > 0 && pid !== oldPid) {
      sectionId.value = null
      assigneeId.value = 0
    }
    emit('projectPicked', pid)
  },
)
</script>

<template>
  <form
    :id="formId"
    class="space-y-4"
    @submit.prevent="emit('submit')"
  >
    <Input
      id="tf-title"
      v-model="title"
      :label="t('taskForm.labels.title')"
      required
      autofocus
    />
    <UiTextarea
      id="tf-desc"
      v-model="description"
      :label="t('taskForm.labels.description')"
      :rows="2"
      :placeholder="t('taskForm.placeholders.optional')"
    />

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="mb-1 block text-xs font-medium text-muted">{{
          t('taskForm.labels.status')
        }}</label>
        <UiIconSelect
          v-model="status"
          :aria-label="t('taskForm.aria.status', { name: statusMenuLabel })"
          :trigger-title="t('taskForm.aria.status', { name: statusMenuLabel })"
          :placeholder="t('taskForm.fallbacks.status')"
          :options="statusOptions"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-muted">{{
          t('taskForm.labels.priority')
        }}</label>
        <UiIconSelect
          v-model="priority"
          :aria-label="
            t('taskForm.aria.priority', { name: priorityMenuLabel })
          "
          :trigger-title="
            t('taskForm.aria.priority', { name: priorityMenuLabel })
          "
          :placeholder="t('taskForm.fallbacks.priority')"
          :options="priorityOptions"
        />
      </div>
    </div>

    <div v-if="assignableUsers.length > 0">
      <label class="mb-1 block text-xs font-medium text-muted" for="tf-assignee">{{
        t('taskForm.labels.assignee')
      }}</label>
      <UiSelect
        id="tf-assignee"
        v-model="assigneeSelectStr"
        :options="assigneeOptions"
        :disabled="loading"
      />
    </div>

    <slot name="before-extra" />

    <div v-if="showExtraBlock" class="mt-6">
      <button
        type="button"
        class="flex w-full items-center gap-2 text-xs font-medium text-muted transition-colors hover:text-foreground"
        @click="extraOpen = !extraOpen"
      >
        <span class="flex shrink-0 items-center gap-1">
          <ChevronDownIcon
            class="h-3.5 w-3.5 shrink-0 transition-transform duration-150"
            :class="extraOpen ? 'rotate-180' : ''"
          />
          {{ t('common.additional') }}
        </span>
        <span class="h-px flex-1 bg-border" />
      </button>
      <div v-show="extraOpen" class="mt-3 space-y-3">
        <div
          class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
        >
          <div v-if="!hideProjectSelect" class="min-w-0">
            <label class="mb-1 block text-xs font-medium text-muted" for="tf-project">{{
              t('taskForm.labels.project')
            }}</label>
            <UiSelect
              id="tf-project"
              v-model="projectSelectStr"
              :options="projectSelectOptions"
              :disabled="loading"
            />
          </div>
          <div class="min-w-0" :class="hideProjectSelect ? 'sm:col-span-2' : ''">
            <label class="mb-1 block text-xs font-medium text-muted" for="tf-section">{{
              t('taskForm.labels.section')
            }}</label>
            <UiSelect
              id="tf-section"
              v-model="sectionChoiceStr"
              :options="sectionOptions"
              :disabled="loading"
            />
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="!hideFooter"
      class="flex flex-wrap items-center gap-2"
    >
      <slot name="actions-start" />
      <div class="ml-auto flex flex-wrap gap-2">
        <Button type="button" variant="ghost" @click="emit('cancel')">
          {{ t('taskForm.cancel') }}
        </Button>
        <Button type="submit" :loading="loading">{{
          submitLabel ?? t('taskForm.createDefault')
        }}</Button>
      </div>
    </div>
  </form>
</template>
