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

