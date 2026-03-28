<script setup lang="ts">
import type { TaskPriority, TaskStatus } from '../../types/task'
import Button from '../common/Button.vue'
import Input from '../common/Input.vue'

const title = defineModel<string>('title', { default: '' })
const description = defineModel<string>('description', { default: '' })
const projectId = defineModel<number>('projectId', { default: 0 })
const status = defineModel<TaskStatus>('status', { default: 'todo' })
const priority = defineModel<TaskPriority>('priority', { default: 'medium' })

withDefaults(
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
        class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
      />
    </div>
    <div v-if="!hideProjectSelect">
      <label class="mb-1 block text-sm font-medium text-foreground"
        >Project</label
      >
      <select
        v-model.number="projectId"
        required
        class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
      >
        <option :value="0" disabled>Select project</option>
        <option v-for="p in projects" :key="p.id" :value="p.id">
          {{ p.name }}
        </option>
      </select>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="mb-1 block text-sm font-medium">Status</label>
        <select
          v-model="status"
          class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium">Priority</label>
        <select
          v-model="priority"
          class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" variant="ghost" @click="emit('cancel')">
        Cancel
      </Button>
      <Button type="submit" :loading="loading">{{ submitLabel ?? 'Create' }}</Button>
    </div>
  </form>
</template>
