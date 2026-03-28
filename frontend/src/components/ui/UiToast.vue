<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useToastStore } from '../../stores/toast.store'

const toast = useToastStore()
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed right-4 top-4 z-[100] flex max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in toast.items"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-lg"
          :class="{
            'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40':
              t.type === 'success',
            'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40':
              t.type === 'error',
            'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40':
              t.type === 'info',
          }"
        >
          <p class="flex-1 text-sm text-foreground">{{ t.message }}</p>
          <button
            type="button"
            class="shrink-0 rounded p-0.5 text-muted hover:bg-surface-muted hover:text-foreground"
            aria-label="Dismiss"
            @click="toast.dismiss(t.id)"
          >
            <XMarkIcon class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.toast-move {
  transition: transform 0.2s ease;
}
</style>
