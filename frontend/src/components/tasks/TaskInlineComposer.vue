<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from '../ui/UiButton.vue'
import { useTaskStore } from '../../stores/task.store'
import { useToast } from '../../composables/useToast'

const props = withDefaults(
  defineProps<{
    /** When set, tasks are created in this project only (no project select). */
    projectId?: number
    /** Required when `projectId` is not set: options for the project dropdown. */
    projects?: { id: number; name: string }[]
    disabled?: boolean
    /** No outer border/shadow — use inside TaskList panel. */
    variant?: 'card' | 'plain'
  }>(),
  { variant: 'card' },
)

const emit = defineEmits<{
  created: []
}>()

const taskStore = useTaskStore()
const toast = useToast()

const title = ref('')
const selectedProjectId = ref<number>(0)
const saving = ref(false)

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

async function submit() {
  const t = title.value.trim()
  if (!t) {
    toast.error('Enter a task title')
    return
  }
  const pid = Math.trunc(Number(effectiveProjectId.value))
  if (!pid) {
    toast.error('Select a project')
    return
  }
  saving.value = true
  try {
    await taskStore.create({
      title: t,
      description: '',
      project_id: pid,
      status: 'todo',
      priority: 'medium',
    })
    title.value = ''
    emit('created')
    toast.success('Task created')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : 'Could not create task')
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
      'flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3',
      variant === 'card' &&
        'rounded-lg border border-border bg-surface p-3 shadow-sm',
      variant === 'plain' && 'py-1',
    ]"
  >
    <div v-if="needsProjectSelect" class="shrink-0 sm:min-w-[10rem]">
      <label class="sr-only" for="inline-task-project">Project</label>
      <select
        id="inline-task-project"
        v-model.number="selectedProjectId"
        class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :disabled="disabled || saving"
      >
        <option v-for="p in projects" :key="p.id" :value="p.id">
          {{ p.name }}
        </option>
      </select>
    </div>
    <div class="min-w-0 flex-1">
      <label class="sr-only" for="inline-task-title">Task title</label>
      <input
        id="inline-task-title"
        v-model="title"
        type="text"
        class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="New task title…"
        :disabled="disabled || saving"
        @keydown="onKeydown"
      />
    </div>
    <Button
      type="button"
      class="shrink-0"
      :disabled="disabled || saving"
      :loading="saving"
      @click="submit"
    >
      Add
    </Button>
  </div>
</template>
