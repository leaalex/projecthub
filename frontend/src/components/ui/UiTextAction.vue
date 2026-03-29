<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()
</script>

<template>
  <button
    type="button"
    class="inline-flex h-8 min-h-8 items-center text-xs text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
