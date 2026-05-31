import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  PackageSearch,
  Receipt,
  WalletCards,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import DashboardSection from "@/components/dashboard/DashboardSection"
import StatCard from "@/components/dashboard/StatCard"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { formatCurrency, formatShortId, formatTime, todayDateInput } from "@/lib/format"
import { getBillingSummaryApi, getReconciliationApi } from "@/services/clinic-billing.service"
import { getClinicAppointmentsApi } from "@/services/clinic-appointments.service"
import { getLowStockApi } from "@/services/clinic.service"
import type { AppointmentListItemResponse, InventoryItemResponse, SePayReconciliationItemResponse } from "@/types"

function appointmentStatusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "pending" as const
    case "confirmed":
    case "checked-in":
      return "confirmed" as const
    case "completed":
      return "completed" as const
    case "cancelled":
    case "rejected":
    case "no-show":
      return "cancelled" as const
    default:
      return "default" as const
  }
}
function appointmentStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    "checked-in": "Đã check-in",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    rejected: "Từ chối",
    "no-show": "Không đến",
  }

  return map[status.toLowerCase()] ?? status
}

export default function ClinicDashboardPage() {
  const navigate = useNavigate()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const today = todayDateInput()

  const summaryQuery = useQuery({
    queryKey: ["clinic", clinicId, "dashboard-summary"],
    queryFn: () => getBillingSummaryApi(clinicId),
    enabled: Boolean(clinicId),
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
    enabled: Boolean(clinicId),
  })

  const lowStockQuery = useQuery({
    queryKey: ["clinic", clinicId, "low-stock"],
    queryFn: () => getLowStockApi(clinicId),
    enabled: Boolean(clinicId),
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
    enabled: Boolean(clinicId),
  })

  const summary = summaryQuery.data
  const appointments = appointmentsQuery.data?.items ?? []
  const lowStock = lowStockQuery.data ?? []
  const reconciliationItems = reconciliationQuery.data ?? []

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
        title="Chưa có hồ sơ clinic"
        description="Hãy đăng ký phòng khám ở dashboard owner trước khi mở khu vực clinic."
      />
    )
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] bg-white/90 p-5 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">Tổng quan vận hành</p>
            <h2 className="mt-2 text-2xl font-extrabold text-po-text md:text-3xl">{clinic.clinicName}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-po-text-muted">
              Theo dõi lịch khám trong ngày, dòng tiền, công nợ, đối soát SePay và cảnh báo kho.
            </p>
          </div>
          <StatusBadge
            variant={clinic.status === "Approved" ? "success" : clinic.status === "Rejected" ? "danger" : "warning"}
            label={clinic.status}
          />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Lượt khám hôm nay"
          value={String(summary?.todayVisitCount ?? appointments.length)}
          icon={CalendarClock}
          hint="Từ lịch hẹn và check-in"
        />
        <StatCard
          label="Doanh thu đã thu hôm nay"
          value={formatCurrency(summary?.todayPaidRevenue)}
          icon={WalletCards}
          hint="Cash, chuyển khoản, SePay"
        />
        <StatCard
          label="Hóa đơn chưa thu"
          value={String(summary?.unpaidInvoiceCount ?? 0)}
          icon={Receipt}
          hint={formatCurrency(summary?.totalUnpaidAmount)}
        />
        <StatCard
          label="Cần xử lý"
          value={String((summary?.pendingReconciliationCount ?? 0) + (summary?.pendingManualRefundCount ?? 0))}
          icon={AlertTriangle}
          hint={`${summary?.pendingReconciliationCount ?? 0} đối soát, ${summary?.pendingManualRefundCount ?? 0} hoàn tiền`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <DashboardSection
          title="Lịch hôm nay"
          subtitle="Ưu tiên xác nhận, check-in và mở phiếu khám cho các ca đang xử lý."
          action={
            <button
              onClick={() => navigate("/dashboard/clinic/appointments")}
              className="inline-flex h-10 items-center rounded-full bg-po-primary px-4 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
            >
              Xem lịch hẹn
            </button>
          }
        >
          {appointmentsQuery.isLoading ? (
            <div className="py-8 text-center"><LoadingSpinner /></div>
          ) : appointments.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Không có lịch hôm nay" description="Các lịch mới sẽ xuất hiện tại đây." />
          ) : (
            <div className="grid gap-3">
              {appointments.map((appointment) => (
                <AppointmentRow key={appointment.appointmentId} appointment={appointment} />
              ))}
            </div>
          )}
        </DashboardSection>

        <div className="grid gap-6">
          <DashboardSection
            title="Cảnh báo kho"
            subtitle={`${summary?.lowStockItemCount ?? lowStock.length} mặt hàng cần kiểm tra.`}
            action={
              <button
                onClick={() => navigate("/dashboard/clinic/inventory")}
                className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-po-text ring-1 ring-po-border/80 transition hover:bg-po-surface-muted"
              >
                Mở kho
              </button>
            }
          >
            <InventoryWarningList items={lowStock.slice(0, 4)} isLoading={lowStockQuery.isLoading} />
          </DashboardSection>

          <DashboardSection
            title="Đối soát SePay"
            subtitle="Giao dịch chuyển khoản cần staff kiểm tra."
            action={
              <button
                onClick={() => navigate("/dashboard/clinic/billing/reconciliation")}
                className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-po-text ring-1 ring-po-border/80 transition hover:bg-po-surface-muted"
              >
                Đối soát
              </button>
            }
          >
            <ReconciliationPreview items={reconciliationItems} isLoading={reconciliationQuery.isLoading} />
          </DashboardSection>
        </div>
      </div>

      <DashboardSection title="Bucket công nợ" subtitle="Ưu tiên hóa đơn tồn lâu trước khi đóng ngày.">
        <div className="grid gap-3 md:grid-cols-3">
          <DebtBucket label="0-7 ngày" count={summary?.aging0To7Days.count ?? 0} amount={summary?.aging0To7Days.amount ?? 0} />
          <DebtBucket label="8-30 ngày" count={summary?.aging8To30Days.count ?? 0} amount={summary?.aging8To30Days.amount ?? 0} />
          <DebtBucket label="31+ ngày" count={summary?.aging31PlusDays.count ?? 0} amount={summary?.aging31PlusDays.amount ?? 0} danger />
        </div>
      </DashboardSection>
    </div>
  )
}

function AppointmentRow({ appointment }: { appointment: AppointmentListItemResponse }) {
  const navigate = useNavigate()
  const status = appointment.status.toLowerCase()
  const canOpenVisit = status === "checked-in" || status === "completed"

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-po-border bg-white px-4 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-po-text">Pet {formatShortId(appointment.petId)}</p>
          <StatusBadge variant={appointmentStatusVariant(appointment.status)} label={appointmentStatusLabel(appointment.status)} />
          {appointment.isWalkIn ? <span className="rounded-full bg-po-accent-soft px-2.5 py-0.5 text-xs font-semibold text-po-accent">Walk-in</span> : null}
        </div>
        <p className="mt-1 text-xs text-po-text-muted">
          {appointment.appointmentType} · {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
        </p>
      </div>
      <button
        onClick={() => navigate(canOpenVisit ? `/dashboard/clinic/appointments/${appointment.appointmentId}/visit` : "/dashboard/clinic/appointments")}
        className="inline-flex h-9 items-center rounded-full bg-po-surface-muted px-4 text-xs font-semibold text-po-text transition hover:bg-po-primary-soft hover:text-po-primary"
      >
        {canOpenVisit ? "Mở phiếu khám" : "Xử lý"}
      </button>
    </div>
  )
}

function InventoryWarningList({
  items,
  isLoading,
}: {
  items: InventoryItemResponse[]
  isLoading: boolean
}) {
  if (isLoading) return <div className="py-6 text-center"><LoadingSpinner /></div>
  if (items.length === 0) return <EmptyState icon={PackageSearch} title="Kho ổn định" description="Chưa có mặt hàng sắp hết hoặc hết hạn." />

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.itemId} className="rounded-2xl border border-po-border bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-po-text">{item.itemName}</p>
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
  if (isLoading) return <div className="py-6 text-center"><LoadingSpinner /></div>
  if (items.length === 0) return <EmptyState icon={CreditCard} title="Không có giao dịch treo" description="SePay reconciliation đang sạch." />

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.paymentTransactionId} className="rounded-2xl border border-po-border bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-po-text">{formatCurrency(item.transferAmount)}</p>
            <StatusBadge variant={item.needsAttention ? "danger" : "warning"} label={item.status} />
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
    <div className="rounded-2xl border border-po-border bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-po-text-subtle">{label}</p>
      <p className={danger ? "mt-3 text-2xl font-extrabold text-po-danger" : "mt-3 text-2xl font-extrabold text-po-text"}>{formatCurrency(amount)}</p>
      <p className="mt-1 text-sm font-semibold text-po-text-muted">{count} hóa đơn</p>
    </div>
  )
}
