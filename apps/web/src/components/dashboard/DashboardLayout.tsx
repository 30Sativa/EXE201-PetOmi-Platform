import { Bell, LayoutDashboard, PawPrint, Settings, ShieldCheck, Stethoscope } from "lucide-react"
import { Link, NavLink, Outlet } from "react-router-dom"

const navItems = [
  { label: "Owner", to: "/dashboard/owner", icon: PawPrint },
  { label: "Clinic", to: "/dashboard/clinic", icon: Stethoscope },
  { label: "Admin", to: "/dashboard/admin", icon: ShieldCheck },
]

export default function DashboardLayout() {
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

          <nav className="grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition",
                      isActive
                        ? "bg-po-primary-soft text-po-primary"
                        : "text-po-text-muted hover:bg-po-surface-muted hover:text-po-text",
                    ].join(" ")
                  }
                >
                  <Icon className="size-4" />
                  {item.label} Dashboard
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-auto grid gap-2 rounded-2xl border border-po-border bg-po-surface-muted p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-po-text">
              <Settings className="size-4" />
              Thiết lập nhanh
            </div>
            <p className="text-xs text-po-text-muted">Cập nhật hồ sơ, thông báo và quyền truy cập.</p>
          </div>
        </aside>

        <div className="flex flex-1 flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-po-border bg-white/90 px-4 py-3 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Dashboard</p>
              <h1 className="text-xl font-extrabold text-po-text md:text-2xl">Tổng quan vận hành</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-full border border-po-border bg-white px-4 text-sm font-semibold text-po-text-muted transition hover:text-po-text">
                <Bell className="size-4" />
                Thông báo
              </button>
              <Link
                to="/login"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
              >
                Đăng xuất
              </Link>
            </div>
          </header>

          <div className="flex flex-col gap-4 rounded-[28px] border border-po-border bg-white/90 p-4 shadow-sm md:hidden">
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition",
                        isActive
                          ? "bg-po-primary-soft text-po-primary"
                          : "bg-po-surface-muted text-po-text-muted hover:text-po-text",
                      ].join(" ")
                    }
                  >
                    <Icon className="size-3" />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
