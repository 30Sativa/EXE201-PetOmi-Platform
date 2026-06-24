import { Eye, EyeOff } from "lucide-react"

import FormStatusMessage from "@/components/ui/FormStatusMessage"
import { useRegisterForm } from "@/hooks"

const fieldClass =
  "h-12 w-full rounded-2xl border border-po-border bg-po-surface-muted/55 px-4 text-[15px] text-po-text transition placeholder:text-po-text-subtle focus:border-po-primary focus:bg-white focus:shadow-[var(--po-focus-ring)]"

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
    <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <label htmlFor="register-email" className="text-sm font-semibold text-po-text">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="owner@petomi.vn"
          className={fieldClass}
          {...register("email")}
        />
        {errors.email?.message ? <p className="text-sm font-semibold text-po-danger">{errors.email.message}</p> : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="register-password" className="text-sm font-semibold text-po-text">
          Mật khẩu
        </label>
        <div className="relative">
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Tối thiểu 6 ký tự"
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
        <p className="text-sm leading-6 text-po-text-subtle">Dùng ít nhất 6 ký tự để bảo vệ tài khoản.</p>
        {errors.password?.message ? <p className="text-sm font-semibold text-po-danger">{errors.password.message}</p> : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="register-confirm-password" className="text-sm font-semibold text-po-text">
          Xác nhận mật khẩu
        </label>
        <div className="relative">
          <input
            id="register-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            className={`${fieldClass} pr-12`}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-po-text-muted transition hover:bg-white hover:text-po-text"
            onClick={onToggleConfirmPassword}
            aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.confirmPassword?.message ? <p className="text-sm font-semibold text-po-danger">{errors.confirmPassword.message}</p> : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="register-referral" className="text-sm font-semibold text-po-text">
          Mã giới thiệu <span className="font-normal text-po-text-subtle">(tùy chọn)</span>
        </label>
        <input
          id="register-referral"
          type="text"
          autoComplete="off"
          placeholder="Nhập mã nếu được bạn bè giới thiệu"
          className={fieldClass}
          {...register("referralCode")}
        />
        <p className="text-sm leading-6 text-po-text-subtle">Người giới thiệu bạn sẽ được cộng thêm lượt trò chuyện AI.</p>
        {errors.referralCode?.message ? <p className="text-sm font-semibold text-po-danger">{errors.referralCode.message}</p> : null}
      </div>

      {message ? (
        <FormStatusMessage
          status={status === "success" ? "success" : "error"}
          title={status === "success" ? "Đăng ký thành công" : "Chưa thể tạo tài khoản"}
          message={message}
        />
      ) : null}

      <button
        className="h-12 w-full rounded-full bg-po-primary text-[15px] font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl active:translate-y-0 disabled:translate-y-0 disabled:opacity-60"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
      </button>

      <p className="text-center text-sm text-po-text-muted">
        Đã có tài khoản?{" "}
        <button type="button" onClick={onSwitchToLogin} className="font-semibold text-po-primary transition hover:text-po-primary-hover">
          Đăng nhập
        </button>
      </p>
    </form>
  )
}
