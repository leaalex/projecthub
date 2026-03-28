<script setup lang="ts">
import Button from '../ui/UiButton.vue'
import Input from '../ui/UiInput.vue'
import UiTextarea from '../ui/UiTextarea.vue'

const name = defineModel<string>('name', { default: '' })
const description = defineModel<string>('description', { default: '' })

defineProps<{
  submitLabel?: string
  loading?: boolean
}>()

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
    <div class="flex justify-end gap-2">
      <Button type="button" variant="ghost" @click="emit('cancel')">
        Cancel
      </Button>
      <Button type="submit" :loading="loading">
        {{ submitLabel ?? 'Save' }}
      </Button>
    </div>
  </form>
</template>
