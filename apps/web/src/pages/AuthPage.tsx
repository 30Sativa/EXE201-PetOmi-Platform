import { useEffect, useState } from "react"
import { ArrowLeft, Bell, CalendarCheck, PawPrint, ShieldCheck, UserPlus } from "lucide-react"
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
        headline: "Hồ sơ thú cưng luôn sẵn sàng.",
        description:
          "Xem lịch hẹn, nhắc nhở và thông tin bác sĩ cần trước lần khám tiếp theo.",
        formEyebrow: "Tài khoản đã có",
        formTitle: "Đăng nhập",
        helper:
          "Dùng email đã đăng ký để tiếp tục quản lý thú cưng và lịch chăm sóc.",
        visualCaption: "Theo dõi triệu chứng và lịch khám trong một hồ sơ.",
        highlights: [
          {
            icon: PawPrint,
            title: "Hồ sơ thú cưng",
            text: "Thông tin sức khỏe được giữ nhất quán qua từng lần khám.",
          },
          {
            icon: CalendarCheck,
            title: "Lịch chăm sóc",
            text: "Xem lịch hẹn, tái khám và các việc cần làm sắp tới.",
          },
          {
            icon: Bell,
            title: "Nhắc đúng lúc",
            text: "Không bỏ lỡ thuốc, vaccine hay mốc chăm sóc định kỳ.",
          },
        ],
      }
    : {
        eyebrow: "Bắt đầu với PetOmi",
        headline: "Bắt đầu chăm sóc có hệ thống.",
        description:
          "Tạo tài khoản, thêm thú cưng và bắt đầu lưu hồ sơ, nhắc lịch, đặt khám.",
        formEyebrow: "Người dùng mới",
        formTitle: "Tạo tài khoản",
        helper:
          "Sau khi đăng ký, bạn có thể hoàn tất hồ sơ và thêm thú cưng đầu tiên.",
        visualCaption: "Chuẩn bị thông tin rõ hơn trước khi tới phòng khám.",
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
            title: "Chia sẻ có kiểm soát",
            text: "Chủ nuôi quyết định khi nào chia sẻ hồ sơ với phòng khám.",
          },
        ],
      }

  return (
    <main className="min-h-screen overflow-x-hidden bg-po-bg text-po-text">
      <header className="mx-auto flex min-h-20 w-full max-w-[1200px] items-center justify-between gap-4 px-3 sm:px-6">
        <Link to="/" aria-label="Trang chủ PetOmi" className="flex items-center gap-2 font-extrabold text-po-text no-underline">
          <span className="grid size-10 place-items-center rounded-2xl bg-po-primary text-sm text-white shadow-lg shadow-orange-200/40">
            <PawPrint className="size-4" />
          </span>
          <span>PetOmi</span>
        </Link>

        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-po-text-muted no-underline transition hover:text-po-primary">
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Về trang chủ</span>
        </Link>
      </header>

      <section className={`mx-auto grid min-h-[calc(100dvh-80px)] w-full max-w-[1200px] min-w-0 items-center justify-items-start gap-10 px-3 pb-12 pt-4 sm:px-6 lg:grid-cols-[1.05fr_0.86fr] lg:justify-items-stretch lg:gap-16 ${mounted ? "motion-safe:animate-fade-in" : ""}`}>
        <aside className={`grid w-full min-w-0 gap-7 ${mounted ? "motion-safe:animate-slide-in-left" : ""}`} style={{ animationDelay: "0ms" }}>
          <div className="min-w-0">
            <p className="border-l-2 border-po-primary pl-3 text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">
              {authContent.eyebrow}
            </p>
            <h1 className="mt-5 max-w-full text-3xl font-extrabold leading-[1.06] text-po-text sm:text-4xl md:max-w-3xl md:text-6xl">
              {authContent.headline}
            </h1>
            <p className="mt-5 max-w-full text-sm leading-7 text-po-text-muted sm:text-base sm:leading-8 md:max-w-2xl">
              {authContent.description}
            </p>
          </div>

          <div className="relative min-h-[430px] w-full min-w-0 overflow-hidden rounded-[30px] bg-po-text shadow-xl shadow-orange-200/25 sm:min-h-[360px]">
            <img
              src={mode === "login" ? "/vet-clinic.png" : "/hero-pets-new.png"}
              alt={mode === "login" ? "Bác sĩ thú y kiểm tra sức khỏe cho chó trong phòng khám" : "Bác sĩ thú y đang khám cho một chú chó trong phòng khám sáng sủa"}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(74,47,33,0.1),_rgba(74,47,33,0.78))]" />
            <div className="absolute bottom-4 left-4 right-4 min-w-0 rounded-[24px] border border-white/70 bg-white/[0.88] p-4 shadow-xl backdrop-blur sm:bottom-5 sm:left-5 sm:right-5">
              <p className="max-w-full break-words text-sm font-semibold text-po-text">{authContent.visualCaption}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {authContent.highlights.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="min-w-0 border-t border-po-border pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                    <Icon className="size-4 text-po-primary" />
                    <strong className="mt-2 block text-xs text-po-text">{title}</strong>
                    <span className="mt-1 block break-words text-xs leading-5 text-po-text-muted">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section
          className="w-full min-w-0 rounded-[30px] border border-po-border bg-white/[0.92] p-5 shadow-2xl shadow-orange-200/25 backdrop-blur md:p-7"
          aria-label="Biểu mẫu tài khoản"
          style={{
            animation: mounted ? `po-scale-in 500ms cubic-bezier(0.2,0.8,0.2,1) 120ms both` : "none",
          }}
        >
          <div className="mb-7 grid gap-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-po-text-subtle">
                {authContent.formEyebrow}
              </span>
              <h2 className="mt-2 text-3xl font-extrabold leading-tight text-po-text">
                {authContent.formTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-po-text-muted">
                {authContent.helper}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-po-border bg-po-surface-muted p-1" role="tablist" aria-label="Chọn biểu mẫu tài khoản">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={`h-11 rounded-xl text-sm font-semibold transition ${
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
                className={`h-11 rounded-xl text-sm font-semibold transition ${
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
