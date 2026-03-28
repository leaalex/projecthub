<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  email?: string | null
  name?: string | null
  /** Size in Tailwind scale: sm | md | lg */
  size?: 'sm' | 'md' | 'lg'
}>()

const initials = computed(() => {
  const n = props.name?.trim()
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean)
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return n.slice(0, 2).toUpperCase()
  }
  const e = props.email?.trim()
  if (e) {
    const local = e.split('@')[0] ?? e
    return local.slice(0, 2).toUpperCase()
  }
  return '?'
})

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** Fixed palette (Tailwind); works in light/dark. */
const PALETTE = [
  'bg-sky-600 text-white dark:bg-sky-700',
  'bg-teal-600 text-white dark:bg-teal-700',
  'bg-indigo-600 text-white dark:bg-indigo-700',
  'bg-violet-600 text-white dark:bg-violet-700',
  'bg-cyan-600 text-white dark:bg-cyan-700',
  'bg-blue-600 text-white dark:bg-blue-700',
  'bg-emerald-600 text-white dark:bg-emerald-700',
  'bg-fuchsia-600 text-white dark:bg-fuchsia-800',
] as const

const paletteClass = computed(() => {
  const key = props.email || props.name || 'x'
  return PALETTE[hashString(key) % PALETTE.length]
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 w-8 text-xs'
    case 'lg':
      return 'h-12 w-12 text-base'
    default:
      return 'h-9 w-9 text-sm'
  }
})
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
    :class="[sizeClass, paletteClass]"
    :title="email || name || undefined"
    aria-hidden="true"
  >
    {{ initials }}
  </span>
</template>
