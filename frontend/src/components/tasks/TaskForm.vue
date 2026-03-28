<script setup lang="ts">
import { computed } from 'vue'
import type { TaskPriority, TaskStatus } from '../../types/task'
import Button from '../ui/UiButton.vue'
import Input from '../ui/UiInput.vue'
import UiSelect from '../ui/UiSelect.vue'

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
  }>(),
  {
    projects: () => [],
    hideProjectSelect: false,
  },
)

const emit = defineEmits<{
  submit: []
  cancel: []
}>()

const statusOptions = [
  { value: 'todo' as const, label: 'To do' },
  { value: 'in_progress' as const, label: 'In progress' },
  { value: 'review' as const, label: 'Review' },
  { value: 'done' as const, label: 'Done' },
]

const priorityOptions = [
  { value: 'low' as const, label: 'Low' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'high' as const, label: 'High' },
  { value: 'critical' as const, label: 'Critical' },
]

const projectOptions = computed(() => [
  { value: 0, label: 'Select project', disabled: true },
  ...props.projects.map((p) => ({ value: p.id, label: p.name })),
])
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit')">
    <Input id="tf-title" v-model="title" label="Title" required autofocus />
    <div>
      <label class="mb-1 block text-sm font-medium text-foreground"
        >Description</label
      >
      <textarea
        id="tf-desc"
        v-model="description"
        rows="2"
        class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
    <div v-if="!hideProjectSelect">
      <UiSelect
        id="tf-project"
        v-model="projectId"
        label="Project"
        :options="projectOptions"
        placeholder="Select project"
      />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <UiSelect
        id="tf-status"
        v-model="status"
        label="Status"
        :options="statusOptions"
      />
      <UiSelect
        id="tf-priority"
        v-model="priority"
        label="Priority"
        :options="priorityOptions"
      />
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" variant="ghost" @click="emit('cancel')">
        Cancel
      </Button>
      <Button type="submit" :loading="loading">{{ submitLabel ?? 'Create' }}</Button>
    </div>
  </form>
</template>
