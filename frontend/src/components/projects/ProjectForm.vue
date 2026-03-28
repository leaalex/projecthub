<script setup lang="ts">
import Button from '../common/Button.vue'
import Input from '../common/Input.vue'

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
    <div>
      <label class="mb-1 block text-sm font-medium text-foreground"
        >Description</label
      >
      <textarea
        id="pf-desc"
        v-model="description"
        rows="3"
        class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
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
