<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '../ui/UiButton.vue'
import Input from '../ui/UiInput.vue'
import UiTextarea from '../ui/UiTextarea.vue'
import UiSegmentedControl from '../ui/UiSegmentedControl.vue'
import type { ProjectKind } from '@domain/project/types'

const name = defineModel<string>('name', { default: '' })
const description = defineModel<string>('description', { default: '' })
const kind = defineModel<ProjectKind>('kind', { default: 'personal' })

withDefaults(
  defineProps<{
    submitLabel?: string
    loading?: boolean
    /** Show personal vs team when creating (creator / staff / admin). */
    showKindPicker?: boolean
  }>(),
  { showKindPicker: false },
)

const { t } = useI18n()

const kindOptions = computed(() => [
  { value: 'personal' as const, label: t('projectForm.typePersonal') },
  { value: 'team' as const, label: t('projectForm.typeTeam') },
])

const emit = defineEmits<{
  submit: []
  cancel: []
}>()
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit')">
    <Input id="pf-name" v-model="name" :label="t('projectForm.nameLabel')" required autofocus />
    <UiTextarea
      id="pf-desc"
      v-model="description"
      :label="t('projectForm.descriptionLabel')"
      :rows="3"
    />
    <div v-if="showKindPicker" class="space-y-2">
      <div class="block text-sm font-medium text-foreground">{{ t('projectForm.typeLabel') }}</div>
      <UiSegmentedControl
        v-model="kind"
        :aria-label="t('projectForm.typeAria')"
        :options="kindOptions"
      />
      <p class="text-xs text-muted">
        {{ t('projectForm.typeHint') }}
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <slot name="actions-start" />
      <div class="ml-auto flex flex-wrap gap-2">
        <Button type="button" variant="ghost" @click="emit('cancel')">
          {{ t('projectForm.cancel') }}
        </Button>
        <Button type="submit" :loading="loading">
          {{ submitLabel ?? t('projectForm.saveDefault') }}
        </Button>
      </div>
    </div>
  </form>
</template>
