<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
import {
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'

const props = defineProps<{
  modelValue: boolean
  title?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const panelRef = ref<HTMLElement | null>(null)

function close() {
  emit('update:modelValue', false)
}

function onDocKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) close()
}

function getFocusable(root: HTMLElement): HTMLElement[] {
  const sel =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(root.querySelectorAll(sel)) as HTMLElement[]
}

function onPanelKeydown(e: KeyboardEvent) {
  if (e.key !== 'Tab' || !panelRef.value) return
  const list = getFocusable(panelRef.value)
  if (list.length === 0) return
  const first = list[0]
  const last = list[list.length - 1]
  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault()
      last.focus()
    }
  } else if (document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    await nextTick()
    const root = panelRef.value
    if (!root) return
    const list = getFocusable(root)
    const first = list.find((el) => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') ?? list[0]
    first?.focus()
  },
)

onMounted(() => document.addEventListener('keydown', onDocKey))
onUnmounted(() => document.removeEventListener('keydown', onDocKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex justify-end p-3 sm:p-4 md:p-5"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
          aria-hidden="true"
          @click="close"
        />
        <div
          ref="panelRef"
          class="modal-panel relative z-10 flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl ring-1 ring-foreground/5"
          @keydown="onPanelKeydown"
        >
          <div
            class="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6"
          >
            <h2 v-if="title" class="text-lg font-semibold text-foreground">
              {{ title }}
            </h2>
            <button
              type="button"
              class="ml-auto shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
              aria-label="Close"
              @click="close"
            >
              <XMarkIcon class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition:
    transform 0.25s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
