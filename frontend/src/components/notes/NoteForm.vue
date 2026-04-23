<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import type { Note } from '@domain/note/types'
import type { ProjectSection } from '@domain/project/types'
import Button from '../ui/UiButton.vue'
import UiInput from '../ui/UiInput.vue'
import UiSelect from '../ui/UiSelect.vue'
import NoteMarkdownEditor from './NoteMarkdownEditor.vue'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    sections: ProjectSection[]
    /** Если задано — показать выбор проекта (глобальное создание заметки). */
    projects?: { id: number; name: string }[]
    /** Предвыбранный проект при открытии формы (id в виде строки для UiSelect). */
    defaultProjectId?: number | null
    initial?: Note | null
    /** Для создания: предвыбранная секция (например из заголовка колонки). */
    defaultSectionId?: number | null
    loading?: boolean
    submitLabel: string
    formId?: string
    hideFooter?: boolean
  }>(),
  {
    initial: null,
    defaultSectionId: null,
    defaultProjectId: null,
    loading: false,
    projects: () => [],
    hideFooter: false,
  },
)

const title = defineModel<string>('title', { default: '' })
const body = defineModel<string>('body', { default: '' })
const sectionId = defineModel<number | null>('sectionId', { default: null })

const emit = defineEmits<{
  submit: [
    payload: {
      title: string
      body: string
      section_id: number | null
      project_id?: number
    },
  ]
  /** При смене проекта в форме глобального создания — подгрузить секции. */
  projectPicked: [projectId: number]
  cancel: []
}>()

const projectChoice = ref<string>('')
const extraOpen = ref(true)

const sectionChoiceStr = computed({
  get: () => (sectionId.value == null ? '' : String(sectionId.value)),
  set: (v: string) => {
    sectionId.value = v === '' ? null : Number(v)
  },
})

const sectionOptions = computed(() => {
  const base = [{ value: '', label: t('notes.section.none') }]
  const rest = [...props.sections]
    .sort((a, b) => a.position - b.position || a.id - b.id)
    .map(s => ({ value: String(s.id), label: s.name }))
  return [...base, ...rest]
})

const projectOptions = computed(() =>
  [...props.projects].map(p => ({ value: String(p.id), label: p.name })),
)

watch(
  projectChoice,
  v => {
    if (!props.projects.length || props.initial) return
    const pid = Number(v)
    if (Number.isFinite(pid) && pid > 0) emit('projectPicked', pid)
  },
  { immediate: true },
)

watch(
  () => [props.initial, props.defaultSectionId, props.defaultProjectId] as const,
  ([n, defSid, defPid]) => {
    if (n) {
      // Редактирование: родитель (напр. NoteDetailModal) задаёт v-model до монтирования формы.
      return
    } else {
      title.value = ''
      body.value = ''
      sectionId.value =
        defSid != null && Number.isFinite(defSid) ? defSid : null
      if (props.projects.length > 0) {
        if (defPid != null && Number.isFinite(defPid) && defPid > 0) {
          projectChoice.value = String(defPid)
        } else {
          projectChoice.value = String(props.projects[0]!.id)
        }
      } else {
        projectChoice.value = ''
      }
    }
  },
  { immediate: true },
)

function onSubmit() {
  const trimmed = title.value.trim()
  if (!trimmed) return
  const sid = sectionId.value
  const base = {
    title: trimmed,
    body: body.value.trim(),
    section_id:
      sid != null && Number.isFinite(sid) ? sid : null,
  }
  if (props.projects.length > 0) {
    const pid = Number(projectChoice.value)
    if (!Number.isFinite(pid) || pid <= 0) return
    emit('submit', { ...base, project_id: pid })
    return
  }
  emit('submit', base)
}
</script>

<template>
  <form
    :id="formId"
    class="space-y-4"
    @submit.prevent="onSubmit"
  >
    <div>
      <label class="mb-1 block text-xs font-medium text-muted" for="note-form-title">{{
        t('notes.form.title')
      }}</label>
      <UiInput
        id="note-form-title"
        v-model="title"
        :placeholder="t('notes.form.titlePlaceholder')"
        :disabled="loading"
      />
    </div>
    <div>
      <div class="mb-1 text-xs font-medium text-muted">{{ t('notes.form.body') }}</div>
      <NoteMarkdownEditor
        v-model="body"
        :disabled="loading"
        :placeholder="t('notes.form.bodyPlaceholder')"
      />
    </div>

    <div class="mt-6">
      <button
        type="button"
        class="flex w-full items-center gap-2 text-xs font-medium text-muted transition-colors hover:text-foreground"
        @click="extraOpen = !extraOpen"
      >
        <span class="flex shrink-0 items-center gap-1">
          <ChevronDownIcon
            class="h-3.5 w-3.5 shrink-0 transition-transform duration-150"
            :class="extraOpen ? 'rotate-180' : ''"
          />
          {{ t('common.additional') }}
        </span>
        <span class="h-px flex-1 bg-border" />
      </button>
      <div v-show="extraOpen" class="mt-3 space-y-3">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div v-if="projects.length" class="min-w-0">
            <label class="mb-1 block text-xs font-medium text-muted" for="note-form-project">{{
              t('notes.form.project')
            }}</label>
            <UiSelect
              id="note-form-project"
              v-model="projectChoice"
              :options="projectOptions"
              :disabled="loading"
            />
          </div>
          <div class="min-w-0" :class="projects.length ? '' : 'sm:col-span-2'">
            <label class="mb-1 block text-xs font-medium text-muted" for="note-form-section">{{
              t('notes.form.section')
            }}</label>
            <UiSelect
              id="note-form-section"
              v-model="sectionChoiceStr"
              :options="sectionOptions"
              :disabled="loading"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!hideFooter"
      class="flex flex-wrap items-center gap-2"
    >
      <slot name="actions-start" />
      <div class="ml-auto flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" :disabled="loading" @click="emit('cancel')">
          {{ t('common.cancel') }}
        </Button>
        <Button type="submit" :loading="loading" :disabled="!title.trim()">
          {{ submitLabel }}
        </Button>
      </div>
    </div>
  </form>
</template>
