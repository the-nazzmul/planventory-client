import axios from "axios"

import { API_BASE_URL } from "@/lib/config"
import { clearAuthStorage, getStoredAccessToken, setStoredAccessToken } from "@/lib/auth-storage"
import type { ApiEnvelope, ApiFailureEnvelope } from "@/lib/types"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

let isRefreshing = false
let refreshPromise: Promise<string> | null = null

function extractErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiFailureEnvelope | undefined
    return payload?.error?.message ?? error.message
  }
  if (error instanceof Error) return error.message
  return "Request failed"
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error)
    }

    const originalRequest = error.config
    const status = error.response?.status
    const isRefreshRoute = originalRequest?.url?.includes("/auth/refresh")

    if (!originalRequest || status !== 401 || originalRequest.headers["x-retried"] || isRefreshRoute) {
      return Promise.reject(error)
    }

    try {
      if (!isRefreshing) {
        isRefreshing = true
        refreshPromise = apiClient
          .post<ApiEnvelope<{ accessToken: string }>>("/auth/refresh")
          .then((response) => {
            const token = response.data.data.accessToken
            setStoredAccessToken(token)
            return token
          })
          .finally(() => {
            isRefreshing = false
          })
      }

      const accessToken = await refreshPromise
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      originalRequest.headers["x-retried"] = "1"
      return apiClient(originalRequest)
    } catch {
      clearAuthStorage()
      return Promise.reject(error)
    }
  },
)

export async function unwrapEnvelope<T>(request: Promise<{ data: ApiEnvelope<T> }>) {
  try {
    const response = await request
    return response.data.data
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}

export { apiClient }
