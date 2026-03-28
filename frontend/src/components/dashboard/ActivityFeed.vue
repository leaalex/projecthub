<script setup lang="ts">
import Card from '../ui/UiCard.vue'
import EmptyState from '../ui/UiEmptyState.vue'
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
  <Card padding="p-4">
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
  </Card>
</template>
