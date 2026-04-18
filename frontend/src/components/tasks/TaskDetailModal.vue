<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '../ui/UiModal.vue'
import Button from '../ui/UiButton.vue'
import Skeleton from '../ui/UiSkeleton.vue'
import TaskForm from './TaskForm.vue'
import TaskSubtasksPanel from './TaskSubtasksPanel.vue'
import { useTaskStore } from '../../stores/task.store'
import { useCanEditTask } from '../../composables/useCanEditTask'
import { useConfirm } from '../../composables/useConfirm'
import { useToast } from '../../composables/useToast'
import type { Task, TaskPriority, TaskStatus } from '../../types/task'
import { formatDate } from '../../utils/formatters'
import { taskPriorityLabel, taskStatusLabel } from '../../utils/taskEnumLabels'

const { t, locale } = useI18n()

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
      loadError.value = t('taskDetailModal.loadError')
    } finally {
      loading.value = false
    }
  },
)

watch(
  () => [task.value, canEdit.value] as const,
  ([cur, edit]) => {
    if (!cur || !edit) return
    formTitle.value = cur.title
    formDescription.value = cur.description ?? ''
    formProjectId.value = cur.project_id
    formStatus.value = cur.status
    formPriority.value = cur.priority
  },
  { immediate: true },
)

async function save() {
  const cur = task.value
  if (!cur) return
  const trimmedTitle = formTitle.value.trim()
  if (!trimmedTitle) {
    toast.error(t('taskDetailModal.toasts.enterTitle'))
    return
  }
  saving.value = true
  try {
    const updated = await taskStore.update(cur.id, {
      title: trimmedTitle,
      description: formDescription.value.trim(),
      status: formStatus.value,
      priority: formPriority.value,
    })
    task.value = updated
    toast.success(t('taskDetailModal.toasts.updated'))
    emit('saved')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    const msg = err.response?.data?.error
    toast.error(
      typeof msg === 'string' ? msg : t('taskDetailModal.toasts.updateFailed'),
    )
  } finally {
    saving.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}

async function refreshTask() {
  const id = props.taskId
  if (id == null || !task.value) return
  try {
    task.value = await taskStore.fetchOne(id)
  } catch {
    /* keep existing task */
  }
}

async function removeTask() {
  const cur = task.value
  if (!cur) return
  const ok = await confirm({
    title: t('taskCard.confirm.deleteTitle'),
    message: t('taskCard.confirm.deleteMessage', { title: cur.title }),
    confirmLabel: t('taskCard.confirm.deleteConfirm'),
    danger: true,
  })
  if (!ok) return
  removing.value = true
  try {
    await taskStore.remove(cur.id)
    toast.success(t('taskDetailModal.toasts.deleted'))
    close()
    emit('saved')
  } catch {
    toast.error(t('taskDetailModal.toasts.deleteFailed'))
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="t('taskDetailModal.title')"
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
          <dt class="font-medium text-muted">{{ t('taskDetailModal.labels.title') }}</dt>
          <dd class="mt-1 text-foreground">{{ task.title }}</dd>
        </div>
        <div>
          <dt class="font-medium text-muted">{{
            t('taskDetailModal.labels.description')
          }}</dt>
          <dd class="mt-1 whitespace-pre-wrap text-foreground">
            {{ task.description || t('common.dash') }}
          </dd>
        </div>
        <div>
          <dt class="font-medium text-muted">{{
            t('taskDetailModal.labels.subtasks')
          }}</dt>
          <dd class="mt-1">
            <TaskSubtasksPanel :task="task" hide-heading readonly />
          </dd>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="font-medium text-muted">{{ t('taskDetailModal.labels.status') }}</dt>
            <dd class="mt-1 text-foreground">
              {{ taskStatusLabel(t, task.status) }}
            </dd>
          </div>
          <div>
            <dt class="font-medium text-muted">{{
              t('taskDetailModal.labels.priority')
            }}</dt>
            <dd class="mt-1 text-foreground">{{
              taskPriorityLabel(t, task.priority)
            }}</dd>
          </div>
        </div>
        <div>
          <dt class="font-medium text-muted">{{ t('taskDetailModal.labels.project') }}</dt>
          <dd class="mt-1 text-foreground">
            {{
              task.project?.name ??
              t('taskCard.meta.projectNum', { n: task.project_id })
            }}
          </dd>
        </div>
        <div>
          <dt class="font-medium text-muted">{{
            t('taskDetailModal.labels.assignee')
          }}</dt>
          <dd class="mt-1 text-foreground">
            <template v-if="task.assignee">
              {{ task.assignee.name || task.assignee.email }}
              <span class="text-muted">({{ task.assignee.email }})</span>
            </template>
            <template v-else>{{ t('common.unassigned') }}</template>
          </dd>
        </div>
        <div>
          <dt class="font-medium text-muted">{{
            t('taskDetailModal.labels.dueDate')
          }}</dt>
          <dd class="mt-1 text-foreground">
            {{ task.due_date ? formatDate(task.due_date, locale) : t('common.dash') }}
          </dd>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="font-medium text-muted">{{
              t('taskDetailModal.labels.created')
            }}</dt>
            <dd class="mt-1 text-foreground">{{ formatDate(task.created_at, locale) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-muted">{{
              t('taskDetailModal.labels.updated')
            }}</dt>
            <dd class="mt-1 text-foreground">{{ formatDate(task.updated_at, locale) }}</dd>
          </div>
        </div>
      </dl>

      <div v-else class="space-y-4">
        <div class="rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-sm">
          <div class="text-muted">{{ t('taskDetailModal.labels.project') }}</div>
          <div class="font-medium text-foreground">
            {{
              task.project?.name ??
              t('taskCard.meta.projectNum', { n: task.project_id })
            }}
          </div>
          <div class="mt-2 text-muted">{{ t('taskDetailModal.labels.assignee') }}</div>
          <div class="text-foreground">
            <template v-if="task.assignee">
              {{ task.assignee.name || task.assignee.email }}
              <span class="text-muted">({{ task.assignee.email }})</span>
            </template>
            <template v-else>{{ t('common.unassigned') }}</template>
          </div>
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>{{
              t('taskDetailModal.meta.created', {
                date: formatDate(task.created_at, locale),
              })
            }}</span>
            <span>{{
              t('taskDetailModal.meta.updated', {
                date: formatDate(task.updated_at, locale),
              })
            }}</span>
            <span v-if="task.due_date">{{
              t('taskDetailModal.meta.due', {
                date: formatDate(task.due_date, locale),
              })
            }}</span>
          </div>
        </div>

        <TaskForm
          v-model:title="formTitle"
          v-model:description="formDescription"
          v-model:project-id="formProjectId"
          v-model:status="formStatus"
          v-model:priority="formPriority"
          hide-project-select
          :submit-label="t('common.save')"
          :loading="saving"
          @submit="save"
          @cancel="close"
        >
          <template #actions-start>
            <Button
              variant="ghost-danger"
              type="button"
              :loading="removing"
              :disabled="saving"
              @click="removeTask"
            >
              {{ t('taskDetailModal.buttons.deleteTask') }}
            </Button>
          </template>
        </TaskForm>
        <TaskSubtasksPanel :task="task" @updated="refreshTask" />
      </div>
    </template>
  </Modal>
</template>
