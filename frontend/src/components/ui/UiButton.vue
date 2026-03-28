<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

withDefaults(
  defineProps<{
    type?: 'button' | 'submit'
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    disabled?: boolean
    block?: boolean
    loading?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    disabled: false,
    block: false,
    loading: false,
  },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
      block ? 'w-full' : '',
      variant === 'primary' &&
        'bg-primary text-primary-foreground hover:bg-primary-hover',
      variant === 'secondary' &&
        'border border-border bg-surface text-foreground hover:bg-surface-muted',
      variant === 'ghost' && 'text-foreground hover:bg-surface-muted',
      variant === 'danger' &&
        'bg-destructive text-white hover:bg-destructive-hover',
    ]"
  >
    <ArrowPathIcon
      v-if="loading"
      class="h-4 w-4 shrink-0 animate-spin"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
