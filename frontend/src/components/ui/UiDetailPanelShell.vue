<script setup lang="ts">
import { ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useSlots } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Visible title when slot `title` is not used. */
    title?: string
    collapseAriaLabel: string
  }>(),
  { title: '' },
)

defineEmits<{
  /** Спрятать панель (в приложении — уезжает за правый край). */
  'toggle-collapsed': []
}>()

const slots = useSlots()

const showTitleRow = () =>
  Boolean(props.title || slots.title?.() || slots['header-actions']?.())
const showFooter = () => Boolean(slots.footer?.())
</script>

<template>
  <div
    class="flex h-full min-h-0 w-full max-w-xl shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface"
  >
    <div
      class="flex min-h-16 shrink-0 items-center gap-2 border-b border-border px-3 py-4 sm:px-5 sm:pl-4"
      :class="!showTitleRow() ? 'justify-end' : ''"
    >
      <button
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        :class="showTitleRow() ? '' : 'order-last'"
        :aria-label="collapseAriaLabel"
        @click="$emit('toggle-collapsed')"
      >
        <!-- Панель справа: уезжает за правый край экрана -->
        <ChevronRightIcon class="h-5 w-5" aria-hidden="true" />
      </button>
      <template v-if="showTitleRow()">
        <h2
          v-if="title && !slots.title"
          class="flex min-h-8 min-w-0 flex-1 items-center text-base font-semibold leading-snug text-foreground"
        >
          {{ title }}
        </h2>
        <div
          v-else-if="slots.title"
          class="min-w-0 flex-1"
        >
          <slot name="title" />
        </div>
        <div
          v-if="slots['header-actions']?.()"
          class="ml-auto flex min-h-8 shrink-0 flex-nowrap items-center justify-end gap-2"
        >
          <slot name="header-actions" />
        </div>
      </template>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
      <slot />
    </div>
    <div
      v-if="showFooter()"
      class="shrink-0 border-t border-border px-5 py-4 sm:px-6"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
