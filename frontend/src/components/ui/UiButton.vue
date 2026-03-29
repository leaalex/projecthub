<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

withDefaults(
  defineProps<{
    type?: 'button' | 'submit'
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'ghost-danger'
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
      'box-border inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 text-xs font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
      block ? 'w-full' : '',
      variant === 'primary' &&
        'border-border/65 bg-primary text-primary-foreground hover:bg-primary-hover',
      variant === 'secondary' &&
        'border-border/65 bg-surface-muted text-foreground hover:bg-border',
      variant === 'ghost' &&
        'text-foreground hover:border-border/55 hover:bg-surface-muted',
      variant === 'danger' &&
        'border-border/65 bg-destructive text-white hover:bg-destructive-hover',
      variant === 'ghost-danger' &&
        'text-destructive hover:border-destructive/30 hover:bg-destructive/10',
    ]"
  >
    <ArrowPathIcon
      v-if="loading"
      class="h-3.5 w-3.5 shrink-0 animate-spin"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
