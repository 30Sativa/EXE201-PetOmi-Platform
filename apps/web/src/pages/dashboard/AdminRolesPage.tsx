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

import DashboardSection from "@/components/dashboard/DashboardSection"
import StatusBadge from "@/components/ui/StatusBadge"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import EmptyState from "@/components/ui/EmptyState"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import {
  getAdminRolesApi,
  getAdminUsersApi,
  assignAdminRoleApi,
  revokeAdminRoleApi,
} from "@/services/admin.service"
import type { AdminRoleItemResponse, AdminUserListResponse, PagedData } from "@/types"

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

  const { data: roleCatalog, isLoading: rolesLoading } = useQuery({
    queryKey: ["admin", "role-catalog"],
    queryFn: getAdminRolesApi,
    staleTime: 60 * 1000,
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
    global: roleCatalog?.stats.globalRoleCount ?? allItems.filter((u) => u.roles.includes("Admin")).length,
    clinic: roleCatalog?.stats.clinicRoleCount ?? allItems.filter((u) => u.roles.includes("Vet")).length,
    permissions: roleCatalog?.stats.totalPermissions ?? 0,
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
              label="Vai trò global"
              value={String(roleStats.global)}
              icon={ShieldCheck}
              variant="primary"
            />
            <HeroMetric
              label="Vai trò clinic"
              value={String(roleStats.clinic)}
              icon={Crown}
              variant="success"
            />
            <HeroMetric
              label="Permissions"
              value={String(roleStats.permissions)}
              icon={UsersRound}
              variant="warning"
            />
          </div>
        </div>
      </section>

      <DashboardSection
        title="Role matrix backend"
        subtitle="Danh sách role và permission đang được backend trả về, tách rõ global scope và clinic scope."
      >
        {rolesLoading ? (
          <div className="py-10 text-center">
            <LoadingSpinner />
          </div>
        ) : !roleCatalog ? (
          <EmptyState
            icon={ShieldCheck}
            title="Chưa có dữ liệu role"
            description="Không đọc được role catalog từ backend."
            className="rounded-[24px] bg-po-surface-muted/60"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <RoleCatalogColumn title="Global roles" roles={roleCatalog.globalRoles} />
            <RoleCatalogColumn title="Clinic roles" roles={roleCatalog.clinicRoles} />
          </div>
        )}
      </DashboardSection>

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
          {roleTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setRoleTab(tab.value); setPage(1) }}
              className={`shrink-0 whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-semibold transition ${
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
        <div className="grid gap-3 p-3 md:hidden">
          {isLoading ? (
            <div className="py-14 text-center">
              <LoadingSpinner />
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Không có người dùng"
              description={
                search
                  ? "Thử lại từ khóa khác"
                  : "Chưa có người dùng nào trong hệ thống"
              }
            />
          ) : (
            filteredItems.map((user) => (
              <RoleUserMobileCard
                key={user.userId}
                user={user}
                isAssignPending={assignMutation.isPending}
                isRevokePending={revokeMutation.isPending}
                onAssign={() => setAssignTarget(user)}
                onRevoke={() => setRevokeTarget(user)}
              />
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-po-border/60">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle w-full min-w-[200px]">
                  Người dùng
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle shrink-0 w-[90px]">
                  Trạng thái
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle shrink-0 w-[120px]">
                  Quyền hiện tại
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle shrink-0 w-[90px]">
                  Ngày tạo
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle shrink-0 w-[180px]">
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
                        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary text-sm font-bold">
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
                    <td className="px-5 py-4 shrink-0 w-[90px]">
                      <StatusBadge
                        variant={user.isActive ? "success" : "danger"}
                        label={user.isActive ? "Hoạt động" : "Bị khóa"}
                        className="whitespace-nowrap"
                      />
                    </td>
                    <td className="px-5 py-4 shrink-0 w-[120px]">
                      <div className="flex flex-wrap gap-1.5 max-w-[120px]">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex shrink-0 items-center gap-1 rounded-2xl px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
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
                    <td className="px-5 py-4 text-sm text-po-text-muted whitespace-nowrap shrink-0 w-[90px]">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-4 shrink-0 w-[180px]">
                      <div className="flex flex-wrap gap-1.5 sm:flex-row sm:items-center sm:gap-1.5">
                        {!user.roles.includes("Admin") ? (
                          <button
                            onClick={() => setAssignTarget(user)}
                            disabled={assignMutation.isPending}
                            className="inline-flex shrink-0 items-center gap-1.5 h-8 rounded-2xl px-2.5 text-xs font-semibold bg-po-primary-soft text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white"
                            title="Gán quyền Admin"
                          >
                            <Plus className="size-3.5" />
                            Gán Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => setRevokeTarget(user)}
                            disabled={revokeMutation.isPending}
                            className="inline-flex shrink-0 items-center gap-1.5 h-8 rounded-2xl px-2.5 text-xs font-semibold bg-po-danger-soft text-po-danger transition hover:-translate-y-0.5 hover:bg-po-danger hover:text-white"
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
            <p className="text-xs text-po-text-muted">
              Trang {meta?.pageNumber ?? page} / {totalPages} — {meta?.totalRecords ?? 0} kết quả
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex h-9 items-center gap-1.5 rounded-2xl bg-white px-4 text-xs font-semibold text-po-text ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className={`inline-flex size-9 items-center justify-center rounded-2xl text-xs font-semibold transition ${
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
                className="inline-flex h-9 items-center gap-1.5 rounded-2xl bg-white px-4 text-xs font-semibold text-po-text ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
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

function RoleCatalogColumn({
  title,
  roles,
}: {
  title: string
  roles: AdminRoleItemResponse[]
}) {
  return (
    <div className="grid content-start gap-3 rounded-[24px] bg-po-surface-muted/60 p-3 ring-1 ring-po-border/70">
      <div className="flex items-center justify-between gap-3 px-1">
        <h3 className="text-sm font-extrabold text-po-text">{title}</h3>
        <StatusBadge variant="info" label={`${roles.length} roles`} />
      </div>
      {roles.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Chưa có role"
          description="Backend chưa trả role trong nhóm này."
          className="rounded-[20px] bg-white/70 py-8"
        />
      ) : (
        roles.map((role) => <RoleDefinitionCard key={role.roleId} role={role} />)
      )}
    </div>
  )
}

function RoleDefinitionCard({ role }: { role: AdminRoleItemResponse }) {
  const visiblePermissions = role.permissions.slice(0, 4)
  const hiddenCount = Math.max(0, role.permissions.length - visiblePermissions.length)

  return (
    <article className="rounded-[22px] bg-white/82 p-4 ring-1 ring-po-border/70">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-extrabold text-po-text">{role.roleName}</h4>
          <p className="mt-1 text-xs text-po-text-muted">
            {role.assignedCount} người đang dùng role này
          </p>
        </div>
        <StatusBadge
          variant={role.scope === "global" ? "info" : "warning"}
          label={role.scope === "global" ? "Global" : "Clinic"}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {visiblePermissions.map((permission) => (
          <span
            key={permission.permissionId}
            className="inline-flex max-w-full items-center rounded-2xl bg-po-surface-muted px-2.5 py-1 text-[10px] font-semibold text-po-text-muted"
            title={permission.description ?? permission.permissionName}
          >
            <span className="truncate">{permission.permissionName}</span>
          </span>
        ))}
        {hiddenCount > 0 ? (
          <span className="inline-flex rounded-2xl bg-po-primary-soft px-2.5 py-1 text-[10px] font-semibold text-po-primary">
            +{hiddenCount} quyền
          </span>
        ) : null}
      </div>
    </article>
  )
}

function RoleUserMobileCard({
  user,
  isAssignPending,
  isRevokePending,
  onAssign,
  onRevoke,
}: {
  user: AdminUserListResponse
  isAssignPending: boolean
  isRevokePending: boolean
  onAssign: () => void
  onRevoke: () => void
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
                  className={`inline-flex items-center gap-1 rounded-2xl px-2.5 py-0.5 text-[10px] font-semibold ${
                    ROLE_COLORS[role] ?? "bg-white text-po-text-muted ring-1 ring-po-border/70"
                  }`}
                >
                  {role === "Admin" && <ShieldCheck className="size-2.5" />}
                  {role === "Owner" && <Crown className="size-2.5" />}
                  {role === "Vet" && <UsersRound className="size-2.5" />}
                  {ROLE_LABELS[role] ?? role}
                </span>
              ))
            ) : (
              <span className="text-xs text-po-text-muted">Chưa có quyền</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 rounded-2xl bg-white/70 p-3 text-xs text-po-text-muted ring-1 ring-po-border/60">
        <span>Ngày tạo: {formatDate(user.createdAt)}</span>
        <span>Profile: {user.isProfileCompleted ? "Hoàn thành" : "Chưa hoàn thành"}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!user.roles.includes("Admin") ? (
          <button
            type="button"
            onClick={onAssign}
            disabled={isAssignPending}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-po-primary-soft px-3 text-xs font-semibold text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white disabled:opacity-50"
          >
            <Plus className="size-3.5" />
            Gán Admin
          </button>
        ) : (
          <button
            type="button"
            onClick={onRevoke}
            disabled={isRevokePending}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-po-danger-soft px-3 text-xs font-semibold text-po-danger transition hover:-translate-y-0.5 hover:bg-po-danger hover:text-white disabled:opacity-50"
          >
            <ShieldOff className="size-3.5" />
            Thu hồi
          </button>
        )}
      </div>
    </article>
  )
}
