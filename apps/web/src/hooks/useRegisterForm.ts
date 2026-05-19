// Custom hook cho register form
import { useState } from "react"
import { useForm, type UseFormHandleSubmit, type UseFormRegister } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { registerApi } from "@/services/auth.service"
import { getErrorMessage } from "@/lib/utils"
import { RegisterRequestSchema } from "@/schemas/auth.schema"
import type { RegisterRequest } from "@/schemas/auth.schema"
import type { FormStatus } from "@/types"

export interface UseRegisterFormReturn {
  register: UseFormRegister<RegisterRequest>
  handleSubmit: UseFormHandleSubmit<RegisterRequest>
  errors: Record<string, { message?: string }>
  isSubmitting: boolean
  status: FormStatus
  message: string
  showPassword: boolean
  showConfirmPassword: boolean
  onTogglePassword: () => void
  onToggleConfirmPassword: () => void
  onSubmit: (data: RegisterRequest) => Promise<void>
}

export function useRegisterForm(): UseRegisterFormReturn {
  const [status, setStatus] = useState<FormStatus>("idle")
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: RegisterRequest) => {
    setStatus("idle")
    try {
      await registerApi({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      })

      setStatus("success")
      setMessage("Đăng ký thành công. Hãy kiểm tra email để xác minh tài khoản.")
    } catch (error) {
      setStatus("error")
      setMessage(getErrorMessage(error, "Đăng ký thất bại. Vui lòng thử lại."))
    }
  }

  return {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    status,
    message,
    showPassword,
    showConfirmPassword,
    onTogglePassword: () => setShowPassword((p) => !p),
    onToggleConfirmPassword: () => setShowConfirmPassword((p) => !p),
    onSubmit,
  }
}
