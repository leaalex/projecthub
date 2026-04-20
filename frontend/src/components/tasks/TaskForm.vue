<script setup lang="ts">
import { FolderIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TaskPriority, TaskStatus } from '@domain/task/types'
import Button from '../ui/UiButton.vue'
import Input from '../ui/UiInput.vue'
import UiIconSelect from '../ui/UiIconSelect.vue'
import UiMenuButton from '../ui/UiMenuButton.vue'
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

const props = withDefaults(
  defineProps<{
    projects?: { id: number; name: string }[]
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
    hideProjectSelect: false,
    hideFooter: false,
  },
)

const emit = defineEmits<{
  submit: []
  cancel: []
}>()

const statusOptions = computed(() => taskStatusIconSelectOptions(t))

const priorityOptions = computed(() => taskPriorityIconSelectOptions(t))

const projectOptions = computed(() => [
  {
    value: 0,
    label: t('taskForm.placeholders.selectProject'),
    disabled: true,
  },
  ...props.projects.map((p) => ({ value: p.id, label: p.name })),
])

const projectMenuLabel = computed(
  () =>
    projectOptions.value.find((o) => o.value === projectId.value)?.label ??
    t('taskForm.fallbacks.project'),
)
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
    <div v-if="!hideProjectSelect">
      <label class="mb-1 block text-xs font-medium text-foreground">{{
        t('taskForm.labels.project')
      }}</label>
      <div class="flex min-w-0 items-center gap-2">
        <UiMenuButton
          v-model="projectId"
          :ariaLabel="t('taskForm.aria.project', { name: projectMenuLabel })"
          :title="t('taskForm.aria.project', { name: projectMenuLabel })"
          :options="projectOptions"
        >
          <FolderIcon class="h-5 w-5" aria-hidden="true" />
        </UiMenuButton>
        <span class="min-w-0 flex-1 truncate text-sm text-foreground">{{
          projectMenuLabel
        }}</span>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="mb-1 block text-xs font-medium text-foreground">{{
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
        <label class="mb-1 block text-xs font-medium text-foreground">{{
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
