<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()
</script>

<template>
  <button
    type="button"
    class="text-xs text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
