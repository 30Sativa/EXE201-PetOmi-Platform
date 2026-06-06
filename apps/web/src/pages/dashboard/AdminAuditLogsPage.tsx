import { useState } from "react"
import {
  Activity,
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Globe,
  KeyRound,
  LayoutDashboard,
  ShieldAlert,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { LoadingSpinner } from "@/components/ui/LoadingStates"
import EmptyState from "@/components/ui/EmptyState"
import { getAuditLogsApi } from "@/services/admin.service"
import type { AuditLogItemResponse, PagedData } from "@/types"

function getPagedItems<T>(paged?: PagedData<T>) {
  return paged?.Items ?? (paged as unknown as { items?: T[] })?.items ?? []
}

function getPagedMeta(paged?: PagedData<unknown>) {
  return (paged as unknown as { meta?: object })?.meta ?? paged?.Meta
}

function formatDate(dateStr: string) {
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

function formatRelative(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Vừa xong"
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return formatDate(dateStr)
  } catch {
    return dateStr
  }
}

const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ApproveClinic: { label: "Duyệt phòng khám", icon: CheckCircle2, color: "text-po-success" },
  RejectClinic: { label: "Từ chối phòng khám", icon: X, color: "text-po-danger" },
  ActivateUser: { label: "Mở khóa tài khoản", icon: UserCheck, color: "text-po-success" },
  DeactivateUser: { label: "Khóa tài khoản", icon: AlertCircle, color: "text-po-warning" },
  AssignAdminRole: { label: "Gán Admin", icon: KeyRound, color: "text-po-primary" },
  RevokeAdminRole: { label: "Thu hồi Admin", icon: KeyRound, color: "text-po-danger" },
  CreateClinic: { label: "Tạo phòng khám", icon: ShieldAlert, color: "text-po-success" },
  UpdateClinic: { label: "Cập nhật phòng khám", icon: ShieldAlert, color: "text-po-primary" },
  BookAppointment: { label: "Đặt lịch", icon: Clock, color: "text-po-primary" },
  CancelAppointment: { label: "Hủy lịch", icon: X, color: "text-po-danger" },
  ApproveAppointment: { label: "Duyệt lịch", icon: CheckCircle2, color: "text-po-success" },
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  Clinic: { label: "Phòng khám", icon: ShieldAlert, color: "text-po-primary" },
  Role: { label: "Role", icon: KeyRound, color: "text-po-warning" },
  User: { label: "User", icon: UsersRound, color: "text-po-success" },
  Appointment: { label: "Appointment", icon: Clock, color: "text-po-primary" },
  System: { label: "System", icon: Globe, color: "text-po-text-muted" },
}

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  Info: { label: "Thông tin", color: "text-po-text-muted" },
  Warning: { label: "Cảnh báo", color: "text-po-warning" },
  Danger: { label: "Nguy hiểm", color: "text-po-danger" },
  Success: { label: "Thành công", color: "text-po-success" },
}

type CategoryFilter = "all" | "Clinic" | "Role" | "User" | "Appointment" | "System"

export default function AdminAuditLogsPage() {
  const [category, setCategory] = useState<CategoryFilter>("all")
  const [action, setAction] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-logs", category, action, page],
    queryFn: () =>
      getAuditLogsApi({
        category: category === "all" ? undefined : category,
        action: action || undefined,
        page,
        pageSize,
      }),
    placeholderData: (prev) => prev,
    staleTime: 15 * 1000,
  })

  const items = getPagedItems<AuditLogItemResponse>(data as PagedData<AuditLogItemResponse>)
  const meta = getPagedMeta(data)
  const totalPages = (meta as { totalPages?: number })?.totalPages ?? 1

  const categoryTabs: { value: CategoryFilter; label: string; icon: React.ElementType }[] = [
    { value: "all", label: "Tất cả", icon: LayoutDashboard },
    { value: "Clinic", label: "Clinic", icon: ShieldAlert },
    { value: "Role", label: "Role", icon: KeyRound },
    { value: "User", label: "User", icon: UsersRound },
    { value: "Appointment", label: "Lịch", icon: Clock },
    { value: "System", label: "System", icon: Globe },
  ]

  const uniqueActions = Object.keys(ACTION_META)

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-[34px] bg-white/90 text-po-text shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">
            Admin audit trail
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">
            Nhật ký hành động
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-po-text-muted">
            Theo dõi tất cả hành động của admin trên hệ thống. Mỗi thao tác được ghi lại với
            thời gian, người thực hiện và địa chỉ IP.
          </p>

          <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
            <HeroMetric
              label="Tổng hành động"
              value={String((meta as { totalRecords?: number })?.totalRecords ?? 0)}
              icon={Activity}
            />
            <HeroMetric
              label="Hôm nay"
              value={String(items.filter((l) => {
                try {
                  const d = new Date(l.CreatedAt)
                  const today = new Date()
                  return d.toDateString() === today.toDateString()
                } catch { return false }
              }).length)}
              icon={Clock}
            />
            <HeroMetric
              label="Tuần này"
              value={String(items.filter((l) => {
                try {
                  const d = new Date(l.CreatedAt)
                  const now = new Date()
                  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
                  return diffDays < 7
                } catch { return false }
              }).length)}
              icon={ArrowUpDown}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-2xl bg-white ring-1 ring-po-border/80 p-1 gap-1 overflow-x-auto">
          {categoryTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setCategory(tab.value); setPage(1) }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition whitespace-nowrap ${
                category === tab.value
                  ? "bg-po-primary text-white"
                  : "text-po-text-muted hover:bg-po-surface-muted hover:text-po-text"
              }`}
            >
              <tab.icon className="size-3 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 h-10 rounded-2xl px-4 text-xs font-semibold transition ${
            showFilters || action
              ? "bg-po-primary text-white"
              : "bg-white text-po-text-muted ring-1 ring-po-border/80 hover:bg-po-surface-muted"
          }`}
        >
          <Filter className="size-3.5" />
          Lọc
          {showFilters && <ChevronDown className="size-3" />}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-po-border/60">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-po-text-muted">Hành động:</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1) }}
              className="h-9 rounded-2xl bg-po-surface-muted/50 px-4 text-xs text-po-text ring-1 ring-po-border/60 focus:outline-none focus:ring-2 focus:ring-po-primary/40"
            >
              <option value="">Tất cả hành động</option>
              {uniqueActions.map((a) => (
                <option key={a} value={a}>{ACTION_META[a]?.label ?? a}</option>
              ))}
            </select>
          </div>

          {action && (
            <button
              onClick={() => { setAction(""); setPage(1) }}
              className="inline-flex items-center gap-1 h-9 px-3 rounded-2xl text-xs font-semibold bg-po-surface-muted text-po-text-muted hover:text-po-text transition"
            >
              <X className="size-3" />
              Xóa lọc
            </button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-[28px] bg-white shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="grid gap-3 p-3 md:hidden">
          {isLoading ? (
            <div className="py-14 text-center">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="Không có bản ghi nào"
              description="Chưa có hành động nào được ghi lại trong hệ thống."
            />
          ) : (
            items.map((log) => <AuditMobileCard key={log.AuditLogId} log={log} />)
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-po-border/60">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Thời gian
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Hành động
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Danh mục
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Người thực hiện
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Mức độ
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-po-text-subtle">
                  Địa chỉ IP
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
                      icon={Activity}
                      title="Không có bản ghi nào"
                      description="Chưa có hành động nào được ghi lại trong hệ thống."
                    />
                  </td>
                </tr>
              ) : (
                items.map((log) => {
                  const actionMeta = ACTION_META[log.Action] ?? {
                    label: log.Action,
                    icon: Activity,
                    color: "text-po-text-muted",
                  }
                  const categoryMeta = CATEGORY_META[log.Category] ?? {
                    label: log.Category,
                    icon: Globe,
                    color: "text-po-text-muted",
                  }
                  const severityMeta = SEVERITY_META[log.Severity] ?? {
                    label: log.Severity,
                    color: "text-po-text-muted",
                  }
                  const ActionIcon = actionMeta.icon
                  const CategoryIcon = categoryMeta.icon

                  return (
                    <tr
                      key={log.AuditLogId}
                      className="group transition hover:bg-po-surface-muted/40"
                    >
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <p className="text-sm text-po-text whitespace-nowrap">
                            {formatDate(log.CreatedAt)}
                          </p>
                          <p className="text-[10px] text-po-text-muted">
                            {formatRelative(log.CreatedAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <ActionIcon className={`size-4 shrink-0 ${actionMeta.color}`} />
                          <span className={`text-sm font-semibold ${actionMeta.color}`}>
                            {actionMeta.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <CategoryIcon className={`size-3.5 shrink-0 ${categoryMeta.color}`} />
                          <span className={`text-xs font-semibold ${categoryMeta.color}`}>
                            {categoryMeta.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {log.UserEmail ? (
                          <div className="flex items-center gap-2">
                            <div className="grid size-8 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary text-xs font-bold">
                              {log.UserEmail[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-po-text">
                                {log.UserEmail}
                              </p>
                              {log.UserId && (
                                <p className="text-[10px] text-po-text-muted font-mono">
                                  {log.UserId.slice(0, 8)}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-po-text-muted italic">Hệ thống</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold ${severityMeta.color}`}>
                          {severityMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-po-text-muted font-mono">
                          {log.IpAddress ?? "—"}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 border-t border-po-border/60 px-5 py-4">
            <p className="text-xs text-po-text-muted">
              Trang {page} / {totalPages} — {(meta as { totalRecords?: number })?.totalRecords ?? 0} kết quả
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
                if (totalPages <= 5) pageNum = i + 1
                else if (page <= 3) pageNum = i + 1
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                else pageNum = page - 2 + i
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
    </div>
  )
}

function HeroMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ElementType
}) {
  return (
    <div className="rounded-2xl bg-po-surface-muted/75 p-4 ring-1 ring-po-border/70">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="size-4 text-po-primary" />
        <p className="text-2xl font-extrabold tabular-nums text-po-text">{value}</p>
      </div>
      <p className="text-xs leading-5 text-po-text-muted">{label}</p>
    </div>
  )
}

function AuditMobileCard({ log }: { log: AuditLogItemResponse }) {
  const actionMeta = ACTION_META[log.Action] ?? {
    label: log.Action,
    icon: Activity,
    color: "text-po-text-muted",
  }
  const categoryMeta = CATEGORY_META[log.Category] ?? {
    label: log.Category,
    icon: Globe,
    color: "text-po-text-muted",
  }
  const severityMeta = SEVERITY_META[log.Severity] ?? {
    label: log.Severity,
    color: "text-po-text-muted",
  }
  const ActionIcon = actionMeta.icon
  const CategoryIcon = categoryMeta.icon

  return (
    <article className="rounded-[24px] bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white ring-1 ring-po-border/80">
          <ActionIcon className={`size-4 ${actionMeta.color}`} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={`text-sm font-extrabold ${actionMeta.color}`}>
                {actionMeta.label}
              </h3>
              <p className="mt-1 text-xs text-po-text-muted">
                {formatDate(log.CreatedAt)} · {formatRelative(log.CreatedAt)}
              </p>
            </div>
            <span className={`text-xs font-bold ${severityMeta.color}`}>
              {severityMeta.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 rounded-2xl bg-white/70 p-3 text-xs text-po-text-muted ring-1 ring-po-border/60">
        <div className="flex items-center gap-1.5">
          <CategoryIcon className={`size-3.5 shrink-0 ${categoryMeta.color}`} />
          <span className={`font-semibold ${categoryMeta.color}`}>{categoryMeta.label}</span>
        </div>
        <span>Người thực hiện: {log.UserEmail ?? "Hệ thống"}</span>
        {log.UserId ? <span className="font-mono">UserId: {log.UserId.slice(0, 8)}</span> : null}
        <span className="font-mono">IP: {log.IpAddress ?? "-"}</span>
      </div>
    </article>
  )
}
