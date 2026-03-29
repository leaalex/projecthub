import { ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import type { User } from '../types/user'
import { api } from '../utils/api'

export type AssignableUserOption = {
  id: number
  email: string
  name: string
}

/** Lists all users for task assignee pickers (admin or staff; others get an empty list). */
export function useAdminAssignableUsers() {
  const auth = useAuthStore()
  const assignableUsers = ref<AssignableUserOption[]>([])

  async function refresh() {
    if (auth.user?.role !== 'admin' && auth.user?.role !== 'staff') {
      assignableUsers.value = []
      return
    }
    try {
      const { data } = await api.get<{ users: User[] }>('/users')
      assignableUsers.value = data.users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
      }))
    } catch {
      assignableUsers.value = []
    }
  }

  watch(() => auth.user?.role, refresh, { immediate: true })

  return { assignableUsers }
}
