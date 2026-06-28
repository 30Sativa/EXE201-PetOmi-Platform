import {
  Bell,
  Building2,
  CalendarCheck,
  ClipboardList,
  Bot,
  Crown,
  Link2,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PawPrint,
  UserRound,
} from "lucide-react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"

import Seo from "@/components/common/Seo"
import AbandonedUpgradeBanner from "@/components/dashboard/owner/AbandonedUpgradeBanner"
import Avatar from "@/components/ui/Avatar"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "@/hooks/useAuthQueries"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Tổng quan", to: "/dashboard/owner", icon: LayoutDashboard, exact: true },
  { label: "Thú cưng", to: "/dashboard/owner/pets", icon: PawPrint },
  { label: "Lịch hẹn", to: "/dashboard/owner/appointments", icon: CalendarCheck },
  { label: "AI Chat", to: "/dashboard/owner/chat", icon: Bot },
  { label: "AI Plan", to: "/dashboard/owner/ai-plan", icon: Crown },
  { label: "Đăng ký phòng khám", to: "/dashboard/owner/register-clinic", icon: Building2 },
  { label: "Lịch sử khám", to: "/dashboard/owner/history", icon: ClipboardList },
  { label: "Đánh giá", to: "/dashboard/owner/reviews", icon: MessageSquare },
  { label: "Nhắc nhở", to: "/dashboard/owner/reminders", icon: Bell },
  { label: "Chia sẻ", to: "/dashboard/owner/sharing", icon: Link2 },
  { label: "Hồ sơ", to: "/dashboard/owner/profile", icon: UserRound },
]

export default function OwnerDashboardLayout() {
  const { logout, user } = useAuth()
  const { data: profile } = useProfile()
  const navigate = useNavigate()
  const displayName = profile?.fullName?.trim() || "PetOmi"
  const accountLabel = user?.email || "Chăm sóc thú cưng"

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-po-bg text-po-text">
      <Seo title="Khu quản lý" noindex />
      <div className="mx-auto grid w-full max-w-[1360px] min-w-0 gap-5 px-3 py-4 sm:px-5 lg:grid-cols-[248px_minmax(0,1fr)] lg:py-6">
        <aside className="sticky top-6 hidden h-fit flex-col gap-4 rounded-[30px] bg-white/88 p-4 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 backdrop-blur lg:flex">
          <Link
            to="/dashboard/owner"
            className="flex items-center gap-3 rounded-2xl px-2 py-1.5 text-sm font-extrabold text-po-text no-underline transition hover:bg-po-surface-muted"
          >
            <Avatar
              src={profile?.avatarUrl}
              alt={displayName}
              size="md"
              shape="square"
              className="size-11 shrink-0 ring-2 ring-po-primary-soft"
            />
            <span className="min-w-0">
              <span className="block truncate text-base leading-tight">
                {displayName}
              </span>
              <span className="block truncate text-xs font-semibold text-po-text-subtle">
                {accountLabel}
              </span>
            </span>
          </Link>

          <nav className="mt-3 grid gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                    isActive
                      ? "bg-po-primary text-white shadow-sm shadow-orange-200/40"
                      : "text-po-text-muted hover:bg-po-surface-muted hover:text-po-text",
                  )
                }
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-[30px] bg-white/78 px-4 py-4 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 backdrop-blur sm:px-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-po-text-subtle">
                PetOmi của bạn
              </p>
              <h1 className="mt-1 text-2xl font-extrabold leading-tight text-po-text md:text-3xl">
                Quản lý thú cưng
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NavLink
                to="/dashboard/owner/notifications"
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold shadow-sm ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md",
                    isActive
                      ? "border-po-primary text-po-primary"
                      : "text-po-text-muted hover:text-po-text",
                  )
                }
              >
                <Bell className="size-4" />
                Thông báo
              </NavLink>
              <button
                onClick={handleLogout}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl active:translate-y-0"
              >
                <LogOut className="size-4" />
                Đăng xuất
              </button>
            </div>
          </header>

          <div className="flex min-w-0 flex-col gap-3 rounded-[28px] bg-white/82 p-4 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">
              Menu
            </p>
            <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition",
                      isActive
                        ? "bg-po-primary text-white shadow-sm shadow-orange-200/40"
                        : "bg-po-surface-muted text-po-text-muted hover:text-po-text",
                    )
                  }
                >
                  <item.icon className="size-3 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <AbandonedUpgradeBanner />

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}


