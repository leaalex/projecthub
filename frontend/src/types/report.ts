export interface WeeklyReport {
  week_start: string
  week_end: string
  total_tasks: number
  by_status: Record<string, number>
  completed_in_week: number
  projects_count: number
}
