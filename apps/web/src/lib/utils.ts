import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(
  error: unknown,
  fallback = "Đã xảy ra lỗi. Vui lòng thử lại.",
): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const apiError = error as {
      response?: {
        data?: {
          errors?: string[] | Record<string, string[]>
          message?: string
          title?: string
        }
      }
    }

    const data = apiError.response?.data

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors[0]
    }

    if (data?.errors && typeof data.errors === "object") {
      const firstError = Object.values(data.errors)[0]?.[0]
      if (firstError) return firstError
    }

    if (data?.message) return data.message
    if (data?.title) return data.title
  }

  if (error instanceof Error) return error.message

  return fallback
}