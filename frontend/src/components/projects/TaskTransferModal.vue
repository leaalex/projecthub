<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AssignableUserOption } from '@domain/project/membership'
import type { TaskTransferMode } from '@domain/project/types'
import Button from '../ui/UiButton.vue'
import Modal from '../ui/UiModal.vue'
import UiSelect from '../ui/UiSelect.vue'
import type { UiSelectOption } from '../ui/UiSelect.vue'

const { t } = useI18n()

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

const modeOptions = computed<UiSelectOption<TaskTransferMode>[]>(() => [
  { value: 'unassigned', label: t('taskTransferModal.mode.unassigned') },
  { value: 'single_user', label: t('taskTransferModal.mode.single_user') },
  { value: 'manual', label: t('taskTransferModal.mode.manual') },
])

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
  const count = props.taskCount
  switch (selectedMode.value) {
    case 'unassigned':
      return t('taskTransferModal.primary.unassigned', { count })
    case 'single_user':
      return t('taskTransferModal.primary.single_user', { count })
    case 'manual':
      return t('taskTransferModal.primary.manual')
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
    :title="t('taskTransferModal.title')"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <p class="font-medium">
          {{
            t('taskTransferModal.warning', { name: memberName, count: taskCount }, taskCount)
          }}
        </p>
        <p class="mt-1">{{ t('taskTransferModal.chooseHandling') }}</p>
      </div>

      <div class="space-y-3">
        <label class="mb-1 block text-xs font-medium text-foreground">{{
          t('taskTransferModal.transferMode')
        }}</label>
        <UiSelect
          v-model="selectedMode"
          :options="modeOptions"
        />
      </div>

      <div v-if="selectedMode === 'single_user'" class="space-y-3">
        <label class="mb-1 block text-xs font-medium text-foreground">{{
          t('taskTransferModal.assignAllTo')
        }}</label>
        <UiSelect
          v-model="selectedTarget"
          :options="targetOptions"
          :placeholder="t('taskTransferModal.selectTeamMember')"
        />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button variant="secondary" @click="onCancel">{{
          t('taskTransferModal.cancel')
        }}</Button>
        <Button :disabled="!canProceed" @click="onProceed">
          {{ proceedLabel }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
