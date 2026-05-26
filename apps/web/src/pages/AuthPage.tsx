import { useEffect, useState } from "react"
import { Bell, CalendarCheck, PawPrint, ShieldCheck, UserPlus } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { useMounted } from "@/hooks"
import LoginPage from "./LoginPage"
import RegisterPage from "./RegisterPage"
import type { AuthMode } from "@/types"

type AuthPageProps = {
  initialMode?: AuthMode
}

export default function AuthPage({ initialMode = "login" }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const mounted = useMounted()
  const navigate = useNavigate()

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    navigate(nextMode === "login" ? "/login" : "/register", { replace: true })
  }

  const authContent = mode === "login"
    ? {
        eyebrow: "Tiếp tục chăm sóc",
        headline: "Chào mừng trở lại với PetOmi.",
        description:
          "Đăng nhập để xem hồ sơ thú cưng, lịch hẹn và các nhắc nhở quan trọng trong một nơi.",
        formEyebrow: "Tài khoản đã có",
        formTitle: "Đăng nhập",
        helper:
          "Dùng tài khoản PetOmi để tiếp tục quản lý thú cưng và lịch chăm sóc.",
        highlights: [
          {
            icon: PawPrint,
            title: "Hồ sơ thú cưng",
            text: "Tiếp tục theo dõi thông tin, cân nặng và sức khỏe.",
          },
          {
            icon: CalendarCheck,
            title: "Lịch chăm sóc",
            text: "Xem lịch hẹn, tái khám và các việc cần làm sắp tới.",
          },
          {
            icon: Bell,
            title: "Nhắc nhở đúng lúc",
            text: "Không bỏ lỡ thuốc, vaccine hay lịch chăm sóc định kỳ.",
          },
        ],
      }
    : {
        eyebrow: "Bắt đầu với PetOmi",
        headline: "Tạo tài khoản để chăm sóc thú cưng dễ hơn.",
        description:
          "Khởi tạo tài khoản, thêm thú cưng và bắt đầu quản lý lịch chăm sóc chỉ trong vài bước.",
        formEyebrow: "Người dùng mới",
        formTitle: "Tạo tài khoản",
        helper:
          "Sau khi đăng ký, bạn có thể hoàn tất hồ sơ và thêm thú cưng đầu tiên.",
        highlights: [
          {
            icon: UserPlus,
            title: "Tạo tài khoản",
            text: "Xác minh email để bảo vệ dữ liệu cá nhân.",
          },
          {
            icon: PawPrint,
            title: "Thêm thú cưng",
            text: "Lưu giống, ngày sinh, ảnh đại diện và thông tin sức khỏe.",
          },
          {
            icon: ShieldCheck,
            title: "Quản lý an toàn",
            text: "Một tài khoản dùng cho chủ nuôi và cổng phòng khám.",
          },
        ],
      }

  return (
    <main className="min-h-screen text-po-text">
      <header className="mx-auto flex min-h-20 w-[min(100%-32px,1280px)] items-center justify-between gap-4">
        <Link to="/" aria-label="Trang chủ PetOmi" className="flex items-center gap-2 font-extrabold text-po-text no-underline">
          <span className="grid size-9 place-items-center rounded-xl bg-po-primary text-sm text-white">
            <PawPrint className="size-4" />
          </span>
          <span>PetOmi</span>
        </Link>

        <Link to="/" className="text-sm font-extrabold text-po-text-muted no-underline transition hover:text-po-primary">
          Về trang chủ
        </Link>
      </header>

      <section className={`mx-auto grid min-h-[calc(100vh-80px)] w-[min(100%-32px,1180px)] items-center gap-10 py-8 lg:grid-cols-[1fr_480px] lg:gap-20 ${mounted ? "motion-safe:animate-fade-in" : ""}`}>
        <aside className={`grid gap-5 ${mounted ? "motion-safe:animate-slide-in-left" : ""}`} style={{ animationDelay: "0ms" }}>
          <p className="text-xs font-extrabold uppercase tracking-wide text-po-accent">
            {authContent.eyebrow}
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-po-text md:text-5xl">
            {authContent.headline}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-po-text-muted">
            {authContent.description}
          </p>

          <div className="grid max-w-2xl gap-3">
            {authContent.highlights.map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                className="grid gap-3 rounded-lg border border-po-border bg-white/70 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:border-po-primary/30 hover:bg-white md:grid-cols-[40px_1fr]"
                style={{
                  animationDelay: `${(i + 1) * 80}ms`,
                  animation: mounted ? `po-fade-up 500ms cubic-bezier(0.2,0.8,0.2,1) both` : "none",
                }}
              >
                <span className="grid size-10 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                  <Icon className="size-5" />
                </span>
                <span>
                  <strong className="block text-sm text-po-text">{title}</strong>
                  <span className="mt-1 block text-sm leading-6 text-po-text-muted">{text}</span>
                </span>
              </div>
            ))}
          </div>
        </aside>

        <section
          className="w-full rounded-xl border border-po-border bg-white/95 p-5 shadow-2xl shadow-stone-950/10 backdrop-blur md:p-6"
          aria-label="Biểu mẫu tài khoản"
          style={{
            animation: mounted ? `po-scale-in 500ms cubic-bezier(0.2,0.8,0.2,1) 120ms both` : "none",
          }}
        >
          <div className="mb-6 grid gap-5">
            <div>
              <span className="text-xs font-extrabold uppercase text-po-text-subtle">
                {authContent.formEyebrow}
              </span>
              <h2 className="mt-1 text-3xl font-extrabold text-po-text">
                {authContent.formTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-po-text-muted">
                {authContent.helper}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-lg border border-po-border bg-po-surface-muted p-1" role="tablist" aria-label="Chọn biểu mẫu tài khoản">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={`h-10 rounded-md text-sm font-extrabold transition ${
                  mode === "login" ? "bg-white text-po-primary shadow-sm" : "text-po-text-muted hover:text-po-primary"
                }`}
                onClick={() => switchMode("login")}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "register"}
                className={`h-10 rounded-md text-sm font-extrabold transition ${
                  mode === "register" ? "bg-white text-po-primary shadow-sm" : "text-po-text-muted hover:text-po-primary"
                }`}
                onClick={() => switchMode("register")}
              >
                Đăng ký
              </button>
            </div>
          </div>

          {mode === "login" ? (
            <LoginPage onSwitchToRegister={() => switchMode("register")} />
          ) : (
            <RegisterPage onSwitchToLogin={() => switchMode("login")} />
          )}
        </section>
      </section>
    </main>
  )
}
