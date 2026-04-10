import { apiClient, unwrapEnvelope } from "@/lib/api-client"
import type { ApiEnvelope } from "@/lib/types"

type ListQuery = {
  cursor?: string
  limit?: number
  search?: string
}

type PaginatedPayload<T> = {
  data?: T[]
  items?: T[]
  meta?: {
    cursor?: string | null
    hasMore?: boolean
    total?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}

export type CollectionResult<T> = {
  items: T[]
  meta: {
    cursor: string | null
    hasMore: boolean
    total: number | null
  }
}

export async function getCollection<T>(
  path: string,
  query: ListQuery = {},
): Promise<CollectionResult<T>> {
  const response = await apiClient.get<ApiEnvelope<PaginatedPayload<T> | T[]>>(path, {
    params: query,
  })
  const envelope = response.data
  const data = envelope.data
  const envelopeMeta = envelope.meta ?? {}

  if (Array.isArray(data)) {
    return {
      items: data,
      meta: {
        cursor: typeof envelopeMeta.cursor === "string" ? envelopeMeta.cursor : null,
        hasMore: typeof envelopeMeta.hasMore === "boolean" ? envelopeMeta.hasMore : false,
        total: typeof envelopeMeta.total === "number" ? envelopeMeta.total : data.length,
      },
    }
  }
  if (Array.isArray(data.data)) {
    return {
      items: data.data,
      meta: {
        cursor:
          typeof envelopeMeta.cursor === "string"
            ? envelopeMeta.cursor
            : (data.meta?.cursor ?? null),
        hasMore:
          typeof envelopeMeta.hasMore === "boolean"
            ? envelopeMeta.hasMore
            : Boolean(data.meta?.hasMore),
        total:
          typeof envelopeMeta.total === "number"
            ? envelopeMeta.total
            : (typeof data.meta?.total === "number" ? data.meta.total : null),
      },
    }
  }
  if (Array.isArray(data.items)) {
    return {
      items: data.items,
      meta: {
        cursor:
          typeof envelopeMeta.cursor === "string"
            ? envelopeMeta.cursor
            : (data.meta?.cursor ?? null),
        hasMore:
          typeof envelopeMeta.hasMore === "boolean"
            ? envelopeMeta.hasMore
            : Boolean(data.meta?.hasMore),
        total:
          typeof envelopeMeta.total === "number"
            ? envelopeMeta.total
            : (typeof data.meta?.total === "number" ? data.meta.total : null),
      },
    }
  }

  for (const value of Object.values(data)) {
    if (Array.isArray(value)) {
      return {
        items: value as T[],
        meta: { cursor: null, hasMore: false, total: value.length },
      }
    }
  }
  return {
    items: [],
    meta: { cursor: null, hasMore: false, total: 0 },
  }
}

export async function createResource<T>(path: string, payload: Record<string, unknown>) {
  return unwrapEnvelope(
    apiClient.post<ApiEnvelope<T>>(path, payload),
  )
}

export async function getResource<T>(path: string) {
  return unwrapEnvelope(
    apiClient.get<ApiEnvelope<T>>(path),
  )
}

export async function updateResource<T>(
  path: string,
  payload: Record<string, unknown>,
) {
  return unwrapEnvelope(
    apiClient.patch<ApiEnvelope<T>>(path, payload),
  )
}

export async function deleteResource(path: string) {
  return unwrapEnvelope(
    apiClient.delete<ApiEnvelope<{ deleted?: boolean }>>(path),
  )
}
