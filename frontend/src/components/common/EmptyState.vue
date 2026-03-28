<script setup lang="ts">
import { InboxIcon } from '@heroicons/vue/24/outline'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted/40 px-6 py-12 text-center"
  >
    <div
      class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface text-muted"
      aria-hidden="true"
    >
      <InboxIcon class="h-8 w-8" aria-hidden="true" />
    </div>
    <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
    <p v-if="description" class="mt-2 max-w-sm text-sm text-muted">
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-6">
      <slot />
    </div>
  </div>
</template>
