<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Card from '../ui/UiCard.vue'
import Skeleton from '../ui/UiSkeleton.vue'
import type { WeeklyReport } from '../../types/report'
import { formatDateShort } from '../../utils/formatters'
import WeeklyChart from './Charts/WeeklyChart.vue'

const { t } = useI18n()

const props = defineProps<{
  report: WeeklyReport | null
  loading?: boolean
}>()

const chartLabels = computed(() =>
  props.report ? Object.keys(props.report.by_status) : [],
)
const chartValues = computed(() =>
  props.report ? Object.values(props.report.by_status) : [],
)

const weekLine = computed(() => {
  const r = props.report
  if (!r) return ''
  return t('reportViewer.weekRange', {
    start: formatDateShort(r.week_start),
    end: formatDateShort(r.week_end),
  })
})
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-3">
        <Skeleton v-for="i in 3" :key="i" variant="card" />
      </div>
      <Skeleton variant="line" :lines="2" />
      <Skeleton variant="card" />
    </div>
    <template v-else-if="report">
      <div class="grid gap-4 sm:grid-cols-3">
        <Card padding="p-4">
          <p class="text-sm text-muted">{{ t('reportViewer.totalTasks') }}</p>
          <p class="text-2xl font-semibold text-foreground">{{ report.total_tasks }}</p>
        </Card>
        <Card padding="p-4">
          <p class="text-sm text-muted">{{ t('reportViewer.completedWeek') }}</p>
          <p class="text-2xl font-semibold text-foreground">{{ report.completed_in_week }}</p>
        </Card>
        <Card padding="p-4">
          <p class="text-sm text-muted">{{ t('reportViewer.yourProjects') }}</p>
          <p class="text-2xl font-semibold text-foreground">{{ report.projects_count }}</p>
        </Card>
      </div>
      <p class="text-sm text-muted">
        {{ weekLine }}
      </p>
      <Card padding="p-4">
        <WeeklyChart :labels="chartLabels" :values="chartValues" />
      </Card>
    </template>
  </div>
</template>
