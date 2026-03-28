<script setup lang="ts">
import EmptyState from '../common/EmptyState.vue'
import { timeAgo } from '../../utils/formatters'

defineProps<{
  items: { label: string; at: string }[]
}>()

function formatAt(at: string) {
  if (at === '—') return at
  return timeAgo(at)
}
</script>

<template>
  <div class="rounded-lg border border-border bg-surface p-4 shadow-sm">
    <h3 class="mb-3 text-sm font-semibold text-foreground">Activity</h3>
    <ul v-if="items.length" class="space-y-2 text-sm">
      <li
        v-for="(it, i) in items"
        :key="i"
        class="flex justify-between gap-4 border-b border-border py-2 last:border-0"
      >
        <span class="text-foreground">{{ it.label }}</span>
        <span class="shrink-0 text-muted">{{ formatAt(it.at) }}</span>
      </li>
    </ul>
    <div v-else class="py-2">
      <EmptyState
        title="No recent activity"
        description="Summary items will show here when available."
      />
    </div>
  </div>
</template>
