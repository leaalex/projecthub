<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Task } from '@domain/task/types'
import type { AssignableUserOption } from '@domain/project/membership'
import type { TaskTransfer } from '@domain/project/types'
import Badge from '../ui/UiBadge.vue'
import Button from '../ui/UiButton.vue'
import Modal from '../ui/UiModal.vue'
import UiSelect from '../ui/UiSelect.vue'
import type { UiSelectOption } from '../ui/UiSelect.vue'

const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  projectId: number
  memberId: number
  memberName: string
  tasks: Task[]
  availableAssignees: AssignableUserOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  apply: [transfers: TaskTransfer[]]
  cancel: []
}>()

// Map of task_id -> new assignee_id
const transfers = ref<Record<number, number>>({})
const validationErrors = ref<Record<number, string>>({})

const assigneeOptions = computed<UiSelectOption<number>[]>(() =>
  props.availableAssignees
    .filter((u) => u.id !== props.memberId) // Can't assign to the member being removed
    .map((u) => ({
      value: u.id,
      label: u.name || u.email,
    })),
)

const pendingCount = computed(() => {
  return props.tasks.filter((task) => !transfers.value[task.id]).length
})

const validCount = computed(() => {
  return props.tasks.filter((task) => transfers.value[task.id] && transfers.value[task.id] !== props.memberId).length
})

const allValid = computed(() => validCount.value === props.tasks.length)

const progressText = computed(() => `${validCount.value}/${props.tasks.length}`)

function validateTransfer(assigneeId: number | undefined): string | undefined {
  if (!assigneeId) {
    return t('manualTaskTransfer.validation.required')
  }
  if (assigneeId === props.memberId) {
    return t('manualTaskTransfer.validation.cannotAssignRemoved')
  }
  const isValidAssignee = props.availableAssignees.some((u) => u.id === assigneeId)
  if (!isValidAssignee) {
    return t('manualTaskTransfer.validation.invalidAssignee')
  }
  return undefined
}

function onAssigneeChange(taskId: number, raw: string | number | null | undefined) {
  const value = raw == null || raw === '' ? undefined : Number(raw)
  if (!value || !Number.isFinite(value)) {
    delete transfers.value[taskId]
    validationErrors.value[taskId] = t(
      'manualTaskTransfer.validation.required',
    )
    return
  }
  transfers.value[taskId] = value
  const error = validateTransfer(value)
  if (error) {
    validationErrors.value[taskId] = error
  } else {
    delete validationErrors.value[taskId]
  }
}

function isValid(taskId: number): boolean {
  return !!transfers.value[taskId] && !validationErrors.value[taskId]
}

function getValidationError(taskId: number): string | undefined {
  return validationErrors.value[taskId]
}

function onApply() {
  if (!allValid.value) return
  const transferList: TaskTransfer[] = Object.entries(transfers.value).map(([taskId, assigneeId]) => ({
    task_id: Number(taskId),
    assignee_id: assigneeId,
  }))
  emit('apply', transferList)
  emit('update:modelValue', false)
  // Reset state
  transfers.value = {}
  validationErrors.value = {}
}

function onCancel() {
  emit('cancel')
  emit('update:modelValue', false)
  // Reset state
  transfers.value = {}
  validationErrors.value = {}
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="
      t('manualTaskTransfer.title', {
        count: tasks.length,
        name: memberName,
      })
    "
    size="large"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div
        v-if="pendingCount > 0"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
      >
        <p class="font-medium">{{ t('manualTaskTransfer.banners.deletionBlocked') }}</p>
        <p>{{
          t('manualTaskTransfer.banners.pending', {
            pending: pendingCount,
            total: tasks.length,
          })
        }}</p>
      </div>
      <div
        v-else
        class="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
      >
        <p class="font-medium">{{ t('manualTaskTransfer.banners.allReassigned') }}</p>
        <p>{{ t('manualTaskTransfer.banners.canRemove', { name: memberName }) }}</p>
      </div>

      <div class="max-h-[50vh] overflow-auto md:max-h-[60vh]">
        <table class="w-full text-sm">
          <thead class="bg-surface-muted text-left">
            <tr>
              <th class="px-3 py-2 font-medium">{{ t('manualTaskTransfer.table.task') }}</th>
              <th class="px-3 py-2 font-medium">{{ t('manualTaskTransfer.table.status') }}</th>
              <th class="px-3 py-2 font-medium">{{ t('manualTaskTransfer.table.newAssignee') }}</th>
              <th class="px-3 py-2 font-medium text-center">{{ t('manualTaskTransfer.table.valid') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="task in tasks" :key="task.id" class="hover:bg-surface-muted/50">
              <td class="px-3 py-2">
                <div class="font-medium">{{ task.title }}</div>
                <div v-if="task.description" class="text-xs text-muted line-clamp-1">
                  {{ task.description }}
                </div>
              </td>
              <td class="px-3 py-2">
                <Badge kind="status" :value="task.status" />
              </td>
              <td class="px-3 py-2">
                <UiSelect
                  :model-value="transfers[task.id]"
                  :options="assigneeOptions"
                  :placeholder="t('manualTaskTransfer.placeholderAssignee')"
                  :error="getValidationError(task.id)"
                  @update:model-value="onAssigneeChange(task.id, $event as string | number | null | undefined)"
                />
              </td>
              <td class="px-3 py-2 text-center">
                <span v-if="isValid(task.id)" class="text-emerald-600 font-medium">✓</span>
                <span v-else class="text-red-600 text-xs">{{
                  t('manualTaskTransfer.validation.required')
                }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-muted">
          {{ t('manualTaskTransfer.progress') }}
          <span class="font-medium" :class="allValid ? 'text-emerald-600' : 'text-amber-600'">{{ progressText }}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="secondary" @click="onCancel">{{
            t('manualTaskTransfer.cancel')
          }}</Button>
          <Button :disabled="!allValid" @click="onApply">
            {{ t('manualTaskTransfer.apply') }}
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
