import { useState } from "react"
import {
  Ban,
  CheckCircle2,
  KeyRound,
  Mail,
  Search,
  ShieldCheck,
  ToggleRight,
  UsersRound,
  XCircle,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

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
  const pageSize = 10

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

  const filterTabs: { label: string; value: FilterTab }[] = [
    { label: "Tất cả", value: "all" },
    { label: "Đang hoạt động", value: "active" },
    { label: "Bị khóa", value: "inactive" },
  ]

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-[34px] bg-white/90 text-po-text shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">
            Admin user management
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">
            Quản lý người dùng
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-po-text-muted">
            Khóa/mở khóa tài khoản, gán quyền Admin cho người dùng. Theo dõi trạng thái
            và hoạt động của từng tài khoản.
          </p>

          <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
            <HeroMetric label="Tổng người dùng" value={String(meta?.totalRecords ?? 0)} />
            <HeroMetric
              label="Đang hoạt động"
              value={String(items.filter((u) => u.isActive).length)}
            />
            <HeroMetric
              label="Bị khóa"
              value={String(items.filter((u) => !u.isActive).length)}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-po-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm email, tên..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full h-11 pl-10 pr-4 rounded-full bg-white text-sm text-po-text ring-1 ring-po-border/80 placeholder:text-po-text-muted/70 focus:outline-none focus:ring-2 focus:ring-po-primary/40 transition"
          />
        </div>

        <div className="flex rounded-full bg-white ring-1 ring-po-border/80 p-1 gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setFilter(tab.value); setPage(1) }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
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

      <div className="overflow-hidden rounded-[28px] bg-white shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-po-border/60">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Người dùng
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Trạng thái
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Quyền
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Ngày tạo
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Đăng nhập cuối
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-po-border/50">
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
                    className="group transition hover:bg-po-surface-muted/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-po-primary-soft text-po-primary text-sm font-bold">
                          {user.fullName ? user.fullName[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-po-text">
                            {user.fullName ?? "Chưa có tên"}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-po-text-muted">
                            <Mail className="size-3 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {user.emailVerified ? (
                              <span className="inline-flex items-center gap-1 text-po-success">
                                <CheckCircle2 className="size-3" />
                                <span className="text-[10px]">Đã xác thực</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-po-warning">
                                <XCircle className="size-3" />
                                <span className="text-[10px]">Chưa xác thực</span>
                              </span>
                            )}
                            {user.isProfileCompleted && (
                              <span className="inline-flex items-center gap-1 text-po-primary">
                                <ShieldCheck className="size-3" />
                                <span className="text-[10px]">Hoàn thành</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        variant={user.isActive ? "success" : "danger"}
                        label={user.isActive ? "Hoạt động" : "Bị khóa"}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                role === "Admin"
                                  ? "bg-po-primary-soft text-po-primary"
                                  : "bg-po-surface-muted text-po-text-muted"
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
                    <td className="px-5 py-4 text-sm text-po-text-muted whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-sm text-po-text-muted whitespace-nowrap">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Chưa đăng nhập"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setToggleTarget(user)}
                          disabled={toggleMutation.isPending}
                          className={`inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-semibold transition hover:-translate-y-0.5 ${
                            user.isActive
                              ? "bg-po-danger-soft text-po-danger hover:bg-po-danger hover:text-white"
                              : "bg-po-success-soft text-po-success hover:bg-po-success hover:text-white"
                          }`}
                          title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
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

                        {!user.roles.includes("Admin") && (
                          <button
                            onClick={() => setAssignTarget(user)}
                            disabled={assignMutation.isPending}
                            className="inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-semibold bg-po-primary-soft text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white"
                            title="Gán quyền Admin"
                          >
                            <KeyRound className="size-3.5" />
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
          <div className="flex items-center justify-between gap-4 border-t border-po-border/60 px-5 py-4">
            <p className="text-xs text-po-text-muted">
              Trang {meta?.pageNumber ?? page} / {totalPages} — {meta?.totalRecords ?? 0} kết quả
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-po-text ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`inline-flex size-9 items-center justify-center rounded-full text-xs font-semibold transition ${
                      page === pageNum
                        ? "bg-po-primary text-white shadow-md"
                        : "bg-white text-po-text-muted ring-1 ring-po-border/80 hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-po-text ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sau
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

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-po-surface-muted/75 p-4 ring-1 ring-po-border/70">
      <p className="text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-po-text-muted">{label}</p>
    </div>
  )
}

