<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '../ui/UiModal.vue'
import Button from '../ui/UiButton.vue'
import UiInput from '../ui/UiInput.vue'
import { useProjectStore } from '@app/project.store'
import { extractNoteAxiosError } from '@app/note.store'
import { useConfirm } from '@app/composables/useConfirm'
import { useToast } from '@app/composables/useToast'

const { t } = useI18n()
const toast = useToast()
const { confirm } = useConfirm()
const projectStore = useProjectStore()

const props = defineProps<{
  modelValue: boolean
  projectId: number
  sectionId: number | null
  initialName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  saved: []
  deleted: []
}>()

const nameDraft = ref('')
const saving = ref(false)
const removing = ref(false)

watch(
  () => [props.modelValue, props.sectionId, props.initialName] as const,
  ([open]) => {
    if (!open) return
    nameDraft.value = props.initialName
  },
)

function close() {
  emit('update:modelValue', false)
}

async function save() {
  const trimmed = nameDraft.value.trim()
  const sid = props.sectionId
  const pid = props.projectId
  if (!trimmed || sid == null || pid <= 0 || saving.value) return
  saving.value = true
  try {
    await projectStore.updateSection(pid, sid, trimmed)
    toast.success(t('project.section.renamed'))
    close()
    emit('saved')
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, t('project.section.renameFailed')))
  } finally {
    saving.value = false
  }
}

async function remove() {
  const sid = props.sectionId
  const pid = props.projectId
  if (sid == null || pid <= 0 || removing.value) return
  const ok = await confirm({
    title: t('project.section.confirmDeleteTitle'),
    message: t('project.section.confirmDeleteMessage', { name: props.initialName }),
    confirmLabelKey: 'project.section.confirmDeleteConfirm',
    danger: true,
  })
  if (!ok) return
  removing.value = true
  try {
    await projectStore.deleteSection(pid, sid)
    toast.success(t('project.section.removed'))
    close()
    emit('deleted')
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, t('project.section.removeFailed')))
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="t('project.section.editModalTitle')"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div>
        <label class="mb-1 block text-xs font-medium text-muted" for="section-edit-name">{{
          t('project.section.nameLabel')
        }}</label>
        <UiInput
          id="section-edit-name"
          v-model="nameDraft"
          :placeholder="t('project.section.namePlaceholder')"
          @keydown.enter.prevent="save"
        />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost-danger"
          :loading="removing"
          :disabled="saving"
          @click="remove"
        >
          {{ t('common.delete') }}
        </Button>
        <div class="ml-auto flex flex-wrap gap-2">
          <Button type="button" variant="secondary" :disabled="saving || removing" @click="close">
            {{ t('common.cancel') }}
          </Button>
          <Button type="button" :loading="saving" :disabled="removing || !nameDraft.trim()" @click="save">
            {{ t('common.save') }}
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>
