<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TaskTransferMode } from '../../types/project'
import type { AssignableUserOption } from '../../utils/assignee'
import Button from '../ui/UiButton.vue'
import Modal from '../ui/UiModal.vue'
import UiSelect from '../ui/UiSelect.vue'
import type { UiSelectOption } from '../ui/UiSelect.vue'

const props = defineProps<{
  modelValue: boolean
  memberId: number
  memberName: string
  taskCount: number
  availableAssignees: AssignableUserOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [mode: TaskTransferMode, targetUserId?: number]
  manual: []
}>()

const selectedMode = ref<TaskTransferMode>('unassigned')
const selectedTarget = ref<string>('')

const modeOptions: UiSelectOption<TaskTransferMode>[] = [
  { value: 'unassigned', label: 'Leave tasks unassigned' },
  { value: 'single_user', label: 'Assign all tasks to one user' },
  { value: 'manual', label: 'Configure per task manually' },
]

const targetOptions = computed<UiSelectOption<string>[]>(() =>
  props.availableAssignees.map((u) => ({
    value: String(u.id),
    label: u.name || u.email,
  })),
)

const canProceed = computed(() => {
  if (selectedMode.value === 'single_user') {
    return selectedTarget.value !== ''
  }
  return true
})

const proceedLabel = computed(() => {
  switch (selectedMode.value) {
    case 'unassigned':
      return `Remove member and unassign ${props.taskCount} tasks`
    case 'single_user':
      return `Remove member and transfer ${props.taskCount} tasks`
    case 'manual':
      return 'Configure task assignments'
  }
})

function onProceed() {
  if (selectedMode.value === 'manual') {
    emit('manual')
    return
  }
  const targetId = selectedMode.value === 'single_user' ? Number(selectedTarget.value) : undefined
  emit('select', selectedMode.value, targetId)
  emit('update:modelValue', false)
}

function onCancel() {
  emit('update:modelValue', false)
  // Reset state
  selectedMode.value = 'unassigned'
  selectedTarget.value = ''
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    title="Remove Project Member"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <p class="font-medium">Warning: {{ memberName }} has {{ taskCount }} assigned task(s)</p>
        <p class="mt-1">Choose how to handle these tasks before removing the member.</p>
      </div>

      <div class="space-y-3">
        <label class="block text-sm font-medium text-foreground">Transfer mode</label>
        <UiSelect
          v-model="selectedMode"
          :options="modeOptions"
        />
      </div>

      <div v-if="selectedMode === 'single_user'" class="space-y-3">
        <label class="block text-sm font-medium text-foreground">Assign all tasks to</label>
        <UiSelect
          v-model="selectedTarget"
          :options="targetOptions"
          placeholder="Select team member..."
        />
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <Button variant="secondary" @click="onCancel">Cancel</Button>
        <Button :disabled="!canProceed" @click="onProceed">
          {{ proceedLabel }}
        </Button>
      </div>
    </div>
  </Modal>
</template>
