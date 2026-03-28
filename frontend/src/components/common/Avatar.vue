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

/** Simple string hash → hue 0–360 */
function hueFromString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}

const style = computed(() => {
  const key = props.email || props.name || 'x'
  const h = hueFromString(key)
  return {
    backgroundColor: `hsl(${h} 45% 40%)`,
    color: '#fff',
  }
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
    :class="sizeClass"
    :style="style"
    :title="email || name || undefined"
    aria-hidden="true"
  >
    {{ initials }}
  </span>
</template>
