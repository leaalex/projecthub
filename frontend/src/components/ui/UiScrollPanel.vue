<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Tailwind max-height utility, e.g. max-h-36 */
    maxHeightClass?: string
  }>(),
  { maxHeightClass: 'max-h-36' },
)
</script>

<template>
  <div
    class="space-y-2 overflow-y-auto rounded-md border border-border p-2"
    :class="maxHeightClass"
  >
    <slot />
  </div>
</template>
