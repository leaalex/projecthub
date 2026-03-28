<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '../ui/UiModal.vue'
import Button from '../ui/UiButton.vue'
import Skeleton from '../ui/UiSkeleton.vue'
import TaskForm from './TaskForm.vue'
import { useTaskStore } from '../../stores/task.store'
import { useCanEditTask } from '../../composables/useCanEditTask'
import { useConfirm } from '../../composables/useConfirm'
import { useToast } from '../../composables/useToast'
import type { Task, TaskPriority, TaskStatus } from '../../types/task'
import { formatDate, formatTaskStatus } from '../../utils/formatters'

const props = defineProps<{
  modelValue: boolean
  taskId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const taskStore = useTaskStore()
const toast = useToast()
const { confirm } = useConfirm()

const task = ref<Task | null>(null)
const loading = ref(false)
const loadError = ref<string | null>(null)
const saving = ref(false)
const removing = ref(false)

const formTitle = ref('')
const formDescription = ref('')
const formProjectId = ref(0)
const formStatus = ref<TaskStatus>('todo')
const formPriority = ref<TaskPriority>('medium')

const canEdit = useCanEditTask(() => task.value)

watch(
  () => [props.modelValue, props.taskId] as const,
  async ([open, id]) => {
    if (!open || id == null) {
      task.value = null
      loadError.value = null
      return
    }
    loading.value = true
    loadError.value = null
    task.value = null
    try {
      task.value = await taskStore.fetchOne(id)
    } catch {
      loadError.value = 'Could not load task.'
    } finally {
      loading.value = false
    }
  },
)

watch(
  () => [task.value, canEdit.value] as const,
  ([t, edit]) => {
    if (!t || !edit) return
    formTitle.value = t.title
    formDescription.value = t.description ?? ''
    formProjectId.value = t.project_id
    formStatus.value = t.status
    formPriority.value = t.priority
  },
  { immediate: true },
)

async function save() {
  const t = task.value
  if (!t) return
  const title = formTitle.value.trim()
  if (!title) {
    toast.error('Enter a task title')
    return
  }
  saving.value = true
  try {
    const updated = await taskStore.update(t.id, {
      title,
      description: formDescription.value.trim(),
      status: formStatus.value,
      priority: formPriority.value,
    })
    task.value = updated
    toast.success('Task updated')
    emit('saved')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(typeof msg === 'string' ? msg : 'Could not update task')
  } finally {
    saving.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}

async function removeTask() {
  const t = task.value
  if (!t) return
  const ok = await confirm({
    title: 'Delete task',
    message: `Remove “${t.title}”? This cannot be undone.`,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  removing.value = true
  try {
    await taskStore.remove(t.id)
    toast.success('Task deleted')
    close()
    emit('saved')
  } catch {
    toast.error('Could not delete task')
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    title="Task details"
    wide
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="loading" class="space-y-3">
      <Skeleton variant="line" />
      <Skeleton variant="line" :lines="3" />
    </div>
    <p v-else-if="loadError" class="text-sm text-destructive">{{ loadError }}</p>
    <template v-else-if="task">
      <dl
        v-if="!canEdit"
        class="space-y-4 text-sm"
      >
        <div>
          <dt class="font-medium text-muted">Title</dt>
          <dd class="mt-1 text-foreground">{{ task.title }}</dd>
        </div>
        <div>
          <dt class="font-medium text-muted">Description</dt>
          <dd class="mt-1 whitespace-pre-wrap text-foreground">
            {{ task.description || '—' }}
          </dd>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="font-medium text-muted">Status</dt>
            <dd class="mt-1 capitalize text-foreground">
              {{ formatTaskStatus(task.status) }}
            </dd>
          </div>
          <div>
            <dt class="font-medium text-muted">Priority</dt>
            <dd class="mt-1 capitalize text-foreground">{{ task.priority }}</dd>
          </div>
        </div>
        <div>
          <dt class="font-medium text-muted">Project</dt>
          <dd class="mt-1 text-foreground">
            {{ task.project?.name ?? `Project #${task.project_id}` }}
          </dd>
        </div>
        <div>
          <dt class="font-medium text-muted">Assignee</dt>
          <dd class="mt-1 text-foreground">
            <template v-if="task.assignee">
              {{ task.assignee.name || task.assignee.email }}
              <span class="text-muted">({{ task.assignee.email }})</span>
            </template>
            <template v-else>Unassigned</template>
          </dd>
        </div>
        <div>
          <dt class="font-medium text-muted">Due date</dt>
          <dd class="mt-1 text-foreground">
            {{ task.due_date ? formatDate(task.due_date) : '—' }}
          </dd>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="font-medium text-muted">Created</dt>
            <dd class="mt-1 text-foreground">{{ formatDate(task.created_at) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-muted">Updated</dt>
            <dd class="mt-1 text-foreground">{{ formatDate(task.updated_at) }}</dd>
          </div>
        </div>
      </dl>

      <div v-else class="space-y-4">
        <div class="rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-sm">
          <div class="text-muted">Project</div>
          <div class="font-medium text-foreground">
            {{ task.project?.name ?? `Project #${task.project_id}` }}
          </div>
          <div class="mt-2 text-muted">Assignee</div>
          <div class="text-foreground">
            <template v-if="task.assignee">
              {{ task.assignee.name || task.assignee.email }}
              <span class="text-muted">({{ task.assignee.email }})</span>
            </template>
            <template v-else>Unassigned</template>
          </div>
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>Created {{ formatDate(task.created_at) }}</span>
            <span>Updated {{ formatDate(task.updated_at) }}</span>
            <span v-if="task.due_date">Due {{ formatDate(task.due_date) }}</span>
          </div>
        </div>

        <TaskForm
          v-model:title="formTitle"
          v-model:description="formDescription"
          v-model:project-id="formProjectId"
          v-model:status="formStatus"
          v-model:priority="formPriority"
          hide-project-select
          submit-label="Save"
          :loading="saving"
          @submit="save"
          @cancel="close"
        />
        <div class="flex justify-end border-t border-border pt-4">
          <Button
            variant="danger"
            type="button"
            :loading="removing"
            :disabled="saving"
            @click="removeTask"
          >
            Delete task
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
