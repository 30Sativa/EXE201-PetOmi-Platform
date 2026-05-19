import { z } from "zod"

export const CompleteProfileSchema = z.object({
  fullName: z.string().min(1, "Họ tên không được để trống").max(100, "Họ tên tối đa 100 ký tự"),
  phone: z.string().min(1, "Số điện thoại không được để trống").regex(/^\+?[0-9]{9,15}$/, "Số điện thoại không hợp lệ"),
  avatarUrl: z.string().url("Avatar URL không hợp lệ").optional().or(z.literal("")),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"], {
    message: "Giới tính phải là Nam, Nữ hoặc Khác",
  }),
  address: z.string().max(500, "Địa chỉ tối đa 500 ký tự").optional(),
})

export const UpdateProfileSchema = z.object({
  fullName: z.string().max(100, "Họ tên tối đa 100 ký tự").optional(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, "Số điện thoại không hợp lệ").optional().or(z.literal("")),
  avatarUrl: z.string().url("Avatar URL không hợp lệ").optional().or(z.literal("")),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  address: z.string().max(500, "Địa chỉ tối đa 500 ký tự").optional(),
})

export type CompleteProfileForm = z.infer<typeof CompleteProfileSchema>
export type UpdateProfileForm = z.infer<typeof UpdateProfileSchema>
