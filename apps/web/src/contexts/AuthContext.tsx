import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { tokenStorage, decodeAccessToken } from "@/lib/tokenStorage"
import { AUTH_EVENTS } from "@/lib/axios"

import { logoutApi } from "@/services/auth.service"

import type {
  AuthContextType,
  User,
} from "@/types"

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
)

export function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)

  const [isAuthenticated, setIsAuthenticated] =
    useState(false)

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = tokenStorage.getAccessToken()

    if (token) {
      setIsAuthenticated(true)

      const payload = decodeAccessToken()
      setUser({
        id: (payload?.sub as string) ?? (payload?.nameidentifier as string) ?? "",
        email: (payload?.email as string) ?? (payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] as string) ?? "",
        role: (payload?.role as string) ?? (payload?.activeRole as string) ?? "",
      })
    } else {
      setIsAuthenticated(false)
      setUser(null)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    const handleTokenRefreshed = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setUser((prev) =>
        prev
          ? {
              ...prev,
              id: detail.userId || prev.id,
              email: detail.email || prev.email,
            }
          : null
      )
    }

    const handleLogout = () => {
      setUser(null)
      setIsAuthenticated(false)
    }

    window.addEventListener(AUTH_EVENTS.TOKEN_REFRESHED, handleTokenRefreshed)
    window.addEventListener(AUTH_EVENTS.LOGOUT, handleLogout)

    return () => {
      window.removeEventListener(AUTH_EVENTS.TOKEN_REFRESHED, handleTokenRefreshed)
      window.removeEventListener(AUTH_EVENTS.LOGOUT, handleLogout)
    }
  }, [])

  const setAuthFromTokens = useCallback(
    (
      accessToken: string,
      refreshToken: string,
      userId?: string,
      email?: string,
    ) => {
      tokenStorage.setAccessToken(accessToken)
      tokenStorage.setRefreshToken(refreshToken)
      setIsAuthenticated(true)

      const payload = decodeAccessToken()
      setUser({
        id: userId ?? (payload?.sub as string) ?? (payload?.nameidentifier as string) ?? "",
        email: email ?? (payload?.email as string) ?? (payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] as string) ?? "",
        role: (payload?.role as string) ?? (payload?.activeRole as string) ?? "",
      })
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      const refreshToken =
        tokenStorage.getRefreshToken()

      if (refreshToken) {
        await logoutApi(refreshToken)
      }
    } catch {
      // ignore
    } finally {
      tokenStorage.clearTokens()

      setUser(null)

      setIsAuthenticated(false)

      window.location.href = "/login"
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      setAuthFromTokens,
      logout,
    }),

    [
      user,
      isAuthenticated,
      isLoading,
      setAuthFromTokens,
      logout,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider",
    )
  }

  return context
}
