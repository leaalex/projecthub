import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { AUTH_TOKEN_KEY } from '../constants'
import type { User } from '@domain/user/types'
import { authApi, meApi } from '@infra/api/auth'
import { usersApi } from '@infra/api/users'

export type UserProfilePayload = {
  email?: string
  name?: string
  last_name?: string
  first_name?: string
  patronymic?: string
  department?: string
  job_title?: string
  phone?: string
  locale?: 'ru' | 'en'
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(AUTH_TOKEN_KEY))
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => Boolean(token.value))

  function setToken(value: string | null) {
    token.value = value
    if (value) {
      localStorage.setItem(AUTH_TOKEN_KEY, value)
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY)
    }
  }

  async function login(email: string, password: string) {
    const { data } = await authApi.login(email, password)
    setToken(data.access_token)
    user.value = data.user
  }

  async function register(email: string, password: string, name: string) {
    const { data } = await authApi.register(email, password, name)
    setToken(data.access_token)
    user.value = data.user
  }

  async function fetchMe() {
    const { data } = await meApi.get()
    user.value = data.user
  }

  async function restoreSession() {
    if (!token.value) {
      try {
        const { data } = await authApi.refresh()
        setToken(data.access_token)
      } catch {
        user.value = null
        return
      }
    }
    try {
      await fetchMe()
    } catch {
      setToken(null)
      user.value = null
    }
  }

  async function logout() {
    setToken(null)
    user.value = null
    try {
      await authApi.logout()
    } catch {
      /* ignore — локальная сессия уже очищена */
    }
  }

  async function updateProfile(patch: UserProfilePayload) {
    if (!user.value) return
    const { data } = await usersApi.update(user.value.id, patch)
    user.value = data.user
  }

  async function changePassword(current_password: string, new_password: string) {
    await meApi.changePassword({ current_password, new_password })
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    fetchMe,
    restoreSession,
    logout,
    updateProfile,
    changePassword,
  }
})
