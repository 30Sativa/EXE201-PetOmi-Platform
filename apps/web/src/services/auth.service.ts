import { api } from "../lib/axios"
import type { ForgotPasswordRequest, LoginRequest, RegisterRequest } from "../schemas/auth.schema"

const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === "true"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mockLogin = async (data: LoginRequest) => {
  await sleep(700)
  if (data.email.includes("fail")) {
    throw new Error("Email hoặc mật khẩu không đúng.")
  }
  return { ok: true }
}

const mockRegister = async (data: RegisterRequest) => {
  await sleep(800)
  if (data.email.includes("fail")) {
    throw new Error("Email này đã được sử dụng.")
  }
  return { ok: true }
}

const mockForgotPassword = async (data: ForgotPasswordRequest) => {
  await sleep(700)
  if (data.email.includes("fail")) {
    throw new Error("Email chưa được đăng ký.")
  }
  return { ok: true }
}

export const loginApi = async (data: LoginRequest) => {
  if (useMockAuth) {
    return mockLogin(data)
  }
  const response = await api.post("/auth/login", data)
  return response.data
}

export const registerApi = async (data: RegisterRequest) => {
  if (useMockAuth) {
    return mockRegister(data)
  }
  const response = await api.post("/auth/register", data)
  return response.data
}

export const forgotPasswordApi = async (data: ForgotPasswordRequest) => {
  if (useMockAuth) {
    return mockForgotPassword(data)
  }
  const response = await api.post("/auth/forgot-password", data)
  return response.data
}
