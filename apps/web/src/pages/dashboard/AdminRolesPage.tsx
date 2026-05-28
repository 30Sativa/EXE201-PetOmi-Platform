import { useState } from "react"
import {
  ArrowLeftRight,
  Crown,
  Plus,
  Search,
  ShieldCheck,
  ShieldOff,
  UsersRound,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import StatusBadge from "@/components/ui/StatusBadge"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import EmptyState from "@/components/ui/EmptyState"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import {
  getAdminUsersApi,
  assignAdminRoleApi,
  revokeAdminRoleApi,
} from "@/services/admin.service"
import type { AdminUserListResponse, PagedData } from "@/types"

function getPagedItems<T>(paged?: PagedData<T>) {
  return paged?.items ?? paged?.Items ?? []
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

type RoleTab = "all" | "admin" | "owner" | "vet"

const ROLE_LABELS: Record<string, string> = {
  Admin: "Admin",
  Owner: "Owner",
  Vet: "Bác sĩ",
}

const ROLE_COLORS: Record<string, string> = {
  Admin: "bg-po-primary-soft text-po-primary",
  Owner: "bg-po-success-soft text-po-success",
  Vet: "bg-po-warning-soft text-po-warning",
}

export default function AdminRolesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [roleTab, setRoleTab] = useState<RoleTab>("all")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [assignTarget, setAssignTarget] = useState<AdminUserListResponse | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<AdminUserListResponse | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "roles", search, roleTab, page],
    queryFn: () => getAdminUsersApi({ search, page, pageSize }),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  })

  const assignMutation = useMutation({
    mutationFn: (userId: string) => assignAdminRoleApi(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] })
      setAssignTarget(null)
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (userId: string) => revokeAdminRoleApi(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] })
      setRevokeTarget(null)
    },
  })

  const allItems = getPagedItems(data)

  const filteredItems =
    roleTab === "all"
      ? allItems
      : allItems.filter((u) => u.roles.some((r) => r.toLowerCase() === roleTab))

  const meta = data?.meta ?? data?.Meta
  const totalPages = meta?.totalPages ?? 1

  const roleTabs: { label: string; value: RoleTab }[] = [
    { label: "Tất cả", value: "all" },
    { label: "Admin", value: "admin" },
    { label: "Owner", value: "owner" },
    { label: "Bác sĩ", value: "vet" },
  ]

  const roleStats = {
    admin: allItems.filter((u) => u.roles.includes("Admin")).length,
    owner: allItems.filter((u) => u.roles.includes("Owner")).length,
    vet: allItems.filter((u) => u.roles.includes("Vet")).length,
  }

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-[34px] bg-white/90 text-po-text shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">
            Admin role management
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">
            Quản lý quyền truy cập
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-po-text-muted">
            Gán hoặc thu hồi quyền Admin, theo dõi những người dùng có quyền Owner và Vet trên hệ
            thống. Chỉ Admin/SuperAdmin mới có thể thực hiện thao tác này.
          </p>

          <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
            <HeroMetric
              label="Admin"
              value={String(roleStats.admin)}
              icon={ShieldCheck}
              variant="primary"
            />
            <HeroMetric
              label="Owner"
              value={String(roleStats.owner)}
              icon={Crown}
              variant="success"
            />
            <HeroMetric
              label="Bác sĩ (Vet)"
              value={String(roleStats.vet)}
              icon={UsersRound}
              variant="warning"
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
          {roleTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setRoleTab(tab.value); setPage(1) }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                roleTab === tab.value
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
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-po-border/60">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Người dùng
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Trạng thái
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Quyền hiện tại
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Ngày tạo
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-po-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={ShieldCheck}
                      title="Không có người dùng"
                      description={
                        search
                          ? "Thử lại từ khóa khác"
                          : "Chưa có người dùng nào trong hệ thống"
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredItems.map((user) => (
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
                          <p className="truncate text-xs text-po-text-muted">{user.email}</p>
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
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                ROLE_COLORS[role] ?? "bg-po-surface-muted text-po-text-muted"
                              }`}
                            >
                              {role === "Admin" && <ShieldCheck className="size-2.5" />}
                              {role === "Owner" && <Crown className="size-2.5" />}
                              {role === "Vet" && <UsersRound className="size-2.5" />}
                              {ROLE_LABELS[role] ?? role}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-po-text-muted italic">
                            <ArrowLeftRight className="size-3" />
                            Chưa có quyền
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-po-text-muted whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {!user.roles.includes("Admin") ? (
                          <button
                            onClick={() => setAssignTarget(user)}
                            disabled={assignMutation.isPending}
                            className="inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-semibold bg-po-primary-soft text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white"
                            title="Gán quyền Admin"
                          >
                            <Plus className="size-3.5" />
                            Gán Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => setRevokeTarget(user)}
                            disabled={revokeMutation.isPending}
                            className="inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-semibold bg-po-danger-soft text-po-danger transition hover:-translate-y-0.5 hover:bg-po-danger hover:text-white"
                            title="Thu hồi quyền Admin"
                          >
                            <ShieldOff className="size-3.5" />
                            Thu hồi
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
            <p className="text-xs text-text-muted">
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
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        onConfirm={() => {
          if (!assignTarget) return
          assignMutation.mutate(assignTarget.userId)
        }}
        title="Gán quyền Admin?"
        description={`${assignTarget?.fullName ?? assignTarget?.email} sẽ có quyền Admin và có thể truy cập dashboard quản trị hệ thống.`}
        confirmLabel="Gán Admin"
        variant="primary"
        isLoading={assignMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => {
          if (!revokeTarget) return
          revokeMutation.mutate(revokeTarget.userId)
        }}
        title="Thu hồi quyền Admin?"
        description={`${revokeTarget?.fullName ?? revokeTarget?.email} sẽ mất quyền Admin và không còn có thể truy cập dashboard quản trị.`}
        confirmLabel="Thu hồi"
        variant="danger"
        isLoading={revokeMutation.isPending}
      />
    </div>
  )
}

function HeroMetric({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string
  value: string
  icon: React.ElementType
  variant?: "primary" | "success" | "warning"
}) {
  const colorMap = {
    primary: "text-po-primary",
    success: "text-po-success",
    warning: "text-po-warning",
  }

  return (
    <div className="rounded-2xl bg-po-surface-muted/75 p-4 ring-1 ring-po-border/70">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`size-4 ${variant ? colorMap[variant] : "text-po-text"}`} />
        <p className={`text-2xl font-extrabold tabular-nums ${variant ? colorMap[variant] : "text-po-text"}`}>
          {value}
        </p>
      </div>
      <p className="text-xs leading-5 text-po-text-muted">{label}</p>
    </div>
  )
}

