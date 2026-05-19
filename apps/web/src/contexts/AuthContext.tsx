import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { tokenStorage } from "../lib/tokenStorage"
import { logoutApi } from "../services/auth.service"

interface User {
  id: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = tokenStorage.getAccessToken()
    if (token) {
      // TODO: Decode JWT to get user info, or call /me endpoint
      // For now, just check if token exists
      setUser({ id: "", email: "", role: "" })
    }
    setIsLoading(false)
  }, [])

  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken()
      if (refreshToken) {
        await logoutApi(refreshToken)
      }
    } catch {
      // Ignore logout API errors, clear tokens anyway
    } finally {
      tokenStorage.clearTokens()
      setUser(null)
      window.location.href = "/login"
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!tokenStorage.getAccessToken(),
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
