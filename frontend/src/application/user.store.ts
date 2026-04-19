import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User, UserRole } from '@domain/user/types'
import { usersApi } from '@infra/api/users'

/** Parse axios-style error body for `error` string (used by views for toasts/messages). */
export function extractUserAxiosError(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { error?: string } } }
  const msg = err.response?.data?.error
  return typeof msg === 'string' ? msg : fallback
}

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const creating = ref(false)
  const savingId = ref<number | null>(null)
  const deletingId = ref<number | null>(null)

  async function fetchList(options?: { quiet?: boolean }): Promise<void> {
    const quiet = options?.quiet === true
    if (!quiet) loading.value = true
    try {
      const { data } = await usersApi.list()
      users.value = Array.isArray(data.users) ? data.users : []
    } finally {
      if (!quiet) loading.value = false
    }
  }

  async function create(body: Record<string, unknown>): Promise<User> {
    creating.value = true
    try {
      const { data } = await usersApi.create(body)
      await fetchList({ quiet: true })
      return data.user
    } finally {
      creating.value = false
    }
  }

  async function update(
    id: number,
    patch: Record<string, unknown>,
  ): Promise<User> {
    savingId.value = id
    try {
      const { data } = await usersApi.update(id, patch)
      await fetchList({ quiet: true })
      return data.user
    } finally {
      savingId.value = null
    }
  }

  async function updateRole(id: number, role: UserRole): Promise<void> {
    savingId.value = id
    try {
      await usersApi.setRole(id, role)
      await fetchList({ quiet: true })
    } finally {
      savingId.value = null
    }
  }

  async function remove(id: number): Promise<void> {
    deletingId.value = id
    try {
      await usersApi.remove(id)
      await fetchList({ quiet: true })
    } finally {
      deletingId.value = null
    }
  }

  return {
    users,
    loading,
    creating,
    savingId,
    deletingId,
    fetchList,
    create,
    update,
    updateRole,
    remove,
  }
})
