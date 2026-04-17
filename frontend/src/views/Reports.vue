<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Breadcrumb from '../components/ui/UiBreadcrumb.vue'
import Button from '../components/ui/UiButton.vue'
import EmptyState from '../components/ui/UiEmptyState.vue'
import Modal from '../components/ui/UiModal.vue'
import Skeleton from '../components/ui/UiSkeleton.vue'
import ReportSettings from '../components/reports/ReportSettings.vue'
import ReportViewer from '../components/reports/ReportViewer.vue'
import Card from '../components/ui/UiCard.vue'
import Table from '../components/ui/UiTable.vue'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import { api } from '../utils/api'
import { formatDateShort } from '../utils/formatters'
import type { ReportConfig, SavedReport, WeeklyReport } from '../types/report'

const { t } = useI18n()

const report = ref<WeeklyReport | null>(null)
const loading = ref(true)
const generating = ref(false)
const msg = ref<string | null>(null)

const { confirm } = useConfirm()
const toast = useToast()

const modalOpen = ref(false)
const savedReports = ref<SavedReport[]>([])
const loadingExports = ref(false)
const deletingId = ref<number | null>(null)

async function loadWeekly() {
  loading.value = true
  msg.value = null
  try {
    const { data } = await api.get<WeeklyReport>('/reports/weekly')
    report.value = data
  } catch {
    msg.value = t('reports.toasts.loadFailed')
  } finally {
    loading.value = false
  }
}

async function loadExports() {
  loadingExports.value = true
  try {
    const { data } = await api.get<{ reports: SavedReport[] }>('/reports/exports')
    savedReports.value = data.reports
  } catch {
    savedReports.value = []
  } finally {
    loadingExports.value = false
  }
}

onMounted(async () => {
  await loadWeekly()
  await loadExports()
})

function parseFilename(cd: string | undefined, fallback: string) {
  if (!cd) return fallback
  const m = /filename="([^"]+)"/.exec(cd)
  if (m?.[1]) return m[1]
  const m2 = /filename\*=UTF-8''([^;]+)/.exec(cd)
  if (m2?.[1]) return decodeURIComponent(m2[1])
  return fallback
}

function formatBytes(n: number): string {
  if (n < 1024) return t('common.bytes.b', { n })
  if (n < 1024 * 1024)
    return t('common.bytes.kb', { n: (n / 1024).toFixed(1) })
  return t('common.bytes.mb', { n: (n / (1024 * 1024)).toFixed(1) })
}

async function onCreateReport(cfg: ReportConfig) {
  generating.value = true
  msg.value = null
  try {
    await api.post('/reports/generate', cfg)
    modalOpen.value = false
    await loadExports()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    msg.value = err.response?.data?.error ?? t('reports.toasts.createFailed')
  } finally {
    generating.value = false
  }
}

async function downloadSaved(r: SavedReport) {
  msg.value = null
  const fallback = r.display_name || `report.${r.format}`
  try {
    const resp = await api.get<Blob>(
      `/reports/exports/${r.id}/download`,
      { responseType: 'blob' },
    )
    const ct = resp.headers['content-type'] || ''
    if (ct.includes('application/json')) {
      const text = await resp.data.text()
      try {
        const j = JSON.parse(text) as { error?: string }
        msg.value = j.error ?? t('reports.toasts.downloadFailed')
      } catch {
        msg.value = t('reports.toasts.downloadFailed')
      }
      return
    }
    const url = URL.createObjectURL(resp.data)
    const a = document.createElement('a')
    a.href = url
    a.download = parseFilename(
      resp.headers['content-disposition'],
      fallback,
    )
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e: unknown) {
    const err = e as { response?: { data?: Blob } }
    const blob = err.response?.data
    if (blob instanceof Blob) {
      const text = await blob.text()
      try {
        const j = JSON.parse(text) as { error?: string }
        msg.value = j.error ?? t('reports.toasts.downloadFailed')
      } catch {
        msg.value = t('reports.toasts.downloadFailed')
      }
    } else {
      msg.value = t('reports.toasts.downloadFailed')
    }
  }
}

async function deleteSaved(r: SavedReport) {
  const ok = await confirm({
    title: t('reports.confirm.deleteTitle'),
    message: t('reports.confirm.deleteMessage', { name: r.display_name }),
    confirmLabel: t('reports.confirm.deleteConfirm'),
    danger: true,
  })
  if (!ok) return
  msg.value = null
  deletingId.value = r.id
  try {
    await api.delete(`/reports/exports/${r.id}`)
    await loadExports()
    toast.success(t('reports.toasts.deleted'))
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    msg.value = err.response?.data?.error ?? t('reports.toasts.deleteFailed')
  } finally {
    deletingId.value = null
  }
}

const tableHeaders = computed(() => [
  t('reports.table.name'),
  t('reports.table.format'),
  t('reports.table.size'),
  t('reports.table.created'),
  t('reports.table.actions'),
])
</script>

<template>
  <div>
    <Breadcrumb
      class="mb-4"
      :items="[
        { label: t('common.home'), to: '/dashboard' },
        { label: t('reports.title') },
      ]"
    />
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">{{ t('reports.title') }}</h1>
        <p class="mt-1 text-sm text-muted">
          {{ t('reports.subtitle') }}
        </p>
      </div>
      <Button type="button" @click="modalOpen = true">{{ t('reports.newReport') }}</Button>
    </div>

    <p
      v-if="msg"
      class="mt-4 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
    >
      {{ msg }}
    </p>

    <div class="mt-6 space-y-6">
      <ReportViewer :report="report" :loading="loading" />

      <Card padding="p-4">
        <h2 class="text-lg font-semibold text-foreground">{{ t('reports.saved.title') }}</h2>
        <p class="mt-1 text-sm text-muted">
          {{ t('reports.saved.subtitle') }}
        </p>

        <div v-if="loadingExports" class="mt-4 space-y-3">
          <Skeleton v-for="i in 3" :key="i" variant="line" />
        </div>
        <EmptyState
          v-else-if="!savedReports.length"
          class="mt-4"
          :title="t('reports.empty.title')"
          :description="t('reports.empty.description')"
        />
        <Table
          v-else
          class="mt-4"
          :headers="tableHeaders"
        >
          <tr
            v-for="r in savedReports"
            :key="r.id"
            class="hover:bg-surface-muted"
          >
            <td class="px-4 py-3 font-medium text-foreground">
              {{ r.display_name }}
            </td>
            <td class="px-4 py-3 uppercase">{{ r.format }}</td>
            <td class="px-4 py-3 text-muted">{{ formatBytes(r.size_bytes) }}</td>
            <td class="px-4 py-3 text-muted">
              {{ formatDateShort(r.created_at) }}
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  @click="downloadSaved(r)"
                >
                  {{ t('reports.download') }}
                </Button>
                <Button
                  type="button"
                  variant="ghost-danger"
                  :loading="deletingId === r.id"
                  :disabled="deletingId !== null && deletingId !== r.id"
                  @click="deleteSaved(r)"
                >
                  {{ t('reports.delete') }}
                </Button>
              </div>
            </td>
          </tr>
        </Table>
      </Card>
    </div>

    <Modal v-model="modalOpen" :title="t('reports.modal.newTitle')" wide>
      <ReportSettings :generating="generating" @generate="onCreateReport" />
    </Modal>
  </div>
</template>
