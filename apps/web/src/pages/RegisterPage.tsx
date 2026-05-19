import { Eye, EyeOff } from "lucide-react"

import { useRegisterForm } from "@/hooks"

export default function RegisterPage({ onSwitchToLogin }: { onSwitchToLogin?: () => void }) {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    status,
    message,
    showPassword,
    showConfirmPassword,
    onTogglePassword,
    onToggleConfirmPassword,
    onSubmit,
  } = useRegisterForm()

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
            onClick={onTogglePassword}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <p className="text-sm text-po-text-subtle">Dùng ít nhất 6 ký tự để bảo vệ tài khoản.</p>
        {errors.password?.message ? <p className="text-sm font-semibold text-po-danger">{errors.password.message}</p> : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="register-confirm-password" className="text-sm font-extrabold text-po-text">
          Xác nhận mật khẩu
        </label>
        <div className="relative">
          <input
            id="register-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            className="h-12 w-full rounded-lg border border-po-border bg-white px-4 pr-12 text-[15px] text-po-text transition focus:border-po-primary"
            {...register("confirmPassword")}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-po-text-muted transition hover:text-po-text"
            onClick={onToggleConfirmPassword}
            aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.confirmPassword?.message ? <p className="text-sm font-semibold text-po-danger">{errors.confirmPassword.message}</p> : null}
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
