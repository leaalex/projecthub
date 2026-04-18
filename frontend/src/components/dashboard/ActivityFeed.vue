<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Card from '../ui/UiCard.vue'
import EmptyState from '../ui/UiEmptyState.vue'
import { timeAgo } from '../../utils/formatters'

const { t, locale } = useI18n()

defineProps<{
  items: { label: string; at: string }[]
}>()

function formatAt(at: string) {
  if (at === t('dashboard.activity.dash')) return at
  return timeAgo(at, t, locale.value)
}
</script>

<template>
  <Card padding="p-4">
    <h3 class="mb-3 text-sm font-semibold text-foreground">{{ t('dashboard.activityTitle') }}</h3>
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
        :title="t('dashboard.activityEmptyTitle')"
        :description="t('dashboard.activityEmptyDescription')"
      />
    </div>
  </Card>
</template>
