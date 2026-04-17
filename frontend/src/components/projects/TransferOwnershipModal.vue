<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '../../composables/useToast'
import { useProjectStore } from '../../stores/project.store'
import Button from '../ui/UiButton.vue'
import Modal from '../ui/UiModal.vue'
import UiSelect from '../ui/UiSelect.vue'

const { t } = useI18n()

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
      label: `${owner.name || owner.email} (${t('transferOwnershipModal.badges.currentOwner')})`,
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
    toast.error(t('transferOwnershipModal.toasts.selectNewOwner'))
    return
  }
  transferring.value = true
  try {
    await projectStore.transferOwnership(props.projectId, nid)
    toast.success(t('transferOwnershipModal.toasts.transferred'))
    open.value = false
    emit('transferred')
  } catch {
    toast.error(t('transferOwnershipModal.toasts.transferFailed'))
  } finally {
    transferring.value = false
  }
}
</script>

<template>
  <Modal v-model="open" :title="t('transferOwnershipModal.title')" wide>
    <div class="space-y-4">
      <p class="text-sm text-muted">
        {{ t('transferOwnershipModal.body') }}
      </p>
      <UiSelect
        v-model="transferTo"
        :label="t('transferOwnershipModal.labelNewOwner')"
        :options="transferOptions"
        :placeholder="t('transferOwnershipModal.placeholderSelectUser')"
      />
      <div class="flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="open = false">
          {{ t('transferOwnershipModal.cancel') }}
        </Button>
        <Button type="button" :loading="transferring" @click="doTransfer">
          {{ t('transferOwnershipModal.transfer') }}
        </Button>
      </div>
    </div>
  </Modal>
</template>
