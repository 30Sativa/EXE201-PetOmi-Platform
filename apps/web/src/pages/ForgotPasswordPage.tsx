import {
  ArrowLeft,
  Clock3,
  MailCheck,
  PawPrint,
  ShieldCheck,
} from "lucide-react"
import { Link } from "react-router-dom"

import FormStatusMessage from "@/components/ui/FormStatusMessage"
import { useForgotPasswordForm } from "@/hooks"

const fieldClass =
  "h-12 w-full rounded-2xl border border-po-border bg-po-surface-muted/55 px-4 text-[15px] text-po-text transition placeholder:text-po-text-subtle focus:border-po-primary focus:bg-white focus:shadow-[var(--po-focus-ring)]"

const supportNotes = [
  {
    icon: MailCheck,
    title: "Kiểm tra email",
    text: "PetOmi gửi hướng dẫn đặt lại mật khẩu vào email đã đăng ký.",
  },
  {
    icon: ShieldCheck,
    title: "Liên kết an toàn",
    text: "Đường dẫn khôi phục có thời hạn để bảo vệ tài khoản của bạn.",
  },
  {
    icon: Clock3,
    title: "Hoàn tất nhanh",
    text: "Sau khi mở email, bạn chỉ cần tạo mật khẩu mới và đăng nhập lại.",
  },
]

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    status,
    message,
    onSubmit,
  } = useForgotPasswordForm()

  return (
    <main className="min-h-screen overflow-x-hidden bg-po-bg text-po-text">
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

      <section className="mx-auto grid min-h-[calc(100dvh-80px)] w-full max-w-[1200px] min-w-0 items-center gap-10 px-3 pb-12 pt-4 sm:px-6 lg:grid-cols-[1.05fr_0.86fr] lg:gap-16">
        <aside className="grid min-w-0 gap-7 motion-safe:animate-slide-in-left">
          <div className="min-w-0">
            <p className="border-l-2 border-po-primary pl-3 text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">
              Khôi phục tài khoản
            </p>
            <h1 className="mt-5 max-w-full break-words text-[2rem] font-extrabold leading-[1.08] text-po-text sm:text-4xl md:max-w-3xl md:text-6xl">
              Lấy lại quyền truy cập PetOmi.
            </h1>
            <p className="mt-5 max-w-full break-words text-sm leading-7 text-po-text-muted sm:text-base sm:leading-8 md:max-w-2xl">
              Nhập email bạn đã dùng để đăng ký. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu bằng một liên kết bảo mật.
            </p>
          </div>

          <div className="relative min-h-[480px] overflow-hidden rounded-[30px] bg-white shadow-xl shadow-orange-200/20 ring-1 ring-po-border/80 sm:min-h-[360px]">
            <img
              src="/vet-clinic.png"
              alt="Bác sĩ thú y trong phòng khám đang chuẩn bị thông tin chăm sóc cho thú cưng"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,247,237,0.05),_rgba(255,247,237,0.82))]" />
            <div className="absolute bottom-4 left-4 right-4 overflow-hidden rounded-[24px] bg-white/[0.9] p-4 shadow-xl shadow-orange-200/20 ring-1 ring-white/70 backdrop-blur sm:bottom-5 sm:left-5 sm:right-5">
              <p className="max-w-full break-words text-sm font-semibold text-po-text">
                Tài khoản an toàn thì hồ sơ thú cưng cũng được bảo vệ tốt hơn.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {supportNotes.map(({ icon: Icon, title, text }) => (
                  <div
                    key={title}
                    className="min-w-0 border-t border-po-border pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0"
                  >
                    <Icon className="size-4 text-po-primary" />
                    <strong className="mt-2 block text-xs text-po-text">
                      {title}
                    </strong>
                    <span className="mt-1 block text-xs leading-5 text-po-text-muted">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section
          className="w-full min-w-0 rounded-[30px] border border-po-border bg-white/[0.92] p-5 shadow-2xl shadow-orange-200/25 backdrop-blur motion-safe:animate-scale-in md:p-7"
          aria-label="Biểu mẫu khôi phục mật khẩu"
        >
          <div className="mb-7">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-po-text-subtle">
              Tài khoản
            </span>
            <h2 className="mt-2 max-w-full break-words text-3xl font-extrabold leading-tight text-po-text">
              Quên mật khẩu
            </h2>
            <p className="mt-2 max-w-full break-words text-sm leading-6 text-po-text-muted">
              Link khôi phục sẽ được gửi nếu email tồn tại trong hệ thống.
            </p>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-2">
              <label htmlFor="forgot-email" className="text-sm font-semibold text-po-text">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="owner@petomi.vn"
                className={fieldClass}
                {...register("email")}
              />
              {errors.email?.message ? (
                <p className="text-sm font-semibold text-po-danger">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            {message ? (
              <FormStatusMessage
                status={status === "success" ? "success" : "error"}
                title={status === "success" ? "Kiểm tra hộp thư của bạn" : "Chưa gửi được email"}
                message={message}
              />
            ) : null}

            <button
              className="h-12 w-full rounded-full bg-po-primary text-[15px] font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl active:translate-y-0 disabled:translate-y-0 disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang gửi..." : "Gửi email khôi phục"}
            </button>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-po-primary no-underline transition hover:text-po-primary-hover"
            >
              <ArrowLeft className="size-4" />
              Quay lại đăng nhập
            </Link>
          </form>
        </section>
      </section>
    </main>
  )
}
