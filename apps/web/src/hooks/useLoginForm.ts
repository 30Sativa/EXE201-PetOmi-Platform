// Custom hooks cho auth forms
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm, type UseFormHandleSubmit, type UseFormRegister } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { useAuth } from "@/contexts/AuthContext"
import { loginApi } from "@/services/auth.service"
import { getDashboardPathForRole, resolvePreferredRole } from "@/lib/authRoles"
import { getDeviceInfo } from "@/lib/device"
import { getErrorMessage } from "@/lib/utils"
import { LoginRequestSchema } from "@/schemas/auth.schema"
import type { LoginRequest } from "@/schemas/auth.schema"
import type { FormStatus } from "@/types"

export interface UseLoginFormReturn {
  register: UseFormRegister<LoginRequest>
  handleSubmit: UseFormHandleSubmit<LoginRequest>
  errors: Record<string, { message?: string }>
  isSubmitting: boolean
  status: FormStatus
  message: string
  showPassword: boolean
  onTogglePassword: () => void
  onSubmit: (data: LoginRequest) => Promise<void>
}

export function useLoginForm(): UseLoginFormReturn {
  const [status, setStatus] = useState<FormStatus>("idle")
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { setAuthFromTokens } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginRequest) => {
    setStatus("idle")
    try {
      const deviceInfo = getDeviceInfo()

      const response = await loginApi({
        ...data,
        deviceFingerprint: deviceInfo.deviceFingerprint,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
      })

      if (response.accessToken && response.refreshToken) {
        setAuthFromTokens(
          response.accessToken,
          response.refreshToken,
          {
            userId: response.userId,
            email: response.email,
            activeRole: response.activeRole,
            roles: response.roles,
          },
        )
      }

      setStatus("success")
      setMessage("Đăng nhập thành công.")

      setTimeout(() => {
        const preferredRole = resolvePreferredRole(
          response.activeRole,
          response.roles,
        )

        if (response.isProfileCompleted === false) {
          navigate("/complete-profile")
        } else {
          navigate(getDashboardPathForRole(preferredRole))
        }
      }, 500)
    } catch (error) {
      setStatus("error")
      setMessage(getErrorMessage(error, "Đăng nhập thất bại. Vui lòng thử lại."))
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
    onTogglePassword: () => setShowPassword((p) => !p),
    onSubmit,
  }
}
