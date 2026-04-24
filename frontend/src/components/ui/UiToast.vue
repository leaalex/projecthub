<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useToastStore } from '@app/toast.store'
import { useI18n } from 'vue-i18n'

const toast = useToastStore()
const { t } = useI18n()

function onAction(itemId: number, run: () => void) {
  run()
  toast.dismiss(itemId)
}
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed right-4 top-4 z-[100] flex max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <div
          v-for="item in toast.items"
          :key="item.id"
          class="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3"
          :class="{
            'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40':
              item.type === 'success',
            'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40':
              item.type === 'error',
            'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40':
              item.type === 'info',
          }"
        >
          <p class="flex-1 text-sm text-foreground">{{ item.message }}</p>
          <div class="flex shrink-0 items-center gap-1">
            <button
              v-if="item.action"
              type="button"
              class="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
              @click="onAction(item.id, item.action.run)"
            >
              {{ item.action.label }}
            </button>
            <button
              type="button"
              class="rounded p-0.5 text-muted hover:bg-surface-muted hover:text-foreground"
              :aria-label="t('common.close')"
              @click="toast.dismiss(item.id)"
            >
              <XMarkIcon class="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
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
