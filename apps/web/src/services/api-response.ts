/**
 * Lay thong bao loi that tu response cua axios.
 * Backend tra ve { message?, errors?: string[] } (camelCase).
 * Tra ve fallback neu khong doc duoc message nao co y nghia.
 */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const data = (
    error as {
      response?: { data?: { message?: string; errors?: string[] } }
    }
  )?.response?.data

  const fromErrors = data?.errors?.find((e) => typeof e === "string" && e.trim())
  const message = data?.message?.trim() || fromErrors?.trim()

  return message && message.toLowerCase() !== "an unexpected error occurred"
    ? message
    : fallback
}

export const unwrapResponse = <T>(response: { data: T | { data: T } }): T => {
  const data = response.data as T | { data: T }

  if (data && typeof data === "object" && "data" in data) {
    return data.data
  }

  return data as T
}

export const getPagedItems = <T>(data?: {
  items?: T[]
  Items?: T[]
} | null): T[] => data?.items ?? data?.Items ?? []

export const getPagedMeta = (data?: {
  meta?: {
    pageNumber?: number
    page?: number
    pageSize: number
    totalRecords?: number
    totalCount?: number
    totalPages?: number
  }
  Meta?: {
    pageNumber?: number
    page?: number
    pageSize: number
    totalRecords?: number
    totalCount?: number
    totalPages?: number
  }
} | null) => data?.meta ?? data?.Meta

