<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ActivityFeed from '../components/dashboard/ActivityFeed.vue'
import StatsCard from '../components/dashboard/StatsCard.vue'
import Breadcrumb from '../components/ui/UiBreadcrumb.vue'
import Skeleton from '../components/ui/UiSkeleton.vue'
import { api } from '../utils/api'
import type { WeeklyReport } from '../types/report'
import { useProjectStore } from '../stores/project.store'

const projectStore = useProjectStore()
const report = ref<WeeklyReport | null>(null)
const health = ref<string | null>(null)
const dashboardLoading = ref(true)

onMounted(async () => {
  try {
    const [h, w] = await Promise.all([
      api.get<{ status: string }>('/health'),
      api.get<WeeklyReport>('/reports/weekly'),
    ])
    health.value = h.data.status
    report.value = w.data
    await projectStore.fetchList()
  } catch {
    health.value = null
  } finally {
    dashboardLoading.value = false
  }
})

const activityItems = computed(() => {
  if (!report.value) return []
  return [
    {
      label: `Total tasks in scope: ${report.value.total_tasks}`,
      at: report.value.week_start,
    },
    {
      label: `Projects owned: ${report.value.projects_count}`,
      at: '—',
    },
  ]
})
</script>

<template>
  <div>
    <Breadcrumb
      class="mb-4"
      :items="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Dashboard' },
      ]"
    />
    <h1 class="text-2xl font-semibold text-foreground">Dashboard</h1>
    <p class="mt-1 text-sm text-muted">Overview of your workspace</p>

    <div
      v-if="dashboardLoading"
      class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Skeleton v-for="i in 4" :key="i" variant="card" />
    </div>
    <div v-else class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="API"
        :value="health === null ? '…' : health === 'ok' ? 'OK' : '—'"
        hint="Health check"
      />
      <StatsCard
        title="Projects"
        :value="projectStore.projects.length"
        hint="Owned by you"
      />
      <StatsCard
        title="Tasks (scope)"
        :value="report?.total_tasks ?? '—'"
        hint="Visible tasks"
      />
      <StatsCard
        title="Done this week"
        :value="report?.completed_in_week ?? '—'"
        hint="Completed in current week"
      />
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <div v-if="dashboardLoading" class="rounded-lg border border-border bg-surface p-4">
        <Skeleton variant="line" :lines="4" />
      </div>
      <ActivityFeed v-else :items="activityItems" />
      <div
        v-if="dashboardLoading"
        class="rounded-lg border border-border bg-surface p-4 shadow-sm"
      >
        <Skeleton variant="line" class="mb-3 max-w-[8rem]" />
        <Skeleton variant="line" :lines="4" />
      </div>
      <div
        v-else
        class="rounded-lg border border-border bg-surface p-4 text-sm text-muted shadow-sm"
      >
        <p class="font-medium text-foreground">Quick links</p>
        <ul class="mt-2 space-y-1">
          <li>
            <router-link class="text-primary hover:underline" to="/projects"
              >Projects</router-link
            >
          </li>
          <li>
            <router-link class="text-primary hover:underline" to="/tasks"
              >Tasks</router-link
            >
          </li>
          <li>
            <router-link class="text-primary hover:underline" to="/reports"
              >Reports</router-link
            >
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
