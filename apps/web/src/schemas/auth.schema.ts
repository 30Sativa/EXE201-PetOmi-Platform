import { z } from "zod"

export const LoginRequestSchema = z.object({
  email: z.email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  deviceFingerprint: z.string().optional(),
  deviceName: z.string().optional(),
  deviceType: z.string().optional(),
})

export const RegisterRequestSchema = z.object({
  email: z.email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
})

export const ForgotPasswordRequestSchema = z.object({
  email: z.email("Email không hợp lệ"),
})

export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>
