// Auth page modes
export type AuthMode = "login" | "register"

// Page props types
export type AuthPageProps = {
  initialMode?: AuthMode
}

export type LoginPageProps = {
  onSwitchToRegister?: () => void
}

export type RegisterPageProps = {
  onSwitchToLogin?: () => void
}

// Form status
export type FormStatus = "idle" | "success" | "error"

// Pagination
export interface PaginationMeta {
  pageNumber: number
  pageSize: number
  totalRecords: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface PagedData<T> {
  items?: T[]
  Items?: T[]
  meta?: PaginationMeta
  Meta?: PaginationMeta
}
