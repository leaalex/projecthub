import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { AUTH_TOKEN_KEY } from '../constants'
import type { User } from '../types/user'
import { api } from '../utils/api'

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
    const { data } = await api.post<{ token: string; user: User }>(
      '/auth/login',
      { email, password },
    )
    setToken(data.token)
    user.value = data.user
  }

  async function register(email: string, password: string, name: string) {
    const { data } = await api.post<{ token: string; user: User }>(
      '/auth/register',
      { email, password, name },
    )
    setToken(data.token)
    user.value = data.user
  }

  async function fetchMe() {
    const { data } = await api.get<{ user: User }>('/me')
    user.value = data.user
  }

  async function restoreSession() {
    if (!token.value) {
      user.value = null
      return
    }
    try {
      await fetchMe()
    } catch {
      setToken(null)
      user.value = null
    }
  }

  function logout() {
    setToken(null)
    user.value = null
  }

  async function updateProfile(patch: UserProfilePayload) {
    if (!user.value) return
    const { data } = await api.put<{ user: User }>(
      `/users/${user.value.id}`,
      patch,
    )
    user.value = data.user
  }

  async function changePassword(current_password: string, new_password: string) {
    await api.post('/me/password', { current_password, new_password })
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
