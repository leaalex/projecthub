<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
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
import { useConfirm } from '@app/composables/useConfirm'
import { useToast } from '@app/composables/useToast'
import {
  extractReportAxiosError,
  useReportStore,
} from '@app/report.store'
import { formatDateShort } from '@infra/formatters/date'
import { mapApiError } from '@infra/api/errorMap'
import type { ReportConfig, SavedReport } from '@domain/report/types'

const { t, locale } = useI18n()

const reportStore = useReportStore()
const {
  weekly,
  savedReports,
  weeklyLoading,
  exportsLoading,
  generating,
  deletingId,
} = storeToRefs(reportStore)

const msg = ref<string | null>(null)

const { confirm } = useConfirm()
const toast = useToast()

const modalOpen = ref(false)

const reportSettingsRef = useTemplateRef<{
  submit: () => void
  canSubmit: boolean
  isDirty: boolean
}>('reportSettings')

const createReportDirty = computed(
  () => modalOpen.value && Boolean(reportSettingsRef.value?.isDirty),
)

async function loadWeeklyPage() {
  msg.value = null
  try {
    await reportStore.loadWeekly()
  } catch {
    msg.value = t('reports.toasts.loadFailed')
  }
}

onMounted(async () => {
  await loadWeeklyPage()
  await reportStore.loadExports()
})

function formatBytes(n: number): string {
  if (n < 1024) return t('common.bytes.b', { n })
  if (n < 1024 * 1024)
    return t('common.bytes.kb', { n: (n / 1024).toFixed(1) })
  return t('common.bytes.mb', { n: (n / (1024 * 1024)).toFixed(1) })
}

async function onCreateReport(cfg: ReportConfig) {
  msg.value = null
  try {
    await reportStore.generate(cfg)
    modalOpen.value = false
  } catch (e: unknown) {
    msg.value = extractReportAxiosError(e, 'reports.toasts.createFailed')
  }
}

async function downloadSaved(r: SavedReport) {
  msg.value = null
  const fallback = r.display_name || `report.${r.format}`
  const result = await reportStore.downloadFile(r.id, fallback)
  if (!result.ok) {
    msg.value = mapApiError(
      { response: { data: { error: result.apiMessage } } },
      'reports.toasts.downloadFailed',
    )
    return
  }
  const url = URL.createObjectURL(result.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = result.filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function deleteSaved(r: SavedReport) {
  const ok = await confirm({
    title: t('reports.confirm.deleteTitle'),
    message: t('reports.confirm.deleteMessage', { name: r.display_name }),
    confirmLabelKey: 'reports.confirm.deleteConfirm',
    danger: true,
  })
  if (!ok) return
  msg.value = null
  try {
    await reportStore.remove(r.id)
    toast.success(t('reports.toasts.deleted'))
  } catch (e: unknown) {
    msg.value = extractReportAxiosError(e, 'reports.toasts.deleteFailed')
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
      <ReportViewer :report="weekly" :loading="weeklyLoading" />

      <Card padding="p-4">
        <h2 class="text-lg font-semibold text-foreground">{{ t('reports.saved.title') }}</h2>
        <p class="mt-1 text-sm text-muted">
          {{ t('reports.saved.subtitle') }}
        </p>

        <div v-if="exportsLoading" class="mt-4 space-y-3">
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
              {{ formatDateShort(r.created_at, locale) }}
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

    <Modal
      v-model="modalOpen"
      :title="t('reports.modal.newTitle')"
      :dirty="createReportDirty"
    >
      <ReportSettings
        v-if="modalOpen"
        ref="reportSettings"
        :generating="generating"
        hide-submit-button
        @generate="onCreateReport"
      />
      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            :disabled="generating"
            @click="modalOpen = false"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button
            type="button"
            :disabled="!reportSettingsRef?.canSubmit"
            :loading="generating"
            @click="reportSettingsRef?.submit()"
          >
            {{
              generating
                ? t('reportSettings.generating')
                : t('reportSettings.generate')
            }}
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
