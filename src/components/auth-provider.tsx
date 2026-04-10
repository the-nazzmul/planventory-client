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
    if (cachedUser && getStoredAccessToken()) {
      setUser(cachedUser)
      setIsLoading(false)
      return
    }

    authApi
      .refreshSession()
      .then(() => {
        const fallbackUser = getStoredUser() as AuthUser | null
        if (fallbackUser) setUser(fallbackUser)
      })
      .catch(() => {
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
