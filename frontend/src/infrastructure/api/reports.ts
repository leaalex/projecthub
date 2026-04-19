import type { ReportConfig, SavedReport, WeeklyReport } from '@domain/report/types'
import { api } from '@infra/http/client'

/**
 * Проверка живости API (`/health`).
 */
export const healthApi = {
  /**
   * Статус сервиса.
   * @http GET /health
   */
  check: () => api.get<{ status: string }>('/health'),
}

/**
 * Отчёты: недельный снимок и сохранённые экспорты (`/reports/*`).
 */
export const reportsApi = {
  /**
   * Недельный отчёт по задачам.
   * @http GET /reports/weekly
   */
  weekly: () => api.get<WeeklyReport>('/reports/weekly'),

  /**
   * Сохранённые экспорты отчётов.
   */
  exports: {
    /**
     * Список сохранённых экспортов.
     * @http GET /reports/exports
     */
    list: () => api.get<{ reports: SavedReport[] }>('/reports/exports'),

    /**
     * Запустить генерацию отчёта по конфигурации.
     * @http POST /reports/generate
     */
    generate: (cfg: ReportConfig) => api.post('/reports/generate', cfg),

    /**
     * Скачать файл экспорта (бинарный ответ).
     * @http GET /reports/exports/:id/download
     */
    download: (exportId: number) =>
      api.get<Blob>(`/reports/exports/${exportId}/download`, {
        responseType: 'blob',
      }),

    /**
     * Удалить сохранённый экспорт.
     * @http DELETE /reports/exports/:id
     */
    remove: (exportId: number) => api.delete(`/reports/exports/${exportId}`),
  },
}
