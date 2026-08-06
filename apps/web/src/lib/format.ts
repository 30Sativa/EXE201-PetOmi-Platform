export const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0)

export const formatDate = (value?: string | null, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return "-"

  try {
    return new Date(value).toLocaleDateString("vi-VN", options ?? {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return value
  }
}

export const formatTime = (value?: string | null) => {
  if (!value) return "-"
  return value.slice(0, 5)
}

export const formatShortId = (value?: string | null) => {
  if (!value) return "-"
  return value.slice(0, 8)
}

export const maskEmail = (value?: string | null) => {
  if (!value) return "-"

  const separatorIndex = value.lastIndexOf("@")
  if (separatorIndex <= 0 || separatorIndex === value.length - 1) return value

  const localPart = value.slice(0, separatorIndex)
  const domain = value.slice(separatorIndex + 1)
  const visibleLength = Math.min(5, localPart.length)

  return `${localPart.slice(0, visibleLength)}*****@${domain}`
}

export const toDateInputValue = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export const todayDateInput = () => toDateInputValue(new Date())

