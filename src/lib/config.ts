const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "")

if (!apiOrigin) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL")
}

export const API_ORIGIN = apiOrigin
export const API_BASE_URL = `${apiOrigin}/api/v1`
