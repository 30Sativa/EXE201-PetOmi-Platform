import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  PackageSearch,
  Receipt,
  UserRoundCog,
  WalletCards,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { useMyClinic } from "@/hooks/useClinicQueries"
import {
  appointmentStatusKey,
  appointmentStatusLabel,
  appointmentTypeLabel,
  clinicStatusLabel,
  sePayReconciliationStatusLabel,
  staffRoleDescription,
  staffRoleLabel,
} from "@/lib/clinicDisplay"
import { CLINIC_PERMISSIONS, hasClinicPermission } from "@/lib/clinicPermissions"
import { formatCurrency, formatShortId, formatTime, todayDateInput } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getBillingSummaryApi, getReconciliationApi } from "@/services/clinic-billing.service"
import { getClinicAppointmentsApi } from "@/services/clinic-appointments.service"
import { getLowStockApi } from "@/services/clinic.service"
import type { AppointmentListItemResponse, InventoryItemResponse, SePayReconciliationItemResponse } from "@/types"

function appointmentStatusVariant(status: string) {
  switch (appointmentStatusKey(status)) {
    case "pending":
      return "pending" as const
    case "confirmed":
    case "checkedin":
      return "confirmed" as const
    case "completed":
      return "completed" as const
    case "cancelled":
    case "rejected":
    case "noshow":
      return "cancelled" as const
    default:
      return "default" as const
  }
}

const compactNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: value >= 10 ? 0 : 1 }).format(value)

const formatCompactCurrency = (value?: number | null) => {
  const amount = value ?? 0
  const absolute = Math.abs(amount)
  if (absolute >= 1_000_000_000) return `${compactNumber(amount / 1_000_000_000)} tỷ`
  if (absolute >= 1_000_000) return `${compactNumber(amount / 1_000_000)} triệu`
  if (absolute >= 100_000) return `${compactNumber(amount / 1_000)} nghìn`
  return formatCurrency(amount)
}

export default function ClinicDashboardPage() {
  const navigate = useNavigate()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const today = todayDateInput()
  const canViewAppointments = hasClinicPermission(clinic, CLINIC_PERMISSIONS.VIEW_APPOINTMENTS)
  const canWriteMedicalRecord = hasClinicPermission(clinic, CLINIC_PERMISSIONS.WRITE_MEDICAL_RECORD)
  const canViewBilling = hasClinicPermission(clinic, CLINIC_PERMISSIONS.VIEW_INVOICE)
  const canViewInventory = hasClinicPermission(clinic, CLINIC_PERMISSIONS.VIEW_INVENTORY)
  const canReconcilePayments = hasClinicPermission(clinic, CLINIC_PERMISSIONS.RECONCILE_PAYMENT)
  const hasSidePanels = canViewInventory || canReconcilePayments

  const summaryQuery = useQuery({
    queryKey: ["clinic", clinicId, "dashboard-summary"],
    queryFn: () => getBillingSummaryApi(clinicId),
    enabled: Boolean(clinicId) && canViewBilling,
  })

  const appointmentsQuery = useQuery({
    queryKey: ["clinic", clinicId, "appointments", "today", today],
    queryFn: () =>
      getClinicAppointmentsApi({
        clinicId,
        date: today,
        page: 1,
        pageSize: 8,
      }),
    enabled: Boolean(clinicId) && canViewAppointments,
  })

  const lowStockQuery = useQuery({
    queryKey: ["clinic", clinicId, "low-stock"],
    queryFn: () => getLowStockApi(clinicId),
    enabled: Boolean(clinicId) && canViewInventory,
  })

  const reconciliationQuery = useQuery({
    queryKey: ["clinic", clinicId, "reconciliation", "attention"],
    queryFn: () =>
      getReconciliationApi({
        clinicId,
        limit: 5,
        includeMatched: false,
        alertAfterMinutes: 30,
      }),
    enabled: Boolean(clinicId) && canReconcilePayments,
  })

  const summary = summaryQuery.data
  const appointments = appointmentsQuery.data?.items ?? []
  const lowStock = lowStockQuery.data ?? []
  const reconciliationItems = reconciliationQuery.data ?? []
  const actionCount = canViewBilling
    ? (summary?.pendingReconciliationCount ?? 0) + (summary?.pendingManualRefundCount ?? 0)
    : 0

  if (isClinicLoading) {
    return (
      <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80">
        <LoadingSpinner />
      </div>
    )
  }

  if (!clinic) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Chưa có hồ sơ phòng khám"
        description="Hãy đăng ký phòng khám ở dashboard chủ nuôi trước khi mở khu vực phòng khám."
      />
    )
  }

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[26px] bg-white/90 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-po-text-subtle">
              Tổng quan phòng khám
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold leading-tight text-po-text">{clinic.clinicName}</h2>
              <StatusBadge
                variant={clinic.status === "Approved" ? "success" : clinic.status === "Rejected" ? "danger" : "warning"}
                label={clinicStatusLabel(clinic.status)}
              />
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-po-text-muted">
              Theo dõi lịch trong ngày, dòng tiền, công nợ, đối soát SePay và cảnh báo kho theo đúng quyền của vai trò hiện tại.
            </p>
            <div className="mt-3 flex max-w-3xl items-start gap-2 rounded-2xl bg-po-surface-muted/70 p-3 ring-1 ring-po-border/70">
              <UserRoundCog className="mt-0.5 size-4 shrink-0 text-po-primary" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-po-text">{staffRoleLabel(clinic.clinicRoleName)}</p>
                <p className="mt-1 text-xs leading-5 text-po-text-muted">
                  {staffRoleDescription(clinic.clinicRoleName)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:w-[430px]">
            {canViewBilling ? (
              <>
                <MetricCard label="Doanh thu hôm nay" value={formatCompactCurrency(summary?.todayPaidRevenue)} icon={WalletCards} tone="success" />
                <MetricCard label="Cần xử lý" value={String(actionCount)} icon={AlertTriangle} tone="warning" />
              </>
            ) : (
              <MetricCard label="Lịch hôm nay" value={String(appointments.length)} icon={CalendarClock} tone="info" />
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Lượt khám hôm nay" value={String(summary?.todayVisitCount ?? appointments.length)} icon={CalendarClock} tone="info" />
        {canViewBilling ? (
          <MetricCard label="Hóa đơn chưa thu" value={String(summary?.unpaidInvoiceCount ?? 0)} hint={formatCompactCurrency(summary?.totalUnpaidAmount)} icon={Receipt} tone="warning" />
        ) : null}
        {canReconcilePayments ? (
          <MetricCard label="Đối soát" value={String(summary?.pendingReconciliationCount ?? 0)} icon={CreditCard} tone="danger" />
        ) : null}
        {canViewInventory ? (
          <MetricCard label="Kho cần xem" value={String(summary?.lowStockItemCount ?? lowStock.length)} icon={PackageSearch} tone="info" />
        ) : null}
      </div>

      <div
        className={cn(
          "grid gap-4 xl:h-[calc(100dvh-340px)] xl:min-h-[620px]",
          hasSidePanels ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "",
        )}
      >
        <section className="min-h-0 overflow-hidden rounded-[26px] bg-white/90 ring-1 ring-po-border/80">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-po-border/80 px-4 py-3">
            <div>
              <h3 className="text-base font-extrabold text-po-text">Lịch hôm nay</h3>
              <p className="mt-1 text-xs text-po-text-muted">Ưu tiên xác nhận, check-in và mở phiếu khám.</p>
            </div>
            <button
              onClick={() => navigate("/dashboard/clinic/appointments")}
              className="inline-flex h-10 items-center rounded-full bg-po-primary px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-po-primary-hover active:translate-y-0"
            >
              Xem lịch hẹn
            </button>
          </div>

          <div className="min-h-0 overflow-y-auto p-4">
            {appointmentsQuery.isLoading ? (
              <RowSkeleton />
            ) : appointments.length === 0 ? (
              <EmptyState icon={CalendarClock} title="Không có lịch hôm nay" description="Các lịch mới sẽ xuất hiện tại đây." className="py-14" />
            ) : (
              <div className="grid gap-3">
                {appointments.map((appointment) => (
                  <AppointmentRow
                    key={appointment.appointmentId}
                    appointment={appointment}
                    canOpenVisit={canWriteMedicalRecord}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {hasSidePanels ? (
          <aside className="grid min-h-0 gap-4 xl:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
            <Panel
              title="Cảnh báo kho"
              subtitle={`${summary?.lowStockItemCount ?? lowStock.length} mặt hàng cần kiểm tra.`}
              actionLabel="Mở kho"
              onAction={() => navigate("/dashboard/clinic/inventory")}
            >
              <InventoryWarningList items={lowStock.slice(0, 4)} isLoading={lowStockQuery.isLoading} />
            </Panel>

            <Panel
              title="Đối soát SePay"
              subtitle="Giao dịch chuyển khoản cần thu ngân kiểm tra."
              actionLabel="Đối soát"
              onAction={() => navigate("/dashboard/clinic/billing/reconciliation")}
            >
              <ReconciliationPreview items={reconciliationItems} isLoading={reconciliationQuery.isLoading} />
            </Panel>
          </aside>
        ) : null}
      </div>

      {canViewBilling ? (
        <section className="rounded-[26px] bg-white/90 p-4 ring-1 ring-po-border/80">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-po-text">Nhóm công nợ</h3>
              <p className="mt-1 text-xs text-po-text-muted">Ưu tiên hóa đơn tồn lâu trước khi đóng ngày.</p>
            </div>
            <button
              onClick={() => navigate("/dashboard/clinic/billing")}
              className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-po-text ring-1 ring-po-border/80 transition hover:bg-po-surface-muted"
            >
              Mở thu ngân
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <DebtBucket label="0-7 ngày" count={summary?.aging0To7Days.count ?? 0} amount={summary?.aging0To7Days.amount ?? 0} />
            <DebtBucket label="8-30 ngày" count={summary?.aging8To30Days.count ?? 0} amount={summary?.aging8To30Days.amount ?? 0} />
            <DebtBucket label="31+ ngày" count={summary?.aging31PlusDays.count ?? 0} amount={summary?.aging31PlusDays.amount ?? 0} danger />
          </div>
        </section>
      ) : null}
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone: "info" | "success" | "warning" | "danger"
}) {
  const toneClass = {
    info: "bg-po-primary-soft text-po-primary",
    success: "bg-po-success-soft text-po-success",
    warning: "bg-po-warning-soft text-po-warning",
    danger: "bg-po-danger-soft text-po-danger",
  }[tone]

  return (
    <div className="grid min-h-[86px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-po-border/80">
      <span className={`grid size-9 place-items-center rounded-2xl ${toneClass}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-po-text-muted">{label}</p>
        <p className="mt-1 truncate text-lg font-extrabold leading-none text-po-text" title={value}>{value}</p>
        {hint ? <p className="mt-1.5 truncate text-xs font-semibold text-po-text-subtle">{hint}</p> : null}
      </div>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
}: {
  title: string
  subtitle: string
  actionLabel: string
  onAction: () => void
  children: ReactNode
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[26px] bg-white/90 ring-1 ring-po-border/80">
      <div className="flex items-start justify-between gap-3 border-b border-po-border/80 px-4 py-3">
        <div>
          <h3 className="text-base font-extrabold text-po-text">{title}</h3>
          <p className="mt-1 text-xs text-po-text-muted">{subtitle}</p>
        </div>
        <button
          onClick={onAction}
          className="inline-flex h-9 shrink-0 items-center rounded-full bg-white px-3 text-xs font-bold text-po-text ring-1 ring-po-border/80 transition hover:bg-po-surface-muted"
        >
          {actionLabel}
        </button>
      </div>
      <div className="min-h-0 overflow-y-auto p-4">{children}</div>
    </section>
  )
}

function AppointmentRow({
  appointment,
  canOpenVisit,
}: {
  appointment: AppointmentListItemResponse
  canOpenVisit: boolean
}) {
  const navigate = useNavigate()
  const status = appointmentStatusKey(appointment.status)
  const shouldOpenVisit = canOpenVisit && (status === "checkedin" || status === "completed")

  return (
    <article className="grid gap-3 rounded-[22px] bg-po-surface-muted/45 p-3 ring-1 ring-po-border/70 transition hover:bg-white hover:shadow-sm hover:shadow-orange-100/70 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-extrabold text-po-text">Pet {formatShortId(appointment.petId)}</p>
          <StatusBadge variant={appointmentStatusVariant(appointment.status)} label={appointmentStatusLabel(appointment.status)} />
          {appointment.isWalkIn ? <span className="rounded-full bg-po-accent-soft px-2.5 py-0.5 text-xs font-semibold text-po-accent">Khách vãng lai</span> : null}
        </div>
        <p className="mt-2 text-xs font-medium text-po-text-muted">
          {appointmentTypeLabel(appointment.appointmentType)} · {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
        </p>
      </div>
      <button
        onClick={() => navigate(shouldOpenVisit ? `/dashboard/clinic/appointments/${appointment.appointmentId}/visit` : "/dashboard/clinic/appointments")}
        className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-xs font-bold text-po-text ring-1 ring-po-border/70 transition hover:bg-po-primary hover:text-white"
      >
        {shouldOpenVisit ? "Mở phiếu khám" : "Xử lý"}
      </button>
    </article>
  )
}

function InventoryWarningList({
  items,
  isLoading,
}: {
  items: InventoryItemResponse[]
  isLoading: boolean
}) {
  if (isLoading) return <RowSkeleton compact />
  if (items.length === 0) return <EmptyState icon={PackageSearch} title="Kho ổn định" description="Chưa có mặt hàng sắp hết hoặc hết hạn." className="py-8" />

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item.itemId} className="rounded-2xl bg-po-surface-muted/60 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-bold text-po-text">{item.itemName}</p>
            <StatusBadge variant={item.isExpired ? "danger" : "warning"} label={item.isExpired ? "Hết hạn" : "Sắp hết"} />
          </div>
          <p className="mt-1 text-xs text-po-text-muted">
            Còn {item.quantity} {item.unit ?? "đơn vị"} · Ngưỡng {item.lowStockThreshold}
          </p>
        </div>
      ))}
    </div>
  )
}

function ReconciliationPreview({
  items,
  isLoading,
}: {
  items: SePayReconciliationItemResponse[]
  isLoading: boolean
}) {
  if (isLoading) return <RowSkeleton compact />
  if (items.length === 0) return <EmptyState icon={CreditCard} title="Không có giao dịch treo" description="Đối soát SePay đang sạch." className="py-8" />

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item.paymentTransactionId} className="rounded-2xl bg-po-surface-muted/60 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-extrabold text-po-text">{formatCompactCurrency(item.transferAmount)}</p>
            <StatusBadge variant={item.needsAttention ? "danger" : "warning"} label={sePayReconciliationStatusLabel(item.status)} />
          </div>
          <p className="mt-1 truncate text-xs text-po-text-muted">{item.transferContent ?? item.referenceCode ?? "Không có nội dung"}</p>
        </div>
      ))}
    </div>
  )
}

function DebtBucket({
  label,
  count,
  amount,
  danger,
}: {
  label: string
  count: number
  amount: number
  danger?: boolean
}) {
  return (
    <div className="rounded-2xl bg-po-surface-muted/55 px-4 py-3 ring-1 ring-po-border/70">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-po-text-subtle">{label}</p>
      <p className={danger ? "mt-2 text-lg font-extrabold text-po-danger" : "mt-2 text-lg font-extrabold text-po-text"}>{formatCompactCurrency(amount)}</p>
      <p className="mt-1 text-xs font-semibold text-po-text-muted">{count} hóa đơn</p>
    </div>
  )
}

function RowSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: compact ? 3 : 5 }).map((_, index) => (
        <div key={index} className="rounded-[22px] bg-po-surface-muted/45 p-3 ring-1 ring-po-border/70">
          <div className="h-4 w-40 animate-pulse rounded-full bg-white" />
          <div className="mt-2 h-3 w-64 animate-pulse rounded-full bg-white" />
        </div>
      ))}
    </div>
  )
}
