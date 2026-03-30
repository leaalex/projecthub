import type { Project } from './project'
import type { User } from './user'

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Subtask {
  id: number
  task_id: number
  title: string
  done: boolean
  position: number
  created_at: string
  updated_at: string
}

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
  subtasks?: Subtask[]
  /** From API: caller can manage task fields (owner / manager / admin / staff). */
  caller_can_manage?: boolean
  /** From API: caller may change status (includes executors assigned to the task). */
  caller_can_change_status?: boolean
}
