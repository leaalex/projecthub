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
