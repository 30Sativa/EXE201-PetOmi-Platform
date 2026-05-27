// Custom hook cho forgot password form
import { useState } from "react"
import { useForm, type UseFormHandleSubmit, type UseFormRegister } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { forgotPasswordApi } from "@/services/auth.service"
import { getErrorMessage } from "@/lib/utils"
import { ForgotPasswordRequestSchema } from "@/schemas/auth.schema"
import type { ForgotPasswordRequest } from "@/schemas/auth.schema"
import type { FormStatus } from "@/types"

export interface UseForgotPasswordFormReturn {
  register: UseFormRegister<ForgotPasswordRequest>
  handleSubmit: UseFormHandleSubmit<ForgotPasswordRequest>
  errors: Record<string, { message?: string }>
  isSubmitting: boolean
  status: FormStatus
  message: string
  onSubmit: (data: ForgotPasswordRequest) => Promise<void>
}

export function useForgotPasswordForm(): UseForgotPasswordFormReturn {
  const [status, setStatus] = useState<FormStatus>("idle")
  const [message, setMessage] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(ForgotPasswordRequestSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordRequest) => {
    setStatus("idle")
    setMessage("")
    try {
      await forgotPasswordApi(data)
      setStatus("success")
      setMessage("Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.")
    } catch (error) {
      setStatus("error")
      setMessage(getErrorMessage(error, "Không thể gửi email đặt lại mật khẩu."))
    }
  }

  return {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    status,
    message,
    onSubmit,
  }
}
