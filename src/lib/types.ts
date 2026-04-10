export type ApiErrorShape = {
  code: string
  message: string
  details?: unknown
}

export type ApiEnvelope<T> = {
  success: true
  data: T
  meta?: Record<string, unknown>
}

export type ApiFailureEnvelope = {
  success: false
  error: ApiErrorShape
}

export type AuthUser = {
  id: string
  email: string
  name: string
  role: "SUPER_ADMIN" | "MANAGER" | "STAFF"
}
