import { Eye, EyeOff } from "lucide-react"
import { Link } from "react-router-dom"

import { useLoginForm } from "@/hooks"

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
            onClick={onTogglePassword}
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
