<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{
  modelValue: string
  id?: string
  label?: string
  placeholder?: string
  rows?: number
  required?: boolean
  disabled?: boolean
  error?: string
  autofocus?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="id"
      class="mb-1 block text-xs font-medium text-foreground"
      >{{ label }}</label
    >
    <textarea
      :id="id"
      v-bind="$attrs"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows ?? 3"
      :required="required"
      :disabled="disabled"
      :autofocus="autofocus"
      class="min-h-[4rem] w-full rounded-md border border-border bg-surface px-3 py-2 text-xs leading-snug text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="error" class="mt-1 text-sm text-destructive">{{ error }}</p>
  </div>
</template>
