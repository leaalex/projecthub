<script setup lang="ts">
withDefaults(
  defineProps<{
    active: boolean
    /** Absolute overlay: не смещает layout; `class` задаёт `top`/`bottom` и т.д. */
    inset?: boolean
    /** Высота «ловушки»; внутренняя полоса `h-0.5`. */
    size?: 'sm' | 'md'
  }>(),
  { inset: false, size: 'md' },
)
</script>

<template>
  <div
    :class="[
      inset
        ? 'pointer-events-none absolute inset-x-0 z-10'
        : 'w-full',
      size === 'sm' ? 'h-1' : 'h-1.5',
      'flex items-center',
    ]"
    aria-hidden="true"
  >
    <div
      class="h-0.5 w-full rounded-full bg-primary transition-opacity duration-150"
      :class="[active ? 'ui-drop-slot-capsule opacity-100' : 'opacity-0']"
    />
  </div>
</template>
