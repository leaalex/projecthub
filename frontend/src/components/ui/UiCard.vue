<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    /** Tailwind padding classes, e.g. `p-6` (default) or `p-4 sm:p-5` */
    padding?: string
  }>(),
  { padding: 'p-6' },
)
</script>

<template>
  <div
    class="rounded-lg border border-border bg-surface shadow-sm"
    :class="padding"
  >
    <h2
      v-if="title"
      class="mb-4 text-lg font-semibold text-foreground"
    >
      {{ title }}
    </h2>
    <slot />
  </div>
</template>
