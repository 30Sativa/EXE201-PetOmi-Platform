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
  AuthSessionMetadata,
  AuthContextType,
  User,
} from "@/types"

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
)

const NAME_IDENTIFIER_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
const EMAIL_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"

function claimString(
  payload: Record<string, unknown> | null,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = payload?.[key]
    if (typeof value === "string" && value) {
      return value
    }
  }

  return ""
}

function createUserFromAuth(
  payload: Record<string, unknown> | null,
  metadata?: AuthSessionMetadata,
): User {
  const activeRole =
    metadata?.activeRole ??
    claimString(payload, "activeRole", "role") ??
    ""

  return {
    id:
      metadata?.userId ??
      claimString(payload, "sub", "nameid", "nameidentifier", NAME_IDENTIFIER_CLAIM),
    email: metadata?.email ?? claimString(payload, "email", EMAIL_CLAIM),
    role: activeRole,
    activeRole,
    roles: metadata?.roles?.length ? metadata.roles : activeRole ? [activeRole] : [],
  }
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(() => {
    const token = tokenStorage.getAccessToken()
    if (!token) return null

    return createUserFromAuth(decodeAccessToken())
  })

  const [isAuthenticated, setIsAuthenticated] =
    useState(() => tokenStorage.hasValidToken())

  const isLoading = false

  useEffect(() => {
    const handleTokenRefreshed = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setUser((prev) =>
        prev
          ? {
              ...prev,
              id: detail.userId || prev.id,
              email: detail.email || prev.email,
              role: detail.activeRole || prev.role,
              activeRole: detail.activeRole || prev.activeRole,
              roles: detail.roles?.length ? detail.roles : prev.roles,
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
      metadata?: AuthSessionMetadata,
    ) => {
      tokenStorage.setAccessToken(accessToken)
      tokenStorage.setRefreshToken(refreshToken)
      setIsAuthenticated(true)

      const payload = decodeAccessToken()
      setUser(createUserFromAuth(payload, metadata))
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
