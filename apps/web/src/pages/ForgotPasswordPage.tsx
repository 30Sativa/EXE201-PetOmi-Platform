import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"

import { ForgotPasswordRequestSchema, type ForgotPasswordRequest } from "@/schemas/auth.schema"
import { forgotPasswordApi } from "@/services/auth.service"

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const apiError = error as { response?: { data?: { message?: string } } }
    return apiError.response?.data?.message ?? "Không thể gửi email đặt lại mật khẩu."
  }

  if (error instanceof Error) return error.message

  return "Không thể gửi email đặt lại mật khẩu."
}

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
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
    try {
      await forgotPasswordApi(data)
      setStatus("success")
      setMessage("Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.")
    } catch (error) {
      setStatus("error")
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <main className="min-h-screen text-po-text">
      <header className="mx-auto flex min-h-20 w-[min(100%-32px,1280px)] items-center justify-between gap-4 motion-safe:animate-fade-in">
        <Link to="/" aria-label="Trang chủ PetOmi" className="flex items-center gap-2 font-extrabold text-po-text no-underline">
          <span className="grid size-9 place-items-center rounded-md bg-po-primary text-sm text-white">P</span>
          <span>PetOmi</span>
        </Link>

        <Link to="/login" className="text-sm font-extrabold text-po-text-muted no-underline transition hover:text-po-primary">
          Quay lại đăng nhập
        </Link>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-80px)] w-[min(100%-32px,1180px)] items-center gap-10 py-8 lg:grid-cols-[1fr_480px] lg:gap-20">
        <aside className="grid gap-5 motion-safe:animate-fade-up">
          <p className="text-xs font-extrabold uppercase text-po-accent">PetOmi support</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-po-text md:text-6xl">
            Khôi phục mật khẩu của bạn.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-po-text-muted">
            Nhập email để nhận hướng dẫn đặt lại mật khẩu. Chúng tôi sẽ gửi liên kết an toàn trong vài phút.
          </p>

          <div className="grid max-w-2xl gap-3">
            {[
              ["Secure link", "Liên kết đặt lại mật khẩu có thời hạn."],
              ["Account safety", "Chỉ email đã đăng ký mới nhận được hướng dẫn."],
              ["Fast recovery", "Hoàn tất trong vòng 2-3 phút."],
            ].map(([title, text]) => (
              <div key={title} className="grid gap-2 rounded-lg border border-po-border bg-white/70 p-4 backdrop-blur transition motion-safe:animate-fade-up hover:-translate-y-0.5 hover:border-teal-700/30 hover:bg-white md:grid-cols-[160px_1fr]">
                <strong className="text-sm text-po-text">{title}</strong>
                <span className="text-sm leading-6 text-po-text-muted">{text}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="w-full rounded-xl border border-po-border bg-white/95 p-5 shadow-2xl shadow-stone-950/10 backdrop-blur motion-safe:animate-fade-up [animation-delay:120ms] md:p-6" aria-label="Biểu mẫu đặt lại mật khẩu">
          <div className="mb-6 grid gap-5">
            <div>
              <span className="text-xs font-extrabold uppercase text-po-text-subtle">Reset password</span>
              <h2 className="mt-1 text-3xl font-extrabold text-po-text">Quên mật khẩu</h2>
            </div>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-2">
              <label htmlFor="forgot-email" className="text-sm font-extrabold text-po-text">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="owner@petomi.vn"
                className="h-12 w-full rounded-lg border border-po-border bg-white px-4 text-[15px] text-po-text transition focus:border-po-primary"
                {...register("email")}
              />
              {errors.email?.message ? <p className="text-sm font-semibold text-po-danger">{errors.email.message}</p> : null}
            </div>

            {message ? (
              <p
                className={`rounded-lg px-3 py-2 text-sm font-bold ${
                  status === "success" ? "bg-po-success-soft text-po-success" : "bg-po-danger-soft text-po-danger"
                }`}
              >
                {message}
              </p>
            ) : null}

            <button
              className="h-12 w-full rounded-lg bg-po-primary text-[15px] font-extrabold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl active:translate-y-0 disabled:translate-y-0 disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang gửi..." : "Gửi email khôi phục"}
            </button>

            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-po-primary hover:text-po-primary-hover">
              <ArrowLeft className="size-4" />
              Quay lại đăng nhập
            </Link>
          </form>
        </section>
      </section>
    </main>
  )
}
