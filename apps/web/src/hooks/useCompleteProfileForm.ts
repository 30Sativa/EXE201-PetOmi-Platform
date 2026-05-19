// Custom hook cho complete profile form
import { useEffect } from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm, type UseFormHandleSubmit, type UseFormRegister } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { completeProfileApi } from "@/services/profile.service"
import { tokenStorage } from "@/lib/tokenStorage"
import { getErrorMessage } from "@/lib/utils"
import { CompleteProfileSchema } from "@/schemas/profile.schema"
import type { CompleteProfileForm } from "@/schemas/profile.schema"
import type { FormStatus } from "@/types"

export interface UseCompleteProfileFormReturn {
  register: UseFormRegister<CompleteProfileForm>
  handleSubmit: UseFormHandleSubmit<CompleteProfileForm>
  errors: Record<string, { message?: string }>
  isSubmitting: boolean
  status: FormStatus
  message: string
  onSubmit: (data: CompleteProfileForm) => Promise<void>
}

export function useCompleteProfileForm(): UseCompleteProfileFormReturn {
  const [status, setStatus] = useState<FormStatus>("idle")
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompleteProfileForm>({
    resolver: zodResolver(CompleteProfileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      avatarUrl: "",
      dateOfBirth: "",
      gender: undefined,
      address: "",
    },
  })

  useEffect(() => {
    if (!tokenStorage.hasValidToken()) {
      navigate("/login")
    }
  }, [navigate])

  const onSubmit = async (data: CompleteProfileForm) => {
    setStatus("idle")
    try {
      await completeProfileApi({
        ...data,
        dateOfBirth: data.dateOfBirth || null,
      })

      setStatus("success")
      setMessage("Hoàn thiện hồ sơ thành công! Đang chuyển hướng...")
      setTimeout(() => navigate("/dashboard"), 1500)
    } catch (error) {
      setStatus("error")
      setMessage(getErrorMessage(error, "Có lỗi xảy ra. Vui lòng thử lại."))
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
