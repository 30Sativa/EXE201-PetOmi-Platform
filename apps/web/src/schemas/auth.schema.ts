import {z} from "zod";



export const LoginRequestSchema = z.object({
    email: z.email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    deviceId: z.string().optional(),
});

export  type LoginRequest = z.infer<typeof LoginRequestSchema>;