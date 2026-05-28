const TOKEN_KEY = "petomi-access-token"
const REFRESH_TOKEN_KEY = "petomi-refresh-token"

export const tokenStorage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY)
  },

  setAccessToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token)
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setRefreshToken: (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },

  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  hasValidToken: (): boolean => {
    return localStorage.getItem(TOKEN_KEY) !== null
  },
}

export function decodeJwt(token: string): Record<string, unknown> | null {
  if (!token) return null

  try {
    const base64Url = token.split(".")[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function decodeAccessToken(): Record<string, unknown> | null {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null

  return decodeJwt(token)
}
