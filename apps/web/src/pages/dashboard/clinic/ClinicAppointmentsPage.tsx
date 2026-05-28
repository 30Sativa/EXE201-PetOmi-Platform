import { useState } from "react"
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  LogIn,
  Plus,
  X,
  XCircle,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import TabFilter from "@/components/ui/TabFilter"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import ClinicQuickAddModal from "@/components/dashboard/clinic/ClinicQuickAddModal"
import { useMe } from "@/hooks/useAuthQueries"
import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/lib/utils"
import { getMyClinicApi } from "@/services/clinic.service"
import {
  checkInAppointmentApi,
  completeAppointmentApi,
  confirmAppointmentApi,
  createEmergencyAppointmentApi,
  createWalkInAppointmentApi,
  getClinicAppointmentsApi,
  noShowAppointmentApi,
  rejectAppointmentApi,
} from "@/services/clinic-appointments.service"
import type { AppointmentListItemResponse } from "@/types"

type StatusFilter = "all" | "pending" | "confirmed" | "checked-in" | "completed" | "cancelled" | "no-show" | "expired"

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "checked-in", label: "Đã check-in" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "no-show", label: "Không đến" },
]

const statusBadgeVariant = (status: string): "pending" | "confirmed" | "completed" | "cancelled" | "default" => {
  switch (status.toLowerCase()) {
    case "pending": return "pending"
    case "confirmed": return "confirmed"
    case "checked-in": return "confirmed"
    case "completed": return "completed"
    case "cancelled": return "cancelled"
    case "rejected": return "cancelled"
    case "no-show": return "cancelled"
    default: return "default"
  }
}

const statusLabel = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending": return "Chờ xác nhận"
    case "confirmed": return "Đã xác nhận"
    case "checked-in": return "Đã check-in"
    case "completed": return "Hoàn thành"
    case "cancelled": return "Đã hủy"
    case "rejected": return "Bị từ chối"
    case "no-show": return "Không đến"
    case "expired": return "Hết hạn"
    default: return status
  }
}

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    })
  } catch {
    return dateStr
  }
}

const formatTime = (timeStr: string) => timeStr.slice(0, 5)

interface ActionState {
  appointment: AppointmentListItemResponse | null
  type: "confirm" | "reject" | "complete" | "no-show" | "check-in" | null
}

export default function ClinicAppointmentsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending")
  const [actionTarget, setActionTarget] = useState<ActionState>({ appointment: null, type: null })
  const [rejectReason, setRejectReason] = useState("")
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddType, setQuickAddType] = useState<"walk-in" | "emergency">("walk-in")

  const { data: me } = useMe()
  const { data: myClinic } = useQuery({
    queryKey: ["owner", "my-clinic"],
    queryFn: getMyClinicApi,
    enabled: me?.roles?.includes("ClinicOwner") ?? false,
    retry: false,
  })

  const clinicId = myClinic?.clinicId ?? ""

  const { data: appointmentsData, isLoading, error } = useQuery({
    queryKey: ["clinic-appointments", clinicId, statusFilter],
    queryFn: () =>
      getClinicAppointmentsApi({
        clinicId,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: 1,
        pageSize: 50,
      }),
    enabled: clinicId !== "",
  })

  const appointments = appointmentsData?.items ?? []

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmAppointmentApi(id),
    onSuccess: () => {
      toast.success("Đã xác nhận lịch hẹn.")
      queryClient.invalidateQueries({ queryKey: ["clinic-appointments"] })
      setActionTarget({ appointment: null, type: null })
    },
    onError: (e) => toast.error(getErrorMessage(e, "Xác nhận thất bại.")),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectAppointmentApi(id, { reason }),
    onSuccess: () => {
      toast.success("Đã từ chối lịch hẹn.")
      queryClient.invalidateQueries({ queryKey: ["clinic-appointments"] })
      setActionTarget({ appointment: null, type: null })
      setRejectReason("")
    },
    onError: (e) => toast.error(getErrorMessage(e, "Từ chối thất bại.")),
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeAppointmentApi(id),
    onSuccess: () => {
      toast.success("Đã đánh dấu hoàn thành.")
      queryClient.invalidateQueries({ queryKey: ["clinic-appointments"] })
      setActionTarget({ appointment: null, type: null })
    },
    onError: (e) => toast.error(getErrorMessage(e, "Thao tác thất bại.")),
  })

  const noShowMutation = useMutation({
    mutationFn: (id: string) => noShowAppointmentApi(id),
    onSuccess: () => {
      toast.success("Đã đánh dấu không đến.")
      queryClient.invalidateQueries({ queryKey: ["clinic-appointments"] })
      setActionTarget({ appointment: null, type: null })
    },
    onError: (e) => toast.error(getErrorMessage(e, "Thao tác thất bại.")),
  })

  const checkInMutation = useMutation({
    mutationFn: (id: string) => checkInAppointmentApi(id),
    onSuccess: () => {
      toast.success("Đã check-in thành công.")
      queryClient.invalidateQueries({ queryKey: ["clinic-appointments"] })
      setActionTarget({ appointment: null, type: null })
    },
    onError: (e) => toast.error(getErrorMessage(e, "Check-in thất bại.")),
  })

  const getActionDialog = () => {
    const { type, appointment } = actionTarget
    if (!type || !appointment) return null

    const isLoading =
      confirmMutation.isPending ||
      rejectMutation.isPending ||
      completeMutation.isPending ||
      noShowMutation.isPending ||
      checkInMutation.isPending

    const handleConfirm = () => {
      switch (type) {
        case "confirm":
          confirmMutation.mutate(appointment.appointmentId)
          break
        case "complete":
          completeMutation.mutate(appointment.appointmentId)
          break
        case "no-show":
          noShowMutation.mutate(appointment.appointmentId)
          break
        case "check-in":
          checkInMutation.mutate(appointment.appointmentId)
          break
      }
    }

    const dialogs: Record<string, { title: string; description: string; confirmLabel: string; variant: "danger" | "primary" }> = {
      confirm: {
        title: "Xác nhận lịch hẹn",
        description: `Xác nhận lịch hẹn của pet?`,
        confirmLabel: "Xác nhận",
        variant: "primary",
      },
      complete: {
        title: "Hoàn thành lịch hẹn",
        description: `Đánh dấu lịch hẹn này là đã hoàn thành?`,
        confirmLabel: "Hoàn thành",
        variant: "primary",
      },
      "no-show": {
        title: "Đánh dấu không đến",
        description: `Pet không đến trong lịch hẹn này?`,
        confirmLabel: "Xác nhận",
        variant: "danger",
      },
      "check-in": {
        title: "Check-in lịch hẹn",
        description: `Xác nhận pet đã đến phòng khám?`,
        confirmLabel: "Check-in",
        variant: "primary",
      },
    }

    const d = dialogs[type]
    if (!d) return null

    return (
      <ConfirmDialog
        isOpen={true}
        onClose={() => {
          setActionTarget({ appointment: null, type: null })
          setRejectReason("")
        }}
        onConfirm={handleConfirm}
        title={d.title}
        description={d.description}
        confirmLabel={d.confirmLabel}
        variant={d.variant}
        isLoading={isLoading}
      />
    )
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-po-text">Quản lý lịch hẹn</h2>
          <p className="mt-1 text-sm text-po-text-muted">
            Xem, xác nhận và cập nhật trạng thái lịch hẹn của phòng khám.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setQuickAddType("walk-in")
              setIsQuickAddOpen(true)
            }}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-po-primary-hover"
          >
            <Plus className="size-4" />
            Walk-in
          </button>
          <button
            onClick={() => {
              setQuickAddType("emergency")
              setIsQuickAddOpen(true)
            }}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-po-danger px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-po-danger/90"
          >
            <AlertTriangle className="size-4" />
            Cấp cứu
          </button>
        </div>
      </div>

      {/* Filters */}
      <TabFilter
        tabs={statusFilters}
        activeTab={statusFilter}
        onChange={setStatusFilter}
      />

      {/* Appointment List */}
      <DashboardSection
        title={`${appointments.length} lịch hẹn`}
        subtitle={
          statusFilter !== "all"
            ? statusFilters.find((f) => f.value === statusFilter)?.label
            : "Tất cả lịch hẹn"
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <EmptyState
            icon={CalendarCheck}
            title="Không thể tải lịch hẹn"
            description="Đã xảy ra lỗi. Vui lòng thử lại."
          />
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="Không có lịch hẹn nào"
            description="Chưa có lịch hẹn trong trạng thái này."
          />
        ) : (
          <div className="grid gap-3">
            {appointments.map((appt) => (
              <ClinicAppointmentCard
                key={appt.appointmentId}
                appt={appt}
                onConfirm={() => setActionTarget({ appointment: appt, type: "confirm" })}
                onReject={() => setActionTarget({ appointment: appt, type: "reject" })}
                onComplete={() => setActionTarget({ appointment: appt, type: "complete" })}
                onNoShow={() => setActionTarget({ appointment: appt, type: "no-show" })}
                onCheckIn={() => setActionTarget({ appointment: appt, type: "check-in" })}
              />
            ))}
          </div>
        )}
      </DashboardSection>

      {/* Action dialogs */}
      {getActionDialog()}

      {/* Reject reason dialog */}
      {actionTarget.type === "reject" && actionTarget.appointment && (
        <RejectReasonDialog
          isOpen={actionTarget.type === "reject"}
          reason={rejectReason}
          onReasonChange={setRejectReason}
          onClose={() => {
            setActionTarget({ appointment: null, type: null })
            setRejectReason("")
          }}
          onConfirm={() => {
            if (!rejectReason.trim()) {
              toast.error("Vui lòng nhập lý do từ chối.")
              return
            }
            rejectMutation.mutate({
              id: actionTarget.appointment!.appointmentId,
              reason: rejectReason,
            })
          }}
        />
      )}

      <ClinicQuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        type={quickAddType}
        clinicId={clinicId}
      />
    </div>
  )
}

function ClinicAppointmentCard({
  appt,
  onConfirm,
  onReject,
  onComplete,
  onNoShow,
  onCheckIn,
}: {
  appt: AppointmentListItemResponse
  onConfirm: () => void
  onReject: () => void
  onComplete: () => void
  onNoShow: () => void
  onCheckIn: () => void
}) {
  const status = appt.status.toLowerCase()
  const isPending = status === "pending"
  const isConfirmed = status === "confirmed"
  const canComplete = status === "confirmed" || status === "checked-in"

  return (
    <div className="rounded-2xl border border-po-border bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
            <CalendarCheck className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-po-text">
                Pet ID: {appt.petId.slice(0, 8)}
              </p>
              <StatusBadge
                variant={statusBadgeVariant(appt.status)}
                label={statusLabel(appt.status)}
              />
              {appt.isWalkIn && (
                <span className="rounded-full bg-po-accent-soft px-2.5 py-0.5 text-xs font-medium text-po-accent">
                  Walk-in
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-po-text-muted">{appt.appointmentType}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-po-text-subtle">
              <span className="flex items-center gap-1">
                <CalendarCheck className="size-3" />
                {formatDate(appt.appointmentDate)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isPending && (
            <>
              <button
                onClick={onConfirm}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-po-success px-3 text-xs font-semibold text-white transition hover:bg-po-success/90"
              >
                <Check className="size-3" />
                Xác nhận
              </button>
              <button
                onClick={onReject}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-border px-3 text-xs font-semibold text-po-danger transition hover:border-po-danger hover:bg-po-danger-soft"
              >
                <XCircle className="size-3" />
                Từ chối
              </button>
            </>
          )}
          {isConfirmed && (
            <>
              <button
                onClick={onCheckIn}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-po-primary px-3 text-xs font-semibold text-white transition hover:bg-po-primary-hover"
              >
                <LogIn className="size-3" />
                Check-in
              </button>
              <button
                onClick={onNoShow}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-border px-3 text-xs font-semibold text-po-text-muted transition hover:border-po-danger hover:bg-po-danger-soft hover:text-po-danger"
              >
                <X className="size-3" />
                Không đến
              </button>
            </>
          )}
          {canComplete && (
            <button
              onClick={onComplete}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-po-success px-3 text-xs font-semibold text-white transition hover:bg-po-success/90"
            >
              <CheckCircle2 className="size-3" />
              Hoàn thành
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function RejectReasonDialog({
  isOpen,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  reason: string
  onReasonChange: (v: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4 animate-dialog-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="m-auto w-[min(420px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
        <h3 className="text-lg font-extrabold text-po-text">Lý do từ chối</h3>
        <p className="mt-1 text-sm text-po-text-muted">
          Vui lòng nhập lý do từ chối lịch hẹn này.
        </p>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={3}
          placeholder="VD: Bác sĩ không có mặt, phòng khám đã kín lịch..."
          className="mt-4 w-full resize-none rounded-2xl border border-po-border bg-white px-4 py-3 text-sm text-po-text outline-none transition placeholder:text-po-text-muted/70 focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-po-danger px-5 text-sm font-semibold text-white transition hover:bg-po-danger/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  )
}
