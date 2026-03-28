<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'line' | 'card' | 'avatar'
    /** Only for variant line */
    lines?: number
  }>(),
  { variant: 'line', lines: 1 },
)
</script>

<template>
  <div v-if="variant === 'line'" class="space-y-2">
    <div
      v-for="n in lines"
      :key="n"
      class="h-4 animate-pulse rounded-md bg-surface-muted"
      :class="n === lines ? 'max-w-[60%]' : 'w-full'"
    />
  </div>
  <div
    v-else-if="variant === 'card'"
    class="animate-pulse rounded-lg border border-border bg-surface p-4 shadow-sm"
  >
    <div class="mb-3 h-3 w-1/3 rounded-md bg-surface-muted" />
    <div class="h-6 w-1/2 rounded-md bg-surface-muted" />
    <div class="mt-3 h-3 w-full rounded-md bg-surface-muted" />
  </div>
  <div
    v-else
    class="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-muted"
    aria-hidden="true"
  />
</template>
