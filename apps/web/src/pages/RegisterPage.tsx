import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { RegisterRequestSchema, type RegisterRequest } from "../schemas/auth.schema"
import { registerApi } from "../services/auth.service"

type RegisterPageProps = {
  onSwitchToLogin?: () => void
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const apiError = error as { response?: { data?: { message?: string } } }
    return apiError.response?.data?.message ?? "Đăng ký thất bại. Vui lòng thử lại."
  }

  if (error instanceof Error) return error.message

  return "Đăng ký thất bại. Vui lòng thử lại."
}

export default function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: RegisterRequest) => {
    try {
      await registerApi({
        email: data.email,
        password: data.password,
      })

      setStatus("success")
      setMessage("Đăng ký thành công. Hãy kiểm tra email để xác minh tài khoản.")
    } catch (error) {
      setStatus("error")
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <label htmlFor="register-email" className="text-sm font-extrabold text-po-text">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="owner@petomi.vn"
          className="h-12 w-full rounded-lg border border-po-border bg-white px-4 text-[15px] text-po-text transition focus:border-po-primary"
          {...register("email")}
        />
        {errors.email?.message ? <p className="text-sm font-semibold text-po-danger">{errors.email.message}</p> : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="register-password" className="text-sm font-extrabold text-po-text">
          Mật khẩu
        </label>
        <div className="relative">
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Tối thiểu 6 ký tự"
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
        <p className="text-sm text-po-text-subtle">Dùng ít nhất 6 ký tự để bảo vệ tài khoản.</p>
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
        {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
      </button>

      <p className="text-center text-sm text-po-text-muted">
        Đã có tài khoản?{" "}
        <button type="button" onClick={onSwitchToLogin} className="font-extrabold text-po-primary hover:text-po-primary-hover">
          Đăng nhập
        </button>
      </p>
    </form>
  )
}
