import type { Project } from './project'
import type { User } from './user'

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  project_id: number
  assignee_id: number | null
  due_date: string | null
  created_at: string
  updated_at: string
  project?: Project
  assignee?: User | null
}
