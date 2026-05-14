import { api } from "../lib/axios"
import type { LoginRequest, RegisterRequest } from "../schemas/auth.schema"

export const loginApi = async (data: LoginRequest) => {
  const response = await api.post("/auth/login", data)
  return response.data
}

export const registerApi = async (data: RegisterRequest) => {
  const response = await api.post("/auth/register", data)
  return response.data
}
