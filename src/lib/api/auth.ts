import { clearAuthStorage, setStoredAccessToken, setStoredUser } from "@/lib/auth-storage"
import { apiClient, unwrapEnvelope } from "@/lib/api-client"
import type { ApiEnvelope, AuthUser } from "@/lib/types"

type LoginPayload = {
  email: string
  password: string
}

type LoginResponse = {
  accessToken: string
  user: AuthUser
}

export async function login(payload: LoginPayload) {
  const data = await unwrapEnvelope(
    apiClient.post<ApiEnvelope<LoginResponse>>("/auth/login", payload),
  )
  setStoredAccessToken(data.accessToken)
  setStoredUser(data.user)
  return data
}

export async function refreshSession() {
  const data = await unwrapEnvelope(
    apiClient.post<ApiEnvelope<{ accessToken: string; user?: AuthUser }>>("/auth/refresh", undefined, {
      timeout: 45_000,
    }),
  )
  setStoredAccessToken(data.accessToken)
  if (data.user) {
    setStoredUser(data.user)
  }
  return data.accessToken
}

export async function logout() {
  try {
    await unwrapEnvelope(
      apiClient.post<ApiEnvelope<{ loggedOut: true }>>("/auth/logout"),
    )
  } finally {
    clearAuthStorage()
  }
}

export async function changePassword(payload: {
  currentPassword: string
  newPassword: string
}) {
  return unwrapEnvelope(
    apiClient.patch<ApiEnvelope<{ changed: true }>>("/auth/change-password", payload),
  )
}
