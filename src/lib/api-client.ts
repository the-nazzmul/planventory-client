import axios from "axios"
import type { InternalAxiosRequestConfig } from "axios"

import { API_BASE_URL } from "@/lib/config"
import { clearAuthStorage, getStoredAccessToken, setStoredAccessToken, setStoredUser } from "@/lib/auth-storage"
import type { ApiEnvelope, ApiFailureEnvelope, AuthUser } from "@/lib/types"

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

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const withStart: InternalAxiosRequestConfig & { metadata?: { start: number } } = config
  withStart.metadata = { start: Date.now() }
  const token = getStoredAccessToken()
  if (token) {
    withStart.headers.Authorization = `Bearer ${token}`
  }
  return withStart
})

apiClient.interceptors.response.use(
  (response) => {
    const cfg = response.config as InternalAxiosRequestConfig & { metadata?: { start: number } }
    const start = cfg.metadata?.start
    if (start) {
      const duration = Date.now() - start
      // #region agent log
      fetch("http://127.0.0.1:7798/ingest/ed65df61-9d62-411d-9ce6-72c29c10e956", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "103bcd",
        },
        body: JSON.stringify({
          sessionId: "103bcd",
          runId: "post-fix",
          hypothesisId: "C",
          location: "api-client.ts:response-ok",
          message: "api response",
          data: {
            path: cfg.url ?? "",
            method: cfg.method,
            durationMs: duration,
            status: response.status,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
    }
    return response
  },
  async (error) => {
    if (axios.isAxiosError(error) && error.config) {
      const cfg = error.config as InternalAxiosRequestConfig & { metadata?: { start: number } }
      const start = cfg.metadata?.start
      if (start) {
        const duration = Date.now() - start
        // #region agent log
        fetch("http://127.0.0.1:7798/ingest/ed65df61-9d62-411d-9ce6-72c29c10e956", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "103bcd",
          },
          body: JSON.stringify({
            sessionId: "103bcd",
            runId: "post-fix",
            hypothesisId: "E",
            location: "api-client.ts:response-err",
            message: "api error",
            data: {
              path: cfg.url ?? "",
              method: cfg.method,
              durationMs: duration,
              status: error.response?.status ?? null,
              code: error.code ?? null,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion
      }
    }
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
          .post<ApiEnvelope<{ accessToken: string; user?: AuthUser }>>("/auth/refresh", undefined, {
            timeout: 45_000,
          })
          .then((response) => {
            const token = response.data.data.accessToken
            setStoredAccessToken(token)
            const nextUser = response.data.data.user
            if (nextUser) {
              setStoredUser(nextUser)
            }
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
