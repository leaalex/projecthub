<script setup lang="ts">
import Button from '../ui/UiButton.vue'
import Input from '../ui/UiInput.vue'
import UiTextarea from '../ui/UiTextarea.vue'
import UiSegmentedControl from '../ui/UiSegmentedControl.vue'
import type { ProjectKind } from '../../types/project'

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

const kindOptions = [
  { value: 'personal', label: 'Personal' },
  { value: 'team', label: 'Team' },
]

const emit = defineEmits<{
  submit: []
  cancel: []
}>()
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit')">
    <Input id="pf-name" v-model="name" label="Name" required autofocus />
    <UiTextarea
      id="pf-desc"
      v-model="description"
      label="Description"
      :rows="3"
    />
    <div v-if="showKindPicker" class="space-y-2">
      <div class="block text-sm font-medium text-foreground">Project type</div>
      <UiSegmentedControl
        v-model="kind"
        aria-label="Project type"
        :options="kindOptions"
      />
      <p class="text-xs text-muted">
        Personal projects are private to you. Team projects support members and
        collaboration.
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <slot name="actions-start" />
      <div class="ml-auto flex flex-wrap gap-2">
        <Button type="button" variant="ghost" @click="emit('cancel')">
          Cancel
        </Button>
        <Button type="submit" :loading="loading">
          {{ submitLabel ?? 'Save' }}
        </Button>
      </div>
    </div>
  </form>
</template>
