/** Subset of user returned with project (from API preload). */
export interface ProjectOwner {
  id: number
  email: string
  name: string
}

export interface Project {
  id: number
  name: string
  description: string
  owner_id: number
  owner?: ProjectOwner | null
  created_at: string
  updated_at: string
}
