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
