import { api } from "@/lib/axios"
import type {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
} from "@/schemas/auth.schema"
import type {
  ForgotPasswordResponse,
  LoginResponse,
  LogoutResponse,
  RegisterResponse,
  VerifyEmailResponse,
} from "@/types"

const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === "true"

const unwrapResponse = <T>(response: { data: T | { data: T } }): T => {
  return "data" in response.data ? response.data.data : response.data
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