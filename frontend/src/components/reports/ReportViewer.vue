<script setup lang="ts">
import { computed } from 'vue'
import Skeleton from '../ui/UiSkeleton.vue'
import type { WeeklyReport } from '../../types/report'
import { formatDateShort } from '../../utils/formatters'
import WeeklyChart from './Charts/WeeklyChart.vue'

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
        <div class="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <p class="text-sm text-muted">Total tasks (visible)</p>
          <p class="text-2xl font-semibold">{{ report.total_tasks }}</p>
        </div>
        <div class="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <p class="text-sm text-muted">Completed this week</p>
          <p class="text-2xl font-semibold">{{ report.completed_in_week }}</p>
        </div>
        <div class="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <p class="text-sm text-muted">Your projects</p>
          <p class="text-2xl font-semibold">{{ report.projects_count }}</p>
        </div>
      </div>
      <p class="text-sm text-muted">
        Week: {{ formatDateShort(report.week_start) }} — {{ formatDateShort(report.week_end) }}
      </p>
      <div class="rounded-lg border border-border bg-surface p-4 shadow-sm">
        <WeeklyChart :labels="chartLabels" :values="chartValues" />
      </div>
    </template>
  </div>
</template>
