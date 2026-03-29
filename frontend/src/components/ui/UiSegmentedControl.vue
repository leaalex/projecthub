<script setup lang="ts">
export type UiSegmentedOption = {
  value: string
  label: string
  disabled?: boolean
}

withDefaults(
  defineProps<{
    modelValue: string
    options: UiSegmentedOption[]
    /** Accessible label for the tablist (e.g. "View mode") */
    ariaLabel?: string
  }>(),
  { ariaLabel: 'Segmented control' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div
    class="inline-flex gap-0.5 rounded-lg border border-border bg-surface-muted/50 p-0.5"
    role="tablist"
    :aria-label="ariaLabel"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === opt.value"
      :tabindex="modelValue === opt.value ? 0 : -1"
      :disabled="opt.disabled"
      class="inline-flex h-8 min-h-8 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      :class="
        modelValue === opt.value
          ? 'bg-surface text-foreground'
          : 'text-muted hover:text-foreground'
      "
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
