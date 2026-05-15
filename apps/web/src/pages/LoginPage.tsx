import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"

import { LoginRequestSchema, type LoginRequest } from "../schemas/auth.schema"
import { loginApi } from "../services/auth.service"

type LoginPageProps = {
  onSwitchToRegister?: () => void
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const apiError = error as { response?: { data?: { message?: string } } }
    return apiError.response?.data?.message ?? "Đăng nhập thất bại. Vui lòng thử lại."
  }

  if (error instanceof Error) return error.message

  return "Đăng nhập thất bại. Vui lòng thử lại."
}

const createDeviceFingerprint = () => {
  const storedFingerprint = localStorage.getItem("petomi-device-fingerprint")
  if (storedFingerprint) return storedFingerprint

  const fingerprint = crypto.randomUUID()
  localStorage.setItem("petomi-device-fingerprint", fingerprint)
  return fingerprint
}

export default function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      email: "",
      password: "",
      deviceName: "PetOmi Web",
      deviceType: "web",
    },
  })

  const onSubmit = async (data: LoginRequest) => {
    try {
      await loginApi({
        ...data,
        deviceFingerprint: createDeviceFingerprint(),
        deviceName: data.deviceName ?? "PetOmi Web",
        deviceType: data.deviceType ?? "web",
      })

      setStatus("success")
      setMessage("Đăng nhập thành công.")
    } catch (error) {
      setStatus("error")
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <label htmlFor="login-email" className="text-sm font-extrabold text-po-text">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="owner@petomi.vn"
          className="h-12 w-full rounded-lg border border-po-border bg-white px-4 text-[15px] text-po-text transition focus:border-po-primary"
          {...register("email")}
        />
        {errors.email?.message ? <p className="text-sm font-semibold text-po-danger">{errors.email.message}</p> : null}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="login-password" className="text-sm font-extrabold text-po-text">
            Mật khẩu
          </label>
          <Link to="/forgot-password" className="text-sm font-bold text-po-primary no-underline transition hover:text-po-primary-hover">
            Quên mật khẩu?
          </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            className="h-12 w-full rounded-lg border border-po-border bg-white px-4 pr-12 text-[15px] text-po-text transition focus:border-po-primary"
            {...register("password")}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-po-text-muted transition hover:text-po-text"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password?.message ? <p className="text-sm font-semibold text-po-danger">{errors.password.message}</p> : null}
      </div>

      {message ? (
        <p className={`rounded-lg px-3 py-2 text-sm font-bold ${status === "success" ? "bg-po-success-soft text-po-success" : "bg-po-danger-soft text-po-danger"}`}>
          {message}
        </p>
      ) : null}

      <button
        className="h-12 w-full rounded-lg bg-po-primary text-[15px] font-extrabold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl active:translate-y-0 disabled:translate-y-0 disabled:opacity-60"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

      <p className="text-center text-sm text-po-text-muted">
        Chưa có tài khoản?{" "}
        <button type="button" onClick={onSwitchToRegister} className="font-extrabold text-po-primary hover:text-po-primary-hover">
          Đăng ký ngay
        </button>
      </p>
    </form>
  )
}
