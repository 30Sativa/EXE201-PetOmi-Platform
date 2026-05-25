import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ArrowLeft } from "lucide-react"

import { resetPasswordApi } from "@/services/auth.service"
import { ResetPasswordRequestSchema, type ResetPasswordRequest } from "@/schemas/auth.schema"
import { getErrorMessage } from "@/lib/utils"

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequest>({
    resolver: zodResolver(ResetPasswordRequestSchema),
    defaultValues: {
      token,
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: ResetPasswordRequest) => {
    if (!token) {
      setStatus("error")
      setMessage("Token đặt lại mật khẩu không hợp lệ. Vui lòng kiểm tra email.")
      return
    }

    setStatus("idle")
    setMessage("")
    setIsSubmitting(true)

    try {
      const result = await resetPasswordApi(data)
      setStatus("success")
      setMessage(result.message)
    } catch (err) {
      setStatus("error")
      setMessage(getErrorMessage(err, "Đặt lại mật khẩu thất bại. Token có thể đã hết hạn."))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen text-po-text">
        <header className="mx-auto flex min-h-20 w-[min(100%-32px,1280px)] items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-po-text no-underline">
            <span className="grid size-9 place-items-center rounded-md bg-po-primary text-sm text-white">P</span>
            <span>PetOmi</span>
          </Link>
          <Link to="/login" className="text-sm font-extrabold text-po-text-muted no-underline hover:text-po-primary">
            Quay lại đăng nhập
          </Link>
        </header>

        <div className="mx-auto grid min-h-[calc(100vh-80px)] w-[min(100%-32px,480px)] items-center gap-6 py-8">
          <div className="rounded-xl border border-po-danger bg-po-danger-soft p-6 text-center">
            <p className="text-sm font-semibold text-po-danger">Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
            <Link to="/forgot-password" className="mt-3 inline-block text-sm font-semibold text-po-primary hover:text-po-primary-hover">
              Yêu cầu liên kết mới
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (status === "success") {
    return (
      <main className="min-h-screen text-po-text">
        <header className="mx-auto flex min-h-20 w-[min(100%-32px,1280px)] items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-po-text no-underline">
            <span className="grid size-9 place-items-center rounded-md bg-po-primary text-sm text-white">P</span>
            <span>PetOmi</span>
          </Link>
        </header>

        <div className="mx-auto grid min-h-[calc(100vh-80px)] w-[min(100%-32px,480px)] items-center gap-6 py-8">
          <div className="rounded-xl border border-po-border bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-po-success-soft">
              <svg className="size-7 text-po-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-po-text">Đặt lại mật khẩu thành công!</h1>
            <p className="mt-2 text-sm text-po-text-muted">Mật khẩu của bạn đã được thay đổi. Bây giờ bạn có thể đăng nhập.</p>
            <Link
              to="/login"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-po-primary px-6 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen text-po-text">
      <header className="mx-auto flex min-h-20 w-[min(100%-32px,1280px)] items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-po-text no-underline">
          <span className="grid size-9 place-items-center rounded-md bg-po-primary text-sm text-white">P</span>
          <span>PetOmi</span>
        </Link>
        <Link to="/login" className="text-sm font-extrabold text-po-text-muted no-underline hover:text-po-primary">
          Quay lại đăng nhập
        </Link>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-80px)] w-[min(100%-32px,480px)] items-center gap-6 py-8">
        <div className="rounded-xl border border-po-border bg-white p-8 shadow-xl">
          <div className="mb-6">
            <span className="text-xs font-extrabold uppercase text-po-text-subtle">Reset password</span>
            <h1 className="mt-1 text-2xl font-extrabold text-po-text">Đặt lại mật khẩu</h1>
            <p className="mt-1 text-sm text-po-text-muted">Nhập mật khẩu mới cho tài khoản của bạn.</p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register("token")} value={token} />

            <div className="grid gap-2">
              <label htmlFor="new-password" className="text-sm font-extrabold text-po-text">
                Mật khẩu mới <span className="text-po-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Tối thiểu 6 ký tự"
                  className="h-12 w-full rounded-lg border border-po-border bg-white px-4 pr-12 text-[15px] text-po-text transition focus:border-po-primary"
                  {...register("newPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-po-text-muted transition hover:text-po-text"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.newPassword?.message && (
                <p className="text-sm font-semibold text-po-danger">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="confirm-password" className="text-sm font-extrabold text-po-text">
                Xác nhận mật khẩu mới <span className="text-po-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu mới"
                  className="h-12 w-full rounded-lg border border-po-border bg-white px-4 pr-12 text-[15px] text-po-text transition focus:border-po-primary"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-po-text-muted transition hover:text-po-text"
                  onClick={() => setShowConfirm((p) => !p)}
                  aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword?.message && (
                <p className="text-sm font-semibold text-po-danger">{errors.confirmPassword.message}</p>
              )}
            </div>

            {message && (
              <p className={`rounded-lg px-3 py-2 text-sm font-bold ${status === "success" ? "bg-po-success-soft text-po-success" : "bg-po-danger-soft text-po-danger"}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-lg bg-po-primary text-[15px] font-extrabold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl disabled:translate-y-0 disabled:opacity-60"
            >
              {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>

            <Link to="/login" className="inline-flex items-center justify-center gap-2 text-sm font-bold text-po-primary hover:text-po-primary-hover">
              <ArrowLeft className="size-4" />
              Quay lại đăng nhập
            </Link>
          </form>
        </div>
      </div>
    </main>
  )
}
