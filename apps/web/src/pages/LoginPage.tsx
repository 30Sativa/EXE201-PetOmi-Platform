import { Eye, EyeOff } from "lucide-react"
import { Link } from "react-router-dom"

import { useLoginForm, useGoogleLogin } from "@/hooks"

const fieldClass =
  "h-12 w-full rounded-2xl border border-po-border bg-po-surface-muted/55 px-4 text-[15px] text-po-text transition placeholder:text-po-text-subtle focus:border-po-primary focus:bg-white focus:shadow-[var(--po-focus-ring)]"

export default function LoginPage({ onSwitchToRegister }: { onSwitchToRegister?: () => void }) {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    status,
    message,
    showPassword,
    onTogglePassword,
    onSubmit,
  } = useLoginForm()

  const { login: googleLogin } = useGoogleLogin()

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <label htmlFor="login-email" className="text-sm font-semibold text-po-text">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="owner@petomi.vn"
          className={fieldClass}
          {...register("email")}
        />
        {errors.email?.message ? <p className="text-sm font-semibold text-po-danger">{errors.email.message}</p> : null}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="login-password" className="text-sm font-semibold text-po-text">
            Mật khẩu
          </label>
          <Link to="/forgot-password" className="text-sm font-semibold text-po-primary no-underline transition hover:text-po-primary-hover">
            Quên mật khẩu?
          </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            className={`${fieldClass} pr-12`}
            {...register("password")}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-po-text-muted transition hover:bg-white hover:text-po-text"
            onClick={onTogglePassword}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password?.message ? <p className="text-sm font-semibold text-po-danger">{errors.password.message}</p> : null}
      </div>

      {message ? (
        <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${status === "success" ? "bg-po-success-soft text-po-success" : "bg-po-danger-soft text-po-danger"}`}>
          {message}
        </p>
      ) : null}

      <button
        className="h-12 w-full rounded-full bg-po-primary text-[15px] font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl active:translate-y-0 disabled:translate-y-0 disabled:opacity-60"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-po-border" />
        <span className="text-xs text-po-text-muted">hoặc</span>
        <div className="h-px flex-1 bg-po-border" />
      </div>

      <button
        type="button"
        onClick={googleLogin}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-po-border bg-white text-sm font-semibold text-po-text transition hover:-translate-y-0.5 hover:bg-po-surface-muted hover:shadow-md active:translate-y-0"
      >
        <svg className="size-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Đăng nhập với Google
      </button>

      <p className="text-center text-sm text-po-text-muted">
        Chưa có tài khoản?{" "}
        <button type="button" onClick={onSwitchToRegister} className="font-semibold text-po-primary transition hover:text-po-primary-hover">
          Đăng ký ngay
        </button>
      </p>
    </form>
  )
}
