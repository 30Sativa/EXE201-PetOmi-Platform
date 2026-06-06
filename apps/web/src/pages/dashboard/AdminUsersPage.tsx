import { useState } from "react"
import {
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  KeyRound,
  Mail,
  Search,
  ShieldCheck,
  ToggleRight,
  UsersRound,
  XCircle,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import AdminPageHeader from "@/components/dashboard/AdminPageHeader"
import StatusBadge from "@/components/ui/StatusBadge"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import EmptyState from "@/components/ui/EmptyState"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
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

type FilterTab = "all" | "active" | "inactive"

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterTab>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [toggleTarget, setToggleTarget] = useState<AdminUserListResponse | null>(null)
  const [assignTarget, setAssignTarget] = useState<AdminUserListResponse | null>(null)

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
              />
            ))
          )}
        </div>

        <div className="admin-table-scroll hidden md:block">
          <table className="admin-table min-w-[1040px]">
            <thead>
              <tr className="border-b border-[#F1E3D2] bg-gradient-to-b from-[#FFFCF8] to-[#FFF9F2]">
                <th className="w-[320px] border-r border-[#F4E7D8] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
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
                <th className="w-[120px] border-r border-[#F4E7D8] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  <div className="flex items-center justify-center gap-2">
                    <span className="grid size-7 place-items-center rounded-full bg-[#F5F7FA] text-po-text-subtle ring-1 ring-[#EAEFF5]">
                      <CalendarDays className="size-4" />
                    </span>
                    <span>Ngày tạo</span>
                  </div>
                </th>
                <th className="w-[140px] border-r border-[#F4E7D8] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  <div className="flex items-center justify-center gap-2">
                    <span className="grid size-7 place-items-center rounded-full bg-[#F5F7FA] text-po-text-subtle ring-1 ring-[#EAEFF5]">
                      <Clock3 className="size-4" />
                    </span>
                    <span>Đăng nhập cuối</span>
                  </div>
                </th>
                <th className="w-[220px] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  <div className="flex items-center justify-center gap-2">
                    <span>Hành động</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4E8D9]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
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
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#FFE4BF] text-[#B96A00] text-sm font-extrabold ring-1 ring-[#FFD8A0]">
                          {user.fullName ? user.fullName[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-po-text">
                            {user.fullName ?? "Chưa có tên"}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-po-text-muted">
                            <Mail className="size-3 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            {user.emailVerified ? (
                              <span className="inline-flex items-center gap-1 text-[#FF8A1E]">
                                <CheckCircle2 className="size-3" />
                                <span className="text-[10px] font-medium">Đã xác thực</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#FF8A1E]">
                                <XCircle className="size-3" />
                                <span className="text-[10px] font-medium">Chưa xác thực</span>
                              </span>
                            )}
                            {user.isProfileCompleted && (
                              <span className="inline-flex items-center gap-1 text-[#F59E0B]">
                                <ShieldCheck className="size-3" />
                                <span className="text-[10px] font-medium">Hoàn thành</span>
                              </span>
                            )}
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
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-po-text-muted whitespace-nowrap">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Chưa đăng nhập"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setToggleTarget(user)}
                          disabled={toggleMutation.isPending}
                          className={`inline-flex h-8 min-w-[82px] shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 text-[11px] font-semibold transition hover:-translate-y-0.5 ${
                            user.isActive
                              ? "border-[#FFB8B8] bg-[#FFF1F1] text-[#FF4D4F] hover:bg-[#FF4D4F] hover:text-white"
                              : "border-[#BFE7C6] bg-[#F0FFF3] text-[#10A04A] hover:bg-[#10A04A] hover:text-white"
                          }`}
                          title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                        >
                          {user.isActive ? (
                            <>
                              <Ban className="size-3" />
                              Khóa
                            </>
                          ) : (
                            <>
                              <ToggleRight className="size-3" />
                              Mở khóa
                            </>
                          )}
                        </button>

                        {!user.roles.includes("Admin") && (
                          <button
                            onClick={() => setAssignTarget(user)}
                            disabled={assignMutation.isPending}
                            className="inline-flex h-8 min-w-[96px] shrink-0 items-center justify-center gap-1 rounded-full border border-[#FFD39A] bg-[#FFF6EA] px-2.5 text-[11px] font-semibold text-[#F59E0B] transition hover:-translate-y-0.5 hover:bg-[#F59E0B] hover:text-white"
                            title="Gán quyền Admin"
                          >
                            <KeyRound className="size-3" />
                            Gán Admin
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
    </div>
  )
}

function UserMobileCard({
  user,
  isTogglePending,
  isAssignPending,
  onToggle,
  onAssign,
}: {
  user: AdminUserListResponse
  isTogglePending: boolean
  isAssignPending: boolean
  onToggle: () => void
  onAssign: () => void
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
              <p className="mt-1 truncate text-xs text-po-text-muted">{user.email}</p>
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

      <div className="mt-4 grid gap-2 rounded-2xl bg-white/70 p-3 text-xs text-po-text-muted ring-1 ring-po-border/60">
        <span>Email: {user.emailVerified ? "Đã xác thực" : "Chưa xác thực"}</span>
        <span>Profile: {user.isProfileCompleted ? "Hoàn thành" : "Chưa hoàn thành"}</span>
        <span>Ngày tạo: {formatDate(user.createdAt)}</span>
        <span>Đăng nhập cuối: {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Chưa đăng nhập"}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-po-primary-soft px-3 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white disabled:opacity-50"
          >
            <KeyRound className="size-3.5" />
            Gán Admin
          </button>
        ) : null}
      </div>
    </article>
  )
}
