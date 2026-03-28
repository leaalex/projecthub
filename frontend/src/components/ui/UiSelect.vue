<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
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
const MAX_PANEL_PX = 240
const GAP_PX = 4

export type UiSelectOption<T extends string | number = string | number> = {
  value: T
  label: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    /** Use `''` for optional / “empty” selection when options include it */
    modelValue: string | number
    options: UiSelectOption<string | number>[]
    id?: string
    label?: string
    placeholder?: string
    disabled?: boolean
    error?: string
    /** Full width (default true) */
    block?: boolean
    size?: 'sm' | 'md'
    /**
     * When true (default), the list is teleported to `body` with fixed positioning
     * so parent `overflow: hidden` does not clip it (e.g. task list, modals).
     */
    teleport?: boolean
  }>(),
  {
    placeholder: 'Select…',
    block: true,
    size: 'md',
    teleport: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  /** Fired when Escape is pressed while the list is closed (e.g. parent may collapse a card) */
  escape: []
}>()

const uid = useId()
const baseId = computed(() => props.id ?? `ui-select-${uid}`)

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)

const floatingStyle = ref<Record<string, string>>({})

function updateFloatingPosition() {
  const el = buttonRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const spaceBelow = window.innerHeight - r.bottom - GAP_PX - 8
  const maxH = Math.min(MAX_PANEL_PX, Math.max(96, spaceBelow))
  floatingStyle.value = {
    position: 'fixed',
    top: `${r.bottom + GAP_PX}px`,
    left: `${r.left}px`,
    width: `${r.width}px`,
    minWidth: `${r.width}px`,
    maxHeight: `${maxH}px`,
    zIndex: String(DROPDOWN_Z),
  }
}

function onScrollOrResize() {
  if (open.value && props.teleport) updateFloatingPosition()
}

const enabledIndices = computed(() =>
  props.options
    .map((o, i) => (o.disabled ? -1 : i))
    .filter((i) => i >= 0),
)

const selectedOption = computed(() =>
  props.options.find((o) => valuesEqual(o.value, props.modelValue)),
)

const btnSizeClass = computed(() =>
  props.size === 'sm'
    ? 'px-2 py-1 text-xs'
    : 'px-3 py-2 text-sm',
)

const optSizeClass = computed(() =>
  props.size === 'sm'
    ? 'px-2 py-1.5 text-xs'
    : 'px-3 py-2 text-sm',
)

const chevronClass = computed(() =>
  props.size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
)

const displayLabel = computed(() => {
  const s = selectedOption.value
  if (s) return s.label
  if (props.placeholder) return props.placeholder
  return ''
})

const showPlaceholderStyle = computed(
  () => !selectedOption.value && props.placeholder !== undefined,
)

function valuesEqual(a: string | number, b: string | number): boolean {
  return a === b
}

function selectIndex(i: number) {
  const opt = props.options[i]
  if (!opt || opt.disabled) return
  emit('update:modelValue', opt.value)
  open.value = false
}

function moveActive(delta: number) {
  const enabled = enabledIndices.value
  if (!enabled.length) return
  let idx = enabled.indexOf(activeIndex.value)
  if (idx < 0) idx = 0
  idx = (idx + delta + enabled.length) % enabled.length
  activeIndex.value = enabled[idx]
  scrollActiveIntoView()
}

function scrollActiveIntoView() {
  nextTick(() => {
    const list = listRef.value
    if (!list) return
    const el = list.querySelector(`[data-index="${activeIndex.value}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  })
}

function onDocPointerDown(e: PointerEvent) {
  if (!open.value) return
  const t = e.target as Node
  if (rootRef.value?.contains(t)) return
  if (listRef.value?.contains(t)) return
  open.value = false
}

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function syncActiveToSelection() {
  const i = props.options.findIndex((o) =>
    valuesEqual(o.value, props.modelValue),
  )
  const opt = i >= 0 ? props.options[i] : undefined
  if (opt && !opt.disabled) {
    activeIndex.value = i
    return
  }
  activeIndex.value = enabledIndices.value[0] ?? 0
}

watch(open, (v) => {
  if (v) {
    syncActiveToSelection()
    nextTick(() => {
      if (props.teleport) updateFloatingPosition()
      scrollActiveIntoView()
    })
  }
})

watch(
  () => props.modelValue,
  () => {
    if (!open.value) syncActiveToSelection()
  },
)

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true)
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
  syncActiveToSelection()
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})

function onButtonKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (e.key === 'Escape') {
    if (open.value) {
      e.preventDefault()
      open.value = false
    } else {
      emit('escape')
    }
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (open.value) {
      selectIndex(activeIndex.value)
    } else {
      open.value = true
    }
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!open.value) {
      open.value = true
      return
    }
    moveActive(1)
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (!open.value) {
      open.value = true
      return
    }
    moveActive(-1)
  }
}

function onListKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    open.value = false
    buttonRef.value?.focus()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    moveActive(1)
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    moveActive(-1)
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    selectIndex(activeIndex.value)
    buttonRef.value?.focus()
  }
  if (e.key === 'Home') {
    e.preventDefault()
    const first = enabledIndices.value[0]
    if (first !== undefined) activeIndex.value = first
  }
  if (e.key === 'End') {
    e.preventDefault()
    const en = enabledIndices.value
    const last = en[en.length - 1]
    if (last !== undefined) activeIndex.value = last
  }
}

function optionClasses(i: number, opt: UiSelectOption<string | number>) {
  const selected = valuesEqual(opt.value, props.modelValue)
  const active = i === activeIndex.value
  return [
    'flex w-full cursor-pointer select-none text-left text-foreground',
    optSizeClass.value,
    opt.disabled && 'cursor-not-allowed opacity-50',
    !opt.disabled && active && 'bg-surface-muted',
    !opt.disabled && !active && 'hover:bg-surface-muted/80',
    selected && 'font-medium',
  ]
}
</script>

<template>
  <div
    ref="rootRef"
    class="relative"
    :class="block ? 'w-full' : 'inline-block min-w-[8rem]'"
  >
    <label
      v-if="label"
      :for="baseId"
      class="mb-1 block text-sm font-medium text-foreground"
      >{{ label }}</label
    >
    <button
      :id="baseId"
      ref="buttonRef"
      type="button"
      role="combobox"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-controls="open ? `${baseId}-listbox` : undefined"
      :aria-activedescendant="
        open ? `${baseId}-opt-${activeIndex}` : undefined
      "
      :disabled="disabled"
      :class="[
        'flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        btnSizeClass,
        showPlaceholderStyle ? 'text-muted' : 'text-foreground',
      ]"
      @click.stop="toggle"
      @keydown="onButtonKeydown"
    >
      <span class="min-w-0 flex-1 truncate">{{ displayLabel }}</span>
      <ChevronDownIcon
        class="shrink-0 text-muted transition-transform duration-200"
        :class="[chevronClass, open && 'rotate-180']"
        aria-hidden="true"
      />
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
          :id="`${baseId}-listbox`"
          ref="listRef"
          role="listbox"
          tabindex="-1"
          :class="[
            'overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10',
            teleport
              ? 'fixed'
              : 'absolute left-0 right-0 z-50 mt-1 max-h-60 min-w-full',
          ]"
          :style="teleport ? floatingStyle : undefined"
          @keydown="onListKeydown"
        >
          <button
            v-for="(opt, i) in options"
            :id="`${baseId}-opt-${i}`"
            :key="`${opt.value}-${i}`"
            type="button"
            role="option"
            :data-index="i"
            :aria-selected="valuesEqual(opt.value, modelValue)"
            :disabled="opt.disabled"
            :class="optionClasses(i, opt)"
            @click.stop="selectIndex(i)"
            @mouseenter="!opt.disabled && (activeIndex = i)"
          >
            {{ opt.label }}
          </button>
        </div>
      </Transition>
    </Teleport>

    <p v-if="error" class="mt-1 text-sm text-destructive">{{ error }}</p>
  </div>
</template>
