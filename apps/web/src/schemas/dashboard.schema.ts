import { z } from "zod"

export const OwnerProfileSchema = z.object({
  fullName: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  email: z.email("Email không hợp lệ"),
  phone: z.string().min(8, "Số điện thoại không hợp lệ"),
  city: z.string().min(2, "Vui lòng nhập thành phố"),
})

export const ClinicProfileSchema = z.object({
  clinicName: z.string().min(2, "Tên clinic phải có ít nhất 2 ký tự"),
  licenseId: z.string().min(3, "Mã giấy phép không hợp lệ"),
  address: z.string().min(5, "Địa chỉ không hợp lệ"),
  phone: z.string().min(8, "Số điện thoại không hợp lệ"),
  specialty: z.string().min(2, "Vui lòng nhập chuyên khoa"),
})

export type OwnerProfileForm = z.infer<typeof OwnerProfileSchema>
export type ClinicProfileForm = z.infer<typeof ClinicProfileSchema>
