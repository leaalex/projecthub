<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div>
    <div
      class="mb-2 flex items-center justify-between gap-2"
      :class="!$slots.actions && 'justify-start'"
    >
      <p class="text-xs font-medium uppercase tracking-wide text-muted">
        {{ title }}
      </p>
      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </div>
</template>
