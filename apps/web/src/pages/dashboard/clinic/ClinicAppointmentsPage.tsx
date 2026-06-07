import { useState } from "react"
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  LogIn,
  Plus,
  Stethoscope,
  UserPlus,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import ConfirmDialog from "@/components/ui/ConfirmDialog"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import TabFilter from "@/components/ui/TabFilter"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { appointmentStatusKey, appointmentStatusLabel, appointmentTypeLabel, petSpeciesLabel, staffRoleLabel } from "@/lib/clinicDisplay"
import { cn, getErrorMessage } from "@/lib/utils"
import { formatDate, formatShortId, formatTime, todayDateInput, toDateInputValue } from "@/lib/format"
import {
  cancelAppointmentApi,
  checkInClinicAppointmentApi,
  completeAppointmentApi,
  confirmAppointmentApi,
  createEmergencyAppointmentApi,
  createGuestWalkInIntakeApi,
  getClinicAppointmentsApi,
  noShowAppointmentApi,
  rejectAppointmentApi,
} from "@/services/clinic-appointments.service"
import { getClinicDoctorsInternalApi, getClinicPublicApi, searchClinicPetsApi } from "@/services/clinic.service"
import type { AppointmentListItemResponse, ClinicPetSearchItemResponse, CreateGuestWalkInIntakeRequest } from "@/types"

type StatusFilter = "all" | "Pending" | "Confirmed" | "CheckedIn" | "Completed" | "Cancelled" | "NoShow"
type ActionType = "confirm" | "reject" | "check-in" | "complete" | "no-show" | "cancel"

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "Pending", label: "Chờ xác nhận" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "CheckedIn", label: "Đã check-in" },
  { value: "Completed", label: "Hoàn thành" },
  { value: "Cancelled", label: "Đã hủy" },
  { value: "NoShow", label: "Không đến" },
]

const appointmentTypes = [
  { value: "Checkup", label: "Khám tổng quát" },
  { value: "Vaccination", label: "Tiêm phòng" },
  { value: "Surgery", label: "Phẫu thuật" },
  { value: "Emergency", label: "Cấp cứu" },
  { value: "Grooming", label: "Làm đẹp" },
  { value: "Followup", label: "Tái khám" },
]

function statusVariant(status: string) {
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

export default function ClinicAppointmentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [dateFilter, setDateFilter] = useState("")
  const [searchFilter, setSearchFilter] = useState("")
  const debouncedSearchFilter = useDebouncedValue(searchFilter.trim(), 300)
  const [actionTarget, setActionTarget] = useState<{ appointment: AppointmentListItemResponse; type: ActionType } | null>(null)
  const [reason, setReason] = useState("")
  const [isGuestOpen, setIsGuestOpen] = useState(false)
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false)
  const today = todayDateInput()
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = toDateInputValue(tomorrowDate)

  const appointmentsQuery = useQuery({
    queryKey: ["clinic", clinicId, "appointments", statusFilter, dateFilter, debouncedSearchFilter],
    queryFn: () =>
      getClinicAppointmentsApi({
        clinicId,
        status: statusFilter === "all" ? undefined : statusFilter,
        date: dateFilter || undefined,
        search: debouncedSearchFilter || undefined,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(clinicId),
  })

  const appointments = appointmentsQuery.data?.items ?? []
  const pendingCount = appointments.filter((appointment) => appointmentStatusKey(appointment.status) === "pending").length
  const checkedInCount = appointments.filter((appointment) => appointmentStatusKey(appointment.status) === "checkedin").length
  const walkInCount = appointments.filter((appointment) => appointment.isWalkIn).length
  const todayCount = appointments.filter((appointment) => appointment.appointmentDate === today).length

  const invalidateAppointments = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "appointments"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "dashboard-summary"] }),
    ])
  }

  const actionMutation = useMutation({
    mutationFn: async ({ appointment, type, reasonText }: { appointment: AppointmentListItemResponse; type: ActionType; reasonText?: string }) => {
      switch (type) {
        case "confirm":
          return confirmAppointmentApi(appointment.appointmentId)
        case "reject":
          return rejectAppointmentApi(appointment.appointmentId, { reason: reasonText ?? "" })
        case "check-in":
          return checkInClinicAppointmentApi(appointment.appointmentId, clinicId)
        case "complete":
          return completeAppointmentApi(appointment.appointmentId)
        case "no-show":
          return noShowAppointmentApi(appointment.appointmentId)
        case "cancel":
          return cancelAppointmentApi(appointment.appointmentId, { reason: reasonText })
      }
    },
    onSuccess: async (_, variables) => {
      const successMap: Record<ActionType, string> = {
        confirm: "Đã xác nhận lịch hẹn.",
        reject: "Đã từ chối lịch hẹn.",
        "check-in": "Đã check-in thành công.",
        complete: "Đã hoàn thành lịch hẹn.",
        "no-show": "Đã đánh dấu không đến.",
        cancel: "Đã hủy lịch hẹn.",
      }
      toast.success(successMap[variables.type])
      setActionTarget(null)
      setReason("")
      await invalidateAppointments()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể cập nhật lịch hẹn.")),
  })

  const handleConfirmAction = () => {
    if (!actionTarget) return
    const needsReason = actionTarget.type === "reject" || actionTarget.type === "cancel"
    if (needsReason && !reason.trim()) {
      toast.error("Vui lòng nhập lý do.")
      return
    }

    actionMutation.mutate({
      appointment: actionTarget.appointment,
      type: actionTarget.type,
      reasonText: reason.trim() || undefined,
    })
  }

  if (isClinicLoading) {
    return <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80"><LoadingSpinner /></div>
  }

  if (!clinic) {
    return <EmptyState icon={CalendarCheck} title="Chưa có phòng khám" description="Bạn cần có hồ sơ phòng khám trước khi quản lý lịch hẹn." />
  }

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[26px] bg-white/90 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-po-text-subtle">
              Lịch phòng khám
            </p>
            <h2 className="mt-1 text-xl font-extrabold leading-tight text-po-text">
              Quản lý lịch hẹn
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-po-text-muted">
              Xác nhận, check-in, tiếp nhận walk-in và mở phiếu khám trong cùng một hàng đợi.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-4 lg:w-[640px]">
            <MetricCard label="Đang hiển thị" value={String(appointments.length)} icon={CalendarCheck} tone="info" />
            <MetricCard label="Hôm nay" value={String(todayCount)} icon={Clock} tone="info" />
            <MetricCard label="Chờ xác nhận" value={String(pendingCount)} icon={Clock} tone="warning" />
            <MetricCard label="Đã check-in" value={String(checkedInCount)} icon={Stethoscope} tone="success" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[26px] bg-white/90 ring-1 ring-po-border/80">
        <div className="grid gap-3 border-b border-po-border/80 px-4 py-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-po-text">Hàng đợi lịch hẹn</h3>
              <p className="mt-1 text-xs text-po-text-muted">
                {dateFilter ? `Ngày ${formatDate(dateFilter)}` : "Tất cả ngày"} · {walkInCount} walk-in
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsGuestOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-po-primary-hover active:translate-y-0"
              >
                <UserPlus className="size-4" />
                Khách vãng lai
              </button>
              <button
                onClick={() => setIsEmergencyOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-po-danger px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-po-danger/90 active:translate-y-0"
              >
                <AlertTriangle className="size-4" />
                Cấp cứu
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <TabFilter tabs={statusFilters} activeTab={statusFilter} onChange={setStatusFilter} className="w-full xl:flex-1" />
            <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_auto] xl:w-[620px]">
              <input
                value={searchFilter}
                onChange={(event) => setSearchFilter(event.target.value)}
                placeholder="Tìm pet, chủ nuôi, dịch vụ hoặc mã lịch"
                className="h-10 min-w-0 rounded-full border border-po-border bg-white px-4 text-sm font-semibold text-po-text outline-none transition placeholder:text-po-text-muted/70 focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
              />
              <div className="flex flex-wrap items-center gap-2">
                <DateQuickFilter label="Tất cả ngày" isActive={dateFilter === ""} onClick={() => setDateFilter("")} />
                <DateQuickFilter label="Hôm nay" isActive={dateFilter === today} onClick={() => setDateFilter(today)} />
                <DateQuickFilter label="Ngày mai" isActive={dateFilter === tomorrow} onClick={() => setDateFilter(tomorrow)} />
                <label className="flex h-10 w-fit shrink-0 items-center gap-2 rounded-full border border-po-border bg-white px-3 text-xs font-bold text-po-text-muted">
                  Ngày
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                    className="h-8 rounded-xl border border-po-border bg-white px-2 text-sm font-semibold text-po-text outline-none focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-[calc(100dvh-330px)] min-h-[360px] overflow-y-auto p-4">
          {appointmentsQuery.isLoading ? (
            <AppointmentSkeleton />
          ) : appointmentsQuery.error ? (
            <EmptyState icon={CalendarCheck} title="Không thể tải lịch hẹn" description="Đã xảy ra lỗi. Vui lòng thử lại." className="py-14" />
          ) : appointments.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="Không có lịch hẹn" description="Thử đổi bộ lọc hoặc tạo lịch walk-in cho khách tại quầy." className="py-14" />
          ) : (
            <div className="grid gap-3">
              {appointments.map((appointment) => (
                <ClinicAppointmentCard
                  key={appointment.appointmentId}
                  appointment={appointment}
                  onAction={(type) => {
                    setReason("")
                    setActionTarget({ appointment, type })
                  }}
                  onOpenVisit={() => navigate(`/dashboard/clinic/appointments/${appointment.appointmentId}/visit`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        isOpen={actionTarget !== null && actionTarget.type !== "reject" && actionTarget.type !== "cancel"}
        onClose={() => setActionTarget(null)}
        onConfirm={handleConfirmAction}
        title={actionTarget ? actionDialogText(actionTarget.type).title : ""}
        description={actionTarget ? actionDialogText(actionTarget.type).description : ""}
        confirmLabel={actionTarget ? actionDialogText(actionTarget.type).confirmLabel : "Xác nhận"}
        variant={actionTarget?.type === "no-show" ? "danger" : "primary"}
        isLoading={actionMutation.isPending}
      />

      {actionTarget && (actionTarget.type === "reject" || actionTarget.type === "cancel") ? (
        <ReasonDialog
          type={actionTarget.type}
          reason={reason}
          isLoading={actionMutation.isPending}
          onReasonChange={setReason}
          onClose={() => {
            setActionTarget(null)
            setReason("")
          }}
          onConfirm={handleConfirmAction}
        />
      ) : null}

      <GuestWalkInModal
        isOpen={isGuestOpen}
        clinicId={clinicId}
        onClose={() => setIsGuestOpen(false)}
        onDone={invalidateAppointments}
      />

      <EmergencyModal
        isOpen={isEmergencyOpen}
        clinicId={clinicId}
        onClose={() => setIsEmergencyOpen(false)}
        onDone={invalidateAppointments}
      />
    </div>
  )
}

function actionDialogText(type: ActionType) {
  const map: Record<ActionType, { title: string; description: string; confirmLabel: string }> = {
    confirm: {
      title: "Xác nhận lịch hẹn",
      description: "Lịch sẽ chuyển sang trạng thái đã xác nhận.",
      confirmLabel: "Xác nhận",
    },
    reject: {
      title: "Từ chối lịch hẹn",
      description: "Owner sẽ thấy lý do từ chối.",
      confirmLabel: "Từ chối",
    },
    "check-in": {
      title: "Check-in lịch hẹn",
      description: "Xác nhận pet đã đến phòng khám.",
      confirmLabel: "Check-in",
    },
    complete: {
      title: "Hoàn thành lịch hẹn",
      description: "Chỉ dùng khi ca khám đã hoàn tất.",
      confirmLabel: "Hoàn thành",
    },
    "no-show": {
      title: "Đánh dấu không đến",
      description: "Lịch sẽ được ghi nhận là chủ nuôi không đến.",
      confirmLabel: "Đánh dấu",
    },
    cancel: {
      title: "Hủy lịch hẹn",
      description: "Lịch sẽ bị hủy bởi phòng khám.",
      confirmLabel: "Hủy lịch",
    },
  }

  return map[type]
}

function ClinicAppointmentCard({
  appointment,
  onAction,
  onOpenVisit,
}: {
  appointment: AppointmentListItemResponse
  onAction: (type: ActionType) => void
  onOpenVisit: () => void
}) {
  const status = appointmentStatusKey(appointment.status)
  const isPending = status === "pending"
  const isConfirmed = status === "confirmed"
  const isCheckedIn = status === "checkedin"
  const canOpenVisit = isCheckedIn || status === "completed"

  return (
    <article className="rounded-[22px] bg-po-surface-muted/45 p-3 ring-1 ring-po-border/70 transition hover:bg-white hover:shadow-sm hover:shadow-orange-100/70">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/70">
            <CalendarCheck className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-extrabold text-po-text">Pet {formatShortId(appointment.petId)}</p>
              <StatusBadge variant={statusVariant(appointment.status)} label={appointmentStatusLabel(appointment.status)} />
              {appointment.isWalkIn ? <span className="rounded-full bg-po-accent-soft px-2.5 py-0.5 text-xs font-medium text-po-accent">Walk-in</span> : null}
            </div>
            <p className="mt-1 text-xs font-medium text-po-text-muted">{appointmentTypeLabel(appointment.appointmentType)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-po-text-muted">
              <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-po-border/70">
                <CalendarCheck className="size-3" />
                {formatDate(appointment.appointmentDate)}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-po-border/70">
                <Clock className="size-3" />
                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          {isPending ? (
            <>
              <ActionButton icon={Check} label="Xác nhận" tone="success" onClick={() => onAction("confirm")} />
              <ActionButton icon={XCircle} label="Từ chối" tone="dangerSoft" onClick={() => onAction("reject")} />
            </>
          ) : null}
          {isConfirmed ? (
            <>
              <ActionButton icon={LogIn} label="Check-in" tone="primary" onClick={() => onAction("check-in")} />
              <ActionButton icon={X} label="Không đến" tone="muted" onClick={() => onAction("no-show")} />
              <ActionButton icon={XCircle} label="Hủy" tone="dangerSoft" onClick={() => onAction("cancel")} />
            </>
          ) : null}
          {canOpenVisit ? (
            <ActionButton icon={Stethoscope} label="Phiếu khám" tone="primarySoft" onClick={onOpenVisit} />
          ) : null}
          {isCheckedIn ? (
            <ActionButton icon={CheckCircle2} label="Hoàn thành" tone="success" onClick={() => onAction("complete")} />
          ) : null}
        </div>
      </div>
    </article>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone: "info" | "warning" | "success"
}) {
  const toneClass = {
    info: "bg-po-primary-soft text-po-primary",
    warning: "bg-po-warning-soft text-po-warning",
    success: "bg-po-success-soft text-po-success",
  }[tone]

  return (
    <div className="grid min-h-[76px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[22px] bg-po-surface-muted/60 p-3 ring-1 ring-po-border/70">
      <span className={`grid size-9 place-items-center rounded-2xl ${toneClass}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-po-text-muted">{label}</p>
        <p className="mt-1 text-lg font-extrabold leading-none text-po-text">{value}</p>
      </div>
    </div>
  )
}

function DateQuickFilter({
  label,
  isActive,
  onClick,
}: {
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center rounded-full border px-3 text-xs font-bold transition",
        isActive
          ? "border-po-primary bg-po-primary-soft text-po-primary"
          : "border-po-border bg-white text-po-text-muted hover:border-po-primary/60 hover:text-po-primary",
      )}
    >
      {label}
    </button>
  )
}

function AppointmentSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="grid gap-4 rounded-[22px] bg-po-surface-muted/45 p-3 ring-1 ring-po-border/70 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex gap-3">
            <div className="size-12 animate-pulse rounded-2xl bg-white" />
            <div className="grid flex-1 gap-2">
              <div className="h-4 w-40 animate-pulse rounded-full bg-white" />
              <div className="h-3 w-28 animate-pulse rounded-full bg-white" />
              <div className="h-7 w-64 animate-pulse rounded-full bg-white" />
            </div>
          </div>
          <div className="h-8 w-56 animate-pulse rounded-full bg-white lg:justify-self-end" />
        </div>
      ))}
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: React.ElementType
  label: string
  tone: "primary" | "primarySoft" | "success" | "dangerSoft" | "muted"
  onClick: () => void
}) {
  const classes = {
    primary: "bg-po-primary text-white hover:bg-po-primary-hover",
    primarySoft: "bg-po-primary-soft text-po-primary hover:bg-po-primary hover:text-white",
    success: "bg-po-success text-white hover:bg-po-success/90",
    dangerSoft: "border border-po-border text-po-danger hover:border-po-danger hover:bg-po-danger-soft",
    muted: "border border-po-border text-po-text-muted hover:bg-po-surface-muted hover:text-po-text",
  }

  return (
    <button
      onClick={onClick}
      className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition", classes[tone])}
    >
      <Icon className="size-3" />
      {label}
    </button>
  )
}

function ReasonDialog({
  type,
  reason,
  isLoading,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  type: "reject" | "cancel"
  reason: string
  isLoading: boolean
  onReasonChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  const text = actionDialogText(type)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="m-auto w-[min(440px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
        <h3 className="text-lg font-extrabold text-po-text">{text.title}</h3>
        <p className="mt-2 text-sm text-po-text-muted">{text.description}</p>
        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          rows={3}
          placeholder="Nhập lý do để lưu audit và thông báo cho chủ nuôi"
          className="mt-4 w-full resize-none rounded-2xl border border-po-border bg-white px-4 py-3 text-sm text-po-text outline-none transition placeholder:text-po-text-muted/70 focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} disabled={isLoading} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted">
            Hủy
          </button>
          <button onClick={onConfirm} disabled={isLoading || !reason.trim()} className="inline-flex h-10 items-center rounded-full bg-po-danger px-5 text-sm font-semibold text-white transition hover:bg-po-danger/90 disabled:opacity-60">
            {isLoading ? "Đang xử lý..." : text.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function GuestWalkInModal({
  isOpen,
  clinicId,
  onClose,
  onDone,
}: {
  isOpen: boolean
  clinicId: string
  onClose: () => void
  onDone: () => Promise<void>
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CreateGuestWalkInIntakeRequest>(() => buildGuestWalkInInitial(clinicId))

  const { data: doctors } = useQuery({
    queryKey: ["clinic", clinicId, "doctors"],
    queryFn: () => getClinicDoctorsInternalApi(clinicId),
    enabled: isOpen && Boolean(clinicId),
  })

  const { data: publicProfile } = useQuery({
    queryKey: ["clinic", clinicId, "public"],
    queryFn: () => getClinicPublicApi(clinicId),
    enabled: isOpen && Boolean(clinicId),
  })

  const mutation = useMutation({
    mutationFn: () => createGuestWalkInIntakeApi({
      ...form,
      clinicId,
      ownerAddress: form.ownerAddress?.trim() || null,
      petBreed: form.petBreed?.trim() || null,
      petDateOfBirth: form.petDateOfBirth || null,
      vetClinicId: form.vetClinicId || null,
      serviceId: form.serviceId || null,
      notes: form.notes?.trim() || null,
    }),
    onSuccess: async () => {
      toast.success("Đã tiếp nhận khách vãng lai.")
      setForm(buildGuestWalkInInitial(clinicId))
      await onDone()
      await queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "appointments"] })
      onClose()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể tiếp nhận khách vãng lai.")),
  })

  if (!isOpen) return null

  const update = (key: keyof CreateGuestWalkInIntakeRequest, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const canSubmit = form.ownerFullName.trim() && form.ownerPhone.trim() && form.petName.trim() && form.petSpecies.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="m-auto max-h-[90vh] w-[min(780px,100%)] overflow-hidden rounded-[28px] border border-po-border bg-white shadow-2xl shadow-black/20 animate-dialog-content-in">
        <div className="flex items-start justify-between gap-4 border-b border-po-border px-6 py-5">
          <div>
            <h3 className="text-lg font-extrabold text-po-text">Tiếp nhận khách vãng lai</h3>
            <p className="mt-1 text-sm text-po-text-muted">Tạo chủ nuôi tạm, pet tạm và lịch walk-in trong một bước.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-po-text-muted transition hover:bg-po-surface-muted">
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-150px)] overflow-y-auto px-6 py-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Tên chủ pet" value={form.ownerFullName} onChange={(value) => update("ownerFullName", value)} required />
            <Input label="Số điện thoại" value={form.ownerPhone} onChange={(value) => update("ownerPhone", value)} required />
            <Input label="Địa chỉ chủ nuôi" value={form.ownerAddress ?? ""} onChange={(value) => update("ownerAddress", value)} />
            <Input label="Tên pet" value={form.petName} onChange={(value) => update("petName", value)} required />
            <Select label="Loài" value={form.petSpecies} onChange={(value) => update("petSpecies", value)} options={[{ value: "Dog", label: "Chó" }, { value: "Cat", label: "Mèo" }, { value: "Other", label: "Khác" }]} />
            <Input label="Giống" value={form.petBreed ?? ""} onChange={(value) => update("petBreed", value)} />
            <Select label="Giới tính" value={form.petGender ?? "Unknown"} onChange={(value) => update("petGender", value)} options={[{ value: "Male", label: "Đực" }, { value: "Female", label: "Cái" }, { value: "Unknown", label: "Chưa rõ" }]} />
            <Input label="Ngày sinh pet" type="date" value={form.petDateOfBirth ?? ""} onChange={(value) => update("petDateOfBirth", value)} />
            <Select label="Bác sĩ" value={form.vetClinicId ?? ""} onChange={(value) => update("vetClinicId", value)} options={[{ value: "", label: "Chọn sau" }, ...(doctors ?? []).map((doctor) => ({ value: doctor.vetClinicId, label: `${doctor.fullName} · ${staffRoleLabel(doctor.roleName)}` }))]} />
            <Select label="Dịch vụ" value={form.serviceId ?? ""} onChange={(value) => update("serviceId", value)} options={[{ value: "", label: "Chưa chọn dịch vụ" }, ...(publicProfile?.services ?? []).map((service) => ({ value: service.serviceId, label: service.serviceName }))]} />
            <Input label="Ngày hẹn" type="date" value={form.appointmentDate} onChange={(value) => update("appointmentDate", value)} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Bắt đầu" type="time" value={form.startTime} onChange={(value) => update("startTime", value)} required />
              <Input label="Kết thúc" type="time" value={form.endTime} onChange={(value) => update("endTime", value)} required />
            </div>
            <Select label="Loại khám" value={form.appointmentType} onChange={(value) => update("appointmentType", value)} options={appointmentTypes} />
            <label className="flex items-center gap-2 self-end rounded-2xl border border-po-border bg-po-surface-muted px-4 py-3 text-sm font-semibold text-po-text">
              <input
                type="checkbox"
                checked={form.isPetBirthDateEstimated}
                onChange={(event) => update("isPetBirthDateEstimated", event.target.checked)}
              />
              Ngày sinh ước tính
            </label>
          </div>
          <label className="mt-5 grid gap-1.5 text-sm font-semibold text-po-text">
            Ghi chú
            <textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(event) => update("notes", event.target.value)}
              className="resize-none rounded-2xl border border-po-border bg-white px-4 py-3 text-sm outline-none focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-po-border px-6 py-4">
          <button onClick={onClose} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted">
            Hủy
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            <Plus className="size-4" />
            {mutation.isPending ? "Đang tiếp nhận..." : "Tạo walk-in"}
          </button>
        </div>
      </div>
    </div>
  )
}

function buildGuestWalkInInitial(clinicId: string): CreateGuestWalkInIntakeRequest {
  const now = new Date()
  return {
    clinicId,
    ownerFullName: "",
    ownerPhone: "",
    ownerAddress: "",
    petName: "",
    petSpecies: "Dog",
    petBreed: "",
    petGender: "Unknown",
    petDateOfBirth: "",
    isPetBirthDateEstimated: true,
    appointmentDate: todayDateInput(),
    startTime: now.toTimeString().slice(0, 5),
    endTime: new Date(now.getTime() + 30 * 60 * 1000).toTimeString().slice(0, 5),
    appointmentType: "Checkup",
    notes: "",
  }
}

function EmergencyModal({
  isOpen,
  clinicId,
  onClose,
  onDone,
}: {
  isOpen: boolean
  clinicId: string
  onClose: () => void
  onDone: () => Promise<void>
}) {
  const [petSearch, setPetSearch] = useState("")
  const [selectedPetId, setSelectedPetId] = useState("")
  const [notes, setNotes] = useState("")
  const debouncedPetSearch = useDebouncedValue(petSearch.trim(), 300)

  const petsQuery = useQuery({
    queryKey: ["clinic", clinicId, "pet-search", debouncedPetSearch],
    queryFn: () => searchClinicPetsApi(clinicId, {
      search: debouncedPetSearch || undefined,
      limit: 20,
    }),
    enabled: isOpen && Boolean(clinicId),
  })

  const pets = petsQuery.data ?? []
  const selectedPet = pets.find((pet) => pet.petId === selectedPetId) ?? null

  const mutation = useMutation({
    mutationFn: () => {
      const now = new Date()
      return createEmergencyAppointmentApi({
        clinicId,
        petId: selectedPetId,
        appointmentDate: now.toISOString().slice(0, 10),
        startTime: now.toTimeString().slice(0, 5),
        endTime: new Date(now.getTime() + 30 * 60 * 1000).toTimeString().slice(0, 5),
        notes: notes.trim() || undefined,
      })
    },
    onSuccess: async () => {
      toast.success("Đã tạo lịch cấp cứu.")
      setPetSearch("")
      setSelectedPetId("")
      setNotes("")
      await onDone()
      onClose()
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể tạo lịch cấp cứu.")),
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="m-auto w-[min(480px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-po-danger text-white">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <h3 className="text-lg font-extrabold text-po-text">Tạo lịch cấp cứu</h3>
            <p className="mt-1 text-sm text-po-text-muted">Tìm pet đã từng có lịch tại phòng khám. Khách mới nên dùng tiếp nhận vãng lai.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4">
          <Input label="Tìm pet hoặc chủ nuôi" value={petSearch} onChange={(value) => {
            setPetSearch(value)
            setSelectedPetId("")
          }} />
          <PetSearchSelect
            value={selectedPetId}
            pets={pets}
            isLoading={petsQuery.isLoading || petsQuery.isFetching}
            onChange={setSelectedPetId}
          />
          {selectedPet ? <SelectedPetSummary pet={selectedPet} /> : null}
          <label className="grid gap-1.5 text-sm font-semibold text-po-text">
            Ghi chú
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="resize-none rounded-2xl border border-po-border bg-white px-4 py-3 text-sm outline-none focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted">Hủy</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!selectedPetId || mutation.isPending}
            className="inline-flex h-10 items-center rounded-full bg-po-danger px-5 text-sm font-semibold text-white transition hover:bg-po-danger/90 disabled:opacity-60"
          >
            {mutation.isPending ? "Đang tạo..." : "Tạo cấp cứu"}
          </button>
        </div>
      </div>
    </div>
  )
}

function PetSearchSelect({
  value,
  pets,
  isLoading,
  onChange,
}: {
  value: string
  pets: ClinicPetSearchItemResponse[]
  isLoading: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      Pet cần cấp cứu
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading}
        className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
      >
        <option value="">
          {isLoading ? "Đang tìm pet..." : pets.length === 0 ? "Không tìm thấy pet phù hợp" : "Chọn pet"}
        </option>
        {pets.map((pet) => (
          <option key={pet.petId} value={pet.petId}>
            {pet.petName} - {petSpeciesLabel(pet.species)}
            {pet.breed ? ` ${pet.breed}` : ""}
            {" - "}
            {pet.ownerFullName || pet.ownerPhone || pet.ownerEmail}
          </option>
        ))}
      </select>
    </label>
  )
}

function SelectedPetSummary({ pet }: { pet: ClinicPetSearchItemResponse }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-po-surface-muted/70 p-3 ring-1 ring-po-border/70">
      {pet.avatarUrl ? (
        <img src={pet.avatarUrl} alt={pet.petName} className="size-11 shrink-0 rounded-2xl object-cover" />
      ) : (
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-po-danger ring-1 ring-po-border/70">
          <AlertTriangle className="size-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-po-text">{pet.petName}</p>
        <p className="mt-1 text-xs font-medium text-po-text-muted">
          {petSpeciesLabel(pet.species)}
          {pet.breed ? ` · ${pet.breed}` : ""}
          {pet.gender ? ` · ${pet.gender}` : ""}
        </p>
        <p className="mt-1 truncate text-xs text-po-text-subtle">
          Chủ nuôi: {pet.ownerFullName || pet.ownerPhone || pet.ownerEmail}
        </p>
        {pet.lastAppointmentDate ? (
          <p className="mt-1 text-xs text-po-text-subtle">
            Lần gần nhất: {formatDate(pet.lastAppointmentDate)}
            {pet.lastAppointmentStatus ? ` · ${appointmentStatusLabel(pet.lastAppointmentStatus)}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      <span>{label}{required ? <span className="ml-1 text-po-danger">*</span> : null}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 rounded-2xl border border-po-border bg-white px-3 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20 ${
          type === "time" ? "font-mono tabular-nums" : ""
        }`}
      />
    </label>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <div className="relative grid min-w-0 gap-1.5 text-sm font-semibold text-po-text">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 min-w-0 items-center justify-between gap-2 rounded-2xl border border-po-border bg-white px-3 text-left text-sm font-medium text-po-text outline-none transition hover:border-po-primary/70 focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      >
        <span className="min-w-0 truncate">{selected?.label ?? "Chọn"}</span>
        <ChevronDown className={`size-4 shrink-0 text-po-text-subtle transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-po-border bg-white p-1 shadow-xl shadow-orange-200/30">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                option.value === value
                  ? "bg-po-primary text-white"
                  : "text-po-text hover:bg-po-surface-muted"
              }`}
            >
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
