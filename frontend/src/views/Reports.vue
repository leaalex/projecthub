<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Breadcrumb from '../components/common/Breadcrumb.vue'
import ReportGenerator from '../components/reports/ReportGenerator.vue'
import ReportViewer from '../components/reports/ReportViewer.vue'
import { api } from '../utils/api'
import type { WeeklyReport } from '../types/report'

const report = ref<WeeklyReport | null>(null)
const loading = ref(true)
const generating = ref(false)
const msg = ref<string | null>(null)

async function loadWeekly() {
  loading.value = true
  msg.value = null
  try {
    const { data } = await api.get<WeeklyReport>('/reports/weekly')
    report.value = data
  } catch {
    msg.value = 'Could not load report.'
  } finally {
    loading.value = false
  }
}

onMounted(() => loadWeekly())

async function onGenerate() {
  generating.value = true
  msg.value = null
  try {
    await api.post('/reports/generate', { title: 'custom' })
    msg.value = 'Report queued (stub).'
  } catch {
    msg.value = 'Request failed.'
  } finally {
    generating.value = false
  }
}

async function onPdf() {
  try {
    await api.get('/reports/1/pdf')
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { error?: string } } }
    if (err.response?.status === 501) {
      msg.value = err.response.data?.error ?? 'PDF not implemented (501).'
    } else {
      msg.value = 'PDF download unavailable.'
    }
  }
}

async function onExcel() {
  try {
    await api.get('/reports/1/excel')
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { error?: string } } }
    if (err.response?.status === 501) {
      msg.value = err.response.data?.error ?? 'Excel not implemented (501).'
    } else {
      msg.value = 'Excel download unavailable.'
    }
  }
}
</script>

<template>
  <div>
    <Breadcrumb
      class="mb-4"
      :items="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Reports' },
      ]"
    />
    <h1 class="text-2xl font-semibold text-foreground">Reports</h1>
    <p class="mt-1 text-sm text-muted">Weekly overview and export (stubs)</p>

    <p v-if="msg" class="mt-4 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground">
      {{ msg }}
    </p>

    <div class="mt-6 space-y-6">
      <ReportViewer :report="report" :loading="loading" />
      <ReportGenerator
        :generating="generating"
        @generate="onGenerate"
        @download-pdf="onPdf"
        @download-excel="onExcel"
      />
    </div>
  </div>
</template>
