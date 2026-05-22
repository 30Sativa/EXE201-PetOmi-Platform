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