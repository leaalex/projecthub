import type { Task } from '@domain/task/types'

/** Subset of user returned with project (from API preload). */
export interface ProjectOwner {
  id: number
  email: string
  name: string
}

export type ProjectMemberRole = 'manager' | 'executor' | 'viewer'

export interface ProjectMemberUser {
  id: number
  email: string
  name: string
}

export type ProjectKind = 'personal' | 'team'

export interface ProjectMember {
  id: number
  project_id: number
  user_id: number
  role: ProjectMemberRole
  user: ProjectMemberUser
  created_at: string
}

export interface Project {
  id: number
  name: string
  description: string
  kind: ProjectKind
  owner_id: number
  owner?: ProjectOwner | null
  created_at: string
  updated_at: string
  /** Set on GET /projects/:id when present. */
  caller_project_role?:
    | 'admin'
    | 'staff'
    | 'owner'
    | 'manager'
    | 'executor'
    | 'viewer'
}

export type TaskTransferMode = 'unassigned' | 'single_user' | 'manual'

export interface TaskTransferRequest {
  transfer_mode: TaskTransferMode
  transfer_to_user_id?: number
}

export interface TaskTransfer {
  task_id: number
  assignee_id: number
}

export interface RemoveMemberResult {
  success: boolean
  member_id?: number
  task_count?: number
  tasks?: Task[]
  transferred?: number
}

/** Общие секции проекта (`project_sections`) — для задач и заметок. */
export interface ProjectSection {
  id: number
  project_id: number
  name: string
  position: number
  created_at: string
  updated_at: string
}

/** @deprecated Используйте `ProjectSection`. */
export type TaskSection = ProjectSection

export interface TaskMovePayload {
  task_id: number
  section_id?: number | null
  position?: number
}
