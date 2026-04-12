"use client"

import * as React from "react"

import {
  clearAuthStorage,
  getStoredAccessToken,
  getStoredUser,
  setStoredUser,
} from "@/lib/auth-storage"
import * as authApi from "@/lib/api/auth"
import type { AuthUser } from "@/lib/types"

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const cachedUser = getStoredUser() as AuthUser | null
    const hasToken = Boolean(getStoredAccessToken())
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
        hypothesisId: "A",
        location: "auth-provider.tsx:init",
        message: "auth bootstrap start",
        data: {
          hasCachedUser: Boolean(cachedUser),
          hasAccessToken: hasToken,
          branch: cachedUser && hasToken ? "fast-path" : "refresh-path",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    if (cachedUser && getStoredAccessToken()) {
      setUser(cachedUser)
      setIsLoading(false)
      return
    }

    const refreshStarted = Date.now()
    authApi
      .refreshSession()
      .then(() => {
        const fallbackUser = getStoredUser() as AuthUser | null
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
            hypothesisId: "B",
            location: "auth-provider.tsx:refresh-then",
            message: "refresh resolved",
            data: {
              ms: Date.now() - refreshStarted,
              hasUserInStorageAfter: Boolean(fallbackUser),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion
        if (fallbackUser) setUser(fallbackUser)
      })
      .catch((err) => {
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
            hypothesisId: "B",
            location: "auth-provider.tsx:refresh-catch",
            message: "refresh failed",
            data: {
              ms: Date.now() - refreshStarted,
              err: err instanceof Error ? err.message : "unknown",
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion
        clearAuthStorage()
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const login = React.useCallback(
    async (payload: { email: string; password: string }) => {
      const result = await authApi.login(payload)
      setStoredUser(result.user)
      setUser(result.user)
    },
    [],
  )

  const logout = React.useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [isLoading, login, logout, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return context
}
