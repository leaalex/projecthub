<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import ActivityFeed from '../components/dashboard/ActivityFeed.vue'
import StatsCard from '../components/dashboard/StatsCard.vue'
import Breadcrumb from '../components/ui/UiBreadcrumb.vue'
import Card from '../components/ui/UiCard.vue'
import Skeleton from '../components/ui/UiSkeleton.vue'
import { useProjectStore } from '@app/project.store'
import { useReportStore } from '@app/report.store'

const projectStore = useProjectStore()
const reportStore = useReportStore()
const { weekly, health } = storeToRefs(reportStore)
const { t } = useI18n()
const dashboardLoading = ref(true)

onMounted(async () => {
  try {
    await Promise.all([reportStore.loadHealth(), reportStore.loadWeekly()])
    await projectStore.fetchList()
  } catch {
    reportStore.health = null
  } finally {
    dashboardLoading.value = false
  }
})

const activityItems = computed(() => {
  if (!weekly.value) return []
  return [
    {
      label: t('dashboard.activity.totalTasks', {
        count: weekly.value.total_tasks,
      }),
      at: weekly.value.week_start,
    },
    {
      label: t('dashboard.activity.projectsOwned', {
        count: weekly.value.projects_count,
      }),
      at: t('dashboard.activity.dash'),
    },
  ]
})

const breadcrumbItems = computed(() => [
  { label: t('common.home'), to: '/dashboard' },
  { label: t('dashboard.breadcrumb') },
])
</script>

<template>
  <div>
    <Breadcrumb class="mb-4" :items="breadcrumbItems" />
    <h1 class="text-2xl font-semibold text-foreground">{{ t('dashboard.title') }}</h1>
    <p class="mt-1 text-sm text-muted">{{ t('dashboard.subtitle') }}</p>

    <div
      v-if="dashboardLoading"
      class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Skeleton v-for="i in 4" :key="i" variant="card" />
    </div>
    <div v-else class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        :title="t('dashboard.stats.api')"
        :value="health === null ? '…' : health === 'ok' ? t('dashboard.stats.ok') : '—'"
        :hint="t('dashboard.stats.apiHint')"
      />
      <StatsCard
        :title="t('dashboard.stats.projects')"
        :value="projectStore.projects.length"
        :hint="t('dashboard.stats.projectsHint')"
      />
      <StatsCard
        :title="t('dashboard.stats.tasksScope')"
        :value="weekly?.total_tasks ?? '—'"
        :hint="t('dashboard.stats.tasksScopeHint')"
      />
      <StatsCard
        :title="t('dashboard.stats.doneThisWeek')"
        :value="weekly?.completed_in_week ?? '—'"
        :hint="t('dashboard.stats.doneThisWeekHint')"
      />
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <Card v-if="dashboardLoading" class="min-w-0" padding="p-4">
        <Skeleton variant="line" :lines="4" />
      </Card>
      <ActivityFeed v-else :items="activityItems" />
      <Card
        v-if="dashboardLoading"
        class="min-w-0"
        padding="p-4"
      >
        <Skeleton variant="line" class="mb-3 max-w-[8rem]" />
        <Skeleton variant="line" :lines="4" />
      </Card>
      <Card
        v-else
        class="min-w-0 text-sm text-muted"
        padding="p-4"
      >
        <p class="font-medium text-foreground">{{ t('dashboard.quickLinks.title') }}</p>
        <ul class="mt-2 space-y-1">
          <li>
            <router-link class="text-primary hover:underline" to="/projects"
              >{{ t('dashboard.quickLinks.projects') }}</router-link
            >
          </li>
          <li>
            <router-link class="text-primary hover:underline" to="/tasks"
              >{{ t('dashboard.quickLinks.tasks') }}</router-link
            >
          </li>
          <li>
            <router-link class="text-primary hover:underline" to="/reports"
              >{{ t('dashboard.quickLinks.reports') }}</router-link
            >
          </li>
        </ul>
      </Card>
    </div>
  </div>
</template>
