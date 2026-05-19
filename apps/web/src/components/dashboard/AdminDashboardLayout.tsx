import { Bell, BadgeCheck, KeyRound, LayoutDashboard, LogOut, Settings, ShieldAlert, UsersRound } from "lucide-react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"

import { useAuth } from "@/contexts/AuthContext"

const navItems = [
  { label: "Tổng quan", to: "/dashboard/admin", icon: LayoutDashboard, exact: true },
  { label: "Duyệt Clinic", to: "/dashboard/admin/clinics", icon: BadgeCheck },
  { label: "Users", to: "/dashboard/admin/users", icon: UsersRound },
  { label: "Roles & Permissions", to: "/dashboard/admin/roles", icon: KeyRound },
  { label: "Cảnh báo", to: "/dashboard/admin/alerts", icon: ShieldAlert },
]

export default function AdminDashboardLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-po-bg text-po-text">
      <div className="mx-auto flex w-[min(100%-24px,1280px)] flex-col gap-6 py-6 md:flex-row">
        <aside className="hidden w-64 flex-col gap-6 rounded-[28px] border border-po-border bg-white/90 p-5 shadow-sm md:flex">
          <Link to="/" className="flex items-center gap-2 text-sm font-extrabold text-po-text no-underline">
            <span className="grid size-10 place-items-center rounded-2xl bg-po-primary text-white">
              <LayoutDashboard className="size-5" />
            </span>
            <span className="text-base">PetOmi</span>
          </Link>

          <div className="rounded-2xl border border-po-border bg-po-primary-soft px-3 py-2 text-xs font-semibold text-po-primary">
            Quản trị viên (Admin)
          </div>

          <nav className="grid gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition",
                    isActive
                      ? "bg-po-primary-soft text-po-primary"
                      : "text-po-text-muted hover:bg-po-surface-muted hover:text-po-text",
                  ].join(" ")
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto grid gap-2 rounded-2xl border border-po-border bg-po-surface-muted p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-po-text">
              <Settings className="size-4" />
              Thiết lập nhanh
            </div>
            <p className="text-xs text-po-text-muted">Cấu hình hệ thống, theo dõi hoạt động và bảo mật.</p>
          </div>
        </aside>

        <div className="flex flex-1 flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-po-border bg-white/90 px-4 py-3 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Admin</p>
              <h1 className="text-xl font-extrabold text-po-text md:text-2xl">Dashboard Quản trị</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-full border border-po-border bg-white px-4 text-sm font-semibold text-po-text-muted transition hover:text-po-text">
                <Bell className="size-4" />
                Thông báo
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
              >
                <LogOut className="size-4" />
                Đăng xuất
              </button>
            </div>
          </header>

          <div className="flex flex-col gap-4 rounded-[28px] border border-po-border bg-white/90 p-4 shadow-sm md:hidden">
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition",
                      isActive
                        ? "bg-po-primary-soft text-po-primary"
                        : "bg-po-surface-muted text-po-text-muted hover:text-po-text",
                    ].join(" ")
                  }
                >
                  <item.icon className="size-3" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
