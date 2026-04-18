import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { AUTH_TOKEN_KEY } from '../constants'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshInflight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInflight) {
    refreshInflight = (async () => {
      try {
        const { data } = await api.post<{ access_token: string }>(
          '/auth/refresh',
          {},
          { headers: { 'X-Skip-Refresh': '1' } },
        )
        const t = data.access_token
        localStorage.setItem(AUTH_TOKEN_KEY, t)
        return t
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        return null
      } finally {
        refreshInflight = null
      }
    })()
  }
  return refreshInflight
}

function isAuthPath(url: string | undefined) {
  if (!url) return false
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout')
  )
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const cfg = err.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }
    if (!cfg) return Promise.reject(err)
    if (cfg.headers?.['X-Skip-Refresh']) return Promise.reject(err)
    if (isAuthPath(cfg.url)) return Promise.reject(err)

    const status = err.response?.status
    if (status === 401 && !cfg._retry) {
      cfg._retry = true
      const newToken = await refreshAccessToken()
      if (!newToken) return Promise.reject(err)
      cfg.headers.Authorization = `Bearer ${newToken}`
      return api(cfg)
    }
    return Promise.reject(err)
  },
)
