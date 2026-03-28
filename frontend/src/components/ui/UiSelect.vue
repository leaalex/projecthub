<script setup lang="ts">
import { CheckIcon, ChevronDownIcon } from '@heroicons/vue/20/solid'
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

export type UiSelectModelValue = string | number | (string | number)[]

const props = withDefaults(
  defineProps<{
    /**
     * Single: `string | number`. Multiple (`multiple`): `(string | number)[]`.
     */
    modelValue: UiSelectModelValue
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
    /** Filter options by label while the panel is open */
    filterable?: boolean
    /** Multiple selection; `modelValue` must be an array */
    multiple?: boolean
  }>(),
  {
    placeholder: 'Select…',
    block: true,
    size: 'md',
    teleport: true,
    filterable: false,
    multiple: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: UiSelectModelValue]
  /** Fired when Escape is pressed while the list is closed (e.g. parent may collapse a card) */
  escape: []
}>()

const uid = useId()
const baseId = computed(() => props.id ?? `ui-select-${uid}`)

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const optionsListRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
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

type FilterRow = {
  opt: UiSelectOption<string | number>
  sourceIndex: number
}

const filteredOptions = computed((): FilterRow[] => {
  const q = props.filterable ? searchQuery.value.trim().toLowerCase() : ''
  return props.options
    .map((opt, sourceIndex) => ({ opt, sourceIndex }))
    .filter(({ opt }) => {
      if (!q) return true
      return opt.label.toLowerCase().includes(q)
    })
})

const enabledFilteredIndices = computed(() =>
  filteredOptions.value
    .map((row, fi) => (row.opt.disabled ? -1 : fi))
    .filter((fi) => fi >= 0),
)

const selectedOption = computed(() => {
  if (props.multiple) return undefined
  const mv = props.modelValue
  if (Array.isArray(mv)) return undefined
  return props.options.find((o) => valuesEqual(o.value, mv))
})

const selectedValues = computed((): (string | number)[] => {
  if (!props.multiple) return []
  const mv = props.modelValue
  return Array.isArray(mv) ? [...mv] : []
})

const displayTitle = computed(() => {
  if (!props.multiple) return undefined
  const sel = selectedValues.value
  if (sel.length <= 1) return undefined
  return sel
    .map(
      (v) =>
        props.options.find((o) => valuesEqual(o.value, v))?.label ?? String(v),
    )
    .join(', ')
})

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

const searchSizeClass = computed(() =>
  props.size === 'sm'
    ? 'px-2 py-1.5 text-xs'
    : 'px-3 py-2 text-sm',
)

const chevronClass = computed(() =>
  props.size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
)

const displayLabel = computed(() => {
  if (props.multiple) {
    const sel = selectedValues.value
    if (sel.length === 0) return props.placeholder ?? ''
    if (sel.length === 1) {
      const o = props.options.find((x) => valuesEqual(x.value, sel[0]))
      return o?.label ?? String(sel[0])
    }
    return `${sel.length} selected`
  }
  const s = selectedOption.value
  if (s) return s.label
  if (props.placeholder) return props.placeholder
  return ''
})

const showPlaceholderStyle = computed(() => {
  if (props.multiple) {
    return selectedValues.value.length === 0 && props.placeholder !== undefined
  }
  return !selectedOption.value && props.placeholder !== undefined
})

const activeDescendantId = computed(() => {
  if (!open.value) return undefined
  const row = filteredOptions.value[activeIndex.value]
  if (!row) return undefined
  return `${baseId.value}-opt-${row.sourceIndex}`
})

function valuesEqual(a: string | number, b: string | number): boolean {
  return a === b
}

function isSelectedValue(v: string | number): boolean {
  if (props.multiple) {
    return selectedValues.value.some((x) => valuesEqual(x, v))
  }
  const mv = props.modelValue
  if (Array.isArray(mv)) return false
  return valuesEqual(mv, v)
}

function toggleValue(v: string | number) {
  const cur = selectedValues.value
  const i = cur.findIndex((x) => valuesEqual(x, v))
  const next = [...cur]
  if (i >= 0) next.splice(i, 1)
  else next.push(v)
  emit('update:modelValue', next)
}

function selectFilteredIndex(fi: number) {
  const row = filteredOptions.value[fi]
  if (!row || row.opt.disabled) return
  if (props.multiple) {
    toggleValue(row.opt.value)
    return
  }
  emit('update:modelValue', row.opt.value)
  open.value = false
  nextTick(() => buttonRef.value?.focus())
}

function moveActive(delta: number) {
  const enabled = enabledFilteredIndices.value
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
  if (props.disabled) return
  open.value = !open.value
}

function syncActiveToSelection() {
  if (!props.multiple) {
    const mv = props.modelValue
    if (Array.isArray(mv)) {
      activeIndex.value = enabledFilteredIndices.value[0] ?? 0
      return
    }
    const fi = filteredOptions.value.findIndex((row) =>
      valuesEqual(row.opt.value, mv),
    )
    const row = fi >= 0 ? filteredOptions.value[fi] : undefined
    if (row && !row.opt.disabled) {
      activeIndex.value = fi
      return
    }
  }
  activeIndex.value = enabledFilteredIndices.value[0] ?? 0
}

watch(open, (v) => {
  if (!v) {
    searchQuery.value = ''
    return
  }
  syncActiveToSelection()
  nextTick(() => {
    if (props.teleport) updateFloatingPosition()
    if (props.filterable) {
      searchInputRef.value?.focus()
    } else {
      scrollActiveIntoView()
    }
  })
})

watch(
  () => [props.modelValue, props.multiple] as const,
  () => {
    if (!open.value) syncActiveToSelection()
  },
)

watch(
  () => [searchQuery.value, props.filterable, open.value] as const,
  () => {
    if (!open.value || !props.filterable) return
    syncActiveToSelection()
    scrollActiveIntoView()
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

function focusOptionsList() {
  optionsListRef.value?.focus()
}

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
      selectFilteredIndex(activeIndex.value)
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
    if (props.filterable) {
      searchInputRef.value?.focus()
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

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    open.value = false
    buttonRef.value?.focus()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusOptionsList()
    const first = enabledFilteredIndices.value[0]
    if (first !== undefined) {
      activeIndex.value = first
      scrollActiveIntoView()
    }
    return
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
    selectFilteredIndex(activeIndex.value)
    if (!props.multiple) {
      return
    }
  }
  if (e.key === 'Home') {
    e.preventDefault()
    const first = enabledFilteredIndices.value[0]
    if (first !== undefined) activeIndex.value = first
  }
  if (e.key === 'End') {
    e.preventDefault()
    const en = enabledFilteredIndices.value
    const last = en[en.length - 1]
    if (last !== undefined) activeIndex.value = last
  }
}

function optionClasses(fi: number, row: FilterRow) {
  const selected = isSelectedValue(row.opt.value)
  const active = fi === activeIndex.value
  return [
    'flex w-full cursor-pointer select-none items-center gap-2 text-left text-foreground',
    optSizeClass.value,
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
      :aria-activedescendant="activeDescendantId"
      :disabled="disabled"
      :title="displayTitle"
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
          ref="panelRef"
          :class="[
            'flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-lg ring-1 ring-black/5 dark:ring-white/10',
            teleport
              ? 'fixed'
              : 'absolute left-0 right-0 z-50 mt-1 min-w-full max-h-60',
          ]"
          :style="teleport ? floatingStyle : undefined"
        >
          <input
            v-if="filterable"
            ref="searchInputRef"
            v-model="searchQuery"
            type="search"
            autocomplete="off"
            aria-label="Filter options"
            :class="[
              'w-full shrink-0 border-b border-border bg-surface text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
              searchSizeClass,
            ]"
            placeholder="Search…"
            @keydown="onSearchKeydown"
            @keydown.enter.prevent
          />
          <div
            :id="`${baseId}-listbox`"
            ref="optionsListRef"
            role="listbox"
            tabindex="-1"
            :aria-multiselectable="multiple ? true : undefined"
            class="min-h-0 flex-1 overflow-auto py-1"
            @keydown="onListKeydown"
          >
            <button
              v-for="(row, fi) in filteredOptions"
              :id="`${baseId}-opt-${row.sourceIndex}`"
              :key="`${row.opt.value}-${row.sourceIndex}`"
              type="button"
              role="option"
              :data-fi="fi"
              :aria-selected="isSelectedValue(row.opt.value)"
              :disabled="row.opt.disabled"
              :class="optionClasses(fi, row)"
              @click.stop="selectFilteredIndex(fi)"
              @mouseenter="!row.opt.disabled && (activeIndex = fi)"
            >
              <template v-if="multiple">
                <span
                  class="flex h-4 w-4 shrink-0 items-center justify-center"
                  aria-hidden="true"
                >
                  <CheckIcon
                    v-if="isSelectedValue(row.opt.value)"
                    class="h-3.5 w-3.5 text-primary"
                  />
                </span>
              </template>
              <span class="min-w-0 flex-1">{{ row.opt.label }}</span>
            </button>
            <p
              v-if="filteredOptions.length === 0"
              class="px-3 py-2 text-sm text-muted"
            >
              No matches
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>

    <p v-if="error" class="mt-1 text-sm text-destructive">{{ error }}</p>
  </div>
</template>
