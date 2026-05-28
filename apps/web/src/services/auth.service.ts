import { api } from "@/lib/axios"
import type {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ResetPasswordRequest,
  ToggleRoleRequest,
} from "@/schemas/auth.schema"
import type {
  ActiveRoleResponse,
  ForgotPasswordResponse,
  GetCurrentUserResponse,
  GetSessionsResponse,
  LoginResponse,
  LogoutResponse,
  RefreshTokenResponse,
  RegisterResponse,
  ResendVerificationResponse,
  ToggleRoleResponse,
  VerifyEmailResponse,
} from "@/types"

const unwrapResponse = <T>(response: { data: T | { data: T } }): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = response.data as any
  if ("data" in data && data.data != null) {
    return data.data
  }
  return data
}

export const loginApi = async (
  data: LoginRequest,
): Promise<LoginResponse> => {
  const response = await api.post("/auth/login", data)
  return unwrapResponse<LoginResponse>(response)
}

export const registerApi = async (
  data: RegisterRequest,
): Promise<RegisterResponse> => {
  const response = await api.post("/auth/register", data)
  return unwrapResponse<RegisterResponse>(response)
}

export const forgotPasswordApi = async (
  data: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> => {
  const response = await api.post("/auth/forgot-password", data)
  return unwrapResponse<ForgotPasswordResponse>(response)
}

export const logoutApi = async (
  refreshToken: string,
): Promise<LogoutResponse> => {
  const response = await api.post("/auth/logout", { refreshToken })
  return unwrapResponse<LogoutResponse>(response)
}

export const logoutAllApi = async (): Promise<LogoutResponse> => {
  const response = await api.post("/auth/logout-all")
  return unwrapResponse<LogoutResponse>(response)
}

export const verifyEmailApi = async (
  token: string,
): Promise<VerifyEmailResponse> => {
  const response = await api.get(
    `/auth/verify-email?token=${token}`,
  )

  return unwrapResponse<VerifyEmailResponse>(response)
}

export const refreshTokenApi = async (
  data: RefreshTokenRequest,
): Promise<RefreshTokenResponse> => {
  const response = await api.post("/auth/refresh-token", data)
  return unwrapResponse<RefreshTokenResponse>(response)
}

export const getMeApi = async (): Promise<GetCurrentUserResponse> => {
  const response = await api.get("/auth/me")
  return unwrapResponse<GetCurrentUserResponse>(response)
}

export const resetPasswordApi = async (
  data: ResetPasswordRequest,
): Promise<{ message: string }> => {
  const response = await api.post("/auth/reset-password", data)
  return unwrapResponse<{ message: string }>(response)
}

export const toggleRoleApi = async (
  data: ToggleRoleRequest,
): Promise<ToggleRoleResponse> => {
  const response = await api.post("/auth/toggle-role", data)
  return unwrapResponse<ToggleRoleResponse>(response)
}

export const googleLoginApi = async (): Promise<void> => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5273/api"
  window.location.href = `${baseUrl}/auth/google/login`
}

export const googleCallbackApi = async (): Promise<LoginResponse> => {
  const response = await api.get("/auth/google/callback")
  return unwrapResponse<LoginResponse>(response)
}

export const getActiveRoleApi = async (): Promise<ActiveRoleResponse> => {
  const response = await api.get("/auth/active-role")
  return unwrapResponse<ActiveRoleResponse>(response)
}

export const getSessionsApi = async (): Promise<GetSessionsResponse> => {
  const response = await api.get("/auth/sessions")
  return unwrapResponse<GetSessionsResponse>(response)
}

export const deleteSessionApi = async (
  sessionId: string,
): Promise<{ message: string }> => {
  const response = await api.delete(`/auth/sessions/${sessionId}`)
  return unwrapResponse<{ message: string }>(response)
}

export const deleteAllSessionsApi = async (): Promise<{ message: string }> => {
  const response = await api.delete("/auth/sessions")
  return unwrapResponse<{ message: string }>(response)
}

export const resendVerificationApi = async (
  email: string,
): Promise<ResendVerificationResponse> => {
  const response = await api.post("/auth/resend-verification", { email })
  return unwrapResponse<ResendVerificationResponse>(response)
}
