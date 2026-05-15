import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import LoginPage from "./LoginPage"
import RegisterPage from "./RegisterPage"

type AuthMode = "login" | "register"

type AuthPageProps = {
  initialMode?: AuthMode
}

export default function AuthPage({ initialMode = "login" }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
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
      <header className="mx-auto flex min-h-20 w-[min(100%-32px,1280px)] items-center justify-between gap-4 motion-safe:animate-fade-in">
        <Link to="/" aria-label="Trang chủ PetOmi" className="flex items-center gap-2 font-extrabold text-po-text no-underline">
          <span className="grid size-9 place-items-center rounded-md bg-po-primary text-sm text-white">P</span>
          <span>PetOmi</span>
        </Link>

        <Link to="/" className="text-sm font-extrabold text-po-text-muted no-underline transition hover:text-po-primary">
          Về trang chủ
        </Link>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-80px)] w-[min(100%-32px,1180px)] items-center gap-10 py-8 lg:grid-cols-[1fr_480px] lg:gap-20">
        <aside className="grid gap-5 motion-safe:animate-fade-up">
          <p className="text-xs font-extrabold uppercase text-po-accent">PetOmi account</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-po-text md:text-6xl">
            {mode === "login" ? "Đăng nhập vào hệ thống" : "Tạo tài khoản mới"}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-po-text-muted">
            Truy cập hồ sơ thú cưng, lịch hẹn clinic, thiết bị đăng nhập và các trạng thái xác minh trong một tài khoản duy nhất.
          </p>

          <div className="grid max-w-2xl gap-3">
            {[
              ["Clinic review", "Clinic mới cần được admin phê duyệt trước khi hoạt động."],
              ["Secure sessions", "Mỗi phiên đăng nhập được gắn với thiết bị và refresh token riêng."],
              ["Email verification", "Tài khoản có luồng xác minh email để giảm rủi ro giả mạo."],
            ].map(([title, text]) => (
              <div key={title} className="grid gap-2 rounded-lg border border-po-border bg-white/70 p-4 backdrop-blur transition motion-safe:animate-fade-up hover:-translate-y-0.5 hover:border-teal-700/30 hover:bg-white md:grid-cols-[160px_1fr]">
                <strong className="text-sm text-po-text">{title}</strong>
                <span className="text-sm leading-6 text-po-text-muted">{text}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="w-full rounded-xl border border-po-border bg-white/95 p-5 shadow-2xl shadow-stone-950/10 backdrop-blur motion-safe:animate-fade-up [animation-delay:120ms] md:p-6" aria-label="Biểu mẫu tài khoản">
          <div className="mb-6 grid gap-5">
            <div>
              <span className="text-xs font-extrabold uppercase text-po-text-subtle">{mode === "login" ? "Welcome back" : "Create account"}</span>
              <h2 className="mt-1 text-3xl font-extrabold text-po-text">{mode === "login" ? "Đăng nhập" : "Đăng ký"}</h2>
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
