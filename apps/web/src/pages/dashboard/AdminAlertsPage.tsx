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
  getAdminAlertsApi,
  approveClinicApi,
  rejectClinicApi,
  toggleUserStatusApi,
} from "@/services/admin.service"
import type {
  AdminAlertItemResponse,
  AdminAlertSeverity,
  AdminUserListResponse,
  ClinicListItemResponse,
} from "@/types"

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

    if (diffMins < 1) return "Vua xong"
    if (diffMins < 60) return `${diffMins} phut truoc`
    if (diffHours < 24) return `${diffHours} gio truoc`
    if (diffDays < 7) return `${diffDays} ngay truoc`
    return formatDate(dateStr)
  } catch {
    return dateStr
  }
}

function getSeverityIcon(severity: AdminAlertSeverity) {
  switch (severity) {
    case "high":
      return <AlertCircle className="size-4 text-po-danger" />
    case "medium":
      return <AlertTriangle className="size-4 text-po-warning" />
    case "low":
      return <Bell className="size-4 text-po-text-muted" />
  }
}

const severityOrder: Record<AdminAlertSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

type AlertItem = AdminAlertItemResponse

export default function AdminAlertsPage() {
  const queryClient = useQueryClient()

  const [filterSeverity, setFilterSeverity] = useState<"all" | AdminAlertSeverity>("all")
  const [filterType, setFilterType] = useState<"all" | AlertItem["type"]>("all")

  const [approveTarget, setApproveTarget] = useState<ClinicListItemResponse | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ClinicListItemResponse | null>(null)
  const [activateTarget, setActivateTarget] = useState<AdminUserListResponse | null>(null)

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ["admin", "alerts"],
    queryFn: () => getAdminAlertsApi({ maxItems: 100 }),
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

  const allAlerts = alertsData?.items ?? []
  const filteredAlerts = allAlerts
    .filter((a) => filterSeverity === "all" || a.severity === filterSeverity)
    .filter((a) => filterType === "all" || a.type === filterType)
    .sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

  const stats = alertsData?.stats ?? {
    total: allAlerts.length,
    high: allAlerts.filter((a) => a.severity === "high").length,
    medium: allAlerts.filter((a) => a.severity === "medium").length,
    low: allAlerts.filter((a) => a.severity === "low").length,
  }

  const severityTabs: { label: string; value: "all" | AdminAlertSeverity; count?: number }[] = [
    { label: "Tat ca", value: "all", count: stats.total },
    { label: "Nguy hiem", value: "high", count: stats.high },
    { label: "Can chu y", value: "medium", count: stats.medium },
    { label: "Thap", value: "low", count: stats.low },
  ]

  const typeTabs: { label: string; value: "all" | AlertItem["type"] }[] = [
    { label: "Tat ca loai", value: "all" },
    { label: "Clinic", value: "pending_clinic" },
    { label: "Tai khoan", value: "inactive_user" },
    { label: "Chua xac thuc", value: "unverified_user" },
  ]

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-[34px] bg-white/90 text-po-text shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">
            Admin alerts center
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">
            Trung tam canh bao
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-po-text-muted">
            Theo doi cac thong bao, yeu cau cho duyet va hanh dong can xu ly nhanh.
            Uu tien cac canh bao muc cao truoc.
          </p>

          <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HeroMetric
              label="Tong canh bao"
              value={String(stats.total)}
              variant="primary"
              icon={ShieldAlert}
            />
            <HeroMetric
              label="Nguy hiem"
              value={String(stats.high)}
              variant="danger"
              icon={AlertCircle}
            />
            <HeroMetric
              label="Can chu y"
              value={String(stats.medium)}
              variant="warning"
              icon={AlertTriangle}
            />
            <HeroMetric
              label="Thap"
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
              title="Khong co canh bao nao"
              description="He thong hien tai khong co thong bao hay hanh dong can xu ly."
            />
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.alertId}
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
        title="Duyet phong kham?"
        description={`Ban chac chan muon duyet phong kham "${approveTarget?.clinicName}"?`}
        confirmLabel="Duyet"
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
        title="Tu choi phong kham?"
        description={`Ban muon tu choi phong kham "${rejectTarget?.clinicName}".`}
        confirmLabel="Tu choi"
        isLoading={rejectMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!activateTarget}
        onClose={() => setActivateTarget(null)}
        onConfirm={() => {
          if (!activateTarget) return
          activateMutation.mutate({ userId: activateTarget.userId, isActive: true })
        }}
        title="Mo khoa tai khoan?"
        description={`Mo khoa tai khoan "${activateTarget?.fullName ?? activateTarget?.email}" de ho co the dang nhap tro lai.`}
        confirmLabel="Mo khoa"
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
                  ? "Nguy hiem"
                  : alert.severity === "medium"
                    ? "Can chu y"
                    : "Thap"}
              </span>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-po-text-muted">
                <Clock className="size-3" />
                {formatRelative(alert.timestamp)}
              </p>
            </div>
          </div>

          {alert.type === "pending_clinic" && alert.clinic && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {alert.clinic.licenseNumber ? (
                <span className="inline-flex items-center gap-1 text-po-success text-xs">
                  <BadgeCheck className="size-3" />
                  GPLX: {alert.clinic.licenseNumber}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-po-warning text-xs">
                  <AlertCircle className="size-3" />
                  Chua co GPLX
                </span>
              )}
              <div className="ml-auto flex flex-wrap gap-2">
                <button
                  onClick={() => onApproveClinic(alert.clinic!)}
                  className="inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-semibold bg-po-success-soft text-po-success transition hover:-translate-y-0.5 hover:bg-po-success hover:text-white"
                >
                  <CheckCircle2 className="size-3.5" />
                  Duyet
                </button>
                <button
                  onClick={() => onRejectClinic(alert.clinic!)}
                  className="inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-semibold bg-po-danger-soft text-po-danger transition hover:-translate-y-0.5 hover:bg-po-danger hover:text-white"
                >
                  <XCircle className="size-3.5" />
                  Tu choi
                </button>
              </div>
            </div>
          )}

          {alert.type === "inactive_user" && alert.user && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-po-text-muted">
                <UserCheck className="size-3" />
                <span>Tai khoan bi khoa</span>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <button
                  onClick={() => onActivateUser(alert.user!)}
                  className="inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-semibold bg-po-primary-soft text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white"
                >
                  <UserCheck className="size-3.5" />
                  Mo khoa
                </button>
              </div>
            </div>
          )}

          {alert.type === "unverified_user" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-po-warning">
                <AlertTriangle className="size-3" />
                <span>Email chua xac thuc</span>
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
