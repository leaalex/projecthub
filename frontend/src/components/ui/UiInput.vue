<script setup lang="ts">
import { ref } from 'vue'

defineOptions({ inheritAttrs: false })

defineProps<{
  modelValue: string | number
  id?: string
  type?: string
  label?: string
  placeholder?: string
  autocomplete?: string
  required?: boolean
  disabled?: boolean
  error?: string
  autofocus?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
})
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="id"
      class="mb-1 block text-xs font-medium text-foreground"
      >{{ label }}</label
    >
    <input
      ref="inputRef"
      :id="id"
      v-bind="$attrs"
      :type="type ?? 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      :disabled="disabled"
      :autofocus="autofocus"
      class="box-border h-8 min-h-8 w-full rounded-md border border-border bg-surface px-3 text-xs leading-none text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="mt-1 text-sm text-destructive">{{ error }}</p>
  </div>
</template>
