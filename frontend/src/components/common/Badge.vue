<script setup lang="ts">
import { computed } from 'vue'
import type { TaskPriority, TaskStatus } from '../../types/task'
import { formatTaskStatus } from '../../utils/formatters'

const props = defineProps<{
  kind: 'status' | 'priority'
  value: TaskStatus | TaskPriority
}>()

const label = computed(() => {
  if (props.kind === 'status') return formatTaskStatus(props.value as TaskStatus)
  return props.value
})

const classNames = computed(() => {
  if (props.kind === 'status') {
    const m: Record<TaskStatus, string> = {
      todo: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
      in_progress:
        'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
      review:
        'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
      done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    }
    return m[props.value as TaskStatus] ?? m.todo
  }
  const m: Record<TaskPriority, string> = {
    low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    medium: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
    critical: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  }
  return m[props.value as TaskPriority] ?? m.medium
})
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
    :class="classNames"
  >
    {{ label }}
  </span>
</template>
