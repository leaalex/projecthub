import type { TaskPriority, TaskStatus } from './task'

export interface WeeklyReport {
  week_start: string
  week_end: string
  total_tasks: number
  by_status: Record<string, number>
  completed_in_week: number
  projects_count: number
}

export type ReportFormat = 'csv' | 'xlsx' | 'pdf'

export type ReportGroupBy =
  | ''
  | 'project'
  | 'status'
  | 'priority'
  | 'assignee'

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
}
