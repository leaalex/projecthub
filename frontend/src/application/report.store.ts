import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ReportConfig, SavedReport, WeeklyReport } from '@domain/report/types'
import { healthApi, reportsApi } from '@infra/api/reports'

function parseFilename(cd: string | undefined, fallback: string): string {
  if (!cd) return fallback
  const m = /filename="([^"]+)"/.exec(cd)
  if (m?.[1]) return m[1]
  const m2 = /filename\*=UTF-8''([^;]+)/.exec(cd)
  if (m2?.[1]) return decodeURIComponent(m2[1])
  return fallback
}

/** Parse axios-style error body for `error` string (used by views for toasts/messages). */
export function extractReportAxiosError(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { error?: string } } }
  const msg = err.response?.data?.error
  return typeof msg === 'string' ? msg : fallback
}

export type ReportDownloadResult =
  | { ok: true; blob: Blob; filename: string }
  | { ok: false; apiMessage?: string }

export const useReportStore = defineStore('report', () => {
  const weekly = ref<WeeklyReport | null>(null)
  const savedReports = ref<SavedReport[]>([])
  const health = ref<string | null>(null)

  const weeklyLoading = ref(false)
  const exportsLoading = ref(false)
  const healthLoading = ref(false)
  const generating = ref(false)
  const deletingId = ref<number | null>(null)

  async function loadWeekly(): Promise<void> {
    weeklyLoading.value = true
    try {
      const { data } = await reportsApi.weekly()
      weekly.value = data
    } finally {
      weeklyLoading.value = false
    }
  }

  async function loadExports(): Promise<void> {
    exportsLoading.value = true
    try {
      const { data } = await reportsApi.exports.list()
      savedReports.value = Array.isArray(data.reports) ? data.reports : []
    } catch {
      savedReports.value = []
    } finally {
      exportsLoading.value = false
    }
  }

  async function loadHealth(): Promise<void> {
    healthLoading.value = true
    try {
      const { data } = await healthApi.check()
      health.value = data.status
    } catch {
      health.value = null
    } finally {
      healthLoading.value = false
    }
  }

  async function generate(cfg: ReportConfig): Promise<void> {
    generating.value = true
    try {
      await reportsApi.exports.generate(cfg)
      await loadExports()
    } finally {
      generating.value = false
    }
  }

  async function remove(id: number): Promise<void> {
    deletingId.value = id
    try {
      await reportsApi.exports.remove(id)
      await loadExports()
    } finally {
      deletingId.value = null
    }
  }

  async function downloadFile(
    exportId: number,
    fallbackFilename: string,
  ): Promise<ReportDownloadResult> {
    try {
      const resp = await reportsApi.exports.download(exportId)
      const ct = (resp.headers['content-type'] || '') as string
      if (ct.includes('application/json')) {
        const text = await resp.data.text()
        try {
          const j = JSON.parse(text) as { error?: string }
          return {
            ok: false,
            apiMessage:
              typeof j.error === 'string' ? j.error : undefined,
          }
        } catch {
          return { ok: false }
        }
      }
      const filename = parseFilename(
        resp.headers['content-disposition'] as string | undefined,
        fallbackFilename,
      )
      return { ok: true, blob: resp.data, filename }
    } catch (e: unknown) {
      const err = e as { response?: { data?: Blob } }
      const blob = err.response?.data
      if (blob instanceof Blob) {
        const text = await blob.text()
        try {
          const j = JSON.parse(text) as { error?: string }
          return {
            ok: false,
            apiMessage:
              typeof j.error === 'string' ? j.error : undefined,
          }
        } catch {
          return { ok: false }
        }
      }
      return { ok: false }
    }
  }

  return {
    weekly,
    savedReports,
    health,
    weeklyLoading,
    exportsLoading,
    healthLoading,
    generating,
    deletingId,
    loadWeekly,
    loadExports,
    loadHealth,
    generate,
    remove,
    downloadFile,
  }
})
