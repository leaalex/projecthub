<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from '../../composables/useToast'
import { useProjectStore } from '../../stores/project.store'
import Button from '../ui/UiButton.vue'
import Modal from '../ui/UiModal.vue'
import UiSelect from '../ui/UiSelect.vue'

const props = defineProps<{
  projectId: number
}>()

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  transferred: []
}>()

const projectStore = useProjectStore()
const toast = useToast()

const transferTo = ref<string>('')
const transferring = ref(false)

const project = computed(() =>
  projectStore.current?.id === props.projectId
    ? projectStore.current
    : projectStore.projects.find((p) => p.id === props.projectId),
)

const memberRows = computed(() =>
  Array.isArray(projectStore.members) ? projectStore.members : [],
)

const transferOptions = computed(() => {
  const opts: { value: string; label: string }[] = []
  const owner = project.value?.owner
  if (owner) {
    opts.push({
      value: String(owner.id),
      label: `${owner.name || owner.email} (current owner)`,
    })
  }
  for (const m of memberRows.value) {
    opts.push({
      value: String(m.user_id),
      label: m.user.name || m.user.email,
    })
  }
  return opts
})

watch(open, (o) => {
  if (o) transferTo.value = ''
})

async function doTransfer() {
  const nid = Number(transferTo.value)
  if (!nid) {
    toast.error('Select new owner')
    return
  }
  transferring.value = true
  try {
    await projectStore.transferOwnership(props.projectId, nid)
    toast.success('Ownership transferred')
    open.value = false
    emit('transferred')
  } catch {
    toast.error('Could not transfer ownership')
  } finally {
    transferring.value = false
  }
}
</script>

<template>
  <Modal v-model="open" title="Transfer ownership" wide>
    <div class="space-y-4">
      <p class="text-sm text-muted">
        Admin only. The previous owner will be added as a manager if needed.
      </p>
      <UiSelect
        v-model="transferTo"
        label="New owner"
        :options="transferOptions"
        placeholder="Select user…"
      />
      <div class="flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="open = false">
          Cancel
        </Button>
        <Button type="button" :loading="transferring" @click="doTransfer">
          Transfer
        </Button>
      </div>
    </div>
  </Modal>
</template>
