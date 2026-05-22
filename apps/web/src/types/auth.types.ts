// =========================
// User
// =========================

export interface User {
  id: string
  email: string
  role: string
}

// =========================
// Auth Context
// =========================

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  setAuthFromTokens: (
    accessToken: string,
    refreshToken: string,
  ) => void

  logout: () => Promise<void>
}

// =========================
// Auth API Responses
// =========================

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  email: string
  userId: string
  isProfileCompleted: boolean
  expiresIn?: number
}

export interface RegisterResponse {
  message: string
  email: string
}

export interface ForgotPasswordResponse {
  message: string
}

export interface LogoutResponse {
  message: string
}

export interface VerifyEmailResponse {
  accessToken: string
  refreshToken: string
  email: string
  isProfileCompleted: boolean
  message: string
}