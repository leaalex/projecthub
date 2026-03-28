<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number[]
  value: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
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
    class="flex min-h-8 cursor-pointer items-center gap-2 text-xs leading-normal"
  >
    <input
      type="checkbox"
      class="rounded border-border text-primary focus:ring-ring"
      :checked="checked"
      @change="onChange"
    />
    <span class="min-w-0 flex-1 truncate"><slot /></span>
  </label>
</template>
