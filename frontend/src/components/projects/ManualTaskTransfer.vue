<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Task } from '../../types/task'
import type { TaskTransfer } from '../../types/project'
import type { AssignableUserOption } from '../../utils/assignee'
import Badge from '../ui/UiBadge.vue'
import Button from '../ui/UiButton.vue'
import Modal from '../ui/UiModal.vue'
import UiSelect from '../ui/UiSelect.vue'
import type { UiSelectOption } from '../ui/UiSelect.vue'

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
  return props.tasks.filter((t) => !transfers.value[t.id]).length
})

const validCount = computed(() => {
  return props.tasks.filter((t) => transfers.value[t.id] && transfers.value[t.id] !== props.memberId).length
})

const allValid = computed(() => validCount.value === props.tasks.length)

const progressText = computed(() => `${validCount.value}/${props.tasks.length}`)

function validateTransfer(assigneeId: number | undefined): string | undefined {
  if (!assigneeId) {
    return 'Required'
  }
  if (assigneeId === props.memberId) {
    return 'Cannot assign to member being removed'
  }
  const isValidAssignee = props.availableAssignees.some((u) => u.id === assigneeId)
  if (!isValidAssignee) {
    return 'Invalid assignee'
  }
  return undefined
}

function onAssigneeChange(taskId: number, raw: string | number | null | undefined) {
  const value = raw == null || raw === '' ? undefined : Number(raw)
  if (!value || !Number.isFinite(value)) {
    delete transfers.value[taskId]
    validationErrors.value[taskId] = 'Required'
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
    :title="`Reassign ${tasks.length} tasks from ${memberName}`"
    size="large"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div
        v-if="pendingCount > 0"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
      >
        <p class="font-medium">Deletion blocked</p>
        <p>{{ pendingCount }} of {{ tasks.length }} tasks pending reassignment</p>
      </div>
      <div
        v-else
        class="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
      >
        <p class="font-medium">All tasks reassigned</p>
        <p>You can now remove {{ memberName }} from the project.</p>
      </div>

      <div class="max-h-[60vh] overflow-auto">
        <table class="w-full text-sm">
          <thead class="bg-surface-muted text-left">
            <tr>
              <th class="px-3 py-2 font-medium">Task</th>
              <th class="px-3 py-2 font-medium">Status</th>
              <th class="px-3 py-2 font-medium">New Assignee</th>
              <th class="px-3 py-2 font-medium text-center">Valid</th>
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
                  placeholder="Select assignee..."
                  :error="getValidationError(task.id)"
                  @update:model-value="onAssigneeChange(task.id, $event as string | number | null | undefined)"
                />
              </td>
              <td class="px-3 py-2 text-center">
                <span v-if="isValid(task.id)" class="text-emerald-600 font-medium">✓</span>
                <span v-else class="text-red-600 text-xs">Required</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-border">
        <div class="text-sm text-muted">
          Progress: <span class="font-medium" :class="allValid ? 'text-emerald-600' : 'text-amber-600'">{{ progressText }}</span>
        </div>
        <div class="flex gap-2">
          <Button variant="secondary" @click="onCancel">Cancel</Button>
          <Button :disabled="!allValid" @click="onApply">
            Apply Transfers and Remove Member
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>
