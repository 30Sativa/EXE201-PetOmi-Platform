import {
  Bell,
  Building2,
  CalendarClock,
  ClipboardList,
  ClipboardPlus,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  PackageSearch,
  Search,
  Settings,
  Stethoscope,
  UserRoundCog,
  type LucideIcon,
  Wrench,
} from "lucide-react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"

import Seo from "@/components/common/Seo"
import { useAuth } from "@/contexts/AuthContext"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { staffRoleDescription, staffRoleLabel } from "@/lib/clinicDisplay"
import { CLINIC_PERMISSIONS, hasAnyClinicPermission, type ClinicPermission } from "@/lib/clinicPermissions"
import { cn } from "@/lib/utils"

const navItems: Array<{
  label: string
  to: string
  icon: LucideIcon
  exact?: boolean
  permissions?: ClinicPermission[]
}> = [
  { label: "Tổng quan", to: "/dashboard/clinic", icon: LayoutDashboard, exact: true },
  { label: "Lịch hẹn", to: "/dashboard/clinic/appointments", icon: CalendarClock, permissions: [CLINIC_PERMISSIONS.VIEW_APPOINTMENTS] },
  { label: "Tiếp nhận", to: "/dashboard/clinic/pet-intake", icon: Search },
  { label: "Nhân sự", to: "/dashboard/clinic/doctors", icon: Stethoscope, permissions: [CLINIC_PERMISSIONS.MANAGE_STAFF] },
  { label: "Dịch vụ", to: "/dashboard/clinic/services", icon: Wrench, permissions: [CLINIC_PERMISSIONS.EDIT_INFO] },
  { label: "Kho", to: "/dashboard/clinic/inventory", icon: PackageSearch, permissions: [CLINIC_PERMISSIONS.VIEW_INVENTORY] },
  { label: "Thu ngân", to: "/dashboard/clinic/billing", icon: CreditCard, exact: true, permissions: [CLINIC_PERMISSIONS.VIEW_INVOICE] },
  { label: "Đối soát", to: "/dashboard/clinic/billing/reconciliation", icon: ClipboardList, permissions: [CLINIC_PERMISSIONS.RECONCILE_PAYMENT] },
  { label: "Hồ sơ phòng khám", to: "/dashboard/clinic/profile", icon: ClipboardPlus, permissions: [CLINIC_PERMISSIONS.EDIT_INFO] },
  { label: "Thanh toán", to: "/dashboard/clinic/payments", icon: Settings, permissions: [CLINIC_PERMISSIONS.CONFIGURE_PAYMENT] },
]

export default function ClinicDashboardLayout() {
  const { logout } = useAuth()
  const { data: clinic } = useMyClinic()
  const navigate = useNavigate()
  const clinicName = clinic?.clinicName?.trim() || "PetOmi"
  const clinicLogoUrl = clinic?.logoUrl
  const roleName = clinic?.clinicRoleName
  const visibleNavItems = navItems.filter((item) =>
    hasAnyClinicPermission(clinic, item.permissions ?? []),
  )

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-po-bg text-po-text">
      <Seo title="Khu quản lý phòng khám" noindex />
      <div className="mx-auto grid w-full max-w-[1360px] min-w-0 gap-5 px-3 py-4 sm:px-5 lg:grid-cols-[248px_minmax(0,1fr)] lg:py-6">
        <aside className="sticky top-6 hidden h-fit flex-col gap-4 rounded-[30px] bg-white/88 p-4 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 backdrop-blur lg:flex">
          <Link
            to="/dashboard/clinic"
            className="flex items-center gap-3 rounded-2xl px-2 py-1.5 text-sm font-extrabold text-po-text no-underline transition hover:bg-po-surface-muted"
          >
            <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-po-primary-soft text-po-primary ring-2 ring-po-primary-soft">
              {clinicLogoUrl ? (
                <img src={clinicLogoUrl} alt={clinicName} className="size-full object-cover" />
              ) : (
                <Building2 className="size-5" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base leading-tight">{clinicName}</span>
              <span className="block text-xs font-semibold text-po-text-subtle">Vận hành phòng khám</span>
            </span>
          </Link>

          {clinic ? <StaffProfile roleName={roleName} /> : null}

          <nav className="mt-1 grid gap-1">
            {visibleNavItems.map((item) => (
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
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-po-text-subtle">Phòng khám của bạn</p>
              <h1 className="mt-1 text-2xl font-extrabold leading-tight text-po-text md:text-3xl">
                Quản lý phòng khám
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">Menu</p>
            {clinic ? <StaffProfile roleName={roleName} compact /> : null}
            <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {visibleNavItems.map((item) => (
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
      <NavLink
        to="/dashboard/clinic/feedback"
        className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-extrabold text-white shadow-xl shadow-orange-200/50 transition hover:-translate-y-0.5 hover:bg-po-primary-hover"
      >
        <MessageSquareText className="size-4" />
        Góp ý web
      </NavLink>
    </div>
  )
}

function StaffProfile({
  roleName,
  compact,
}: {
  roleName?: string | null
  compact?: boolean
}) {
  return (
    <div className={cn("rounded-2xl bg-po-surface-muted/70 p-3 ring-1 ring-po-border/70", compact ? "ring-0" : "")}>
      <div className="flex items-start gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white text-po-primary ring-1 ring-po-border/70">
          <UserRoundCog className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold text-po-text">{staffRoleLabel(roleName)}</p>
          <p className="mt-1 line-clamp-3 text-[11px] font-medium leading-4 text-po-text-muted">
            {staffRoleDescription(roleName)}
          </p>
        </div>
      </div>
    </div>
  )
}
