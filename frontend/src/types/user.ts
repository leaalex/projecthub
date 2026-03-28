export type UserRole = 'admin' | 'manager' | 'member'

export interface User {
  id: number
  email: string
  name: string
  role: UserRole
}
