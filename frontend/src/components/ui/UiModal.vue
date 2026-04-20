<script setup lang="ts">
import {
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useSlots,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    /** Если true — клик по фону и Escape не закрывают окно, панель слегка дёргается. */
    dirty?: boolean
    /** Ширина панели (например таблица ручного переноса задач). */
    size?: 'default' | 'large'
  }>(),
  { dirty: false, size: 'default' },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
const slots = useSlots()

const panelRef = ref<HTMLElement | null>(null)
const shaking = ref(false)

function close() {
  if (props.dirty) {
    triggerShake()
    return
  }
  emit('update:modelValue', false)
}

function triggerShake() {
  shaking.value = true
}

function onShakeEnd(e: AnimationEvent) {
  if (e.animationName !== 'modal-shake') return
  shaking.value = false
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
    const first =
      list.find(
        (el) =>
          el.tagName === 'INPUT'
          || el.tagName === 'TEXTAREA'
          || el.tagName === 'SELECT',
      ) ?? list[0]
    first?.focus()
  },
)

onMounted(() => document.addEventListener('keydown', onDocKey))
onUnmounted(() => document.removeEventListener('keydown', onDocKey))

const showHeader = () =>
  Boolean(props.title || slots['header-actions']?.())
const showFooter = () => Boolean(slots.footer?.())
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex justify-end p-3 sm:p-4 md:p-5"
        role="dialog"
        aria-modal="true"
        :aria-describedby="dirty ? 'modal-unsaved-hint' : undefined"
      >
        <p
          v-if="dirty"
          id="modal-unsaved-hint"
          class="sr-only"
        >
          {{ t('modal.unsavedChanges') }}
        </p>
        <div
          class="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
          aria-hidden="true"
          @click="close"
        />
        <div
          ref="panelRef"
          class="modal-panel relative z-10 flex h-full max-h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface"
          :class="[
            size === 'large' ? 'max-w-4xl' : 'max-w-lg',
            { 'modal-shake-active': shaking },
          ]"
          @keydown="onPanelKeydown"
          @animationend="onShakeEnd"
        >
          <div
            v-if="showHeader()"
            class="flex shrink-0 items-center gap-4 border-b border-border px-5 py-4 sm:px-6"
          >
            <h2
              v-if="title"
              class="min-w-0 flex-1 text-lg font-semibold text-foreground"
            >
              {{ title }}
            </h2>
            <div
              v-if="slots['header-actions']?.()"
              class="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2"
            >
              <slot name="header-actions" />
            </div>
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
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@keyframes modal-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(8px);
  }
  60% {
    transform: translateX(-6px);
  }
  80% {
    transform: translateX(6px);
  }
}

.modal-shake-active {
  animation: modal-shake 0.28s ease-out;
}
</style>
