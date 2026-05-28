import { useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  ShieldAlert,
  UserCheck,
  XCircle,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { LoadingSpinner } from "@/components/ui/LoadingStates"
import EmptyState from "@/components/ui/EmptyState"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import RejectDialog from "@/components/ui/RejectDialog"
import {
  getAdminClinicsApi,
  getAdminUsersApi,
  approveClinicApi,
  rejectClinicApi,
  toggleUserStatusApi,
} from "@/services/admin.service"
import type { ClinicListItemResponse, AdminUserListResponse } from "@/types"

type AlertSeverity = "high" | "medium" | "low"

interface AlertItem {
  id: string
  type: "pending_clinic" | "inactive_user" | "unverified_user" | "system"
  severity: AlertSeverity
  title: string
  description: string
  timestamp: string
  data: ClinicListItemResponse | AdminUserListResponse
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
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

function getSeverityIcon(severity: AlertSeverity) {
  switch (severity) {
    case "high":
      return <AlertCircle className="size-4 text-po-danger" />
    case "medium":
      return <AlertTriangle className="size-4 text-po-warning" />
    case "low":
      return <Bell className="size-4 text-po-text-muted" />
  }
}

const severityOrder: Record<AlertSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export default function AdminAlertsPage() {
  const queryClient = useQueryClient()

  const [filterSeverity, setFilterSeverity] = useState<"all" | AlertSeverity>("all")
  const [filterType, setFilterType] = useState<"all" | AlertItem["type"]>("all")

  const [approveTarget, setApproveTarget] = useState<ClinicListItemResponse | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ClinicListItemResponse | null>(null)
  const [activateTarget, setActivateTarget] = useState<AdminUserListResponse | null>(null)

  const { data: clinicsData, isLoading: clinicsLoading } = useQuery({
    queryKey: ["admin", "clinics", "Pending", 1],
    queryFn: () => getAdminClinicsApi({ status: "Pending", page: 1, pageSize: 50 }),
    staleTime: 30 * 1000,
  })

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "alerts", "inactive"],
    queryFn: () => getAdminUsersApi({ isActive: false, page: 1, pageSize: 50 }),
    staleTime: 30 * 1000,
  })

  const { data: unverifiedData, isLoading: unverifiedLoading } = useQuery({
    queryKey: ["admin", "alerts", "unverified"],
    queryFn: () => getAdminUsersApi({ page: 1, pageSize: 50 }),
    staleTime: 30 * 1000,
  })

  const approveMutation = useMutation({
    mutationFn: (clinicId: string) => approveClinicApi(clinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clinics"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] })
      setApproveTarget(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ clinicId, reason }: { clinicId: string; reason: string }) =>
      rejectClinicApi(clinicId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clinics"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] })
      setRejectTarget(null)
    },
  })

  const activateMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      toggleUserStatusApi(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      setActivateTarget(null)
    },
  })

  const pendingClinics = (clinicsData?.items ?? clinicsData?.Items ?? []) as ClinicListItemResponse[]
  const inactiveUsers = (usersData?.items ?? usersData?.Items ?? []) as AdminUserListResponse[]
  const allUsers = (unverifiedData?.items ?? unverifiedData?.Items ?? []) as AdminUserListResponse[]
  const unverifiedUsers = allUsers.filter((u) => !u.emailVerified)

  const allAlerts: AlertItem[] = [
    ...pendingClinics.map((c) => ({
      id: `clinic-${c.clinicId}`,
      type: "pending_clinic" as const,
      severity: "high" as AlertSeverity,
      title: `Phòng khám chờ duyệt: ${c.clinicName}`,
      description: c.address ?? "Không có địa chỉ",
      timestamp: c.createdAt,
      data: c,
    })),
    ...inactiveUsers.map((u) => ({
      id: `inactive-${u.userId}`,
      type: "inactive_user" as const,
      severity: "medium" as AlertSeverity,
      title: `Tài khoản bị khóa: ${u.fullName ?? u.email}`,
      description: u.email,
      timestamp: u.createdAt,
      data: u,
    })),
    ...unverifiedUsers.slice(0, 10).map((u) => ({
      id: `unverified-${u.userId}`,
      type: "unverified_user" as const,
      severity: "low" as AlertSeverity,
      title: `Tài khoản chưa xác thực: ${u.fullName ?? u.email}`,
      description: u.email,
      timestamp: u.createdAt,
      data: u,
    })),
  ]

  const filteredAlerts = allAlerts
    .filter((a) => filterSeverity === "all" || a.severity === filterSeverity)
    .filter((a) => filterType === "all" || a.type === filterType)
    .sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

  const isLoading = clinicsLoading || usersLoading || unverifiedLoading

  const stats = {
    total: allAlerts.length,
    high: allAlerts.filter((a) => a.severity === "high").length,
    medium: allAlerts.filter((a) => a.severity === "medium").length,
    low: allAlerts.filter((a) => a.severity === "low").length,
  }

  const severityTabs: { label: string; value: "all" | AlertSeverity; count?: number }[] = [
    { label: "Tất cả", value: "all", count: stats.total },
    { label: "Nguy hiểm", value: "high", count: stats.high },
    { label: "Cần chú ý", value: "medium", count: stats.medium },
    { label: "Thấp", value: "low", count: stats.low },
  ]

  const typeTabs: { label: string; value: "all" | AlertItem["type"] }[] = [
    { label: "Tất cả loại", value: "all" },
    { label: "Clinic", value: "pending_clinic" },
    { label: "Tài khoản", value: "inactive_user" },
    { label: "Chưa xác thực", value: "unverified_user" },
  ]

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-[34px] bg-white/90 text-po-text shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">
            Admin alerts center
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">
            Trung tâm cảnh báo
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-po-text-muted">
            Theo dõi các thông báo, yêu cầu chờ duyệt và hành động cần xử lý nhanh. Ưu tiên các
            cảnh báo nguy hiểm trước.
          </p>

          <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HeroMetric
              label="Tổng cảnh báo"
              value={String(stats.total)}
              variant="primary"
              icon={ShieldAlert}
            />
            <HeroMetric
              label="Nguy hiểm"
              value={String(stats.high)}
              variant="danger"
              icon={AlertCircle}
            />
            <HeroMetric
              label="Cần chú ý"
              value={String(stats.medium)}
              variant="warning"
              icon={AlertTriangle}
            />
            <HeroMetric
              label="Thấp"
              value={String(stats.low)}
              variant="muted"
              icon={Bell}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-full bg-white ring-1 ring-po-border/80 p-1 gap-1">
          {severityTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterSeverity(tab.value)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition ${
                filterSeverity === tab.value
                  ? "bg-po-primary text-white"
                  : "text-po-text-muted hover:bg-po-surface-muted hover:text-po-text"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    filterSeverity === tab.value
                      ? "bg-white/20 text-white"
                      : tab.value === "high"
                        ? "bg-po-danger/20 text-po-danger"
                        : tab.value === "medium"
                          ? "bg-po-warning/20 text-po-warning"
                          : "bg-po-surface-muted text-po-text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex rounded-full bg-white ring-1 ring-po-border/80 p-1 gap-1">
          {typeTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterType(tab.value)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                filterType === tab.value
                  ? "bg-po-primary text-white"
                  : "text-po-text-muted hover:bg-po-surface-muted hover:text-po-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="rounded-[28px] bg-white py-20 text-center shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
            <LoadingSpinner />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="rounded-[28px] bg-white shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
            <EmptyState
              icon={BellOff}
              title="Không có cảnh báo nào"
              description="Hệ thống hiện tại không có thông báo hay hành động nào cần xử lý."
            />
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onApproveClinic={(clinic) => setApproveTarget(clinic)}
              onRejectClinic={(clinic) => setRejectTarget(clinic)}
              onActivateUser={(user) => setActivateTarget(user)}
            />
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={() => {
          if (!approveTarget) return
          approveMutation.mutate(approveTarget.clinicId)
        }}
        title="Duyệt phòng khámở"
        description={`Bạn chắc chắn muốn duyệt phòng khám "${approveTarget?.clinicName}"?`}
        confirmLabel="Duyệt"
        variant="primary"
        isLoading={approveMutation.isPending}
      />

      <RejectDialog
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (!rejectTarget) return
          rejectMutation.mutate({ clinicId: rejectTarget.clinicId, reason })
        }}
        title="Từ chối phòng khámở"
        description={`Bạn muốn từ chối phòng khám "${rejectTarget?.clinicName}".`}
        confirmLabel="Từ chối"
        isLoading={rejectMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!activateTarget}
        onClose={() => setActivateTarget(null)}
        onConfirm={() => {
          if (!activateTarget) return
          activateMutation.mutate({ userId: activateTarget.userId, isActive: true })
        }}
        title="Mở khóa tài khoản?"
        description={`Mở khóa tài khoản "${activateTarget?.fullName ?? activateTarget?.email}" để họ có thể đăng nhập trở lại.`}
        confirmLabel="Mở khóa"
        variant="primary"
        isLoading={activateMutation.isPending}
      />
    </div>
  )
}

function AlertCard({
  alert,
  onApproveClinic,
  onRejectClinic,
  onActivateUser,
}: {
  alert: AlertItem
  onApproveClinic: (clinic: ClinicListItemResponse) => void
  onRejectClinic: (clinic: ClinicListItemResponse) => void
  onActivateUser: (user: AdminUserListResponse) => void
}) {
  const clinic = alert.data as ClinicListItemResponse
  const user = alert.data as AdminUserListResponse

  return (
    <div
      className={`overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 transition hover:shadow-md ${
        alert.severity === "high"
          ? "shadow-orange-200/20 ring-po-danger/20"
          : alert.severity === "medium"
            ? "shadow-orange-200/10 ring-po-warning/20"
            : "shadow-orange-200/5 ring-po-border/60"
      }`}
    >
      <div className="flex items-start gap-4 p-5">
        <div
          className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-full ${
            alert.severity === "high"
              ? "bg-po-danger-soft text-po-danger"
              : alert.severity === "medium"
                ? "bg-po-warning-soft text-po-warning"
                : "bg-po-surface-muted text-po-text-muted"
          }`}
        >
          {getSeverityIcon(alert.severity)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-po-text">{alert.title}</h3>
              <p className="mt-1 text-xs text-po-text-muted">{alert.description}</p>
            </div>
            <div className="shrink-0 text-right">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                  alert.severity === "high"
                    ? "bg-po-danger-soft text-po-danger"
                    : alert.severity === "medium"
                      ? "bg-po-warning-soft text-po-warning"
                      : "bg-po-surface-muted text-po-text-muted"
                }`}
              >
                {alert.severity === "high"
                  ? "Nguy hiểm"
                  : alert.severity === "medium"
                    ? "Cần chú ý"
                    : "Thấp"}
              </span>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-po-text-muted">
                <Clock className="size-3" />
                {formatRelative(alert.timestamp)}
              </p>
            </div>
          </div>

          {alert.type === "pending_clinic" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {clinic.licenseNumber ? (
                <span className="inline-flex items-center gap-1 text-po-success text-xs">
                  <BadgeCheck className="size-3" />
                  GPLX: {clinic.licenseNumber}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-po-warning text-xs">
                  <AlertCircle className="size-3" />
                  Chưa có GPLX
                </span>
              )}
              <div className="ml-auto flex flex-wrap gap-2">
                <button
                  onClick={() => onApproveClinic(clinic)}
                  className="inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-semibold bg-po-success-soft text-po-success transition hover:-translate-y-0.5 hover:bg-po-success hover:text-white"
                >
                  <CheckCircle2 className="size-3.5" />
                  Duyệt
                </button>
                <button
                  onClick={() => onRejectClinic(clinic)}
                  className="inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-semibold bg-po-danger-soft text-po-danger transition hover:-translate-y-0.5 hover:bg-po-danger hover:text-white"
                >
                  <XCircle className="size-3.5" />
                  Từ chối
                </button>
              </div>
            </div>
          )}

          {alert.type === "inactive_user" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-po-text-muted">
                <UserCheck className="size-3" />
                <span>Tài khoản bi khoa</span>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <button
                  onClick={() => onActivateUser(user)}
                  className="inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-semibold bg-po-primary-soft text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white"
                >
                  <UserCheck className="size-3.5" />
                  Mở khóa
                </button>
              </div>
            </div>
          )}

          {alert.type === "unverified_user" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-po-warning">
                <AlertTriangle className="size-3" />
                <span>Email chưa xác thực</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HeroMetric({
  label,
  value,
  variant,
  icon: Icon,
}: {
  label: string
  value: string
  variant: "primary" | "danger" | "warning" | "muted"
  icon: React.ElementType
}) {
  const colorMap = {
    primary: "text-po-primary",
    danger: "text-po-danger",
    warning: "text-po-warning",
    muted: "text-po-text-muted",
  }

  return (
    <div className="rounded-2xl bg-po-surface-muted/75 p-4 ring-1 ring-po-border/70">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`size-4 ${colorMap[variant]}`} />
        <p className={`text-2xl font-extrabold tabular-nums ${colorMap[variant]}`}>
          {value}
        </p>
      </div>
      <p className="text-xs leading-5 text-po-text-muted">{label}</p>
    </div>
  )
}
