import {
  Activity,
  Bell,
  BadgeCheck,
  ClipboardCheck,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
} from "lucide-react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"

import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Tổng quan", to: "/dashboard/admin", icon: LayoutDashboard, exact: true },
  { label: "Duyệt clinic", to: "/dashboard/admin/clinics", icon: BadgeCheck },
  { label: "Người dùng", to: "/dashboard/admin/users", icon: UsersRound },
  { label: "Roles", to: "/dashboard/admin/roles", icon: KeyRound },
  { label: "Cảnh báo", to: "/dashboard/admin/alerts", icon: ShieldAlert },
  { label: "Nhật ký", to: "/dashboard/admin/audit-logs", icon: Activity },
  { label: "Cài đặt", to: "/dashboard/admin/settings", icon: Settings },
]

export default function AdminDashboardLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-po-bg text-po-text">
      <div className="mx-auto grid w-full max-w-[1360px] min-w-0 gap-5 px-3 py-4 sm:px-5 lg:grid-cols-[248px_minmax(0,1fr)] lg:py-6">
        <aside className="sticky top-6 hidden h-fit flex-col gap-4 rounded-[30px] bg-white/88 p-4 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 backdrop-blur lg:flex">
          <Link
            to="/dashboard/admin"
            className="flex items-center gap-3 rounded-2xl px-2 py-1.5 text-sm font-extrabold text-po-text no-underline transition hover:bg-po-surface-muted"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-po-primary text-white shadow-sm shadow-orange-200">
              <ShieldCheck className="size-5" />
            </span>
            <span>
              <span className="block text-base leading-tight">PetOmi</span>
              <span className="block text-xs font-semibold text-po-text-subtle">
                Admin console
              </span>
            </span>
          </Link>

          <div className="rounded-2xl bg-po-primary-soft px-3 py-3 text-xs font-semibold leading-5 text-po-primary ring-1 ring-po-border/60">
            Kiểm soát clinic, người dùng và quyền truy cập trong một nơi.
          </div>

          <nav className="mt-1 grid gap-1">
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

          <div className="mt-auto grid gap-2 rounded-2xl bg-po-surface-muted/80 p-4 text-sm ring-1 ring-po-border/70">
            <div className="flex items-center gap-2 font-semibold text-po-text">
              <ClipboardCheck className="size-4" />
              Review flow
            </div>
            <p className="text-xs leading-5 text-po-text-muted">
              Ưu tiên hồ sơ pending, theo dõi audit và xử lý cảnh báo trước khi cấp quyền.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-[30px] bg-white/78 px-4 py-4 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 backdrop-blur sm:px-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-po-text-subtle">
                Admin workspace
              </p>
              <h1 className="mt-1 text-2xl font-extrabold leading-tight text-po-text md:text-3xl">
                Dashboard quản trị
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-po-text-muted shadow-sm ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:text-po-text hover:shadow-md">
                <Bell className="size-4" />
                Thông báo
              </button>
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

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

