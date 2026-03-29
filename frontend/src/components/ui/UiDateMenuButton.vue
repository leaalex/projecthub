<script setup lang="ts">
import {
  CalendarDaysIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useId,
  watch,
} from 'vue'

const DROPDOWN_Z = 70
const GAP_PX = 4
const PANEL_MIN_W = 220

const props = withDefaults(
  defineProps<{
    /** ISO date `YYYY-MM-DD` or empty string */
    modelValue: string
    ariaLabel: string
    disabled?: boolean
    title?: string
    placement?: 'bottom-start' | 'bottom-end'
    teleport?: boolean
  }>(),
  {
    disabled: false,
    placement: 'bottom-end',
    teleport: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  escape: []
}>()

const uid = useId()
const baseId = computed(() => `ui-date-menu-${uid}`)
const inputId = computed(() => `${baseId.value}-date`)

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const dateInputRef = ref<HTMLInputElement | null>(null)
const floatingStyle = ref<Record<string, string>>({})

const localValue = ref('')

const tooltipTitle = computed(() => {
  if (props.title) return props.title
  const v = props.modelValue.trim()
  if (!v) return 'Due date'
  return `Due date: ${v.slice(0, 10)}`
})

const displayDate = computed(() => props.modelValue.trim().slice(0, 10))

function updateFloatingPosition() {
  const el = buttonRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const panelW = Math.max(PANEL_MIN_W, r.width)
  let left =
    props.placement === 'bottom-end' ? r.right - panelW : r.left
  const margin = 8
  left = Math.min(left, window.innerWidth - panelW - margin)
  left = Math.max(margin, left)
  floatingStyle.value = {
    position: 'fixed',
    top: `${r.bottom + GAP_PX}px`,
    left: `${left}px`,
    width: `${panelW}px`,
    minWidth: `${panelW}px`,
    zIndex: String(DROPDOWN_Z),
  }
}

function onScrollOrResize() {
  if (open.value && props.teleport) updateFloatingPosition()
}

function syncToParent() {
  emit('update:modelValue', localValue.value.trim())
}

function closeFocusTrigger() {
  open.value = false
  nextTick(() => buttonRef.value?.focus())
}

function onDocPointerDown(e: PointerEvent) {
  if (!open.value) return
  const t = e.target as Node
  if (rootRef.value?.contains(t)) return
  if (panelRef.value?.contains(t)) return
  syncToParent()
  closeFocusTrigger()
}

function toggle() {
  if (props.disabled) return
  if (open.value) {
    syncToParent()
    closeFocusTrigger()
  } else {
    localValue.value = props.modelValue.trim()
    open.value = true
    nextTick(() => {
      updateFloatingPosition()
      dateInputRef.value?.focus()
    })
  }
}

function clearDue() {
  localValue.value = ''
  emit('update:modelValue', '')
  closeFocusTrigger()
}

function clearFromChip() {
  localValue.value = ''
  emit('update:modelValue', '')
  if (open.value) closeFocusTrigger()
}

function onPanelKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    syncToParent()
    closeFocusTrigger()
    emit('escape')
  }
}

function onButtonKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (e.key === 'Escape') {
    e.preventDefault()
    if (open.value) {
      syncToParent()
      closeFocusTrigger()
    }
    emit('escape')
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    toggle()
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (!open.value) localValue.value = (v ?? '').trim()
  },
)

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true)
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})
</script>

<template>
  <div
    ref="rootRef"
    class="relative inline-flex max-w-full min-w-0 items-center gap-1.5"
  >
    <button
      :id="baseId"
      ref="buttonRef"
      type="button"
      :aria-expanded="open"
      aria-haspopup="dialog"
      :aria-controls="open ? `${baseId}-panel` : undefined"
      :aria-label="ariaLabel"
      :disabled="disabled"
      :title="tooltipTitle"
      class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      @click.stop="toggle"
      @keydown="onButtonKeydown"
    >
      <CalendarDaysIcon class="h-5 w-5" aria-hidden="true" />
    </button>

    <span
      v-if="displayDate"
      class="min-w-0 max-w-[9rem] shrink truncate text-xs text-foreground"
      :title="displayDate"
    >{{ displayDate }}</span>
    <button
      v-if="displayDate"
      type="button"
      class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      aria-label="Clear due date"
      :disabled="disabled"
      @click.stop="clearFromChip"
    >
      <XMarkIcon class="h-3.5 w-3.5" aria-hidden="true" />
    </button>

    <Teleport to="body" :disabled="!teleport">
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="open"
          :id="`${baseId}-panel`"
          ref="panelRef"
          role="dialog"
          aria-label="Due date"
          class="fixed rounded-md border border-border bg-surface p-2"
          :style="floatingStyle"
          @keydown="onPanelKeydown"
        >
          <label class="sr-only" :for="inputId">Due date</label>
          <input
            :id="inputId"
            ref="dateInputRef"
            v-model="localValue"
            type="date"
            class="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            @input="syncToParent"
          />
          <button
            type="button"
            class="mt-2 w-full rounded-md px-2 py-1.5 text-center text-xs font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            @click="clearDue"
          >
            Clear due date
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
