import type { TaskPriority, TaskStatus } from '@domain/task/types'

export interface WeeklyReport {
  week_start: string
  week_end: string
  total_tasks: number
  by_status: Record<string, number>
  completed_in_week: number
  projects_count: number
}

export type ReportFormat = 'csv' | 'xlsx' | 'pdf' | 'txt'

/** PDF export: grid vs one block per task (UTF-8 text). */
export type ReportPdfLayout = 'table' | 'list'

export type ReportGroupBy =
  | ''
  | 'project'
  | 'status'
  | 'priority'
  | 'assignee'

/** Saved export row from GET /reports/exports */
export interface SavedReport {
  id: number
  user_id: number
  display_name: string
  format: ReportFormat
  size_bytes: number
  created_at: string
}

/** Payload for POST /api/reports/generate */
export interface ReportConfig {
  format: ReportFormat
  date_from?: string
  date_to?: string
  project_ids: number[]
  user_ids: number[]
  statuses: TaskStatus[]
  priorities: TaskPriority[]
  fields: string[]
  group_by: ReportGroupBy
  /** Only for format === 'pdf'. Default on server: table. */
  pdf_layout?: ReportPdfLayout
}
