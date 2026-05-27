import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, PawPrint } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import FormStatusMessage from "@/components/ui/FormStatusMessage"
import { resetPasswordApi } from "@/services/auth.service"
import { ResetPasswordRequestSchema, type ResetPasswordRequest } from "@/schemas/auth.schema"
import { getErrorMessage } from "@/lib/utils"

const fieldClass =
  "h-12 w-full rounded-2xl border border-po-border bg-po-surface-muted/55 px-4 text-[15px] text-po-text transition placeholder:text-po-text-subtle focus:border-po-primary focus:bg-white focus:shadow-[var(--po-focus-ring)]"

function AuthHeader() {
  return (
    <header className="mx-auto flex min-h-20 w-full max-w-[1200px] items-center justify-between gap-4 px-3 sm:px-6">
      <Link
        to="/"
        aria-label="Trang chủ PetOmi"
        className="flex items-center gap-2 font-extrabold text-po-text no-underline"
      >
        <span className="grid size-10 place-items-center rounded-2xl bg-po-primary text-sm text-white shadow-lg shadow-orange-200/40">
          <PawPrint className="size-4" />
        </span>
        <span>PetOmi</span>
      </Link>

      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-sm font-semibold text-po-text-muted no-underline transition hover:text-po-primary"
      >
        <ArrowLeft className="size-4" />
        <span className="hidden sm:inline">Quay lại đăng nhập</span>
      </Link>
    </header>
  )
}

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
      <main className="min-h-screen overflow-x-hidden bg-po-bg text-po-text">
        <AuthHeader />

        <section className="mx-auto grid min-h-[calc(100dvh-80px)] w-full max-w-[560px] items-center px-3 pb-12 pt-4 sm:px-6">
          <div className="overflow-hidden rounded-[30px] border border-po-border bg-white/[0.92] p-6 text-center shadow-2xl shadow-orange-200/25 md:p-8">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-po-danger-soft text-po-danger">
              <KeyRound className="size-7" />
            </div>
            <h1 className="mx-auto mt-5 max-w-md break-words text-2xl font-extrabold leading-tight text-po-text sm:text-3xl">
              Liên kết không còn hợp lệ
            </h1>
            <p className="mx-auto mt-3 max-w-md break-words text-sm leading-6 text-po-text-muted">
              Link đặt lại mật khẩu có thể đã hết hạn hoặc bị thiếu token. Hãy yêu cầu một liên kết mới.
            </p>
            <Link
              to="/forgot-password"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-po-primary px-6 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover"
            >
              Yêu cầu liên kết mới
            </Link>
          </div>
        </section>
      </main>
    )
  }

  if (status === "success") {
    return (
      <main className="min-h-screen overflow-x-hidden bg-po-bg text-po-text">
        <AuthHeader />

        <section className="mx-auto grid min-h-[calc(100dvh-80px)] w-full max-w-[560px] items-center px-3 pb-12 pt-4 sm:px-6">
          <div className="overflow-hidden rounded-[30px] border border-po-border bg-white/[0.92] p-6 text-center shadow-2xl shadow-orange-200/25 md:p-8">
            <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-po-success-soft text-po-success">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="mx-auto mt-5 max-w-md break-words text-2xl font-extrabold leading-tight text-po-text sm:text-3xl">
              Mật khẩu đã được cập nhật
            </h1>
            <p className="mx-auto mt-3 max-w-md break-words text-sm leading-6 text-po-text-muted">
              {message || "Bạn có thể đăng nhập lại bằng mật khẩu mới."}
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-po-primary px-6 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-po-bg text-po-text">
      <AuthHeader />

      <section className="mx-auto grid min-h-[calc(100dvh-80px)] w-full max-w-[560px] items-center px-3 pb-12 pt-4 sm:px-6">
        <div className="overflow-hidden rounded-[30px] border border-po-border bg-white/[0.92] p-5 shadow-2xl shadow-orange-200/25 md:p-7">
          <div className="mb-7">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-po-text-subtle">
              Tài khoản
            </span>
            <h1 className="mt-2 max-w-full break-words text-3xl font-extrabold leading-tight text-po-text">
              Đặt lại mật khẩu
            </h1>
            <p className="mt-2 max-w-full break-words text-sm leading-6 text-po-text-muted">
              Tạo mật khẩu mới để tiếp tục quản lý hồ sơ thú cưng trên PetOmi.
            </p>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register("token")} value={token} />

            <div className="grid gap-2">
              <label htmlFor="new-password" className="text-sm font-semibold text-po-text">
                Mật khẩu mới <span className="text-po-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Tối thiểu 6 ký tự"
                  className={`${fieldClass} pr-12`}
                  {...register("newPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-po-text-muted transition hover:bg-white hover:text-po-text"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.newPassword?.message ? (
                <p className="text-sm font-semibold text-po-danger">
                  {errors.newPassword.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="confirm-password" className="text-sm font-semibold text-po-text">
                Xác nhận mật khẩu mới <span className="text-po-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu mới"
                  className={`${fieldClass} pr-12`}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-po-text-muted transition hover:bg-white hover:text-po-text"
                  onClick={() => setShowConfirm((p) => !p)}
                  aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword?.message ? (
                <p className="text-sm font-semibold text-po-danger">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            {message ? (
              <FormStatusMessage
                status="error"
                title="Chưa thể đặt lại mật khẩu"
                message={message}
              />
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-full bg-po-primary text-[15px] font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl disabled:translate-y-0 disabled:opacity-60"
            >
              {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-po-primary no-underline transition hover:text-po-primary-hover"
            >
              <ArrowLeft className="size-4" />
              Quay lại đăng nhập
            </Link>
          </form>
        </div>
      </section>
    </main>
  )
}
