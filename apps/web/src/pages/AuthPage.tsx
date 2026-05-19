import { useEffect, useState } from "react"
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

  return (
    <main className="min-h-screen text-po-text">
      <header className="mx-auto flex min-h-20 w-[min(100%-32px,1280px)] items-center justify-between gap-4">
        <Link to="/" aria-label="Trang chủ PetOmi" className="flex items-center gap-2 font-extrabold text-po-text no-underline">
          <span className="grid size-9 place-items-center rounded-md bg-po-primary text-sm text-white">P</span>
          <span>PetOmi</span>
        </Link>

        <Link to="/" className="text-sm font-extrabold text-po-text-muted no-underline transition hover:text-po-primary">
          Về trang chủ
        </Link>
      </header>

      <section className={`mx-auto grid min-h-[calc(100vh-80px)] w-[min(100%-32px,1180px)] items-center gap-10 py-8 lg:grid-cols-[1fr_480px] lg:gap-20 ${mounted ? "motion-safe:animate-fade-in" : ""}`}>
        <aside className={`grid gap-5 ${mounted ? "motion-safe:animate-slide-in-left" : ""}`} style={{ animationDelay: "0ms" }}>
          <p className="text-xs font-extrabold uppercase text-po-accent">Tài khoản PetOmi</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-po-text md:text-5xl">
            {mode === "login"
              ? "Chào mừng trở lại! Rất nhớ bạn."
              : "Tạo tài khoản để bắt đầu chăm sóc thú cưng."}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-po-text-muted">
            Một tài khoản dùng cho cả app chủ nuôi và cổng phòng khám. An toàn, bảo mật và miễn phí.
          </p>

          <div className="grid max-w-2xl gap-3">
            {[
              ["Dùng chung 1 tài khoản", "Chuyển đổi giữa vai trò chủ nuôi và bác sĩ dễ dàng."],
              ["Quản lý thiết bị", "Biết được thiết bị nào đang đăng nhập tài khoản của bạn."],
              ["Bảo mật nâng cao", "Xác minh email và bảo vệ tài khoản bằng mật khẩu mạnh."],
            ].map(([title, text], i) => (
              <div
                key={title}
                className="grid gap-2 rounded-lg border border-po-border bg-white/70 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:border-teal-700/30 hover:bg-white md:grid-cols-[180px_1fr]"
                style={{
                  animationDelay: `${(i + 1) * 80}ms`,
                  animation: mounted ? `po-fade-up 500ms cubic-bezier(0.2,0.8,0.2,1) both` : "none",
                }}
              >
                <strong className="text-sm text-po-text">{title}</strong>
                <span className="text-sm leading-6 text-po-text-muted">{text}</span>
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
                {mode === "login" ? "Chào mừng quay lại" : "Tạo tài khoản mới"}
              </span>
              <h2 className="mt-1 text-3xl font-extrabold text-po-text">
                {mode === "login" ? "Đăng nhập PetOmi" : "Đăng ký PetOmi"}
              </h2>
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
