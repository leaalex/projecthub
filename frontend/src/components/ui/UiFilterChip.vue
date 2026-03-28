<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string[]
  value: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const checked = computed(() => props.modelValue.includes(props.value))

function onChange(e: Event) {
  const on = (e.target as HTMLInputElement).checked
  const v = props.value
  const next = on
    ? [...props.modelValue, v]
    : props.modelValue.filter((x) => x !== v)
  emit('update:modelValue', next)
}
</script>

<template>
  <label
    class="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 text-xs transition-colors"
    :class="
      checked
        ? 'border-primary bg-primary/10 text-primary'
        : 'text-muted'
    "
  >
    <input
      type="checkbox"
      class="rounded border-border text-primary focus:ring-ring"
      :checked="checked"
      @change="onChange"
    />
    <span><slot /></span>
  </label>
</template>
