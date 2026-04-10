const ACCESS_TOKEN_KEY = "planventory.accessToken"
const AUTH_USER_KEY = "planventory.authUser"

export function getStoredAccessToken() {
  if (typeof window === "undefined") return ""
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? ""
}

export function setStoredAccessToken(token: string) {
  if (typeof window === "undefined") return
  if (!token) {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    return
  }
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function getStoredUser() {
  if (typeof window === "undefined") return null
  const raw = window.sessionStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setStoredUser(user: unknown) {
  if (typeof window === "undefined") return
  if (!user) {
    window.sessionStorage.removeItem(AUTH_USER_KEY)
    return
  }
  window.sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function clearAuthStorage() {
  setStoredAccessToken("")
  setStoredUser(null)
}
