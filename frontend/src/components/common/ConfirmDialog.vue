<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onUnmounted, watch } from 'vue'
import { useConfirmStore } from '../../stores/confirm.store'
import Button from './Button.vue'

const store = useConfirmStore()
const { open, options } = storeToRefs(store)

function onKey(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') store.answer(false)
}

watch(
  open,
  (v) => {
    if (v) document.addEventListener('keydown', onKey)
    else document.removeEventListener('keydown', onKey)
  },
  { immediate: true },
)

onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open && options"
        class="fixed inset-0 z-[90] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
          @click="store.answer(false)"
        />
        <div
          class="relative z-10 w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg"
        >
          <h2 class="text-lg font-semibold text-foreground">{{ options.title }}</h2>
          <p class="mt-2 text-sm text-muted">{{ options.message }}</p>
          <div class="mt-6 flex justify-end gap-2">
            <Button variant="secondary" @click="store.answer(false)">
              {{ options.cancelLabel }}
            </Button>
            <Button
              :variant="options.danger ? 'danger' : 'primary'"
              @click="store.answer(true)"
            >
              {{ options.confirmLabel }}
            </Button>
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
