import type { Project } from '@domain/project/types'
import type { User } from '@domain/user/types'

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

/** Локальная подзадача в черновом режиме (модалка редактирования); `id: null` — ещё не на сервере. */
export type DraftSubtask = {
  clientKey: string
  id: number | null
  title: string
  done: boolean
  position: number
}

/** Краткое представление заметки, связанной с задачей (API). */
export type LinkedNotePreview = {
  id: number
  title: string
}

export interface Task {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  project_id: number
  section_id: number | null
  position: number
  assignee_id: number | null
  due_date: string | null
  created_at: string
  updated_at: string
  project?: Project
  section?: { id: number; project_id: number; name: string; position: number } | null
  assignee?: User | null
  subtasks?: Subtask[]
  /** From API: caller can manage task fields (owner / manager / admin / staff). */
  caller_can_manage?: boolean
  /** From API: caller may change status (includes executors assigned to the task). */
  caller_can_change_status?: boolean
  /** Связанные заметки (список задач проекта / деталь задачи). */
  linked_notes?: LinkedNotePreview[]
  linked_notes_count?: number
  linked_note_preview?: LinkedNotePreview | null
}
