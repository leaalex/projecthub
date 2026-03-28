<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  hint?: string
}>()
</script>

<template>
  <div
    class="rounded-lg border border-border bg-surface p-4 shadow-sm"
  >
    <p class="text-sm font-medium text-muted">{{ title }}</p>
    <p class="mt-1 text-2xl font-semibold text-foreground">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-xs text-muted">{{ hint }}</p>
  </div>
</template>
