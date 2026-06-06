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
  confirmPassword: z.string().min(6, "Xác nhận mật khẩu phải có ít nhất 6 ký tự"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
})

export const ForgotPasswordRequestSchema = z.object({
  email: z.email("Email không hợp lệ"),
})

export const LogoutRequestSchema = z.object({
  refreshToken: z.string(),
})

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token là bắt buộc"),
})

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1, "Token là bắt buộc"),
  newPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string().min(6, "Xác nhận mật khẩu phải có ít nhất 6 ký tự"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
})

export const ToggleRoleRequestSchema = z.object({
  targetRole: z.string().min(1, "Vai trò là bắt buộc"),
  clinicId: z.string().uuid("ClinicId không hợp lệ").optional().nullable(),
})

export const SetPasswordRequestSchema = z.object({
  newPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string().min(6, "Xác nhận mật khẩu phải có ít nhất 6 ký tự"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
})

export const ResendVerificationRequestSchema = z.object({
  email: z.email("Email không hợp lệ"),
})

export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>
export type SetPasswordRequest = z.infer<typeof SetPasswordRequestSchema>
export type ToggleRoleRequest = z.infer<typeof ToggleRoleRequestSchema>
export type ResendVerificationRequest = z.infer<typeof ResendVerificationRequestSchema>
