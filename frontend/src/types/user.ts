export type UserRole = 'admin' | 'manager' | 'member'

export interface User {
  id: number
  email: string
  /** Display name (ФИО or legacy); from API */
  name: string
  role: UserRole
  last_name?: string
  first_name?: string
  patronymic?: string
  department?: string
  job_title?: string
  phone?: string
  created_at?: string
  updated_at?: string
}
