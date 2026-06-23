import { useState } from "react"
import {
  ArrowLeftRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Crown,
  Plus,
  Search,
  ShieldCheck,
  ShieldOff,
  Clock3,
  UsersRound,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import AdminPageHeader from "@/components/dashboard/AdminPageHeader"
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
import type {
  AdminPermissionItemResponse,
  AdminRoleItemResponse,
  AdminUserListResponse,
  PagedData,
} from "@/types"

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
  const [pageSize, setPageSize] = useState(10)

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
  const totalRecords = meta?.totalRecords ?? filteredItems.length
  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1
  const endRecord = Math.min(page * pageSize, totalRecords)

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
      <AdminPageHeader
        kicker="Admin role management"
        title="Quản lý quyền truy cập"
        description="Gán, thu hồi quyền và theo dõi role catalog đang được backend trả về."
        icon={ShieldCheck}
        metrics={[
          { label: "Vai trò global", value: String(roleStats.global), icon: ShieldCheck },
          { label: "Vai trò clinic", value: String(roleStats.clinic), icon: Crown, tone: "success" },
          { label: "Permissions", value: String(roleStats.permissions), icon: UsersRound, tone: "warning" },
        ]}
      />

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
          <div className="grid gap-6">
            <RoleMatrix
              title="Global roles"
              scope="global"
              roles={roleCatalog.globalRoles}
            />
            <RoleMatrix
              title="Clinic roles"
              scope="clinic"
              roles={roleCatalog.clinicRoles}
            />
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

      <div className="admin-table-shell">
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

        <div className="admin-table-scroll hidden md:block">
          <table className="admin-table min-w-[1040px]">
            <thead>
              <tr className="border-b border-[#F1E3D2] bg-gradient-to-b from-[#FFFCF8] to-[#FFF9F2]">
                <th className="w-[340px] border-r border-[#F4E7D8] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-[#F5F7FA] text-po-text-subtle ring-1 ring-[#EAEFF5]">
                      <UsersRound className="size-4" />
                    </span>
                    <span>Người dùng</span>
                  </div>
                </th>
                <th className="w-[120px] border-r border-[#F4E7D8] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle text-center">
                  Trạng thái
                </th>
                <th className="w-[150px] border-r border-[#F4E7D8] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle text-center">
                  Quyền hiện tại
                </th>
                <th className="w-[140px] border-r border-[#F4E7D8] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="grid size-7 place-items-center rounded-full bg-[#F5F7FA] text-po-text-subtle ring-1 ring-[#EAEFF5]">
                      <CalendarDays className="size-4" />
                    </span>
                    <span>Ngày tạo</span>
                  </div>
                </th>
                <th className="w-[180px] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="grid size-7 place-items-center rounded-full bg-[#F5F7FA] text-po-text-subtle ring-1 ring-[#EAEFF5]">
                      <Clock3 className="size-4" />
                    </span>
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
                          <p className="truncate text-xs text-po-text-muted">{user.email}</p>
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
                      <div className="flex max-w-[150px] flex-wrap justify-center gap-1.5">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap ${
                                ROLE_COLORS[role] ?? "bg-[#F6EFE6] text-po-text-muted"
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
                    <td className="px-4 py-4 text-center text-sm text-po-text-muted whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {!user.roles.includes("Admin") ? (
                          <button
                            onClick={() => setAssignTarget(user)}
                            disabled={assignMutation.isPending}
                            className="inline-flex h-8 min-w-[98px] shrink-0 items-center justify-center gap-1 rounded-full border border-[#FFD39A] bg-[#FFF6EA] px-2.5 text-[11px] font-semibold text-[#F59E0B] transition hover:-translate-y-0.5 hover:bg-[#F59E0B] hover:text-white"
                            title="Gán quyền Admin"
                          >
                            <Plus className="size-3" />
                            Gán Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => setRevokeTarget(user)}
                            disabled={revokeMutation.isPending}
                            className="inline-flex h-8 min-w-[98px] shrink-0 items-center justify-center gap-1 rounded-full border border-[#FFB8B8] bg-[#FFF1F1] px-2.5 text-[11px] font-semibold text-[#FF4D4F] transition hover:-translate-y-0.5 hover:bg-[#FF4D4F] hover:text-white"
                            title="Thu hồi quyền Admin"
                          >
                            <ShieldOff className="size-3" />
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

function RoleMatrix({
  title,
  scope,
  roles,
}: {
  title: string
  scope: "global" | "clinic"
  roles: AdminRoleItemResponse[]
}) {
  // Gom tất cả permission xuất hiện trong nhóm role này thành danh sách hàng (sorted, unique)
  const permissionRows = (() => {
    const map = new Map<string, AdminPermissionItemResponse>()
    roles.forEach((role) =>
      role.permissions.forEach((p) => {
        if (!map.has(p.permissionName)) map.set(p.permissionName, p)
      }),
    )
    return Array.from(map.values()).sort((a, b) =>
      a.permissionName.localeCompare(b.permissionName),
    )
  })()

  // Tra cứu nhanh: role nào có permission nào
  const roleHasPermission = (role: AdminRoleItemResponse, permissionName: string) =>
    role.permissions.some((p) => p.permissionName === permissionName)

  const scopeTone = scope === "global" ? "info" : "warning"
  const scopeLabel = scope === "global" ? "Global" : "Clinic"

  return (
    <div className="grid content-start gap-3 rounded-[24px] bg-po-surface-muted/60 p-3 ring-1 ring-po-border/70 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-extrabold text-po-text">{title}</h3>
          <StatusBadge variant={scopeTone} label={scopeLabel} />
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge variant="info" label={`${roles.length} roles`} />
          <StatusBadge variant="success" label={`${permissionRows.length} quyền`} />
        </div>
      </div>

      {roles.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Chưa có role"
          description="Backend chưa trả role trong nhóm này."
          className="rounded-[20px] bg-white/70 py-8"
        />
      ) : (
        <div className="overflow-x-auto rounded-[20px] bg-white ring-1 ring-po-border/70">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-po-border/70 bg-gradient-to-b from-[#FFFCF8] to-[#FFF9F2]">
                <th className="sticky left-0 z-10 min-w-[200px] border-r border-po-border/60 bg-[#FFFCF8] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-po-text-subtle">
                  Permission
                </th>
                {roles.map((role) => (
                  <th
                    key={role.roleId}
                    className="min-w-[120px] border-r border-po-border/40 px-3 py-3 text-center align-bottom last:border-r-0"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-extrabold text-po-text">
                        {role.roleName}
                      </span>
                      <span className="text-[10px] font-medium text-po-text-muted">
                        {role.assignedCount} người
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionRows.map((permission, idx) => (
                <tr
                  key={permission.permissionId}
                  className={`border-b border-po-border/40 last:border-b-0 ${
                    idx % 2 === 1 ? "bg-po-surface-muted/30" : "bg-white"
                  }`}
                >
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 border-r border-po-border/60 px-4 py-2.5 text-left text-xs font-semibold text-po-text ${
                      idx % 2 === 1 ? "bg-[#FBF6EF]" : "bg-white"
                    }`}
                    title={permission.description ?? permission.permissionName}
                  >
                    {permission.permissionName}
                  </th>
                  {roles.map((role) => {
                    const granted = roleHasPermission(role, permission.permissionName)
                    return (
                      <td
                        key={role.roleId}
                        className="border-r border-po-border/30 px-3 py-2.5 text-center last:border-r-0"
                      >
                        {granted ? (
                          <span className="inline-grid size-6 place-items-center rounded-full bg-po-success-soft text-po-success">
                            <Check className="size-3.5" strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="inline-block size-1.5 rounded-full bg-po-border" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
