<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Breadcrumb from '../components/common/Breadcrumb.vue'
import ReportSettings from '../components/reports/ReportSettings.vue'
import ReportViewer from '../components/reports/ReportViewer.vue'
import { api } from '../utils/api'
import type { ReportConfig, WeeklyReport } from '../types/report'

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

function parseFilename(cd: string | undefined, fallback: string) {
  if (!cd) return fallback
  const m = /filename="([^"]+)"/.exec(cd)
  if (m?.[1]) return m[1]
  const m2 = /filename\*=UTF-8''([^;]+)/.exec(cd)
  if (m2?.[1]) return decodeURIComponent(m2[1])
  return fallback
}

async function onGenerate(cfg: ReportConfig) {
  generating.value = true
  msg.value = null
  const fallbackName = `tasks-report.${cfg.format}`
  try {
    const resp = await api.post<Blob>('/reports/generate', cfg, {
      responseType: 'blob',
    })
    const ct = resp.headers['content-type'] || ''
    if (ct.includes('application/json')) {
      const text = await resp.data.text()
      try {
        const j = JSON.parse(text) as { error?: string }
        msg.value = j.error ?? 'Could not generate report.'
      } catch {
        msg.value = 'Could not generate report.'
      }
      return
    }
    const url = URL.createObjectURL(resp.data)
    const a = document.createElement('a')
    a.href = url
    a.download = parseFilename(
      resp.headers['content-disposition'],
      fallbackName,
    )
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e: unknown) {
    const err = e as { response?: { data?: Blob; status?: number } }
    const blob = err.response?.data
    if (blob instanceof Blob) {
      const text = await blob.text()
      try {
        const j = JSON.parse(text) as { error?: string }
        msg.value = j.error ?? 'Could not generate report.'
      } catch {
        msg.value = 'Could not generate report.'
      }
    } else {
      msg.value = 'Could not generate report.'
    }
  } finally {
    generating.value = false
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
    <p class="mt-1 text-sm text-muted">
      Weekly overview and configurable exports
    </p>

    <p
      v-if="msg"
      class="mt-4 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
    >
      {{ msg }}
    </p>

    <div class="mt-6 space-y-6">
      <ReportViewer :report="report" :loading="loading" />
      <ReportSettings :generating="generating" @generate="onGenerate" />
    </div>
  </div>
</template>
