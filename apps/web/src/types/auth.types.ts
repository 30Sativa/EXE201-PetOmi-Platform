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
    userId?: string,
    email?: string,
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

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  isProfileCompleted: boolean
}

export interface UserProfileInfo {
  fullName: string | null
  phone: string | null
  avatarUrl: string | null
  dateOfBirth: string | null
  gender: string | null
  address: string | null
}

export interface VetProfileInfo {
  vetProfileId: string
  specialization: string | null
  licenseNumber: string | null
  isActive: boolean
}

export interface GetCurrentUserResponse {
  userId: string
  email: string
  emailVerified: boolean
  isActive: boolean
  isProfileCompleted: boolean
  createdAt: string
  lastLoginAt: string | null
  profile: UserProfileInfo | null
  roles: string[]
  vetProfile: VetProfileInfo | null
}

export interface ToggleRoleResponse {
  accessToken: string
  activeRole: string
  activeClinicId: string | null
}

// =========================
// Active Role
// =========================

export interface ActiveRoleResponse {
  activeRole: string
  activeClinicId: string | null
  availableRoles: string[]
}

// =========================
// Sessions
// =========================

export interface SessionDeviceInfo {
  deviceId: string
  deviceName: string
  deviceType: string
  browser: string | null
  os: string | null
}

export interface SessionInfo {
  sessionId: string
  userId: string
  deviceId: string | null
  ipAddress: string | null
  userAgent: string | null
  isActive: boolean
  isCurrent: boolean
  logoutAt: string | null
  lastActivityAt: string
  createdAt: string
  activeRole: string | null
  activeClinicId: string | null
  device: SessionDeviceInfo | null
}

export interface GetSessionsResponse {
  sessions: SessionInfo[]
  total: number
}

// =========================
// Resend Verification
// =========================

export interface ResendVerificationResponse {
  message: string
}