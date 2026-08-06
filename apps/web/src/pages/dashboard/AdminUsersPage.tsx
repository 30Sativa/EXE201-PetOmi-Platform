import { useEffect, useState } from "react"
import {
  Ban,
  CakeSlice,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  Eye,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Search,
  ToggleRight,
  UsersRound,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import AdminPageHeader from "@/components/dashboard/AdminPageHeader"
import StatusBadge from "@/components/ui/StatusBadge"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import EmptyState from "@/components/ui/EmptyState"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import { maskEmail } from "@/lib/format"
import {
  getAdminUsersApi,
  toggleUserStatusApi,
  assignAdminRoleApi,
} from "@/services/admin.service"
import type { AdminUserListResponse, PagedData } from "@/types"

function getPagedItems<T>(paged?: PagedData<T>) {
  return paged?.items ?? paged?.Items ?? []
}

function getPagedMeta(paged?: PagedData<unknown>) {
  return paged?.meta ?? paged?.Meta
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

function formatAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return "Chưa có tuổi"

  const birthDate = new Date(`${dateOfBirth.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(birthDate.getTime())) return "Chưa có tuổi"

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const birthdayHasPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())

  if (!birthdayHasPassed) age -= 1
  return age >= 0 ? `${age} tuổi` : "Chưa có tuổi"
}

type FilterTab = "all" | "active" | "inactive"

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterTab>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [toggleTarget, setToggleTarget] = useState<AdminUserListResponse | null>(null)
  const [assignTarget, setAssignTarget] = useState<AdminUserListResponse | null>(null)
  const [detailTarget, setDetailTarget] = useState<AdminUserListResponse | null>(null)

  const isActiveParam =
    filter === "active" ? true : filter === "inactive" ? false : undefined

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search, isActiveParam, page],
    queryFn: () => getAdminUsersApi({ search, isActive: isActiveParam, page, pageSize }),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      toggleUserStatusApi(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      setToggleTarget(null)
    },
  })

  const assignMutation = useMutation({
    mutationFn: (userId: string) => assignAdminRoleApi(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      setAssignTarget(null)
    },
  })

  const items = getPagedItems(data)
  const meta = getPagedMeta(data)
  const totalPages = meta?.totalPages ?? 1
  const totalRecords = meta?.totalRecords ?? items.length
  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1
  const endRecord = Math.min(page * pageSize, totalRecords)

  const filterTabs: { label: string; value: FilterTab }[] = [
    { label: "Tất cả", value: "all" },
    { label: "Đang hoạt động", value: "active" },
    { label: "Bị khóa", value: "inactive" },
  ]

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        kicker="Admin user management"
        title="Quản lý người dùng"
        description="Theo dõi tài khoản, trạng thái hoạt động và thao tác phân quyền admin."
        icon={UsersRound}
        metrics={[
          { label: "Tổng người dùng", value: String(meta?.totalRecords ?? 0), icon: UsersRound },
          { label: "Đang hoạt động", value: String(items.filter((u) => u.isActive).length), icon: CheckCircle2, tone: "success" },
          { label: "Bị khóa", value: String(items.filter((u) => !u.isActive).length), icon: Ban, tone: "danger" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-po-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm email, tên..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white text-sm text-po-text ring-1 ring-po-border/80 placeholder:text-po-text-muted/70 focus:outline-none focus:ring-2 focus:ring-po-primary/40 transition"
          />
        </div>

        <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-white p-1 ring-1 ring-po-border/80">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setFilter(tab.value); setPage(1) }}
              className={`shrink-0 whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-semibold transition ${
                filter === tab.value
                  ? "bg-po-primary text-white"
                  : "text-po-text-muted hover:bg-po-surface-muted hover:text-po-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-shell">
        <div className="grid gap-3 p-3 md:hidden">
          {isLoading ? (
            <div className="py-14 text-center">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="Không có người dùng nào"
              description={
                search ? "Thử lại từ khóa khác" : "Chưa có người dùng trong hệ thống"
              }
            />
          ) : (
            items.map((user) => (
              <UserMobileCard
                key={user.userId}
                user={user}
                isTogglePending={toggleMutation.isPending}
                isAssignPending={assignMutation.isPending}
                onToggle={() => setToggleTarget(user)}
                onAssign={() => setAssignTarget(user)}
                onView={() => setDetailTarget(user)}
              />
            ))
          )}
        </div>

        <div className="admin-table-scroll hidden md:block">
          <table className="admin-table min-w-[820px]">
            <thead>
              <tr className="border-b border-[#F1E3D2] bg-gradient-to-b from-[#FFFCF8] to-[#FFF9F2]">
                <th className="w-[300px] border-r border-[#F4E7D8] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-[#F5F7FA] text-po-text-subtle ring-1 ring-[#EAEFF5]">
                      <UsersRound className="size-4" />
                    </span>
                    <span>Người dùng</span>
                  </div>
                </th>
                <th className="w-[110px] border-r border-[#F4E7D8] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  <div className="flex items-center gap-2 justify-center">
                    <span>Trạng thái</span>
                  </div>
                </th>
                <th className="w-[110px] border-r border-[#F4E7D8] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  <div className="flex items-center gap-2 justify-center">
                    <span>Quyền</span>
                  </div>
                </th>
                <th className="w-[180px] border-r border-[#F4E7D8] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  <div className="flex items-center justify-center gap-2">
                    <span className="grid size-7 place-items-center rounded-full bg-[#F5F7FA] text-po-text-subtle ring-1 ring-[#EAEFF5]">
                      <Clock3 className="size-4" />
                    </span>
                    <span>Hoạt động gần nhất</span>
                  </div>
                </th>
                <th className="w-[140px] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  <div className="flex items-center justify-center gap-2">
                    <span>Hành động</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4E8D9]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={UsersRound}
                      title="Không có người dùng nào"
                      description={
                        search ? "Thử lại từ khóa khác" : "Chưa có người dùng trong hệ thống"
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((user) => (
                  <tr
                    key={user.userId}
                    className="group transition hover:bg-[#FFF9F2]"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#FFE4BF] text-[#B96A00] text-sm font-extrabold ring-1 ring-[#FFD8A0]">
                          {user.fullName ? user.fullName[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-po-text">
                            {user.fullName ?? "Chưa có tên"}
                          </p>
                          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-po-text-muted">
                            <Mail className="size-3 shrink-0" />
                            <span className="truncate">{maskEmail(user.email)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <StatusBadge
                        variant={user.isActive ? "success" : "danger"}
                        label={user.isActive ? "Hoạt động" : "Bị khóa"}
                        className="whitespace-nowrap px-3 py-1 text-[11px] font-bold"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex max-w-[110px] flex-wrap justify-center gap-1.5">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap ${
                                role === "Admin"
                                  ? "bg-[#FFF0D9] text-[#E07B00]"
                                  : "bg-[#F6EFE6] text-po-text-muted"
                              }`}
                            >
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-po-text-muted">Không có quyền</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-po-text-muted whitespace-nowrap">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Chưa đăng nhập"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailTarget(user)}
                          className="grid size-9 shrink-0 place-items-center rounded-full border border-[#E8D9C7] bg-white text-po-text-muted transition hover:-translate-y-0.5 hover:border-po-primary/40 hover:bg-po-primary-soft hover:text-po-primary"
                          title="Xem chi tiết"
                          aria-label={`Xem chi tiết ${user.fullName ?? user.email}`}
                        >
                          <Eye className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setToggleTarget(user)}
                          disabled={toggleMutation.isPending}
                          className={`grid size-9 shrink-0 place-items-center rounded-full border transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                            user.isActive
                              ? "border-[#FFB8B8] bg-[#FFF1F1] text-[#FF4D4F] hover:bg-[#FF4D4F] hover:text-white"
                              : "border-[#BFE7C6] bg-[#F0FFF3] text-[#10A04A] hover:bg-[#10A04A] hover:text-white"
                          }`}
                          title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          aria-label={`${user.isActive ? "Khóa" : "Mở khóa"} ${user.fullName ?? user.email}`}
                        >
                          {user.isActive ? (
                            <Ban className="size-3.5" />
                          ) : (
                            <ToggleRight className="size-3.5" />
                          )}
                        </button>

                        {!user.roles.includes("Admin") && (
                          <button
                            type="button"
                            onClick={() => setAssignTarget(user)}
                            disabled={assignMutation.isPending}
                            className="grid size-9 shrink-0 place-items-center rounded-full border border-[#FFD39A] bg-[#FFF6EA] text-[#F59E0B] transition hover:-translate-y-0.5 hover:bg-[#F59E0B] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            title="Gán quyền Admin"
                            aria-label={`Gán quyền Admin cho ${user.fullName ?? user.email}`}
                          >
                            <KeyRound className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-4 border-t border-[#F3E8D8] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-sm text-po-text-muted">
                <label className="inline-flex items-center gap-2">
                  <span className="font-medium text-po-text-muted">Hiển thị</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                    className="h-9 rounded-xl border border-[#E8D9C7] bg-white px-3 text-sm font-semibold text-po-text outline-none transition focus:border-po-primary/40"
                  >
                    {[10, 20, 50].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="font-medium text-po-text-muted">kết quả mỗi trang</span>
              </div>

              <p className="text-sm font-medium text-po-text-muted">
                {totalRecords === 0 ? "0 kết quả" : `${startRecord} - ${endRecord} của ${totalRecords} kết quả`}
              </p>

              <div className="flex items-center gap-2 self-end lg:self-auto">
                <button
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                  className="inline-flex size-9 items-center justify-center rounded-xl bg-white text-po-text-muted ring-1 ring-[#E8D9C7] transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Trang đầu"
                >
                  <ChevronsLeft className="size-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex size-9 items-center justify-center rounded-xl bg-white text-po-text-muted ring-1 ring-[#E8D9C7] transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  className="inline-flex size-9 items-center justify-center rounded-xl bg-[#F6D6A8] text-[#9A5C00] shadow-sm ring-1 ring-[#F0C98B]"
                  aria-current="page"
                >
                  {page}
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex size-9 items-center justify-center rounded-xl bg-white text-po-text-muted ring-1 ring-[#E8D9C7] transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="size-4" />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  className="inline-flex size-9 items-center justify-center rounded-xl bg-white text-po-text-muted ring-1 ring-[#E8D9C7] transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Trang cuối"
                >
                  <ChevronsRight className="size-4" />
                </button>
              </div>
            </div>
          )}
      </div>

      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => {
          if (!toggleTarget) return
          toggleMutation.mutate({
            userId: toggleTarget.userId,
            isActive: !toggleTarget.isActive,
          })
        }}
        title={toggleTarget?.isActive ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}
        description={
          toggleTarget?.isActive
            ? `${toggleTarget.fullName ?? toggleTarget.email} sẽ không thể đăng nhập vào hệ thống.`
            : `${toggleTarget?.fullName ?? toggleTarget?.email} sẽ có thể đăng nhập trở lại.`
        }
        confirmLabel={toggleTarget?.isActive ? "Khóa" : "Mở khóa"}
        variant={toggleTarget?.isActive ? "danger" : "primary"}
        isLoading={toggleMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        onConfirm={() => {
          if (!assignTarget) return
          assignMutation.mutate(assignTarget.userId)
        }}
        title="Gán quyền Admin?"
        description={`${assignTarget?.fullName ?? assignTarget?.email} sẽ có quyền Admin và có thể truy cập dashboard quản trị.`}
        confirmLabel="Gán Admin"
        variant="primary"
        isLoading={assignMutation.isPending}
      />

      <UserDetailModal
        user={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
    </div>
  )
}

function UserMobileCard({
  user,
  isTogglePending,
  isAssignPending,
  onToggle,
  onAssign,
  onView,
}: {
  user: AdminUserListResponse
  isTogglePending: boolean
  isAssignPending: boolean
  onToggle: () => void
  onAssign: () => void
  onView: () => void
}) {
  return (
    <article className="rounded-[24px] bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70">
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-sm font-extrabold text-po-primary ring-1 ring-po-border/80">
          {user.fullName ? user.fullName[0].toUpperCase() : user.email[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-extrabold text-po-text">
                {user.fullName ?? "Chưa có tên"}
              </h3>
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-po-text-muted">
                <Mail className="size-3 shrink-0" />
                <span className="truncate">{maskEmail(user.email)}</span>
              </p>
            </div>
            <StatusBadge
              variant={user.isActive ? "success" : "danger"}
              label={user.isActive ? "Hoạt động" : "Bị khóa"}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {user.roles.length > 0 ? (
              user.roles.map((role) => (
                <span
                  key={role}
                  className={`inline-flex items-center rounded-2xl px-2 py-0.5 text-[10px] font-semibold ${
                    role === "Admin"
                      ? "bg-po-primary-soft text-po-primary"
                      : "bg-white text-po-text-muted ring-1 ring-po-border/70"
                  }`}
                >
                  {role}
                </span>
              ))
            ) : (
              <span className="text-xs text-po-text-muted">Không có quyền</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2.5 text-xs text-po-text-muted ring-1 ring-po-border/60">
        <Clock3 className="size-3.5 shrink-0" />
        <span>Hoạt động gần nhất:</span>
        <span className="font-semibold text-po-text">
          {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Chưa đăng nhập"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white px-3 text-xs font-semibold text-po-text-muted ring-1 ring-po-border/70 transition hover:-translate-y-0.5 hover:text-po-primary"
        >
          <Eye className="size-3.5" />
          Chi tiết
        </button>

        <button
          type="button"
          onClick={onToggle}
          disabled={isTogglePending}
          className={`inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 text-xs font-semibold transition hover:-translate-y-0.5 disabled:opacity-50 ${
            user.isActive
              ? "bg-po-danger-soft text-po-danger hover:bg-po-danger hover:text-white"
              : "bg-po-success-soft text-po-success hover:bg-po-success hover:text-white"
          }`}
        >
          {user.isActive ? (
            <>
              <Ban className="size-3.5" />
              Khóa
            </>
          ) : (
            <>
              <ToggleRight className="size-3.5" />
              Mở khóa
            </>
          )}
        </button>

        {!user.roles.includes("Admin") ? (
          <button
            type="button"
            onClick={onAssign}
            disabled={isAssignPending}
            className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-2xl bg-po-primary-soft px-3 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white disabled:opacity-50"
          >
            <KeyRound className="size-3.5" />
            Gán Admin
          </button>
        ) : null}
      </div>
    </article>
  )
}

function UserDetailModal({
  user,
  onClose,
}: {
  user: AdminUserListResponse | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!user) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose, user])

  if (!user) return null

  const displayName = user.fullName ?? "Chưa có tên"

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-po-text/45 px-3 py-5 backdrop-blur-sm sm:px-4"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-detail-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-orange-950/20 ring-1 ring-po-border/80"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-po-border/70 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-base font-extrabold text-po-primary ring-1 ring-po-primary/15">
              {displayName === "Chưa có tên"
                ? user.email[0].toUpperCase()
                : displayName[0].toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase text-po-text-subtle">
                Chi tiết người dùng
              </p>
              <h2 id="admin-user-detail-title" className="truncate text-xl font-extrabold text-po-text sm:text-2xl">
                {displayName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-po-text-muted">{maskEmail(user.email)}</span>
                <StatusBadge
                  variant={user.isActive ? "success" : "danger"}
                  label={user.isActive ? "Hoạt động" : "Bị khóa"}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-surface-muted text-po-text-muted transition hover:bg-po-border/50 hover:text-po-text"
            aria-label="Đóng chi tiết người dùng"
            title="Đóng"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="max-h-[calc(90vh-106px)] overflow-y-auto p-5 sm:p-6">
          <section>
            <h3 className="text-xs font-bold uppercase text-po-text-subtle">
              Thông tin cá nhân
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <UserDetailField icon={Mail} label="Email" value={maskEmail(user.email)} />
              <UserDetailField icon={Phone} label="Số điện thoại" value={user.phone || "Chưa cập nhật"} />
              <UserDetailField
                icon={CakeSlice}
                label="Ngày sinh"
                value={user.dateOfBirth ? `${formatDate(user.dateOfBirth)} · ${formatAge(user.dateOfBirth)}` : "Chưa cập nhật"}
              />
              <UserDetailField
                icon={MapPin}
                label="Địa chỉ"
                value={user.address || "Chưa cập nhật"}
              />
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-xs font-bold uppercase text-po-text-subtle">
              Tài khoản và phân quyền
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <UserDetailField
                icon={KeyRound}
                label="Quyền hiện tại"
                value={user.roles.length > 0 ? user.roles.join(", ") : "Không có quyền"}
              />
              <UserDetailField
                icon={CalendarDays}
                label="Ngày tạo"
                value={formatDateTime(user.createdAt)}
              />
              <UserDetailField
                icon={Clock3}
                label="Đăng nhập cuối"
                value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Chưa đăng nhập"}
              />
              <UserDetailField
                icon={UsersRound}
                label="Mã người dùng"
                value={user.userId}
              />
            </div>
          </section>

          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            <ProfileStatus
              isComplete={user.emailVerified}
              completeLabel="Email đã xác thực"
              incompleteLabel="Email chưa xác thực"
            />
            <ProfileStatus
              isComplete={user.isProfileCompleted}
              completeLabel="Hồ sơ đã hoàn thành"
              incompleteLabel="Hồ sơ chưa hoàn thành"
            />
          </section>
        </div>
      </section>
    </div>
  )
}

function UserDetailField({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl bg-po-surface-muted/55 p-4 ring-1 ring-po-border/70">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-po-primary ring-1 ring-po-border/70">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase text-po-text-subtle">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-po-text">{value}</p>
      </div>
    </div>
  )
}

function ProfileStatus({
  isComplete,
  completeLabel,
  incompleteLabel,
}: {
  isComplete: boolean
  completeLabel: string
  incompleteLabel: string
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 ${
        isComplete
          ? "bg-po-success-soft/55 text-po-success ring-po-success/15"
          : "bg-po-surface-muted/65 text-po-text-muted ring-po-border/70"
      }`}
    >
      {isComplete ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
      <span className="text-sm font-semibold">
        {isComplete ? completeLabel : incompleteLabel}
      </span>
    </div>
  )
}
