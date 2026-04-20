<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirmStore } from '@app/confirm.store'
import Button from './UiButton.vue'

const { t } = useI18n()
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
        class="fixed inset-0 z-[90] flex items-center justify-end p-3 sm:p-4 md:p-5"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
          aria-hidden="true"
          @click="store.answer(false)"
        />
        <div
          class="modal-panel relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-surface"
        >
          <div class="flex min-h-16 shrink-0 items-center border-b border-border px-5 py-4 sm:px-6">
            <h2
              class="flex min-h-8 min-w-0 flex-1 items-center text-base font-semibold leading-snug text-foreground"
            >
              {{ options.title }}
            </h2>
          </div>
          <div class="px-5 py-4 sm:px-6 sm:py-5">
            <p class="text-sm text-muted">{{ options.message }}</p>
          </div>
          <div class="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
            <Button variant="secondary" @click="store.answer(false)">
              {{ t(options.cancelLabelKey ?? 'confirmDefaults.cancel') }}
            </Button>
            <Button
              :variant="options.danger ? 'ghost-danger' : 'primary'"
              @click="store.answer(true)"
            >
              {{ t(options.confirmLabelKey ?? 'confirmDefaults.confirm') }}
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
