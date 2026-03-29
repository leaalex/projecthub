<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
import {
  EllipsisVerticalIcon,
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
import type { UiSelectOption } from './UiSelect.vue'

const DROPDOWN_Z = 70
const MAX_PANEL_PX = 240
const GAP_PX = 4

const props = withDefaults(
  defineProps<{
    options: UiSelectOption<string | number>[]
    /**
     * `icon` — квадратная кнопка с иконкой (слот).
     * `field` — полоса как у селекта: текущее значение + шеврон.
     */
    variant?: 'icon' | 'field'
    /** Accessible name for the trigger (required). */
    ariaLabel: string
    modelValue?: string | number | null | ''
    disabled?: boolean
    title?: string
    /** Shown on `field` when value does not match an option. */
    placeholder?: string
    placement?: 'bottom-start' | 'bottom-end'
    teleport?: boolean
    /** Minimum panel width in px; panel is at least this wide and at least trigger width. */
    minPanelWidth?: number
    /** Shown to the right of the icon trigger (`variant="icon"` only). */
    summary?: string
    /** Show a clear control next to the summary (e.g. remove optional assignee). */
    showClear?: boolean
    clearAriaLabel?: string
  }>(),
  {
    variant: 'icon',
    modelValue: undefined,
    placeholder: 'Select…',
    placement: 'bottom-end',
    teleport: true,
    minPanelWidth: 160,
    summary: '',
    showClear: false,
    clearAriaLabel: 'Clear',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  select: [value: string | number]
  escape: []
  clear: []
}>()

const uid = useId()
const baseId = computed(() => `ui-menu-btn-${uid}`)

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const optionsListRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)

const floatingStyle = ref<Record<string, string>>({})

type Row = { opt: UiSelectOption<string | number>; sourceIndex: number }

const rows = computed((): Row[] =>
  props.options.map((opt, sourceIndex) => ({ opt, sourceIndex })),
)

const summaryText = computed(() => props.summary.trim())

const fieldTriggerText = computed(() => {
  if (props.variant !== 'field') return ''
  const mv = props.modelValue
  if (mv === undefined || mv === null || mv === '') {
    return props.placeholder
  }
  const row = props.options.find((o) => o.value === mv)
  if (row) return row.label
  return props.placeholder
})

const enabledIndices = computed(() =>
  rows.value
    .map((row, fi) => (row.opt.disabled ? -1 : fi))
    .filter((fi) => fi >= 0),
)

const effectivePlacement = computed(() => {
  if (props.variant === 'field') return 'bottom-start' as const
  return props.placement
})

function updateFloatingPosition() {
  const el = buttonRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const panelW = Math.max(props.minPanelWidth, r.width)
  const spaceBelow = window.innerHeight - r.bottom - GAP_PX - 8
  const maxH = Math.min(MAX_PANEL_PX, Math.max(96, spaceBelow))
  let left: number
  if (effectivePlacement.value === 'bottom-end') {
    left = r.right - panelW
  } else {
    left = r.left
  }
  const margin = 8
  left = Math.min(left, window.innerWidth - panelW - margin)
  left = Math.max(margin, left)
  floatingStyle.value = {
    position: 'fixed',
    top: `${r.bottom + GAP_PX}px`,
    left: `${left}px`,
    width: `${panelW}px`,
    minWidth: `${panelW}px`,
    maxHeight: `${maxH}px`,
    zIndex: String(DROPDOWN_Z),
  }
}

function onScrollOrResize() {
  if (open.value && props.teleport) updateFloatingPosition()
}

function valuesEqual(a: string | number, b: string | number): boolean {
  return a === b
}

function isSelectedValue(v: string | number): boolean {
  const mv = props.modelValue
  if (mv === undefined || mv === null) return false
  return valuesEqual(mv, v)
}

const activeDescendantId = computed(() => {
  if (!open.value) return undefined
  const row = rows.value[activeIndex.value]
  if (!row) return undefined
  return `${baseId.value}-opt-${row.sourceIndex}`
})

function syncActiveToSelection() {
  const mv = props.modelValue
  if (mv !== undefined && mv !== null) {
    const fi = rows.value.findIndex((row) =>
      valuesEqual(row.opt.value, mv),
    )
    const row = fi >= 0 ? rows.value[fi] : undefined
    if (row && !row.opt.disabled) {
      activeIndex.value = fi
      return
    }
  }
  activeIndex.value = enabledIndices.value[0] ?? 0
}

function selectIndex(fi: number) {
  const row = rows.value[fi]
  if (!row || row.opt.disabled) return
  emit('select', row.opt.value)
  emit('update:modelValue', row.opt.value)
  open.value = false
  nextTick(() => buttonRef.value?.focus())
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
    const list = optionsListRef.value
    if (!list) return
    const el = list.querySelector(`[data-fi="${activeIndex.value}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  })
}

function onDocPointerDown(e: PointerEvent) {
  if (!open.value) return
  const t = e.target as Node
  if (rootRef.value?.contains(t)) return
  if (panelRef.value?.contains(t)) return
  open.value = false
}

function toggle() {
  if (props.disabled || !props.options.length) return
  open.value = !open.value
}

watch(open, (v) => {
  if (!v) return
  syncActiveToSelection()
  nextTick(() => {
    if (props.teleport) updateFloatingPosition()
    scrollActiveIntoView()
  })
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
      toggle()
    }
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!open.value) {
      toggle()
      return
    }
    moveActive(1)
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (!open.value) {
      toggle()
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

const optionRowClass =
  'min-h-8 px-3 py-1.5 text-xs leading-normal'

function optionClasses(fi: number, row: Row) {
  const selected = isSelectedValue(row.opt.value)
  const active = fi === activeIndex.value
  return [
    'flex w-full cursor-pointer select-none items-center gap-2 text-left text-foreground',
    optionRowClass,
    row.opt.disabled && 'cursor-not-allowed opacity-50',
    !row.opt.disabled && active && 'bg-surface-muted',
    !row.opt.disabled && !active && 'hover:bg-surface-muted/80',
    selected && 'font-medium',
  ]
}
</script>

<template>
  <div
    ref="rootRef"
    :class="
      variant === 'field'
        ? 'relative block w-full min-w-0'
        : 'relative inline-flex max-w-full min-w-0 items-center gap-1.5'
    "
  >
    <button
      :id="baseId"
      ref="buttonRef"
      type="button"
      role="combobox"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-controls="open ? `${baseId}-listbox` : undefined"
      :aria-activedescendant="activeDescendantId"
      :aria-label="ariaLabel"
      :disabled="disabled || !options.length"
      :title="title"
      :class="
        variant === 'field'
          ? 'inline-flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-surface px-2.5 text-left text-xs text-foreground transition-colors hover:bg-surface-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
          : 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
      "
      @click.stop="toggle"
      @keydown="onButtonKeydown"
    >
      <template v-if="variant === 'field'">
        <span class="min-w-0 flex-1 truncate text-foreground">{{
          fieldTriggerText
        }}</span>
        <ChevronDownIcon
          class="h-4 w-4 shrink-0 text-muted"
          aria-hidden="true"
        />
      </template>
      <slot v-else>
        <EllipsisVerticalIcon class="h-5 w-5" aria-hidden="true" />
      </slot>
    </button>

    <template v-if="variant === 'icon'">
      <span
        v-if="summaryText"
        class="min-w-0 max-w-[9rem] shrink truncate text-xs text-foreground"
        :title="summaryText"
      >{{ summaryText }}</span>
      <button
        v-if="showClear"
        type="button"
        class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        :aria-label="clearAriaLabel"
        :disabled="disabled"
        @click.stop="emit('clear')"
      >
        <XMarkIcon class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </template>

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
          ref="panelRef"
          class="flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-lg ring-1 ring-black/5 dark:ring-white/10"
          :class="
            teleport
              ? 'fixed'
              : 'absolute right-0 top-full z-50 mt-1 min-w-40 max-h-60'
          "
          :style="teleport ? floatingStyle : undefined"
        >
          <div
            :id="`${baseId}-listbox`"
            ref="optionsListRef"
            role="listbox"
            tabindex="-1"
            class="min-h-0 flex-1 overflow-auto py-1"
            @keydown="onListKeydown"
          >
            <button
              v-for="(row, fi) in rows"
              :id="`${baseId}-opt-${row.sourceIndex}`"
              :key="`${row.opt.value}-${row.sourceIndex}`"
              type="button"
              role="option"
              :data-fi="fi"
              :aria-selected="isSelectedValue(row.opt.value)"
              :disabled="row.opt.disabled"
              :class="optionClasses(fi, row)"
              @click.stop="selectIndex(fi)"
              @mouseenter="!row.opt.disabled && (activeIndex = fi)"
            >
              <span class="min-w-0 flex-1">{{ row.opt.label }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
