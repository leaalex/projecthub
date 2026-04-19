<script setup lang="ts">
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNoteStore, extractNoteAxiosError } from '@app/note.store'
import { useToast } from '@app/composables/useToast'
import Button from '../ui/UiButton.vue'
import UiInput from '../ui/UiInput.vue'
import Modal from '../ui/UiModal.vue'
import NoteForm from './NoteForm.vue'
import type { NoteSection } from '@domain/note/types'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{
  projectId: number
  sections: NoteSection[]
  sectionId: number | null
  canManage: boolean
}>()

const emit = defineEmits<{
  created: []
}>()

const noteStore = useNoteStore()
const title = ref('')
const expanded = ref(false)
const formOpen = ref(false)
const saving = ref(false)

watch(
  () => props.sectionId,
  () => {
    title.value = ''
    expanded.value = false
  },
)

async function quickCreate() {
  const trimmed = title.value.trim()
  if (!trimmed || !props.canManage) return
  saving.value = true
  try {
    await noteStore.create(props.projectId, {
      title: trimmed,
      body: '',
      section_id: props.sectionId ?? undefined,
    })
    title.value = ''
    emit('created')
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, t('notes.inline.createFailed')))
  } finally {
    saving.value = false
  }
}

function onFullCreated() {
  formOpen.value = false
  emit('created')
}

async function submitFullNote(payload: {
  title: string
  body: string
  section_id: number | null
}) {
  saving.value = true
  try {
    await noteStore.create(props.projectId, {
      title: payload.title,
      body: payload.body,
      section_id: payload.section_id ?? undefined,
    })
    onFullCreated()
  } catch (e: unknown) {
    toast.error(extractNoteAxiosError(e, t('notes.inline.createFailed')))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="canManage" class="flex flex-wrap items-end gap-2 border-b border-border px-3 py-2">
    <div class="min-w-[12rem] flex-1">
      <UiInput
        v-model="title"
        :placeholder="t('notes.inline.titlePlaceholder')"
        :disabled="saving"
        @keydown.enter.prevent="quickCreate"
      />
    </div>
    <Button type="button" :loading="saving" :disabled="!title.trim()" @click="quickCreate">
      {{ t('notes.inline.add') }}
    </Button>
    <Button
      type="button"
      variant="secondary"
      :disabled="saving"
      @click="expanded = !expanded"
    >
      <ChevronDownIcon v-if="!expanded" class="h-4 w-4" />
      <ChevronUpIcon v-else class="h-4 w-4" />
      <span class="ml-1">{{ expanded ? t('notes.inline.less') : t('notes.inline.more') }}</span>
    </Button>
    <div v-if="expanded" class="basis-full text-xs text-muted">
      {{ t('notes.inline.hint') }}
      <button
        type="button"
        class="ml-1 font-medium text-primary underline"
        @click="formOpen = true"
      >
        {{ t('notes.inline.openForm') }}
      </button>
    </div>
    <Modal v-model="formOpen" :title="t('notes.create')">
      <NoteForm
        :sections="sections"
        :default-section-id="sectionId"
        :loading="saving"
        :submit-label="t('common.create')"
        @cancel="formOpen = false"
        @submit="submitFullNote"
      />
    </Modal>
  </div>
</template>
