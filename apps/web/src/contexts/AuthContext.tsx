import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { tokenStorage } from "@/lib/tokenStorage"

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

      setUser({
        id: "",
        email: "",
        role: "",
      })
    } else {
      setIsAuthenticated(false)
      setUser(null)
    }

    setIsLoading(false)
  }, [])

  const setAuthFromTokens = useCallback(
    (
      accessToken: string,
      refreshToken: string,
    ) => {
      tokenStorage.setAccessToken(accessToken)

      tokenStorage.setRefreshToken(refreshToken)

      setIsAuthenticated(true)

      setUser({
        id: "",
        email: "",
        role: "",
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