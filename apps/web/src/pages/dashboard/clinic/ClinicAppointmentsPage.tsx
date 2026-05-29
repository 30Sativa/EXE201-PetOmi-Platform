import { useState } from "react"
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  LogIn,
  Plus,
  Stethoscope,
  UserPlus,
  X,
  XCircle,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import DashboardSection from "@/components/dashboard/DashboardSection"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import TabFilter from "@/components/ui/TabFilter"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { cn, getErrorMessage } from "@/lib/utils"
import { formatDate, formatShortId, formatTime, todayDateInput } from "@/lib/format"
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
import { getClinicDoctorsInternalApi, getClinicPublicApi } from "@/services/clinic.service"
import type { AppointmentListItemResponse, CreateGuestWalkInIntakeRequest } from "@/types"

type StatusFilter = "all" | "pending" | "confirmed" | "checked-in" | "completed" | "cancelled" | "no-show"
type ActionType = "confirm" | "reject" | "check-in" | "complete" | "no-show" | "cancel"

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "checked-in", label: "Đã check-in" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "no-show", label: "Không đến" },
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

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    "checked-in": "Đã check-in",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    rejected: "Bị từ chối",
    "no-show": "Không đến",
    expired: "Hết hạn",
  }

  return map[status.toLowerCase()] ?? status
}

export default function ClinicAppointmentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending")
  const [dateFilter, setDateFilter] = useState(todayDateInput())
  const [actionTarget, setActionTarget] = useState<{ appointment: AppointmentListItemResponse; type: ActionType } | null>(null)
  const [reason, setReason] = useState("")
  const [isGuestOpen, setIsGuestOpen] = useState(false)
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false)

  const appointmentsQuery = useQuery({
    queryKey: ["clinic", clinicId, "appointments", statusFilter, dateFilter],
    queryFn: () =>
      getClinicAppointmentsApi({
        clinicId,
        status: statusFilter === "all" ? undefined : statusFilter,
        date: dateFilter || undefined,
        page: 1,
        pageSize: 50,
      }),
    enabled: Boolean(clinicId),
  })

  const appointments = appointmentsQuery.data?.items ?? []

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
    return <EmptyState icon={CalendarCheck} title="Chưa có clinic" description="Bạn cần có hồ sơ clinic trước khi quản lý lịch hẹn." />
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-po-text">Quản lý lịch hẹn</h2>
          <p className="mt-1 text-sm text-po-text-muted">Xác nhận, check-in, tiếp nhận walk-in và mở phiếu khám.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsGuestOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-po-primary-hover"
          >
            <UserPlus className="size-4" />
            Khách vãng lai
          </button>
          <button
            onClick={() => setIsEmergencyOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-po-danger px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-po-danger/90"
          >
            <AlertTriangle className="size-4" />
            Cấp cứu
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <TabFilter tabs={statusFilters} activeTab={statusFilter} onChange={setStatusFilter} className="flex-1" />
        <label className="flex h-11 items-center gap-2 rounded-2xl border border-po-border bg-white px-3 text-sm font-semibold text-po-text-muted">
          Ngày
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="h-9 rounded-xl border border-po-border bg-white px-2 text-sm font-semibold text-po-text"
          />
        </label>
      </div>

      <DashboardSection
        title={`${appointments.length} lịch hẹn`}
        subtitle={dateFilter ? `Ngày ${formatDate(dateFilter)}` : "Không lọc ngày"}
      >
        {appointmentsQuery.isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : appointmentsQuery.error ? (
          <EmptyState icon={CalendarCheck} title="Không thể tải lịch hẹn" description="Đã xảy ra lỗi. Vui lòng thử lại." />
        ) : appointments.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="Không có lịch hẹn" description="Thử đổi bộ lọc hoặc tạo lịch walk-in cho khách tại quầy." />
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
      </DashboardSection>

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
      description: "Lịch sẽ được ghi nhận là owner không đến.",
      confirmLabel: "Đánh dấu",
    },
    cancel: {
      title: "Hủy lịch hẹn",
      description: "Lịch sẽ bị hủy bởi clinic.",
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
  const status = appointment.status.toLowerCase()
  const isPending = status === "pending"
  const isConfirmed = status === "confirmed"
  const isCheckedIn = status === "checked-in"
  const canOpenVisit = isCheckedIn || status === "completed"

  return (
    <div className="rounded-2xl border border-po-border bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
            <CalendarCheck className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-po-text">Pet {formatShortId(appointment.petId)}</p>
              <StatusBadge variant={statusVariant(appointment.status)} label={statusLabel(appointment.status)} />
              {appointment.isWalkIn ? <span className="rounded-full bg-po-accent-soft px-2.5 py-0.5 text-xs font-medium text-po-accent">Walk-in</span> : null}
            </div>
            <p className="mt-1 text-xs text-po-text-muted">{appointment.appointmentType}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-po-text-subtle">
              <span className="flex items-center gap-1">
                <CalendarCheck className="size-3" />
                {formatDate(appointment.appointmentDate)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
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
          {(isCheckedIn || isConfirmed) ? (
            <ActionButton icon={CheckCircle2} label="Hoàn thành" tone="success" onClick={() => onAction("complete")} />
          ) : null}
        </div>
      </div>
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
          placeholder="Nhập lý do để lưu audit và thông báo cho owner"
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
            <p className="mt-1 text-sm text-po-text-muted">Tạo owner tạm, pet tạm và lịch walk-in trong một bước.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-po-text-muted transition hover:bg-po-surface-muted">
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-150px)] overflow-y-auto px-6 py-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Tên chủ pet" value={form.ownerFullName} onChange={(value) => update("ownerFullName", value)} required />
            <Input label="Số điện thoại" value={form.ownerPhone} onChange={(value) => update("ownerPhone", value)} required />
            <Input label="Địa chỉ owner" value={form.ownerAddress ?? ""} onChange={(value) => update("ownerAddress", value)} />
            <Input label="Tên pet" value={form.petName} onChange={(value) => update("petName", value)} required />
            <Select label="Loài" value={form.petSpecies} onChange={(value) => update("petSpecies", value)} options={[{ value: "Dog", label: "Chó" }, { value: "Cat", label: "Mèo" }, { value: "Other", label: "Khác" }]} />
            <Input label="Giống" value={form.petBreed ?? ""} onChange={(value) => update("petBreed", value)} />
            <Select label="Giới tính" value={form.petGender ?? "Unknown"} onChange={(value) => update("petGender", value)} options={[{ value: "Male", label: "Đực" }, { value: "Female", label: "Cái" }, { value: "Unknown", label: "Chưa rõ" }]} />
            <Input label="Ngày sinh pet" type="date" value={form.petDateOfBirth ?? ""} onChange={(value) => update("petDateOfBirth", value)} />
            <Select label="Bác sĩ" value={form.vetClinicId ?? ""} onChange={(value) => update("vetClinicId", value)} options={[{ value: "", label: "Chọn sau" }, ...(doctors ?? []).map((doctor) => ({ value: doctor.vetClinicId, label: `${doctor.fullName} · ${doctor.roleName}` }))]} />
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
  const [petId, setPetId] = useState("")
  const [notes, setNotes] = useState("")

  const mutation = useMutation({
    mutationFn: () => {
      const now = new Date()
      return createEmergencyAppointmentApi({
        clinicId,
        petId,
        appointmentDate: now.toISOString().slice(0, 10),
        startTime: now.toTimeString().slice(0, 5),
        endTime: new Date(now.getTime() + 30 * 60 * 1000).toTimeString().slice(0, 5),
        notes: notes.trim() || undefined,
      })
    },
    onSuccess: async () => {
      toast.success("Đã tạo lịch cấp cứu.")
      setPetId("")
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
            <p className="mt-1 text-sm text-po-text-muted">Dùng cho pet đã có hồ sơ. Khách mới nên dùng tiếp nhận vãng lai.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4">
          <Input label="Pet ID" value={petId} onChange={setPetId} required />
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
            disabled={!petId.trim() || mutation.isPending}
            className="inline-flex h-10 items-center rounded-full bg-po-danger px-5 text-sm font-semibold text-white transition hover:bg-po-danger/90 disabled:opacity-60"
          >
            {mutation.isPending ? "Đang tạo..." : "Tạo cấp cứu"}
          </button>
        </div>
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
        className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
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
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
