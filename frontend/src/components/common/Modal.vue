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
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
          @click="close"
        />
        <div
          ref="panelRef"
          class="relative z-10 max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg border border-border bg-surface p-6 shadow-lg"
          @keydown="onPanelKeydown"
        >
          <div class="mb-4 flex items-start justify-between gap-4">
            <h2 v-if="title" class="text-lg font-semibold text-foreground">
              {{ title }}
            </h2>
            <button
              type="button"
              class="rounded p-1 text-muted hover:bg-surface-muted hover:text-foreground"
              aria-label="Close"
              @click="close"
            >
              <XMarkIcon class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <slot />
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
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  opacity: 0;
  transform: scale(0.96);
}
</style>
